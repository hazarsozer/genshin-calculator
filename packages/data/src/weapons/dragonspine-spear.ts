/**
 * Dragonspine Spear — 4★ Polearm
 *
 * Source: raw/genshin_calc_pub/src/js/db/Weapon/Polearm/DragonspineSpear.js
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
 * Fixture (hu_tao rep):
 *   R1 everfrost: normal 1052.06 / crit 2508.11 / avg 1197.66  (80% branch, inert gate)
 *   R5 everfrost: normal 1841.10 / crit 4389.19 / avg 2095.91  (140% branch, inert gate)
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Weapon/Polearm/DragonspineSpear.js:10-65
 *   tests/golden/fixtures/weapons-r1/dragonspine_spear.json
 *   tests/golden/fixtures/weapons-r5/dragonspine_spear.json
 */

import type { DbObjectWeapon, Feature, TalentTable } from "@genshin/types";
import { DragonspineSpearStatTable } from "../generated/weaponStatTables.js";

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

export const dragonspineSpear: DbObjectWeapon = {
  name: "dragonspine_spear",
  serializeId: 92,
  gameId: 13409,
  rarity: 4,
  weapon: "polearm",
  statTable: DragonspineSpearStatTable,
  features: [everfrostNonCryo, everfrostCryo],
};
