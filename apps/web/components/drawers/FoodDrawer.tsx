"use client";

import { useMemo, useState } from "react";
import { useBuildStore } from "@/lib/store";
import { rankFood, type FoodType, type FoodRankRow } from "@/lib/foodRanking";
import { humanizeSlug, humanizePascal } from "@/lib/utils";
import { fmt } from "@/lib/motion";

const CATEGORIES: readonly FoodType[] = ["Attack", "Defence", "Potion"];

/** Food stat keys that are RAW percent points (everything else is a flat number). */
const PERCENT_STATS = new Set([
  "crit_rate",
  "crit_dmg",
  "hp_percent",
  "recharge",
  "healing",
  "shield",
  "dmg_phys",
  "dmg_pyro",
  "dmg_hydro",
  "dmg_electro",
  "dmg_cryo",
  "dmg_anemo",
  "dmg_geo",
  "dmg_dendro",
]);

const STAT_LABELS: Record<string, string> = {
  atk: "ATK",
  def: "DEF",
  crit_rate: "CRIT Rate",
  crit_dmg: "CRIT DMG",
  hp_percent: "HP%",
  recharge: "ER%",
  healing: "Healing Bonus",
  shield: "Shield Strength",
  dmg_phys: "Physical DMG%",
  dmg_pyro: "Pyro DMG%",
  dmg_hydro: "Hydro DMG%",
  dmg_electro: "Electro DMG%",
  dmg_cryo: "Cryo DMG%",
  dmg_anemo: "Anemo DMG%",
  dmg_geo: "Geo DMG%",
  dmg_dendro: "Dendro DMG%",
};

function statPillText(stat: string, value: number): string {
  const label = STAT_LABELS[stat] ?? humanizeSlug(stat);
  const suffix = PERCENT_STATS.has(stat) ? "%" : "";
  return `+${value}${suffix} ${label}`;
}

function SectionHead({ label }: { label: string }) {
  return (
    <div className="mb-1 mt-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ck-faint)]">
      {label}
    </div>
  );
}

function FoodRow({
  row,
  onClick,
}: {
  row: FoodRankRow;
  onClick: () => void;
}) {
  const deltaColor =
    row.deltaAvg > 0
      ? "var(--ck-accent2)"
      : row.deltaAvg < 0
      ? "var(--ck-accent)"
      : undefined;

  return (
    <button
      type="button"
      data-testid={`food-row-${row.key}-${row.tier}`}
      onClick={onClick}
      className="flex flex-col gap-1 rounded-lg border px-2.5 py-2 text-left transition-colors"
      style={{
        borderColor: row.equipped
          ? "color-mix(in srgb, var(--ck-accent) 45%, transparent)"
          : "var(--ck-border)",
        background: row.equipped
          ? "color-mix(in srgb, var(--ck-accent) 10%, transparent)"
          : "transparent",
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[12px] font-semibold text-[var(--ck-text)]">
          {humanizePascal(row.key)}
          {row.equipped && (
            <span className="ml-1.5 text-[9px] font-bold uppercase tracking-wide text-[var(--ck-accent2)]">
              Equipped
            </span>
          )}
        </span>
        <span className="flex-none text-[10px] font-bold text-[var(--ck-faint)]">
          T{row.tier}
        </span>
      </div>

      <div className="flex flex-wrap gap-1">
        {row.statPills.map((p) => (
          <span
            key={p.stat}
            className="rounded bg-[var(--ck-surface2)] px-1.5 py-[1px] text-[9.5px] text-[var(--ck-muted)]"
          >
            {statPillText(p.stat, p.value)}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[11px] tabular-nums text-[var(--ck-muted)]">
          {fmt(row.triple[0])} / {fmt(row.triple[1])} / {fmt(row.triple[2])}
        </span>
        {row.deltaAvg !== 0 && (
          <span className="text-[11px] font-semibold tabular-nums" style={{ color: deltaColor }}>
            {row.deltaAvg > 0 ? "+" : "−"}
            {fmt(Math.abs(row.deltaAvg))}
          </span>
        )}
      </div>
    </button>
  );
}

export function FoodDrawer() {
  const form = useBuildStore((s) => s.form);
  const setForm = useBuildStore((s) => s.setForm);
  const [category, setCategory] = useState<FoodType>("Attack");
  const [allTiers, setAllTiers] = useState(false);

  const rows = useMemo(
    () => rankFood(form, category, allTiers),
    [form, category, allTiers]
  );

  function handleRowClick(row: FoodRankRow) {
    if (row.equipped) {
      const next = { ...form.food };
      delete next[category];
      setForm({ food: next });
    } else {
      setForm({ food: { ...form.food, [category]: { key: row.key, tier: row.tier } } });
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {/* ── Category tabs ── */}
      <div className="inline-flex rounded-lg border border-[var(--ck-border)] bg-[var(--ck-bg)] p-[3px]">
        {CATEGORIES.map((cat) => {
          const active = category === cat;
          const equippedSlot = form.food?.[cat];
          return (
            <button
              key={cat}
              type="button"
              data-testid={`food-tab-${cat}`}
              onClick={() => setCategory(cat)}
              className="flex flex-1 flex-col items-center gap-0.5 rounded-md px-2 py-1.5 text-[12px] font-semibold transition-colors"
              style={
                active
                  ? {
                      background: "color-mix(in srgb, var(--ck-accent) 16%, transparent)",
                      color: "var(--ck-accent2)",
                    }
                  : { color: "var(--ck-muted)" }
              }
            >
              <span>{cat}</span>
              {equippedSlot && (
                <span
                  data-testid={`food-equipped-${cat}`}
                  className="max-w-full truncate text-[9px] font-medium text-[var(--ck-faint)]"
                >
                  {humanizePascal(equippedSlot.key)} T{equippedSlot.tier}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── All tiers toggle ── */}
      <label className="flex items-center gap-2 text-[11px] text-[var(--ck-muted)]">
        <input
          type="checkbox"
          data-testid="food-alltiers"
          checked={allTiers}
          onChange={(e) => setAllTiers(e.target.checked)}
          className="h-3.5 w-3.5 accent-[var(--ck-accent)]"
        />
        All tiers
      </label>

      {/* ── Ranked rows ── */}
      <SectionHead label={`${category} Dishes`} />
      <div className="flex flex-col gap-1.5">
        {rows.map((row) => (
          <FoodRow
            key={`${row.key}-${row.tier}`}
            row={row}
            onClick={() => handleRowClick(row)}
          />
        ))}
      </div>
    </div>
  );
}
