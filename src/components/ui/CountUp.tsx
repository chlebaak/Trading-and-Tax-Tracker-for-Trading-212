"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  value: number;
  format: (v: number) => string;
  duration?: number;
}

/** Animates from the previous value to `value` with an ease-out curve. */
export default function CountUp({ value, format, duration = 800 }: Props) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);
  const first = useRef(true);

  useEffect(() => {
    // Skip animating the initial server-rendered value
    if (first.current) {
      first.current = false;
      prev.current = value;
      return;
    }
    const from = prev.current;
    const to = value;
    if (from === to) return;

    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(from + (to - from) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
      else prev.current = to;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <span className="tabular-nums">{format(display)}</span>;
}
