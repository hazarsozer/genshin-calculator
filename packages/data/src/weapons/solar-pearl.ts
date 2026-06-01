/**
 * Solar Pearl — 4★ Catalyst
 *
 * Source: raw/genshin_calc_pub/src/js/db/Weapon/Catalyst/SolarPearl.js
 *
 * Passive: "Solar Shine"
 *   Toggle 1 (refine-scaled): Skill/Burst DMG +20/25/30/35/40% — ConditionBooleanRefine
 *   Toggle 2 (refine-scaled): Normal Attack DMG +20/25/30/35/40% — ConditionBooleanRefine
 *
 * Settings keys: `weapon_solar_pearl_1`, `weapon_solar_pearl_2` (boolean toggles)
 * serializeId: 43 (from raw DbObjectWeapon.serializeId)
 *
 * Stat-only passive — no damage proc features.
 */

import type { DbObjectWeapon, ConditionBooleanRefine } from "@genshin/types";
import { SolarPearlStatTable } from "../generated/weaponStatTables.js";

// Source: SolarPearl.js:15-23 — ConditionBooleanRefine, StatTable('dmg_skill'/'dmg_burst', [20,25,30,35,40])
const skillBurstToggle: ConditionBooleanRefine = {
  type: "boolean-refine",
  name: "weapon_solar_pearl_1",
  serializeId: 1,
  title: "talent_name.weapon_solar_pearl",
  description: "talent_descr.weapon_solar_pearl_1",
  refinementStats: [
    { dmg_skill: 20, dmg_burst: 20 }, // R1
    { dmg_skill: 25, dmg_burst: 25 }, // R2
    { dmg_skill: 30, dmg_burst: 30 }, // R3
    { dmg_skill: 35, dmg_burst: 35 }, // R4
    { dmg_skill: 40, dmg_burst: 40 }, // R5
  ],
};

// Source: SolarPearl.js:25-33 — ConditionBooleanRefine, StatTable('dmg_normal', [20,25,30,35,40])
const normalToggle: ConditionBooleanRefine = {
  type: "boolean-refine",
  name: "weapon_solar_pearl_2",
  serializeId: 2,
  title: "talent_name.weapon_solar_pearl",
  description: "talent_descr.weapon_solar_pearl_2",
  refinementStats: [
    { dmg_normal: 20 }, // R1
    { dmg_normal: 25 }, // R2
    { dmg_normal: 30 }, // R3
    { dmg_normal: 35 }, // R4
    { dmg_normal: 40 }, // R5
  ],
};

export const solarPearl: DbObjectWeapon = {
  name: "solar_pearl",
  serializeId: 43,
  gameId: 14405,
  rarity: 4,
  weapon: "catalyst",
  // Reference the generated stat table by key — never re-transcribe values.
  statTable: SolarPearlStatTable,
  conditions: [skillBurstToggle, normalToggle],
};
