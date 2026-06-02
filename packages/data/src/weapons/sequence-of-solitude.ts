/**
 * Sequence of Solitude — 4★ Bow
 *
 * Source: raw/genshin_calc_pub/src/js/db/Weapon/Bow/SequenceofSolitude.js
 *
 * Passive "Wanderer's Melody":
 *   - Condition (ConditionStaticRefine): ONLY `text_percent_dmg` → UI text marker → OMIT.
 *   - Proc "Wanderer's hit": 40/55/70/85/100% of MAX HP as physical damage
 *     (FeatureDamage, no element arg → physical). Scales off `hp*`. Refine-scaled.
 *
 * Fixture key: `weapon.sequence_of_solitude_dmg`
 * R1 normal: 6091.8  R5 normal: 15229.5 → values differ → refine-scaled (5 values).
 * The large values (vs ATK-based procs) confirm hp* scaling (Ganyu rep has high HP).
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Weapon/Bow/SequenceofSolitude.js:8-39
 */

import type { DbObjectWeapon, Feature, TalentTable } from "@genshin/types";
import { SequenceofSolitudeStatTable } from "../generated/weaponStatTables.js";

function refineValueTable(values: readonly number[]): TalentTable {
  return { getValue: (refine: number): number => values[Math.min(refine, values.length) - 1] ?? 0 };
}

// Proc: 40/55/70/85/100% of HP, physical (no element in raw → physical), scaling: hp*.
const wandererProc: Feature = {
  name: "sequence_of_solitude_dmg",
  category: "weapon",
  element: "physical",
  multipliers: [
    {
      scaling: "hp*",
      leveling: "weapon_refine",
      values: refineValueTable([40, 55, 70, 85, 100]),
    },
  ],
};

export const sequenceOfSolitude: DbObjectWeapon = {
  name: "sequence_of_solitude",
  serializeId: 200,
  gameId: 15432,
  rarity: 4,
  weapon: "bow",
  statTable: SequenceofSolitudeStatTable,
  features: [wandererProc],
};
