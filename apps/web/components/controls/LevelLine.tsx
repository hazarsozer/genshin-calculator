"use client";

import { Range } from "./Range";

/**
 * LevelLine — a labeled slider row used for talents (1–13), constellation (0–6),
 * and weapon refinement (1–5). No native number spinners.
 */

interface LevelLineProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  suffix?: string;
}

export function LevelLine({ label, value, min, max, onChange, suffix }: LevelLineProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--ck-muted)]">
          {label}
        </span>
        <span className="text-[12px] font-bold tabular-nums text-[var(--ck-accent2)]">
          {value}{suffix}
        </span>
      </div>
      <Range min={min} max={max} value={value} onChange={onChange} />
    </div>
  );
}
