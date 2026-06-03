/**
 * The Compiler — turns a damage block tree into a fast (ctx) => DamageResult closure.
 *
 * Port of FeatureCompiler (raw/.../Feature2/Compiler.js): her `prepare()` walks
 * the tree, her `compile()` emits a JS string assembled into a `Function`. We
 * keep the same SHAPE — one walk, then a reusable callable — but realise it as a
 * TYPED CLOSURE TREE (see blocks.ts header for the rationale: type safety, no
 * `Function(...)` / arbitrary-code path, no globals). Because each block already
 * captured its children's closures at construction (blocks.ts), the "compile"
 * step is just extracting the root's triple closure — there is NO per-eval AST
 * re-walk. The returned function is pure and reusable across contexts.
 *
 * SCOPE NOTE — `compile(blockTree)` vs `compileFeature(dbObject)`:
 *   The task spec frames this as `compile(feature) → (build) => DamageResult`.
 *   Resolving a Feature/DbObject INTO a block tree (reading talent tables,
 *   wiring scaling stat, gating multiplier terms by condition) requires the data
 *   layer and is P1.7's job — `packages/core` must NOT import `@genshin/data`
 *   (engine-purity invariant). So the core boundary is: data builds a
 *   `DamageBlock` tree, then calls `compile(tree)` to get the executable closure.
 *   `CompiledFeature = (ctx) => DamageResult` (in @genshin/types) is exactly that
 *   closure's type. This split was an open fork in the brief; resolving it at the
 *   block-tree boundary keeps core pure. See the report / wiki for the decision.
 *
 * Sources:
 *   wiki/tools/calculator/feature2-engine.md
 *   raw/genshin_calc_pub/src/js/classes/Feature2/Compiler.js
 */

import type { DamageContext, DamageResult, CompiledFeature } from "@genshin/types";
import type { Block } from "./blocks.js";
import type { DamageBlock } from "./damage.js";

/**
 * Compile a CDamage block tree into a fast, pure `(ctx) => DamageResult` closure.
 *
 * `tree.damage` is already typed `(ctx: DamageContext) => DamageResult`, which is
 * structurally identical to `CompiledFeature`. Returning it directly avoids an
 * unnecessary wrapper closure. Safe to memoise and reuse across millions of
 * contexts (the future optimiser's hot loop).
 */
export function compile(tree: DamageBlock): CompiledFeature {
  return tree.damage;
}

/**
 * Evaluate any block to its scalar value for a context.
 *
 * The uniform numeric reduction of a block (a CDamage reduces to its avg). Used
 * by tests and by composite blocks (e.g. a future rotation sum). For the full
 * triple of a CDamage, use `compile()` or the block's own `damage(ctx)`.
 */
export function runBlock(block: Block, ctx: DamageContext): number {
  return block.run(ctx);
}
