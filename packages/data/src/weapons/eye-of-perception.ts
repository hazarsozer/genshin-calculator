import type { DbObjectWeapon, Feature, TalentTable } from "@genshin/types";
import { EyeofPerceptionStatTable } from "../generated/weaponStatTables.js";

function refineValueTable(values: readonly number[]): TalentTable {
  return { getValue: (refine: number): number => values[Math.min(refine, values.length) - 1] ?? 0 };
}

// Condition has only text_* keys (text_percent_dmg, text_percent_chance, text_cd) → dropped per brief rules.

const boltProc: Feature = {
  name: "eye_of_perception_bolt",
  category: "weapon",
  element: "physical",
  multipliers: [
    { leveling: "weapon_refine", values: refineValueTable([240, 270, 300, 330, 360]) },
  ],
};

export const eyeOfPerception: DbObjectWeapon = {
  name: "eye_of_perception",
  serializeId: 49,
  gameId: 14409,
  rarity: 4,
  weapon: "catalyst",
  statTable: EyeofPerceptionStatTable,
  conditions: [],
  features: [boltProc],
};
