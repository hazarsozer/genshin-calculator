export type { DamageTriple } from "@genshin/types";

export const CORE_VERSION = "0.0.0";

export { Stats } from "./stats/index.js";
export {
  StatTable,
  StatTableAscensionScale,
  StatTableAscension,
  StatTableAscensionWeapon,
} from "./stats/index.js";
export { applyPostEffects } from "./stats/index.js";
export type { PostEffect, StatTableAscensionScaleParams } from "./stats/index.js";

export { evaluate, getStackCount } from "./conditions/index.js";

export {
  AmplifyingVariant,
  cAmplifyingEmBonus,
  cAmplifyingFactor,
  REACTION_LEVEL_MULTIPLIERS,
  cTransformativeEmBonus,
  cTransformativeDamage,
  cLunarChargedEmBonus,
  cLunarChargedDamage,
} from "./reactions/index.js";
export type {
  AmplifyingFactorParams,
  TransformativeDamageParams,
  LunarChargedDamageParams,
} from "./reactions/index.js";

export type { Block, BlockKind, DamageBlock, DamageParams } from "./compile/index.js";
export {
  cConst,
  cStat,
  cSum,
  cSubtract,
  cMulti,
  cDivide,
  cMin,
  cMax,
  cBaseDamage,
  cMultiplierBonus,
  cMultiplierReaction,
  cMultiplierDefence,
  cMultiplierResistance,
  cCritRate,
  cCritDmg,
  cDamage,
  isDamageBlock,
  compile,
  runBlock,
} from "./compile/index.js";
