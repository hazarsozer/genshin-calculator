/**
 * Scion of the Blazing Sun — 4★ Bow
 *
 * Source: raw/genshin_calc_pub/src/js/db/Weapon/Bow/ScionOfTheBlazingSun.js
 *
 * Passive "Scorching Sunbeam":
 *   - Condition 1 (ConditionStaticRefine): ONLY `text_percent_dmg` → UI text only → OMIT.
 *   - Condition 2 (ConditionBooleanRefine, serializeId:1): Charged Attack DMG against
 *     enemies +28/35/42/49/56% (`dmg_charged_enemy`). Refine-scaled.
 *   - Proc "Sunfire Arrow": 60/75/90/105/120% of ATK, physical (no element in raw).
 *     Refine-scaled.
 *
 * Fixture key: `weapon.scion_of_the_blazing_sun_dmg`
 * R1 normal: 586.7  R5 normal: 1173.4 → values differ → refine-scaled (5 values).
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Weapon/Bow/ScionOfTheBlazingSun.js:9-46
 */

import type {
  ConditionBooleanRefine,
  DbObjectWeapon,
  Feature,
  TalentTable,
} from "@genshin/types";
import { ScionOfTheBlazingSunStatTable } from "../generated/weaponStatTables.js";

function refineValueTable(values: readonly number[]): TalentTable {
  return { getValue: (refine: number): number => values[Math.min(refine, values.length) - 1] ?? 0 };
}

// Toggle: Charged Attack DMG vs enemies +28/35/42/49/56% (dmg_charged_enemy).
const sunfireToggle: ConditionBooleanRefine = {
  type: "boolean-refine",
  name: "weapon_scion_of_the_blazing_sun",
  serializeId: 1,
  title: "talent_name.weapon_scion_of_the_blazing_sun_2",
  description: "talent_descr.weapon_scion_of_the_blazing_sun_2",
  refinementStats: [
    { dmg_charged_enemy: 28 }, // R1
    { dmg_charged_enemy: 35 }, // R2
    { dmg_charged_enemy: 42 }, // R3
    { dmg_charged_enemy: 49 }, // R4
    { dmg_charged_enemy: 56 }, // R5
  ],
};

// "Sunfire Arrow" proc: 60/75/90/105/120% of ATK, physical, no element in raw → physical.
const sunfireProc: Feature = {
  name: "scion_of_the_blazing_sun_dmg",
  category: "weapon",
  element: "physical",
  multipliers: [
    {
      leveling: "weapon_refine",
      values: refineValueTable([60, 75, 90, 105, 120]),
    },
  ],
};

export const scionOfTheBlazingSun: DbObjectWeapon = {
  name: "scion_of_the_blazing_sun",
  serializeId: 155,
  gameId: 15424,
  rarity: 4,
  weapon: "bow",
  statTable: ScionOfTheBlazingSunStatTable,
  conditions: [sunfireToggle],
  features: [sunfireProc],
};
