import type { ConditionStaticRefine, DbObjectWeapon } from "@genshin/types";
import { RainslasherStatTable } from "../generated/weaponStatTables.js";

// "Bane of Storm and Tide" — DMG +20/24/28/32/36% vs Electro/Hydro enemies.
// Gated by enemy-status (inert in v5.8 oracle; no status set → gate off → base hits).
// Source: raw/genshin_calc_pub/src/js/db/Weapon/Claymore/Rainslasher.js
const baneOfStormAndTide: ConditionStaticRefine = {
  type: "refine",
  title: "talent_name.weapon_bane_of_storm_and_tide",
  description: "talent_descr.weapon_bane_of_storm_and_tide",
  refinementStats: [
    { dmg_all: 20 },
    { dmg_all: 24 },
    { dmg_all: 28 },
    { dmg_all: 32 },
    { dmg_all: 36 },
  ],
  condition: { type: "enemy-status", statuses: ["electro", "hydro"] },
};

export const rainslasher: DbObjectWeapon = {
  name: "rainslasher",
  serializeId: 69,
  gameId: 12405,
  rarity: 4,
  weapon: "claymore",
  statTable: RainslasherStatTable,
  conditions: [baneOfStormAndTide],
};
