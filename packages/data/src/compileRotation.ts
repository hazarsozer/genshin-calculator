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
 * dispatch). The un-tagged `feature` and `repeat` node types compose under the SINGLE base
 * settings; a `reaction`-tagged feature node (Phase 5a) DOES change the settings for that hit
 * (`data.settings.reaction = <name>`), so it RECOMPILES that feature under merged settings via
 * the `recompile` seam (her engine resolves reaction at COMPILE time, so a per-node settings
 * change requires recompiling, not just re-evaluating). `condition`/`uptime` (which change
 * stats mid-block) are LATER passes — see the barriers below.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/classes/Feature2/Rotation/Tree.js (processBlock — the accumulators;
 *     :8,60,306-308 reaction-tagging)
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
 * A recompiled slice: the feature closures under some merged settings PLUS the
 * `DamageContext` (stat bag) they must be evaluated against. Both move together because a
 * settings change can shift the compiled closures (the amplifying factor is baked at compile
 * time) AND, for a condition (Phase 3), the bag. The `recompile` seam returns this bundle so
 * the caller owns the read-only re-derive (`buildStats` + `compileCharacter` under merged
 * settings) and `compileRotation` only composes triples. For a `reaction` tag the bag is
 * unchanged (her `buildStats` ignores `settings.reaction`), so `context` equals the base
 * context; it is still returned uniformly.
 */
export interface RecompiledSlice {
  readonly compiled: Readonly<Record<string, CompiledFeature>>;
  readonly context: DamageContext;
}

/**
 * The dependencies `compileRotation` composes over.
 *
 * - `compiled` — the char's per-feature closures under the BASE settings, keyed by full
 *   name (`attack.normal_hit_1`). This is exactly `compileCharacter(char, ctx)`'s output;
 *   the un-tagged `feature`/`repeat` passes read directly from it (every hit shares the base
 *   bag).
 * - `recompile` — the re-derivation seam for a mid-rotation settings change (Phase 5a reaction
 *   tags; Phase 3 condition overlays reuse it). Given a fully-merged settings object it returns
 *   a {compiled, context} slice (a read-only `buildStats` + `compileCharacter` re-call).
 *   Threaded as a dependency (not pre-applied) so `compileRotation` never owns the build.
 *   REQUIRED only when the rotation actually changes settings (a `reaction>0` feature node); a
 *   pure `feature`/`repeat` rotation never calls it. Absent + a settings-changing node → a loud
 *   throw (never a silent un-amplified fallthrough).
 */
export interface RotationDeps {
  readonly compiled: Readonly<Record<string, CompiledFeature>>;
  /**
   * The settings the base build was compiled under — the substrate a reaction tag merges onto
   * (her `data.settings`). REQUIRED whenever `recompile` is supplied (the seam recompiles
   * against the COMPLETE merged object, so the base must be known). Defaults to `{}` when
   * absent (a rotation with no settings-changing nodes never reads it).
   */
  readonly baseSettings?: Readonly<Record<string, unknown>>;
  /**
   * Recompile the feature map + context under fully-merged settings. The argument is the
   * COMPLETE settings object (`baseSettings` ⊕ the rotation-induced overlay), not a delta —
   * the caller re-runs the build from scratch under it (`buildStats` + `compileCharacter`).
   * Results may be cached by the caller; `compileRotation` also memoizes per distinct
   * settings within one evaluation.
   */
  readonly recompile?: (
    mergedSettings: Readonly<Record<string, unknown>>
  ) => RecompiledSlice;
}

/**
 * The amplifying-reaction index map (Tree.js:8,306-308): a feature node's `reaction` field
 * (`0..3`) selects the reaction NAME her `getReactionName` writes into `data.settings.reaction`
 * before compiling that hit. `0` (or absent) = no reaction (the common case — no recompile).
 * `melt`/`vaporize` route through the amplifying path (`AMPLIFYING_VARIANT`/`cAmplifyingFactor`,
 * compileFeature.ts), `quicken` through the catalyze path (loader.ts) — both already shipped.
 */
const REACTION_INDEX = ["", "melt", "vaporize", "quicken"] as const;

/**
 * The shared (block-invariant) compile context: the recompile seam, the base settings a
 * reaction tag merges onto, + a memo of the slices the seam produced. The PER-BLOCK weight is
 * a recursion-frame parameter (`accumulateBlock`'s `weight`); only the seam + cache + base
 * settings, which are global to one evaluation, live here.
 */
interface RotationCtx {
  /** The base settings a reaction overlay merges onto (her `data.settings`). */
  readonly baseSettings: Readonly<Record<string, unknown>>;
  /** The recompile seam (see RotationDeps). */
  readonly recompile?: (
    mergedSettings: Readonly<Record<string, unknown>>
  ) => RecompiledSlice;
  /** Memo of recompiled slices keyed by a stable settings string (avoids re-deriving). */
  readonly cache: Map<string, RecompiledSlice>;
}

/** A stable key for a merged-settings object (sorted keys → deterministic memo lookup). */
function settingsKey(settings: Readonly<Record<string, unknown>>): string {
  const keys = Object.keys(settings).sort();
  return JSON.stringify(keys.map((k) => [k, settings[k]]));
}

/**
 * Resolve (memoized) the recompiled slice for `mergedSettings` via the seam. Throws if the
 * seam is absent — a settings-changing node MUST have a re-derive (never silently fall back
 * to the base, un-overlaid slice, which would drop the amplification).
 */
function resolveSlice(
  ctx: RotationCtx,
  mergedSettings: Readonly<Record<string, unknown>>,
  what: string
): RecompiledSlice {
  if (ctx.recompile === undefined) {
    throw new Error(
      `compileRotation: ${what} requires the 'recompile' seam (a read-only buildStats + compileCharacter under merged settings), but RotationDeps.recompile is absent`
    );
  }
  const key = settingsKey(mergedSettings);
  const cached = ctx.cache.get(key);
  if (cached !== undefined) return cached;
  const slice = ctx.recompile(mergedSettings);
  ctx.cache.set(key, slice);
  return slice;
}

/**
 * Add one feature's triple into `total` at `factor` (= weight × count), reading the closure
 * from `slice.compiled` and evaluating against `slice.context`. An unresolved feature name
 * contributes nothing — her `getActiveFeature` returns undefined and the node is skipped
 * (Tree.js:62-64). `hitMulti` defaults to 1 (the 4 overrides are out of this dispatch).
 */
function addFeature(
  slice: RecompiledSlice,
  featureName: string,
  factor: number,
  total: RotationTotal
): void {
  const feature = slice.compiled[featureName];
  if (feature === undefined) return;
  const hit: DamageResult = feature(slice.context);
  total.normal += factor * hit.normal;
  total.crit += factor * hit.crit;
  total.avg += factor * hit.avg;
}

/**
 * Accumulate one block's nodes into `total` at `weight` (the product of enclosing `repeat`
 * counts), against the base `slice`. Recursive: a `repeat` node folds its sub-block at
 * `weight × count` (Tree.js:200-213 — `count × subAccumulator` componentwise).
 *
 * A `feature` node with `reaction>0` (Phase 5a) is compiled under `{...baseSettings, reaction}`
 * via the seam and evaluated against THAT slice; `reaction:0` (the common case) stays on the
 * base slice — no recompile, no perf cost. `condition`/`uptime` are LATER passes (the barriers
 * below).
 */
function accumulateBlock(
  nodes: readonly RotationNode[],
  weight: number,
  ctx: RotationCtx,
  slice: RecompiledSlice,
  total: RotationTotal
): void {
  for (const node of nodes) {
    if (node.type === "feature") {
      const factor = weight * node.count;
      const reaction = REACTION_INDEX[node.reaction ?? 0];
      if (reaction !== undefined && reaction !== "") {
        // Reaction-tagged (Phase 5a): compile THIS hit under {...baseSettings, reaction}. The
        // amplifying/catalyze path (already shipped) applies ×1.5/2.0(+EM) or the quicken
        // multiplier. Her Tree.js:60 sets data.settings.reaction = <name> per-node before
        // compiling, so the recompile reproduces exactly that hit.
        const merged = { ...ctx.baseSettings, reaction };
        const reactSlice = resolveSlice(ctx, merged, `reaction '${reaction}'`);
        addFeature(reactSlice, node.feature, factor, total);
      } else {
        addFeature(slice, node.feature, factor, total);
      }
    } else if (node.type === "repeat") {
      // count × (sub-block's three accumulators), componentwise — her CVarIncrease of
      // `count × repAccumulator` per component (Tree.js:200-213). Recurse with the count
      // folded into the weight so nested repeats multiply through.
      accumulateBlock(node.items, weight * node.count, ctx, slice, total);
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
 * as her `FeatureRotation.getResult` executes the compiled tree against `data`. The
 * eval-time `context` argument IS the base slice's context; a reaction slice carries its own
 * context (from the seam) and is evaluated against it.
 *
 * Performance: an un-tagged rotation (no `reaction>0`) never calls the seam — the common case
 * is a pure compose over the base closures with zero re-derive. Reaction slices are memoized
 * per distinct merged-settings within one evaluation (and the caller may cache across
 * evaluations), so the read-only `buildStats`/`compileCharacter` re-call runs at most once
 * per distinct settings.
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
  const { compiled, recompile, baseSettings = {} } = deps;
  return (context: DamageContext): DamageResult => {
    const base: RecompiledSlice = { compiled, context };
    // Conditional-spread `recompile` (omit when absent) — `exactOptionalPropertyTypes`
    // rejects an explicit `undefined` on the optional field. An absent seam + a
    // settings-changing node throws in `resolveSlice` (never a silent fallthrough).
    const ctx: RotationCtx = {
      baseSettings,
      cache: new Map(),
      ...(recompile !== undefined ? { recompile } : {}),
    };
    const total: RotationTotal = { normal: 0, crit: 0, avg: 0 };
    accumulateBlock(rotation.items, 1, ctx, base, total);
    return { normal: total.normal, crit: total.crit, avg: total.avg };
  };
}
