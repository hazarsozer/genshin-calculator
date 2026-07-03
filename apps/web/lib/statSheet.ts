/**
 * buildStatSheet — pure stat-sheet builder for the Stats tab.
 *
 * Groups the engine's raw stat bag (`ComputeResult.stats`, i.e. `packages/data`'s
 * `buildStats` output — see `packages/data/src/buildStats.ts`) into labeled,
 * ordered rows for display. Registry keys were discovered by dumping
 * `Object.keys(computeBuild(...).stats!)` for the default Bennett build (see
 * `apps/web/.superpowers/sdd/task-1-report.md` for the full list) and cross-
 * checked against `buildStats.ts`'s own emit constants (`SCALING_TOTAL_STATS`,
 * `FLAT_TOTAL_STATS`, `FRACTION_TOTAL_STATS`, `DMG_BONUS_ELEMENT_KEYS`,
 * `DMG_BONUS_TYPE_KEYS`, `HEAL_BONUS_KEYS`, `REACTION_BONUS_PERCENT_KEYS`) so the
 * registry covers keys that exist in other builds too (reactions/heals aren't
 * active on the plain Bennett dump). No key here is invented — every entry is a
 * real bag key confirmed against that source.
 *
 * Only `atk_total` decomposes into base/bonus (via the separate `atk_base` key
 * the engine emits) — `hp_total` and `def_total` have no `_base` counterpart in
 * the bag, so they report `base: null` like the percent stats.
 */

export interface StatRow {
  key: string;
  label: string;
  base: number | null;
  bonus: number;
  total: number;
  format: "flat" | "percent";
}

export interface StatSheetGroup {
  title: string;
  rows: StatRow[];
}

interface RegistryRow {
  key: string;
  label: string;
  format: "flat" | "percent";
  /** Always shown, even at 0 (vs. optional rows, hidden when 0). */
  core?: true;
  /** A separate bag key holding this row's base value (only `atk_total` has one). */
  baseKey?: string;
}

interface RegistryGroup {
  title: string;
  rows: RegistryRow[];
}

const GROUPS: readonly RegistryGroup[] = [
  {
    title: "Base Stats",
    rows: [
      { key: "hp_total", label: "HP", format: "flat", core: true },
      { key: "atk_total", label: "ATK", format: "flat", core: true, baseKey: "atk_base" },
      { key: "def_total", label: "DEF", format: "flat", core: true },
      { key: "mastery", label: "Elemental Mastery", format: "flat", core: true },
    ],
  },
  {
    title: "Secondary",
    rows: [
      { key: "recharge_total", label: "Energy Recharge", format: "percent", core: true },
      { key: "crit_rate_total", label: "CRIT Rate", format: "percent", core: true },
      { key: "crit_dmg_total", label: "CRIT DMG", format: "percent", core: true },
      { key: "healing", label: "Healing Bonus", format: "percent" },
      { key: "healing_recv", label: "Incoming Healing Bonus", format: "percent" },
      { key: "shield", label: "Shield Strength", format: "percent" },
    ],
  },
  {
    title: "Elemental DMG",
    rows: [
      { key: "dmg_pyro", label: "Pyro DMG Bonus", format: "percent" },
      { key: "dmg_hydro", label: "Hydro DMG Bonus", format: "percent" },
      { key: "dmg_electro", label: "Electro DMG Bonus", format: "percent" },
      { key: "dmg_cryo", label: "Cryo DMG Bonus", format: "percent" },
      { key: "dmg_anemo", label: "Anemo DMG Bonus", format: "percent" },
      { key: "dmg_geo", label: "Geo DMG Bonus", format: "percent" },
      { key: "dmg_dendro", label: "Dendro DMG Bonus", format: "percent" },
      { key: "dmg_phys", label: "Physical DMG Bonus", format: "percent" },
    ],
  },
  {
    title: "Damage Bonuses",
    rows: [
      { key: "dmg_normal", label: "Normal Attack DMG Bonus", format: "percent" },
      { key: "dmg_charged", label: "Charged Attack DMG Bonus", format: "percent" },
      { key: "dmg_plunge", label: "Plunging Attack DMG Bonus", format: "percent" },
      { key: "dmg_skill", label: "Elemental Skill DMG Bonus", format: "percent" },
      { key: "dmg_burst", label: "Elemental Burst DMG Bonus", format: "percent" },
      { key: "dmg_all", label: "All DMG Bonus", format: "percent" },
    ],
  },
  {
    title: "Reaction Bonuses",
    rows: [
      { key: "dmg_reaction_overloaded", label: "Overloaded DMG Bonus", format: "percent" },
      { key: "dmg_reaction_superconduct", label: "Superconduct DMG Bonus", format: "percent" },
      { key: "dmg_reaction_electrocharged", label: "Electro-Charged DMG Bonus", format: "percent" },
      { key: "dmg_reaction_shatter", label: "Shatter DMG Bonus", format: "percent" },
      { key: "dmg_reaction_swirl", label: "Swirl DMG Bonus", format: "percent" },
      { key: "dmg_reaction_bloom", label: "Bloom DMG Bonus", format: "percent" },
      { key: "dmg_reaction_hyperbloom", label: "Hyperbloom DMG Bonus", format: "percent" },
      { key: "dmg_reaction_burgeon", label: "Burgeon DMG Bonus", format: "percent" },
      { key: "dmg_reaction_rupture", label: "Rupture DMG Bonus", format: "percent" },
      { key: "dmg_reaction_aggravate", label: "Aggravate DMG Bonus", format: "percent" },
      { key: "dmg_reaction_quicken", label: "Quicken DMG Bonus", format: "percent" },
      { key: "dmg_reaction_spread", label: "Spread DMG Bonus", format: "percent" },
      { key: "dmg_reaction_vaporize", label: "Vaporize DMG Bonus", format: "percent" },
      { key: "dmg_reaction_melt", label: "Melt DMG Bonus", format: "percent" },
      { key: "dmg_reaction_lunarcharged", label: "Lunar-Charged DMG Bonus", format: "percent" },
      { key: "dmg_reaction_lunarbloom", label: "Lunar-Bloom DMG Bonus", format: "percent" },
      { key: "dmg_reaction_lunarcrystallize", label: "Lunar-Crystallize DMG Bonus", format: "percent" },
    ],
  },
];

// Keys the registry consumes as a *decomposition input* (e.g. `atk_base`), plus
// known duplicate-value aliases the bag also emits (`mastery_total` mirrors
// `mastery` — same value, see buildStats.ts's FLAT_TOTAL_STATS + the separate
// `out["mastery"]` emit). Neither should re-surface as an "Other" row.
const SUPPRESSED_ALIASES = new Set(["mastery_total"]);

// Bag keys that are engine-internal inputs, not player-facing stats: enemy_*
// (resistance/def-ignore/def-reduce), any `*_base` decomposition input, and the
// (currently unused in this engine) char_/party_/resonance_ prefixes.
const INTERNAL_KEY_PATTERN = /^(enemy_|.*_base$|char_|party_|resonance_)/;

function humanizeSlug(slug: string): string {
  return slug
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function buildStatSheet(stats: Readonly<Record<string, number>>): StatSheetGroup[] {
  const consumed = new Set<string>();
  const groups: StatSheetGroup[] = [];

  for (const group of GROUPS) {
    const rows: StatRow[] = [];
    for (const reg of group.rows) {
      if (!(reg.key in stats)) continue;
      const total = stats[reg.key];
      if (!reg.core && total === 0) continue;

      consumed.add(reg.key);
      let base: number | null = null;
      let bonus = total;
      if (reg.baseKey && reg.baseKey in stats) {
        base = stats[reg.baseKey];
        bonus = total - base;
        consumed.add(reg.baseKey);
      }

      rows.push({ key: reg.key, label: reg.label, base, bonus, total, format: reg.format });
    }
    if (rows.length > 0) groups.push({ title: group.title, rows });
  }

  const otherRows: StatRow[] = [];
  for (const [key, value] of Object.entries(stats)) {
    if (consumed.has(key) || SUPPRESSED_ALIASES.has(key)) continue;
    if (INTERNAL_KEY_PATTERN.test(key)) continue;
    if (value === 0) continue;
    otherRows.push({ key, label: humanizeSlug(key), base: null, bonus: value, total: value, format: "flat" });
  }
  if (otherRows.length > 0) groups.push({ title: "Other", rows: otherRows });

  return groups;
}
