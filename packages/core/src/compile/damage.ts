/**
 * CDamage — the damage root block that yields the [normal, crit, avg] triple.
 *
 * Faithful port of CDamage.makeResult (raw/.../Feature2/Compile/Types/Damage.js, L86-126):
 *
 *   varNormal = CMulti(this.items)              // = base × dmgBonus × defMult × resMult [× reaction]
 *   varChance = critRate                         // CCritRate, clamped to [0,1]
 *   varCrit   = varNormal × critDmg              // critDmg = CCritDmg = (1 + ΣcritDMG%)
 *   triple    = [ normal,
 *                 crit,
 *                 normal·(1 − chance) + crit·chance ]   // = normal·(1 + chance·CritDMG%)
 *
 * DESIGN — the reaction extension seam for P1.6:
 *   `items` is an ORDERED list of multiplicative factor blocks. Multiplication
 *   commutes, so an amplifying-reaction multiplier (Vaporize/Melt ×1.5/2 +EM) is
 *   just another factor appended to `items` (use `cMultiplierReaction`) — it
 *   slots in WITHOUT touching this triple logic.
 *
 *   `critRate` / `critDmg` are SEPARATE from the product and OPTIONAL:
 *     - omitted critRate → 0 (a non-critting hit: crit == normal == avg).
 *       This is the default transformative path (Overload, Superconduct, …),
 *       which cannot crit.
 *     - a CRIT-capable transformative (Lunar-Charged, Ineffa) reuses the EXACT
 *       same crit machinery: P1.6 builds a CDamage with its transformative base
 *       in `items` and supplies critRate/critDmg blocks. No core rewrite.
 *
 * Sources:
 *   wiki/game/mechanics/damage-formula.md, crit.md
 */

import type { DamageContext, DamageResult } from "@genshin/types";
import type { Block } from "./blocks.js";
import { cMulti } from "./blocks.js";

/** Parameters for a CDamage block. */
export interface DamageParams {
  /**
   * Ordered multiplicative factors composing the non-crit hit:
   * base × (1+dmgBonus) × defMult × resMult [× reaction …].
   * Their product is `normal`. An empty list yields normal = 1 (multiplicative
   * identity) — callers always supply at least a base block.
   */
  readonly items: readonly Block[];
  /** Crit-rate block (CCritRate, clamped). Omitted → 0 (non-critting hit). */
  readonly critRate?: Block;
  /** Crit-DMG-multiplier block (CCritDmg = 1 + ΣcritDMG%). Omitted → 1 (crit == normal). */
  readonly critDmg?: Block;
}

/**
 * A CDamage block. In addition to the uniform `Block` surface (`run` → avg
 * scalar, for composability), it carries a `damage(ctx)` method producing the
 * full triple. `compile()` (compiler.ts) detects `kind === "damage"` and calls
 * `damage` to build the triple-returning closure.
 */
export interface DamageBlock extends Block {
  readonly kind: "damage";
  /** Produce the full [normal, crit, avg] triple for a context. */
  readonly damage: (ctx: DamageContext) => DamageResult;
}

/**
 * Build a CDamage block from its factor list + optional crit blocks.
 *
 * The closures are resolved ONCE here (closure-tree contract): `productFn`,
 * `chanceFn`, `critMultFn` capture their children. `damage(ctx)` is then a flat
 * sequence of captured-closure calls producing the triple; `run(ctx)` returns
 * just the avg so a CDamage can nest inside another block uniformly.
 */
export function cDamage(params: DamageParams): DamageBlock {
  // varNormal = CMulti(items). Reuse cMulti so empty-items → 1 and the hot path
  // is the same tight product loop as every other multiplicative node.
  const product = cMulti(params.items);
  const productFn = product.run;

  // critRate omitted → constant 0 (hit cannot crit). The CCritRate block already
  // clamps to [0,1]; we don't re-clamp here.
  const chanceFn: (ctx: DamageContext) => number =
    params.critRate !== undefined ? params.critRate.run : () => 0;

  // critDmg omitted → constant 1 (crit multiplier is identity → crit == normal).
  const critMultFn: (ctx: DamageContext) => number =
    params.critDmg !== undefined ? params.critDmg.run : () => 1;

  const damage = (ctx: DamageContext): DamageResult => {
    const normal = productFn(ctx);
    const chance = chanceFn(ctx);
    const crit = normal * critMultFn(ctx);
    // avg = normal·(1 − chance) + crit·chance  (≡ normal·(1 + chance·CritDMG%))
    const avg = normal * (1 - chance) + crit * chance;
    return { normal, crit, avg };
  };

  return {
    kind: "damage",
    children: params.items,
    damage,
    // `run` yields the avg so CDamage is a valid number-valued Block (e.g. for a
    // rotation sum). The triple is obtained via `damage` / `compile`.
    run: (ctx) => damage(ctx).avg,
  };
}

/** Type guard: is this block a CDamage root (triple-bearing)? */
export function isDamageBlock(block: Block): block is DamageBlock {
  return block.kind === "damage";
}
