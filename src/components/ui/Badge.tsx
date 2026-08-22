type Tone = "neutral" | "success" | "danger" | "warning" | "info";

const TONES: Record<Tone, string> = {
  neutral: "bg-white/[0.06] text-slate-300",
  success: "bg-teal-500/10 text-teal-400 ring-1 ring-teal-500/20",
  danger: "bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20",
  warning: "bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/20",
  info: "bg-cyan-500/10 text-cyan-400 ring-1 ring-cyan-500/20",
};

interface BadgeProps {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
}

export default function Badge({
  tone = "neutral",
  children,
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
