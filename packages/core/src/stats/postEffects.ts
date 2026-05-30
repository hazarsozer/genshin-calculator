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
 * Her engine's applyPostEffects (Stats.js:213-222) groups effects by priority,
 * sorts ascending, then for each group:
 *   - creates a fresh scratch Stats (`postStats = new Stats()`)
 *   - each effect calls `getData(this, settings)` reading the PRE-GROUP `this`
 *     and returns a delta record; that delta is `postStats.concat()`-ed in
 *   - AFTER the whole group, `this.concat(postStats)` applies all group writes
 *
 * This means same-priority effects do NOT see each other's writes (they all read
 * the same pre-group snapshot). Effects in higher-priority groups DO see all
 * writes from lower-priority groups (groups are sequential, effects within a
 * group are isolated).
 */

import type { EvalContext } from "@genshin/types";
import type { Stats } from "./Stats.js";

/**
 * A single post-effect that derives one or more stats from the current aggregated
 * Stats bag. Called after full aggregation, before the formula reads totals.
 *
 * `priority` controls execution order: lower runs first. Effects at the same
 * priority run simultaneously (isolation: they all read the pre-group snapshot,
 * their writes are merged after the group — mirroring Stats.js:213-222).
 *
 * `contribute(readStats, settings)` must NOT mutate `readStats`. It reads from
 * it and returns a plain { key: delta } record. `applyPostEffects` collects all
 * same-priority contributions into a scratch, then applies the scratch in one
 * batch — matching her `postStats.concat(getData(...))` / `this.concat(postStats)`
 * pattern exactly.
 */
export interface PostEffect {
  readonly priority: number;
  /**
   * Read the PRE-GROUP stats snapshot (+ the immutable evaluation settings) and
   * return a delta record. MUST NOT mutate `readStats`.
   *
   * Mirrors `item.getData(this, settings)` in her Stats.js:217 — `settings` is
   * the EvalContext her condition-gated post-effects consult (e.g. an HP→ATK
   * buff active only when `hutao_paramita_papilio` is toggled). Effects that
   * don't gate on settings simply ignore the parameter.
   */
  contribute(readStats: Stats, settings: EvalContext): Record<string, number>;
}

/**
 * Apply all post-effects to `stats` in ascending priority order.
 *
 * Faithful port of Stats.applyPostEffects() (Stats.js:213-222):
 *   1. Group by priority
 *   2. Sort group keys ascending (numeric)
 *   3. For each group:
 *      a. Call each effect's `contribute(stats)` — reads pre-group snapshot
 *      b. Collect all returned deltas into a scratch record
 *      c. Apply the scratch to `stats` via concat — all writes land at once
 *
 * Within a priority group, no effect sees another's writes.
 * Across groups, each group sees all prior groups' applied writes.
 *
 * `settings` is the immutable EvalContext threaded to each effect's
 * `contribute(stats, settings)` — her `getData(this, settings)`. Defaults to an
 * empty context for effects that don't gate on settings.
 */
export function applyPostEffects(
  stats: Stats,
  effects: readonly PostEffect[],
  settings: EvalContext = {}
): void {
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
    const group = byPriority.get(priority)!;

    // Scratch record: collects all group contributions (mirrors `postStats = new Stats()`)
    const scratch: Record<string, number> = {};

    // Each effect reads the PRE-GROUP stats snapshot, returns a delta
    // (mirrors `postStats.concat(item.getData(this, settings))`)
    for (const effect of group) {
      const delta = effect.contribute(stats, settings);
      for (const key of Object.keys(delta)) {
        scratch[key] = (scratch[key] ?? 0) + (delta[key] as number);
      }
    }

    // Apply the whole group's writes at once (mirrors `this.concat(postStats)`)
    stats.concat(scratch);
  }
}
