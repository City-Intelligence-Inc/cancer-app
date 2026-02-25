"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { createSession, updateSession } from "@/services/api";

interface Answers {
  age?: number;
  location?: string;
  diagnosis?: string;
  help_needed?: string[];
}

interface SessionContextValue {
  sessionId: string | null;
  answers: Answers;
  startSession: () => Promise<void>;
  saveAnswer: <K extends keyof Answers>(key: K, value: Answers[K]) => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Answers>({});

  const startSession = useCallback(async () => {
    const session = await createSession();
    setSessionId(session.sessionId);
    setAnswers({});
  }, []);

  const saveAnswer = useCallback(
    async <K extends keyof Answers>(key: K, value: Answers[K]) => {
      if (!sessionId) throw new Error("No active session");
      setAnswers((prev) => ({ ...prev, [key]: value }));
      await updateSession(sessionId, { [key]: value });
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
