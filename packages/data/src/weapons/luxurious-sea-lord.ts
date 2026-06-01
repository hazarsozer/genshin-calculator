import type { ConditionStaticRefine, DbObjectWeapon, Feature, TalentTable } from "@genshin/types";
import { LuxuriousSeaLordStatTable } from "../generated/weaponStatTables.js";

function refineValueTable(values: readonly number[]): TalentTable {
  return { getValue: (refine: number): number => values[Math.min(refine, values.length) - 1] ?? 0 };
}

// Condition has dmg_burst (a real stat) + text_percent_dmg (UI marker) — keep only dmg_burst.
const burstBonus: ConditionStaticRefine = {
  type: "refine",
  title: "weapon_name.luxurious_sea_lord",
  description: "talent_descr.weapon_luxurious_sea_lord",
  refinementStats: [
    { dmg_burst: 12 },
    { dmg_burst: 15 },
    { dmg_burst: 18 },
    { dmg_burst: 21 },
    { dmg_burst: 24 },
  ],
};

const tunaProc: Feature = {
  name: "titanic_tuna_dmg",
  category: "weapon",
  element: "physical",
  multipliers: [
    { leveling: "weapon_refine", values: refineValueTable([100, 125, 150, 175, 200]) },
  ],
};

export const luxuriousSeaLord: DbObjectWeapon = {
  name: "luxurious_sea_lord",
  serializeId: 110,
  gameId: 12412,
  rarity: 4,
  weapon: "claymore",
  statTable: LuxuriousSeaLordStatTable,
  conditions: [burstBonus],
  features: [tunaProc],
};
