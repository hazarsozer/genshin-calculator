import { describe, it, expect } from "vitest";
import { effectiveResRows } from "../effectiveRes.js";

/**
 * Sign convention (verified against `packages/data/src/buildStats.ts:1172-1175`,
 * cross-checked with the Task-4 finding baked into `lib/damageTree.ts`):
 *
 *   out[`enemy_res_${el}`] = resistanceFraction(enemy.resistance, el)
 *                             + raw.get(`enemy_res_${el}`) / 100;
 *
 * i.e. `ComputeResult.stats.enemy_res_<element>` is the FINAL EFFECTIVE
 * resistance as a 0-1 FRACTION (base resistance with any char-contributed
 * shred already folded in) — NOT a bare shred delta. A Zhongli-style "Jade
 * Screen" shred of -20 (raw percent, e.g. `characterConditions.ts:200`'s
 * `enemy_res_geo: -20`) against a 10% base resistance produces
 * `0.10 + (-20 / 100) = -0.10` in the bag — i.e. effective = -10%.
 *
 * So a fixture representing "base 10%, Zhongli shred 20" has
 * `stats.enemy_res_geo = -0.10` (fraction), and `effectiveResRows` must
 * recover `{ base: 10, shred: 20, effective: -10 }` from it.
 */

describe("effectiveResRows", () => {
  it("computes shred and effective from a uniform base + one shredded element", () => {
    const base = 10; // uniform 10% base resistance
    const stats: Record<string, number> = {
      // Zhongli-style shred: base(0.10) + (-20/100) = -0.10 → effective -10%.
      enemy_res_geo: -0.1,
    };

    const rows = effectiveResRows(base, stats, "pyro");

    const geoRow = rows.find((r) => r.element === "geo");
    expect(geoRow).toEqual({ element: "geo", base: 10, shred: 20, effective: -10 });
  });

  it("returns exactly one row (the active element) when there are no shreds", () => {
    const base = 10;
    // All elements present in the bag at the base value — no shred anywhere.
    const stats: Record<string, number> = {
      enemy_res_physical: 0.1,
      enemy_res_pyro: 0.1,
      enemy_res_hydro: 0.1,
      enemy_res_electro: 0.1,
      enemy_res_cryo: 0.1,
      enemy_res_anemo: 0.1,
      enemy_res_geo: 0.1,
      enemy_res_dendro: 0.1,
    };

    const rows = effectiveResRows(base, stats, "pyro");

    expect(rows).toEqual([{ element: "pyro", base: 10, shred: 0, effective: 10 }]);
  });

  it("respects a per-element base record", () => {
    const base: Record<string, number> = { pyro: 10, hydro: 5, geo: 0 };
    const stats: Record<string, number> = {
      // geo base 0% shredded by 30 (e.g. VV-style) → 0 + (-30/100) = -0.30.
      enemy_res_geo: -0.3,
    };

    const rows = effectiveResRows(base, stats, "hydro");

    expect(rows).toEqual(
      expect.arrayContaining([
        { element: "geo", base: 0, shred: 30, effective: -30 },
        { element: "hydro", base: 5, shred: 0, effective: 5 },
      ])
    );
    expect(rows).toHaveLength(2);
  });

  it("does not duplicate the active element when it is already shredded", () => {
    const base = 10;
    const stats: Record<string, number> = {
      enemy_res_pyro: -0.1, // shredded by 20
    };

    const rows = effectiveResRows(base, stats, "pyro");

    expect(rows).toEqual([{ element: "pyro", base: 10, shred: 20, effective: -10 }]);
  });

  it("returns an empty array when there is no active element and no shreds", () => {
    const base = 10;
    const stats: Record<string, number> = { enemy_res_pyro: 0.1 };

    const rows = effectiveResRows(base, stats, null);

    expect(rows).toEqual([]);
  });
});
