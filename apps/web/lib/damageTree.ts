/**
 * damageTree — an independent, self-validating reconstruction of a feature's
 * damage triple from the stats bag, for the Breakdown UI's inline calc-tree
 * accordion. Pure (no React); consumes `ComputeResult.stats` + a feature's
 * `[non-crit, crit, avg]` triple.
 *
 * Anchoring (see task-4-brief.md): the tree is anchored on the NON-CRIT value.
 * `base = noncrit / (dmgBonus × def × res × amp)` — this makes the four known
 * factors exactly reproduce `noncrit` by construction (base absorbs anything the
 * bag can't independently express, e.g. the talent%×scaling-stat term). The tree
 * is then extended by `× critAvg` to reach `avg`. Because `base` was solved from
 * `noncrit`, `product = base × dmgBonus × def × res × amp × critAvg` collapses
 * algebraically to `noncrit × critAvg` — so any mismatch against the ENGINE's
 * `avg` can only come from `critAvg` itself, i.e. from a per-feature crit
 * modifier the bag-level reconstruction doesn't know about (e.g. Ganyu's A1
 * `crit_rate_ganyu`, a royal-crit polynomial, …). That mismatch is surfaced as
 * `residual` rather than silently swallowed.
 *
 * Bag-key conventions confirmed via a scratch dump (Task-1-style) before coding
 * (see task-4-report.md for the transcript):
 *   - `crit_rate_total` / `crit_dmg_total` are 0–1 FRACTIONS (not percent), and
 *     `crit_dmg_total` is the BONUS sum (e.g. 1.0 for +100% crit DMG), not
 *     `1 + bonus` — the engine's own avg formula is
 *     `noncrit × (1 + min(rate, 1) × cdmg)`, confirmed byte-exact against the
 *     golden Bennett `attack.normal_hit_1` fixture.
 *   - `dmg_<element>` / `dmg_<type>` / `dmg_all` are already-divided 0–1
 *     FRACTIONS in the bag (buildStats.ts divides by 100 at emit) — summed
 *     directly, no further `/100`.
 *   - `enemy_res_<element>` is the EFFECTIVE resistance already (base enemy
 *     resistance + any shred folded in by buildStats, e.g. VV(pyro) drops
 *     `enemy_res_pyro` from 0.1 to −0.3) — read it directly as `r` in the
 *     piecewise RES formula; no separate "subtract the shred" step is needed.
 *     Confirmed: base Bennett build `enemy_res_pyro = 0.1`; with a Sucrose
 *     teammate holding 4pc Viridescent Venerer (pyro pick), it becomes −0.3.
 *   - Physical uses "phys" in `dmg_<element>` keys but the full word "physical"
 *     in `enemy_res_<element>` — the two lookups use different key-cases; see
 *     `dmgElementKey` below (mirrors `compileFeature.ts`'s helper of the same
 *     name, kept local so this module doesn't reach into the engine package for
 *     a one-line map).
 */

export interface TreeNode {
  label: string;
  factor: number;
}

export interface ExplainFeatureInput {
  avg: number;
  noncrit: number;
  element: string | null;
  damageType: string | null;
  stats: Readonly<Record<string, number>>;
  enemy: { level: number; resistance: number | Record<string, number> };
  charLevel: number;
  reaction?: "vaporize" | "melt";
}

export interface ExplainFeatureResult {
  nodes: TreeNode[];
  product: number;
  residual: number | null;
}

/** `dmg_<element>` key case: physical → "phys", everything else verbatim.
 *  Mirrors `packages/data/src/compileFeature.ts`'s `dmgElementKey`. */
function dmgElementKey(element: string): string {
  return element === "physical" ? "phys" : element;
}

/** Per-variant amplifying-reaction factors (element must match the trigger). */
const AMP_FACTORS: Record<"vaporize" | "melt", Record<string, number>> = {
  vaporize: { hydro: 2, pyro: 1.5 },
  melt: { pyro: 2, cryo: 1.5 },
};

const RESISTANCE_TOLERANCE = 1e-6;

/** Fallback RES fraction from `enemy.resistance` when the bag key is absent. */
function fallbackResistance(
  resistance: number | Record<string, number>,
  element: string
): number {
  if (typeof resistance === "number") return resistance / 100;
  return (resistance[element] ?? 0) / 100;
}

/** Piecewise RES multiplier for effective resistance fraction `r`. */
function resFactorFor(r: number): number {
  if (r < 0) return 1 - r / 2;
  if (r > 0.75) return 1 / (1 + 4 * r);
  return 1 - r;
}

export function explainFeature(
  input: ExplainFeatureInput
): ExplainFeatureResult | null {
  const { avg, noncrit, element, damageType, stats, enemy, charLevel, reaction } = input;

  if (element === null) return null;
  if (typeof stats.crit_rate_total !== "number") return null;
  if (typeof stats.crit_dmg_total !== "number") return null;
  if (!(noncrit > 0)) return null;

  // DMG bonus: 1 + dmg_all + dmg_<element> + dmg_<damageType>.
  const dmgBonus =
    1 +
    (stats.dmg_all ?? 0) +
    (stats[`dmg_${dmgElementKey(element)}`] ?? 0) +
    (damageType ? (stats[`dmg_${damageType}`] ?? 0) : 0);

  // Enemy DEF: (charLevel+100) / ((charLevel+100) + (enemyLevel+100)·(1-reduce)(1-ignore)).
  const src = charLevel + 100;
  const target = enemy.level + 100;
  const reduce = stats.enemy_def_reduce ?? 0;
  const ignore =
    (stats.enemy_def_ignore ?? 0) +
    (damageType ? (stats[`enemy_def_ignore_${damageType}`] ?? 0) : 0);
  const k = (1 - reduce) * (1 - ignore);
  const defFactor = src / (target * k + src);

  // Enemy RES: bag key already folds base resistance + any shred.
  const resKey = `enemy_res_${element}`;
  const r =
    resKey in stats ? stats[resKey] : fallbackResistance(enemy.resistance, element);
  const resFactor = resFactorFor(r);

  // Amplifying reaction (vaporize/melt only, element must match the variant map).
  const ampFactor = reaction ? (AMP_FACTORS[reaction][element] ?? 1) : 1;

  // Crit average: 1 + min(rate, 1) × cdmg — reproduces the engine's own
  // avg = noncrit·(1-chance) + crit·chance formula exactly when the feature
  // carries no crit modifier beyond the bag's crit_rate_total/crit_dmg_total.
  const rate = Math.min(stats.crit_rate_total, 1);
  const cdmg = stats.crit_dmg_total;
  const critAvg = 1 + rate * cdmg;

  // Base absorbs the talent%×scaling-stat term (not reconstructable from the
  // bag alone) — solved so the known factors reproduce `noncrit` exactly.
  const knownProduct = dmgBonus * defFactor * resFactor * ampFactor;
  const base = noncrit / knownProduct;

  const nodes: TreeNode[] = [
    { label: "Base damage (talent × stat)", factor: base },
    { label: "DMG bonus", factor: dmgBonus },
    { label: "Enemy DEF", factor: defFactor },
    { label: "Enemy RES", factor: resFactor },
  ];
  if (reaction && ampFactor !== 1) {
    nodes.push({ label: `Amplifying reaction (${reaction})`, factor: ampFactor });
  }
  nodes.push({ label: "Crit average", factor: critAvg });

  const product = nodes.reduce((p, n) => p * n.factor, 1);
  const ratio = avg / product;
  const residual = Math.abs(ratio - 1) > RESISTANCE_TOLERANCE ? ratio : null;

  return { nodes, product, residual };
}
