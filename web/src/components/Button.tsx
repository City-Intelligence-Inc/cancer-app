"use client";

interface ButtonProps {
  title: string;
  onClick: () => void;
  variant?: "primary" | "secondary";
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

export default function Button({
  title,
  onClick,
  variant = "primary",
  loading = false,
  disabled = false,
  className = "",
}: ButtonProps) {
  const base = "min-h-[52px] px-6 py-3 rounded-xl font-semibold text-base transition-all cursor-pointer";
  const variants = {
    primary: "bg-sage text-white hover:bg-sage-light",
    secondary: "bg-transparent border-2 border-sage text-sage hover:bg-sage/5",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${disabled || loading ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
    >
      {loading ? (
        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mx-auto" />
      ) : (
        title
      )}
    </button>
  );
}
