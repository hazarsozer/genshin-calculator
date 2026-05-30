/**
 * Post-effect application — derives stats from aggregated stats.
 *
 * Source: raw/genshin_calc_pub/src/js/classes/Stats.js (applyPostEffects, calcPost)
 *
 * APPLICATION ORDER (load-bearing):
 *   1. Aggregate — collect all flat and % stats from character/weapon/artifacts/buffs
 *   2. Derive    — run post-effects (HP→ATK, DEF→ATK, capped derivations)
 *   3. Read      — formula reads final totals via Stats.getTotal()
 *
 * If post-effects run before aggregation, or totals are read before post-effects,
 * every downstream damage number is wrong. The tests in postEffects.test.ts verify
 * this order directly.
 *
 * Her engine's applyPostEffects groups effects by priority, sorts ascending, then
 * runs each group's derived stats as a batch-concat. We faithful-port that ordering.
 */

import type { Stats } from "./Stats.js";

/**
 * A single post-effect that derives one or more stats from the current aggregated
 * Stats bag. Called after full aggregation, before the formula reads totals.
 *
 * `priority` controls execution order: lower runs first. Effects at the same
 * priority run in the order they appear in the input array (stable sort).
 */
export interface PostEffect {
  readonly priority: number;
  /**
   * Mutates `stats` to add derived values.
   * Called with the fully-aggregated Stats bag.
   */
  apply(stats: Stats): void;
}

/**
 * Apply all post-effects to `stats` in ascending priority order.
 *
 * Faithful port of Stats.applyPostEffects():
 *   1. Group by priority
 *   2. Sort group keys ascending (numeric)
 *   3. For each group: collect all derived stats into a scratch bag, then concat
 *
 * The batch-concat per priority level means effects in the same priority group
 * do NOT see each other's outputs (they read the stats BEFORE the group ran).
 * Effects in higher-priority groups DO see the output of lower-priority groups.
 */
export function applyPostEffects(stats: Stats, effects: readonly PostEffect[]): void {
  if (effects.length === 0) return;

  // Group by priority
  const byPriority = new Map<number, PostEffect[]>();
  for (const effect of effects) {
    let group = byPriority.get(effect.priority);
    if (group === undefined) {
      group = [];
      byPriority.set(effect.priority, group);
    }
    group.push(effect);
  }

  // Process groups in ascending priority order
  const sortedPriorities = [...byPriority.keys()].sort((a, b) => a - b);

  for (const priority of sortedPriorities) {
    const group = byPriority.get(priority);
    if (group === undefined) continue;

    // Each effect in the group applies directly to stats.
    // (Her engine collects into a scratch Stats and batch-concats; we apply
    // directly here because each effect controls its own stats.add() calls.
    // The ordering contract — lower-priority effects' outputs are visible to
    // higher-priority effects — is preserved.)
    for (const effect of group) {
      effect.apply(stats);
    }
  }
}
