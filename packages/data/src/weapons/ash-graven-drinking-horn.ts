import type { DbObjectWeapon, Feature, TalentTable } from "@genshin/types";
import { AshGravenDrinkingHornStatTable } from "../generated/weaponStatTables.js";

function refineValueTable(values: readonly number[]): TalentTable {
  return { getValue: (refine: number): number => values[Math.min(refine, values.length) - 1] ?? 0 };
}

// Condition has only text_percent_dmg (UI marker) → dropped per brief rules.

const hpProc: Feature = {
  name: "ash_graven_drinking_horn_dmg",
  category: "weapon",
  element: "physical",
  multipliers: [
    { scaling: "hp*", leveling: "weapon_refine", values: refineValueTable([40, 50, 60, 70, 80]) },
  ],
};

export const ashGravenDrinkingHorn: DbObjectWeapon = {
  name: "ash_graven_drinking_horn",
  serializeId: 179,
  gameId: 14427,
  rarity: 4,
  weapon: "catalyst",
  statTable: AshGravenDrinkingHornStatTable,
  conditions: [],
  features: [hpProc],
};
