"use client";

import { useRouter } from "next/navigation";
import Button from "./Button";

interface StepContainerProps {
  heading: string;
  description: string;
  children: React.ReactNode;
  onNext: () => void | Promise<void>;
  nextLabel?: string;
  nextDisabled?: boolean;
  loading?: boolean;
  showBack?: boolean;
}

export default function StepContainer({
  heading,
  description,
  children,
  onNext,
  nextLabel = "Next",
  nextDisabled = false,
  loading = false,
  showBack = true,
}: StepContainerProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col min-h-[calc(100vh-60px)] max-w-lg mx-auto px-6 pt-8 pb-6">
      <div className="mb-8">
        <h1 className="text-[26px] font-bold text-text-primary mb-2">{heading}</h1>
        <p className="text-base text-text-secondary leading-relaxed">{description}</p>
      </div>

      <div className="flex-1">{children}</div>

      <div className="flex gap-4 pt-8 pb-4">
        {showBack && (
          <Button title="Back" variant="secondary" onClick={() => router.back()} className="flex-1" />
        )}
        <Button
          title={nextLabel}
          onClick={onNext}
          disabled={nextDisabled}
          loading={loading}
          className="flex-[2]"
        />
      </div>
    </div>
  );
}
