import Constants from "expo-constants";
import { Resource } from "../data/resources";

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
}

// Sheet category names map 1-to-1 with app HELP_TYPES
const VALID_HELP_TYPES = new Set([
  "Mental Health", "Peer Support", "Financial Aid", "Practical Help",
  "Legal & Employment", "Information & Education", "Carer Support",
  "Wellness & Nutrition", "End-of-Life Care",
]);

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
    url: row["Website URL"] || "",
    phone,
  };
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

interface SheetData {
  headers: string[];
  rows: Record<string, string>[];
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
