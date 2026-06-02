import type { DbObjectWeapon, Feature, TalentTable } from "@genshin/types";
import { DebateClubStatTable } from "../generated/weaponStatTables.js";

function refineValueTable(values: readonly number[]): TalentTable {
  return { getValue: (refine: number): number => values[Math.min(refine, values.length) - 1] ?? 0 };
}

// Condition has only text_percent_dmg (UI marker) → dropped per brief rules.

const aoeProc: Feature = {
  name: "debate_club_aoe",
  category: "weapon",
  element: "physical",
  multipliers: [
    { leveling: "weapon_refine", values: refineValueTable([60, 75, 90, 105, 120]) },
  ],
};

export const debateClub: DbObjectWeapon = {
  name: "debate_club",
  serializeId: 76,
  gameId: 12305,
  rarity: 3,
  weapon: "claymore",
  statTable: DebateClubStatTable,
  conditions: [],
  features: [aoeProc],
};
