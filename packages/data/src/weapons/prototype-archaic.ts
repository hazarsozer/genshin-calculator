import type { DbObjectWeapon, Feature, TalentTable } from "@genshin/types";
import { PrototypeArchaicStatTable } from "../generated/weaponStatTables.js";

function refineValueTable(values: readonly number[]): TalentTable {
  return { getValue: (refine: number): number => values[Math.min(refine, values.length) - 1] ?? 0 };
}

// Condition has only text_* keys (text_percent_dmg, text_percent_chance) → dropped per brief rules.

const aoeProc: Feature = {
  name: "prototype_archaic_aoe",
  category: "weapon",
  element: "physical",
  multipliers: [
    { leveling: "weapon_refine", values: refineValueTable([240, 300, 360, 420, 480]) },
  ],
};

export const prototypeArchaic: DbObjectWeapon = {
  name: "prototype_archaic",
  serializeId: 68,
  gameId: 12406,
  rarity: 4,
  weapon: "claymore",
  statTable: PrototypeArchaicStatTable,
  conditions: [],
  features: [aoeProc],
};
