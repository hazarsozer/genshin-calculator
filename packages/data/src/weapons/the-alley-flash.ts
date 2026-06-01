/**
 * The Alley Flash — 4★ Sword
 *
 * Source: raw/genshin_calc_pub/src/js/db/Weapon/Sword/AlleyFlash.js
 *
 * Passive: "Itinerant Hero"
 *   Toggle (refine-scaled): all DMG +12/15/18/21/24% — ConditionBooleanRefine
 *
 * Settings key: `weapon_alley_flash` (boolean toggle)
 * serializeId: 1 (from raw DbObjectWeapon.serializeId)
 *
 * Stat-only passive — no damage proc features.
 */

import type { DbObjectWeapon, ConditionBooleanRefine } from "@genshin/types";
import { AlleyFlashStatTable } from "../generated/weaponStatTables.js";

// Source: AlleyFlash.js:15-23 — ConditionBooleanRefine, StatTable('dmg_all', [12, 15, 18, 21, 24])
const togglePassive: ConditionBooleanRefine = {
  type: "boolean-refine",
  name: "weapon_alley_flash",
  serializeId: 1,
  title: "talent_name.weapon_alley_flash",
  description: "talent_descr.weapon_alley_flash",
  refinementStats: [
    { dmg_all: 12 }, // R1
    { dmg_all: 15 }, // R2
    { dmg_all: 18 }, // R3
    { dmg_all: 21 }, // R4
    { dmg_all: 24 }, // R5
  ],
};

export const theAlleyFlash: DbObjectWeapon = {
  name: "the_alley_flash",
  serializeId: 1,
  gameId: 11410,
  rarity: 4,
  weapon: "sword",
  // Reference the generated stat table by key — never re-transcribe values.
  statTable: AlleyFlashStatTable,
  conditions: [togglePassive],
};
