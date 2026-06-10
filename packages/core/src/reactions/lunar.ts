/**
 * Lunar-Charged reaction — a crit-capable transformative.
 *
 * Lunar-Charged is structurally a transformative reaction (standalone damage,
 * not a hit multiplier) but uniquely supports a crit path. It uses a distinct
 * EM bonus curve (6×EM/(EM+2000) instead of 16×) and a reaction rate of 1.8.
 *
 * Formula:
 *   damage = 1.8 × levelMultiplier
 *            × (1 + lunarEmBonus + reactionDMGBonus)
 *            × resMultiplier(element)
 *   lunarEmBonus = 6 × EM / (EM + 2000)
 *
 * The crit hook is generic: pass critRateKeys/critDmgKeys to enable critting.
 * When omitted (standard non-crit path), normal = crit = avg.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/classes/Feature2/Multiplier/Reaction/LunarCharged.js:7-18  (EM formula, rate=1.8 implied via Charged.js)
 *   raw/genshin_calc_pub/src/js/classes/Feature2/Reaction/Transformative/Lunar/Charged.js:3-5 (rate=1.8)
 *   raw/genshin_calc_pub/src/js/classes/Feature2/Reaction/Transformative/Lunar.js:20-31       (getStatsCritRate/getStatsCritDamage)
 *   raw/genshin_calc_pub/src/js/db/generated/ElementScale.js:4-14                             (shared level table)
 */

import {
  cConst, cStat, cSum, cMulti, cDivide,
  cMultiplierResistance, cMultiplierReaction,
  cCritRate, cCritDmg,
} from "../compile/blocks.js";
import { cDamage } from "../compile/damage.js";
import type { Block } from "../compile/blocks.js";
import type { DamageBlock } from "../compile/damage.js";
import { REACTION_LEVEL_MULTIPLIERS } from "./transformative.js";

/** Reaction rate for Lunar-Charged (raw/.../Reaction/Transformative/Lunar/Charged.js:4). */
const LUNAR_CHARGED_RATE = 1.8;

// ---------------------------------------------------------------------------
// EM bonus block
// ---------------------------------------------------------------------------

/**
 * Lunar-Charged EM bonus block: `6 × EM / (EM + 2000)`.
 *
 * Reads `mastery` from BuildStats.
 *
 * Ports `masteryMultiplier()` in LunarCharged.js:7-18 (coefficient 6 vs
 * transformative's 16 — this is the watershed mechanic).
 */
export function cLunarChargedEmBonus(): DamageBlock {
  const em = cStat("mastery");
  const bonus: Block = cDivide([cMulti([cConst(6), em]), cSum([em, cConst(2000)])]);
  return cDamage({ items: [bonus] });
}

// ---------------------------------------------------------------------------
// Lunar-Charged damage block
// ---------------------------------------------------------------------------

export interface LunarChargedDamageParams {
  /**
   * Element for resistance lookup (`enemy_res_<element>`).
   * Typically "electro" for Lunar-Charged.
   */
  readonly element: string;
  /** Triggering character level (1–90). Clamps to table bounds. */
  readonly characterLevel: number;
  /**
   * Optional stat keys contributing to the reaction DMG bonus.
   * E.g. `dmg_reaction_lunarcharged`. Summed inside `(1 + emBonus + Σ)`.
   */
  readonly reactionBonusKeys?: readonly string[];
  /**
   * Optional elevation stat keys — `(1 + Σ elevation)` multiplied into the base (Flins C6).
   * Omit ⇒ no elevation factor (the `full` product is unchanged → byte-identical).
   */
  readonly elevationKeys?: readonly string[];
  /**
   * Optional stat keys for the rate-scaling term `(1 + Σ scalingStat)` that
   * MULTIPLIES the reaction rate. Lunar-Charged always scales the rate by
   * `(1 + lunarcharged_multi)` — her `getScalingStat()` returns `lunarcharged_multi`
   * and `getBaseMultiplier()` builds `reactionRate × CSumPlusOne([scalingStat])`.
   *
   * Omit for a rate with no scaling stat (the simple `1.8 × levelMult` form the
   * P1.6 unit tests exercise). Present → base becomes
   * `rate × (1 + Σ scalingStat) × levelMult`.
   *
   * Source: raw/.../Reaction/Transformative/Lunar/Charged.js:6 (getScalingStat),
   *         raw/.../Multiplier/Reaction.js:24-50 (reactionRate × CSumPlusOne).
   */
  readonly scalingStatKeys?: readonly string[];
  /**
   * Crit rate stat keys. Summed inside `cCritRate` (clamped to [0,1]).
   * Omit for non-crit path (normal = crit = avg).
   *
   * Mirrors `getStatsCritRate` → `getDefaultStatsCritRate` in Lunar.js:20-26.
   */
  readonly critRateKeys?: readonly string[];
  /**
   * Crit DMG stat keys. Summed inside `cCritDmg` → `(1 + Σ)`.
   * Omit for non-crit path.
   *
   * Mirrors `getStatsCritDamage` → `getDefaultStatsCritDamage` in Lunar.js:28-30.
   */
  readonly critDmgKeys?: readonly string[];
  /**
   * Optional fractional penalty applied to the reaction rate before levelMult.
   * Her `FeatureReactionLunarCharged({ penalty: 1/2 })` etc. Defaults to 1.
   *
   * Source: raw/genshin_calc_pub/src/js/db/Features/Reactions.js:99-112
   */
  readonly penalty?: number;
}

/**
 * Build a Lunar-Charged damage block with the optional crit hook.
 *
 *   damage = 1.8 × levelMultiplier[charLevel]
 *            × (1 + lunarEmBonus + Σ reactionBonus)
 *            × resMultiplier(element)
 *
 * Crit: if critRateKeys / critDmgKeys are supplied, the returned DamageBlock
 * produces the full [normal, crit, avg] triple. Without them, normal = crit = avg.
 *
 * The crit hook shape is identical to normal damage — this is the genericity
 * that allows Lunar-Bloom (Phase 3) to reuse the same factory with its own
 * critRateKeys/critDmgKeys list.
 */
export function cLunarChargedDamage(params: LunarChargedDamageParams): DamageBlock {
  const lvIdx = Math.max(
    0,
    Math.min(params.characterLevel - 1, REACTION_LEVEL_MULTIPLIERS.length - 1)
  );
  const levelMult = REACTION_LEVEL_MULTIPLIERS[lvIdx]!;

  // lunarEmBonus = 6 × mastery / (mastery + 2000)
  const em = cStat("mastery");
  const emBonus: Block = cDivide([cMulti([cConst(6), em]), cSum([em, cConst(2000)])]);

  // optional reaction bonus terms
  const reactionBonusTerms: Block[] =
    params.reactionBonusKeys?.map((key) => cStat(key)) ?? [];

  // (1 + emBonus + Σ reactionBonus)
  const reactionFactor: Block = cMultiplierReaction([emBonus, ...reactionBonusTerms]);

  // resMultiplier(element)
  const resMult = cMultiplierResistance(params.element);

  // Effective rate = LUNAR_CHARGED_RATE × penalty (default 1 → no change).
  const effectiveRate = LUNAR_CHARGED_RATE * (params.penalty ?? 1);

  // Rate, optionally scaled by (1 + Σ scalingStat). Lunar-Charged always scales
  // the rate by (1 + lunarcharged_multi); when no scalingStatKeys are supplied
  // the rate is the bare constant (the simple 1.8 × levelMult form).
  const hasScaling = params.scalingStatKeys && params.scalingStatKeys.length > 0;
  const rate: Block = hasScaling
    ? cMulti([
        cConst(effectiveRate),
        cMultiplierReaction(params.scalingStatKeys!.map((k) => cStat(k))),
      ])
    : cConst(effectiveRate);

  // Optional elevation factor (1 + Σ elevation) — Flins C6. Omitted when absent (byte-identical).
  const elevationFactors: Block[] =
    params.elevationKeys && params.elevationKeys.length > 0
      ? [cMultiplierReaction(params.elevationKeys.map((k) => cStat(k)))]
      : [];

  // Full base: rate × levelMult × reactionFactor × [elevation?] × resMult
  const full: Block = cMulti([rate, cConst(levelMult), reactionFactor, ...elevationFactors, resMult]);

  // Crit hook — generic: same cCritRate/cCritDmg machinery as normal hits.
  // When keys are absent, the optional fields are omitted entirely (not set to
  // undefined) to satisfy exactOptionalPropertyTypes — cDamage interprets a
  // missing critRate as 0 (non-critting hit: crit === normal === avg).
  const hasCritRate = params.critRateKeys && params.critRateKeys.length > 0;
  const hasCritDmg = params.critDmgKeys && params.critDmgKeys.length > 0;

  return cDamage({
    items: [full],
    ...(hasCritRate ? { critRate: cCritRate(params.critRateKeys!.map((k) => cStat(k))) } : {}),
    ...(hasCritDmg ? { critDmg: cCritDmg(params.critDmgKeys!.map((k) => cStat(k))) } : {}),
  });
}
