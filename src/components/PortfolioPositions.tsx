"use client";

import { useState, useMemo } from "react";
import { Search, ChevronsUpDown, ArrowUp, ArrowDown } from "lucide-react";
import type { NormalizedPosition } from "@/lib/trading212/types";
import SegmentedControl from "./ui/SegmentedControl";
import {
  formatCzk,
  formatDecimal,
  formatShortNumber,
  formatPercent,
  signed,
} from "@/lib/format";

type SortField =
  | "ticker"
  | "quantity"
  | "avgPrice"
  | "currentPrice"
  | "value"
  | "plPct"
  | "pl";
type SortDir = "asc" | "desc";
type PLFilter = "all" | "profit" | "loss";

function plPercent(p: NormalizedPosition): number | null {
  if (p.profitLoss == null || p.currentValue == null) return null;
  const cost = p.currentValue - p.profitLoss;
  if (cost <= 0) return null;
  return (p.profitLoss / cost) * 100;
}

interface SortIconProps {
  field: SortField;
  currentField: SortField;
  currentDir: SortDir;
}

function SortIcon({ field, currentField, currentDir }: SortIconProps) {
  if (currentField !== field)
    return <ChevronsUpDown className="ml-1 h-3 w-3 opacity-30" />;
  return currentDir === "desc" ? (
    <ArrowDown className="ml-1 h-3 w-3" />
  ) : (
    <ArrowUp className="ml-1 h-3 w-3" />
  );
}

interface Props {
  positions: NormalizedPosition[];
  accountCurrency: string;
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
        case "plPct":
          cmp = (plPercent(a) ?? 0) - (plPercent(b) ?? 0);
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
    "px-4 py-3 font-semibold cursor-pointer select-none hover:text-slate-300 transition-colors whitespace-nowrap";
  const thInner = "inline-flex items-center";

  if (positions.length === 0)
    return (
      <div className="card p-8">
        <p className="text-center text-sm text-slate-500">
          Žádné otevřené pozice k zobrazení.
        </p>
      </div>
    );

  return (
    <div className="card overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 border-b border-white/[0.06] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-white/[0.05] px-2.5 py-1 text-xs font-semibold text-slate-400">
            {positions.length} pozic
          </span>
          <span className="rounded-full bg-teal-500/10 px-2.5 py-1 text-xs font-semibold text-teal-400 tabular-nums">
            {formatShortNumber(totalValue)} {accountCurrency}
          </span>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums ${
              totalPL >= 0
                ? "bg-teal-500/10 text-teal-400"
                : "bg-rose-500/10 text-rose-400"
            }`}
          >
            {signed(totalPL)} {formatShortNumber(Math.abs(totalPL))}{" "}
            {accountCurrency}
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-3 border-b border-white/[0.06] px-5 py-3 sm:flex-row sm:items-center">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Hledat ticker nebo název..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2 pr-4 pl-10 text-sm text-slate-200 transition-colors placeholder:text-slate-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none"
          />
        </div>
        <SegmentedControl<PLFilter>
          value={plFilter}
          onChange={setPlFilter}
          options={[
            { value: "all", label: `Vše (${positions.length})` },
            {
              value: "profit",
              label: (
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
                  Zisk ({profitCount})
                </span>
              ),
            },
            {
              value: "loss",
              label: (
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                  Ztráta ({lossCount})
                </span>
              ),
            },
          ]}
        />
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-clip lg:block">
        <table className="min-w-full divide-y divide-white/[0.05] text-left text-sm">
          <thead className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
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
              <th className={thClass} onClick={() => handleSort("currentPrice")}>
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
              <th className={thClass} onClick={() => handleSort("plPct")}>
                <span className={thInner}>
                  Změna %{" "}
                  <SortIcon
                    field="plPct"
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
              const pct = plPercent(position);
              const valueRatio =
                totalValue > 0
                  ? ((position.currentValue ?? 0) / totalValue) * 100
                  : 0;
              return (
                <tr
                  key={`${tk}-${index}`}
                  className={`group align-middle transition-colors hover:bg-white/[0.03] border-l-2 ${
                    isGreen ? "border-l-teal-500/70" : "border-l-rose-500/70"
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold text-white ${
                          isGreen
                            ? "bg-gradient-to-br from-teal-600 to-teal-500"
                            : "bg-gradient-to-br from-slate-700 to-slate-600"
                        }`}
                      >
                        {tk.slice(0, 1)}
                      </div>
                      <span className="font-semibold text-slate-200">
                        {tk}
                      </span>
                    </div>
                  </td>
                  <td className="max-w-44 truncate px-4 py-3 text-slate-400">
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
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-100 tabular-nums">
                      {formatCzk(position.currentValue)}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5">
                      <div className="h-1 w-16 overflow-hidden rounded-full bg-white/[0.05]">
                        <div
                          className="h-full rounded-full bg-cyan-400/60"
                          style={{ width: `${valueRatio}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-600 tabular-nums">
                        {valueRatio.toFixed(0)} %
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    <span
                      className={`text-sm font-semibold ${
                        pct == null
                          ? "text-slate-500"
                          : isGreen
                            ? "text-teal-400"
                            : "text-rose-400"
                      }`}
                    >
                      {pct == null ? "—" : formatPercent(pct)}
                    </span>
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
                        isGreen
                          ? "bg-teal-500/10 text-teal-400"
                          : "bg-rose-500/10 text-rose-400"
                      }`}
                    >
                      {signed(position.profitLoss ?? 0)}
                      {formatCzk(Math.abs(position.profitLoss ?? 0))}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="flex flex-col gap-3 p-4 lg:hidden">
        {filtered.map((position, index) => {
          const tk = position.ticker || `UNKNOWN_${index + 1}`;
          const isGreen = (position.profitLoss ?? 0) >= 0;
          const pct = plPercent(position);
          return (
            <div
              key={`${tk}-${index}`}
              className="overflow-hidden rounded-xl border border-white/[0.05] bg-white/[0.015]"
            >
              <div
                className={`flex items-center justify-between gap-3 px-4 py-3 ${
                  isGreen ? "bg-teal-500/[0.04]" : "bg-rose-500/[0.04]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold text-white ${
                      isGreen
                        ? "bg-gradient-to-br from-teal-600 to-teal-500"
                        : "bg-gradient-to-br from-slate-700 to-slate-600"
                    }`}
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
                <div className="text-right">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                      isGreen
                        ? "bg-teal-500/10 text-teal-400"
                        : "bg-rose-500/10 text-rose-400"
                    }`}
                  >
                    {signed(position.profitLoss ?? 0)}
                    {formatShortNumber(Math.abs(position.profitLoss ?? 0))}
                  </span>
                  {pct != null && (
                    <p
                      className={`mt-0.5 text-[10px] tabular-nums ${
                        isGreen ? "text-teal-400/80" : "text-rose-400/80"
                      }`}
                    >
                      {formatPercent(pct)}
                    </p>
                  )}
                </div>
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
                  <div
                    key={l as string}
                    className="flex items-baseline justify-between gap-2"
                  >
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
      <div className="border-t border-white/[0.06] px-5 py-2.5 text-xs text-slate-600">
        Zobrazeno {filtered.length} z {positions.length} pozic
      </div>
    </div>
  );
}
