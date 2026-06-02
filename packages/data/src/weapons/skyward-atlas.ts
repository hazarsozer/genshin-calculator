/**
 * Skyward Atlas — 5★ Catalyst (hand-port; weapon FeatureDamage).
 *
 * Passive "Wandering Clouds":
 *   - Always-on: All Elemental DMG +12/15/18/21/24% (single ConditionStaticRefine
 *     with 7 StatTables — one per non-physical element, all with the same values).
 *     Elements: Anemo, Geo, Pyro, Electro, Hydro, Cryo, Dendro.
 *   - Proc: Physical cloud projectile = 160/200/240/280/320% of ATK (REFINE-SCALED).
 *     Raw StatTable key: 'skyward_atlas_cloud'.
 *     Fixture: weapon.skyward_atlas_cloud.
 *     r1 normal=2099.9, r5 normal=4199.9 → scaled (2× at R5 vs R1).
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Weapon/Catalyst/SkywardAtlas.js
 *   tests/golden/fixtures/weapons-r1/skyward_atlas.json
 *   tests/golden/fixtures/weapons-r5/skyward_atlas.json
 */

import type {
  ConditionStaticRefine,
  DbObjectWeapon,
  Feature,
  TalentTable,
} from "@genshin/types";
import { SkywardAtlasStatTable } from "../generated/weaponStatTables.js";

function refineValueTable(values: readonly number[]): TalentTable {
  return { getValue: (refine: number): number => values[Math.min(refine, values.length) - 1] ?? 0 };
}

// Always-on: All Elemental DMG +12/15/18/21/24% (SkywardAtlas.js:13-23).
// 7 StatTables all with identical values → each refinementStats entry merges all 7 keys.
const elemDmgPassive: ConditionStaticRefine = {
  type: "refine",
  title: "talent_name.weapon_skyward_atlas",
  description: "talent_descr.weapon_skyward_atlas",
  refinementStats: [
    { dmg_anemo: 12, dmg_geo: 12, dmg_pyro: 12, dmg_electro: 12, dmg_hydro: 12, dmg_cryo: 12, dmg_dendro: 12 }, // R1
    { dmg_anemo: 15, dmg_geo: 15, dmg_pyro: 15, dmg_electro: 15, dmg_hydro: 15, dmg_cryo: 15, dmg_dendro: 15 }, // R2
    { dmg_anemo: 18, dmg_geo: 18, dmg_pyro: 18, dmg_electro: 18, dmg_hydro: 18, dmg_cryo: 18, dmg_dendro: 18 }, // R3
    { dmg_anemo: 21, dmg_geo: 21, dmg_pyro: 21, dmg_electro: 21, dmg_hydro: 21, dmg_cryo: 21, dmg_dendro: 21 }, // R4
    { dmg_anemo: 24, dmg_geo: 24, dmg_pyro: 24, dmg_electro: 24, dmg_hydro: 24, dmg_cryo: 24, dmg_dendro: 24 }, // R5
  ],
};

// Physical cloud projectile proc: 160/200/240/280/320% of ATK, REFINE-SCALED.
// Fixture: weapon.skyward_atlas_cloud, r1 normal=2099.9, r5 normal=4199.9.
const cloudProc: Feature = {
  name: "skyward_atlas_cloud",
  category: "weapon",
  element: "physical",
  multipliers: [
    {
      leveling: "weapon_refine",
      values: refineValueTable([160, 200, 240, 280, 320]),
    },
  ],
};

export const skywardAtlas: DbObjectWeapon = {
  name: "skyward_atlas",
  serializeId: 44,
  gameId: 14501,
  rarity: 5,
  weapon: "catalyst",
  statTable: SkywardAtlasStatTable,
  conditions: [elemDmgPassive],
  features: [cloudProc],
};
