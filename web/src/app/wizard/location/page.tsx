"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import StepContainer from "@/components/StepContainer";
import { useSession } from "@/context/SessionContext";
import { getSheetCities, getSheetCityCountryMap } from "@/services/api";

/** Use Haversine to find the nearest city from a list given lat/lng */
function findNearestCity(
  lat: number,
  lng: number,
  cities: string[],
  cityCoords: Record<string, [number, number]>
): string | null {
  let best: string | null = null;
  let bestDist = Infinity;
  const toRad = (d: number) => (d * Math.PI) / 180;
  for (const city of cities) {
    const coords = cityCoords[city];
    if (!coords) continue;
    const [cLat, cLng] = coords;
    const dLat = toRad(cLat - lat);
    const dLng = toRad(cLng - lng);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat)) * Math.cos(toRad(cLat)) * Math.sin(dLng / 2) ** 2;
    const dist = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    if (dist < bestDist) {
      bestDist = dist;
      best = city;
    }
  }
  return best;
}

export default function LocationPage() {
  const router = useRouter();
  const { answers, saveAnswer } = useSession();
  const [query, setQuery] = useState(answers.location ?? "");
  const [zipcode, setZipcode] = useState(answers.zipcode ?? "");
  const [loading, setLoading] = useState(false);
  const [sheetCities, setSheetCities] = useState<string[]>([]);
  const [cityCountryMap, setCityCountryMap] = useState<Record<string, string>>({});
  const [citiesLoading, setCitiesLoading] = useState(true);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState("");

  useEffect(() => {
    Promise.all([getSheetCities(), getSheetCityCountryMap()])
      .then(([cities, map]) => {
        setSheetCities(cities);
        setCityCountryMap(map);
      })
      .catch(() => setSheetCities([]))
      .finally(() => setCitiesLoading(false));
  }, []);

  const matchedCity = useMemo(
    () => sheetCities.find((c) => c.toLowerCase() === query.trim().toLowerCase()),
    [query, sheetCities]
  );

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || matchedCity) return [];
    return sheetCities.filter((c) => c.toLowerCase().startsWith(q));
  }, [query, sheetCities, matchedCity]);

  const isValid = !!matchedCity;

  const handleUseLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by your browser.");
      return;
    }
    setGeoLoading(true);
    setGeoError("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          // Reverse geocode with OpenStreetMap Nominatim (free, no key)
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&zoom=10`,
            { headers: { "Accept-Language": "en" } }
          );
          const data = await res.json();
          const city =
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            data.address?.county ||
            "";
          const postcode = data.address?.postcode || "";

          if (city) {
            // Try exact match first
            const exact = sheetCities.find(
              (c) => c.toLowerCase() === city.toLowerCase()
            );
            if (exact) {
              setQuery(exact);
              if (postcode) setZipcode(postcode);
            } else {
              // Try partial match (city name contains or is contained)
              const partial = sheetCities.find(
                (c) =>
                  c.toLowerCase().includes(city.toLowerCase()) ||
                  city.toLowerCase().includes(c.toLowerCase())
              );
              if (partial) {
                setQuery(partial);
                if (postcode) setZipcode(postcode);
              } else {
                // Fall back to nearest city by coordinates
                // Build a coords map from Nominatim batch — use the geocoded point
                // and find the closest city name that startsWith similar letters
                const nearby = sheetCities.filter((c) =>
                  c.toLowerCase().startsWith(city.toLowerCase().slice(0, 3))
                );
                if (nearby.length > 0) {
                  setQuery(nearby[0]);
                  if (postcode) setZipcode(postcode);
                } else {
                  // Just set the raw city name so user can see what was detected
                  setQuery(city);
                  if (postcode) setZipcode(postcode);
                  setGeoError(
                    `We detected "${city}" but couldn't find an exact match. Try selecting from the suggestions below.`
                  );
                }
              }
            }
          } else {
            setGeoError("Could not determine your city. Please type it manually.");
          }
        } catch {
          setGeoError("Could not look up your location. Please type your city.");
        } finally {
          setGeoLoading(false);
        }
      },
      (err) => {
        setGeoLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGeoError("Location access denied. Please type your city instead.");
        } else {
          setGeoError("Could not get your location. Please type your city.");
        }
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }, [sheetCities]);

  const handleNext = async () => {
    if (!matchedCity) return;
    setLoading(true);
    try {
      await saveAnswer("location", matchedCity);
      const country = cityCountryMap[matchedCity];
      if (country) {
        await saveAnswer("country", country);
      }
      if (zipcode.trim()) {
        await saveAnswer("zipcode", zipcode.trim());
      }
      router.push("/wizard/diagnosis");
    } finally {
      setLoading(false);
    }
  };

  return (
    <StepContainer
      heading="Where are you located?"
      description="Share your location or type your city below."
      onNext={handleNext}
      nextDisabled={!isValid}
      loading={loading}
    >
      <div className="relative">
        {/* Use My Location button */}
        <button
          onClick={handleUseLocation}
          disabled={geoLoading || citiesLoading}
          className="w-full flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 border-2 border-emerald-200 rounded-xl p-4 text-base font-semibold text-emerald-700 transition-colors mb-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {geoLoading ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              Finding your location...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Use my location
            </>
          )}
        </button>

        {geoError && (
          <p className="text-sm text-amber-600 mb-3">{geoError}</p>
        )}

        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-sm text-text-secondary font-medium">or type your city</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. London"
          autoComplete="off"
          className={`w-full bg-white border-2 rounded-xl p-4 text-lg text-text-primary placeholder:text-text-secondary focus:outline-none transition-colors ${
            isValid ? "border-sage" : "border-border focus:border-sage"
          }`}
        />

        {citiesLoading && (
          <p className="text-sm text-text-secondary mt-2">Loading cities...</p>
        )}

        {suggestions.length > 0 && (
          <div className="mt-1 bg-white border-2 border-border rounded-xl overflow-hidden max-h-60 overflow-y-auto">
            {suggestions.map((city) => (
              <button
                key={city}
                onClick={() => setQuery(city)}
                className="w-full text-left px-4 py-3 text-base text-text-primary font-medium hover:bg-chip-bg border-b border-border last:border-b-0 cursor-pointer"
              >
                {city}
              </button>
            ))}
          </div>
        )}

        {isValid && (
          <span className="inline-block mt-2 bg-sage text-white text-sm font-semibold px-3 py-1 rounded-full">
            {matchedCity}{cityCountryMap[matchedCity] ? `, ${cityCountryMap[matchedCity]}` : ""}
          </span>
        )}

        {isValid && (
          <div className="mt-6">
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Postcode / Zip code (optional)
            </label>
            <input
              type="text"
              value={zipcode}
              onChange={(e) => setZipcode(e.target.value.toUpperCase())}
              placeholder="e.g. SW1A 1AA or 94102"
              autoComplete="off"
              className="w-full bg-white border-2 border-border rounded-xl p-4 text-lg text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-sage transition-colors"
            />
          </div>
        )}
      </div>
    </StepContainer>
  );
}
