"use client";

import { CalendarClock } from "lucide-react";
import type { TimeTestSummary } from "@/lib/trading212/types";
import { formatDateCz, daysToHuman, formatDecimal } from "@/lib/format";

interface Props {
  timeTestFifo: Record<string, TimeTestSummary>;
  tickerNames: Record<string, string>;
}

const TIME_TEST_DAYS = 3 * 365;

function getDisplayName(ticker: string, tickerNames: Record<string, string>) {
  return tickerNames[ticker] || ticker.replace(/_(?:US_)?EQ$/, "");
}

interface Milestone {
  ticker: string;
  displayName: string;
  quantity: number;
  remainingDays: number;
  freeDateIso: string | null;
}

export default function NextMilestone({ timeTestFifo, tickerNames }: Props) {
  let next: Milestone | null = null;

  for (const [ticker, summary] of Object.entries(timeTestFifo)) {
    for (const lot of summary.heldLots) {
      if (lot.taxFree) continue;
      const remainingDays = Math.max(0, TIME_TEST_DAYS - lot.ageDays);
      if (!next || remainingDays < next.remainingDays) {
        // Approximate the tax-free date from today + remaining days
        const free = new Date();
        free.setDate(free.getDate() + remainingDays);
        next = {
          ticker,
          displayName: getDisplayName(ticker, tickerNames),
          quantity: lot.quantity,
          remainingDays,
          freeDateIso: free.toISOString(),
        };
      }
    }
  }

  return (
    <div className="card flex items-center gap-4 p-5">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 ring-1 ring-cyan-500/20">
        <CalendarClock className="h-5 w-5 text-cyan-400" />
      </div>
      {next ? (
        <>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
              Nejbližší osvobození (časový test)
            </p>
            <p className="mt-0.5 truncate text-sm text-slate-300">
              <strong className="font-semibold text-slate-100">
                {next.displayName}
              </strong>{" "}
              · {formatDecimal(next.quantity)} ks ·{" "}
              {next.freeDateIso ? formatDateCz(next.freeDateIso) : "—"}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-xl font-bold text-cyan-400 tabular-nums">
              {daysToHuman(next.remainingDays)}
            </p>
            <p className="text-[11px] text-slate-500">do osvobození</p>
          </div>
        </>
      ) : (
        <div>
          <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
            Nejbližší osvobození
          </p>
          <p className="mt-0.5 text-sm text-slate-400">
            Všechny držené pozice jsou již osvobozeny ✓
          </p>
        </div>
      )}
    </div>
  );
}
