"use client";

import { useState } from "react";
import { useResults } from "@/lib/useResults";

type Mode = 0 | 1 | 2; // index into [non-crit, crit, average]
const MODES: { k: Mode; l: string }[] = [
  { k: 0, l: "Non-crit" },
  { k: 2, l: "Average" },
  { k: 1, l: "Crit" },
];

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

/** Per-feature damage bars, sortable by non-crit / average / crit. */
export function Breakdown() {
  const result = useResults();
  const [mode, setMode] = useState<Mode>(2);

  if (result.error) return <p className="text-sm text-red-400">{result.error}</p>;
  if (!result.features.length)
    return <p className="text-sm text-[var(--ck-muted)]">Pick a character to see the damage breakdown.</p>;

  // Natural kit order (NA → Charged → Skill → Burst), like Aspirine — not damage-sorted.
  const feats = result.features;
  const max = Math.max(1, ...feats.map((f) => f.triple[mode]));

  return (
    <div>
      <div className="mb-3 inline-flex rounded-lg border border-[var(--ck-border)] bg-[var(--ck-bg)] p-[3px] text-xs">
        {MODES.map((m) => (
          <button
            key={m.k}
            onClick={() => setMode(m.k)}
            className="rounded-md px-3 py-1 font-semibold"
            style={
              mode === m.k
                ? { background: "color-mix(in srgb, var(--ck-accent) 16%, transparent)", color: "var(--ck-accent2)" }
                : { color: "var(--ck-muted)", fontWeight: 500 }
            }
          >
            {m.l}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {feats.map((f) => (
          <div key={f.key}>
            <div className="flex items-baseline justify-between">
              <span className="text-[13px] font-medium">{f.label}</span>
              <span className="text-base font-bold tabular-nums">{fmt(f.triple[mode])}</span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded bg-[#1a1311]">
              <div
                className="h-full rounded transition-[width] duration-500"
                style={{
                  width: `${Math.max(2, (f.triple[mode] / max) * 100)}%`,
                  background: "linear-gradient(90deg, var(--ck-accent), var(--ck-accent2))",
                  boxShadow: "0 0 12px var(--ck-glow)",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
