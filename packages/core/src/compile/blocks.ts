/**
 * Block AST — the typed closure-tree port of Aspirine's CBlock hierarchy.
 *
 * DESIGN: closure tree, NOT string codegen.
 *   The task spec mandates a typed closure tree over emitting a JS string
 *   (`Function(...)`), for type safety. Each block is built ONCE into a node
 *   carrying a pre-resolved `run(ctx) => number` closure that captures its
 *   children's closures. Walking happens at construction time; evaluation is a
 *   flat chain of captured-closure calls — no per-eval AST re-walk, no globals,
 *   no shared mutable state. This is the seam the optimiser (future) hammers
 *   millions of times, so the hot path is just function calls.
 *
 *   We keep a `kind` discriminant on every node so `compile()` can recognise the
 *   `CDamage` root (which yields a triple, not a scalar) and so future passes
 *   (P1.6 reactions, debugging) can introspect the tree.
 *
 * Faithful to her arithmetic + damage blocks:
 *   raw/genshin_calc_pub/src/js/classes/Feature2/Compile/Types/Block.js
 *   raw/genshin_calc_pub/src/js/classes/Feature2/Compile/Types/Item.js
 *   raw/genshin_calc_pub/src/js/classes/Feature2/Compile/Types/Damage.js
 *
 * Formula provenance:
 *   wiki/concepts/damage-formula.md, base-damage-and-scaling.md,
 *   def-multiplier.md, res-multiplier.md, crit.md
 */

import type { DamageContext } from "@genshin/types";

/** Block discriminant — one tag per node kind. */
export type BlockKind =
  | "const"
  | "stat"
  | "sum"
  | "subtract"
  | "multi"
  | "divide"
  | "min"
  | "max"
  | "floor"
  | "base_damage"
  | "multiplier_bonus"
  | "multiplier_defence"
  | "multiplier_resistance"
  | "multiplier_reaction"
  | "crit_rate"
  | "royal_crit_rate"
  | "crit_dmg"
  | "damage";

/**
 * A node in the compiled damage tree.
 *
 * `run` is the hot path: a pure `(ctx) => number` closure resolved at
 * construction. `kind` is the discriminant; `children` is kept for
 * introspection / future tree passes (it is NOT walked during run).
 *
 * The `CDamage` root reduces to a scalar (its average) under `run` so that the
 * union stays uniformly `number`-valued; the full `[normal, crit, avg]` triple
 * is produced by `compile()` (see compiler.ts).
 */
export interface Block {
  readonly kind: BlockKind;
  readonly run: (ctx: DamageContext) => number;
  /** Child blocks (introspection only; run captures them directly). */
  readonly children?: readonly Block[];
}

// ---------------------------------------------------------------------------
// Leaf blocks
// ---------------------------------------------------------------------------

/** A literal constant. Ports CConst. */
export function cConst(value: number): Block {
  return { kind: "const", run: () => value };
}

/**
 * Reads a stat from the build at execution time. Ports CStat (`stats.<key>`).
 *
 * Returns 0 when the key is absent — matching her Stats.get() default and the
 * additive semantics of the damage formula (an absent DMG% bonus contributes 0).
 *
 * NOTE: the value is read verbatim. Percent stats are expected to already be
 * FRACTIONS at execution time (her processPercent divides by 100 once before the
 * formula runs); the caller's BuildStats must honour that. "Total" stats
 * (base×(1+%)+flat) are pre-aggregated by the Stats layer (P1.3) and read here
 * under their resolved key (e.g. `atk_total`).
 */
export function cStat(key: string): Block {
  return { kind: "stat", run: (ctx) => ctx.stats[key] ?? 0 };
}

// ---------------------------------------------------------------------------
// Arithmetic blocks (CSum, CSubtract, CMulti, CDivide, CMin, CMax)
// ---------------------------------------------------------------------------

/** Sum of children. Empty sum is 0 (CSum: `result || '0'`). */
export function cSum(children: readonly Block[]): Block {
  const fns = children.map((c) => c.run);
  return {
    kind: "sum",
    children,
    run: (ctx) => {
      let total = 0;
      for (const f of fns) total += f(ctx);
      return total;
    },
  };
}

/** Left-to-right subtraction: a − b − c … Ports CSubtract. */
export function cSubtract(children: readonly Block[]): Block {
  const fns = children.map((c) => c.run);
  return {
    kind: "subtract",
    children,
    run: (ctx) => {
      if (fns.length === 0) return 0;
      let acc = fns[0]!(ctx);
      for (let i = 1; i < fns.length; i++) acc -= fns[i]!(ctx);
      return acc;
    },
  };
}

/** Product of children. Empty product is 1 (multiplicative identity). Ports CMulti. */
export function cMulti(children: readonly Block[]): Block {
  const fns = children.map((c) => c.run);
  return {
    kind: "multi",
    children,
    run: (ctx) => {
      let acc = 1;
      for (const f of fns) acc *= f(ctx);
      return acc;
    },
  };
}

/** Left-to-right division: a / b / c … Ports CDivide. */
export function cDivide(children: readonly Block[]): Block {
  const fns = children.map((c) => c.run);
  return {
    kind: "divide",
    children,
    run: (ctx) => {
      if (fns.length === 0) return 0;
      let acc = fns[0]!(ctx);
      for (let i = 1; i < fns.length; i++) acc /= fns[i]!(ctx);
      return acc;
    },
  };
}

/** Minimum of children. Ports CMin. */
export function cMin(children: readonly Block[]): Block {
  const fns = children.map((c) => c.run);
  return {
    kind: "min",
    children,
    run: (ctx) => {
      let m = Infinity;
      for (const f of fns) {
        const v = f(ctx);
        if (v < m) m = v;
      }
      return m;
    },
  };
}

/** Maximum of children. Ports CMax. */
export function cMax(children: readonly Block[]): Block {
  const fns = children.map((c) => c.run);
  return {
    kind: "max",
    children,
    run: (ctx) => {
      let m = -Infinity;
      for (const f of fns) {
        const v = f(ctx);
        if (v > m) m = v;
      }
      return m;
    },
  };
}

/**
 * Floor of a single child (`Math.floor`). Ports CFloor.
 *
 * Used by stat-derived coefficient terms whose coefficient steps in integer
 * buckets — her `FeatureMultiplierKiraraBurst` `min(floor(hp/8000), 4)`. Sole
 * child convention mirrors a unary block; the runner floors its value.
 */
export function cFloor(child: Block): Block {
  const fn = child.run;
  return {
    kind: "floor",
    children: [child],
    run: (ctx) => Math.floor(fn(ctx)),
  };
}

// ---------------------------------------------------------------------------
// Damage-specific factor blocks
// ---------------------------------------------------------------------------

/**
 * Base damage = Σ(talentMultiplier × scalingStat) + Σ flat. Ports CBaseDamage
 * (a CSum). The caller composes the children: typically one or more
 * `cMulti([talent%, scalingStat])` terms plus flat `cStat(...)` additions
 * (Shenhe Quill, Yun Jin, Sara). See wiki/concepts/base-damage-and-scaling.md.
 */
export function cBaseDamage(children: readonly Block[]): Block {
  const sum = cSum(children);
  return { kind: "base_damage", children, run: sum.run };
}

// ---------------------------------------------------------------------------
// Private helper for the three `(1 + Σ)` factories
// ---------------------------------------------------------------------------

/**
 * Shared `(1 + Σ children)` factory used by cMultiplierBonus, cMultiplierReaction,
 * and cCritDmg. The three factories are structurally identical — they differ only
 * in `kind`. Behaviour is unchanged: empty children → 1.
 */
function makeSumPlusOne(
  kind: BlockKind,
  children: readonly Block[]
): Block {
  const fns = children.map((c) => c.run);
  return {
    kind,
    children,
    run: (ctx) => {
      let total = 1;
      for (const f of fns) total += f(ctx);
      return total;
    },
  };
}

/**
 * DMG% bonus factor: additive among themselves, then `(1 + Σ)`. Ports
 * CMultiplierBonus (a CSumPlusOne). Children are the individual DMG% terms
 * (`dmg_all`, `dmg_<element>`, `dmg_<type>`), each a fraction at execution time.
 * Empty → 1. See wiki/concepts/damage-formula.md.
 */
export function cMultiplierBonus(children: readonly Block[]): Block {
  return makeSumPlusOne("multiplier_bonus", children);
}

/**
 * Reaction multiplier factor: `(1 + Σ reactionBonus)`. Ports CMultiplierReaction
 * (a CSumPlusOne). Provided here as the typed seam P1.6 will populate; the core
 * triple machinery is agnostic to it — it is just another factor in CDamage.items.
 */
export function cMultiplierReaction(children: readonly Block[]): Block {
  return makeSumPlusOne("multiplier_reaction", children);
}

/** Default Aspirine stat keys for DEF reduction / ignore. */
const DEF_REDUCE_KEY = "enemy_def_reduce";
const DEF_IGNORE_KEYS: readonly string[] = ["enemy_def_ignore"];

/**
 * DEF multiplier:
 *   src    = charLevel + 100
 *   target = enemyLevel + 100
 *   k      = (1 − enemy_def_reduce) × (1 − Σ enemy_def_ignore*)
 *   def    = src / (target × k + src)
 *
 * Ports CMultiplierDefence (getDefenceLevelMultiplier, Damage.js:160-189).
 * Depends on attacker/enemy LEVELS (from DamageContext), not attacker stats,
 * plus the aggregated shred/ignore fractions. See wiki/concepts/def-multiplier.md.
 *
 * `ignoreKeys` is a LIST that is summed inside `(1 − Σ)` — faithful to her
 * `getStatsDefIgnore` (Damage.js:128-137), which sums a base `enemy_def_ignore`
 * plus a per-damage-type `enemy_def_ignore_<type>`. P1.7 passes the per-type key
 * alongside the base; the default is the base key alone. `reduceKey` is likewise
 * overridable. DEF shred and DEF ignore are DIFFERENT mechanics (shred lowers
 * team-wide DEF; ignore is source-local) — they combine multiplicatively here.
 */
export function cMultiplierDefence(
  reduceKey: string = DEF_REDUCE_KEY,
  ignoreKeys: readonly string[] = DEF_IGNORE_KEYS
): Block {
  return {
    kind: "multiplier_defence",
    run: (ctx) => {
      const src = ctx.characterLevel + 100;
      const target = ctx.enemy.level + 100;
      const reduce = ctx.stats[reduceKey] ?? 0;
      let ignore = 0;
      for (const key of ignoreKeys) ignore += ctx.stats[key] ?? 0;
      const k = (1 - reduce) * (1 - ignore);
      return src / (target * k + src);
    },
  };
}

/**
 * RES multiplier — piecewise in the effective resistance `r` (a fraction):
 *   r < 0       → 1 − r/2     (vulnerability, half-effective)
 *   0 ≤ r ≤ .75 → 1 − r       (linear)
 *   r > .75     → 1/(1 + 4r)  (heavily diminishing)
 *
 * Ports CResistanceValue.compile() exactly (the ternary at Block.js:534-536).
 * `r` is read from the aggregated `enemy_res_<element>` stat (already a fraction,
 * shred folded in — shred is negative). See wiki/concepts/res-multiplier.md.
 */
export function cMultiplierResistance(element: string): Block {
  const key = `enemy_res_${element}`;
  return {
    kind: "multiplier_resistance",
    run: (ctx) => {
      const r = ctx.stats[key] ?? 0;
      if (r < 0) return 1 - r / 2;
      if (r > 0.75) return 1 / (1 + 4 * r);
      return 1 - r;
    },
  };
}

/**
 * Crit rate, clamped to [0, 1]. Ports CCritRate (a CSum wrapped in
 * `Math.max(0, Math.min(1, …))`). Overcapped crit rate is wasted — this clamp is
 * a load-bearing invariant. See wiki/concepts/crit.md.
 */
export function cCritRate(children: readonly Block[]): Block {
  const sum = cSum(children);
  return {
    kind: "crit_rate",
    children,
    run: (ctx) => Math.max(0, Math.min(1, sum.run(ctx))),
  };
}

/**
 * Royal-passive AVERAGE crit rate transform — the Royal-weapon series (Royal Bow /
 * Grimoire / Greatsword / Spear / Longsword) "Focus" passive's expected-value crit
 * model. ONLY transforms the chance used for the average; `normal`/`crit` are
 * unaffected (the royal mechanic raises the realized crit rate over a sequence of
 * non-crit hits, captured as an effective average chance).
 *
 * Faithful 1:1 port of her `makeRoyalAverageCrit(critVar, royalStat)`
 * (Feature2/Compile/Helpers.js:54-127). Inputs:
 *   - `base`  = the per-hit clamped crit chance (the wrapped `cCritRate` block,
 *               already a [0,1] fraction — her `critVar`).
 *   - `bonus` = `royal_crit_rate` read VERBATIM from the stats bag (her
 *               `makeStatItem('royal_crit_rate')` → `stats.royal_crit_rate`). NOTE:
 *               `isPercent('royal_crit_rate')` is FALSE (it starts `royal_`, not
 *               `crit_`), so `processPercent` does NOT divide it — it is the RAW
 *               value (e.g. 8 at R1, 16 at R5). buildStats emits it RAW to match.
 *               At ≥1 every `s_i` saturates to 1, which is why the effective chance
 *               is refine-invariant for these fixtures.
 *
 * The polynomial (her exact expression):
 *   s_k = min(1, base + k·bonus)   for k = 1..5
 *   chance = −s5 / D(base, s1..s5)
 *   result = clamp(chance, 0, 1)
 * Degenerates cleanly: `bonus = 0` → every `s_k = base` → `result = base` (so the
 * transform is identity when `royal_crit_rate` is absent/0).
 *
 * Built as a Block wrapping the base block + a `royal_crit_rate` stat read, both
 * captured closures (closure-tree contract). The polynomial is pure arithmetic on
 * the two resolved scalars — modelled directly in `run` (as `cCritRate`'s clamp is),
 * NOT re-expanded into ~50 arithmetic nodes (no value, and harder to audit against
 * her single expression).
 *
 * Source: raw/genshin_calc_pub/src/js/classes/Feature2/Compile/Helpers.js:54-127
 *         (makeRoyalAverageCrit); Feature2/Compile/Types/Damage.js:99-100 (avg-only
 *         substitution); Feature2/Damage.js:298-300 (gate + makeStatItem read).
 */
export function cRoyalCritRate(base: Block): Block {
  const baseFn = base.run;
  const royalFn = cStat("royal_crit_rate").run;
  return {
    kind: "royal_crit_rate",
    children: [base],
    run: (ctx) => {
      const b = baseFn(ctx);
      const bonus = royalFn(ctx);
      if (b >= 1) return 1;
      const s1 = Math.min(1, b + bonus);
      const s2 = Math.min(1, b + 2 * bonus);
      const s3 = Math.min(1, b + 3 * bonus);
      const s4 = Math.min(1, b + 4 * bonus);
      const s5 = Math.min(1, b + 5 * bonus);
      const denom =
        b - b * s1 + s1 - b * s2 + b * s1 * s2 - s1 * s2 + s2 - b * s3 + b * s1 * s3 - s1 * s3 +
        b * s2 * s3 - b * s1 * s2 * s3 + s1 * s2 * s3 - s2 * s3 + s3 - b * s4 + b * s1 * s4 - s1 * s4 +
        b * s2 * s4 - b * s1 * s2 * s4 + s1 * s2 * s4 - s2 * s4 + b * s3 * s4 - b * s1 * s3 * s4 + s1 * s3 * s4 -
        b * s2 * s3 * s4 + b * s1 * s2 * s3 * s4 - s1 * s2 * s3 * s4 + s2 * s3 * s4 - s3 * s4 + s4 + 4 * b * s5 -
        3 * b * s1 * s5 + 3 * s1 * s5 - 2 * b * s2 * s5 + 2 * b * s1 * s2 * s5 - 2 * s1 * s2 * s5 + 2 * s2 * s5 -
        b * s3 * s5 + b * s1 * s3 * s5 - s1 * s3 * s5 + b * s2 * s3 * s5 -
        b * s1 * s2 * s3 * s5 + s1 * s2 * s3 * s5 - s2 * s3 * s5 + s3 * s5 - 5 * s5 - 1;
      const chance = -s5 / denom;
      return Math.max(0, Math.min(1, chance));
    },
  };
}

/**
 * Crit DMG multiplier: `(1 + Σ critDMG)`. Ports CCritDmg (a CSumPlusOne).
 * critDMG is a fraction at execution time. See wiki/concepts/crit.md.
 */
export function cCritDmg(children: readonly Block[]): Block {
  return makeSumPlusOne("crit_dmg", children);
}
