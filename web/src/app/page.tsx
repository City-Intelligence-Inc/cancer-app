"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/context/SessionContext";
import Button from "@/components/Button";

export default function WelcomePage() {
  const router = useRouter();
  const { startSession } = useSession();
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    setLoading(true);
    try {
      await startSession();
      router.push("/wizard/age");
    } catch {
      setLoading(false);
    }
  };

  const features = [
    ["🔒", "Private & anonymous"],
    ["⚡", "Takes under 2 minutes"],
    ["🎯", "Personalized matches"],
  ];

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-12">
          <div className="text-6xl mb-4">💚</div>
          <h1 className="text-[32px] font-extrabold text-text-primary leading-tight mb-4">
            Find Support<br />That Fits You
          </h1>
          <p className="text-base text-text-secondary leading-relaxed px-4">
            Answer a few quick questions and we&apos;ll match you with cancer support
            resources tailored to your needs.
          </p>
        </div>

        <div className="flex flex-col gap-3 mb-12">
          {features.map(([icon, text]) => (
            <div key={text} className="flex items-center gap-4 bg-white p-4 rounded-xl">
              <span className="text-xl">{icon}</span>
              <span className="text-base font-medium text-text-primary">{text}</span>
            </div>
          ))}
        </div>

        <Button title="Get Started" onClick={handleStart} loading={loading} className="w-full" />
      </div>
    </main>
  );
}
