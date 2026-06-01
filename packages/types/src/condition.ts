/**
 * Condition structural shapes.
 *
 * Conditions are the toggles/states that gate buff application.
 * They are purely declarative data at the DB layer; the engine resolves them.
 *
 * Sources:
 *   wiki/concepts/buff-condition-system.md
 *   wiki/architecture/db-object-model.md
 *   raw/genshin_calc_pub/src/js/classes/Condition/Boolean.js
 *   raw/genshin_calc_pub/src/js/classes/Condition/Boolean/Refine.js
 *   raw/genshin_calc_pub/src/js/classes/Condition/Static.js
 *   raw/genshin_calc_pub/src/js/classes/Condition/Static/Refine.js
 *   raw/genshin_calc_pub/src/js/classes/Condition/Constellation.js
 *   raw/genshin_calc_pub/src/js/classes/Condition/Number.js
 *   raw/genshin_calc_pub/src/js/classes/Condition/Stacks.js
 *   raw/genshin_calc_pub/src/js/classes/Condition/And.js
 *   raw/genshin_calc_pub/src/js/classes/Condition/Or.js
 *   raw/genshin_calc_pub/src/js/classes/Condition/Boolean/WeaponType.js
 */

import type { AscensionLevel, ConstellationLevel, Refinement } from "./character.js";
import type { AspirineStatKey } from "./stats.js";

/** Stats contributed when a condition is active. Keys are Aspirine stat keys (engine-internal layer). */
export type ConditionStats = Readonly<Partial<Record<AspirineStatKey | string, number>>>;

/** Settings applied when a condition is active (e.g. attack_infusion, level bonuses). */
export type ConditionSettings = Readonly<Record<string, unknown>>;

/**
 * The immutable evaluation context passed to condition evaluators.
 *
 * This is Aspirine's `settings` object, made explicit and immutable.
 * Keys are arbitrary strings; values are booleans, numbers, or strings
 * depending on the condition type.
 *
 * Examples:
 *   { char_constellation: 4, weapon_refine: 3 }
 *   { "set.noblesse_oblige_4": true, shenhe_icy_quill: 3 }
 */
export type EvalContext = Readonly<Record<string, unknown>>;

/**
 * Base fields shared by all condition variants.
 */
export interface ConditionBase {
  readonly name?: string;
  /** Used for serialization to URL/save state. */
  readonly serializeId?: number;
  readonly title?: string;
  readonly description?: string;
  /** Stats contributed when this condition is active (non-refine-scaled). */
  readonly stats?: ConditionStats;
  /** Settings applied when this condition is active (e.g. attack_infusion, level bonuses). */
  readonly settings?: ConditionSettings;
  /**
   * Optional gating condition. If present, this condition is only active
   * when the gate evaluates to true.
   * Replaces her `params.condition` (preferred) / `params.subConditions` (deprecated).
   */
  readonly condition?: Condition;
  /** Whether to invert the evaluation result. */
  readonly invert?: boolean;
}

/**
 * A user-toggled boolean condition (checkbox).
 * Example: Hu Tao "Paramita Papilio" (skill active), team Noblesse toggle.
 * Active when ctx[name] is truthy.
 */
export interface ConditionBoolean extends ConditionBase {
  readonly type: "boolean";
  readonly rotation?: string;
}

/**
 * A user-toggled boolean condition with per-refinement-rank stat values.
 * Evaluation semantics identical to ConditionBoolean (active when ctx[name] truthy).
 * Stats vary by weapon_refine: refinementStats[weapon_refine - 1].
 *
 * Ports raw/genshin_calc_pub/src/js/classes/Condition/Boolean/Refine.js
 * (ConditionBooleanRefine extends ConditionBoolean, resolves via stat.getValue(weapon_refine)).
 *
 * Example: WolfsGravestone's toggle passive (ATK +40/50/60/70/80% at R1..R5).
 */
export interface ConditionBooleanRefine extends ConditionBase {
  readonly type: "boolean-refine";
  readonly name: string;
  /**
   * Per-refinement stat bags. Index 0 = R1, index 4 = R5.
   * Resolve via: refinementStats[weapon_refine - 1].
   */
  readonly refinementStats: readonly ConditionStats[];
  readonly rotation?: string;
}

/**
 * A static condition that is always active when its gate/sub-conditions are met.
 * Example: ascension passives that are always on once unlocked.
 */
export interface ConditionStatic extends ConditionBase {
  readonly type: "static";
  readonly info?: {
    readonly ascension?: AscensionLevel | number;
    readonly constellation?: ConstellationLevel | number;
  };
}

/**
 * A condition gated by constellation level.
 * Active when ctx.char_constellation >= this.constellation.
 */
export interface ConditionConstellation extends ConditionBase {
  readonly type: "constellation";
  readonly constellation: ConstellationLevel | number;
}

/**
 * A condition with per-refinement-rank stat values.
 * Inherits Static evaluation semantics (always active unless gated/inverted).
 * Used by weapon passives that are always on but scale with refinement.
 *
 * Ports raw/genshin_calc_pub/src/js/classes/Condition/Static/Refine.js
 * (ConditionStaticRefine extends ConditionStatic, resolves via stat.getValue(weapon_refine)).
 *
 * `refinementStats` holds one ConditionStats bag per refinement rank (R1..R5, 0-indexed).
 * Resolve via: refinementStats[weapon_refine - 1].
 * `stats` (from ConditionBase) carries stats that do NOT vary by refine.
 *
 * Example: WolfsGravestone always-on passive (ATK +20/25/30/35/40% at R1..R5),
 *          The Catch burst passive (Burst DMG / Burst Crit Rate by refine).
 */
export interface ConditionStaticRefine extends ConditionBase {
  readonly type: "refine";
  /**
   * Per-refinement stat bags. Index 0 = R1, index 4 = R5.
   * Resolve via: refinementStats[weapon_refine - 1].
   */
  readonly refinementStats: readonly ConditionStats[];
}

/**
 * A numeric (slider/spinner) condition.
 * Active when ctx[name] > 0.
 * The numeric value is meaningful for display; evaluate() just gates on > 0.
 */
export interface ConditionNumber extends ConditionBase {
  readonly type: "number";
  readonly min?: number;
  readonly max?: number;
}

/**
 * A stack-count condition (0–maxStacks).
 * Active when ctx[name] > 0.
 * getStackCount() returns the clamped stack value for use in scaling calculations.
 *
 * When the per-stack stat values vary by refinement rank (raw: `levelSetting: "weapon_refine"`),
 * `refinementStats` holds one ConditionStats bag per refinement rank (R1..R5, 0-indexed),
 * each bag representing the per-stack stats at that rank.
 * Resolve via: refinementStats[weapon_refine - 1].
 *
 * Example: Lost Prayer's stack passive — 8/10/12/14/16% per stack per R1..R5.
 */
export interface ConditionStacks extends ConditionBase {
  readonly type: "stacks";
  readonly maxStacks: number;
  /**
   * Optional per-refinement stat bags for stack passives whose per-stack value
   * scales with weapon refinement. Index 0 = R1, index 4 = R5.
   */
  readonly refinementStats?: readonly ConditionStats[];
}

/**
 * A condition gated by equipped piece-count of a named artifact set.
 * Active when ctx["set_pieces.<setName-lowercased>"] >= count.
 *
 * Ports raw/genshin_calc_pub/src/js/classes/Condition/Boolean/PiecesCount.js
 * (`settings[Artifact.settingName(setName)] >= count`, where
 * `Artifact.settingName(name) = 'set_pieces.' + name.toLowerCase()`).
 *
 * This is the piece-count half of the global artifact-set buffs in
 * raw/.../db/Buffs/Artifacts.js (e.g. Noblesse +20% ATK, Deepwood -30% dendro res),
 * which gate on `(set.<x>_4 AND ConditionBooleanPiecesCount(<X>, 4)) OR set_other.<x>_4`.
 * `buildStats` injects the `set_pieces.<name>` count from its `setBonuses` input.
 */
export interface ConditionBooleanPiecesCount extends ConditionBase {
  readonly type: "pieces-count";
  /** Registry key of the set, e.g. "NoblesseOblige" (lowercased for the setting key). */
  readonly setName: string;
  /** Minimum equipped pieces for activation (2 or 4). */
  readonly count: number;
  /**
   * A pure gate — it contributes NO stats of its own (`conditionStats` returns `{}`
   * for this variant even when active, like `and`/`or`). Narrowed to `never` so
   * attaching a `stats` bag is a compile error, not a silently-discarded value.
   */
  readonly stats?: never;
}

/**
 * A condition gated by the wearer's weapon type.
 * Active when ctx["weapon_type"] is in `types` (AND the optional `.condition` gate passes).
 * Ports raw/genshin_calc_pub/src/js/classes/Condition/Boolean/WeaponType.js
 * (`this.params.types.includes(settings.weapon_type)`).
 */
export interface ConditionBooleanWeaponType extends ConditionBase {
  readonly type: "weapon-type";
  /** Allowed weapon types, e.g. ["sword","claymore","polearm"]. */
  readonly types: readonly string[];
  /** A pure gate — contributes NO stats (narrowed to `never`, like pieces-count). */
  readonly stats?: never;
}

/**
 * A condition gated by the enemy's current elemental affliction status.
 * Active when ctx["common.enemy_status"] is a non-empty string present in
 * `statuses` (AND the optional `.condition` gate passes; `invert` flips it).
 *
 * Ports raw/genshin_calc_pub/src/js/classes/Condition/Boolean/EnemyStatus.js
 * (`this.params.status.includes(settings['common.enemy_status'])`; an absent/empty
 * status → false). The enemy-status key is CALLER-supplied via settings (her
 * `settingsSets` presets enemy_no_status / enemy_cryo / …), so buildStats injects
 * nothing — it flows through `input.settings` unchanged. Every v5.8 oracle fixture
 * leaves it unset → these gates are inert (the guarded DMG bonus / FeatureDamage
 * branch is dormant), matching her output exactly.
 *
 * `invert: true` (her `ConditionNot([ConditionEnemyStatus])`) is the "enemy NOT
 * affected" branch — Dragonspine Spear / Frostbearer / Snow-Tombed Starsilver's
 * lower-multiplier Everfrost hit, which fires when no cryo status is set.
 */
export interface ConditionEnemyStatus extends ConditionBase {
  readonly type: "enemy-status";
  /** Enemy affliction elements that activate this condition, e.g. ["cryo", "hydro"]. */
  readonly statuses: readonly string[];
  /** A pure gate — contributes NO stats of its own (narrowed to `never`, like weapon-type). */
  readonly stats?: never;
}

/**
 * Logical AND of all items — all must evaluate to true.
 * Vacuous truth: empty items list → true.
 */
export interface ConditionAnd {
  readonly type: "and";
  readonly items: readonly Condition[];
}

/**
 * Logical OR of all items — at least one must evaluate to true.
 * Empty items list → false.
 */
export interface ConditionOr {
  readonly type: "or";
  readonly items: readonly Condition[];
}

/** Discriminated union of all condition types. */
export type Condition =
  | ConditionBoolean
  | ConditionBooleanRefine
  | ConditionStatic
  | ConditionConstellation
  | ConditionStaticRefine
  | ConditionNumber
  | ConditionStacks
  | ConditionBooleanPiecesCount
  | ConditionBooleanWeaponType
  | ConditionEnemyStatus
  | ConditionAnd
  | ConditionOr;

export type { AscensionLevel, ConstellationLevel, Refinement };
