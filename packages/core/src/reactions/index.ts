/**
 * @genshin/core — reactions module (P1.6).
 *
 * Amplifying reactions (Vaporize / Melt): multiplicative factor appended to
 * cDamage.items — see amplifying.ts.
 *
 * Transformative reactions (Overload, Superconduct, Electro-Charged, …):
 * standalone damage instances, no crit — see transformative.ts.
 *
 * Lunar-Charged: transformative hit with a crit hook — see lunar.ts.
 */

export { AmplifyingVariant, cAmplifyingEmBonus, cAmplifyingFactor } from "./amplifying.js";
export type { AmplifyingFactorParams } from "./amplifying.js";

export {
  REACTION_LEVEL_MULTIPLIERS,
  cTransformativeEmBonus,
  cTransformativeDamage,
} from "./transformative.js";
export type { TransformativeDamageParams } from "./transformative.js";

export { cLunarChargedEmBonus, cLunarChargedDamage } from "./lunar.js";
export type { LunarChargedDamageParams } from "./lunar.js";
