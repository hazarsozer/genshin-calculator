/**
 * Stat key definitions and the Aspirine↔GOOD mapping.
 *
 * GOOD (Genshin Open Object Description) is the community-standard import/export
 * format used by artifact scanners and other tools. GOOD stores percentages as
 * whole numbers: e.g. 46.6 means 46.6%, NOT 0.466. Keep this convention
 * throughout the new calculator.
 *
 * Aspirine's keys are the internal vocabulary used in her calculator's source.
 * The mapping below is the single source of truth — derived from:
 *   wiki/concepts/stat-keys-and-good-format.md
 */

/**
 * GOOD stat keys for character/weapon/artifact build stats.
 * Engine-internal keys (enemy_res_*, dmg_reaction_*, etc.) are in EngineStatKey.
 */
export type GoodStatKey =
  // Flat
  | "hp"
  | "atk"
  | "def"
  // Percent
  | "hp_"
  | "atk_"
  | "def_"
  // Combat
  | "critRate_"
  | "critDMG_"
  | "enerRech_"
  | "eleMas"
  | "heal_"
  // Elemental DMG%
  | "pyro_dmg_"
  | "hydro_dmg_"
  | "electro_dmg_"
  | "cryo_dmg_"
  | "anemo_dmg_"
  | "geo_dmg_"
  | "dendro_dmg_"
  | "physical_dmg_";

/** Aspirine's internal stat keys (the vocabulary in her db/ and Buffs/ files). */
export type AspirineStatKey =
  // Flat
  | "hp"
  | "atk"
  | "def"
  // Percent
  | "hp_percent"
  | "atk_percent"
  | "def_percent"
  // Combat
  | "crit_rate"
  | "crit_dmg"
  | "recharge"
  | "mastery"
  | "heal"
  // Elemental DMG%
  | "dmg_pyro"
  | "dmg_hydro"
  | "dmg_electro"
  | "dmg_cryo"
  | "dmg_anemo"
  | "dmg_geo"
  | "dmg_dendro"
  | "dmg_physical";

/**
 * Engine-internal stat keys that have no GOOD equivalent.
 * These are calc-internal; they never appear in build imports/exports.
 *
 * Source: wiki/concepts/stat-keys-and-good-format.md §"Keys with no GOOD equivalent"
 */
export type EngineStatKey =
  // Generic / typed DMG bonus
  | "dmg_all"
  | "dmg_normal"
  | "dmg_charged"
  | "dmg_plunge"
  | "dmg_skill"
  | "dmg_burst"
  // Reaction DMG bonus
  | "dmg_reaction_vaporize"
  | "dmg_reaction_melt"
  | "dmg_reaction_overload"
  | "dmg_reaction_superconduct"
  | "dmg_reaction_electrocharged"
  | "dmg_reaction_swirl"
  | "dmg_reaction_bloom"
  | "dmg_reaction_hyperbloom"
  | "dmg_reaction_burgeon"
  // Enemy resistance / DEF
  | "enemy_res_physical"
  | "enemy_res_pyro"
  | "enemy_res_hydro"
  | "enemy_res_electro"
  | "enemy_res_cryo"
  | "enemy_res_anemo"
  | "enemy_res_geo"
  | "enemy_res_dendro"
  | "enemy_def_reduce"
  | "enemy_def_ignore";

// ---------------------------------------------------------------------------
// Runtime maps (the only runtime logic in this package)
// ---------------------------------------------------------------------------

/**
 * Ordered list of all core GOOD stat keys that have an Aspirine equivalent.
 * Order mirrors the mapping table in wiki/concepts/stat-keys-and-good-format.md.
 */
export const GOOD_STAT_KEYS: readonly GoodStatKey[] = [
  "hp",
  "atk",
  "def",
  "hp_",
  "atk_",
  "def_",
  "critRate_",
  "critDMG_",
  "enerRech_",
  "eleMas",
  "heal_",
  "pyro_dmg_",
  "hydro_dmg_",
  "electro_dmg_",
  "cryo_dmg_",
  "anemo_dmg_",
  "geo_dmg_",
  "dendro_dmg_",
  "physical_dmg_",
] as const;

/** Ordered list of Aspirine keys corresponding 1:1 with GOOD_STAT_KEYS. */
export const ASPIRINE_STAT_KEYS: readonly AspirineStatKey[] = [
  "hp",
  "atk",
  "def",
  "hp_percent",
  "atk_percent",
  "def_percent",
  "crit_rate",
  "crit_dmg",
  "recharge",
  "mastery",
  "heal",
  "dmg_pyro",
  "dmg_hydro",
  "dmg_electro",
  "dmg_cryo",
  "dmg_anemo",
  "dmg_geo",
  "dmg_dendro",
  "dmg_physical",
] as const;

// Load-time invariant: the two key arrays are positionally paired, so they MUST
// be equal length. Enforce it here so a future drift fails loudly at import (the
// `as` casts below otherwise mask a `GoodStatKey | undefined` under
// noUncheckedIndexedAccess). Cardinality is also asserted in stats.test.ts.
/* v8 ignore start -- defensive: the throw branch is unreachable while the arrays stay paired */
if (GOOD_STAT_KEYS.length !== ASPIRINE_STAT_KEYS.length) {
  throw new Error(
    `BUG: GOOD_STAT_KEYS (${GOOD_STAT_KEYS.length}) and ASPIRINE_STAT_KEYS ` +
      `(${ASPIRINE_STAT_KEYS.length}) must be equal length (positional bijection).`
  );
}
/* v8 ignore stop */

/** Maps Aspirine stat key → GOOD stat key. */
export const aspirineToGood: Readonly<Record<AspirineStatKey, GoodStatKey>> =
  Object.fromEntries(
    ASPIRINE_STAT_KEYS.map((a, i) => [a, GOOD_STAT_KEYS[i]])
  ) as Record<AspirineStatKey, GoodStatKey>;

/** Maps GOOD stat key → Aspirine stat key. */
export const goodToAspirine: Readonly<Record<GoodStatKey, AspirineStatKey>> =
  Object.fromEntries(
    GOOD_STAT_KEYS.map((g, i) => [g, ASPIRINE_STAT_KEYS[i]])
  ) as Record<GoodStatKey, AspirineStatKey>;
