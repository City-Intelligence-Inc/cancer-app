"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/Button";
import { useSession } from "@/context/SessionContext";
import { getSheetCities, getSheetCityCountryMap, getSheetDiagnoses } from "@/services/api";
import { HELP_TYPES, TREATMENT_STAGES, ROLES } from "@/data/resources";

export default function SettingsPage() {
  const router = useRouter();
  const { answers, saveAnswer } = useSession();
  const [saving, setSaving] = useState(false);

  // Local state mirrors answers so user can edit before saving
  const [age, setAge] = useState(answers.age?.toString() ?? "");
  const [role, setRole] = useState(answers.role ?? "");
  const [location, setLocation] = useState(answers.location ?? "");
  const [zipcode, setZipcode] = useState(answers.zipcode ?? "");
  const [diagnosis, setDiagnosis] = useState(answers.diagnosis ?? "");
  const [treatmentStage, setTreatmentStage] = useState(answers.treatment_stage ?? "");
  const [helpNeeded, setHelpNeeded] = useState<string[]>(answers.help_needed ?? []);

  const [cities, setCities] = useState<string[]>([]);
  const [cityCountryMap, setCityCountryMap] = useState<Record<string, string>>({});
  const [diagnoses, setDiagnoses] = useState<string[]>([]);
  const [cityQuery, setCityQuery] = useState(answers.location ?? "");

  useEffect(() => {
    Promise.all([getSheetCities(), getSheetCityCountryMap(), getSheetDiagnoses()])
      .then(([c, m, d]) => { setCities(c); setCityCountryMap(m); setDiagnoses(d); })
      .catch(() => {});
  }, []);

  const citySuggestions = (() => {
    const q = cityQuery.trim().toLowerCase();
    if (!q || cities.find((c) => c.toLowerCase() === q)) return [];
    return cities.filter((c) => c.toLowerCase().startsWith(q)).slice(0, 8);
  })();

  const matchedCity = cities.find((c) => c.toLowerCase() === cityQuery.trim().toLowerCase());

  const toggleHelp = (h: string) => {
    setHelpNeeded((prev) =>
      prev.includes(h) ? prev.filter((x) => x !== h) : [...prev, h]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (age) await saveAnswer("age", parseInt(age));
      if (role === "Patient" || role === "Carer") await saveAnswer("role", role);
      if (matchedCity) {
        await saveAnswer("location", matchedCity);
        const country = cityCountryMap[matchedCity];
        if (country) await saveAnswer("country", country);
      }
      if (zipcode.trim()) await saveAnswer("zipcode", zipcode.trim());
      if (diagnosis) await saveAnswer("diagnosis", diagnosis);
      if (treatmentStage) await saveAnswer("treatment_stage", treatmentStage);
      await saveAnswer("help_needed", helpNeeded);
      router.push("/results");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen max-w-lg mx-auto px-6 py-8">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-text-secondary hover:text-text-primary cursor-pointer">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-[26px] font-bold text-text-primary">Your Information</h1>
      </div>

      <div className="space-y-6">
        {/* Age */}
        <div>
          <label className="block text-sm font-semibold text-text-primary mb-2">Age</label>
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="e.g. 45"
            className="w-full bg-white border-2 border-border rounded-xl p-3 text-base text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-sage transition-colors"
          />
        </div>

        {/* Role */}
        <div>
          <label className="block text-sm font-semibold text-text-primary mb-2">I am a...</label>
          <div className="flex gap-3">
            {ROLES.map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`flex-1 py-3 rounded-xl text-sm font-semibold border-2 transition-colors cursor-pointer ${
                  role === r
                    ? "border-sage bg-sage/10 text-sage"
                    : "border-border text-text-secondary hover:border-sage/50"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-semibold text-text-primary mb-2">City</label>
          <input
            type="text"
            value={cityQuery}
            onChange={(e) => { setCityQuery(e.target.value); setLocation(e.target.value); }}
            placeholder="e.g. San Francisco"
            autoComplete="off"
            className={`w-full bg-white border-2 rounded-xl p-3 text-base text-text-primary placeholder:text-text-secondary focus:outline-none transition-colors ${
              matchedCity ? "border-sage" : "border-border focus:border-sage"
            }`}
          />
          {citySuggestions.length > 0 && (
            <div className="mt-1 bg-white border-2 border-border rounded-xl overflow-hidden max-h-48 overflow-y-auto">
              {citySuggestions.map((city) => (
                <button
                  key={city}
                  onClick={() => { setCityQuery(city); setLocation(city); }}
                  className="w-full text-left px-3 py-2 text-sm text-text-primary hover:bg-chip-bg border-b border-border last:border-b-0 cursor-pointer"
                >
                  {city}{cityCountryMap[city] ? `, ${cityCountryMap[city]}` : ""}
                </button>
              ))}
            </div>
          )}
          {matchedCity && (
            <span className="inline-block mt-1 bg-sage text-white text-xs font-semibold px-2.5 py-0.5 rounded-full">
              {matchedCity}{cityCountryMap[matchedCity] ? `, ${cityCountryMap[matchedCity]}` : ""}
            </span>
          )}
        </div>

        {/* Zipcode */}
        <div>
          <label className="block text-sm font-semibold text-text-primary mb-2">Postcode / Zip (optional)</label>
          <input
            type="text"
            value={zipcode}
            onChange={(e) => setZipcode(e.target.value.toUpperCase())}
            placeholder="e.g. SW1A 1AA or 94102"
            className="w-full bg-white border-2 border-border rounded-xl p-3 text-base text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-sage transition-colors"
          />
        </div>

        {/* Diagnosis */}
        <div>
          <label className="block text-sm font-semibold text-text-primary mb-2">Cancer type</label>
          <select
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            className="w-full bg-white border-2 border-border rounded-xl p-3 text-base text-text-primary focus:outline-none focus:border-sage transition-colors"
          >
            <option value="">Any / Not specified</option>
            {diagnoses.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* Treatment Stage */}
        <div>
          <label className="block text-sm font-semibold text-text-primary mb-2">Treatment stage</label>
          <div className="flex flex-wrap gap-2">
            {TREATMENT_STAGES.map((s) => (
              <button
                key={s}
                onClick={() => setTreatmentStage(treatmentStage === s ? "" : s)}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border-2 transition-colors cursor-pointer ${
                  treatmentStage === s
                    ? "border-sage bg-sage/10 text-sage"
                    : "border-border text-text-secondary hover:border-sage/50"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Help Types */}
        <div>
          <label className="block text-sm font-semibold text-text-primary mb-2">What help do you need?</label>
          <div className="flex flex-wrap gap-2">
            {HELP_TYPES.map((h) => (
              <button
                key={h}
                onClick={() => toggleHelp(h)}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border-2 transition-colors cursor-pointer ${
                  helpNeeded.includes(h)
                    ? "border-sage bg-sage/10 text-sage"
                    : "border-border text-text-secondary hover:border-sage/50"
                }`}
              >
                {h}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 pb-8">
        <Button title="Save & View Results" onClick={handleSave} loading={saving} className="w-full" />
      </div>
    </main>
  );
}
