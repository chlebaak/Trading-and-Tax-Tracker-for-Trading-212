"use client";

import { useMemo, useState } from "react";
import type {
  TimeTestSummary,
  TimeTestLotBreakdown,
} from "@/lib/trading212/types";

interface Props {
  timeTestFifo: Record<string, TimeTestSummary>;
  tickerNames: Record<string, string>;
}

const TIME_TEST_DAYS = 3 * 365;

function getDisplayName(ticker: string, tickerNames: Record<string, string>) {
  return tickerNames[ticker] || ticker.replace(/_(?:US_)?EQ$/, "");
}

function formatDate(isoString: string): string {
  try {
    return new Date(isoString).toLocaleDateString("cs-CZ", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return isoString;
  }
}

function daysToRemaining(days: number): string {
  if (days <= 0) return "✓";
  const years = Math.floor(days / 365);
  const months = Math.floor((days % 365) / 30);
  if (years > 0 && months > 0) return `${years}r ${months}m`;
  if (years > 0) return `${years}r`;
  if (months > 0) return `${months}m`;
  return `${days}d`;
}

interface LotRow {
  ticker: string;
  displayName: string;
  lot: TimeTestLotBreakdown;
  progressPercent: number;
  remainingDays: number;
}

export default function TaxTimeline({ timeTestFifo, tickerNames }: Props) {
  const [filter, setFilter] = useState<"all" | "pending" | "soon" | "done">(
    "all",
  );

  const allLots = useMemo(() => {
    const lots: LotRow[] = [];
    for (const [ticker, summary] of Object.entries(timeTestFifo)) {
      for (const lot of summary.heldLots) {
        const remainingDays = Math.max(0, TIME_TEST_DAYS - lot.ageDays);
        lots.push({
          ticker,
          displayName: getDisplayName(ticker, tickerNames),
          lot,
          progressPercent: Math.min(100, (lot.ageDays / TIME_TEST_DAYS) * 100),
          remainingDays,
        });
      }
    }
    // Sort: pending first (closest to tax-free at top), then completed
    lots.sort((a, b) => {
      if (a.lot.taxFree !== b.lot.taxFree) return a.lot.taxFree ? 1 : -1;
      return b.progressPercent - a.progressPercent;
    });
    return lots;
  }, [timeTestFifo, tickerNames]);

  const filtered = useMemo(() => {
    switch (filter) {
      case "pending":
        return allLots.filter((l) => !l.lot.taxFree);
      case "soon":
        return allLots.filter((l) => !l.lot.taxFree && l.remainingDays <= 90);
      case "done":
        return allLots.filter((l) => l.lot.taxFree);
      default:
        return allLots;
    }
  }, [allLots, filter]);

  const counts = {
    all: allLots.length,
    pending: allLots.filter((l) => !l.lot.taxFree).length,
    soon: allLots.filter((l) => !l.lot.taxFree && l.remainingDays <= 90).length,
    done: allLots.filter((l) => l.lot.taxFree).length,
  };

  if (allLots.length === 0) {
    return (
      <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] p-8">
        <p className="text-center text-sm text-slate-500">
          Žádné loty k zobrazení.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.04] px-5 py-4">
        <div>
          <p className="text-sm font-semibold text-slate-200">
            Časová osa lotů
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            Kdy bude který nákup osvobozen od daně
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-xl bg-white/[0.04] p-1">
          {(["all", "pending", "soon", "done"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${filter === f ? "bg-white/10 text-slate-200" : "text-slate-500 hover:text-slate-300"}`}
            >
              {f === "all"
                ? `Vše (${counts.all})`
                : f === "pending"
                  ? `Čeká (${counts.pending})`
                  : f === "soon"
                    ? `Do 90 dní (${counts.soon})`
                    : `Hotovo (${counts.done})`}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 py-3">
        <div className="space-y-1">
          {/* Header */}
          <div className="flex items-center gap-3 px-1 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
            <span className="w-28 shrink-0">Akcie</span>
            <span className="w-16 shrink-0 text-right">Množství</span>
            <span className="flex-1">Průběh</span>
            <span className="w-20 shrink-0 text-right">Zbývá</span>
          </div>

          {filtered.map((row, i) => {
            const isComplete = row.lot.taxFree;
            return (
              <div
                key={`${row.ticker}-${row.lot.purchasedAt}-${i}`}
                className={`flex items-center gap-3 rounded-lg px-1 py-2 transition-colors hover:bg-white/[0.02] ${isComplete ? "opacity-60" : ""}`}
              >
                {/* Name */}
                <div className="w-28 shrink-0">
                  <p className="truncate text-xs font-medium text-slate-300">
                    {row.displayName}
                  </p>
                  <p className="text-[10px] text-slate-600">
                    {formatDate(row.lot.purchasedAt)}
                  </p>
                </div>

                {/* Quantity */}
                <div className="w-16 shrink-0 text-right text-xs tabular-nums text-slate-400">
                  {row.lot.quantity.toFixed(2)} ks
                </div>

                {/* Progress bar */}
                <div className="flex-1">
                  <div className="h-3 overflow-hidden rounded-full bg-white/[0.04]">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        isComplete
                          ? "bg-gradient-to-r from-teal-500 to-teal-400"
                          : row.progressPercent > 80
                            ? "bg-gradient-to-r from-amber-500 to-teal-500"
                            : row.progressPercent > 50
                              ? "bg-gradient-to-r from-cyan-500 to-blue-400"
                              : "bg-gradient-to-r from-slate-600 to-slate-500"
                      }`}
                      style={{ width: `${Math.max(row.progressPercent, 2)}%` }}
                    />
                  </div>
                  <div className="mt-0.5 flex justify-between text-[10px] text-slate-600">
                    <span>{row.progressPercent.toFixed(0)}%</span>
                    <span>
                      {isComplete ? "" : `${row.progressPercent.toFixed(0)}%`}
                    </span>
                  </div>
                </div>

                {/* Remaining */}
                <div className="w-20 shrink-0 text-right">
                  {isComplete ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-teal-500/10 px-2 py-0.5 text-[10px] font-semibold text-teal-400">
                      ✓ Hotovo
                    </span>
                  ) : row.remainingDays <= 90 ? (
                    <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
                      {daysToRemaining(row.remainingDays)}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500">
                      {daysToRemaining(row.remainingDays)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="border-t border-white/[0.04] px-5 py-2.5 text-xs text-slate-600">
        {filtered.length} lotů · {counts.done} osvobozeno · {counts.soon} do 90
        dní
      </div>
    </div>
  );
}

