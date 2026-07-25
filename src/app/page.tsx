export const dynamic = "force-dynamic";

import { getDashboardData } from "@/lib/dashboard";
import DashboardShell from "@/components/DashboardShell";
import PortfolioPositions from "@/components/PortfolioPositions";
import PortfolioSummary from "@/components/PortfolioSummary";
import TaxBreakdown from "@/components/TaxBreakdown";
import TaxTimeline from "@/components/TaxTimeline";
import ValueTestGauge from "@/components/ValueTestGauge";

function formatCzk(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 0 }).format(
    value,
  );
}
function formatShortCzk(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M Kč`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(0)}K Kč`;
  return `${value} Kč`;
}

export default async function Home() {
  const { snapshot, accountCurrency } = await getDashboardData();
  const {
    positions,
    valueTestCzk,
    timeTestFifo,
    realizedPL,
    fetchedAt,
    cached,
  } = snapshot;

  const totalTaxFreeQuantity = Object.values(timeTestFifo).reduce(
    (s, t) => s + t.taxFreeQuantity,
    0,
  );
  const totalTaxableQuantity = Object.values(timeTestFifo).reduce(
    (s, t) => s + t.taxableQuantity,
    0,
  );
  const totalHeld = totalTaxFreeQuantity + totalTaxableQuantity;
  const timeTestCompletion =
    totalHeld > 0 ? Math.round((totalTaxFreeQuantity / totalHeld) * 100) : 0;
  const accountValue = positions.reduce((s, p) => s + (p.currentValue ?? 0), 0);
  const totalPL = positions.reduce((s, p) => s + (p.profitLoss ?? 0), 0);
  const remainingLimit = Math.max(
    0,
    valueTestCzk.limit - valueTestCzk.totalSold,
  );
  const valueTestPercent = Math.min(
    100,
    (valueTestCzk.totalSold / valueTestCzk.limit) * 100,
  );
  const isValueNearLimit = valueTestPercent >= 80 && valueTestCzk.isUnderLimit;
  const totalLots = Object.values(timeTestFifo).reduce(
    (s, t) => s + t.heldLots.length,
    0,
  );

  const kpis = [
    {
      label: "Hodnota účtu",
      value: formatShortCzk(accountValue),
      accent: "slate" as const,
    },
    {
      label: "Celkové P/L",
      value: `${totalPL >= 0 ? "+" : ""}${formatShortCzk(totalPL)}`,
      accent: (totalPL >= 0 ? "emerald" : "rose") as "emerald" | "rose",
    },
    {
      label: "Realiz. P/L",
      value: `${realizedPL >= 0 ? "+" : ""}${formatShortCzk(realizedPL)}`,
      accent: (realizedPL >= 0 ? "emerald" : "rose") as "emerald" | "rose",
    },
    {
      label: "Zbývá limitu",
      value: formatShortCzk(remainingLimit),
      accent: (isValueNearLimit ? "amber" : "blue") as "amber" | "blue",
    },
    {
      label: "Osvobozeno",
      value: `${totalTaxFreeQuantity} ks`,
      accent: "emerald" as const,
    },
    { label: "Pozic", value: `${positions.length}`, accent: "slate" as const },
  ];

  const tickerNameMap = Object.fromEntries(
    positions.filter((p) => p.name).map((p) => [p.ticker, p.name as string]),
  );

  const glass = "rounded-2xl border border-white/[0.04] bg-white/[0.02]";

  const portfolioSection = (
    <div className="space-y-6">
      <div className={`${glass} p-6`}>
        <h3 className="mb-5 text-sm font-semibold text-slate-200">
          Přehled portfolia
        </h3>
        <PortfolioSummary
          positions={positions}
          accountCurrency={accountCurrency}
        />
      </div>
      <PortfolioPositions
        positions={positions}
        accountCurrency={accountCurrency}
      />
    </div>
  );

  const taxSection = (
    <div className="space-y-6">
      <div className={`${glass} p-5`}>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            [
              "Prodáno letos",
              `${formatCzk(valueTestCzk.totalSold)} Kč`,
              "text-slate-100",
            ],
            [
              "Zbývá limitu",
              `${formatCzk(remainingLimit)} Kč`,
              isValueNearLimit ? "text-amber-300" : "text-teal-400",
            ],
            ["Aktivních lotů", `${totalLots}`, "text-slate-100"],
            ["Osvobozeno", `${totalTaxFreeQuantity} ks`, "text-teal-400"],
          ].map(([l, v, c]) => (
            <div key={l as string}>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                {l}
              </p>
              <p className={`mt-1 text-lg font-bold tracking-tight ${c}`}>
                {v}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className={`flex flex-col items-center ${glass} p-6`}>
          <h3 className="text-sm font-semibold text-slate-200">
            Hodnotový Test
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Limit 100 000 Kč / rok
          </p>
          <div className="mt-4">
            <ValueTestGauge
              totalSold={valueTestCzk.totalSold}
              limit={valueTestCzk.limit}
              isUnderLimit={valueTestCzk.isUnderLimit}
              isNearLimit={isValueNearLimit}
            />
          </div>
        </div>

        <div
          className={`${glass} relative overflow-hidden border-cyan-500/[0.06] p-6`}
        >
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-cyan-500/[0.04] blur-2xl" />
          <div className="relative">
            <h3 className="text-sm font-semibold text-slate-200">
              Časový Test
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Držení nad 3 roky = osvobozeno
            </p>
            <div className="mt-5 flex items-center gap-6">
              <div
                className="relative h-28 w-28 shrink-0 rounded-full"
                style={{
                  background: `conic-gradient(#2dd4bf 0 ${timeTestCompletion}%, rgba(255,255,255,0.04) ${timeTestCompletion}% 100%)`,
                }}
              >
                <div className="absolute inset-[6px] flex items-center justify-center rounded-full bg-[#070b16]">
                  <span className="text-xl font-bold text-slate-100">
                    {timeTestCompletion}%
                  </span>
                </div>
              </div>
              <div className="flex-1 space-y-3">
                {[
                  [
                    "bg-teal-500/10 text-teal-400",
                    "bg-teal-500",
                    "Osvobozeno",
                    `${totalTaxFreeQuantity} ks`,
                    "text-teal-400",
                  ],
                  [
                    "bg-amber-500/5 text-amber-300",
                    "bg-amber-500",
                    "V testu",
                    `${totalTaxableQuantity} ks`,
                    "text-amber-300",
                  ],
                  [
                    "bg-white/[0.02] text-slate-400",
                    "bg-slate-500",
                    "Celkem",
                    `${totalHeld} ks`,
                    "text-slate-300",
                  ],
                ].map(([bg, dot, label, val, clr]) => (
                  <div
                    key={label}
                    className={`flex items-center justify-between rounded-xl px-4 py-3 ${bg}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`h-3 w-3 rounded-full ${dot}`} />
                      <span className="text-sm">{label}</span>
                    </div>
                    <span className={`font-bold ${clr}`}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <TaxBreakdown timeTestFifo={timeTestFifo} tickerNames={tickerNameMap} />
      <TaxTimeline timeTestFifo={timeTestFifo} tickerNames={tickerNameMap} />
    </div>
  );

  return (
    <DashboardShell
      kpis={kpis}
      fetchedAt={fetchedAt}
      cached={cached}
      valueTestPercent={valueTestPercent}
      valueTestIsUnderLimit={valueTestCzk.isUnderLimit}
      isValueNearLimit={isValueNearLimit}
      portfolioSection={portfolioSection}
      taxSection={taxSection}
    />
  );
}
