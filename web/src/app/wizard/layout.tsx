"use client";

import { usePathname } from "next/navigation";
import ProgressBar from "@/components/ProgressBar";

const STEPS = ["/wizard/age", "/wizard/location", "/wizard/diagnosis", "/wizard/help-needed"];

export default function WizardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const currentIndex = STEPS.indexOf(pathname);
  const progress = currentIndex >= 0 ? (currentIndex + 1) / STEPS.length : 0;

  return (
    <div className="min-h-screen">
      <div className="max-w-lg mx-auto px-6 pt-4 pb-1">
        <ProgressBar progress={progress} />
      </div>
      {children}
    </div>
  );
}
