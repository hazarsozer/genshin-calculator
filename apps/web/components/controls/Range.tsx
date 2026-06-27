"use client";

/**
 * Range — themed `<input type="range">` with accent fill gradient.
 * Uses `.ck-range` class (defined in globals.css) to reset browser defaults
 * and the inline gradient to show the filled portion.
 */

interface RangeProps {
  min: number;
  max: number;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  id?: string;
}

export function Range({ min, max, value, onChange, step = 1, id }: RangeProps) {
  const pct = max > min ? ((value - min) / (max - min)) * 100 : 0;

  return (
    <input
      type="range"
      id={id}
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="ck-range"
      style={{
        background: `linear-gradient(90deg, var(--ck-accent) ${pct}%, #1a1311 ${pct}%)`,
      }}
    />
  );
}
