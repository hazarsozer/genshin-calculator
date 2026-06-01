import type { ConditionStaticRefine, DbObjectWeapon } from "@genshin/types";
import { BloodtaintedGreatswordStatTable } from "../generated/weaponStatTables.js";

// "Bane of Fire and Thunder" — DMG +12/15/18/21/24% vs Pyro/Electro enemies.
// Gated by enemy-status (inert in v5.8 oracle; no status set → gate off → base hits).
// Source: raw/genshin_calc_pub/src/js/db/Weapon/Claymore/BloodtaintedGreatsword.js
const baneOfFireAndThunder: ConditionStaticRefine = {
  type: "refine",
  title: "talent_name.weapon_bane_of_fire_and_thunder",
  description: "talent_descr.weapon_bane_of_fire_and_thunder",
  refinementStats: [
    { dmg_all: 12 },
    { dmg_all: 15 },
    { dmg_all: 18 },
    { dmg_all: 21 },
    { dmg_all: 24 },
  ],
  condition: { type: "enemy-status", statuses: ["pyro", "electro"] },
};

export const bloodtaintedGreatsword: DbObjectWeapon = {
  name: "bloodtainted_greatsword",
  serializeId: 75,
  gameId: 12302,
  rarity: 3,
  weapon: "claymore",
  statTable: BloodtaintedGreatswordStatTable,
  conditions: [baneOfFireAndThunder],
};
