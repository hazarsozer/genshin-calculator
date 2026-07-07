"use client";

import { LEVEL_STOPS, ASC_CAPS, levelIndex, ascensionForLevel } from "@/lib/levelTable";
import { clamp } from "@/lib/utils";
import { Range } from "./Range";

/**
 * LevelSlider — the headline level control ported from Aspirine's 14-stop table.
 *
 * Shows:
 *   - A slider (0–13 stops) that snaps through 1/20 … 90/90
 *   - A small numeric text input (1–90) with live cap "/{ASC_CAPS[ascension]}"
 *   - 6 ascension star-dots (filled = ascended to that phase)
 */

interface LevelSliderProps {
  level: number;
  ascension: number;
  onChange: (level: number, ascension: number) => void;
}

export function LevelSlider({ level, ascension, onChange }: LevelSliderProps) {
  const sliderIdx = levelIndex(level, ascension);

  function handleSlider(idx: number) {
    const stop = LEVEL_STOPS[idx];
    onChange(stop.level, stop.ascension);
  }

  function handleNumeric(raw: string) {
    const parsed = parseInt(raw, 10);
    if (Number.isNaN(parsed)) return;
    const clamped = clamp(parsed, 1, 90);
    const newAsc = ascensionForLevel(clamped, ascension);
    onChange(clamped, newAsc);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        {/* numeric input + live cap */}
        <div className="flex items-center gap-1">
          <input
            type="text"
            inputMode="numeric"
            value={level}
            onChange={(e) => handleNumeric(e.target.value)}
            className="w-12 rounded-md border border-[var(--ck-border)] bg-[var(--ck-surface2)] py-1 text-center text-sm font-bold text-[var(--ck-text)] focus:outline-none focus:ring-1 focus:ring-[var(--ck-accent)]"
          />
          <span className="text-[11px] text-[var(--ck-faint)]">/{ASC_CAPS[ascension]}</span>
        </div>
        {/* ascension star dots (6 phases) */}
        <div className="ml-auto flex gap-1.5">
          {Array.from({ length: 6 }, (_, i) => (
            <div
              key={i}
              className="h-2 w-2 flex-none rounded-full border"
              style={{
                background: ascension > i ? "var(--ck-accent)" : "transparent",
                borderColor: ascension > i ? "var(--ck-accent)" : "var(--ck-border)",
                boxShadow: ascension > i ? "0 0 5px var(--ck-glow)" : "none",
              }}
            />
          ))}
        </div>
      </div>
      <Range min={0} max={13} value={sliderIdx} onChange={handleSlider} />
    </div>
  );
}
