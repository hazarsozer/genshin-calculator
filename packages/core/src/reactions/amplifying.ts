/**
 * Amplifying reactions — Vaporize and Melt.
 *
 * These reactions multiply the triggering hit rather than producing a separate
 * damage instance. The multiplier slots into `cDamage`'s `items` array as an
 * extra multiplicative factor alongside the base, bonus, def, and res blocks.
 *
 * Formula (wiki/game/mechanics/amplifying-reactions.md):
 *   amplifyingMultiplier = baseMultiplier × (1 + emBonus + reactionDMGBonus)
 *   emBonus              = 2.78 × EM / (EM + 1400)
 *
 * baseMultiplier per variant (raw/.../Amplifying/Vaporize/{Forvard,Reverse}.js and
 *   raw/.../Amplifying/Melt/{Forvard,Reverse}.js):
 *   VaporizeForward  (Hydro onto Pyro) → 2.0
 *   VaporizeReverse  (Pyro onto Hydro) → 1.5
 *   MeltForward      (Pyro onto Cryo)  → 2.0
 *   MeltReverse      (Cryo onto Pyro)  → 1.5
 *
 * EM is read from the stat key `mastery` (Aspirine's internal key for Elemental
 * Mastery; maps to GOOD `eleMas` — see wiki/game/mechanics/stat-keys-and-good-format.md).
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/classes/Feature2/Multiplier/Reaction/Amplifying.js:20-31
 *   raw/genshin_calc_pub/src/js/classes/Feature2/Multiplier/Reaction/Amplifying/Vaporize/Forvard.js:6-10
 *   raw/genshin_calc_pub/src/js/classes/Feature2/Multiplier/Reaction/Amplifying/Vaporize/Reverse.js:6-10
 *   raw/genshin_calc_pub/src/js/classes/Feature2/Multiplier/Reaction/Amplifying/Melt/Forvard.js:6-10
 *   raw/genshin_calc_pub/src/js/classes/Feature2/Multiplier/Reaction/Amplifying/Melt/Reverse.js:6-10
 */

import { cConst, cStat, cSum, cMulti, cDivide, cMultiplierReaction } from "../compile/blocks.js";
import { cDamage } from "../compile/damage.js";
import type { Block } from "../compile/blocks.js";
import type { DamageBlock } from "../compile/damage.js";

// ---------------------------------------------------------------------------
// Variant enum
// ---------------------------------------------------------------------------

/** The four amplifying-reaction variants with their base multipliers. */
export const AmplifyingVariant = {
  VaporizeForward: "vaporize_forward", // Hydro → Pyro aura, ×2.0
  VaporizeReverse: "vaporize_reverse", // Pyro → Hydro aura, ×1.5
  MeltForward: "melt_forward",         // Pyro → Cryo aura, ×2.0
  MeltReverse: "melt_reverse",         // Cryo → Pyro aura, ×1.5
} as const;

export type AmplifyingVariant = (typeof AmplifyingVariant)[keyof typeof AmplifyingVariant];

/** Base multiplier for each variant. */
const BASE_MULTIPLIER: Record<AmplifyingVariant, number> = {
  vaporize_forward: 2.0,
  vaporize_reverse: 1.5,
  melt_forward: 2.0,
  melt_reverse: 1.5,
};

// ---------------------------------------------------------------------------
// EM bonus block
// ---------------------------------------------------------------------------

/**
 * Amplifying EM bonus block: `2.78 × EM / (EM + 1400)`.
 *
 * Reads `mastery` from BuildStats (Aspirine's key for Elemental Mastery).
 * Returns the bonus as a raw fraction — it is added inside `(1 + emBonus + …)`.
 *
 * Ports `getMasteryMultiplier()` in Amplifying.js:20-31.
 */
export function cAmplifyingEmBonus(): DamageBlock {
  // 2.78 × mastery / (mastery + 1400)
  const em = cStat("mastery");
  const numerator = cMulti([cConst(2.78), em]);
  const denominator = cSum([em, cConst(1400)]);
  const bonus = cDivide([numerator, denominator]);
  // Wrap as a DamageBlock so `compile()` can be called directly in tests.
  return cDamage({ items: [bonus] });
}

// ---------------------------------------------------------------------------
// Amplifying factor block
// ---------------------------------------------------------------------------

export interface AmplifyingFactorParams {
  /** Which Vaporize/Melt direction this hit triggers. */
  readonly variant: AmplifyingVariant;
  /**
   * Optional stat keys for extra reaction DMG bonus (e.g. `dmg_reaction_vaporize`,
   * `dmg_reaction_melt`). These are fractions at execution time and are summed
   * additively inside `(1 + emBonus + Σ reactionBonus)`.
   *
   * Ports `getStatsReactionBonus()` in Amplifying.js, Vaporize.js, Melt.js.
   */
  readonly reactionBonusKeys?: readonly string[];
}

/**
 * Full amplifying multiplier block:
 *   `baseMultiplier × (1 + emBonus + Σ reactionBonus)`
 *
 * Returns a `DamageBlock` (avg scalar under `run`; full triple via `compile`).
 * To add it as a factor in a `cDamage` call, extract its `run` as `cConst`-like
 * or include the block directly in `items` — it is a standard `Block`.
 *
 * Composition mirrors her getTree / getMasteryMultiplier / getReactionBonuses
 * pattern (Amplifying.js, Reaction.js, Damage.js:195-218).
 */
export function cAmplifyingFactor(params: AmplifyingFactorParams): DamageBlock {
  const baseMult = BASE_MULTIPLIER[params.variant];

  // emBonus = 2.78 × mastery / (mastery + 1400)
  const em = cStat("mastery");
  const emBonus: Block = cDivide([cMulti([cConst(2.78), em]), cSum([em, cConst(1400)])]);

  // Σ reactionBonus — optional per-reaction stat terms (fractions)
  const reactionBonusTerms: Block[] =
    params.reactionBonusKeys?.map((key) => cStat(key)) ?? [];

  // (1 + emBonus + Σ reactionBonus)
  const bonusFactor: Block = cMultiplierReaction([emBonus, ...reactionBonusTerms]);

  // baseMultiplier × bonusFactor
  const amplifyingBlock: Block = cMulti([cConst(baseMult), bonusFactor]);

  return cDamage({ items: [amplifyingBlock] });
}
