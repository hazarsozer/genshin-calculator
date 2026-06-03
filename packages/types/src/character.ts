/**
 * Character domain types.
 *
 * Sources:
 *   wiki/tools/calculator/db-object-model.md
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
  /**
   * Optional second stat for a max(fromStat, fromStatMax) base derivation.
   *
   * When present, the effective base is `max(getTotal(fromStat), getTotal(fromStatMax))`
   * instead of `getTotal(fromStat)` alone. Mirrors `PostEffectStatsNahida.getBaseValueTree`
   * (PostEffect/Stats/Nahida.js:6-11) which returns `CMax([makeStatTotalItem('mastery'),
   * makeStatItem('party_max_mastery')])` — the larger of Nahida's own mastery total and
   * the party's max mastery (injected as a stat by ConditionNumber `party_max_mastery`).
   *
   * Source: raw/genshin_calc_pub/src/js/classes/PostEffect/Stats/Nahida.js
   */
  readonly fromStatMax?: string;
  /** Stat the bonus is written TO (e.g. `atk`). */
  readonly toStat: string;
  /**
   * Fixed multiplier applied to `getTotal(fromStat)` (fraction, e.g. 0.0626).
   * Ignored when `ratioFromTalent` is set — in that case the ratio is resolved
   * at runtime from the talent table at the effective (bumped) talent level.
   */
  readonly ratio?: number;
  /**
   * Talent-scaled ratio — when present, supersedes `ratio`. The effective
   * talent level is resolved at runtime as:
   *   `effectiveLevel = settings[levelSetting] + (settings[levelSetting + '_bonus'] ?? 0)`
   *   `ratio = table.getValue(effectiveLevel) * multi`
   *
   * Mirrors her `PostEffect.getLevel` (PostEffect.js) + `Talents.getMulti`
   * (DbObjectTalents.js). The `levelSetting` key must be present in the merged
   * settings when the post-effect fires (inject the base talent levels via
   * `BuildInput.talentLevels`). The constellation `_bonus` offset is already
   * propagated into the merged settings by the keystone (P2.C).
   *
   * Source: raw/genshin_calc_pub/src/js/classes/PostEffect.js (getLevel),
   *         raw/genshin_calc_pub/src/js/db/Char/Hutao.js:145-158 (atkBuffPost).
   */
  readonly ratioFromTalent?: {
    /** Talent multiplier table; `getValue(level)` returns the raw percent value. */
    readonly table: TalentTable;
    /** Settings key whose value is the BASE talent level (e.g. `char_skill_elemental`). */
    readonly levelSetting: string;
    /** Divisor/multiplier applied to the table value (e.g. `0.01` for a percent→fraction fold). */
    readonly multi: number;
  };
  /**
   * Optional talent-table bonus contributed directly to `toStat`, without
   * multiplying by any base stat. When present, `bonus = table.getValue(effectiveLevel)`
   * where effectiveLevel = settings[levelSetting] + settings[levelSetting_bonus] + _bonus_2.
   *
   * This models Nahida's `ConditionLevels` burst bonus: `dmg_skill_nahida` gains a
   * fixed percent at the character's effective burst talent level (rather than being
   * derived from a base stat like ATK or HP). The `fromStat` field is IGNORED when
   * `talentBonus` is present.
   *
   * Source: raw/genshin_calc_pub/src/js/db/Char/Nahida.js:338-371 (ConditionLevels,
   *         levelSetting='char_skill_burst', stats=[StatTable('dmg_skill_nahida', ...)]),
   *         raw/genshin_calc_pub/src/js/classes/Condition/Levels.js (getStats → getLevel).
   */
  readonly talentBonus?: {
    /** Talent multiplier table; `getValue(level)` returns the raw percent value. */
    readonly table: TalentTable;
    /** Settings key for the BASE talent level (e.g. `char_skill_burst`). */
    readonly levelSetting: string;
  };
  /**
   * Optional subtraction applied to `getTotal(fromStat)` BEFORE multiplying by
   * the ratio. The bonus is floored at 0 after the subtraction:
   *   `bonus = max(0, getTotal(fromStat) − offset) × ratio`
   *
   * Mirrors `PostEffectStatsExceedRecharge` (ExceedRecharge.js) which computes
   * `max(0, recharge_decimal − 1)` in her engine (recharge stored as decimal
   * post `processPercent`). In our engine recharge is stored as raw percent,
   * so the equivalent offset is 100:
   *   `max(0, recharge_percent − 100) × 0.4` → 52.8 at recharge=232.
   *
   * Source: raw/genshin_calc_pub/src/js/classes/PostEffect/Stats/ExceedRecharge.js
   */
  readonly offset?: number;
  /** Optional cap on the bonus, as `capRatio × getTotal(capStat)`. */
  readonly cap?: { readonly capStat: string; readonly capRatio: number };
  /**
   * Optional ABSOLUTE cap on the bonus (a constant ceiling, not stat-derived).
   * Mirrors her `statCap: new ValueTable([…])` (a fixed `Math.min` ceiling) as
   * opposed to the stat-relative `statCapPost` modelled by `cap`. Used by
   * Ineffa's `lunarcharged_multi` passive (`min(0.00007 × atk_total, 0.14)`).
   */
  readonly capValue?: number;
  /**
   * Optional ABSOLUTE cap resolved from a level-indexed table — the refine-scaled
   * analogue of `capValue`. Mirrors her `statCap: new StatTable('', [...])` with a
   * `levelSetting` (e.g. Ring of Yaxche / Engulfing Lightning whose ATK%/DMG caps
   * scale with refine: [16,20,24,28,32] keyed off `weapon_refine`). The cap is
   * `table.getValue(settings[levelSetting])`; the bonus is `Math.min(bonus, cap)`.
   * Use this (not `capValue`) when the ceiling itself is refine/talent-scaled.
   *
   * Source: raw/.../classes/PostEffect/Stats.js (statCap via getLevel(levelSetting)).
   */
  readonly capValueFromTalent?: {
    readonly table: TalentTable;
    readonly levelSetting: string;
  };
  /**
   * A per-stack ADDITIVE term on the ratio: `ratio += table.getValue(settings[levelSetting]) ×
   * (settings[setting] || 0)`. Models her `PostEffectStats.percentBonus` × `bonusStackSettings`
   * (Staff of the Scarlet Sands: EM→ATK = (base 0.52…1.04 + bonus 0.28…0.56 × stacks)) and the
   * `stacksSetting` multiplier (the whole ratio scaled by a stack count). The stack count is the
   * caller-supplied `settings[setting]`; absent → 0 → no contribution (base-safe).
   *
   * NOTE: the fold uses `settings[setting] ?? 0` (absent → 0 stacks → no contribution), which
   * diverges from her `PostEffectStats.getStacks` fallback of `settings[stacksSetting] || 1`
   * (absent → 1). Harmless wherever the stack setting is always present (every v5.8 user — e.g.
   * key_of_khaj_nisut sets `weapon_key_of_khaj_nisut: 3`); only matters if a future port relies
   * on a `stacksSetting` post-effect applying once when the count is unset.
   *
   * Source: raw/.../classes/PostEffect/Stats.js (getStacks / percentBonus × bonusStackSettings).
   */
  readonly ratioPerStack?: {
    readonly setting: string;
    readonly table: TalentTable;
    readonly levelSetting: string;
  };
  /**
   * When true, the stat-relative `cap` reads the BASE stat (`capStat + '_base'`)
   * × `capRatio` rather than `getTotal(capStat)` × `capRatio`.
   *
   * Mirrors her `statCapPost` whose base is a `from: '<stat>_base'` term — a plain
   * `makeStatItem('<stat>_base')` (the base value), NOT a `getTotal`. Hu Tao's
   * Paramita HP→ATK cap is `atk_base × 4` (Hutao.js:155-158, `from: 'atk_base'`,
   * `atk_percent[SkillMaxBonus=400]`), so the build's `atk_percent`/flat ATK do not
   * loosen the cap. Only set on characters whose cap base is the BASE stat; the
   * default (`getTotal(capStat)`) is preserved for any `getTotal`-cap effect.
   */
  readonly capUsesBase?: boolean;
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
  /**
   * Always-active passive stat bonuses, RAW (un-percent-processed) — the stats
   * contributed by ascension/passive conditions that are auto-active under the
   * canonical build (ascension 6, constellation 0, no toggles). `buildStats`
   * concats these into the stat bag exactly like the bonus block.
   *
   * Faithful to her `getBuildData`, which applies the stats of every condition
   * active under the baseline settings (a `ConditionStatic` gated ONLY by
   * `ConditionAscensionChar` with no boolean toggle is auto-active). E.g. Amber's
   * A1 `crit_rate_amber: 10` (Amber.js:289-300). Conditions that require a boolean
   * toggle (A4 atk%, etc.) are OFF at baseline and are NOT listed here.
   */
  readonly baseStats?: Readonly<Record<string, number>>;
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
  /**
   * True for a character whose data enables Lunar-Charged by default (her
   * `allowed_lunarcharged: 1` — Ineffa only, as of v5.8). Suppresses the generic
   * `electrocharged` transformative-reaction contribution (her `electrocharged`
   * is gated by `ConditionNot([lunarchargedCond])`); the Lunar-Charged variants
   * are declared explicitly on the character instead.
   *
   * Source: raw/genshin_calc_pub/src/js/db/Char/Ineffa.js:355
   */
  readonly lunarChargedActive?: boolean;
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
