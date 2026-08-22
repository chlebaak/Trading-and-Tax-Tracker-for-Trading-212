"use client";

import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import type {
  TimeTestSummary,
  TimeTestLotBreakdown,
} from "@/lib/trading212/types";
import SegmentedControl from "./ui/SegmentedControl";
import { formatDateCz, daysToHuman, formatDecimal } from "@/lib/format";

interface Props {
  timeTestFifo: Record<string, TimeTestSummary>;
  tickerNames: Record<string, string>;
}

const TIME_TEST_DAYS = 3 * 365;

type Filter = "all" | "pending" | "soon" | "done";

interface LotRow {
  ticker: string;
  displayName: string;
  lot: TimeTestLotBreakdown;
  progressPercent: number;
  remainingDays: number;
  freeDate: Date;
}

function getDisplayName(ticker: string, tickerNames: Record<string, string>) {
  return tickerNames[ticker] || ticker.replace(/_(?:US_)?EQ$/, "");
}

function addYears(iso: string, years: number): Date {
  const d = new Date(iso);
  d.setFullYear(d.getFullYear() + years);
  return d;
}

const MONTH_FMT = new Intl.DateTimeFormat("cs-CZ", {
  month: "long",
  year: "numeric",
});

export default function TaxTimeline({ timeTestFifo, tickerNames }: Props) {
  const [filter, setFilter] = useState<Filter>("all");

  const { doneRows, monthGroups, counts } = useMemo(() => {
    const done: LotRow[] = [];
    const pending: LotRow[] = [];

    for (const [ticker, summary] of Object.entries(timeTestFifo)) {
      for (const lot of summary.heldLots) {
        const remainingDays = Math.max(0, TIME_TEST_DAYS - lot.ageDays);
        const row: LotRow = {
          ticker,
          displayName: getDisplayName(ticker, tickerNames),
          lot,
          progressPercent: Math.min(100, (lot.ageDays / TIME_TEST_DAYS) * 100),
          remainingDays,
          freeDate: addYears(lot.purchasedAt, 3),
        };
        if (lot.taxFree) done.push(row);
        else pending.push(row);
      }
    }

    // Pending: soonest tax-free date first
    pending.sort((a, b) => a.freeDate.getTime() - b.freeDate.getTime());

    // Group pending by tax-free month
    const groups = new Map<string, LotRow[]>();
    for (const row of pending) {
      const key = `${row.freeDate.getFullYear()}-${String(row.freeDate.getMonth() + 1).padStart(2, "0")}`;
      const list = groups.get(key);
      if (list) list.push(row);
      else groups.set(key, [row]);
    }

    const sortedGroups = [...groups.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, rows]) => ({
        key,
        label: MONTH_FMT.format(rows[0].freeDate),
        rows,
      }));

    const counts = {
      all: done.length + pending.length,
      pending: pending.length,
      soon: pending.filter((r) => r.remainingDays <= 90).length,
      done: done.length,
    };

    return { doneRows: done, monthGroups: sortedGroups, counts };
  }, [timeTestFifo, tickerNames]);

  const showPending = filter === "all" || filter === "pending" || filter === "soon";
  const showDone = filter === "all" || filter === "done";

  const visibleGroups =
    filter === "soon"
      ? monthGroups
          .map((g) => ({
            ...g,
            rows: g.rows.filter((r) => r.remainingDays <= 90),
          }))
          .filter((g) => g.rows.length > 0)
      : monthGroups;

  if (counts.all === 0) {
    return (
      <div className="card p-8">
        <p className="text-center text-sm text-slate-500">
          Žádné loty k zobrazení.
        </p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-4">
        <div>
          <p className="text-sm font-semibold text-slate-100">
            Kdy se loty osvobodí daně
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            Seskupeno podle měsíce, kdy uplyne 3letá doba držení
          </p>
        </div>
        <SegmentedControl<Filter>
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: `Vše (${counts.all})` },
            { value: "pending", label: `Čeká (${counts.pending})` },
            { value: "soon", label: `Do 90 dní (${counts.soon})` },
            { value: "done", label: `Hotovo (${counts.done})` },
          ]}
        />
      </div>

      <div className="divide-y divide-white/[0.05]">
        {/* Completed */}
        {showDone && doneRows.length > 0 && (
          <section className="px-5 py-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-500/15">
                <Check className="h-3 w-3 text-teal-400" />
              </span>
              <h4 className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                Již osvobozeno ({doneRows.length})
              </h4>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {doneRows.map((row, i) => (
                <span
                  key={`${row.ticker}-${i}`}
                  className="rounded-full bg-teal-500/[0.07] px-2.5 py-1 text-xs text-teal-400/90 ring-1 ring-teal-500/15"
                  title={`Koupeno ${formatDateCz(row.lot.purchasedAt)} · ${formatDecimal(row.lot.quantity)} ks`}
                >
                  {row.displayName}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Upcoming by month */}
        {showPending &&
          visibleGroups.map((group, gi) => {
            const isNearest = gi === 0;
            return (
              <section key={group.key} className="px-5 py-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h4
                    className={`text-xs font-semibold tracking-wider uppercase ${
                      isNearest ? "text-cyan-400" : "text-slate-400"
                    }`}
                  >
                    {group.label}
                    {isNearest && (
                      <span className="ml-2 rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-400 normal-case">
                        nejbližší
                      </span>
                    )}
                  </h4>
                  <span className="text-xs text-slate-600">
                    {group.rows.length}{" "}
                    {group.rows.length === 1 ? "lot" : "lotů"}
                  </span>
                </div>
                <div className="space-y-2">
                  {group.rows.map((row, i) => {
                    const soon = row.remainingDays <= 90;
                    return (
                      <div
                        key={`${row.ticker}-${row.lot.purchasedAt}-${i}`}
                        className="grid grid-cols-[minmax(6rem,9rem)_3.5rem_1fr_5rem] items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-white/[0.02]"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-xs font-medium text-slate-300">
                            {row.displayName}
                          </p>
                          <p className="text-[10px] text-slate-600">
                            koupeno {formatDateCz(row.lot.purchasedAt)}
                          </p>
                        </div>
                        <div className="text-right text-xs text-slate-400 tabular-nums">
                          {formatDecimal(row.lot.quantity)}
                        </div>
                        <div>
                          <div className="h-2 overflow-hidden rounded-full bg-white/[0.05]">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ${
                                row.progressPercent > 80
                                  ? "bg-gradient-to-r from-amber-500 to-teal-500"
                                  : "bg-gradient-to-r from-cyan-500/80 to-blue-400/80"
                              }`}
                              style={{
                                width: `${Math.max(row.progressPercent, 2)}%`,
                              }}
                            />
                          </div>
                          <p className="mt-0.5 text-[10px] text-slate-600 tabular-nums">
                            {row.progressPercent.toFixed(0)} % · volný{" "}
                            {formatDateCz(row.freeDate.toISOString())}
                          </p>
                        </div>
                        <div className="text-right">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums ${
                              soon
                                ? "bg-amber-500/10 text-amber-300"
                                : "bg-white/[0.04] text-slate-400"
                            }`}
                          >
                            {daysToHuman(row.remainingDays)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}

        {showPending && visibleGroups.length === 0 && (
          <div className="px-5 py-8 text-center text-sm text-slate-500">
            Žádné nadcházející loty
            {filter === "soon" ? " do 90 dní" : ""}.
          </div>
        )}
      </div>

      <div className="border-t border-white/[0.06] px-5 py-2.5 text-xs text-slate-600">
        {counts.done} osvobozeno · {counts.pending} čeká · {counts.soon} do 90
        dní
      </div>
    </div>
  );
}
