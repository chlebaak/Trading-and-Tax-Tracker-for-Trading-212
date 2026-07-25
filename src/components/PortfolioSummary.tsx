"use client";

import type { NormalizedPosition } from "@/lib/trading212/types";

interface Props {
  positions: NormalizedPosition[];
  accountCurrency: string;
}

function formatCzk(value: number | null): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 0 }).format(
    value,
  );
}

function formatShortCzk(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return `${value}`;
}

const BAR_COLORS = [
  "bg-gradient-to-r from-cyan-500 to-cyan-400",
  "bg-gradient-to-r from-teal-500 to-teal-400",
  "bg-gradient-to-r from-amber-500 to-amber-400",
  "bg-gradient-to-r from-pink-500 to-pink-400",
  "bg-gradient-to-r from-violet-500 to-violet-400",
  "bg-gradient-to-r from-cyan-500 to-cyan-400",
];

export default function PortfolioSummary({
  positions,
  accountCurrency,
}: Props) {
  if (positions.length === 0) return null;

  const totalValue = positions.reduce((s, p) => s + (p.currentValue ?? 0), 0);
  if (totalValue <= 0) return null;

  // Top 6 by value
  const sorted = [...positions].sort(
    (a, b) => (b.currentValue ?? 0) - (a.currentValue ?? 0),
  );
  const top6 = sorted.slice(0, 6);
  const restValue = sorted
    .slice(6)
    .reduce((s, p) => s + (p.currentValue ?? 0), 0);

  // Best & worst performers by P/L
  const byPL = [...positions].sort(
    (a, b) => (b.profitLoss ?? 0) - (a.profitLoss ?? 0),
  );
  const best = byPL[0];
  const worst = byPL[byPL.length - 1];

  return (
    <div className="space-y-5">
      {/* Top holdings bars */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Největší pozice
          </p>
          <p className="text-xs text-slate-500">
            {formatCzk(totalValue)} {accountCurrency}
          </p>
        </div>
        <div className="space-y-2.5">
          {top6.map((p, i) => {
            const pct = ((p.currentValue ?? 0) / totalValue) * 100;
            const name = p.name ?? p.ticker;
            return (
              <div key={p.ticker} className="flex items-center gap-3">
                <span className="w-20 shrink-0 truncate text-right text-xs font-medium text-slate-400">
                  {name.length > 12 ? name.slice(0, 11) + "…" : name}
                </span>
                <div className="relative h-5 flex-1 overflow-hidden rounded-md bg-white/[0.04]">
                  <div
                    className={`h-full rounded-md transition-all duration-700 ${BAR_COLORS[i % BAR_COLORS.length]}`}
                    style={{ width: `${Math.max(pct, 0.5)}%` }}
                  />
                  <span className="absolute inset-y-0 left-2 flex items-center text-[11px] font-semibold text-white drop-shadow-sm">
                    {pct.toFixed(1)}%
                  </span>
                </div>
                <span className="w-20 shrink-0 text-right text-xs tabular-nums text-slate-300">
                  {formatShortCzk(p.currentValue ?? 0)}
                </span>
              </div>
            );
          })}
          {restValue > 0 && (
            <div className="flex items-center gap-3">
              <span className="w-20 shrink-0 truncate text-right text-xs text-slate-600">
                Ostatní ({sorted.length - 6})
              </span>
              <div className="relative h-5 flex-1 overflow-hidden rounded-md bg-white/[0.04]">
                <div
                  className="h-full rounded-md bg-gradient-to-r from-slate-600 to-slate-500"
                  style={{
                    width: `${Math.max((restValue / totalValue) * 100, 0.5)}%`,
                  }}
                />
                <span className="absolute inset-y-0 left-2 flex items-center text-[11px] font-semibold text-white drop-shadow-sm">
                  {((restValue / totalValue) * 100).toFixed(1)}%
                </span>
              </div>
              <span className="w-20 shrink-0 text-right text-xs tabular-nums text-slate-500">
                {formatShortCzk(restValue)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Best / Worst performers */}
      <div className="grid grid-cols-2 gap-3">
        {best && (
          <div className="rounded-xl bg-teal-500/5 p-3 ring-1 ring-teal-500/10">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-teal-400">
              🏆 Nejlepší
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-200">
              {best.name ?? best.ticker}
            </p>
            <p className="mt-0.5 text-xs tabular-nums text-teal-400">
              +{formatCzk(best.profitLoss)} {accountCurrency}
            </p>
          </div>
        )}
        {worst && (
          <div className="rounded-xl bg-pink-500/5 p-3 ring-1 ring-pink-500/10">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-pink-400">
              📉 Nejhorší
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-200">
              {worst.name ?? worst.ticker}
            </p>
            <p className="mt-0.5 text-xs tabular-nums text-pink-400">
              {formatCzk(worst.profitLoss)} {accountCurrency}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

