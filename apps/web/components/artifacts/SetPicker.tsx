"use client";

/**
 * SetPicker — "default all slots to this set" shortcut.
 * Pivoted from direct manualSets writes to writing setKey onto all 5 artifactSlots,
 * which drives manualSets via deriveManualSets. This makes manualSets have ONE source
 * of truth (the slots) and removes the two-writer conflict.
 * Per-slot selects in ArtifactSlots give granular override after applying a default here.
 */

import { useState } from "react";
import { useBuildStore } from "@/lib/store";
import {
  SLOTS,
  defaultData,
  buildManualStats,
  deriveManualSets,
  humanizeSetKey,
  SET_KEYS,
} from "@/components/artifacts/ArtifactSlots";
import type { ArtifactSlotData } from "@/lib/types";
import type { EquippedSet } from "@genshin/data";

const inputBase =
  "rounded-lg border border-[var(--ck-border)] bg-[var(--ck-surface2)] " +
  "text-[13px] text-[var(--ck-text)] " +
  "focus:outline-none focus:ring-1 focus:ring-[var(--ck-accent)]";

export function SetPicker() {
  const artifactSlots = useBuildStore((s) => s.form.artifactSlots) ?? {};
  const manualSets = useBuildStore((s) => s.form.manualSets);
  const setForm = useBuildStore((s) => s.setForm);

  const [pendingKey, setPendingKey] = useState("");

  function applyToAllSlots() {
    if (!pendingKey) return;
    const newSlots: Partial<Record<string, ArtifactSlotData>> = {};
    for (const slotDef of SLOTS) {
      const existing = artifactSlots[slotDef.slot];
      newSlots[slotDef.slot] = { ...(existing ?? defaultData(slotDef)), setKey: pendingKey };
    }
    setForm({
      artifactSlots: newSlots,
      manualStats: buildManualStats(newSlots),
      manualSets: deriveManualSets(newSlots),
    });
    setPendingKey("");
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Picker row */}
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex flex-col gap-1">
          <label
            htmlFor="set-picker-select"
            className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--ck-faint)]"
          >
            Set
          </label>
          <select
            id="set-picker-select"
            value={pendingKey}
            onChange={(e) => setPendingKey(e.target.value)}
            className={`${inputBase} w-48 px-3 py-1.5`}
          >
            <option value="">Choose set…</option>
            {SET_KEYS.map((key) => (
              <option key={key} value={key}>
                {humanizeSetKey(key)}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={applyToAllSlots}
          disabled={!pendingKey}
          className="rounded-lg border border-[var(--ck-border)] bg-[var(--ck-surface2)] px-3 py-1.5 text-[12px] text-[var(--ck-muted)] transition-colors hover:border-[var(--ck-accent)] hover:text-[var(--ck-text)] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Apply to all slots
        </button>
      </div>

      {/* Derived sets (read-only — driven by per-slot setKey selections) */}
      {manualSets.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {manualSets.map((s: EquippedSet) => (
            <li
              key={s.setKey}
              className="flex items-center rounded-lg border border-[var(--ck-border)] bg-[var(--ck-surface)] px-3 py-2 text-[12px] text-[var(--ck-text)]"
            >
              {humanizeSetKey(s.setKey)}{" "}
              <span className="ml-1 text-[var(--ck-faint)]">({Math.min(s.pieces, 4)}pc)</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
