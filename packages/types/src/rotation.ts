/**
 * Rotation structural shapes.
 *
 * A Rotation is a declarative tree of nodes that composes already-gated per-hit
 * DAMAGE features into a sequence and emits `rotation.total` — a [non-crit, crit,
 * average] triple. It is the headline DPS-total output of her calculator (R3).
 *
 * Her engine: `CalcSet.compileRotation()` → `RotationCompiler.compile()` →
 * `FeatureRotation` (`Feature2/Rotation/Tree.js` is the aggregation core). The node
 * shapes here mirror her deserialized `Rotation.items` (Rotation.js:324-411).
 *
 * `rotation.total` is THREE independent componentwise accumulators (Tree.js:36-44,
 * 110-136):
 *   total_normal  = Σ_nodes count·hitMulti · perFeatureNormal
 *   total_crit    = Σ_nodes count·hitMulti · perFeatureCrit
 *   total_average = Σ_nodes count·hitMulti · perFeatureAverage  (each hit blended at
 *                   ITS OWN crit rate, THEN summed — never blend(total_normal,total_crit))
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/classes/Rotation.js (the spec shape)
 *   raw/genshin_calc_pub/src/js/classes/Feature2/Rotation/Tree.js (the aggregation core)
 *   raw/genshin_calc_pub/src/js/classes/RotationCompiler.js (node compilation)
 */

/**
 * A `feature` node: a single damage feature played `count` times.
 *
 * `feature` is the FULL feature name (`<category>.<name>`, e.g. `attack.normal_hit_1`)
 * — her `getAllFeaturesByName` matches `feat.getName()` = `${category}.${name}`
 * (CalcSet.js:551-562 / Feature2.js:53-54). `count` is the number of times the hit is
 * played (≥1). `reaction` is an amplifying-reaction index `0..3` mapping via
 * `['', 'melt', 'vaporize', 'quicken']` (Tree.js:8) — Phase 5a; defaults to 0
 * (un-reacted) and is carried through but NOT consumed by the P0/feature/repeat passes.
 */
export interface RotationFeatureNode {
  readonly type: "feature";
  readonly feature: string;
  readonly count: number;
  /** Amplifying-reaction index 0..3 (Tree.js:8). 0 = no reaction. Phase 5a. */
  readonly reaction?: number;
}

/**
 * A `repeat` node: its sub-block's three accumulators, each × `count` (Tree.js:189-213).
 * Recursive (the sub-block may itself contain repeats).
 */
export interface RotationRepeatNode {
  readonly type: "repeat";
  readonly count: number;
  readonly items: readonly RotationNode[];
}

/**
 * A `condition` node: a mid-rotation stat/settings overlay applied forward to the
 * following nodes in the same block (her `Stats.diff` two-stage overlay,
 * RotationCompiler.processConditions:45-102; Tree.js:137-188). Handled in Phase 3.
 *
 * Her engine resolves a condition by NUMERIC ids (`itemId` = the object, `conditionId` =
 * the condition's `serializeId`) against a LIVE build, then writes
 * `settings[cond.getName()] = value` (or `cond.getValueById(value)` for a dropdown). The
 * port has no live `CalcSet` registry to map those numeric ids → a name, so it carries the
 * ALREADY-RESOLVED form: `setting` (= `cond.getName()`, the settings key the overlay writes)
 * and `value`. The port merges `{[setting]: value}` onto the running settings and re-derives
 * the bag + closures under it (a read-only `buildStats` + `compileCharacter`), reproducing
 * her two-stage diff. A `value` of `undefined` REMOVES the setting (her `diffSettings` emits
 * `undefined` for a key dropped by the overlay).
 *
 * `subtype` documents the provenance (which object the condition is from); the port does not
 * branch on it (it only merges the setting). The numeric `itemId`/`conditionId` are her
 * serialization detail — carried optionally for the oracle-faithful round-trip, NOT read by
 * the port (which uses `setting`).
 */
export interface RotationConditionNode {
  readonly type: "condition";
  readonly subtype: "char" | "weapon" | "artifacts" | "enemy" | "party" | "buffs";
  /** The RESOLVED settings key the overlay writes (= her `cond.getName()`). Read by the port. */
  readonly setting: string;
  /** The value the overlay assigns (checkbox → true; stacks/number → the count; dropdown → resolved). `undefined` removes the key. */
  readonly value?: number | string | boolean;
  /** Her numeric object id (oracle serialization detail; not read by the port). */
  readonly itemId?: number;
  /** Her condition `serializeId` (oracle serialization detail; not read by the port). */
  readonly conditionId?: number;
}

/**
 * An `uptime` node: blends a sub-block compiled WITHOUT its conditions (base) against
 * the same sub-block compiled WITH them (buffed), `total = base·(1−p) + buffed·p`
 * componentwise on all three accumulators, `p = percent/100` (Tree.js:214-262).
 * DECLARED for extensibility — handled in a LATER pass (Phase 4), not by the
 * P0/feature/repeat dispatch.
 */
export interface RotationUptimeNode {
  readonly type: "uptime";
  readonly percent: number;
  readonly conditions: readonly RotationConditionNode[];
  readonly features: readonly RotationNode[];
}

/** The 4-variant rotation node union (her deserialized rotation item shapes). */
export type RotationNode =
  | RotationFeatureNode
  | RotationRepeatNode
  | RotationConditionNode
  | RotationUptimeNode;

/** A declarative rotation: an ordered list of nodes (her `Rotation.items`). */
export interface Rotation {
  readonly items: readonly RotationNode[];
}
