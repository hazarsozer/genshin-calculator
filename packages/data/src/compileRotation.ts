/**
 * compileRotation — compose already-gated per-feature damage triples into a
 * rotation's `rotation.total` output.
 *
 * A rotation is a declarative tree of nodes (her `Rotation.items`). `rotation.total`
 * is THREE independent componentwise accumulators (Tree.js:36-44, 110-136), NOT one:
 *   total_normal  = Σ_nodes count·hitMulti · perFeatureNormal
 *   total_crit    = Σ_nodes count·hitMulti · perFeatureCrit
 *   total_average = Σ_nodes count·hitMulti · perFeatureAverage
 * where `perFeatureAverage` is a single feature's `avg` = normal·(1−chance) +
 * crit·chance — each hit blended AT ITS OWN crit rate, THEN summed. So we compose the
 * EXISTING per-feature `{normal,crit,avg}` triples componentwise: a wrong
 * `total_average = blend(total_normal, total_crit)` at one crit rate is silently wrong
 * when hits have different crit rates (e.g. a 100%-crit aimed shot beside a 5%-crit
 * normal). No crit-rate re-exposure is needed — the per-feature `avg` already carries it.
 *
 * `hitMulti` defaults to 1 (the 4 overrides — Yoimiya/Mona/Yanfei/Clam — are OUT of this
 * dispatch). The `feature` and `repeat` node types compose under the SINGLE base settings
 * (no mid-rotation stat changes); `condition`/`uptime` (which DO change stats mid-rotation)
 * are later passes — see the dispatch barriers below.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/classes/Feature2/Rotation/Tree.js (processBlock — the accumulators)
 *   raw/genshin_calc_pub/src/js/classes/Feature2/Compile/Types/Damage.js:108-126 (a feature's triple)
 *   raw/genshin_calc_pub/src/js/classes/RotationCompiler.js (node → compiled item)
 */

import type {
  CompiledFeature,
  DamageContext,
  DamageResult,
  Rotation,
  RotationNode,
} from "@genshin/types";

/** A mutable three-component accumulator (the running rotation total). */
interface RotationTotal {
  normal: number;
  crit: number;
  avg: number;
}

/**
 * The dependencies `compileRotation` composes over.
 *
 * - `compiled` — the char's per-feature closures under the BASE settings, keyed by full
 *   name (`attack.normal_hit_1`). This is exactly `compileCharacter(char, ctx)`'s output;
 *   the `feature`/`repeat` passes read directly from it (every hit shares the base bag).
 * - `recompile` — RESERVED for Phase 3/4 (`condition`/`uptime`): a re-derivation of the
 *   feature closures under condition-MERGED settings (a read-only `buildStats` + recompile).
 *   Threaded as a dependency (not pre-applied) so the later passes can recompile the
 *   following features mid-rotation without `compileRotation` owning the build. Unused by
 *   this dispatch — the feature/repeat nodes never change the settings.
 */
export interface RotationDeps {
  readonly compiled: Readonly<Record<string, CompiledFeature>>;
  /** Phase 3/4: recompile the feature map under merged settings. Not used here. */
  readonly recompile?: (mergedSettings: Readonly<Record<string, unknown>>) => Readonly<
    Record<string, CompiledFeature>
  >;
}

/**
 * Accumulate one block's nodes into `total` at `weight` (the product of enclosing
 * `repeat` counts), reading per-feature triples from `compiled`. Recursive: a `repeat`
 * node folds its sub-block at `weight × count` (Tree.js:200-213 — `count × subAccumulator`
 * componentwise). `condition`/`uptime` are LATER passes (the dispatch barriers below).
 */
function accumulateBlock(
  nodes: readonly RotationNode[],
  weight: number,
  context: DamageContext,
  compiled: Readonly<Record<string, CompiledFeature>>,
  total: RotationTotal
): void {
  for (const node of nodes) {
    if (node.type === "feature") {
      const feature = compiled[node.feature];
      // An unresolved feature name contributes nothing — her getActiveFeature returns
      // undefined and the node is skipped (Tree.js:62-64). hitMulti defaults to 1 here.
      if (feature === undefined) continue;
      const hit: DamageResult = feature(context);
      const factor = weight * node.count;
      total.normal += factor * hit.normal;
      total.crit += factor * hit.crit;
      total.avg += factor * hit.avg;
    } else if (node.type === "repeat") {
      // count × (sub-block's three accumulators), componentwise — her CVarIncrease of
      // `count × repAccumulator` per component (Tree.js:200-213). Recurse with the count
      // folded into the weight so nested repeats multiply through.
      accumulateBlock(node.items, weight * node.count, context, compiled, total);
    } else if (node.type === "condition") {
      // Phase 3: a condition re-derives the stat bag under merged settings and recompiles
      // the following features (her two-stage Stats.diff overlay). Not in this dispatch's
      // reps — fail loud so it can never silently no-op.
      throw new Error(
        "compileRotation: 'condition' nodes are handled in a later pass (Phase 3), not this dispatch"
      );
    } else if (node.type === "uptime") {
      // Phase 4: blend the sub-block compiled base vs buffed (conditions applied),
      // base·(1−p)+buffed·p componentwise. Not in this dispatch's reps — fail loud.
      throw new Error(
        "compileRotation: 'uptime' nodes are handled in a later pass (Phase 4), not this dispatch"
      );
    } else {
      // Exhaustiveness: a new node variant must be handled explicitly (compile-time error
      // until then), never fall through to a silent skip.
      const unhandled: never = node;
      throw new Error(
        `compileRotation: unhandled rotation node type '${(unhandled as { type: string }).type}'`
      );
    }
  }
}

/**
 * Compile a rotation into a `(context) => {normal,crit,avg}` closure keyed `rotation.total`.
 *
 * The closure walks the node tree at eval time, composing the per-feature triples
 * componentwise into the three accumulators. Evaluation is deferred (not folded at compile
 * time) because the per-feature closures read the live `DamageContext` stat bag — exactly
 * as her `FeatureRotation.getResult` executes the compiled tree against `data`.
 *
 * Returns `null` for an empty rotation (no nodes) — her `compileRotation` returns null when
 * `featuresTotal == 0` and nothing is added (base-inert). The caller (`compileCharacter`)
 * only assigns `rotation.total` when this is non-null.
 */
export function compileRotation(
  rotation: Rotation,
  deps: RotationDeps
): CompiledFeature | null {
  if (rotation.items.length === 0) return null;
  const { compiled } = deps;
  return (context: DamageContext): DamageResult => {
    const total: RotationTotal = { normal: 0, crit: 0, avg: 0 };
    accumulateBlock(rotation.items, 1, context, compiled, total);
    return { normal: total.normal, crit: total.crit, avg: total.avg };
  };
}
