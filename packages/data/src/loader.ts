/**
 * Character loader — maps a character's declarative `features[]` into named,
 * compiled, executable damage closures.
 *
 * This is the thin orchestration layer over `compileFeature` + `compile`:
 * for each damage feature, resolve it to a DamageBlock and compile it to a
 * `(ctx) => DamageResult`, keyed by `"<category>.<name>"` — the same key shape
 * the oracle fixtures use (e.g. `attack.normal_hit_1`).
 *
 * Non-damage features (heals, post-effect-value displays) are out of scope.
 * Standard transformative-reaction contribution features (Overload, Superconduct,
 * …) are NOT declared per-character: they are emitted generically from the
 * character's element via `transformativeReactionFeatures` and appended here (only
 * when `ctx.charLevel` is set, since their level multiplier needs it). This matches
 * her `db/Features/Reactions.js`, which registers the reaction catalog globally.
 *
 * Source: raw/genshin_calc_pub/src/js/classes/CalcSet.js (getFeaturesHash)
 */

import { compile, evaluate } from "@genshin/core";
import type {
  CharMultiplier,
  CompiledFeature,
  DbObjectChar,
  Feature,
} from "@genshin/types";
import {
  compileFeature,
  damageTypeOf,
  dmgElementKey,
  resolveElement,
  type CompileContext,
} from "./compileFeature.js";
import { compileRotation } from "./compileRotation.js";
import { catalyzeMultipliers, transformativeReactionFeatures } from "./reactions.js";

/** The "<category>.<name>" key for a feature (matches the oracle fixtures). */
export function featureKey(feature: Feature): string {
  const category = feature.category ?? "other";
  return `${category}.${feature.name}`;
}

/**
 * Compile every (non-child) damage feature of a character into a named
 * `CompiledFeature`. Child hits (`isChild`) are display-only sub-hits of a
 * multihit and are excluded, matching her rotation default.
 */
export function compileCharacter(
  char: DbObjectChar,
  ctx: CompileContext
): Readonly<Record<string, CompiledFeature>> {
  const out: Record<string, CompiledFeature> = {};
  // Per-feature DECLARATIONS keyed identically to `out` — the rotation compiler reads
  // per-feature metadata (her `Feature2.rotationHitCount`) from these (the compiled closure
  // does not expose it). Built in lockstep with `out` (same list, same gate) so a node's
  // declaration always matches its compiled closure. Only consumed when `ctx.rotation` is set.
  const featureDecls: Record<string, Feature> = {};

  // Char-level ("targeted") multipliers — her `char.getMultipliers()`. Only the
  // entries carrying a `target` are char-level multipliers that match-by-damage-type
  // (e.g. Itto A4 def→charged, Albedo C2 def→burst); compileFeature injects the
  // active ones into each matching feature's base term. An explicit `ctx.charMultipliers`
  // (e.g. from tests) takes precedence so callers can override. Mirrors
  // Feature2.getMultipliers reading `data.multipliers` (Feature2.js:121).
  // Weapon/set-sourced char-level ("targeted") multipliers (Redhorn def→normal/charged,
  // Echoes normal-DMG variant) merge into the same active-multiplier list as the char's
  // own — her getMultipliers iterates `data.multipliers`, populated from every equipped
  // object. `extraMultipliers` is the caller-assembled weapon+set slice. Inert when absent.
  const charMultipliers: readonly CharMultiplier[] = [
    ...(ctx.charMultipliers ??
      char.multipliers.filter((m): m is CharMultiplier => m.target !== undefined)),
    ...(ctx.extraMultipliers ?? []),
    // Global catalyze (Spread/Aggravate) multipliers — her `db/CalcData/Multipliers.js`.
    // Merged ONLY when `settings.reaction == 'quicken'` (her two entries' shared
    // `ConditionBooleanValue({setting:'reaction', cond:'eq', value:'quicken'})` gate). The
    // gate lives here (a single string compare) rather than as a per-entry condition because
    // our `ConditionBooleanValue` is numeric-only — it cannot express a string `value:'quicken'`.
    // Inert in every golden build (none set `reaction: 'quicken'`) → the 58k damage goldens
    // are byte-identical; the per-hit element filter (dendro/electro) still gates which hits
    // the term reaches. Source: raw/.../db/CalcData/Multipliers.js.
    ...(ctx.settings["reaction"] === "quicken" ? catalyzeMultipliers() : []),
  ];
  const featureCtx: CompileContext = { ...ctx, charMultipliers };

  // The standard transformative-reaction contributions are generic (computed from
  // the char's element + EM + level), appended to the declared features. They need
  // a charLevel for the level multiplier, so they are only emitted when one is set.
  const reactionFeatures: readonly Feature[] =
    ctx.charLevel !== undefined
      ? transformativeReactionFeatures(char.element, {
          ...(char.lunarChargedActive !== undefined
            ? { lunarChargedActive: char.lunarChargedActive }
            : {}),
        })
      : [];

  // Weapon/set-sourced damage features (Aquila's proc, Ocean-Hued Clam's Foam) compile
  // alongside the char's own — her getFeaturesHash concats features from every equipped
  // object. `extraFeatures` is the caller-assembled weapon+set slice. Inert when absent.
  for (const feature of [...char.features, ...(ctx.extraFeatures ?? []), ...reactionFeatures]) {
    if (feature.isChild) continue;
    // Feature-level gate: a constellation-added (or otherwise conditional) feature is
    // produced only when its condition holds against the compile settings (absent =
    // always). Mirrors her getFeaturesHash `feat.checkConditions` filter; the cons
    // features are declared with `condition: ConditionConstellation(n)`. Inert at the
    // base build (no base feature sets `.condition`) → the C0 golden suite is untouched.
    if (feature.condition !== undefined && !evaluate(feature.condition, ctx.settings)) continue;
    const block = compileFeature(feature, featureCtx);
    const key = featureKey(feature);
    out[key] = compile(block);
    featureDecls[key] = feature;
  }

  // Rotation total (R3) — ONE optional branch: when a rotation spec is supplied, compose
  // the char's per-feature damage triples into `rotation.total` (her compileRotation →
  // FeatureRotation, keyed `rotation.total`). The feature closures it composes are exactly
  // the ones just built in `out` (under the same base settings). `compileRotation` returns
  // null for an empty spec → no key added. Absent on every standard build → byte-identical
  // (the 58k damage goldens never set a rotation). Source: raw/.../CalcSet.js:453-459.
  if (ctx.rotation !== undefined) {
    // The seam (Phase 5a reaction tags + Phase 3 condition overlays) re-derives the affected
    // hits under merged settings; the base settings the overlay merges onto are `ctx.settings`.
    // Both are forwarded straight from the caller — `compileCharacter` does not own the build,
    // so a settings-changing rotation must be given a `rotationRecompile` closure (else any
    // reaction/condition node throws rather than silently un-amplifying). A pure feature/repeat
    // rotation needs neither.
    //
    // Filtered sub-totals (T3): resolve each feature's `{element, type}` filter bucket in her short
    // form (`phys`/`<element>` + the static type) under a node's ACTIVE settings. Element is
    // infusion-RESOLVED (a condition overlay flips it) so it's settings-dependent — splice the
    // active settings into the compile context; type is static. `compileFeature.ts` owns
    // `resolveElement`/`damageTypeOf`/`dmgElementKey`; the loader owns the `CompileContext`, so it
    // builds the resolver here. Source: raw/.../Feature2/Damage.js:225-233 (getElement) +
    // Feature2.js:45-47 (getDamageType) + Rotation.js:139-195 (getDisplaySettings).
    const resolveBucket = (
      feature: Feature,
      activeSettings: Readonly<Record<string, unknown>>
    ): { element: string; type: string } => {
      const ctxAtSettings: CompileContext = {
        ...featureCtx,
        settings: activeSettings as CompileContext["settings"],
      };
      return {
        element: dmgElementKey(resolveElement(feature, ctxAtSettings)),
        type: damageTypeOf(feature),
      };
    };

    const rotationFeatures = compileRotation(ctx.rotation, {
      compiled: out,
      features: featureDecls,
      baseSettings: ctx.settings,
      resolveBucket,
      ...(ctx.rotationRecompile !== undefined ? { recompile: ctx.rotationRecompile } : {}),
    });
    // Assign the bare `rotation.total` + every `rotation.total_<value>` sub-total into `out`. An
    // empty map (empty rotation) adds nothing → byte-identical to no-rotation builds.
    for (const [key, fn] of Object.entries(rotationFeatures)) out[key] = fn;
  }
  return out;
}
