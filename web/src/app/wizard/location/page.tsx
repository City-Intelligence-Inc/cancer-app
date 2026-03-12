"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import StepContainer from "@/components/StepContainer";
import { useSession } from "@/context/SessionContext";
import { getSheetCities, getSheetCityCountryMap } from "@/services/api";

export default function LocationPage() {
  const router = useRouter();
  const { answers, saveAnswer } = useSession();
  const [query, setQuery] = useState(answers.location ?? "");
  const [zipcode, setZipcode] = useState(answers.zipcode ?? "");
  const [loading, setLoading] = useState(false);
  const [sheetCities, setSheetCities] = useState<string[]>([]);
  const [cityCountryMap, setCityCountryMap] = useState<Record<string, string>>({});
  const [citiesLoading, setCitiesLoading] = useState(true);

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
      description="Type your city and select it from the list below."
      onNext={handleNext}
      nextDisabled={!isValid}
      loading={loading}
    >
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. London"
          autoFocus
          autoComplete="off"
          className={`w-full bg-white border-2 rounded-xl p-4 text-lg text-text-primary placeholder:text-text-secondary focus:outline-none transition-colors ${
            isValid ? "border-sage" : "border-border focus:border-sage"
          }`}
        />

        {citiesLoading && (
          <p className="text-sm text-text-secondary mt-2">Loading cities...</p>
        )}

        {suggestions.length > 0 && (
          <div className="mt-1 bg-white border-2 border-border rounded-xl overflow-hidden">
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
              Postcode (optional)
            </label>
            <input
              type="text"
              value={zipcode}
              onChange={(e) => setZipcode(e.target.value.toUpperCase())}
              placeholder="e.g. SW1A 1AA"
              autoComplete="off"
              className="w-full bg-white border-2 border-border rounded-xl p-4 text-lg text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-sage transition-colors"
            />
          </div>
        )}
      </div>
    </StepContainer>
  );
}
