export const dynamic = "force-dynamic";

import { getDashboardData } from "@/lib/dashboard";
import { toCzk, CAPITAL_GAINS_TAX_RATE } from "@/lib/cz-tax";
import DashboardShell from "@/components/DashboardShell";
import PortfolioAllocation from "@/components/PortfolioAllocation";
import PortfolioPositions from "@/components/PortfolioPositions";
import PortfolioSummary from "@/components/PortfolioSummary";
import NextMilestone from "@/components/NextMilestone";
import TaxBreakdown from "@/components/TaxBreakdown";
import TaxTimeline from "@/components/TaxTimeline";
import TaxVerdict from "@/components/TaxVerdict";
import TaxYearSelect from "@/components/TaxYearSelect";
import ValueTestGauge from "@/components/ValueTestGauge";
import Card, { CardHeader } from "@/components/ui/Card";
import { RingGauge } from "@/components/ui/Gauge";

function formatShortCzk(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M Kč`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(0)}K Kč`;
  return `${value} Kč`;
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const params = await searchParams;
  const rawYear = Number(params.year);
  const year =
    Number.isInteger(rawYear) && rawYear >= 2000 && rawYear <= 2100
      ? rawYear
      : undefined;

  const { snapshot, accountCurrency } = await getDashboardData(undefined, year);
  const {
    positions,
    valueTestCzk,
    timeTestFifo,
    realizedPL,
    realizedCostBasis,
    account,
    referenceYear,
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
  // Account summary with positions-derived fallbacks
  const positionsValue = positions.reduce(
    (s, p) => s + (p.currentValue ?? 0),
    0,
  );
  const positionsPL = positions.reduce((s, p) => s + (p.profitLoss ?? 0), 0);
  const accountValue = account?.totalValue ?? positionsValue;
  const totalPL = account?.unrealizedPL ?? positionsPL;

  const unrealizedPercent =
    account?.investmentsCost != null && account.investmentsCost > 0
      ? (totalPL / account.investmentsCost) * 100
      : accountValue - totalPL > 0
        ? (totalPL / (accountValue - totalPL)) * 100
        : null;

  const realizedPercent =
    realizedCostBasis != null && realizedCostBasis > 0
      ? (realizedPL / realizedCostBasis) * 100
      : null;

  const remainingLimit = Math.max(
    0,
    valueTestCzk.limit - valueTestCzk.totalSold,
  );
  const valueTestPercent = Math.min(
    100,
    (valueTestCzk.totalSold / valueTestCzk.limit) * 100,
  );
  const isValueNearLimit = valueTestPercent >= 80 && valueTestCzk.isUnderLimit;

  const stats = [
    {
      label: "Volná hotovost",
      value:
        account?.cashAvailable != null
          ? formatShortCzk(account.cashAvailable)
          : "—",
      tone: "info" as const,
    },
    {
      label: "Zbývá limitu",
      value: formatShortCzk(remainingLimit),
      tone: (isValueNearLimit ? "warning" : "info") as "warning" | "info",
    },
    {
      label: "Osvobozeno (časový test)",
      value: `${totalTaxFreeQuantity} ks`,
      tone: "success" as const,
    },
    { label: "Pozic", value: `${positions.length}` },
  ];

  const tickerNameMap = Object.fromEntries(
    positions.filter((p) => p.name).map((p) => [p.ticker, p.name as string]),
  );

  // Estimated tax saved by letting taxable lots mature past the time test
  const priceCzkByTicker = new Map<string, number>();
  for (const p of positions) {
    if (p.currentPrice == null) continue;
    priceCzkByTicker.set(
      p.ticker,
      toCzk(p.currentPrice, p.currency ?? accountCurrency),
    );
  }
  let estimatedSavingsCzk = 0;
  for (const [ticker, t] of Object.entries(timeTestFifo)) {
    const priceCzk = priceCzkByTicker.get(ticker);
    if (priceCzk == null) continue;
    for (const lot of t.heldLots) {
      if (lot.taxFree || lot.avgPriceCzk == null) continue;
      const gainCzk = (priceCzk - lot.avgPriceCzk) * lot.quantity;
      if (gainCzk > 0)
        estimatedSavingsCzk += gainCzk * CAPITAL_GAINS_TAX_RATE;
    }
  }
  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear, currentYear - 1, currentYear - 2];

  const portfolioSection = (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader
            title="Alokace portfolia"
            subtitle="Podíl jednotlivých pozic na celkové hodnotě"
          />
          <div className="p-5">
            <PortfolioAllocation
              positions={positions}
              accountCurrency={accountCurrency}
            />
          </div>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader
            title="Výkonnost"
            subtitle="Nejlepší a nejhorší pozice dle P/L"
          />
          <div className="p-5">
            <PortfolioSummary
              positions={positions}
              accountCurrency={accountCurrency}
            />
          </div>
        </Card>
      </div>
      <PortfolioPositions
        positions={positions}
        accountCurrency={accountCurrency}
      />
    </div>
  );

  const taxSection = (
    <div className="space-y-6">
      <div className="card flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <p className="text-xs text-slate-500">
          Přehled počítán pro daňový rok{" "}
          <strong className="text-slate-300">{referenceYear}</strong>
        </p>
        <TaxYearSelect
          current={referenceYear}
          defaultYear={currentYear}
          years={yearOptions}
        />
      </div>

      <TaxVerdict
        year={referenceYear}
        totalSold={valueTestCzk.totalSold}
        limit={valueTestCzk.limit}
        isUnderLimit={valueTestCzk.isUnderLimit}
        isNearLimit={isValueNearLimit}
        taxableQuantity={totalTaxableQuantity}
        estimatedSavingsCzk={estimatedSavingsCzk}
      />

      <NextMilestone
        timeTestFifo={timeTestFifo}
        tickerNames={tickerNameMap}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Hodnotový Test"
            subtitle={`Limit 100 000 Kč / rok ${referenceYear}`}
          />
          <div className="flex justify-center p-6">
            <ValueTestGauge
              totalSold={valueTestCzk.totalSold}
              limit={valueTestCzk.limit}
              isUnderLimit={valueTestCzk.isUnderLimit}
              isNearLimit={isValueNearLimit}
            />
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Časový Test"
            subtitle="Držení nad 3 roky = osvobozeno"
          />
          <div className="flex items-center gap-6 p-6">
            <RingGauge percent={timeTestCompletion} color="#2dd4bf">
              <span className="text-xl font-bold text-white tabular-nums">
                {timeTestCompletion}%
              </span>
              <span className="text-[10px] text-slate-500">osvobozeno</span>
            </RingGauge>
            <div className="flex-1 space-y-3">
              {[
                {
                  bg: "bg-teal-500/[0.06] ring-1 ring-teal-500/15",
                  dot: "bg-teal-500",
                  label: "Osvobozeno",
                  val: `${totalTaxFreeQuantity} ks`,
                  clr: "text-teal-400",
                },
                {
                  bg: "bg-amber-500/[0.04] ring-1 ring-amber-500/15",
                  dot: "bg-amber-500",
                  label: "V testu",
                  val: `${totalTaxableQuantity} ks`,
                  clr: "text-amber-300",
                },
                {
                  bg: "bg-white/[0.02]",
                  dot: "bg-slate-500",
                  label: "Celkem",
                  val: `${totalHeld} ks`,
                  clr: "text-slate-300",
                },
              ].map(({ bg, dot, label, val, clr }) => (
                <div
                  key={label}
                  className={`flex items-center justify-between rounded-xl px-4 py-3 ${bg}`}
                >
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <span className={`h-3 w-3 rounded-full ${dot}`} />
                    {label}
                  </div>
                  <span className={`font-bold tabular-nums ${clr}`}>
                    {val}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <TaxBreakdown timeTestFifo={timeTestFifo} tickerNames={tickerNameMap} />
      <TaxTimeline timeTestFifo={timeTestFifo} tickerNames={tickerNameMap} />
    </div>
  );

  return (
    <DashboardShell
      accountValue={accountValue}
      investmentsValue={account?.investmentsValue ?? null}
      cashTotal={account?.cashTotal ?? null}
      cashBreakdown={
        account
          ? {
              available: account.cashAvailable,
              inPies: account.cashInPies,
              reserved: account.cashReserved,
            }
          : null
      }
      totalPL={totalPL}
      unrealizedPercent={unrealizedPercent}
      realizedPL={realizedPL}
      realizedPercent={realizedPercent}
      stats={stats}
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
