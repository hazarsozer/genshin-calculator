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
 * A feature's rotation weight is her `getRotationHitMiltiplier(data)` (default 1), folded into
 * `factor` (it enters `varNormal`, in which all three accumulators are linear — Tree.js:83-90, so
 * it scales the whole hit triple). Two branches, mutually exclusive in v5.8:
 *   - SCALAR (`rotationHitMulti` field): Mona's C2 `mona_charged_hit` = 0.2 / Yoimiya's C6
 *     `yoimiya_normal_hit_*` = 0.5 (Tree.js:86-90 `CConst` arm).
 *   - OBJECT (`rotationHitMultiFromCritRate` flag): the hit's CLAMPED crit rate — Yanfei's A4
 *     `yanfei_blazing_eye`, a `FeatureDamageChargedYanfei` whose `getRotationHitMiltiplier`
 *     returns `getCritRateBlock(data)` pushed directly into `varNormal` (Tree.js:84-85 object
 *     arm). See `critRateWeight`. (Her `CCritRate` clamps, so we clamp too — NOT an unclamped sum.)
 * Ocean-Hued-Clam / Arlecchino override only `getDisplay…` (a display-path weight, no gateable
 * output) → OUT. The `feature` and `repeat` node types compose under the SINGLE base settings;
 * `reaction`-tagged feature nodes (Phase 5a) and `condition` overlays (Phase 3) DO change
 * the settings mid-rotation, so they recompile the affected features under MERGED settings
 * via the `recompile` seam (her engine resolves reaction + stats at COMPILE time, so a
 * per-node settings change requires recompiling, not just re-evaluating). `uptime` (Phase 4)
 * is the linear blend: `total += weight·(base·(1−p) + buffed·p)` componentwise on all three
 * accumulators, where base = its features WITHOUT its conditions and buffed = the same features
 * WITH the conditions overlaid (reusing the same `applyCondition`/seam path) — each leg computed
 * in isolation and folded up (Tree.js:214-262).
 *
 * FILTERED SUB-TOTALS (T3): the bare `rotation.total` is accompanied by one
 * `rotation.total_<element>/<type>` per element/type PRESENT in the rotation (her getDisplaySettings
 * re-walk under `settings.rotation_include`, Rotation.js:52,139-195 + the Tree.js:47,66-73 skip
 * gate). Emitted only when the caller supplies a `resolveBucket` resolver; element is
 * infusion-RESOLVED under each node's ACTIVE settings, type is STATIC, and the include is an OR over
 * the two (see `compileRotation`/`collectBuckets`/the `filter` gate in `accumulateBlock`).
 *
 * DEFERRED (documented, out of this surface — see the plan's R3 §deferrals):
 *   - `condition` covers the settings-handle case (re-derive under merged settings); a postEffect-only
 *     condition with no settings diff is a no-op here (see the FIDELITY NOTE on `applyCondition`).
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/classes/Feature2/Rotation/Tree.js (processBlock — the accumulators;
 *     :8,60,306-308 reaction-tagging; :137-188 condition overlay; :214-262 uptime blend; :320-347 reorderItems)
 *   raw/genshin_calc_pub/src/js/classes/Feature2/Compile/Types/Damage.js:108-126 (a feature's triple)
 *   raw/genshin_calc_pub/src/js/classes/RotationCompiler.js:45-102 (processConditions — the Stats.diff delta)
 */

import type {
  CompiledFeature,
  DamageContext,
  DamageResult,
  Feature,
  Rotation,
  RotationConditionNode,
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
 * `DamageContext` (stat bag) they must be evaluated against, PLUS the fully-PROPAGATED settings
 * the slice was built under. The first two move together because a settings change can shift the
 * bag (a `condition` re-runs `buildStats`) AND the compiled closures (the amplifying factor /
 * infusion is baked at compile time). The `recompile` seam returns this bundle so the caller owns
 * the read-only re-derive (`buildStats` + `compileCharacter` under merged settings) and
 * `compileRotation` only composes triples. For a `reaction` tag the bag is unchanged (her
 * `buildStats` ignores `settings.reaction`), so `context` equals the base context; it is still
 * returned uniformly.
 *
 * `settings` is the PROPAGATED settings (post-`buildStats` condition-settings merge), NOT the raw
 * overlay the seam was called with. It is required for the T3 filtered-sub-total element bucketing:
 * a `condition`/`uptime` infusion overlay (Hu Tao Paramita) publishes `attack_infusion:'pyro'` only
 * through `buildStats`'s propagation, so the rotation's RAW overlay (`{hutao_paramita_papilio:true}`)
 * is insufficient to resolve the infused element — the resolver must read the slice's propagated
 * settings. The base slice's `settings` is `baseSettings` (already propagated by the caller).
 */
export interface RecompiledSlice {
  readonly compiled: Readonly<Record<string, CompiledFeature>>;
  readonly context: DamageContext;
  readonly settings: Readonly<Record<string, unknown>>;
}

/**
 * The dependencies `compileRotation` composes over.
 *
 * - `compiled` — the char's per-feature closures under the BASE settings, keyed by full
 *   name (`attack.normal_hit_1`). This is exactly `compileCharacter(char, ctx)`'s output;
 *   the un-tagged `feature`/`repeat` passes read directly from it (every hit shares the base
 *   bag).
 * - `recompile` — the re-derivation seam for mid-rotation settings changes (Phase 5a
 *   reaction tags + Phase 3 condition overlays). Given a fully-merged settings object it
 *   returns a {compiled, context, settings} slice (a read-only `buildStats` + `compileCharacter`
 *   re-call; `settings` = the PROPAGATED settings, needed for the T3 sub-totals' infused-element
 *   bucketing). Threaded as a dependency (not pre-applied) so `compileRotation` never owns the
 *   build. REQUIRED whenever the rotation changes settings — a `reaction>0` feature node, any
 *   `condition` node, OR (when sub-totals are requested) a `condition`/`uptime` overlay whose
 *   bucket walk must re-derive propagated settings; a pure `feature`/`repeat` rotation never calls
 *   it. Absent + a settings-changing node → a loud throw (never a silent un-amplified fallthrough).
 */
export interface RotationDeps {
  readonly compiled: Readonly<Record<string, CompiledFeature>>;
  /**
   * The char's per-feature DECLARATIONS, keyed by the SAME full name as `compiled`
   * (`attack.normal_hit_1`). Carries the per-feature rotation metadata `compileRotation`
   * needs but the compiled closure does not expose — currently only `rotationHitMulti`
   * (her `Feature2.rotationHitCount`, folded into a feature node's weight). Built in the
   * loader from the EXACT same feature list it compiles (so the map and `compiled` are in
   * lockstep). Absent ⇒ every feature defaults to weight 1 (base-inert: the existing
   * `rotation.total` reps that pass no map are unchanged).
   */
  readonly features?: Readonly<Record<string, Feature>>;
  /**
   * The settings the base build was compiled under — the substrate a reaction tag /
   * condition overlay merges onto (her `data.settings`). REQUIRED whenever `recompile` is
   * supplied (the seam recompiles against the COMPLETE merged object, so the base must be
   * known). Defaults to `{}` when absent (a rotation with no settings-changing nodes never
   * reads it).
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
  /**
   * Resolve a feature's filter bucket — its `{element, type}` in HER short form — under a node's
   * ACTIVE (overlaid) settings (T3, the filtered sub-totals). `element` is her
   * `FeatureDamage.getElement` in the `phys`/`<element>` short form (settings-DEPENDENT — an
   * infusion overlay flips it); `type` is her static `getDamageType()` (settings-INDEPENDENT). The
   * loader builds this from `resolveElement`+`damageTypeOf`+`dmgElementKey` (it owns the
   * `CompileContext`). Absent ⇒ no sub-totals are emitted (only the bare `rotation.total`), so the
   * existing pure-`rotation.total` reps + the 58k goldens are byte-identical. Source:
   * raw/.../Feature2/Rotation/Tree.js:66-73 (the skip gate) + Rotation.js:139-195 (getDisplaySettings).
   */
  readonly resolveBucket?: (
    feature: Feature,
    activeSettings: Readonly<Record<string, unknown>>
  ) => { readonly element: string; readonly type: string };
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
 * The shared (block-invariant) compile context: the recompile seam + a memo of the slices it
 * produced. The PER-BLOCK active slice + settings are threaded as recursion-frame parameters
 * (`accumulateBlock`'s `slice`/`baseSettings`) so a sub-block's overlay never leaks back out;
 * only the seam + cache, which are global, live here.
 */
interface RotationCtx {
  /** The recompile seam (see RotationDeps). */
  readonly recompile?: (
    mergedSettings: Readonly<Record<string, unknown>>
  ) => RecompiledSlice;
  /** Memo of recompiled slices keyed by a stable settings string (avoids re-deriving). */
  readonly cache: Map<string, RecompiledSlice>;
  /**
   * Per-feature declarations keyed by full name (see RotationDeps.features) — the source of
   * a feature node's `rotationHitMulti` weight. Block-invariant (the same map for every node),
   * so it lives here rather than as a recursion-frame parameter. Empty when absent → weight 1.
   */
  readonly features: Readonly<Record<string, Feature>>;
  /**
   * The filter-bucket resolver (see RotationDeps.resolveBucket), or `undefined` when sub-totals
   * are not requested. Block-invariant, used by the `filter` skip gate in `accumulateBlock`'s
   * feature-node branch and by `collectBuckets`.
   */
  readonly resolveBucket?: (
    feature: Feature,
    activeSettings: Readonly<Record<string, unknown>>
  ) => { readonly element: string; readonly type: string };
}

/** A stable key for a merged-settings object (sorted keys → deterministic memo lookup). */
function settingsKey(settings: Readonly<Record<string, unknown>>): string {
  const keys = Object.keys(settings).sort();
  return JSON.stringify(keys.map((k) => [k, settings[k]]));
}

/**
 * Resolve (memoized) the recompiled slice for `mergedSettings` via the seam. Throws if the
 * seam is absent — a settings-changing node MUST have a re-derive (never silently fall back
 * to the base, un-overlaid slice, which would drop the amplification/overlay).
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
 * Add one feature's triple into `total` at `factor` (= weight × count × rotationHitMulti),
 * reading the closure from `slice.compiled` and evaluating against `slice.context`. The
 * `rotationHitMulti` scalar is already folded into `factor` by the caller. An unresolved
 * feature name contributes nothing — her `getActiveFeature` returns undefined and the node
 * is skipped (Tree.js:62-64).
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
 * The OBJECT-branch rotation weight (`feature.rotationHitMultiFromCritRate`): the feature's
 * per-hit CLAMPED crit rate, summed from the ACTIVE slice's stat bag. A faithful local port of
 * her `getCritRateBlock` → `getDefaultStatsCritRate` (Feature2.js:134-140, Damage.js:72-94): she
 * sums `crit_rate_base + crit_rate + crit_rate_enemy + crit_rate_<element> + crit_rate_<type> +
 * crit_rate_<element>_<type> + …critRateBonuses` then CLAMPS to [0,1] (her `CCritRate.compile`,
 * Compile/Types/Damage.js:6-11). In our bag `crit_rate_base + crit_rate` is pre-summed as the
 * fraction `crit_rate_total`; the rest are fraction keys (absent ⇒ 0). The clamp is the decisive
 * fidelity point — her object factor is itself a clamped `CCritRate`, so an UNCLAMPED sum would
 * over-count above 100% crit and diverge from her oracle.
 *
 * Element/type are the feature's DECLARED values: the only v5.8 object-branch feature is Yanfei's
 * A4 `yanfei_blazing_eye`, innately pyro/charged with no infusion path, so the declared element IS
 * the resolved element (her `getElement(data)` would return the same). A general infusion-resolved
 * bucket belongs to the Task-3 resolver; no object-branch feature is infusable here, so this is
 * correctness-complete. Mirrors `compileFeature.ts`'s per-type crit fold + `critRateBonuses`.
 */
function critRateWeight(
  feature: Feature,
  stats: Readonly<Record<string, number>>
): number {
  const element = feature.element;
  const damageType = feature.damageType ?? "";
  const keys = [
    "crit_rate_total", // = crit_rate_base + crit_rate (her pair), pre-summed as a fraction
    "crit_rate_enemy",
    `crit_rate_${element}`,
    ...(damageType
      ? [`crit_rate_${damageType}`, `crit_rate_${element}_${damageType}`]
      : []),
    ...(feature.critRateBonuses ?? []),
  ];
  let sum = 0;
  for (const k of keys) sum += stats[k] ?? 0;
  // Her CCritRate.compile clamp (Compile/Types/Damage.js:9).
  return Math.max(0, Math.min(1, sum));
}

/**
 * Fold a fully-accumulated sub-block (`sub`, its own three accumulators) into `total` scaled by
 * `factor`, componentwise on ALL THREE (normal/crit/avg). This is her uptime leg's
 * `CMulti([ratio, repNormal/repCrit/repAverage])` increase (Tree.js:236-241,254-259) — a leg
 * computes its sub-block in ISOLATION (a fresh sub-accumulator) then multiplies the resulting
 * triple by the leg ratio and adds it to the outer total. The ratio scales every component
 * identically (never just avg — that is the Phase-4 anti-gaming trap).
 */
function foldScaled(
  sub: RotationTotal,
  factor: number,
  total: RotationTotal
): void {
  total.normal += factor * sub.normal;
  total.crit += factor * sub.crit;
  total.avg += factor * sub.avg;
}

/**
 * Accumulate one block's nodes into `total` at `weight` (the product of enclosing `repeat`
 * counts), against `slice` (the currently-active {compiled, context, settings} — the base slice at the
 * top level, or a condition-overlaid slice after a `condition` node fires in THIS block).
 * Recursive: a `repeat` node folds its sub-block at `weight × count` (Tree.js:200-213).
 *
 * Block scope (Tree.js:46,137-188): each block clones the running data; a `condition` mutates
 * THIS block's data forward (subsequent loose features in the block read the overlay) but a
 * sub-block (`repeat`/`uptime`) starts from the current slice and its internal changes do not
 * leak back out (the recursion passes the current slice DOWN by value, never up). The
 * overlay therefore persists to the block's end and is inherited by — but isolated within —
 * nested sub-blocks.
 *
 * `reorderItems` (Tree.js:320-347): within a block, loose `feature` nodes keep their order
 * but `repeat`/`uptime` blocks are DEFERRED after them, and a `condition` flushes (loose
 * features accumulated so far go in, then the condition). We replicate this so a
 * `condition` after a loose feature applies only to the features AFTER it AND to the deferred
 * sub-blocks (which her reorder pushes past the condition only if they preceded it — see
 * `reorder`). Without a condition the SUM is order-independent, so reorder is a no-op for
 * Phase 1/2 reps.
 */
function accumulateBlock(
  nodes: readonly RotationNode[],
  weight: number,
  ctx: RotationCtx,
  slice: RecompiledSlice,
  baseSettings: Readonly<Record<string, unknown>>,
  total: RotationTotal,
  filter: string | undefined
): void {
  // Replicate her reorderItems: loose features stay in order; repeat/uptime are deferred
  // after the loose run they appear in; a condition flushes the deferred run before it.
  const ordered = reorder(nodes);

  // The active slice + settings evolve as `condition` nodes fire forward in THIS block.
  let active = slice;
  let activeSettings = baseSettings;

  for (const node of ordered) {
    if (node.type === "feature") {
      const decl = ctx.features[node.feature];
      // Filtered sub-total skip gate (T3, her Tree.js:66-73): when a `filter` (a rotation_include
      // value) is active, elide this hit unless the filter matches its RESOLVED element OR its
      // STATIC type (an OR include). Element resolves under the ACTIVE SLICE's PROPAGATED settings
      // (`active.settings`) — a condition overlay's infusion (e.g. Paramita → pyro) lives there
      // post-`buildStats`, not in the raw overlay; the reaction tag never changes the element (her
      // getElement ignores settings.reaction → an amplified hit buckets under its unchanged
      // element, so we resolve BEFORE the reaction merge). `decl` is always present for an active
      // feature (the loader builds the map in lockstep with `compiled`); a missing decl ⇒ no bucket
      // ⇒ skip when filtering. The bare total (filter === undefined) never enters this branch →
      // byte-identical to today.
      if (filter !== undefined) {
        if (decl === undefined || ctx.resolveBucket === undefined) continue;
        const bucket = ctx.resolveBucket(decl, active.settings);
        if (filter !== bucket.element && filter !== bucket.type) continue;
      }
      // Resolve the slice this hit is evaluated against FIRST (her Tree.js:60-83 reads `data`
      // — incl. the per-node reaction merge — before getRotationHitMiltiplier). The crit-rate
      // object weight (below) reads THIS slice's bag.
      const reaction = REACTION_INDEX[node.reaction ?? 0];
      let slice = active;
      if (reaction !== undefined && reaction !== "") {
        // Reaction-tagged (Phase 5a): compile THIS hit under {...activeSettings, reaction}.
        // The amplifying/catalyze path (already shipped) applies ×1.5/2.0(+EM) or the
        // quicken multiplier. Merges onto the ACTIVE settings so a reaction tag inside a
        // condition-overlaid block stacks with the overlay (her data.settings carries both).
        const merged = { ...activeSettings, reaction };
        slice = resolveSlice(ctx, merged, `reaction '${reaction}'`);
      }
      // Her per-feature rotation weight (her `getRotationHitMiltiplier(data)`, Tree.js:83-90),
      // folded into `factor` (the multiplier enters `varNormal`, in which all three accumulators
      // are linear, so it scales the whole triple). TWO branches, mutually exclusive in v5.8:
      //   - OBJECT (`rotationHitMultiFromCritRate`): the hit's CLAMPED crit rate, summed from THIS
      //     slice's bag (Yanfei's A4 `yanfei_blazing_eye`; Tree.js:84-85 object arm).
      //   - SCALAR (`rotationHitMulti`, default 1): a constant `!= 1` (Mona-C2 0.2 / Yoimiya-C6
      //     0.5; Tree.js:86-90).
      // Absent both ⇒ 1 (base-inert).
      const hitMulti = decl?.rotationHitMultiFromCritRate
        ? critRateWeight(decl, slice.context.stats)
        : (decl?.rotationHitMulti ?? 1);
      const factor = weight * node.count * hitMulti;
      addFeature(slice, node.feature, factor, total);
    } else if (node.type === "repeat") {
      // count × (sub-block's three accumulators), componentwise (Tree.js:200-213). Recurse
      // with the count folded into the weight; pass the CURRENT (possibly-overlaid) slice +
      // settings down — the sub-block inherits the overlay but its own changes are isolated
      // (a fresh `active`/`activeSettings` in the recursive frame, never written back here). The
      // `filter` propagates into the sub-block (her processBlock reads rotation_include at every
      // level — Tree.js:47), so a repeat's hits are filtered too.
      accumulateBlock(node.items, weight * node.count, ctx, active, activeSettings, total, filter);
    } else if (node.type === "condition") {
      // Phase 3: a condition re-derives the stat bag + closures under merged settings and
      // applies forward to the following nodes IN THIS BLOCK (her Stats.diff overlay,
      // RotationCompiler.processConditions:45-102 → Tree.js:137-188). Drive the SAME condition
      // the char already has: the overlay = its resolved `{setting: value}` merged onto the
      // active settings, then a read-only recompile under it (her two-stage addSettings → diff).
      // FIDELITY LIMIT: if the overlay produces no settings diff (a postEffect-only condition with
      // no settings handle), the re-derive returns the same slice → a no-op here, not a throw (see
      // the FIDELITY NOTE on `applyCondition`). No oracle rep exercises that case; a future spec
      // that needs it would extend the seam to carry a resolved postEffect overlay.
      const merged = applyCondition(activeSettings, node);
      const condSlice = resolveSlice(ctx, merged, `condition (${describeCondition(node)})`);
      active = condSlice;
      activeSettings = merged;
    } else if (node.type === "uptime") {
      // Phase 4 — the linear blend (Tree.js:214-262): total += weight · (base·(1−p) + buffed·p),
      // componentwise on ALL THREE accumulators. `p = percent/100` (Tree.js:226). The two legs
      // are computed in ISOLATION — each is a fresh sub-accumulator over `node.features`, scaled
      // by its leg ratio and folded up — so the uptime's overlay NEVER leaks to nodes after it
      // (her processBlock runs each leg as its own `processBlock(...features..., data.clone)` and
      // only the multiplied result increases the outer total; the enclosing `active`/
      // `activeSettings` here are untouched). Both legs inherit the block's CURRENT slice +
      // settings (a condition that fired earlier in this block overlays both legs), matching her
      // `data` clone carrying prior addSettings.
      const p = node.percent / 100;

      // base leg (Tree.js:246-262): `item.features` WITHOUT the uptime's conditions, at (1−p).
      // Emitted only when `percent < 100` (her guard) — p=100 ⇒ buffed-only.
      if (p < 1) {
        const baseSub: RotationTotal = { normal: 0, crit: 0, avg: 0 };
        accumulateBlock(node.features, 1, ctx, active, activeSettings, baseSub, filter);
        foldScaled(baseSub, weight * (1 - p), total);
      }

      // buffed leg (Tree.js:225-243): `[...conditions, ...features]` WITH the conditions applied,
      // at p. Emitted only when `percent > 0` (her guard) — p=0 ⇒ base-only. The conditions
      // overlay the buffed leg ONLY: chain `applyCondition` over the active settings (reusing the
      // Phase-3 overlay machinery), recompile the slice under the merged settings via the seam,
      // then accumulate the features against THAT overlaid slice. This is exactly her buffed
      // sub-block `processBlock([...conditions, ...features])`: the compiled condition nodes
      // prepend the features, so the features see the overlay (Tree.js:227-230,137-188).
      if (p > 0) {
        let buffedSettings = activeSettings;
        for (const cond of node.conditions) {
          buffedSettings = applyCondition(buffedSettings, cond);
        }
        const buffedSlice =
          node.conditions.length > 0
            ? resolveSlice(
                ctx,
                buffedSettings,
                `uptime buffed leg (${node.conditions
                  .map(describeCondition)
                  .join(", ")})`
              )
            : active;
        const buffedSub: RotationTotal = { normal: 0, crit: 0, avg: 0 };
        accumulateBlock(node.features, 1, ctx, buffedSlice, buffedSettings, buffedSub, filter);
        foldScaled(buffedSub, weight * p, total);
      }
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
 * Her `reorderItems` (Tree.js:320-347): within a block, loose `feature` nodes keep order;
 * `repeat`/`uptime` blocks accumulate and are flushed AFTER the loose run — a `condition`
 * flushes the accumulated blocks before itself, and any still-accumulated blocks flush at the
 * end. Net effect: in a `[feat, condition, repeat]` block the repeat lands after the
 * condition (so it IS overlaid); in a `[feat, repeat, condition, feat]` block the repeat is
 * flushed BEFORE the condition (so it is NOT overlaid). We reproduce this exactly.
 */
function reorder(items: readonly RotationNode[]): readonly RotationNode[] {
  const result: RotationNode[] = [];
  let accum: RotationNode[] = [];
  for (const item of items) {
    if (item.type === "feature") {
      result.push(item);
    } else if (item.type === "condition") {
      if (accum.length > 0) {
        result.push(...accum);
        accum = [];
      }
      result.push(item);
    } else {
      // repeat / uptime — deferred after the loose features of their run.
      accum.push(item);
    }
  }
  if (accum.length > 0) result.push(...accum);
  return result;
}

/**
 * Turn a `condition` node into the MERGED settings it contributes, layered onto `settings`.
 *
 * Her `processConditions` (RotationCompiler.js:45-102) resolves the node against a live build:
 * for a dropdown it stores `cond.getValueById(value)`, otherwise the raw `value`, keyed by the
 * condition's NAME (`cond.getName()`). The port has no live `CalcSet` registry, so it carries
 * the ALREADY-RESOLVED `setting` (= that name) + `value` (see `RotationConditionNode`) and
 * merges `{[setting]: value}` onto the running settings. The downstream read-only recompile
 * re-runs `buildStats` + `compileCharacter` under this merged settings, reproducing her
 * two-stage `Stats.diff` (the bag + closures shift exactly as the live `addSettings` would).
 * A `value` of `undefined` REMOVES the setting (her `diffSettings` emits `undefined` for a key
 * present in the base but absent after — setting removal).
 *
 * FIDELITY NOTE (documented deferral): this merges the resolved `{setting: value}` overlay. It
 * faithfully covers the dominant case — a char's own checkbox/stacks/value condition whose
 * effect is entirely captured by re-running the build under the toggled setting (infusions,
 * stat conditions, talent offsets). It does NOT reproduce her `Rotation.getConditionData`
 * numeric-id → value indirection (the burndown resolves the name/value when it builds the spec)
 * nor postEffect-overlay-only conditions that contribute NO stat/setting diff (her
 * `processConditions` can also carry `postEffects`; a condition whose ENTIRE effect is a
 * post-effect with no settings handle would need a different seam). Both are out of this
 * dispatch's reps; see the plan's Phase 3 §reorderItems/postEffects deferral.
 */
function applyCondition(
  settings: Readonly<Record<string, unknown>>,
  node: RotationConditionNode
): Readonly<Record<string, unknown>> {
  if (node.value === undefined) {
    // Setting removal (diffSettings: a key in base but undefined after → emit undefined).
    const next = { ...settings };
    delete next[node.setting];
    return next;
  }
  return { ...settings, [node.setting]: node.value };
}

/** A short human-readable description of a condition node (for error messages / cache hints). */
function describeCondition(node: RotationConditionNode): string {
  return `${node.subtype}:${node.setting}=${String(node.value ?? "(remove)")}`;
}

/**
 * Collect the present filter-bucket VALUES (her getDisplaySettings, Rotation.js:139-195) — the set
 * of `rotation_include` keys the sub-totals are emitted under. This runs at COMPILE time: a bucket
 * value depends only on a feature's element (settings-dependent) + type (static), both resolvable
 * from the node tree + settings WITHOUT the eval-time stat bag, so the emitted key set is fixed at
 * compile time (matching her UI, which lists buckets before any number is computed).
 *
 * Mirrors her getDisplaySettings.processBlock — and note it does NOT reorderItems (unlike the
 * accumulation walk): it processes nodes in order, a `condition` overlays forward (re-deriving the
 * PROPAGATED settings via the seam — so an infusion the condition toggles, e.g. Paramita → pyro,
 * is visible), a `repeat` recurses its items, and an `uptime` walks BOTH legs (the base `features`
 * AND `[...conditions, ...features]`) so an infusion-switching uptime contributes both its base
 * element and its buffed element (Hu Tao: phys + pyro). Each active feature node adds its resolved
 * element (her short form, resolved under the ACTIVE SLICE's propagated settings) AND its static
 * type to the set. A reaction tag is irrelevant here (her getDisplaySettings ignores `reaction`).
 *
 * Settings propagation needs the seam (a condition's infused element lives in `buildStats`'s
 * propagated diff, not the raw overlay), so this walks WITH slices exactly like `accumulateBlock`:
 * `resolveSlice` re-derives a `{compiled, context, settings}` bundle per overlay (cached). A
 * settings-changing node without a seam throws there (never a silent wrong-bucket fallthrough).
 */
function collectBuckets(
  nodes: readonly RotationNode[],
  settings: Readonly<Record<string, unknown>>,
  ctx: RotationCtx,
  out: Set<string>
): void {
  // The PROPAGATED settings overlays evolve into (a condition's infused element lives here). For a
  // condition/uptime overlay we re-derive via the seam and read its propagated `.settings`; the
  // seam result's `compiled`/`context` are unused here (bucket = element+type, settings-only).
  let active = settings;
  for (const node of nodes) {
    if (node.type === "feature") {
      const decl = ctx.features[node.feature];
      if (decl === undefined || ctx.resolveBucket === undefined) continue;
      const bucket = ctx.resolveBucket(decl, active);
      out.add(bucket.element);
      out.add(bucket.type);
    } else if (node.type === "condition") {
      const merged = applyCondition(active, node);
      active = resolveSlice(ctx, merged, `condition (${describeCondition(node)})`).settings;
    } else if (node.type === "repeat") {
      collectBuckets(node.items, active, ctx, out);
    } else if (node.type === "uptime") {
      // Base leg: features WITHOUT conditions (resolved under the current settings).
      collectBuckets(node.features, active, ctx, out);
      // Buffed leg: features WITH conditions overlaid — so an infusion the uptime toggles
      // contributes its post-overlay (propagated) element too (her getDisplaySettings walks both).
      let buffedSettings = active;
      for (const cond of node.conditions) buffedSettings = applyCondition(buffedSettings, cond);
      const buffed =
        node.conditions.length > 0
          ? resolveSlice(
              ctx,
              buffedSettings,
              `uptime buffed leg (${node.conditions.map(describeCondition).join(", ")})`
            ).settings
          : active;
      collectBuckets(node.features, buffed, ctx, out);
    } else {
      const unhandled: never = node;
      throw new Error(
        `compileRotation: unhandled rotation node type '${(unhandled as { type: string }).type}' (collectBuckets)`
      );
    }
  }
}

/**
 * Compile a rotation into a map of `(context) => {normal,crit,avg}` closures: the bare
 * `rotation.total` PLUS one filtered sub-total `rotation.total_<value>` per element/type PRESENT in
 * the rotation (T3). Each closure walks the node tree at eval time, composing the per-feature
 * triples componentwise into the three accumulators; evaluation is deferred (not folded at compile
 * time) because the per-feature closures read the live `DamageContext` stat bag — exactly as her
 * `FeatureRotation.getResult` executes the compiled tree against `data`. The eval-time `context`
 * argument IS the base slice's context; reaction/condition slices carry their own context (from
 * the seam) and are evaluated against it.
 *
 * Filtered sub-totals (her getDisplaySettings + the `rotation_include` re-walk, Rotation.js:52,
 * 139-195 + Tree.js:47,66-73): the present bucket VALUES are enumerated once at compile time
 * (`collectBuckets`); each sub-total closure re-walks the SAME tree with a `filter`, eliding any
 * feature node whose resolved element AND static type both differ from it (an OR include). This is
 * her N+1 filtered re-walks; the controller-verified equivalence to a single multi-accumulator
 * walk holds (the filter only SKIPS), but the per-filter re-walk mirrors her `Tree.js` gate 1:1
 * and keeps the bare path byte-identical. Emitted only when a `resolveBucket` resolver is supplied
 * (the loader provides it); absent ⇒ ONLY `rotation.total` (the 58k goldens + the pure-total reps
 * are untouched — no golden sets a rotation, and a sub-total-less caller is byte-identical).
 *
 * Performance: an un-tagged rotation (no `reaction>0`, no `condition`) never calls the seam —
 * the common case is a pure compose over the base closures with zero re-derive. Reaction +
 * condition slices are memoized per distinct merged-settings within one evaluation (and the
 * caller may cache across evaluations), so the read-only `buildStats`/`compileCharacter`
 * re-call runs at most once per distinct settings. The N sub-total re-walks reuse that same
 * per-evaluation memo (a fresh `ctx`/cache per closure call, like the bare total).
 *
 * Returns `{}` for an empty rotation (no nodes) — her `compileRotation` returns null when
 * `featuresTotal == 0` and nothing is added (base-inert). The caller (`compileCharacter`) assigns
 * each returned key into `out`, so an empty map adds nothing.
 */
export function compileRotation(
  rotation: Rotation,
  deps: RotationDeps
): Record<string, CompiledFeature> {
  if (rotation.items.length === 0) return {};
  const { compiled, recompile, baseSettings = {}, features = {}, resolveBucket } = deps;

  // The shared compile context (per closure call a fresh `cache` is allocated, like before).
  const makeCtx = (): RotationCtx => ({
    cache: new Map(),
    features,
    // Conditional-spread the optional seams (`exactOptionalPropertyTypes` rejects explicit
    // `undefined`). An absent `recompile` + a settings-changing node throws in `resolveSlice`.
    ...(recompile !== undefined ? { recompile } : {}),
    ...(resolveBucket !== undefined ? { resolveBucket } : {}),
  });

  // One closure per filter (undefined = the bare total; a value = its sub-total). Each re-walks
  // the tree at eval time. Defining them via a single factory keeps the bare path byte-identical
  // to the sub-total path (same accumulation, only the `filter` arg differs).
  const makeClosure =
    (filter: string | undefined): CompiledFeature =>
    (context: DamageContext): DamageResult => {
      // The base slice carries `baseSettings` (already PROPAGATED by the caller — the loader passes
      // `ctx.settings`), so a top-level (un-overlaid) hit resolves its element under them.
      const base: RecompiledSlice = { compiled, context, settings: baseSettings };
      const ctx = makeCtx();
      const total: RotationTotal = { normal: 0, crit: 0, avg: 0 };
      accumulateBlock(rotation.items, 1, ctx, base, baseSettings, total, filter);
      return { normal: total.normal, crit: total.crit, avg: total.avg };
    };

  const out: Record<string, CompiledFeature> = {
    "rotation.total": makeClosure(undefined),
  };

  // Filtered sub-totals: only when the loader supplied a bucket resolver. The present bucket set is
  // fixed at compile time (element/type resolve from the tree + settings, not the stat bag); a
  // condition/uptime overlay's infused element needs the seam, so collectBuckets re-derives the
  // propagated settings per overlay (cached). The base walk starts from the propagated baseSettings.
  if (resolveBucket !== undefined) {
    const buckets = new Set<string>();
    collectBuckets(rotation.items, baseSettings, makeCtx(), buckets);
    for (const value of buckets) {
      out[`rotation.total_${value}`] = makeClosure(value);
    }
  }

  return out;
}
