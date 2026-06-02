import type { ConditionStaticRefine, DbObjectWeapon } from "@genshin/types";
import { MagicGuideStatTable } from "../generated/weaponStatTables.js";

// "Bane of Storm and Tide" — DMG +12/15/18/21/24% vs Electro/Hydro enemies.
// Gated by enemy-status (inert in v5.8 oracle; no status set → gate off → base hits).
// Source: raw/genshin_calc_pub/src/js/db/Weapon/Catalyst/MagicGuide.js
const baneOfStormAndTide: ConditionStaticRefine = {
  type: "refine",
  title: "talent_name.weapon_bane_of_storm_and_tide",
  description: "talent_descr.weapon_bane_of_storm_and_tide",
  refinementStats: [
    { dmg_all: 12 },
    { dmg_all: 15 },
    { dmg_all: 18 },
    { dmg_all: 21 },
    { dmg_all: 24 },
  ],
  condition: { type: "enemy-status", statuses: ["electro", "hydro"] },
};

export const magicGuide: DbObjectWeapon = {
  name: "magic_guide",
  serializeId: 60,
  gameId: 14301,
  rarity: 3,
  weapon: "catalyst",
  statTable: MagicGuideStatTable,
  conditions: [baneOfStormAndTide],
};
