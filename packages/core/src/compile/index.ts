/**
 * @genshin/core — compile module.
 *
 * The damage engine core (P1.5): the block AST (typed closure tree), the
 * CDamage root that produces the [normal, crit, avg] triple, and the compiler
 * that turns a block tree into a fast pure `(ctx) => DamageResult` closure.
 *
 * Reproduces the damage formula exactly; designed for the optimiser's hot path
 * and as the extension seam P1.6 (reactions) builds on. See blocks.ts / damage.ts
 * headers for the closure-tree rationale and the reaction seam.
 */

export type { Block, BlockKind } from "./blocks.js";
export {
  cConst,
  cStat,
  cSum,
  cSubtract,
  cMulti,
  cDivide,
  cMin,
  cMax,
  cFloor,
  cBaseDamage,
  cMultiplierBonus,
  cMultiplierReaction,
  cMultiplierDefence,
  cMultiplierResistance,
  cCritRate,
  cRoyalCritRate,
  cCritDmg,
} from "./blocks.js";

export type { DamageBlock, DamageParams } from "./damage.js";
export { cDamage, isDamageBlock } from "./damage.js";

export { compile, runBlock } from "./compiler.js";
