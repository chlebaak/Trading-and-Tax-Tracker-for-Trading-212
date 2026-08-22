const CS = "cs-CZ";

export function isNum(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function formatCzk(value: number | null | undefined): string {
  if (!isNum(value)) return "—";
  return new Intl.NumberFormat(CS, { maximumFractionDigits: 0 }).format(value);
}

export function formatDecimal(
  value: number | null | undefined,
  digits = 2,
): string {
  if (!isNum(value)) return "—";
  return new Intl.NumberFormat(CS, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

export function formatShortNumber(value: number | null | undefined): string {
  if (!isNum(value)) return "—";
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return new Intl.NumberFormat(CS, { maximumFractionDigits: 0 }).format(value);
}

export function formatShortCzk(value: number | null | undefined): string {
  if (!isNum(value)) return "—";
  return `${formatShortNumber(value)} Kč`;
}

export function formatPercent(
  value: number | null | undefined,
  digits = 1,
): string {
  if (!isNum(value)) return "—";
  return `${value >= 0 ? "+" : ""}${value.toFixed(digits)} %`;
}

export function formatDateCz(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(CS, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function formatDateTimeCz(iso: string): string {
  try {
    return new Date(iso).toLocaleString(CS, {
      day: "numeric",
      month: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

/** "2r 3m" / "1 rok" / "8 měsíců" / "45 dní" */
export function daysToHuman(days: number): string {
  const years = Math.floor(days / 365);
  const months = Math.floor((days % 365) / 30);
  if (years > 0 && months > 0) return `${years}r ${months}m`;
  if (years > 0) return years === 1 ? "1 rok" : `${years} roky`;
  if (months > 0) return months === 1 ? "1 měsíc" : `${months} měs.`;
  return `${days} dní`;
}

export function signed(value: number): string {
  return value >= 0 ? "+" : "−";
}
