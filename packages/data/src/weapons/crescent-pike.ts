import type { DbObjectWeapon, Feature, TalentTable } from "@genshin/types";
import { CrescentPikeStatTable } from "../generated/weaponStatTables.js";

function refineValueTable(values: readonly number[]): TalentTable {
  return { getValue: (refine: number): number => values[Math.min(refine, values.length) - 1] ?? 0 };
}

// Condition has only text_percent (UI marker) → dropped per brief rules.

const additionalProc: Feature = {
  name: "weapon_additional_dmg",
  category: "weapon",
  element: "physical",
  multipliers: [
    { leveling: "weapon_refine", values: refineValueTable([20, 25, 30, 35, 40]) },
  ],
};

export const crescentPike: DbObjectWeapon = {
  name: "crescent_pike",
  serializeId: 86,
  gameId: 13403,
  rarity: 4,
  weapon: "polearm",
  statTable: CrescentPikeStatTable,
  conditions: [],
  features: [additionalProc],
};
