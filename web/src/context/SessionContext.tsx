"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { createSession, updateSession } from "@/services/api";

export interface Answers {
  age?: number;
  location?: string;
  country?: string;
  zipcode?: string;
  diagnosis?: string;
  help_needed?: string[];
  role?: "Patient" | "Carer";
  treatment_stage?: string;
  lat?: number;
  lng?: number;
}

interface SessionContextValue {
  sessionId: string | null;
  answers: Answers;
  startSession: () => Promise<string>;
  saveAnswer: <K extends keyof Answers>(key: K, value: Answers[K], overrideSessionId?: string) => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Answers>({});

  const startSession = useCallback(async (): Promise<string> => {
    let newId: string;
    try {
      const session = await createSession();
      newId = session.sessionId;
    } catch {
      newId = "local-" + Math.random().toString(36).slice(2, 10);
    }
    setSessionId(newId);
    setAnswers({});
    return newId;
  }, []);

  const saveAnswer = useCallback(
    async <K extends keyof Answers>(key: K, value: Answers[K], overrideSessionId?: string) => {
      const id = overrideSessionId ?? sessionId;
      if (!id) throw new Error("No active session");
      setAnswers((prev) => ({ ...prev, [key]: value }));
      if (!id.startsWith("local-")) {
        await updateSession(id, { [key]: value }).catch(() => {});
      }
    },
    [sessionId]
  );

  return (
    <SessionContext.Provider value={{ sessionId, answers, startSession, saveAnswer }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
