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
 * RotationCompiler.processConditions:45-102). DECLARED for extensibility — handled in
 * a LATER pass (Phase 3), not by the P0/feature/repeat dispatch. The shape mirrors her
 * deserialized condition item (Rotation.js:352-380): a subtype + the resolved
 * itemId/conditionId/value the compiler resolves against a live build.
 */
export interface RotationConditionNode {
  readonly type: "condition";
  readonly subtype: "char" | "weapon" | "artifacts" | "enemy" | "party" | "buffs";
  readonly itemId?: number;
  readonly conditionId?: number;
  readonly value?: number | string;
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
