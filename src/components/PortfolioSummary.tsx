"use client";

import { Trophy, TrendingDown } from "lucide-react";
import type { NormalizedPosition } from "@/lib/trading212/types";
import { formatCzk, formatPercent, signed } from "@/lib/format";

interface Props {
  positions: NormalizedPosition[];
  accountCurrency: string;
}

function plPercent(p: NormalizedPosition): number | null {
  if (p.profitLoss == null || p.currentValue == null) return null;
  const cost = p.currentValue - p.profitLoss;
  if (cost <= 0) return null;
  return (p.profitLoss / cost) * 100;
}

export default function PortfolioSummary({ positions }: Props) {
  if (positions.length === 0) return null;

  const withPL = positions.filter((p) => p.profitLoss != null);
  if (withPL.length === 0) return null;

  const byPL = [...withPL].sort((a, b) => b.profitLoss! - a.profitLoss!);
  const best = byPL[0];
  const worst = byPL[byPL.length - 1];

  const profitCount = withPL.filter((p) => p.profitLoss! >= 0).length;
  const lossCount = withPL.length - profitCount;
  const profitRatio =
    withPL.length > 0 ? (profitCount / withPL.length) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Win/loss split */}
      <div>
        <div className="flex h-2 w-full overflow-hidden rounded-full bg-rose-500/25">
          <div
            className="h-full rounded-l-full bg-teal-400 transition-all duration-700"
            style={{ width: `${profitRatio}%` }}
          />
        </div>
        <p className="mt-1.5 text-xs text-slate-500">
          {profitCount} ziskových · {lossCount} ztrátových
        </p>
      </div>

      {best && worst && (
        <div className="grid gap-3">
          <PerformerCard
            kind="best"
            name={best.name ?? best.ticker}
            pl={best.profitLoss ?? 0}
            pct={plPercent(best)}
          />
          <PerformerCard
            kind="worst"
            name={worst.name ?? worst.ticker}
            pl={worst.profitLoss ?? 0}
            pct={plPercent(worst)}
          />
        </div>
      )}
    </div>
  );
}

function PerformerCard({
  kind,
  name,
  pl,
  pct,
}: {
  kind: "best" | "worst";
  name: string;
  pl: number;
  pct: number | null;
}) {
  const isBest = kind === "best";
  return (
    <div
      className={`card-hover rounded-xl p-3.5 ring-1 ${
        isBest ? "bg-teal-500/[0.06] ring-teal-500/15" : "bg-rose-500/[0.06] ring-rose-500/15"
      }`}
    >
      <p
        className={`flex items-center gap-1.5 text-[10px] font-semibold tracking-wider uppercase ${
          isBest ? "text-teal-400" : "text-rose-400"
        }`}
      >
        {isBest ? (
          <Trophy className="h-3 w-3" />
        ) : (
          <TrendingDown className="h-3 w-3" />
        )}
        {isBest ? "Nejlepší pozice" : "Nejhorší pozice"}
      </p>
      <div className="mt-1.5 flex items-baseline justify-between gap-3">
        <p className="truncate text-sm font-semibold text-slate-200">{name}</p>
        <p
          className={`shrink-0 text-sm font-bold tabular-nums ${
            isBest ? "text-teal-400" : "text-rose-400"
          }`}
        >
          {signed(pl)}
          {formatCzk(Math.abs(pl))} Kč
          {pct !== null && (
            <span className="ml-1.5 text-xs font-medium opacity-75">
              ({formatPercent(pct, 1)})
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
