/**
 * King's Squire — 4★ Bow
 *
 * Source: raw/genshin_calc_pub/src/js/db/Weapon/Bow/KingsSquire.js
 *
 * Passive "Labyrinth Lord's Instruction":
 *   - Toggle (ConditionBooleanRefine, serializeId:1): EM +60/80/100/120/140
 *     AND text_percent_dmg (UI only, omitted) → keep mastery only.
 *   - Proc "Enigma Treatise": deals 100/120/140/160/180% of ATK as physical
 *     (FeatureDamage, no element arg → physical). Refine-scaled.
 *
 * Fixture key: `weapon.kings_squire_dmg`
 * R1 normal: 1316.1  R5 normal: 2369.0 → values differ → refine-scaled (5 values).
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Weapon/Bow/KingsSquire.js:8-39
 */

import type {
  ConditionBooleanRefine,
  DbObjectWeapon,
  Feature,
  TalentTable,
} from "@genshin/types";
import { KingsSquireStatTable } from "../generated/weaponStatTables.js";

function refineValueTable(values: readonly number[]): TalentTable {
  return { getValue: (refine: number): number => values[Math.min(refine, values.length) - 1] ?? 0 };
}

// Toggle: EM +60/80/100/120/140 (mastery); text_percent_dmg is UI-only → omitted.
const masteryToggle: ConditionBooleanRefine = {
  type: "boolean-refine",
  name: "weapon_kings_squire",
  serializeId: 1,
  title: "talent_name.labyrinth_lords_instruction",
  description: "talent_descr.labyrinth_lords_instruction",
  refinementStats: [
    { mastery: 60 },  // R1
    { mastery: 80 },  // R2
    { mastery: 100 }, // R3
    { mastery: 120 }, // R4
    { mastery: 140 }, // R5
  ],
};

// "Enigma Treatise" proc: 100/120/140/160/180% of ATK, physical, no element in raw → physical.
const enigmaProc: Feature = {
  name: "kings_squire_dmg",
  category: "weapon",
  element: "physical",
  multipliers: [
    {
      leveling: "weapon_refine",
      values: refineValueTable([100, 120, 140, 160, 180]),
    },
  ],
};

export const kingsSquire: DbObjectWeapon = {
  name: "kings_squire",
  serializeId: 129,
  gameId: 15417,
  rarity: 4,
  weapon: "bow",
  statTable: KingsSquireStatTable,
  conditions: [masteryToggle],
  features: [enigmaProc],
};
