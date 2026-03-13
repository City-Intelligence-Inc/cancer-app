import { Resource, HELP_TYPES } from "@/data/resources";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://iutm2kyhqq.us-east-1.awsapprunner.com";

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
  zipcode?: string;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
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

export function updateSession(id: string, data: SessionUpdate): Promise<Session> {
  return request<Session>(`/sessions/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export interface SheetData {
  headers: string[];
  rows: Record<string, string>[];
}

// Derive from the single source of truth
const VALID_HELP_TYPES = new Set<string>(HELP_TYPES);

const DIAGNOSIS_MAP: Record<string, string> = {
  Breast: "Breast Cancer",
  Lung: "Lung Cancer",
  Bowel: "Bowel / Colorectal Cancer",
  Prostate: "Prostate Cancer",
  Blood: "Blood / Leukaemia",
  Lymphoma: "Lymphoma",
  Gynaecological: "Gynaecological Cancer",
  "Head & Neck": "Head & Neck Cancer",
  Skin: "Skin Cancer",
  Pancreatic: "Pancreatic Cancer",
  Brain: "Brain Cancer",
  Kidney: "Kidney Cancer",
  Liver: "Liver Cancer",
  Bladder: "Bladder Cancer",
  Thyroid: "Thyroid Cancer",
  Sarcoma: "Sarcoma",
  Mesothelioma: "Mesothelioma",
  Other: "Other / Unsure",
};

function mapDiagnosis(sheetValue: string): string {
  return DIAGNOSIS_MAP[sheetValue] ?? `${sheetValue} Cancer`;
}

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
    : cancerTypes.map(mapDiagnosis);

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

export function getSheetData(): Promise<SheetData> {
  return request<SheetData>("/sheet-data");
}

export async function getSheetResources(): Promise<Resource[]> {
  const data = await request<SheetData>("/sheet-data");
  return data.rows.map(mapRowToResource).filter((r) => r.url);
}

interface DbResource {
  resourceId: string;
  name: string;
  description: string;
  helpTypes: string[];
  cancerTypes: string[];
  entireCountry: boolean;
  countries: string[];
  cities: string[];
  zipcodes?: string[];
  patientCarer: string;
  treatmentStage: string;
  websiteUrl: string;
  contact?: string;
  minAge?: number;
  maxAge?: number;
}

function mapDbResourceToResource(r: DbResource): Resource {
  const cancerTypes = r.cancerTypes || [];
  const diagnoses = cancerTypes.includes("All") ? [] : cancerTypes.map(mapDiagnosis);
  const minAge = r.minAge != null ? Number(r.minAge) : null;
  const maxAge = r.maxAge != null ? Number(r.maxAge) : null;
  const ageRange: [number, number] | null =
    minAge != null && maxAge != null ? [minAge, maxAge] : null;
  const rawPatientCarer = (r.patientCarer || "Both").trim();
  const patientCarer: "Patient" | "Carer" | "Both" =
    rawPatientCarer === "Patient" || rawPatientCarer === "Carer" ? rawPatientCarer : "Both";
  const rawStage = (r.treatmentStage || "All").trim();
  const treatmentStage = TREATMENT_STAGE_MAP[rawStage] || "All";

  return {
    id: `db-${r.resourceId}`,
    name: r.name || "Unknown",
    description: r.description || "",
    helpTypes: r.helpTypes || [],
    diagnoses,
    ageRange,
    locations: [...new Set([...(r.countries || []), ...(r.cities || [])])],
    entireCountry: r.entireCountry ?? false,
    cities: r.cities || [],
    zipcodes: r.zipcodes || [],
    countries: r.countries || [],
    url: r.websiteUrl || "",
    contact: r.contact || undefined,
    patientCarer,
    treatmentStage,
  };
}

/** Merges sheet + DynamoDB resources, deduplicating by name */
export async function getAllResources(): Promise<Resource[]> {
  const [sheetRes, dbRes] = await Promise.all([
    fetch(`${API_URL}/sheet-data`).catch(() => null),
    fetch(`${API_URL}/resources`).catch(() => null),
  ]);

  const resources: Resource[] = [];
  const seen = new Set<string>();

  if (sheetRes?.ok) {
    const data: SheetData = await sheetRes.json();
    for (const r of data.rows.map(mapRowToResource).filter((r) => r.url)) {
      seen.add(r.name.toLowerCase());
      resources.push(r);
    }
  }

  if (dbRes?.ok) {
    const data: { resources: DbResource[] } = await dbRes.json();
    for (const dbr of data.resources) {
      if (seen.has((dbr.name || "").toLowerCase())) continue;
      const r = mapDbResourceToResource(dbr);
      if (r.url) resources.push(r);
    }
  }

  return resources;
}

export async function getSheetCities(): Promise<string[]> {
  const [sheetData, dbData] = await Promise.all([
    request<SheetData>("/sheet-data"),
    request<{ resources: { cities?: string[] }[] }>("/resources"),
  ]);
  const citySet = new Set<string>();
  for (const row of sheetData.rows) {
    (row["Cities Available"] || "")
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((c) => citySet.add(c));
  }
  for (const r of dbData.resources) {
    (r.cities || []).forEach((c) => citySet.add(c));
  }
  citySet.delete("National");
  citySet.delete("Online");
  return Array.from(citySet).sort();
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

/** Returns unique diagnoses from the sheet, mapped to display names */
export async function getSheetDiagnoses(): Promise<string[]> {
  const data = await request<SheetData>("/sheet-data");
  const diagSet = new Set<string>();
  for (const row of data.rows) {
    (row["Cancer Type"] || "")
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((t) => {
        if (t === "All") return;
        diagSet.add(mapDiagnosis(t));
      });
  }
  const sorted = Array.from(diagSet).sort();
  if (!sorted.includes("Other / Unsure")) sorted.push("Other / Unsure");
  return sorted;
}

/** Returns a map of city -> country, built from sheet + DynamoDB data */
export async function getSheetCityCountryMap(): Promise<Record<string, string>> {
  const [sheetData, dbData] = await Promise.all([
    request<SheetData>("/sheet-data"),
    request<{ resources: { cities?: string[]; countries?: string[] }[] }>("/resources"),
  ]);
  const map: Record<string, string> = {};
  for (const row of sheetData.rows) {
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
  for (const r of dbData.resources) {
    const countries = r.countries || [];
    for (const city of r.cities || []) {
      if (!map[city] && countries.length > 0) map[city] = countries[0];
    }
  }
  return map;
}
