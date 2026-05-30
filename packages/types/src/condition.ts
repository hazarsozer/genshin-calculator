/**
 * Condition structural shapes.
 *
 * Conditions are the toggles/states that gate buff application.
 * They are purely declarative data at the DB layer; the engine resolves them.
 *
 * Sources:
 *   wiki/concepts/buff-condition-system.md
 *   wiki/architecture/db-object-model.md
 *   raw/genshin_calc_pub/src/js/db/Char/Hutao.js (ConditionBoolean, ConditionConstellation,
 *     ConditionStatic usage)
 *   raw/genshin_calc_pub/src/js/db/Weapon/Sword/AquilaFavonia.js (ConditionStaticRefine)
 */

import type { AscensionLevel, ConstellationLevel, Refinement } from "./character.js";
import type { AspirineStatKey } from "./stats.js";

/** Stats contributed when a condition is active. Keys are Aspirine stat keys (engine-internal layer). */
export type ConditionStats = Readonly<Partial<Record<AspirineStatKey | string, number>>>;

/** Settings modified when a condition is active (e.g. attack_infusion, level bonuses). */
export type ConditionSettings = Readonly<Record<string, unknown>>;

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
  /** Sub-conditions gating this condition. */
  readonly subConditions?: readonly ConditionBase[];
}

/**
 * A user-toggled boolean condition (checkbox).
 * Example: Hu Tao "Paramita Papilio" (skill active).
 */
export interface ConditionBoolean extends ConditionBase {
  readonly type: "boolean";
  readonly rotation?: string;
}

/**
 * A static condition that is always active when its sub-conditions are met.
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
 * When active, may contribute talent level bonuses to settings.
 */
export interface ConditionConstellation extends ConditionBase {
  readonly type: "constellation";
  readonly constellation: ConstellationLevel | number;
}

/**
 * A condition with per-refinement-rank stat values.
 * Used by weapon passives (ConditionStaticRefine in Aspirine).
 */
export interface ConditionStaticRefine extends ConditionBase {
  readonly type: "refine";
  /** Refinement-indexed stat tables. */
  readonly refinementStats?: readonly unknown[];
}

/** Discriminated union of all condition types. */
export type Condition =
  | ConditionBoolean
  | ConditionStatic
  | ConditionConstellation
  | ConditionStaticRefine;

/** A condition in "loose" form — as Aspirine constructs them (class instances). */
export type ConditionLike = ConditionBase;

export type { AscensionLevel, ConstellationLevel, Refinement };
