/**
 * Character domain types.
 *
 * Sources:
 *   wiki/architecture/db-object-model.md
 *   raw/genshin_calc_pub/src/js/db/Char/Hutao.js
 */

import type { Feature, FeatureMultiplierEntry } from "./feature.js";
import type { Condition } from "./condition.js";

// ---------------------------------------------------------------------------
// Branded numeric ranges
// ---------------------------------------------------------------------------

/** Character level 1–90. */
export type CharacterLevel = number & { readonly __brand: "CharacterLevel" };

/** Talent level 1–15. */
export type TalentLevel = number & { readonly __brand: "TalentLevel" };

/** Ascension phase 0–6. */
export type AscensionLevel = number & { readonly __brand: "AscensionLevel" };

/** Weapon refinement rank 1–5. */
export type Refinement = number & { readonly __brand: "Refinement" };

/** Constellation level 0–6. */
export type ConstellationLevel = number & {
  readonly __brand: "ConstellationLevel";
};

// ---------------------------------------------------------------------------
// Branded-level smart constructors (range-checked)
// ---------------------------------------------------------------------------

/**
 * Validate an integer against an inclusive [min, max] range and brand it.
 * Throws a `RangeError` on a non-integer or out-of-range input — game data is
 * always in-range, so a failure here signals a data bug we want to surface
 * loudly rather than silently propagate.
 */
function mintLevel<B extends number>(
  value: number,
  min: number,
  max: number,
  label: string
): B {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new RangeError(
      `${label} must be an integer in [${min}, ${max}], got ${value}`
    );
  }
  return value as B;
}

/** Mint a CharacterLevel (1–90). */
export function asCharacterLevel(value: number): CharacterLevel {
  return mintLevel<CharacterLevel>(value, 1, 90, "CharacterLevel");
}

/** Mint a TalentLevel (1–15). */
export function asTalentLevel(value: number): TalentLevel {
  return mintLevel<TalentLevel>(value, 1, 15, "TalentLevel");
}

/** Mint an AscensionLevel (0–6). */
export function asAscensionLevel(value: number): AscensionLevel {
  return mintLevel<AscensionLevel>(value, 0, 6, "AscensionLevel");
}

/** Mint a Refinement (1–5). */
export function asRefinement(value: number): Refinement {
  return mintLevel<Refinement>(value, 1, 5, "Refinement");
}

/** Mint a ConstellationLevel (0–6). */
export function asConstellationLevel(value: number): ConstellationLevel {
  return mintLevel<ConstellationLevel>(value, 0, 6, "ConstellationLevel");
}

// ---------------------------------------------------------------------------
// Enums-as-unions
// ---------------------------------------------------------------------------

/** The seven playable elements plus Physical (non-elemental). */
export type Element =
  | "pyro"
  | "hydro"
  | "electro"
  | "cryo"
  | "anemo"
  | "geo"
  | "dendro"
  | "physical";

/** Weapon categories a character can equip. */
export type WeaponType =
  | "sword"
  | "claymore"
  | "polearm"
  | "bow"
  | "catalyst";

// ---------------------------------------------------------------------------
// Stat-table & talent-table structural shapes
// ---------------------------------------------------------------------------

/**
 * A single base-stat provider in a character/weapon `statTable`.
 *
 * Mirrors her `StatTableAscensionScale` / `StatTableAscension` entries
 * (db/generated/CharTables.js, WeaponStatTables.js): each is named by the stat
 * it produces (`atk_base`, `hp_base`, `crit_dmg_base`, …) and yields a value at
 * a given level + ascension phase. `buildStats` reads each entry's
 * `getValue(level, ascension)` and accumulates it under `getName()`.
 *
 * Source: raw/genshin_calc_pub/src/js/classes/StatTable/Ascension/Scale.js
 */
export interface StatTableEntry {
  /** The stat key this entry contributes (e.g. `atk_base`). */
  getName(): string;
  /** Base-stat value at the given level + ascension phase. */
  getValue(level: number, ascension: number): number;
}

/** A character's base-stat table — the ordered list of per-stat providers. */
export type CharStatTable = readonly StatTableEntry[];

/**
 * Resolves a talent path (e.g. `attack.normal_hit_1`) to its per-talent-level
 * multiplier values. Mirrors her `DbObjectTalents.get(path)`, which returns the
 * `StatTable` whose `getValue(talentLevel)` yields the percent-of-scaling value.
 *
 * Source: raw/genshin_calc_pub/src/js/classes/DbObject/Talents.js
 */
export interface TalentTable {
  /** Per-talent-level values for one talent path; `getValue(level)` is 1-indexed. */
  getValue(level: number): number;
}

// ---------------------------------------------------------------------------
// Post-effect & constellation structural shapes
// ---------------------------------------------------------------------------

/**
 * Declarative shape of a character post-effect (HP→ATK, DEF→ATK derivations).
 *
 * This is the DATA shape only — the engine layer (`@genshin/core`) adapts it
 * into an executable `PostEffect` (its `contribute(stats, settings)` reads the
 * pre-group snapshot and returns a delta). Keeping the declarative shape here
 * preserves engine purity: `@genshin/types` never imports `@genshin/core`.
 *
 * Mirrors her `PostEffectStatsHP` (HP→ATK with a `statCapPost` cap) gated by a
 * boolean condition.
 *
 * Source: raw/genshin_calc_pub/src/js/classes/PostEffect/Stats/HP.js
 */
export interface CharPostEffect {
  /** Execution order; lower runs first. */
  readonly priority?: number;
  /** Stat the bonus is derived FROM (e.g. `hp` → reads `getTotal('hp')`). */
  readonly fromStat: string;
  /** Stat the bonus is written TO (e.g. `atk`). */
  readonly toStat: string;
  /** Multiplier applied to `getTotal(fromStat)` (fraction, e.g. 0.0626). */
  readonly ratio: number;
  /** Optional cap on the bonus, as `capRatio × getTotal(capStat)`. */
  readonly cap?: { readonly capStat: string; readonly capRatio: number };
  /**
   * Optional ABSOLUTE cap on the bonus (a constant ceiling, not stat-derived).
   * Mirrors her `statCap: new ValueTable([…])` (a fixed `Math.min` ceiling) as
   * opposed to the stat-relative `statCapPost` modelled by `cap`. Used by
   * Ineffa's `lunarcharged_multi` passive (`min(0.00007 × atk_total, 0.14)`).
   */
  readonly capValue?: number;
  /** Conditions gating the effect; ALL must evaluate true (settings-driven). */
  readonly conditions?: readonly Condition[];
}

/**
 * Constellation data — per-constellation-level entries carrying conditions/stats.
 * Opaque to the glue for now (constellation modelling beyond what Hu Tao's
 * end-to-end proof needs is out of P1.7a scope); typed as a structural list so
 * P1.7b can refine it without reworking the contract.
 *
 * Source: raw/genshin_calc_pub/src/js/classes/DbObject/Constellation.js
 */
export interface CharConstellation {
  readonly entries: readonly { readonly conditions?: readonly Condition[] }[];
}

// ---------------------------------------------------------------------------
// DbObjectChar structural shape
// ---------------------------------------------------------------------------

/**
 * Structural shape of a character entity as registered in DB.
 *
 * Fields drawn from DbObjectChar constructor usage in Hutao.js:
 *   name, rarity, element, weapon, origin, talents, statTable, features,
 *   postEffects, conditions, multipliers, constellation, partyData.
 *
 * P1.7a binds the seven formerly-`unknown` fields (`statTable`, `talents`,
 * `features`, `conditions`, `postEffects`, `constellation`, `multipliers`) to
 * real types now that the engine model (P1.5) and stat system (P1.3) exist.
 * The glue in `@genshin/data` (compileFeature / buildStats) consumes these.
 */
export interface DbObjectChar {
  readonly name: string;
  /** Game-internal numeric ID. */
  readonly gameId: number;
  readonly rarity: 4 | 5;
  readonly element: Element;
  readonly weapon: WeaponType;
  /** Region of origin (liyue, mondstadt, etc.). */
  readonly origin: string;
  /** Base-stat providers (per-stat StatTable entries) for each level/ascension. */
  readonly statTable: CharStatTable;
  /** Talent-path → multiplier-table resolver (her DbObjectTalents). */
  readonly talents: TalentResolver;
  /** Ordered list of combat feature declarations. */
  readonly features: readonly Feature[];
  /** Weapon/constellation proc multipliers (defaults to []). */
  readonly multipliers: readonly FeatureMultiplierEntry[];
  /** Optional post-effects (HP→ATK derivations, etc.). */
  readonly postEffects?: readonly CharPostEffect[];
  /** Character-level conditions (buffs, toggles). */
  readonly conditions?: readonly Condition[];
  /** Constellation data. */
  readonly constellation?: CharConstellation;
  /** Party (external) conditions the character provides. */
  readonly partyData?: { readonly conditions: readonly Condition[] };
}

/**
 * Resolves a talent path to its multiplier table. Her `DbObjectTalents` exposes
 * `get(path)`; the glue calls it to obtain the `TalentTable` for a feature's
 * `FeatureMultiplierEntry.values`.
 *
 * Source: raw/genshin_calc_pub/src/js/classes/DbObject/Talents.js
 */
export interface TalentResolver {
  get(path: string): TalentTable;
}
