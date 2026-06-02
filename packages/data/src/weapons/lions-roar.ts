import type { ConditionStaticRefine, DbObjectWeapon } from "@genshin/types";
import { LionsRoarStatTable } from "../generated/weaponStatTables.js";

// "Bane of Fire and Thunder" — DMG +20/24/28/32/36% vs Pyro/Electro enemies.
// Gated by enemy-status (inert in v5.8 oracle; no status set → gate off → base hits).
// Source: raw/genshin_calc_pub/src/js/db/Weapon/Sword/LionsRoar.js
const baneOfFireAndThunder: ConditionStaticRefine = {
  type: "refine",
  title: "talent_name.weapon_bane_of_fire_and_thunder",
  description: "talent_descr.weapon_bane_of_fire_and_thunder",
  refinementStats: [
    { dmg_all: 20 },
    { dmg_all: 24 },
    { dmg_all: 28 },
    { dmg_all: 32 },
    { dmg_all: 36 },
  ],
  condition: { type: "enemy-status", statuses: ["pyro", "electro"] },
};

export const lionsRoar: DbObjectWeapon = {
  name: "lions_roar",
  serializeId: 13,
  gameId: 11405,
  rarity: 4,
  weapon: "sword",
  statTable: LionsRoarStatTable,
  conditions: [baneOfFireAndThunder],
};
