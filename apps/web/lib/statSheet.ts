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

// Bag keys the engine emits as 0-1 FRACTIONS (her `processPercent` /100 baked in at
// build time), which buildStatSheet must re-scale ×100 into percent POINTS so every
// `format: "percent"` row shares one display unit. Classified straight from
// `packages/data/src/buildStats.ts`'s own emit sites (read-only, never transcribed by
// hand) — NOT by format-flag alone, since `recharge_total` is also tagged "percent" for
// display but the engine emits it as a raw already-scaled number (FLAT_TOTAL_STATS,
// buildStats.ts:980-982, no `/100`), so it must be excluded from this set.
//   - crit_rate_total / crit_dmg_total — FRACTION_TOTAL_STATS loop, buildStats.ts:992-994
//   - dmg_<element> (incl. dmg_phys)   — DMG_BONUS_ELEMENT_KEYS loop, buildStats.ts:999-1004
//   - dmg_<type> / dmg_all             — DMG_BONUS_TYPE_KEYS loop, buildStats.ts:1006-1008
//   - dmg_reaction_*                   — REACTION_BONUS_PERCENT_KEYS loop, buildStats.ts:1146-1148
//   - healing / healing_recv           — HEAL_BONUS_KEYS loop, buildStats.ts:1098-1100
//   - shield                          — buildStats.ts:1058 (`raw.get("shield") / 100`)
const FRACTION_SCALE_KEYS = new Set([
  "crit_rate_total",
  "crit_dmg_total",
  "dmg_pyro",
  "dmg_hydro",
  "dmg_electro",
  "dmg_cryo",
  "dmg_anemo",
  "dmg_geo",
  "dmg_dendro",
  "dmg_phys",
  "dmg_normal",
  "dmg_charged",
  "dmg_plunge",
  "dmg_skill",
  "dmg_burst",
  "dmg_all",
  "dmg_reaction_overloaded",
  "dmg_reaction_superconduct",
  "dmg_reaction_electrocharged",
  "dmg_reaction_shatter",
  "dmg_reaction_swirl",
  "dmg_reaction_bloom",
  "dmg_reaction_hyperbloom",
  "dmg_reaction_burgeon",
  "dmg_reaction_rupture",
  "dmg_reaction_aggravate",
  "dmg_reaction_quicken",
  "dmg_reaction_spread",
  "dmg_reaction_vaporize",
  "dmg_reaction_melt",
  "dmg_reaction_lunarcharged",
  "dmg_reaction_lunarbloom",
  "dmg_reaction_lunarcrystallize",
  "healing",
  "healing_recv",
  "shield",
]);

// Bag keys that are engine-internal inputs, not player-facing stats: enemy_*
// (resistance/def-ignore/def-reduce), the `atk_base` decomposition input consumed
// via GROUPS' `baseKey` above, and the (currently unused in this engine)
// char_/party_/resonance_ prefixes.
//
// NOT a blanket `.*_base$` (final review HIGH fix, task-7 report): buildStats.ts
// emits exactly one OTHER top-level `_base` key, `healing_base` (buildStats.ts:
// 1093-1100, HEAL_BONUS_KEYS) — a character's ascension healing-bonus secondary
// (e.g. Jean/Qiqi), summed by the engine into `(1 + healing + healing_base +
// healing_recv)` (compileFeature.ts:936-943), NOT folded into `healing` pre-emit
// the way `dmg_phys_base` is folded into `dmg_phys` before it ever reaches the bag
// (buildStats.ts:996-1004). A blanket pattern silently ate it — see the fold into
// the Healing Bonus row below instead of suppressing it here.
const INTERNAL_KEY_PATTERN = /^(enemy_|atk_base$|char_|party_|resonance_)/;

// Bag keys folded into another registry row's value rather than shown as their own
// row (currently only `healing_base` → the Healing Bonus row's `healing`). Kept
// separate from SUPPRESSED_ALIASES because these carry real, distinct value that
// must be added in, not merely hidden.
const FOLDED_INTO: Readonly<Record<string, string>> = { healing_base: "healing" };

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
      const scale = FRACTION_SCALE_KEYS.has(reg.key) ? 100 : 1;
      // Fold in any independently-emitted bag keys this row absorbs (e.g.
      // `healing_base` into `healing` — see FOLDED_INTO), using the SAME scale as
      // the row's own key: both are engine FRACTION_SCALE_KEYS members.
      let folded = 0;
      for (const [srcKey, targetKey] of Object.entries(FOLDED_INTO)) {
        if (targetKey === reg.key && srcKey in stats) {
          folded += stats[srcKey] * scale;
          consumed.add(srcKey);
        }
      }

      if (!(reg.key in stats) && folded === 0) continue;
      const total = (reg.key in stats ? stats[reg.key] * scale : 0) + folded;
      if (!reg.core && total === 0) continue;

      consumed.add(reg.key);
      let base: number | null = null;
      let bonus = total;
      if (reg.baseKey && reg.baseKey in stats) {
        base = stats[reg.baseKey] * scale;
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
