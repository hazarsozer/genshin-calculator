/**
 * The Viridescent Hunt — 4★ Bow
 *
 * Source: raw/genshin_calc_pub/src/js/db/Weapon/Bow/ViridescentHunt.js
 *
 * Passive "Verdant Wind":
 *   - Condition (ConditionStaticRefine) has ONLY `text_percent_dmg`, `text_percent_chance`,
 *     and `text_number_cd` stats — all `text_*` UI markers, numeric no-ops → OMIT entire
 *     condition.
 *   - Proc "Cyclone": deals 40/50/60/70/80% of ATK as physical damage (FeatureDamage,
 *     no element arg → physical). Refine-scaled.
 *
 * Fixture key: `weapon.viridescent_hunt_whirl`
 * R1 normal: 378.9  R5 normal: 757.9 → values differ → refine-scaled (5 values).
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Weapon/Bow/ViridescentHunt.js:8-38
 */

import type { DbObjectWeapon, Feature, TalentTable } from "@genshin/types";
import { ViridescentHuntStatTable } from "../generated/weaponStatTables.js";

function refineValueTable(values: readonly number[]): TalentTable {
  return { getValue: (refine: number): number => values[Math.min(refine, values.length) - 1] ?? 0 };
}

// "Cyclone" proc: 40/50/60/70/80% of ATK, physical, no element in raw → physical.
const cycloneProc: Feature = {
  name: "viridescent_hunt_whirl",
  category: "weapon",
  element: "physical",
  multipliers: [
    {
      leveling: "weapon_refine",
      values: refineValueTable([40, 50, 60, 70, 80]),
    },
  ],
};

export const theViridescentHunt: DbObjectWeapon = {
  name: "the_viridescent_hunt",
  serializeId: 40,
  gameId: 15409,
  rarity: 4,
  weapon: "bow",
  statTable: ViridescentHuntStatTable,
  features: [cycloneProc],
};
