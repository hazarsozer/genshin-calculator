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
import { FallbackImage, Catalog } from "@/components/catalog/Catalog";
import { CatalogModal } from "@/components/catalog/CatalogModal";
import { artifactSetIconSources } from "@/lib/enkaArt";
import {
  SLOTS,
  defaultData,
  buildManualStats,
  deriveManualSets,
  humanizeSetKey,
  SET_KEYS,
  renderSetMeta,
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
  const [browseOpen, setBrowseOpen] = useState(false);

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
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--ck-faint)]">
            Set
          </span>
          <button
            type="button"
            onClick={() => setBrowseOpen(true)}
            aria-label="Browse artifact set"
            className={`${inputBase} w-48 truncate px-3 py-1.5 text-left`}
          >
            {pendingKey ? humanizeSetKey(pendingKey) : "Choose set — Browse…"}
          </button>
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

      {/* Set browse modal */}
      <CatalogModal
        open={browseOpen}
        onClose={() => setBrowseOpen(false)}
        title="Artifact Set"
      >
        <Catalog
          items={SET_KEYS}
          getKey={(k) => k}
          getLabel={humanizeSetKey}
          getIconSources={artifactSetIconSources}
          activeKey={pendingKey}
          renderMeta={renderSetMeta}
          onPick={(k) => {
            setPendingKey(k);
            setBrowseOpen(false);
          }}
        />
      </CatalogModal>

      {/* Derived sets (read-only — driven by per-slot setKey selections) */}
      {manualSets.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {manualSets.map((s: EquippedSet) => (
            <li
              key={s.setKey}
              className="flex items-center gap-2 rounded-lg border border-[var(--ck-border)] bg-[var(--ck-surface)] px-3 py-2 text-[12px] text-[var(--ck-text)]"
            >
              <div className="h-6 w-6 flex-none overflow-hidden rounded-[6px]">
                <FallbackImage
                  sources={artifactSetIconSources(s.setKey)}
                  alt={s.setKey}
                  className="h-full w-full"
                />
              </div>
              {humanizeSetKey(s.setKey)}{" "}
              <span className="ml-1 text-[var(--ck-faint)]">({Math.min(s.pieces, 4)}pc)</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
