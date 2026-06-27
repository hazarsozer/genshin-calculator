"use client";

/**
 * SetPicker — restyled artifact set picker.
 * Same logic as the old components/SetPicker.tsx; styled with var(--ck-*) tokens
 * to match the drawer's dark theme.
 */

import { useState } from "react";
import { ARTIFACT_SETS } from "@genshin/data";
import { useBuildStore } from "@/lib/store";
import type { EquippedSet } from "@genshin/data";

/** Split PascalCase goodId into a readable display name.
 *  e.g. "GladiatorFinale" → "Gladiator Finale" */
function humanizeGoodId(goodId: string): string {
  return goodId.replace(/([A-Z])/g, " $1").trim();
}

const SET_KEYS = Object.keys(ARTIFACT_SETS).sort((a, b) =>
  humanizeGoodId(a).localeCompare(humanizeGoodId(b))
);

const inputBase =
  "rounded-lg border border-[var(--ck-border)] bg-[var(--ck-surface2)] " +
  "text-[13px] text-[var(--ck-text)] " +
  "focus:outline-none focus:ring-1 focus:ring-[var(--ck-accent)]";

export function SetPicker() {
  const manualSets = useBuildStore((s) => s.form.manualSets);
  const setForm = useBuildStore((s) => s.setForm);

  const [pendingKey, setPendingKey] = useState("");
  const [pendingPieces, setPendingPieces] = useState<2 | 4>(4);

  function addSet() {
    if (!pendingKey) return;
    const filtered = manualSets.filter((s) => s.setKey !== pendingKey);
    setForm({ manualSets: [...filtered, { setKey: pendingKey, pieces: pendingPieces }] });
    setPendingKey("");
    setPendingPieces(4);
  }

  function removeSet(setKey: string) {
    setForm({ manualSets: manualSets.filter((s: EquippedSet) => s.setKey !== setKey) });
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
                {humanizeGoodId(key)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="set-picker-pieces"
            className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--ck-faint)]"
          >
            Pieces
          </label>
          <select
            id="set-picker-pieces"
            value={String(pendingPieces)}
            onChange={(e) => {
              if (e.target.value === "2") setPendingPieces(2);
              else setPendingPieces(4);
            }}
            className={`${inputBase} w-20 px-3 py-1.5`}
          >
            <option value="2">2pc</option>
            <option value="4">4pc</option>
          </select>
        </div>

        <button
          type="button"
          onClick={addSet}
          disabled={!pendingKey}
          className="rounded-lg border border-[var(--ck-border)] bg-[var(--ck-surface2)] px-3 py-1.5 text-[12px] text-[var(--ck-muted)] transition-colors hover:border-[var(--ck-accent)] hover:text-[var(--ck-text)] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Add
        </button>
      </div>

      {/* Equipped sets list */}
      {manualSets.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {manualSets.map((s: EquippedSet) => (
            <li
              key={s.setKey}
              className="flex items-center justify-between rounded-lg border border-[var(--ck-border)] bg-[var(--ck-surface)] px-3 py-2 text-[12px] text-[var(--ck-text)]"
            >
              <span>
                {humanizeGoodId(s.setKey)}{" "}
                <span className="text-[var(--ck-faint)]">({s.pieces}pc)</span>
              </span>
              <button
                type="button"
                onClick={() => removeSet(s.setKey)}
                aria-label={`Remove ${humanizeGoodId(s.setKey)}`}
                className="ml-3 text-[var(--ck-faint)] transition-colors hover:text-[var(--ck-muted)]"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
