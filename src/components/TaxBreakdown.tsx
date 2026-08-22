"use client";

import { useState, useMemo } from "react";
import { Check } from "lucide-react";
import type {
  TimeTestSummary,
  TimeTestLotBreakdown,
} from "@/lib/trading212/types";
import Card, { CardHeader } from "./ui/Card";
import Badge from "./ui/Badge";
import {
  formatDecimal,
  formatDateCz,
  daysToHuman,
} from "@/lib/format";

interface Props {
  timeTestFifo: Record<string, TimeTestSummary>;
  tickerNames: Record<string, string>;
}

const TIME_TEST_DAYS = 3 * 365;

function getDisplayName(ticker: string, tickerNames: Record<string, string>) {
  return tickerNames[ticker] || ticker.replace(/_(?:US_)?EQ$/, "");
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
      <div className="card p-8">
        <p className="text-center text-sm text-slate-500">
          Žádné daňové položky k zobrazení.
        </p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader
        title="Rozpad FIFO podle tickeru"
        subtitle="Každý nákup samostatně · nejstarší loty první"
        right={
          <div className="flex items-center gap-2">
            <Badge tone="success">{totals.taxFree} ks osvobozeno</Badge>
            <Badge tone="warning">{totals.taxable} ks v testu</Badge>
          </div>
        }
      />

      <div className="border-b border-white/[0.06] px-5 py-4">
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
                    ? "border-cyan-500/60 bg-cyan-500/[0.08]"
                    : isFullyTaxFree
                      ? "border-teal-500/20 bg-teal-500/[0.04] hover:border-teal-500/35"
                      : "border-white/[0.06] bg-white/[0.02] hover:border-white/15"
                }`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold text-white shadow-sm ${
                    isSelected
                      ? "bg-gradient-to-br from-cyan-500 to-indigo-600"
                      : isFullyTaxFree
                        ? "bg-gradient-to-br from-teal-600 to-teal-500"
                        : "bg-gradient-to-br from-slate-700 to-slate-600"
                  }`}
                >
                  {displayName.slice(0, 1)}
                </div>
                <div className="min-w-0">
                  <p
                    className={`truncate text-sm font-semibold ${
                      isSelected ? "text-cyan-300" : "text-slate-200"
                    }`}
                  >
                    {displayName}
                  </p>
                  <div className="mt-0.5 flex items-center gap-2 text-xs">
                    <span className="text-slate-500 tabular-nums">
                      {summary.totalHeld} ks
                    </span>
                    {!isFullyTaxFree && (
                      <>
                        <span className="text-slate-700">·</span>
                        <div className="h-1.5 w-14 overflow-hidden rounded-full bg-white/[0.05]">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-teal-500 transition-all duration-700"
                            style={{ width: `${taxFreeRatio}%` }}
                          />
                        </div>
                      </>
                    )}
                    {isFullyTaxFree && (
                      <Check className="h-3 w-3 text-teal-400" />
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
          <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-xl bg-white/[0.03] px-4 py-3 ring-1 ring-white/5">
            <span className="text-sm font-semibold text-slate-200">
              {getDisplayName(selectedTicker, tickerNames)}
            </span>
            <span className="h-4 w-px bg-white/10" />
            <span className="text-sm text-slate-400 tabular-nums">
              {selectedSummary.totalHeld} ks celkem
            </span>
            <span className="h-4 w-px bg-white/10" />
            <span className="flex items-center gap-1.5 text-sm tabular-nums">
              <span className="h-2 w-2 rounded-full bg-teal-500" />
              <span className="font-medium text-teal-400">
                {selectedSummary.taxFreeQuantity} ks osvobozeno
              </span>
            </span>
            <span className="h-4 w-px bg-white/10" />
            <span className="flex items-center gap-1.5 text-sm tabular-nums">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span className="font-medium text-amber-300">
                {selectedSummary.taxableQuantity} ks v testu
              </span>
            </span>
          </div>

          <div className="overflow-hidden rounded-xl border border-white/[0.06]">
            <table className="min-w-full divide-y divide-white/[0.05] text-left text-sm">
              <thead className="bg-white/[0.03] text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                <tr>
                  {[
                    "Datum nákupu",
                    "Množství",
                    "Stáří",
                    "Do 3 let zbývá",
                    "Průběh",
                    "Status",
                  ].map((h) => (
                    <th key={h} className="px-4 py-3 whitespace-nowrap">
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

      <div className="border-t border-white/[0.06] px-5 py-2.5 text-xs text-slate-600 tabular-nums">
        {tickers.length} tickerů · {totals.total} ks celkem
      </div>
    </Card>
  );
}

function TaxLotRow({ lot }: { lot: TimeTestLotBreakdown }) {
  const progressPercent = Math.min(100, (lot.ageDays / TIME_TEST_DAYS) * 100);
  const remainingDays = Math.max(0, TIME_TEST_DAYS - lot.ageDays);
  const isComplete = lot.taxFree;
  return (
    <tr className="align-middle transition-colors hover:bg-white/[0.03]">
      <td className="px-4 py-3 whitespace-nowrap text-slate-400">
        {formatDateCz(lot.purchasedAt)}
      </td>
      <td className="px-4 py-3 font-semibold text-slate-200 tabular-nums whitespace-nowrap">
        {formatDecimal(lot.quantity)} ks
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-slate-500">
        {daysToHuman(lot.ageDays)}
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        {isComplete ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-teal-500/10 px-2 py-0.5 text-xs font-semibold text-teal-400">
            <Check className="h-3 w-3" /> Splněno
          </span>
        ) : (
          <span className="text-sm font-medium text-amber-300 tabular-nums">
            {daysToHuman(remainingDays)}
          </span>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-2 w-20 overflow-hidden rounded-full bg-white/[0.05]">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                isComplete
                  ? "bg-gradient-to-r from-teal-500 to-teal-400"
                  : progressPercent > 80
                    ? "bg-gradient-to-r from-amber-500 to-teal-500"
                    : "bg-gradient-to-r from-cyan-500 to-blue-500"
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-xs text-slate-600 tabular-nums">
            {Math.round(progressPercent)} %
          </span>
        </div>
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${
            isComplete
              ? "bg-teal-500/10 text-teal-400"
              : "bg-amber-500/10 text-amber-300"
          }`}
        >
          {isComplete ? "Osvobozeno" : "V testu"}
        </span>
      </td>
    </tr>
  );
}
