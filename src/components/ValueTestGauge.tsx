"use client";

import CountUp from "./ui/CountUp";
import { formatCzk } from "@/lib/format";

interface Props {
  totalSold: number;
  limit: number;
  isUnderLimit: boolean;
  isNearLimit: boolean;
}

/** Near-limit warning threshold (matches page.tsx isValueNearLimit). */
const NEAR_LIMIT_PCT = 80;

export default function ValueTestGauge({
  totalSold,
  limit,
  isUnderLimit,
  isNearLimit,
}: Props) {
  const percent = Math.min(100, Math.max(0, (totalSold / limit) * 100));
  const barColor = !isUnderLimit
    ? "bg-rose-400"
    : isNearLimit
      ? "bg-amber-400"
      : "bg-teal-400";
  const remaining = Math.max(0, limit - totalSold);

  return (
    <div className="flex w-full flex-col items-center py-2">
      {/* Big percent + amounts */}
      <p
        className={`text-4xl font-bold tracking-tight tabular-nums ${
          !isUnderLimit
            ? "text-rose-400"
            : isNearLimit
              ? "text-amber-300"
              : "text-white"
        }`}
      >
        <CountUp value={percent} format={(v) => `${v.toFixed(0)} %`} />
      </p>
      <p className="mt-1 text-xs text-slate-500 tabular-nums">
        Prodáno{" "}
        <span className="font-semibold text-slate-300">
          {formatCzk(totalSold)} Kč
        </span>{" "}
        z {formatCzk(limit)} Kč
      </p>

      {/* Progress bar with near-limit tick */}
      <div className="mt-5 w-full max-w-sm">
        <div className="relative h-3 w-full overflow-hidden rounded-full bg-white/[0.06] ring-1 ring-white/[0.04]">
          <div
            className={`h-full rounded-full transition-all duration-700 ${barColor}`}
            style={{ width: `${Math.max(percent, 1.5)}%` }}
          />
          {isNearLimit && !isUnderLimit && (
            <div
              className="absolute inset-y-0 w-px bg-[#05070f]/70"
              style={{ left: `${NEAR_LIMIT_PCT}%` }}
              title={`Varování od ${NEAR_LIMIT_PCT} %`}
            />
          )}
        </div>
        <div className="mt-1.5 flex justify-between text-[10px] text-slate-600 tabular-nums">
          <span>0</span>
          {percent < NEAR_LIMIT_PCT && (
            <span>{NEAR_LIMIT_PCT} % varování</span>
          )}
          <span>{formatCzk(limit)} Kč</span>
        </div>
      </div>

      {/* Status row */}
      <div className="mt-4 flex items-center gap-3">
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            !isUnderLimit
              ? "bg-rose-500/15 text-rose-400 ring-1 ring-rose-500/25"
              : isNearLimit
                ? "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/25"
                : "bg-teal-500/15 text-teal-400 ring-1 ring-teal-500/25"
          }`}
        >
          {!isUnderLimit
            ? "Překročen"
            : isNearLimit
              ? "Blízko limitu"
              : "V limitu"}
        </span>
        <span className="text-xs text-slate-500 tabular-nums">
          Zbývá{" "}
          <span className="font-semibold text-slate-300">
            {formatCzk(remaining)} Kč
          </span>
        </span>
      </div>
    </div>
  );
}
