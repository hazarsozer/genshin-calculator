/**
 * Character loader — maps a character's declarative `features[]` into named,
 * compiled, executable damage closures.
 *
 * This is the thin orchestration layer over `compileFeature` + `compile`:
 * for each damage feature, resolve it to a DamageBlock and compile it to a
 * `(ctx) => DamageResult`, keyed by `"<category>.<name>"` — the same key shape
 * the oracle fixtures use (e.g. `attack.normal_hit_1`).
 *
 * Non-damage features (heals, post-effect-value displays) and reaction features
 * are out of P1.7a scope (the Hu Tao baseline proof exercises the damage path);
 * P1.7b extends this as it models the full representative set.
 *
 * Source: raw/genshin_calc_pub/src/js/classes/CalcSet.js (getFeaturesHash)
 */

import { compile } from "@genshin/core";
import type {
  CompiledFeature,
  DbObjectChar,
  Feature,
} from "@genshin/types";
import { compileFeature, type CompileContext } from "./compileFeature.js";

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
  for (const feature of char.features) {
    if (feature.isChild) continue;
    const block = compileFeature(feature, ctx);
    out[featureKey(feature)] = compile(block);
  }
  return out;
}
