"use client";

interface SelectableChipProps {
  label: string;
  selected: boolean;
  onClick: () => void;
}

export default function SelectableChip({ label, selected, onClick }: SelectableChipProps) {
  return (
    <button
      onClick={onClick}
      className={`min-h-[48px] px-4 py-2 rounded-full font-medium text-base border-2 transition-all cursor-pointer
        ${selected
          ? "bg-sage border-sage text-white"
          : "bg-chip-bg border-transparent text-text-primary hover:border-sage/30"
        }`}
    >
      {label}
    </button>
  );
}
