"use client";

import { useState, useMemo } from "react";
import type { NormalizedPosition } from "@/lib/trading212/types";

type SortField =
  | "ticker"
  | "quantity"
  | "avgPrice"
  | "currentPrice"
  | "value"
  | "pl";
type SortDir = "asc" | "desc";
type PLFilter = "all" | "profit" | "loss";

interface SortIconProps {
  field: SortField;
  currentField: SortField;
  currentDir: SortDir;
}

function SortIcon({ field, currentField, currentDir }: SortIconProps) {
  if (currentField !== field)
    return (
      <svg className="ml-1 h-3 w-3 opacity-30" viewBox="0 0 10 14" fill="none">
        <path d="M5 0L9 6H1L5 0Z" fill="currentColor" />
        <path d="M5 14L1 8H9L5 14Z" fill="currentColor" />
      </svg>
    );
  return (
    <svg
      className={`ml-1 h-3 w-3 transition-transform ${currentDir === "desc" ? "" : "rotate-180"}`}
      viewBox="0 0 10 6"
      fill="none"
    >
      <path d="M5 6L9 0H1L5 6Z" fill="currentColor" />
    </svg>
  );
}

interface Props {
  positions: NormalizedPosition[];
  accountCurrency: string;
}

function formatCzk(value: number | null | undefined): string {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 0 }).format(
    value,
  );
}
function formatDecimal(value: number | null | undefined): string {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("cs-CZ", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
function formatShortNumber(value: number | null | undefined): string {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return formatCzk(value);
}

export default function PortfolioPositions({
  positions,
  accountCurrency,
}: Props) {
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("value");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [plFilter, setPlFilter] = useState<PLFilter>("all");

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const filtered = useMemo(() => {
    let result = [...positions];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (p) =>
          p.ticker.toLowerCase().includes(q) ||
          (p.name && p.name.toLowerCase().includes(q)),
      );
    }
    if (plFilter === "profit")
      result = result.filter((p) => (p.profitLoss ?? 0) >= 0);
    else if (plFilter === "loss")
      result = result.filter((p) => (p.profitLoss ?? 0) < 0);
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "ticker":
          cmp = a.ticker.localeCompare(b.ticker);
          break;
        case "quantity":
          cmp = a.quantity - b.quantity;
          break;
        case "avgPrice":
          cmp = (a.averagePrice ?? 0) - (b.averagePrice ?? 0);
          break;
        case "currentPrice":
          cmp = (a.currentPrice ?? 0) - (b.currentPrice ?? 0);
          break;
        case "value":
          cmp = (a.currentValue ?? 0) - (b.currentValue ?? 0);
          break;
        case "pl":
          cmp = (a.profitLoss ?? 0) - (b.profitLoss ?? 0);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return result;
  }, [positions, search, sortField, sortDir, plFilter]);

  const totalValue = positions.reduce((s, p) => s + (p.currentValue ?? 0), 0);
  const totalPL = positions.reduce((s, p) => s + (p.profitLoss ?? 0), 0);
  const profitCount = positions.filter((p) => (p.profitLoss ?? 0) >= 0).length;
  const lossCount = positions.filter((p) => (p.profitLoss ?? 0) < 0).length;

  const thClass =
    "px-4 py-3 font-semibold cursor-pointer select-none hover:text-slate-300 transition-colors";
  const thInner = "inline-flex items-center whitespace-nowrap";

  if (positions.length === 0)
    return (
      <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] p-8">
        <p className="text-center text-sm text-slate-500">
          Žádné otevřené pozice k zobrazení.
        </p>
      </div>
    );

  return (
    <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02]">
      <div className="flex flex-col gap-3 border-b border-white/[0.04] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-white/[0.04] px-2.5 py-1 text-xs font-semibold text-slate-400">
            {positions.length} pozic
          </span>
          <span className="rounded-full bg-teal-500/10 px-2.5 py-1 text-xs font-semibold text-teal-400">
            {formatShortNumber(totalValue)} {accountCurrency}
          </span>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${totalPL >= 0 ? "bg-teal-500/10 text-teal-400" : "bg-pink-500/10 text-pink-400"}`}
          >
            {totalPL >= 0 ? "↑" : "↓"} {formatShortNumber(Math.abs(totalPL))}{" "}
            {accountCurrency}
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-3 border-b border-white/[0.04] px-5 py-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-xs">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
            />
          </svg>
          <input
            type="text"
            placeholder="Hledat ticker nebo název..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2 pl-10 pr-4 text-sm text-slate-200 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-colors"
          />
        </div>
        <div className="flex items-center gap-1 rounded-xl bg-white/[0.04] p-1">
          {(["all", "profit", "loss"] as PLFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setPlFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${plFilter === f ? "bg-white/10 text-slate-200" : "text-slate-500 hover:text-slate-300"}`}
            >
              {f === "all"
                ? `Vše (${positions.length})`
                : f === "profit"
                  ? `🟢 Zisk (${profitCount})`
                  : `🔴 Ztráta (${lossCount})`}
            </button>
          ))}
        </div>
      </div>

      <div className="hidden overflow-x-auto lg:block">
        <table className="min-w-full divide-y divide-white/[0.04] text-left text-sm">
          <thead className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th className={thClass} onClick={() => handleSort("ticker")}>
                <span className={thInner}>
                  Ticker{" "}
                  <SortIcon
                    field="ticker"
                    currentField={sortField}
                    currentDir={sortDir}
                  />
                </span>
              </th>
              <th className="px-4 py-3">Název</th>
              <th className={thClass} onClick={() => handleSort("quantity")}>
                <span className={thInner}>
                  Množství{" "}
                  <SortIcon
                    field="quantity"
                    currentField={sortField}
                    currentDir={sortDir}
                  />
                </span>
              </th>
              <th className={thClass} onClick={() => handleSort("avgPrice")}>
                <span className={thInner}>
                  Prům. cena{" "}
                  <SortIcon
                    field="avgPrice"
                    currentField={sortField}
                    currentDir={sortDir}
                  />
                </span>
              </th>
              <th
                className={thClass}
                onClick={() => handleSort("currentPrice")}
              >
                <span className={thInner}>
                  Akt. cena{" "}
                  <SortIcon
                    field="currentPrice"
                    currentField={sortField}
                    currentDir={sortDir}
                  />
                </span>
              </th>
              <th className={thClass} onClick={() => handleSort("value")}>
                <span className={thInner}>
                  Hodnota{" "}
                  <SortIcon
                    field="value"
                    currentField={sortField}
                    currentDir={sortDir}
                  />
                </span>
              </th>
              <th className={thClass} onClick={() => handleSort("pl")}>
                <span className={thInner}>
                  Zisk / Ztráta{" "}
                  <SortIcon
                    field="pl"
                    currentField={sortField}
                    currentDir={sortDir}
                  />
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {filtered.map((position, index) => {
              const tk = position.ticker || `UNKNOWN_${index + 1}`;
              const isGreen = (position.profitLoss ?? 0) >= 0;
              const valueRatio =
                totalValue > 0
                  ? ((position.currentValue ?? 0) / totalValue) * 100
                  : 0;
              return (
                <tr
                  key={`${tk}-${index}`}
                  className={`group relative align-middle transition-colors hover:bg-white/[0.02] border-l-[3px] ${isGreen ? "border-l-teal-500" : "border-l-pink-500"}`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-lg text-[11px] font-bold text-white ${isGreen ? "bg-gradient-to-br from-teal-600 to-teal-500" : "bg-gradient-to-br from-slate-700 to-slate-600"}`}
                      >
                        {tk.slice(0, 1)}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-200">
                          {tk}
                        </span>
                        <div className="mt-0.5 h-1 w-12 overflow-hidden rounded-full bg-white/[0.04]">
                          <div
                            className={`h-full rounded-full ${isGreen ? "bg-teal-500/50" : "bg-slate-500"}`}
                            style={{ width: `${valueRatio}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {position.name ?? tk}
                  </td>
                  <td className="px-4 py-3 text-slate-300 tabular-nums">
                    {formatDecimal(position.quantity)}
                  </td>
                  <td className="px-4 py-3 text-slate-300 tabular-nums">
                    {position.averagePrice != null
                      ? formatDecimal(position.averagePrice)
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-300 tabular-nums">
                    {position.currentPrice != null
                      ? formatDecimal(position.currentPrice)
                      : "—"}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-100 tabular-nums">
                    {formatCzk(position.currentValue)}
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${isGreen ? "bg-teal-500/10 text-teal-400" : "bg-pink-500/10 text-pink-400"}`}
                    >
                      {isGreen ? "▲" : "▼"} {formatCzk(position.profitLoss)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 p-4 lg:hidden">
        {filtered.map((position, index) => {
          const tk = position.ticker || `UNKNOWN_${index + 1}`;
          const isGreen = (position.profitLoss ?? 0) >= 0;
          return (
            <div
              key={`${tk}-${index}`}
              className="overflow-hidden rounded-xl border border-white/[0.04] bg-white/[0.01]"
            >
              <div
                className={`flex items-center justify-between gap-3 px-4 py-3 ${isGreen ? "bg-teal-500/5" : "bg-pink-500/5"}`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold text-white ${isGreen ? "bg-gradient-to-br from-teal-600 to-teal-500" : "bg-gradient-to-br from-slate-700 to-slate-600"}`}
                  >
                    {tk.slice(0, 1)}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-200">{tk}</p>
                    <p className="text-xs text-slate-500">
                      {position.name ?? tk}
                    </p>
                  </div>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-bold ${isGreen ? "bg-teal-500/10 text-teal-400" : "bg-pink-500/10 text-pink-400"}`}
                >
                  {isGreen ? "▲" : "▼"} {formatShortNumber(position.profitLoss)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 px-4 py-3 text-sm">
                {[
                  ["Množství", formatDecimal(position.quantity)],
                  [
                    "Prům. cena",
                    position.averagePrice != null
                      ? formatDecimal(position.averagePrice)
                      : "—",
                  ],
                  [
                    "Akt. cena",
                    position.currentPrice != null
                      ? formatDecimal(position.currentPrice)
                      : "—",
                  ],
                  ["Hodnota", formatCzk(position.currentValue)],
                ].map(([l, v]) => (
                  <div key={l as string}>
                    <div className="text-slate-500">{l}</div>
                    <div className="text-right font-medium text-slate-200 tabular-nums">
                      {v}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && search && (
        <div className="px-5 py-8 text-center text-sm text-slate-500">
          Pro hledání &ldquo;{search}&rdquo; nebyly nalezeny žádné pozice.
        </div>
      )}
      <div className="border-t border-white/[0.04] px-5 py-2.5 text-xs text-slate-600">
        Zobrazeno {filtered.length} z {positions.length} pozic
      </div>
    </div>
  );
}

