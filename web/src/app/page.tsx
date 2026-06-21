"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { getAllResources, getSheetCities, getSheetCityCountryMap } from "@/services/api";
import { Resource } from "@/data/resources";

const MapTab = dynamic(() => import("@/components/MapTab"), { ssr: false });

// ─── Design tokens ────────────────────────────────────────────────────
const ORANGE = "#F47B4B";
const CREAM  = "#F9F2E7";
const L1     = "#1C1C1E";
const L2     = "#6C6C70";
const L3     = "#AEAEB2";
const SEP    = "#E5E5EA";
const FILL   = "#F2F2F7";

const CATS: Record<string, { label: string; accent: string }> = {
  "Mental Health":           { label: "Mental Health",      accent: "#C0392B" },
  "Peer Support":            { label: "Peer Support",       accent: "#1A7A6E" },
  "Financial Aid":           { label: "Financial Support",  accent: "#9A7000" },
  "Practical Help":          { label: "Practical Help",     accent: "#C85E20" },
  "Legal & Employment":      { label: "Legal & Work",       accent: "#4A3FAA" },
  "Information & Education": { label: "Information",        accent: "#0066BB" },
  "Carer Support":           { label: "Carer Support",      accent: "#1A7A6E" },
  "Wellness & Nutrition":    { label: "Wellness",           accent: "#2E7D32" },
  "End-of-Life Care":        { label: "End of Life",        accent: "#5D4037" },
};
const CAT_ORDER = [
  "Mental Health", "Peer Support", "Financial Aid", "Practical Help",
  "Information & Education", "Carer Support", "Wellness & Nutrition",
  "Legal & Employment", "End-of-Life Care",
];

const ALL_DIAGNOSES = [
  "Bladder Cancer", "Blood / Leukaemia", "Bowel / Colorectal Cancer",
  "Brain Cancer", "Breast Cancer", "Gynaecological Cancer",
  "Head & Neck Cancer", "Kidney Cancer", "Liver Cancer", "Lung Cancer",
  "Lymphoma", "Mesothelioma", "Myeloma", "Ovarian Cancer",
  "Pancreatic Cancer", "Prostate Cancer", "Sarcoma", "Skin Cancer",
  "Thyroid Cancer", "Other / Unsure",
];

interface UserProfile { city: string; country: string; zipcode: string; diagnosis: string }
type Tab = "home" | "explore" | "map" | "profile";

// ─── Onboarding ───────────────────────────────────────────────────────

function Onboarding({ onDone }: { onDone: (p: UserProfile) => void }) {
  const [step, setStep] = useState<"welcome" | "city" | "diagnosis" | "postcode">("welcome");
  const [cityQ, setCityQ] = useState("");
  const [cities, setCities] = useState<string[]>([]);
  const [city, setCity] = useState<string | null>(null);
  const [citiesLoading, setCitiesLoading] = useState(true);
  const [cityCountryMap, setCityCountryMap] = useState<Record<string, string>>({});
  const [diagQ, setDiagQ] = useState("");
  const [diag, setDiag] = useState<string | null>(null);
  const [zip, setZip] = useState("");
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState("");

  useEffect(() => {
    Promise.all([getSheetCities(), getSheetCityCountryMap()])
      .then(([c, map]) => { setCities(c); setCityCountryMap(map); })
      .catch(() => {})
      .finally(() => setCitiesLoading(false));
  }, []);

  const citySugg = useMemo(() => {
    const q = cityQ.trim().toLowerCase();
    if (!q || city) return [];
    return cities.filter(c => c.toLowerCase().startsWith(q)).slice(0, 8);
  }, [cityQ, cities, city]);

  const diagOptions = useMemo(() => {
    const q = diagQ.trim().toLowerCase();
    if (!q) return ALL_DIAGNOSES;
    return ALL_DIAGNOSES.filter(d => d.toLowerCase().includes(q));
  }, [diagQ]);

  const handleUseLocation = useCallback(async () => {
    if (!navigator.geolocation) { setGeoError("Geolocation not supported."); return; }
    setGeoLoading(true); setGeoError("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json&zoom=10`,
            { headers: { "Accept-Language": "en" } }
          );
          const data = await res.json();
          const detected = data.address?.city || data.address?.town || data.address?.village || data.address?.county || "";
          const postcode = data.address?.postcode || "";
          if (detected) {
            const exact   = cities.find(c => c.toLowerCase() === detected.toLowerCase());
            const partial = exact || cities.find(c => c.toLowerCase().includes(detected.toLowerCase()) || detected.toLowerCase().includes(c.toLowerCase()));
            if (partial) {
              setCity(partial); setCityQ(partial); if (postcode) setZip(postcode); setStep("diagnosis");
            } else {
              setCityQ(detected); if (postcode) setZip(postcode);
              setGeoError(`Found "${detected}" — pick the closest match below.`);
            }
          } else { setGeoError("Couldn't detect your city."); }
        } catch { setGeoError("Location lookup failed."); }
        finally { setGeoLoading(false); }
      },
      () => { setGeoLoading(false); setGeoError("Location access denied."); },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }, [cities]);

  // ── Welcome screen ──
  if (step === "welcome") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: CREAM }}>
        <div className="w-full flex flex-col" style={{ maxWidth: 480, padding: "0 24px" }}>
          {/* Hero block */}
          <div className="flex flex-col items-center pt-12 pb-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/canopy-logo.png" alt="Canopy" width={88} height={88} className="mb-5" style={{ objectFit: "contain" }} />
            <h1 className="text-4xl font-extrabold text-center mb-3 leading-tight" style={{ color: L1 }}>
              Find support<br/>that fits you
            </h1>
            <p className="text-base text-center leading-relaxed" style={{ color: L2, maxWidth: 300 }}>
              Matched to your location, diagnosis, and needs — in under 2 minutes.
            </p>
          </div>

          {/* Feature rows */}
          <div className="py-2">
            {[
              {
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={ORANGE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                    <circle cx="12" cy="9" r="2.5"/>
                  </svg>
                ),
                title: "Local to you",
                desc: "Resources near your city and postcode",
              },
              {
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={ORANGE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L4 5v6c0 5.25 3.5 10.15 8 11.5C16.5 21.15 20 16.25 20 11V5l-8-3z"/>
                    <polyline points="9 12 11 14 15 10"/>
                  </svg>
                ),
                title: "Private & anonymous",
                desc: "No account needed, data auto-deletes",
              },
              {
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={ORANGE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                ),
                title: "Personalised matches",
                desc: "Tailored to your diagnosis and stage",
              },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  display: "flex", alignItems: "center", gap: 16, paddingTop: 16, paddingBottom: 16,
                  borderBottom: i < 2 ? `1px solid ${SEP}` : "none",
                }}
              >
                <div style={{
                  flexShrink: 0, width: 48, height: 48,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  borderRadius: 14, background: "#FFF0E8",
                }}>
                  {item.icon}
                </div>
                <div>
                  <p style={{ fontSize: 16, fontWeight: 700, color: L1, marginBottom: 2 }}>{item.title}</p>
                  <p style={{ fontSize: 14, color: L2, lineHeight: 1.4 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Stats row */}
          <div style={{ display: "flex", justifyContent: "center", gap: 32, paddingTop: 20, paddingBottom: 20 }}>
            {[["1,000+", "Resources"], ["188", "Countries"], ["700+", "Cities"]].map(([num, label]) => (
              <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <span style={{ fontSize: 22, fontWeight: 800, color: ORANGE }}>{num}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: L2, marginTop: 2 }}>{label}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div style={{ paddingBottom: 32, paddingTop: 8 }}>
            <button
              onClick={() => setStep("city")}
              style={{ width: "100%", borderRadius: 18, paddingTop: 16, paddingBottom: 16, fontSize: 18, fontWeight: 700, color: "white", background: ORANGE, boxShadow: `0 4px 16px ${ORANGE}4D`, border: "none", cursor: "pointer" }}
            >
              Get started
            </button>
            <p style={{ textAlign: "center", fontSize: 13, color: L3, marginTop: 12 }}>Free to use, always</p>
          </div>
        </div>
      </div>
    );
  }

  // ── City step ──
  if (step === "city") {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: CREAM }}>
        <div className="max-w-md w-full">
          <button onClick={() => setStep("welcome")} className="mb-4 text-sm font-medium cursor-pointer" style={{ color: L2 }}>← Back</button>
          <div className="flex gap-1.5 mb-4">
            <div className="w-6 h-1.5 rounded-full" style={{ background: ORANGE }} />
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: SEP }} />
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: SEP }} />
          </div>
          <h1 className="text-3xl font-extrabold mb-2" style={{ color: L1 }}>Where are you<br/>located?</h1>
          <p className="text-base mb-6" style={{ color: L2 }}>We&apos;ll find support resources available near you.</p>

          <button
            onClick={handleUseLocation}
            disabled={geoLoading}
            className="w-full flex items-center justify-center gap-2 rounded-2xl py-4 text-base font-bold text-white mb-3 cursor-pointer disabled:opacity-50"
            style={{ background: ORANGE, boxShadow: `0 4px 12px ${ORANGE}4D` }}
          >
            {geoLoading ? "Finding your location..." : "📍 Use my location"}
          </button>

          {geoError && <p className="text-sm text-amber-600 mb-3">{geoError}</p>}

          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 h-px" style={{ background: SEP }} />
            <span className="text-sm font-medium" style={{ color: L3 }}>or search</span>
            <div className="flex-1 h-px" style={{ background: SEP }} />
          </div>

          <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-3 shadow-sm">
            <span style={{ color: L3 }}>🔍</span>
            <input
              type="text" value={cityQ} onChange={e => setCityQ(e.target.value)}
              placeholder="Search for your city..."
              className="flex-1 text-base outline-none bg-transparent" style={{ color: L1 }}
              autoComplete="off"
            />
            {citiesLoading && <div className="animate-spin rounded-full h-4 w-4 border-b-2" style={{ borderColor: ORANGE }} />}
          </div>

          {citySugg.length > 0 && (
            <div className="mt-2 bg-white rounded-xl overflow-hidden shadow-sm border" style={{ borderColor: SEP }}>
              {citySugg.map((c, i) => (
                <button
                  key={c}
                  onClick={() => { setCity(c); setCityQ(c); setStep("diagnosis"); }}
                  className="w-full text-left px-4 py-3 text-base font-medium hover:bg-gray-50 cursor-pointer"
                  style={{ color: L1, borderBottom: i < citySugg.length - 1 ? `1px solid ${SEP}` : "none" }}
                >
                  📍 {c}{cityCountryMap[c] ? `, ${cityCountryMap[c]}` : ""}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Diagnosis step ──
  if (step === "diagnosis") {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: CREAM }}>
        <div className="max-w-md w-full">
          <button onClick={() => { setStep("city"); setCity(null); setCityQ(""); }} className="mb-4 text-sm font-medium cursor-pointer" style={{ color: L2 }}>← Back</button>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-semibold" style={{ color: ORANGE }}>📍 {city}</span>
          </div>
          <div className="flex gap-1.5 mb-4">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: ORANGE }} />
            <div className="w-6 h-1.5 rounded-full" style={{ background: ORANGE }} />
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: SEP }} />
          </div>
          <h1 className="text-3xl font-extrabold mb-2" style={{ color: L1 }}>What type of<br/>cancer?</h1>
          <p className="text-base mb-6" style={{ color: L2 }}>This helps us show the most relevant resources.</p>

          <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-3 shadow-sm mb-4">
            <span style={{ color: L3 }}>🔍</span>
            <input
              type="text" value={diagQ} onChange={e => setDiagQ(e.target.value)}
              placeholder="Search or pick below..."
              className="flex-1 text-base outline-none bg-transparent" style={{ color: L1 }}
              autoComplete="off"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {diagOptions.map(d => (
              <button
                key={d}
                onClick={() => { setDiag(d); setStep("postcode"); }}
                className="px-4 py-2.5 rounded-full text-sm font-medium bg-white shadow-sm hover:shadow cursor-pointer"
                style={{ color: d === "Other / Unsure" ? L2 : L1 }}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Postcode step ──
  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: CREAM }}>
      <div className="max-w-md w-full">
        <button onClick={() => { setStep("diagnosis"); setDiag(null); setDiagQ(""); }} className="mb-4 text-sm font-medium cursor-pointer" style={{ color: L2 }}>← Back</button>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-semibold" style={{ color: ORANGE }}>📍 {city} · {diag}</span>
        </div>
        <div className="flex gap-1.5 mb-4">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: ORANGE }} />
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: ORANGE }} />
          <div className="w-6 h-1.5 rounded-full" style={{ background: ORANGE }} />
        </div>
        <h1 className="text-3xl font-extrabold mb-2" style={{ color: L1 }}>Postcode</h1>
        <p className="text-base mb-6" style={{ color: L2 }}>Optional — helps us find resources even closer to you.</p>

        <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-3 shadow-sm mb-6">
          <span style={{ color: L3 }}>📮</span>
          <input
            type="text" value={zip} onChange={e => setZip(e.target.value.toUpperCase())}
            placeholder="e.g. SW1A 1AA or 94102"
            className="flex-1 text-base outline-none bg-transparent" style={{ color: L1 }}
            autoComplete="off"
          />
        </div>

        <button
          onClick={() => onDone({ city: city!, country: cityCountryMap[city!] ?? "", zipcode: zip.trim(), diagnosis: diag! })}
          className="w-full rounded-2xl py-4 text-base font-bold text-white cursor-pointer"
          style={{ background: ORANGE, boxShadow: `0 4px 12px ${ORANGE}4D` }}
        >
          Find support
        </button>
        <button
          onClick={() => onDone({ city: city!, country: cityCountryMap[city!] ?? "", zipcode: "", diagnosis: diag! })}
          className="w-full mt-3 text-center text-sm font-semibold cursor-pointer"
          style={{ color: ORANGE }}
        >
          Skip postcode
        </button>
      </div>
    </div>
  );
}

// ─── Resource detail modal ────────────────────────────────────────────

function extractPhone(contact?: string): string | null {
  if (!contact) return null;
  const m = contact.match(/([\+]?[\d][\d\s\-\(\)]{6,}[\d])/);
  return m ? m[1].trim() : null;
}

function ResourceDetail({ resource, onClose }: { resource: Resource; onClose: () => void }) {
  const cat    = resource.helpTypes[0] ?? null;
  const accent = cat ? (CATS[cat]?.accent ?? ORANGE) : ORANGE;
  const phone  = extractPhone(resource.contact) || resource.phone;
  const location = resource.entireCountry
    ? (resource.countries.length === 1 ? `${resource.countries[0]}-wide` : "Nationwide")
    : resource.cities.slice(0, 4).join(", ");

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 pb-1"><div className="w-9 h-1 rounded-full" style={{ background: SEP }} /></div>
        <div className="h-1 mx-5 rounded-full mb-4" style={{ background: accent }} />
        <div className="px-5 pb-8">
          <h2 className="text-xl font-bold mb-3" style={{ color: L1 }}>{resource.name}</h2>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {resource.helpTypes.map(h => (
              <span key={h} className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ color: CATS[h]?.accent ?? accent, background: (CATS[h]?.accent ?? accent) + "18" }}>
                {CATS[h]?.label ?? h}
              </span>
            ))}
          </div>
          <p className="text-sm leading-relaxed mb-3" style={{ color: L2 }}>{resource.description}</p>
          <p className="text-xs mb-4" style={{ color: L3 }}>📍 {location}</p>

          <div className="border-t pt-4 flex flex-wrap gap-3" style={{ borderColor: SEP }}>
            {resource.url && (
              <a href={resource.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 flex-1 min-w-[120px] py-3 rounded-xl text-sm font-semibold"
                style={{ background: accent + "18", color: accent }}>
                🌐 Website
              </a>
            )}
            {phone && (
              <a href={`tel:${phone.replace(/\s/g, "")}`}
                className="flex items-center justify-center gap-2 flex-1 min-w-[120px] py-3 rounded-xl text-sm font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                📞 Call
              </a>
            )}
            <button
              onClick={() => {
                const q = encodeURIComponent(resource.name + " " + (resource.cities[0] ?? ""));
                window.open(`https://maps.google.com/?q=${q}`, "_blank");
              }}
              className="flex items-center justify-center gap-2 flex-1 min-w-[120px] py-3 rounded-xl text-sm font-semibold cursor-pointer"
              style={{ background: FILL, color: L1 }}>
              🗺️ Directions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Feed card ────────────────────────────────────────────────────────

function FeedCard({ resource, accent, onClick }: { resource: Resource; accent: string; onClick: () => void }) {
  return (
    <div
      className="bg-white rounded-2xl overflow-hidden shadow-sm cursor-pointer hover:shadow-md transition-shadow flex-shrink-0"
      style={{ minWidth: 280, maxWidth: 320 }}
      onClick={onClick}
    >
      <div className="h-1" style={{ background: accent }} />
      <div className="p-4">
        <h3 className="text-base font-bold mb-1 line-clamp-2" style={{ color: L1 }}>{resource.name}</h3>
        <p className="text-xs leading-relaxed mb-3 line-clamp-3" style={{ color: L2 }}>{resource.description}</p>
        <div className="flex justify-between items-center">
          <span className="text-xs" style={{ color: L3 }}>
            {resource.entireCountry ? (resource.countries.length === 1 ? `${resource.countries[0]}-wide` : "Nationwide") : resource.cities.slice(0, 2).join(", ")}
          </span>
          <span className="text-xs font-bold" style={{ color: accent }}>View ›</span>
        </div>
      </div>
    </div>
  );
}

// ─── Search result card ───────────────────────────────────────────────

function SearchCard({ resource, onClick }: { resource: Resource; onClick: () => void }) {
  const cat    = resource.helpTypes[0] ?? null;
  const accent = cat ? (CATS[cat]?.accent ?? ORANGE) : ORANGE;

  return (
    <div
      className="bg-white rounded-xl p-4 mb-2.5 shadow-sm cursor-pointer hover:shadow-md transition-shadow border-l-[3px]"
      style={{ borderLeftColor: accent }}
      onClick={onClick}
    >
      <div className="flex justify-between items-start gap-2 mb-1">
        <h3 className="text-base font-bold line-clamp-1 flex-1" style={{ color: L1 }}>{resource.name}</h3>
        {cat && <span className="text-xs font-semibold mt-0.5" style={{ color: accent }}>{CATS[cat]?.label ?? cat}</span>}
      </div>
      <p className="text-sm leading-relaxed mb-2 line-clamp-2" style={{ color: L2 }}>{resource.description}</p>
      <div className="flex justify-between">
        <span className="text-xs" style={{ color: L3 }}>
          {resource.entireCountry ? "Nationwide" : resource.cities.slice(0, 2).join(", ")}
        </span>
        <span className="text-xs font-semibold" style={{ color: accent }}>View</span>
      </div>
    </div>
  );
}

// ─── Home tab ─────────────────────────────────────────────────────────

function HomeTab({ profile, onRefine }: { profile: UserProfile; onRefine: () => void }) {
  const [resources, setResources] = useState<Resource[] | null>(null);
  const [search, setSearch]       = useState("");
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [selected, setSelected]   = useState<Resource | null>(null);

  useEffect(() => {
    getAllResources().then(setResources).catch(() => setResources([]));
  }, []);

  const filtered = useMemo(() => {
    if (!resources) return [];
    return resources.filter(r => {
      const userZip    = profile.zipcode.replace(/\s/g, "").toLowerCase();
      const cityMatch  = r.cities.some(c => c.toLowerCase() === profile.city.toLowerCase());
      const countryMatch = !!profile.country && r.countries.some(rc => rc.toLowerCase() === profile.country.toLowerCase());
      const zipcodeMatch = userZip.length >= 3 && (r.zipcodes ?? []).some(z => z.replace(/\s/g, "").toLowerCase().startsWith(userZip.slice(0, 4)));
      const locOk  = cityMatch || zipcodeMatch || (r.entireCountry && countryMatch);
      const diagOk = r.diagnoses.length === 0 || r.diagnoses.some(d => d.toLowerCase() === profile.diagnosis.toLowerCase());
      return locOk && diagOk;
    });
  }, [resources, profile]);

  const displayed = useMemo(() => {
    const q = search.trim().toLowerCase();
    let base = q
      ? filtered.filter(r => r.name.toLowerCase().includes(q) || r.description.toLowerCase().includes(q) || r.helpTypes.some(h => h.toLowerCase().includes(q)))
      : filtered;
    if (activeCat) base = base.filter(r => r.helpTypes.includes(activeCat));
    return base;
  }, [filtered, search, activeCat]);

  const sections = useMemo(() => {
    if (search.trim() || activeCat) return [];
    const result: Array<{ key: string; label: string; accent?: string; resources: Resource[]; isFeatured?: boolean }> = [];
    const nearby   = filtered.filter(r => !r.entireCountry && r.cities.some(c => c.toLowerCase() === profile.city.toLowerCase()));
    const featured = nearby.length >= 2 ? nearby.slice(0, 8) : filtered.slice(0, 8);
    if (featured.length > 0) result.push({ key: "__near", label: `Near you in ${profile.city}`, resources: featured, isFeatured: true });
    for (const cat of CAT_ORDER) {
      const catRes = filtered.filter(r => r.helpTypes.includes(cat));
      if (catRes.length > 0) result.push({ key: cat, label: CATS[cat].label, accent: CATS[cat].accent, resources: catRes });
    }
    return result;
  }, [filtered, search, activeCat, profile.city]);

  const availCats = useMemo(() => {
    const s = new Set<string>();
    filtered.forEach(r => r.helpTypes.forEach(h => s.add(h)));
    return CAT_ORDER.filter(c => s.has(c));
  }, [filtered]);

  const isFiltered = !!(search.trim() || activeCat);

  if (!resources) {
    return (
      <div className="flex-1 flex items-center justify-center flex-col gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: ORANGE }} />
        <p className="text-sm" style={{ color: L2 }}>Finding support in {profile.city}...</p>
      </div>
    );
  }

  // Empty state — no resources for this city/diagnosis
  if (resources.length > 0 && filtered.length === 0 && !search.trim() && !activeCat) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-4 pb-20">
        <p className="text-xl font-bold" style={{ color: L1 }}>Coming soon to {profile.city}</p>
        <p className="text-sm leading-relaxed" style={{ color: L2 }}>We&apos;re expanding quickly. Check back soon.</p>
        <button
          onClick={() => { setSearch(""); setActiveCat(null); }}
          className="mt-2 px-6 py-3 rounded-xl text-sm font-bold text-white cursor-pointer"
          style={{ background: ORANGE }}
        >
          Search all resources
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto pb-20">
      {selected && <ResourceDetail resource={selected} onClose={() => setSelected(null)} />}

      {/* Context bar */}
      <div className="flex items-center px-5 pt-4 pb-3">
        <span className="text-sm font-bold" style={{ color: L1 }}>{profile.city}</span>
        <span className="text-sm mx-1" style={{ color: L3 }}>·</span>
        <span className="text-sm" style={{ color: L2 }}>{profile.diagnosis}</span>
        <div style={{ flex: 1 }} />
        <button
          onClick={onRefine}
          className="rounded-lg px-3 py-1.5 text-xs font-bold cursor-pointer"
          style={{ background: "#FFF0E8", color: ORANGE }}
        >
          Refine
        </button>
      </div>

      {/* Search */}
      <div className="mx-5 flex items-center gap-2 bg-white rounded-xl px-4 py-3 shadow-sm">
        <span style={{ color: L3 }}>🔍</span>
        <input
          type="text" value={search} onChange={e => { setSearch(e.target.value); setActiveCat(null); }}
          placeholder="Resources, organisations, categories..."
          className="flex-1 text-base outline-none bg-transparent" style={{ color: L1 }}
          autoComplete="off"
        />
      </div>

      {/* Category chips */}
      <div className="flex gap-2 px-5 mt-2.5 overflow-x-auto pb-1 no-scrollbar">
        {["All", ...availCats].map(cat => {
          const isAll    = cat === "All";
          const isActive = isAll ? !activeCat : activeCat === cat;
          return (
            <button
              key={cat}
              onClick={() => { setActiveCat(isAll ? null : (activeCat === cat ? null : cat)); setSearch(""); }}
              className="px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap cursor-pointer transition-colors"
              style={{ background: isActive ? ORANGE : FILL, color: isActive ? "white" : L2 }}
            >
              {isAll ? "All" : (CATS[cat]?.label ?? cat)}
            </button>
          );
        })}
      </div>

      {/* Results / feed */}
      {isFiltered ? (
        <div className="px-5 mt-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm" style={{ color: L2 }}>
              {displayed.length} result{displayed.length !== 1 ? "s" : ""}
              {search.trim() ? ` · "${search.trim()}"` : ""}
              {activeCat ? ` · ${CATS[activeCat]?.label ?? activeCat}` : ""}
            </span>
            <button onClick={() => { setSearch(""); setActiveCat(null); }} className="text-sm font-semibold cursor-pointer" style={{ color: ORANGE }}>Clear</button>
          </div>
          {displayed.map(r => <SearchCard key={r.id} resource={r} onClick={() => setSelected(r)} />)}
          {displayed.length === 0 && (
            <div className="text-center py-12">
              <p className="text-lg font-bold mb-1" style={{ color: L1 }}>No results</p>
              <p className="text-sm" style={{ color: L2 }}>Try a different search term or category.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-6">
          <h2 className="text-xl font-bold px-5 mb-4" style={{ color: L1 }}>Support near you</h2>
          {sections.map(s => {
            const color = s.accent ?? ORANGE;
            return (
              <div key={s.key} className="mb-8">
                <div className="flex items-baseline justify-between px-5 mb-3">
                  <h3 className="text-lg font-bold" style={{ color: L1 }}>{s.label}</h3>
                  <span className="text-xs font-bold" style={{ color }}>{s.resources.length}</span>
                </div>
                <div className="flex gap-3 overflow-x-auto px-5 pb-2 no-scrollbar">
                  {s.resources.map(r => {
                    const cat = s.isFeatured ? (r.helpTypes[0] ?? null) : null;
                    const itemAccent = s.isFeatured ? (cat ? (CATS[cat]?.accent ?? ORANGE) : ORANGE) : color;
                    return <FeedCard key={r.id} resource={r} accent={itemAccent} onClick={() => setSelected(r)} />;
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Explore tab ──────────────────────────────────────────────────────

function ExploreTab() {
  const [resources, setResources] = useState<Resource[] | null>(null);
  const [search, setSearch]       = useState("");
  const [selected, setSelected]   = useState<Resource | null>(null);

  useEffect(() => {
    getAllResources().then(setResources).catch(() => setResources([]));
  }, []);

  const results = useMemo(() => {
    if (!resources) return [];
    const q = search.trim().toLowerCase();
    if (!q) return resources.slice(0, 40);
    return resources.filter(r =>
      r.name.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q) ||
      r.helpTypes.some(h => h.toLowerCase().includes(q))
    );
  }, [resources, search]);

  return (
    <div className="flex-1 overflow-y-auto pb-20 px-5">
      {selected && <ResourceDetail resource={selected} onClose={() => setSelected(null)} />}
      <h1 className="text-2xl font-bold mt-4 mb-4" style={{ color: L1 }}>Explore</h1>
      <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-3 shadow-sm mb-3">
        <span style={{ color: L3 }}>🔍</span>
        <input
          type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search all resources..."
          className="flex-1 text-base outline-none bg-transparent" style={{ color: L1 }}
          autoComplete="off"
        />
      </div>
      {search.trim() && <p className="text-sm mb-2" style={{ color: L2 }}>{results.length} result{results.length !== 1 ? "s" : ""}</p>}
      {!resources ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: ORANGE }} />
        </div>
      ) : (
        results.map(r => <SearchCard key={r.id} resource={r} onClick={() => setSelected(r)} />)
      )}
    </div>
  );
}

// ─── Profile tab ──────────────────────────────────────────────────────

function ProfileTab({ profile, onEdit }: { profile: UserProfile; onEdit: () => void }) {
  return (
    <div className="flex-1 overflow-y-auto pb-20">
      <div className="flex flex-col items-center py-10 px-5" style={{ background: ORANGE }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/canopy-logo.png" alt="Canopy" width={64} height={64} className="mb-3 object-contain" style={{ filter: "brightness(0) invert(1)" }} />
        <h2 className="text-2xl font-extrabold text-white mb-1">{profile.city}</h2>
        <p style={{ color: "rgba(255,255,255,0.80)" }}>{profile.diagnosis}</p>
        {profile.zipcode && <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.65)" }}>{profile.zipcode}</p>}
      </div>
      <div className="px-5 mt-6">
        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: L3 }}>Your profile</p>
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
          <div className="flex items-center gap-3 px-4 py-3.5 border-b" style={{ borderColor: SEP }}>
            <span style={{ color: L2 }}>📍</span>
            <span className="flex-1 text-base" style={{ color: L2 }}>City</span>
            <span className="text-base font-semibold" style={{ color: L1 }}>{profile.city}</span>
          </div>
          <div className="flex items-center gap-3 px-4 py-3.5 border-b" style={{ borderColor: SEP }}>
            <span style={{ color: L2 }}>🎗️</span>
            <span className="flex-1 text-base" style={{ color: L2 }}>Diagnosis</span>
            <span className="text-base font-semibold" style={{ color: L1 }}>{profile.diagnosis}</span>
          </div>
          {profile.zipcode && (
            <div className="flex items-center gap-3 px-4 py-3.5">
              <span style={{ color: L2 }}>📮</span>
              <span className="flex-1 text-base" style={{ color: L2 }}>Postcode</span>
              <span className="text-base font-semibold" style={{ color: L1 }}>{profile.zipcode}</span>
            </div>
          )}
        </div>
        <button
          onClick={onEdit}
          className="w-full mt-4 py-4 rounded-xl text-base font-bold text-white cursor-pointer"
          style={{ background: ORANGE }}
        >
          Update profile
        </button>
        <p className="text-center text-xs mt-5" style={{ color: L3 }}>Your profile is only stored on this device and is never shared.</p>
      </div>
    </div>
  );
}

// ─── Nav SVG icons ────────────────────────────────────────────────────

function NavIcon({ id, active }: { id: Tab; active: boolean }) {
  const c = active ? ORANGE : L3;
  const w = 22;
  if (id === "home") return (
    <svg width={w} height={w} viewBox="0 0 24 24" fill={active ? ORANGE : "none"} stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
      <path d="M9 21V12h6v9"/>
    </svg>
  );
  if (id === "explore") return (
    <svg width={w} height={w} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  );
  if (id === "map") return (
    <svg width={w} height={w} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
      <line x1="8" y1="2" x2="8" y2="18"/>
      <line x1="16" y1="6" x2="16" y2="22"/>
    </svg>
  );
  // profile / Me
  return (
    <svg width={w} height={w} viewBox="0 0 24 24" fill={active ? ORANGE : "none"} stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  );
}

// ─── Bottom nav ───────────────────────────────────────────────────────

function BottomNav({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  const items: { id: Tab; label: string }[] = [
    { id: "home",    label: "Home"    },
    { id: "explore", label: "Explore" },
    { id: "map",     label: "Map"     },
    { id: "profile", label: "Me"      },
  ];
  return (
    <div className="fixed bottom-0 left-0 right-0 flex border-t" style={{ background: "rgba(252,247,242,0.96)", borderColor: "rgba(0,0,0,0.1)", backdropFilter: "blur(12px)" }}>
      {items.map(item => {
        const active = tab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className="flex-1 flex flex-col items-center py-2.5 gap-0.5 cursor-pointer"
          >
            <NavIcon id={item.id} active={active} />
            <span className="text-[10px] font-medium" style={{ color: active ? ORANGE : L3 }}>{item.label}</span>
            {active && <div className="w-4 h-0.5 rounded-full mt-0.5" style={{ background: ORANGE }} />}
          </button>
        );
      })}
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────

export default function App() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [tab, setTab]         = useState<Tab>("home");

  const handleRefine = useCallback(() => {
    setProfile(null);
  }, []);

  if (!profile) return <Onboarding onDone={p => { setProfile(p); setTab("home"); }} />;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: CREAM }}>
      {/* Top bar with logo — visible on all tabs */}
      <div
        className="flex items-center justify-center border-b"
        style={{ background: "rgba(252,247,242,0.96)", borderColor: SEP, height: 48, flexShrink: 0, backdropFilter: "blur(12px)" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/canopy-logo.png" alt="Canopy" height={28} style={{ height: 28, objectFit: "contain" }} />
      </div>

      {tab === "home"    && <HomeTab profile={profile} onRefine={handleRefine} />}
      {tab === "explore" && <ExploreTab />}
      {tab === "map"     && (
        <div className="flex-1 flex flex-col" style={{ minHeight: 0, height: "calc(100vh - 104px)" }}>
          <MapTab profile={profile} />
        </div>
      )}
      {tab === "profile" && <ProfileTab profile={profile} onEdit={handleRefine} />}
      <BottomNav tab={tab} setTab={setTab} />
    </div>
  );
}
