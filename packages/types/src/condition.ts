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
 *   raw/genshin_calc_pub/src/js/classes/Condition/Static.js
 *   raw/genshin_calc_pub/src/js/classes/Condition/Static/Refine.js
 *   raw/genshin_calc_pub/src/js/classes/Condition/Constellation.js
 *   raw/genshin_calc_pub/src/js/classes/Condition/Number.js
 *   raw/genshin_calc_pub/src/js/classes/Condition/Stacks.js
 *   raw/genshin_calc_pub/src/js/classes/Condition/And.js
 *   raw/genshin_calc_pub/src/js/classes/Condition/Or.js
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
  /** Stats contributed when this condition is active. */
  readonly stats?: ConditionStats;
  /** Settings applied when this condition is active. */
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
 * Used by weapon passives.
 *
 * `refinementStats` holds one ConditionStats bag per refinement rank (R1..R5,
 * 0-indexed). Resolve via: refinementStats[weapon_refine - 1].
 * `stats` (inherited from ConditionBase) carries stats that do NOT vary by refine
 * (rare for weapons; more common for character/artifact static passives).
 */
export interface ConditionStaticRefine extends ConditionBase {
  readonly type: "refine";
  /** Per-refinement stat bags: index 0 = R1, index 4 = R5. */
  readonly refinementStats?: readonly ConditionStats[];
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
 */
export interface ConditionStacks extends ConditionBase {
  readonly type: "stacks";
  readonly maxStacks: number;
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
  | ConditionStatic
  | ConditionConstellation
  | ConditionStaticRefine
  | ConditionNumber
  | ConditionStacks
  | ConditionAnd
  | ConditionOr;

export type { AscensionLevel, ConstellationLevel, Refinement };
