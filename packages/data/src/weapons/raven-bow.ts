import type { ConditionStaticRefine, DbObjectWeapon } from "@genshin/types";
import { RavenBowStatTable } from "../generated/weaponStatTables.js";

// "Bane of Flame and Water" — DMG +12/15/18/21/24% vs Pyro/Hydro enemies.
// Gated by enemy-status (inert in v5.8 oracle; no status set → gate off → base hits).
// Source: raw/genshin_calc_pub/src/js/db/Weapon/Bow/RavenBow.js
const baneOfFlameAndWater: ConditionStaticRefine = {
  type: "refine",
  title: "talent_name.weapon_bane_of_flame_and_water",
  description: "talent_descr.weapon_bane_of_flame_and_water",
  refinementStats: [
    { dmg_all: 12 },
    { dmg_all: 15 },
    { dmg_all: 18 },
    { dmg_all: 21 },
    { dmg_all: 24 },
  ],
  condition: { type: "enemy-status", statuses: ["pyro", "hydro"] },
};

export const ravenBow: DbObjectWeapon = {
  name: "raven_bow",
  serializeId: 31,
  gameId: 15301,
  rarity: 3,
  weapon: "bow",
  statTable: RavenBowStatTable,
  conditions: [baneOfFlameAndWater],
};
