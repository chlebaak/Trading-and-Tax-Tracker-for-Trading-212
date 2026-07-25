"use client";

import { useState, useMemo } from "react";
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
function formatDecimal(value: number): string {
  return new Intl.NumberFormat("cs-CZ", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
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
function daysToYearsMonths(days: number): string {
  const years = Math.floor(days / 365);
  const months = Math.floor((days % 365) / 30);
  if (years > 0 && months > 0) return `${years}r ${months}m`;
  if (years > 0) return `${years} roky`;
  if (months > 0) return `${months} měsíců`;
  return `${days} dní`;
}

export default function TaxBreakdown({ timeTestFifo, tickerNames }: Props) {
  const tickers = useMemo(
    () => Object.keys(timeTestFifo).sort(),
    [timeTestFifo],
  );
  const [selectedTicker, setSelectedTicker] = useState<string | null>(
    tickers.length > 0 ? tickers[0] : null,
  );
  const selectedSummary = selectedTicker ? timeTestFifo[selectedTicker] : null;
  const totals = useMemo(() => {
    let taxFree = 0,
      taxable = 0;
    for (const s of Object.values(timeTestFifo)) {
      taxFree += s.taxFreeQuantity;
      taxable += s.taxableQuantity;
    }
    return { taxFree, taxable, total: taxFree + taxable };
  }, [timeTestFifo]);

  if (tickers.length === 0) {
    return (
      <div className="rounded-2xl border border-white/[0.04] bg-white/[0.03] p-8">
        <p className="text-center text-sm text-slate-500">
          Žádné daňové položky k zobrazení.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/[0.04] bg-white/[0.03]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.04] px-5 py-4">
        <div>
          <p className="text-sm font-semibold text-slate-200">
            Rozpad FIFO podle tickeru
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            Každý nákup samostatně · nejstarší loty první
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-500/10 px-2.5 py-1 text-xs font-semibold text-teal-400">
            <span className="h-2 w-2 rounded-full bg-teal-500" />
            {totals.taxFree} ks
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-400">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            {totals.taxable} ks
          </span>
        </div>
      </div>

      <div className="border-b border-white/[0.04] px-5 py-4">
        <div className="flex flex-wrap gap-2">
          {tickers.map((ticker) => {
            const summary = timeTestFifo[ticker];
            const isSelected = selectedTicker === ticker;
            const taxFreeRatio =
              summary.totalHeld > 0
                ? Math.round(
                    (summary.taxFreeQuantity / summary.totalHeld) * 100,
                  )
                : 0;
            const displayName = getDisplayName(ticker, tickerNames);
            const isFullyTaxFree = taxFreeRatio >= 100;
            return (
              <button
                key={ticker}
                onClick={() =>
                  setSelectedTicker((prev) => (prev === ticker ? null : ticker))
                }
                className={`group relative flex items-center gap-3 overflow-hidden rounded-xl border px-4 py-3 text-left transition-all ${
                  isSelected
                    ? "border-cyan-500 bg-cyan-500/10"
                    : isFullyTaxFree
                      ? "border-teal-500/20 bg-teal-500/5 hover:border-teal-500/30"
                      : "border-white/[0.04] bg-white/[0.01] hover:border-white/10"
                }`}
              >
                {isFullyTaxFree && (
                  <div className="absolute inset-0 bg-teal-500/5" />
                )}
                <div
                  className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold text-white shadow-sm ${
                    isSelected
                      ? "bg-gradient-to-br from-cyan-500 to-indigo-600"
                      : isFullyTaxFree
                        ? "bg-gradient-to-br from-teal-600 to-teal-500"
                        : "bg-gradient-to-br from-slate-700 to-slate-600"
                  }`}
                >
                  {displayName.slice(0, 1)}
                </div>
                <div className="relative min-w-0">
                  <p
                    className={`truncate text-sm font-semibold ${isSelected ? "text-indigo-300" : "text-slate-200"}`}
                  >
                    {displayName}
                  </p>
                  <div className="mt-0.5 flex items-center gap-2 text-xs">
                    <span className="text-slate-500">
                      {summary.totalHeld} ks
                    </span>
                    {!isFullyTaxFree && (
                      <>
                        <span className="text-slate-700">·</span>
                        <div className="h-1.5 w-14 overflow-hidden rounded-full bg-white/[0.04]">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-teal-500"
                            style={{ width: `${taxFreeRatio}%` }}
                          />
                        </div>
                      </>
                    )}
                    {isFullyTaxFree && (
                      <span className="rounded-full bg-teal-500/20 px-1.5 py-0.5 text-[10px] font-bold text-teal-400">
                        ✓
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {selectedSummary && selectedTicker && (
        <div className="px-5 py-4">
          <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl bg-white/[0.03] px-4 py-3 ring-1 ring-white/5">
            <span className="text-sm font-semibold text-slate-200">
              {getDisplayName(selectedTicker, tickerNames)}
            </span>
            <span className="h-4 w-px bg-white/10" />
            <span className="text-sm text-slate-400">
              {selectedSummary.totalHeld} ks celkem
            </span>
            <span className="h-4 w-px bg-white/10" />
            <span className="flex items-center gap-1.5 text-sm">
              <span className="h-2 w-2 rounded-full bg-teal-500" />
              <span className="text-teal-400 font-medium">
                {selectedSummary.taxFreeQuantity} ks osvobozeno
              </span>
            </span>
            <span className="h-4 w-px bg-white/10" />
            <span className="flex items-center gap-1.5 text-sm">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span className="text-amber-400 font-medium">
                {selectedSummary.taxableQuantity} ks v testu
              </span>
            </span>
          </div>

          <div className="overflow-hidden rounded-xl border border-white/[0.04]">
            <table className="min-w-full divide-y divide-white/[0.04] text-left text-sm">
              <thead className="bg-white/[0.03] text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  {[
                    "Datum nákupu",
                    "Množství",
                    "Stáří",
                    "Do 3 let zbývá",
                    "Průběh",
                    "Status",
                  ].map((h) => (
                    <th key={h} className="px-4 py-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {selectedSummary.heldLots.map((lot, i) => (
                  <TaxLotRow key={i} lot={lot} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="border-t border-white/[0.04] px-5 py-2.5 text-xs text-slate-600">
        {tickers.length} tickerů · {totals.total} ks celkem
      </div>
    </div>
  );
}

function TaxLotRow({ lot }: { lot: TimeTestLotBreakdown }) {
  const progressPercent = Math.min(100, (lot.ageDays / TIME_TEST_DAYS) * 100);
  const remainingDays = Math.max(0, TIME_TEST_DAYS - lot.ageDays);
  const isComplete = lot.taxFree;
  return (
    <tr className="group align-middle transition-colors hover:bg-white/[0.03]">
      <td className="px-4 py-3 text-slate-400">
        {formatDate(lot.purchasedAt)}
      </td>
      <td className="px-4 py-3 font-semibold text-slate-200 tabular-nums">
        {formatDecimal(lot.quantity)} ks
      </td>
      <td className="px-4 py-3 text-slate-500">
        {daysToYearsMonths(lot.ageDays)}
      </td>
      <td className="px-4 py-3">
        {isComplete ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-teal-500/10 px-2 py-0.5 text-xs font-semibold text-teal-400">
            ✓ Splněno
          </span>
        ) : (
          <span className="text-sm font-medium text-amber-400">
            {daysToYearsMonths(remainingDays)}
          </span>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-2 w-20 overflow-hidden rounded-full bg-white/[0.04]">
            <div
              className={`h-full rounded-full transition-all duration-700 ${isComplete ? "bg-gradient-to-r from-teal-500 to-teal-400" : progressPercent > 80 ? "bg-gradient-to-r from-amber-500 to-teal-500" : "bg-gradient-to-r from-cyan-500 to-blue-500"}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-xs tabular-nums text-slate-600">
            {Math.round(progressPercent)}%
          </span>
        </div>
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${isComplete ? "bg-teal-500/10 text-teal-400" : "bg-amber-500/10 text-amber-400"}`}
        >
          {isComplete ? "Osvobozeno" : "V testu"}
        </span>
      </td>
    </tr>
  );
}

