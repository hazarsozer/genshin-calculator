/**
 * weaponStatPath.test.ts — calibration test for the raw/-free Amber weapon stat-table path.
 *
 * Control: Aqua Simulacra (gameId 15508, 5★ bow) — present in BOTH the wholesale
 * weaponStatTables.ts (raw/-derived ground truth) AND Amber. The Amber path must
 * reproduce the same StatTable across the full grid or the generator is wrong.
 *
 * This test FAILS until gen-live-weapon-tables.mjs has been run to emit
 * packages/data/src/generated/aqua-simulacra.gen-weapon.ts.
 */
import { describe, it, expect } from "vitest";

// Ground truth: the raw/-derived wholesale tables (never hardcoded).
import { AquaSimulacraStatTable } from "../generated/weaponStatTables.js";

// Amber path: the generated file emitted by gen-live-weapon-tables.mjs.
// This import will fail (RED) until the file is emitted.
import { AquaSimulacraStatTable as AmbrAquaStatTable } from "../generated/aqua-simulacra.gen-weapon.js";

const LEVELS = [1, 20, 40, 50, 60, 70, 80, 90] as const;
const ASCS   = [0, 1, 2, 3, 4, 5, 6] as const;

// fp epsilon: 3 decimal places (her raw data ≤4 dp; crt curves are exact integers)
const DP = 3;

describe("Aqua Simulacra — Amber path byte-identical to raw/-derived table", () => {
  for (const statName of ["atk_base", "crit_dmg_base"] as const) {
    const genEntry  = AquaSimulacraStatTable.find((e) => e.getName() === statName);
    const ambrEntry = AmbrAquaStatTable.find((e) => e.getName() === statName);

    it(`${statName}: Amber path entry exists`, () => {
      expect(ambrEntry, `Amber path missing ${statName}`).toBeDefined();
    });

    it(`${statName}: getValue matches raw/-derived table at every (level, asc) grid point`, () => {
      expect(genEntry,  `raw/-derived table missing ${statName}`).toBeDefined();
      expect(ambrEntry, `Amber path missing ${statName}`).toBeDefined();
      for (const level of LEVELS) {
        for (const asc of ASCS) {
          const expected = genEntry!.getValue(level, asc);
          const actual   = ambrEntry!.getValue(level, asc);
          expect(actual).toBeCloseTo(expected, DP);
        }
      }
    });
  }
});
