import type { ConditionStaticRefine, DbObjectWeapon } from "@genshin/types";
import { CoolSteelStatTable } from "../generated/weaponStatTables.js";

// "Bane of Water and Ice" — DMG +12/15/18/21/24% vs Cryo/Hydro enemies.
// Gated by enemy-status (inert in v5.8 oracle; no status set → gate off → base hits).
// Source: raw/genshin_calc_pub/src/js/db/Weapon/Sword/CoolSteel.js
const baneOfWaterAndIce: ConditionStaticRefine = {
  type: "refine",
  title: "talent_name.weapon_bane_of_water_and_ice",
  description: "talent_descr.weapon_bane_of_water_and_ice",
  refinementStats: [
    { dmg_all: 12 },
    { dmg_all: 15 },
    { dmg_all: 18 },
    { dmg_all: 21 },
    { dmg_all: 24 },
  ],
  condition: { type: "enemy-status", statuses: ["cryo", "hydro"] },
};

export const coolSteel: DbObjectWeapon = {
  name: "cool_steel",
  serializeId: 5,
  gameId: 11301,
  rarity: 3,
  weapon: "sword",
  statTable: CoolSteelStatTable,
  conditions: [baneOfWaterAndIce],
};
