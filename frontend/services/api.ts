import Constants from "expo-constants";

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
