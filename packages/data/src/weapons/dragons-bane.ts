import type { ConditionStaticRefine, DbObjectWeapon } from "@genshin/types";
import { DragonsBaneStatTable } from "../generated/weaponStatTables.js";

// "Bane of Flame and Water" — DMG +20/24/28/32/36% vs Pyro/Hydro enemies.
// Gated by enemy-status (inert in v5.8 oracle; no status set → gate off → base hits).
// Source: raw/genshin_calc_pub/src/js/db/Weapon/Polearm/DragonsBane.js
const baneOfFlameAndWater: ConditionStaticRefine = {
  type: "refine",
  title: "talent_name.weapon_bane_flame_water",
  description: "talent_descr.weapon_bane_flame_water",
  refinementStats: [
    { dmg_all: 20 },
    { dmg_all: 24 },
    { dmg_all: 28 },
    { dmg_all: 32 },
    { dmg_all: 36 },
  ],
  condition: { type: "enemy-status", statuses: ["pyro", "hydro"] },
};

export const dragonsBane: DbObjectWeapon = {
  name: "dragons_bane",
  serializeId: 88,
  gameId: 13401,
  rarity: 4,
  weapon: "polearm",
  statTable: DragonsBaneStatTable,
  conditions: [baneOfFlameAndWater],
};
