"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import "leaflet/dist/leaflet.css";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://iutm2kyhqq.us-east-1.awsapprunner.com";

const ORANGE = "#F47B4B";
const L1     = "#1C1C1E";
const L2     = "#6C6C70";
const L3     = "#AEAEB2";
const SEP    = "#E5E5EA";
const FILL   = "#F2F2F7";

const CATS: Record<string, { label: string; accent: string }> = {
  "Mental Health":           { label: "Mental Health",     accent: "#C0392B" },
  "Peer Support":            { label: "Peer Support",      accent: "#1A7A6E" },
  "Financial Aid":           { label: "Financial Support", accent: "#9A7000" },
  "Practical Help":          { label: "Practical Help",    accent: "#C85E20" },
  "Legal & Employment":      { label: "Legal & Work",      accent: "#4A3FAA" },
  "Information & Education": { label: "Information",       accent: "#0066BB" },
  "Carer Support":           { label: "Carer Support",     accent: "#1A7A6E" },
  "Wellness & Nutrition":    { label: "Wellness",          accent: "#2E7D32" },
  "End-of-Life Care":        { label: "End of Life",       accent: "#5D4037" },
};

interface MapResource {
  id: string;
  name: string;
  description: string;
  lat: number;
  lng: number;
  url: string;
  contact?: string;
  phone?: string;
  helpTypes: string[];
  cities: string[];
  entireCountry: boolean;
}

interface Props {
  profile: { city: string; country: string; zipcode: string; diagnosis: string };
}

export default function MapTab({ profile }: Props) {
  const containerRef  = useRef<HTMLDivElement>(null);
  const mapRef        = useRef<unknown>(null);
  const markersRef    = useRef<unknown[]>([]);
  const userMarkerRef = useRef<unknown>(null);

  const [resources, setResources]   = useState<MapResource[]>([]);
  const [selected,  setSelected]    = useState<MapResource | null>(null);
  const [loading,   setLoading]     = useState(true);
  const [userPos,   setUserPos]     = useState<[number, number] | null>(null);

  // Fetch resources with lat/lng from backend
  useEffect(() => {
    fetch(`${API_URL}/resources`)
      .then(r => r.json())
      .then(data => {
        const all: MapResource[] = (data.resources || [])
          .filter((r: Record<string, unknown>) => r.lat && r.lng)
          .map((r: Record<string, unknown>) => ({
            id:           r.resourceId as string,
            name:         r.name as string,
            description:  (r.description as string) || "",
            lat:          parseFloat(r.lat as string),
            lng:          parseFloat(r.lng as string),
            url:          (r.websiteUrl as string) || "",
            contact:      (r.contact as string) || "",
            helpTypes:    (r.helpTypes as string[]) || [],
            cities:       (r.cities as string[]) || [],
            entireCountry: !!(r.entireCountry),
          }));

        // Pin city-specific resources that match user's city
        const matched = all.filter(r => {
          if (r.entireCountry) return false;
          return r.cities.some(c => c.toLowerCase() === profile.city.toLowerCase());
        });

        setResources(matched.length > 0 ? matched : all.slice(0, 50));
      })
      .catch(() => setResources([]))
      .finally(() => setLoading(false));
  }, [profile.city]);

  // Request user geolocation
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      pos => setUserPos([pos.coords.latitude, pos.coords.longitude]),
      () => {},
      { enableHighAccuracy: false, timeout: 8000 }
    );
  }, []);

  const pinColor = useCallback((r: MapResource) => {
    const cat = r.helpTypes[0];
    return cat ? (CATS[cat]?.accent ?? ORANGE) : ORANGE;
  }, []);

  // Init / update map when resources or userPos change
  useEffect(() => {
    if (!containerRef.current || loading) return;

    import("leaflet").then(({ default: L }) => {
      // Fix default icon paths broken by webpack
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      // Determine center
      const defaultCenter: [number, number] = userPos
        ?? (resources[0] ? [resources[0].lat, resources[0].lng] : [51.5074, -0.1276]);

      if (!mapRef.current) {
        const map = L.map(containerRef.current!, {
          center: defaultCenter,
          zoom:   11,
          zoomControl: true,
          attributionControl: false,
        });
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
        }).addTo(map);
        mapRef.current = map;
      }

      const map = mapRef.current as ReturnType<typeof L.map>;

      // Remove old markers
      (markersRef.current as ReturnType<typeof L.circleMarker>[]).forEach(m => m.remove());
      markersRef.current = [];

      // Add resource pins
      resources.forEach(r => {
        const marker = L.circleMarker([r.lat, r.lng], {
          radius:      10,
          fillColor:   pinColor(r),
          fillOpacity: 0.9,
          color:       "white",
          weight:      2.5,
        });
        marker.on("click", () => setSelected(r));
        marker.addTo(map);
        markersRef.current.push(marker);
      });

      // User location dot
      if (userMarkerRef.current) {
        (userMarkerRef.current as ReturnType<typeof L.circleMarker>).remove();
        userMarkerRef.current = null;
      }
      if (userPos) {
        const userDot = L.circleMarker(userPos, {
          radius:      8,
          fillColor:   "#1D6AE5",
          fillOpacity: 1,
          color:       "white",
          weight:      3,
        });
        userDot.addTo(map);
        userMarkerRef.current = userDot;
        map.setView(userPos, 11);
      }
    });

    return () => {
      // Don't destroy map on re-render — only on unmount
    };
  }, [resources, userPos, loading, pinColor]);

  // Destroy map on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        (mapRef.current as { remove: () => void }).remove();
        mapRef.current = null;
      }
    };
  }, []);

  const openDirections = (r: MapResource) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${r.lat},${r.lng}`, "_blank");
  };

  const extractPhone = (contact?: string) => {
    if (!contact) return null;
    const m = contact.match(/([\+]?[\d][\d\s\-\(\)]{6,}[\d])/);
    return m ? m[1].trim() : null;
  };

  return (
    <div className="flex-1 flex flex-col" style={{ position: "relative", minHeight: 0 }}>
      {/* Map container */}
      <div ref={containerRef} style={{ flex: 1, minHeight: 0, width: "100%" }} />

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3" style={{ background: "#F9F2E7" }}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: ORANGE }} />
          <p className="text-sm font-medium" style={{ color: L2 }}>Loading map...</p>
        </div>
      )}

      {/* Resource count badge */}
      {!loading && (
        <div
          className="absolute top-3 left-3 right-3 rounded-xl text-center py-2.5 px-4 text-sm font-semibold"
          style={{ background: "rgba(255,255,255,0.96)", color: L1, boxShadow: "0 2px 10px rgba(0,0,0,0.12)", zIndex: 800 }}
        >
          {resources.length} {resources.length === 1 ? "resource" : "resources"} near {profile.city}
        </div>
      )}

      {/* Selected resource card */}
      {selected && (
        <div
          className="absolute left-3 right-3 rounded-2xl p-4"
          style={{
            bottom: 16,
            background: "white",
            boxShadow: "0 -4px 20px rgba(0,0,0,0.14)",
            zIndex: 900,
          }}
        >
          {/* Close */}
          <button
            onClick={() => setSelected(null)}
            className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full cursor-pointer"
            style={{ background: FILL, color: L2, fontSize: 18, lineHeight: 1 }}
          >
            ×
          </button>

          <p className="text-base font-bold pr-8 mb-1" style={{ color: L1 }}>{selected.name}</p>
          <p className="text-sm mb-2 line-clamp-2" style={{ color: L2 }}>{selected.description}</p>

          {/* Help type chips */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {selected.helpTypes.slice(0, 3).map(h => {
              const accent = CATS[h]?.accent ?? ORANGE;
              return (
                <span key={h} className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ color: accent, background: accent + "18" }}>
                  {CATS[h]?.label ?? h}
                </span>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => openDirections(selected)}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold text-white cursor-pointer"
              style={{ background: ORANGE }}
            >
              🧭 Directions
            </button>
            {selected.url && (
              <a
                href={selected.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold cursor-pointer"
                style={{ background: FILL, color: L1 }}
              >
                🌐 Website
              </a>
            )}
            {(() => {
              const phone = extractPhone(selected.contact) || selected.phone;
              if (!phone) return null;
              return (
                <a
                  href={`tel:${phone.replace(/\s/g, "")}`}
                  className="flex items-center justify-center gap-1 rounded-xl py-2.5 px-3 text-sm font-semibold"
                  style={{ background: "#ecfdf5", color: "#047857", border: "1px solid #a7f3d0" }}
                >
                  📞
                </a>
              );
            })()}
          </div>
        </div>
      )}

      {/* No resources */}
      {!loading && resources.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center" style={{ background: "#F9F2E7" }}>
          <p className="text-xl font-bold" style={{ color: L1 }}>No mapped resources near {profile.city}</p>
          <p className="text-sm" style={{ color: L2 }}>Resources are being added regularly. Check back soon.</p>
        </div>
      )}
    </div>
  );
}
