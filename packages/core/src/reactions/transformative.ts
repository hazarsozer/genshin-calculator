/**
 * Transformative reactions — standalone damage instances.
 *
 * These reactions produce a separate damage hit rather than multiplying the
 * triggering attack. They normally cannot crit (Lunar-Charged is the exception —
 * see lunar.ts). The formula is:
 *
 *   reactionDamage = reactionMultiplier × levelMultiplier
 *                    × (1 + emBonus + reactionDMGBonus)
 *                    × resMultiplier
 *   emBonus        = 16 × EM / (EM + 2000)
 *
 * levelMultiplier is a per-character-level table from her generated constants
 * (see raw/genshin_calc_pub/src/js/db/generated/ElementScale.js:4-14).
 *
 * Per-reaction multipliers (wiki/concepts/transformative-reactions.md):
 *   Overloaded 2.0 (Pyro), Bloom 2.0 (Dendro), Hyperbloom 3.0 (Dendro),
 *   Burgeon 3.0 (Dendro), Shatter 1.5 (Physical), Electro-Charged 1.2 (Electro),
 *   Swirl 0.6 (swirled element), Superconduct 0.5 (Cryo), Burning 0.25 (Pyro).
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/generated/ElementScale.js:4-14 (level table)
 *   raw/genshin_calc_pub/src/js/classes/Feature2/Multiplier/Reaction/Transformative.js:7-18 (EM formula)
 *   raw/genshin_calc_pub/src/js/classes/Feature2/Reaction/Transformative.js:6-23 (composition)
 */

import { cConst, cStat, cSum, cMulti, cDivide, cMultiplierResistance } from "../compile/blocks.js";
import { cDamage } from "../compile/damage.js";
import type { Block } from "../compile/blocks.js";
import type { DamageBlock } from "../compile/damage.js";

// ---------------------------------------------------------------------------
// Level multiplier table
// ---------------------------------------------------------------------------

/**
 * Transformative reaction level multipliers, indexed 0-based by character level.
 * Entry [i] = multiplier for character level (i+1).
 *
 * Extracted verbatim from:
 *   raw/genshin_calc_pub/src/js/db/generated/ElementScale.js:4-14
 *   (the `reactionDamageValues` StatTable constructor argument, 90 entries)
 */
export const REACTION_LEVEL_MULTIPLIERS: readonly number[] = [
  17.1656,  18.535,   19.9049,  21.2749,  22.6454,  24.6496,  26.6406,  28.8686,  31.3677,  34.1433,
  37.201,   40.66,    44.4467,  48.5635,  53.7485,  59.0819,  64.42,    69.7245,  75.1231,  80.5848,
  86.112,   91.7037,  97.2446,  102.8126, 108.4096, 113.2017, 118.1029, 122.9793, 129.7273, 136.2929,
  142.6709, 149.029,  155.417,  161.8255, 169.1063, 176.5181, 184.0727, 191.7095, 199.5569, 207.382,
  215.3989, 224.1657, 233.5022, 243.3506, 256.0631, 268.5435, 281.5261, 295.0136, 309.0672, 323.6016,
  336.7575, 350.5303, 364.4827, 378.6192, 398.6004, 416.3983, 434.387,  452.951,  472.6062, 492.8849,
  513.5685, 539.1032, 565.5106, 592.5388, 624.4434, 651.4702, 679.4968, 707.7941, 736.6714, 765.6403,
  794.7734, 824.6774, 851.1578, 877.7421, 914.2291, 946.7468, 979.4114, 1011.223, 1044.7917, 1077.4437,
  1109.9976, 1142.9766, 1176.3695, 1210.1844, 1253.8357, 1288.9528, 1325.4841, 1363.4569, 1405.0974, 1446.8535,
] as const;

// ---------------------------------------------------------------------------
// EM bonus block
// ---------------------------------------------------------------------------

/**
 * Transformative EM bonus block: `16 × EM / (EM + 2000)`.
 *
 * Reads `mastery` from BuildStats.
 *
 * Ports `masteryMultiplier()` in Transformative.js:7-18.
 */
export function cTransformativeEmBonus(): DamageBlock {
  const em = cStat("mastery");
  const bonus: Block = cDivide([cMulti([cConst(16), em]), cSum([em, cConst(2000)])]);
  return cDamage({ items: [bonus] });
}

// ---------------------------------------------------------------------------
// Transformative damage block
// ---------------------------------------------------------------------------

export interface TransformativeDamageParams {
  /** Per-reaction coefficient (e.g. 2.0 for Overload, 0.5 for Superconduct). */
  readonly reactionMultiplier: number;
  /**
   * Element of the reaction output (determines which `enemy_res_<element>` key
   * is read for the resistance multiplier). E.g. "pyro" for Overload, "cryo"
   * for Superconduct, "electro" for Electro-Charged.
   */
  readonly element: string;
  /** Triggering character level (1–90). Clamps to table bounds. */
  readonly characterLevel: number;
  /**
   * Optional stat keys for per-reaction DMG bonus. Summed additively with the
   * EM bonus inside `(1 + emBonus + Σ reactionBonus)`.
   */
  readonly reactionBonusKeys?: readonly string[];
}

/**
 * Build a full transformative reaction damage block.
 *
 *   damage = reactionMultiplier × levelMultiplier[charLevel]
 *            × (1 + emBonus + Σ reactionBonus)
 *            × resMultiplier(element)
 *
 * Returns a CDamage block with no crit (normal = crit = avg).
 * Level and coefficient are baked in at build time (closure captures them);
 * EM, reaction bonuses, and resistance are read from ctx.stats at eval time.
 *
 * Mirrors the composition in FeatureReactionTransformative.getTree()
 * (raw/.../Reaction/Transformative.js:12-23) and FeatureMultiplierReaction.getTree()
 * (raw/.../Multiplier/Reaction.js:59-76).
 */
export function cTransformativeDamage(params: TransformativeDamageParams): DamageBlock {
  const lvIdx = Math.max(0, Math.min(params.characterLevel - 1, REACTION_LEVEL_MULTIPLIERS.length - 1));
  const levelMult = REACTION_LEVEL_MULTIPLIERS[lvIdx]!;

  // emBonus = 16 × mastery / (mastery + 2000)
  const em = cStat("mastery");
  const emBonus: Block = cDivide([cMulti([cConst(16), em]), cSum([em, cConst(2000)])]);

  // optional reaction bonus terms (fractions)
  const reactionBonusTerms: Block[] =
    params.reactionBonusKeys?.map((key) => cStat(key)) ?? [];

  // (1 + emBonus + Σ reactionBonus)  — mirrors CMultiplierReaction (CSumPlusOne shape)
  const reactionFactor: Block = {
    kind: "multiplier_reaction",
    children: [emBonus, ...reactionBonusTerms],
    run: (ctx) => {
      let total = 1 + emBonus.run(ctx);
      for (const term of reactionBonusTerms) total += term.run(ctx);
      return total;
    },
  };

  // resMultiplier(element) — same piecewise as normal hits
  const resMult = cMultiplierResistance(params.element);

  // Full product: reactionMultiplier × levelMultiplier × reactionFactor × resMult
  // reactionMultiplier and levelMultiplier are scalars baked as constants.
  const base: Block = cMulti([cConst(params.reactionMultiplier), cConst(levelMult)]);
  const full: Block = cMulti([base, reactionFactor, resMult]);

  // No crit — critRate and critDmg omitted → crit === normal === avg.
  return cDamage({ items: [full] });
}
