/**
 * Frostbearer — 4★ Catalyst
 *
 * Source: raw/genshin_calc_pub/src/js/db/Weapon/Catalyst/Frostbearer.js
 *
 * Passive "Frost Burial":
 *   - Two ConditionStaticRefine entries carry ONLY text_* stat markers → pure UI
 *     text, numeric no-ops → OMIT both conditions entirely.
 *   - Two FeatureDamage branches sharing the key "everfrost" (physical AoE proc),
 *     mutually exclusive on cryo enemy-status:
 *       Non-cryo branch (invert:true): 80/95/110/125/140% of ATK
 *       Cryo    branch              : 200/240/280/320/360% of ATK
 *   - Oracle (no enemy status set) → invert branch is PRODUCED → fixture
 *     `weapon.everfrost` matches the 80% row at R1.
 *
 * Fixture (klee rep):
 *   R1 everfrost: normal 1009.16 / crit 2018.31 / avg 1110.07  (80% branch, inert gate)
 *   R5 everfrost: normal 1766.02 / crit 3532.05 / avg 1942.63  (140% branch, inert gate)
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Weapon/Catalyst/Frostbearer.js:10-65
 *   tests/golden/fixtures/weapons-r1/frostbearer.json
 *   tests/golden/fixtures/weapons-r5/frostbearer.json
 */

import type { DbObjectWeapon, Feature, TalentTable } from "@genshin/types";
import { FrostbearerStatTable } from "../generated/weaponStatTables.js";

function refineValueTable(values: readonly number[]): TalentTable {
  return { getValue: (refine: number): number => values[Math.min(refine, values.length) - 1] ?? 0 };
}

// Non-cryo branch: active when enemy is NOT cryo-afflicted (invert:true).
// Oracle (no status) → this branch is produced → fixture values are 80-140% table.
const everfrostNonCryo: Feature = {
  name: "everfrost",
  category: "weapon",
  element: "physical",
  condition: { type: "enemy-status", statuses: ["cryo"], invert: true },
  multipliers: [
    {
      leveling: "weapon_refine",
      values: refineValueTable([80, 95, 110, 125, 140]),
    },
  ],
};

// Cryo branch: active when enemy IS cryo-afflicted.
// Dormant in oracle → no fixture entry produced by this branch.
const everfrostCryo: Feature = {
  name: "everfrost",
  category: "weapon",
  element: "physical",
  condition: { type: "enemy-status", statuses: ["cryo"] },
  multipliers: [
    {
      leveling: "weapon_refine",
      values: refineValueTable([200, 240, 280, 320, 360]),
    },
  ],
};

export const frostbearer: DbObjectWeapon = {
  name: "frostbearer",
  serializeId: 47,
  gameId: 14412,
  rarity: 4,
  weapon: "catalyst",
  statTable: FrostbearerStatTable,
  features: [everfrostNonCryo, everfrostCryo],
};
