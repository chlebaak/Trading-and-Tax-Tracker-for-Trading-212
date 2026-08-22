"use client";

import { useRouter } from "next/navigation";
import SegmentedControl from "./ui/SegmentedControl";

interface Props {
  current: number;
  defaultYear: number;
  years: number[];
}

export default function TaxYearSelect({
  current,
  defaultYear,
  years,
}: Props) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm font-semibold text-slate-300">Daňový rok</p>
      <SegmentedControl<string>
        value={String(current)}
        onChange={(y) =>
          router.push(y === String(defaultYear) ? "?" : `?year=${y}`)
        }
        options={years.map((y) => ({
          value: String(y),
          label: String(y),
        }))}
      />
    </div>
  );
}
