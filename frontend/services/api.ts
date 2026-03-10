import Constants from "expo-constants";
import { Resource, HELP_TYPES } from "../data/resources";

const API_URL: string =
  (Constants.expoConfig?.extra as Record<string, string> | undefined)
    ?.API_URL ?? "https://iutm2kyhqq.us-east-1.awsapprunner.com";

interface Session {
  sessionId: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: number;
  answers: Record<string, unknown>;
}

interface SessionUpdate {
  age?: number;
  location?: string;
  diagnosis?: string;
  help_needed?: string[];
  role?: string;
  treatment_stage?: string;
  country?: string;
}

// Derive from the single source of truth
const VALID_HELP_TYPES = new Set<string>(HELP_TYPES);

// Maps sheet cancer type names to app DIAGNOSES
const DIAGNOSIS_MAP: Record<string, string> = {
  Breast: "Breast Cancer",
  Lung: "Lung Cancer",
  Bowel: "Bowel / Colorectal Cancer",
  Prostate: "Prostate Cancer",
  Blood: "Blood / Leukaemia",
  Gynaecological: "Gynaecological Cancer",
  "Head & Neck": "Head & Neck Cancer",
  Skin: "Skin Cancer",
  Pancreatic: "Pancreatic Cancer",
  Brain: "Brain Cancer",
  Other: "Other / Unsure",
};

// Maps sheet treatment stage values to app TREATMENT_STAGES
const TREATMENT_STAGE_MAP: Record<string, string> = {
  All: "All",
  "Newly Diagnosed": "Newly Diagnosed",
  "During Treatment": "During Treatment",
  "Post-Treatment": "Post-Treatment",
  "Post Treatment": "Post-Treatment",
  "Palliative / End-of-Life": "Palliative / End-of-Life",
  "Palliative": "Palliative / End-of-Life",
  "End-of-Life": "Palliative / End-of-Life",
};

function mapRowToResource(row: Record<string, string>): Resource {
  const cats = [
    row["Primary Category"],
    row["Secondary Category"],
    row["Additional Category 1"],
    row["Additional Category 2"],
  ].filter(Boolean);

  const helpTypes = [...new Set(cats.filter((c) => VALID_HELP_TYPES.has(c)))];

  const cancerTypes = (row["Cancer Type"] || "")
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
  const diagnoses = cancerTypes.includes("All")
    ? []
    : cancerTypes
        .map((t) => DIAGNOSIS_MAP[t])
        .filter((d): d is string => !!d);

  const minAge = row["Min Age"] ? parseInt(row["Min Age"]) : null;
  const maxAge = row["Max Age"] ? parseInt(row["Max Age"]) : null;
  const ageRange: [number, number] | null =
    minAge != null && maxAge != null ? [minAge, maxAge] : null;

  const countries = (row["Countries Available"] || "")
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
  const cities = (row["Cities Available"] || "")
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
  const entireCountry = row["Entire Country?"] === "Yes";
  const locations = [...new Set([...countries, ...cities])];

  const contact = row["Contact / Referral Link"] || "";
  const phoneMatch = contact.match(/Tel:\s*([\d\s+\-()\[\]]+)/);
  const phone = phoneMatch ? phoneMatch[1].trim() : undefined;

  const rawPatientCarer = (row["Patient / Carer / Both"] || "Both").trim();
  const patientCarer: "Patient" | "Carer" | "Both" =
    rawPatientCarer === "Patient" || rawPatientCarer === "Carer"
      ? rawPatientCarer
      : "Both";

  const rawStage = (row["Treatment Stage"] || "All").trim();
  const treatmentStage = TREATMENT_STAGE_MAP[rawStage] || "All";

  return {
    id: `sheet-${row["ID"]}`,
    name: row["Resource Name"] || "Unknown",
    description: row["Description"] || row["Notes"] || "",
    helpTypes,
    diagnoses,
    ageRange,
    locations,
    entireCountry,
    cities,
    countries,
    url: row["Website URL"] || "",
    phone,
    contact: contact || undefined,
    patientCarer,
    treatmentStage,
  };
}

interface SheetData {
  headers: string[];
  rows: Record<string, string>[];
}

export async function getSheetCities(): Promise<string[]> {
  const res = await fetch(`${API_URL}/sheet-data`);
  if (!res.ok) throw new Error(`Sheet fetch failed: ${res.status}`);
  const data: SheetData = await res.json();
  const citySet = new Set<string>();
  for (const row of data.rows) {
    (row["Cities Available"] || "")
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((c) => citySet.add(c));
  }
  return Array.from(citySet).sort();
}

/** Returns a map of city → country, built from sheet data */
export async function getSheetCityCountryMap(): Promise<Record<string, string>> {
  const res = await fetch(`${API_URL}/sheet-data`);
  if (!res.ok) throw new Error(`Sheet fetch failed: ${res.status}`);
  const data: SheetData = await res.json();
  const map: Record<string, string> = {};
  for (const row of data.rows) {
    const countries = (row["Countries Available"] || "")
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean);
    const cities = (row["Cities Available"] || "")
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean);
    if (countries.length > 0) {
      for (const city of cities) {
        if (!map[city]) map[city] = countries[0];
      }
    }
  }
  return map;
}

export async function getSheetResources(): Promise<Resource[]> {
  const res = await fetch(`${API_URL}/sheet-data`);
  if (!res.ok) throw new Error(`Sheet fetch failed: ${res.status}`);
  const data: SheetData = await res.json();
  return data.rows.map(mapRowToResource).filter((r) => r.url);
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

export function createSession(): Promise<Session> {
  return request<Session>("/sessions", { method: "POST" });
}

export function getSession(id: string): Promise<Session> {
  return request<Session>(`/sessions/${id}`);
}

export function updateSession(
  id: string,
  data: SessionUpdate
): Promise<Session> {
  return request<Session>(`/sessions/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function saveMatchLog(
  sessionId: string,
  log: Record<string, unknown>
): Promise<{ status: string }> {
  return request<{ status: string }>(`/sessions/${sessionId}/match-log`, {
    method: "POST",
    body: JSON.stringify(log),
  });
}
