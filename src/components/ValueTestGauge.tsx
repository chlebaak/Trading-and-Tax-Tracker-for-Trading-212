"use client";

interface Props {
  totalSold: number;
  limit: number;
  isUnderLimit: boolean;
  isNearLimit: boolean;
}

function formatCzk(value: number): string {
  return new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 0 }).format(
    value,
  );
}

export default function ValueTestGauge({
  totalSold,
  limit,
  isUnderLimit,
  isNearLimit,
}: Props) {
  const percent = Math.min(100, (totalSold / limit) * 100);
  const fillColor = !isUnderLimit
    ? "#f472b6"
    : isNearLimit
      ? "#fbbf24"
      : "#2dd4bf";
  const trackColor = "rgba(255,255,255,0.05)";

  return (
    <div className="flex flex-col items-center">
      {/* Gauge ring */}
      <div
        className="relative flex items-center justify-center"
        style={{ width: 200, height: 110 }}
      >
        <div
          className="absolute inset-0 rounded-t-full"
          style={{
            background: `conic-gradient(${fillColor} 0deg ${percent * 1.8}deg, ${trackColor} ${percent * 1.8}deg 180deg)`,
            clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
            mask: "radial-gradient(circle at center, transparent 62%, black 63%)",
            WebkitMask:
              "radial-gradient(circle at center, transparent 62%, black 63%)",
          }}
        />
        {/* Center text */}
        <div
          className="relative z-10 flex flex-col items-center"
          style={{ marginTop: 40 }}
        >
          <span className="text-2xl font-bold text-slate-100">
            {percent.toFixed(0)}%
          </span>
          <span className="text-[10px] text-slate-500">
            {formatCzk(totalSold)} / {formatCzk(limit)} Kč
          </span>
        </div>
      </div>

      <div className="-mt-2 flex flex-col items-center gap-1">
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            !isUnderLimit
              ? "bg-pink-500/20 text-pink-400"
              : isNearLimit
                ? "bg-amber-500/20 text-amber-400"
                : "bg-teal-500/20 text-teal-400"
          }`}
        >
          {!isUnderLimit
            ? "Překročen"
            : isNearLimit
              ? "Blízko limitu"
              : "V limitu"}
        </span>
        <span className="text-xs text-slate-500">
          Zbývá {formatCzk(Math.max(0, limit - totalSold))} Kč
        </span>
      </div>
    </div>
  );
}

