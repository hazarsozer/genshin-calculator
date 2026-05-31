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
import { compileFeature, type CompileContext } from "./compileFeature.js";
import { transformativeReactionFeatures } from "./reactions.js";

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

  // Char-level ("targeted") multipliers — her `char.getMultipliers()`. Only the
  // entries carrying a `target` are char-level multipliers that match-by-damage-type
  // (e.g. Itto A4 def→charged, Albedo C2 def→burst); compileFeature injects the
  // active ones into each matching feature's base term. An explicit `ctx.charMultipliers`
  // (e.g. from tests) takes precedence so callers can override. Mirrors
  // Feature2.getMultipliers reading `data.multipliers` (Feature2.js:121).
  const charMultipliers: readonly CharMultiplier[] =
    ctx.charMultipliers ??
    char.multipliers.filter((m): m is CharMultiplier => m.target !== undefined);
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

  for (const feature of [...char.features, ...reactionFeatures]) {
    if (feature.isChild) continue;
    // Feature-level gate: a constellation-added (or otherwise conditional) feature is
    // produced only when its condition holds against the compile settings (absent =
    // always). Mirrors her getFeaturesHash `feat.checkConditions` filter; the cons
    // features are declared with `condition: ConditionConstellation(n)`. Inert at the
    // base build (no base feature sets `.condition`) → the C0 golden suite is untouched.
    if (feature.condition !== undefined && !evaluate(feature.condition, ctx.settings)) continue;
    const block = compileFeature(feature, featureCtx);
    out[featureKey(feature)] = compile(block);
  }
  return out;
}
