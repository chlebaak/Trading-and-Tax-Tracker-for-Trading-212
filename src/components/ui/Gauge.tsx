"use client";

import type { ReactNode } from "react";

interface RingGaugeProps {
  percent: number; // 0–100
  color: string;
  size?: number;
  strokeWidth?: number;
  children?: ReactNode;
}

/** Full-circle progress ring with rounded caps and smooth animation. */
export function RingGauge({
  percent,
  color,
  size = 112,
  strokeWidth = 10,
  children,
}: RingGaugeProps) {
  const r = (size - strokeWidth) / 2;
  const clamped = Math.min(100, Math.max(0, percent));
  const circumference = 2 * Math.PI * r;

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${Math.round(clamped)} %`}
    >
      <svg width={size} height={size} className="-rotate-90 overflow-visible">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped / 100)}
          style={{
            transition:
              "stroke-dashoffset 900ms cubic-bezier(0.22, 1, 0.36, 1), stroke 300ms ease",
            filter: `drop-shadow(0 0 6px ${color}40)`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
}
