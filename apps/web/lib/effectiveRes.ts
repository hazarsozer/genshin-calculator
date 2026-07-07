/**
 * effectiveResRows — derives the Enemy drawer's "Effective Resistance" readout
 * (base − shreds → effective) from the compute result's stats bag.
 *
 * Sign convention (verified against `packages/data/src/buildStats.ts:1172-1175`,
 * consistent with the Task-4 finding in `lib/damageTree.ts`):
 *
 *   out[`enemy_res_${el}`] = resistanceFraction(enemy.resistance, el)
 *                             + raw.get(`enemy_res_${el}`) / 100;
 *
 * i.e. `stats.enemy_res_<element>` is the FINAL EFFECTIVE resistance as a 0-1
 * FRACTION — the base resistance with any char-contributed shred already
 * folded in — not a bare shred delta. This module recovers the shred by
 * comparing that effective value back against the user-set base:
 *
 *   effective (%) = stats.enemy_res_<element> × 100
 *   shred (%)     = base (%) − effective (%)
 *
 * A row is produced for every element where `shred !== 0`, plus the active
 * character's element, always (even when its shred is 0 — that's the
 * "no active shreds" case, not an absent row).
 */

const ELEMENTS = [
  "physical",
  "pyro",
  "hydro",
  "electro",
  "cryo",
  "anemo",
  "geo",
  "dendro",
] as const;

export interface EffectiveResRow {
  element: string;
  base: number;
  shred: number;
  effective: number;
}

function baseForElement(
  base: number | Record<string, number>,
  element: string
): number {
  return typeof base === "number" ? base : base[element] ?? 0;
}

// Guards against float noise from the `fraction × 100` conversion (e.g.
// 0.1 * 100 → 10.000000000000002) so `shred !== 0` comparisons and displayed
// values are exact for the percent-scale inputs this module deals with.
function round(n: number): number {
  return Math.round(n * 1e6) / 1e6;
}

export function effectiveResRows(
  base: number | Record<string, number>,
  stats: Readonly<Record<string, number>>,
  activeElement: string | null
): EffectiveResRow[] {
  const rows: EffectiveResRow[] = [];
  const seen = new Set<string>();

  for (const element of ELEMENTS) {
    const key = `enemy_res_${element}`;
    if (!(key in stats)) continue;

    const b = round(baseForElement(base, element));
    const effective = round(stats[key] * 100);
    const shred = round(b - effective);
    if (shred === 0) continue;

    rows.push({ element, base: b, shred, effective });
    seen.add(element);
  }

  if (activeElement && !seen.has(activeElement)) {
    const key = `enemy_res_${activeElement}`;
    const b = round(baseForElement(base, activeElement));
    const effective = key in stats ? round(stats[key] * 100) : b;
    const shred = round(b - effective);
    rows.push({ element: activeElement, base: b, shred, effective });
  }

  return rows;
}
