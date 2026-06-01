/**
 * Blackcliff Pole — 4★ Polearm
 *
 * Source: raw/genshin_calc_pub/src/js/db/Weapon/Polearm/BlackcliffPole.js
 *
 * Passive: "Press the Advantage"
 *   Stacks (0–3, refine-scaled): ATK +12/15/18/21/24% per stack — ConditionStacks
 *   `levelSetting: "weapon_refine"` → per-stack value indexed by weapon_refine.
 *
 * Settings key: `weapon_blackcliff_pole` (stack count 0–3)
 * serializeId: 85 (from raw DbObjectWeapon.serializeId)
 *
 * Stat-only passive — no damage proc features.
 */

import type { DbObjectWeapon, ConditionStacks } from "@genshin/types";
import { BlackcliffPoleStatTable } from "../generated/weaponStatTables.js";

// Source: BlackcliffPole.js:29-39 — ConditionStacks, maxStacks: 3, levelSetting: 'weapon_refine',
// StatTable('atk_percent', [12, 15, 18, 21, 24])
const stackPassive: ConditionStacks = {
  type: "stacks",
  name: "weapon_blackcliff_pole",
  serializeId: 1,
  title: "talent_name.weapon_press_the_advantage",
  description: "talent_descr.weapon_press_the_advantage",
  maxStacks: 3,
  refinementStats: [
    { atk_percent: 12 }, // R1: 12% ATK per stack
    { atk_percent: 15 }, // R2
    { atk_percent: 18 }, // R3
    { atk_percent: 21 }, // R4
    { atk_percent: 24 }, // R5
  ],
};

export const blackcliffPole: DbObjectWeapon = {
  name: "blackcliff_pole",
  serializeId: 85,
  gameId: 13404,
  rarity: 4,
  weapon: "polearm",
  // Reference the generated stat table by key — never re-transcribe values.
  statTable: BlackcliffPoleStatTable,
  conditions: [stackPassive],
};
