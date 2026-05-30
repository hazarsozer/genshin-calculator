/**
 * Damage output types and the context passed to the engine.
 *
 * Sources:
 *   wiki/concepts/damage-formula.md
 *   wiki/concepts/crit.md
 */

import type { GoodStatKey, EngineStatKey } from "./stats.js";
import type { Element } from "./character.js";

/**
 * Legacy tuple form: [normal, crit, avg].
 * Kept for backward-compatibility with the P1.0 scaffold; prefer DamageResult
 * (named fields) in new code. P1.5 will decide the canonical engine form.
 */
export type DamageTriple = readonly [number, number, number];

/**
 * The damage triple produced for every hit.
 *
 * - `normal`  — non-crit hit value
 * - `crit`    — guaranteed-crit hit value = normal × (1 + critDMG)
 * - `avg`     — expected average = normal × (1 + critRate × critDMG)
 *              = non-crit × (1 − critRate) + crit × critRate
 *
 * critRate is clamped to [0, 1] before use; overcapped rate is wasted.
 * This triple is the top-level invariant for golden tests.
 */
export interface DamageResult {
  readonly normal: number;
  readonly crit: number;
  readonly avg: number;
}

/** All stat keys visible to the engine (build stats + engine-internal). */
export type AnyStatKey = GoodStatKey | EngineStatKey;

/**
 * Aggregated build stats consumed by the engine at formula-execution time.
 * Keys are AnyStatKey; values follow the GOOD convention for build stats
 * (whole-number percents for % stats), and Aspirine's internal convention
 * for engine-internal keys (verify per key during P1.3).
 */
export type BuildStats = Readonly<Partial<Record<AnyStatKey, number>>>;

/**
 * Enemy parameters for the defence and resistance multipliers.
 *
 * Sources:
 *   wiki/concepts/def-multiplier.md
 *   wiki/concepts/res-multiplier.md
 */
export interface EnemyParams {
  readonly level: number;
  /** Base elemental resistances keyed by element, as percentages (e.g. 10 = 10%). */
  readonly resistance: Readonly<Partial<Record<Element, number>>>;
}

/**
 * The full context the engine needs to evaluate a damage formula.
 * Passed to the compiled function that returns DamageResult.
 *
 * NOTE: This is a minimal faithful shape. P1.5 (engine core) will extend it
 * with talent levels, reaction multipliers, and post-effect state.
 */
export interface DamageContext {
  readonly stats: BuildStats;
  readonly enemy: EnemyParams;
  /** Attacker character level (used in def multiplier). */
  readonly characterLevel: number;
}
