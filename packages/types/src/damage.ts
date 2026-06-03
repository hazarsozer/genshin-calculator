/**
 * Damage output types and the context passed to the engine.
 *
 * Sources:
 *   wiki/game/mechanics/damage-formula.md
 *   wiki/game/mechanics/crit.md
 */

import type { GoodStatKey, EngineStatKey } from "./stats.js";
import type { Element } from "./character.js";

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
 *
 * This is an OPEN bag (string → number): the engine reads dynamically-named and
 * derived keys at execution time — e.g. `atk_total` (a "total" stat aggregated
 * by the Stats layer, P1.3), per-element `enemy_res_pyro`, post-effect-minted
 * keys, and feature-specific flat-bonus keys (`<feature>_bonus_flat`). Her engine
 * models stats as exactly such an open `Record<string, number>` (Stats.js); a
 * closed union would wrongly reject these and is the wrong contract for the
 * compile layer (P1.5).
 *
 * The intersection with `Partial<Record<AnyStatKey, number>>` keeps the known
 * GOOD + engine-internal keys discoverable (autocomplete / spell-check) while
 * still permitting any string key. Absent keys read as 0 in the engine
 * (matching Stats.get()).
 *
 * Value convention: percent stats are FRACTIONS at execution time (her
 * processPercent divides by 100 once before the formula runs); flat stats are
 * raw. See wiki/game/mechanics/stat-keys-and-good-format.md.
 */
export type BuildStats = Readonly<Partial<Record<AnyStatKey, number>>> &
  Readonly<Record<string, number>>;

/**
 * Enemy parameters for the defence and resistance multipliers.
 *
 * Sources:
 *   wiki/game/mechanics/def-multiplier.md
 *   wiki/game/mechanics/res-multiplier.md
 */
export interface EnemyParams {
  readonly level: number;
  /**
   * Base elemental resistances keyed by element, as percentages (e.g. 10 = 10%).
   *
   * INPUT FIELD — reserved for the P1.7 data layer. The compile engine does NOT
   * read this field directly; it reads the aggregated `enemy_res_<element>` stat
   * keys from `ctx.stats` (already a fraction, with shred folded in). The P1.7
   * data loader is responsible for folding `resistance` entries into the
   * appropriate `enemy_res_<element>` keys before building the DamageContext.
   */
  readonly resistance: Readonly<Partial<Record<Element, number>>>;
}

/**
 * The full context the engine needs to evaluate a damage formula.
 * Passed to the compiled function that returns DamageResult.
 *
 * NOTE: This shape is FINAL for the compile engine (P1.5 is done). The engine
 * reads everything it needs from the `stats` bag — talent-level resolution,
 * reaction multipliers, and post-effect-minted keys are all handled by the data
 * layer (P1.7) before the block tree is built. `DamageContext` itself is not
 * extended by the engine.
 */
export interface DamageContext {
  readonly stats: BuildStats;
  readonly enemy: EnemyParams;
  /** Attacker character level (used in def multiplier). */
  readonly characterLevel: number;
}
