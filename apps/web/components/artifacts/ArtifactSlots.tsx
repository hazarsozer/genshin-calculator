"use client";

/**
 * ArtifactSlots — 5 slot cards (Flower/Plume/Sands/Goblet/Circlet).
 * Each card has a main stat + up to 4 substats.
 * On any change, derives `manualStats` via `assembleArtifactStats` and
 * stores both `artifactSlots` (UI state) and `manualStats` (engine-facing).
 *
 * Visual: ports the `.slot` card style from cinematic-desktop-hifi.html,
 * using var(--ck-*) tokens throughout.
 */

import { useState } from "react";
import { useBuildStore } from "@/lib/store";
import { assembleArtifactStats, ARTIFACT_SETS, SET_EFFECTS } from "@genshin/data";
import type { EquippedSet } from "@genshin/data";
import type { ArtifactSlotData } from "@/lib/types";
import { FallbackImage, Catalog } from "@/components/catalog/Catalog";
import { CatalogModal } from "@/components/catalog/CatalogModal";
import { artifactSetIconSources } from "@/lib/enkaArt";

// ─────────────────────────── constants ───────────────────────────

export type SlotKey = "flower" | "plume" | "sands" | "goblet" | "circlet";

export const SLOTS = [
  { slot: "flower" as SlotKey, label: "Flower", fixedMain: "hp", mains: null as string[] | null },
  { slot: "plume" as SlotKey, label: "Plume", fixedMain: "atk", mains: null as string[] | null },
  {
    slot: "sands" as SlotKey,
    label: "Sands",
    fixedMain: null,
    mains: ["hp_", "atk_", "def_", "enerRech_", "eleMas"],
  },
  {
    slot: "goblet" as SlotKey,
    label: "Goblet",
    fixedMain: null,
    mains: [
      "hp_", "atk_", "def_", "eleMas",
      "pyro_dmg_", "hydro_dmg_", "electro_dmg_", "cryo_dmg_",
      "anemo_dmg_", "geo_dmg_", "dendro_dmg_", "physical_dmg_",
    ],
  },
  {
    slot: "circlet" as SlotKey,
    label: "Circlet",
    fixedMain: null,
    mains: ["hp_", "atk_", "def_", "critRate_", "critDMG_", "heal_", "eleMas"],
  },
] as const;

export type SlotDef = (typeof SLOTS)[number];

const SUBSTAT_KEYS = [
  "hp", "atk", "def",
  "hp_", "atk_", "def_",
  "critRate_", "critDMG_", "enerRech_", "eleMas",
] as const;

const LABEL: Record<string, string> = {
  hp: "HP", atk: "ATK", def: "DEF",
  "hp_": "HP%", "atk_": "ATK%", "def_": "DEF%",
  critRate_: "Crit Rate", critDMG_: "Crit DMG",
  enerRech_: "ER%", eleMas: "EM",
  "heal_": "Heal%",
  "pyro_dmg_": "Pyro%", "hydro_dmg_": "Hydro%",
  "electro_dmg_": "Electro%", "cryo_dmg_": "Cryo%",
  "anemo_dmg_": "Anemo%", "geo_dmg_": "Geo%",
  "dendro_dmg_": "Dendro%", "physical_dmg_": "Phys%",
};

const IS_PERCENT = new Set([
  "hp_", "atk_", "def_", "critRate_", "critDMG_", "enerRech_", "heal_",
  "pyro_dmg_", "hydro_dmg_", "electro_dmg_", "cryo_dmg_",
  "anemo_dmg_", "geo_dmg_", "dendro_dmg_", "physical_dmg_",
]);

// ─────────────────────── set helpers ────────────────────────────

/** Split PascalCase goodId into a readable display name. */
export function humanizeSetKey(goodId: string): string {
  return goodId.replace(/([A-Z])/g, " $1").trim();
}

export const SET_KEYS = Object.keys(ARTIFACT_SETS).sort((a, b) =>
  humanizeSetKey(a).localeCompare(humanizeSetKey(b))
);

/**
 * Renders 2pc/4pc effect text for the set catalog tiles.
 * Returns null for the ~10 sets without SET_EFFECTS entries
 * (Prayers + post-v5.8 sets).
 *
 * Exported so SetPicker can reuse the same renderMeta without duplication.
 */
export function renderSetMeta(k: string) {
  if (!(k in SET_EFFECTS)) return null;
  const fx = SET_EFFECTS[k];
  return (
    <>
      <div className="truncate text-left">2pc: {fx.two.desc}</div>
      <div className="truncate text-left">4pc: {fx.four.desc}</div>
    </>
  );
}

// ──────────────────────── slot→flat adapter ──────────────────────

export function buildManualStats(
  slots: Partial<Record<string, ArtifactSlotData>>
): Record<string, number> {
  const entries = Object.entries(slots).filter(
    (e): e is [string, ArtifactSlotData] => !!e[1]?.mainStatKey
  );
  if (entries.length === 0) return {};
  try {
    return assembleArtifactStats(
      entries.map(([slot, d]) => ({
        slot: slot as SlotKey,
        // "_slot" is a placeholder — assembleArtifactStats validates stat keys only,
        // not set keys, so any non-empty string is safe here.
        setKey: "_slot",
        rarity: d.rarity,
        level: d.level,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mainStatKey: d.mainStatKey as any,
        subStats: d.substats
          .filter((s) => s.key && s.value > 0)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((s) => ({ key: s.key as any, value: s.value })),
      }))
    );
  } catch (e) {
    // Defensive: GoodStatKey is exhaustive — the UI dropdowns constrain keys to the
    // bijective goodToAspirine map, so this path is unreachable via normal use.
    console.error("[buildManualStats] unexpected stat key:", e);
    return {};
  }
}

/** Count setKey occurrences across slots → EquippedSet[] for manualSets. */
export function deriveManualSets(
  slots: Partial<Record<string, ArtifactSlotData>>
): EquippedSet[] {
  const counts = new Map<string, number>();
  for (const data of Object.values(slots)) {
    if (data?.setKey) {
      counts.set(data.setKey, (counts.get(data.setKey) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries()).map(([setKey, pieces]) => ({ setKey, pieces }));
}

// ─────────────────────── default slot data ───────────────────────

export function defaultData(slotDef: SlotDef): ArtifactSlotData {
  return {
    mainStatKey: slotDef.fixedMain ?? slotDef.mains?.[0] ?? "hp_",
    rarity: 5,
    level: 20,
    substats: [],
  };
}

// ───────────────────── shared input style ────────────────────────

const INPUT_CLS =
  "rounded border border-[var(--ck-border)] bg-[var(--ck-surface2)] " +
  "text-[var(--ck-text)] focus:outline-none focus:ring-1 focus:ring-[var(--ck-accent)] " +
  "text-[11px] px-1.5 py-0.5";

// ────────────────────────── SlotCard ─────────────────────────────

interface SlotCardProps {
  slotDef: SlotDef;
  data: ArtifactSlotData | undefined;
  onUpdate: (data: ArtifactSlotData | undefined) => void;
}

function SlotCard({ slotDef, data, onUpdate }: SlotCardProps) {
  const isActive = !!data;
  const substats = data?.substats ?? [];
  const mainKey = data?.mainStatKey ?? slotDef.fixedMain ?? slotDef.mains?.[0] ?? "";
  const [browseOpen, setBrowseOpen] = useState(false);

  function activate() {
    onUpdate(defaultData(slotDef));
  }

  function clear() {
    onUpdate(undefined);
  }

  function setMain(key: string) {
    const base = data ?? defaultData(slotDef);
    onUpdate({ ...base, mainStatKey: key });
  }

  function setRarity(r: number) {
    if (!data) return;
    onUpdate({ ...data, rarity: r as ArtifactSlotData["rarity"] });
  }

  function setLevel(l: number) {
    if (!data) return;
    onUpdate({ ...data, level: Math.max(0, Math.min(20, l)) });
  }

  function setSetKey(key: string) {
    if (!data) return;
    onUpdate({ ...data, setKey: key || undefined });
  }

  function addSub() {
    const base = data ?? defaultData(slotDef);
    if (base.substats.length >= 4) return;
    const used = new Set(base.substats.map((s) => s.key));
    const nextKey = SUBSTAT_KEYS.find((k) => !used.has(k)) ?? "hp";
    onUpdate({ ...base, substats: [...base.substats, { key: nextKey, value: 0 }] });
  }

  function removeSub(i: number) {
    if (!data) return;
    onUpdate({ ...data, substats: data.substats.filter((_, idx) => idx !== i) });
  }

  function updateSubKey(i: number, key: string) {
    if (!data) return;
    const substats = data.substats.map((s, idx) => (idx === i ? { ...s, key } : s));
    onUpdate({ ...data, substats });
  }

  function updateSubValue(i: number, raw: string) {
    if (!data) return;
    const value = parseFloat(raw) || 0;
    const substats = data.substats.map((s, idx) => (idx === i ? { ...s, value } : s));
    onUpdate({ ...data, substats });
  }

  return (
    <div
      className="flex flex-col gap-2 rounded-[13px] border border-[var(--ck-border)] bg-[var(--ck-surface)] p-2.5"
      style={{ minHeight: 150 }}
    >
      {/* Header: icon + slot label + clear */}
      <div className="flex items-center gap-1.5">
        <div
          className="h-7 w-7 flex-none overflow-hidden rounded-[8px] border"
          style={{
            borderColor: "color-mix(in srgb, var(--ck-accent) 25%, transparent)",
          }}
        >
          <FallbackImage
            sources={data?.setKey ? artifactSetIconSources(data.setKey) : []}
            alt={data?.setKey ?? ""}
            className="h-full w-full"
          />
        </div>
        <span className="flex-1 text-[9.5px] font-bold uppercase tracking-[1px] text-[var(--ck-faint)]">
          {slotDef.label}
        </span>
        {isActive && (
          <button
            type="button"
            onClick={clear}
            aria-label={`Clear ${slotDef.label}`}
            className="text-[10px] leading-none text-[var(--ck-faint)] transition-colors hover:text-[var(--ck-muted)]"
          >
            ✕
          </button>
        )}
      </div>

      {/* Main stat */}
      {slotDef.fixedMain ? (
        <div className="text-[11px] font-semibold text-[var(--ck-accent2)]">
          {LABEL[slotDef.fixedMain]}
        </div>
      ) : (
        <select
          value={mainKey}
          onChange={(e) => setMain(e.target.value)}
          aria-label={`${slotDef.label} main stat`}
          className={`${INPUT_CLS} w-full`}
        >
          {slotDef.mains?.map((k) => (
            <option key={k} value={k}>
              {LABEL[k] ?? k}
            </option>
          ))}
        </select>
      )}

      {/* Set selector — Browse trigger + CatalogModal */}
      {isActive && (
        <>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setBrowseOpen(true)}
              aria-label={`Browse ${slotDef.label} artifact set`}
              className={`${INPUT_CLS} flex-1 truncate text-left`}
            >
              {data?.setKey ? humanizeSetKey(data.setKey) : "No set — Browse…"}
            </button>
            {data?.setKey && (
              <button
                type="button"
                onClick={() => setSetKey("")}
                aria-label={`Clear ${slotDef.label} set`}
                className="flex-none text-[10px] leading-none text-[var(--ck-faint)] transition-colors hover:text-[var(--ck-muted)]"
              >
                ✕
              </button>
            )}
          </div>
          <CatalogModal
            open={browseOpen}
            onClose={() => setBrowseOpen(false)}
            title={`${slotDef.label} — Artifact Set`}
          >
            <Catalog
              items={SET_KEYS}
              getKey={(k) => k}
              getLabel={humanizeSetKey}
              getIconSources={artifactSetIconSources}
              activeKey={data?.setKey}
              renderMeta={renderSetMeta}
              onPick={(k) => {
                setSetKey(k);
                setBrowseOpen(false);
              }}
            />
          </CatalogModal>
        </>
      )}

      {/* Rarity + Level — only when active */}
      {isActive && (
        <div className="flex items-center gap-1">
          <select
            value={data?.rarity ?? 5}
            onChange={(e) => setRarity(Number(e.target.value))}
            aria-label={`${slotDef.label} rarity`}
            className={`${INPUT_CLS} w-auto flex-none`}
          >
            {[1, 2, 3, 4, 5].map((r) => (
              <option key={r} value={r}>
                {"★".repeat(r)}
              </option>
            ))}
          </select>
          <span className="text-[10px] text-[var(--ck-faint)]">Lv</span>
          <input
            type="number"
            min={0}
            max={20}
            value={data?.level ?? 20}
            onChange={(e) => setLevel(Number(e.target.value))}
            aria-label={`${slotDef.label} level`}
            className={`${INPUT_CLS} w-10`}
          />
        </div>
      )}

      {/* Substats */}
      {substats.length > 0 && (
        <div className="flex flex-col gap-1">
          {(() => {
            const usedKeys = new Set(substats.map((s) => s.key));
            return substats.map((sub, i) => (
            <div key={i} className="flex items-center gap-1">
              <select
                value={sub.key}
                onChange={(e) => updateSubKey(i, e.target.value)}
                aria-label={`Substat ${i + 1} key`}
                className={`${INPUT_CLS} min-w-0 flex-1`}
              >
                {SUBSTAT_KEYS.filter((k) => !usedKeys.has(k) || k === sub.key).map((k) => (
                  <option key={k} value={k}>
                    {LABEL[k] ?? k}
                  </option>
                ))}
              </select>
              <div className="relative flex-none">
                <input
                  type="number"
                  min={0}
                  step={IS_PERCENT.has(sub.key) ? 0.1 : 1}
                  value={sub.value || ""}
                  placeholder="0"
                  onChange={(e) => updateSubValue(i, e.target.value)}
                  aria-label={`Substat ${i + 1} value`}
                  className={`${INPUT_CLS} w-14 ${IS_PERCENT.has(sub.key) ? "pr-4" : ""}`}
                />
                {IS_PERCENT.has(sub.key) && (
                  <span className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-[9px] text-[var(--ck-faint)]">
                    %
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeSub(i)}
                aria-label={`Remove substat ${i + 1}`}
                className="flex-none text-[10px] leading-none text-[var(--ck-faint)] transition-colors hover:text-[var(--ck-muted)]"
              >
                ✕
              </button>
            </div>
          ));
          })()}
        </div>
      )}

      {/* Footer: configure (inactive) or add-sub (active) */}
      <div className="mt-auto">
        {!isActive ? (
          <button
            type="button"
            onClick={activate}
            className="w-full rounded-lg border border-dashed border-[var(--ck-border)] py-1.5 text-[10px] text-[var(--ck-faint)] transition-colors hover:border-[var(--ck-accent)] hover:text-[var(--ck-accent)]"
          >
            Configure
          </button>
        ) : substats.length < 4 ? (
          <button
            type="button"
            onClick={addSub}
            className="w-full rounded-lg border border-dashed border-[var(--ck-border)] py-1 text-[10px] text-[var(--ck-faint)] transition-colors hover:border-[var(--ck-accent)] hover:text-[var(--ck-accent)]"
          >
            + Add substat
          </button>
        ) : null}
      </div>
    </div>
  );
}

// ──────────────────────── ArtifactSlots ──────────────────────────

export function ArtifactSlots() {
  const artifactSlots = useBuildStore((s) => s.form.artifactSlots) ?? {};
  const setForm = useBuildStore((s) => s.setForm);

  function updateSlot(slotKey: string, data: ArtifactSlotData | undefined) {
    const newSlots: Partial<Record<string, ArtifactSlotData>> = { ...artifactSlots };
    if (data) {
      newSlots[slotKey] = data;
    } else {
      delete newSlots[slotKey];
    }
    setForm({ artifactSlots: newSlots, manualStats: buildManualStats(newSlots), manualSets: deriveManualSets(newSlots) });
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {SLOTS.map((slotDef, i) => (
        <div key={slotDef.slot} className={i === 4 ? "col-span-2" : ""}>
          <SlotCard
            slotDef={slotDef}
            data={artifactSlots[slotDef.slot]}
            onUpdate={(d) => updateSlot(slotDef.slot, d)}
          />
        </div>
      ))}
    </div>
  );
}
