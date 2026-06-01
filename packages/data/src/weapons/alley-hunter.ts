/**
 * Alley Hunter — 4★ Bow
 *
 * Source: raw/genshin_calc_pub/src/js/db/Weapon/Bow/AlleyHunter.js
 *
 * Passive: "Urban Guerrilla"
 *   Stacks (0–10, refine-scaled): all DMG +2/2.5/3/3.5/4% per stack — ConditionStacks
 *   `levelSetting: "weapon_refine"` → per-stack value indexed by weapon_refine.
 *   Additional display keys (text_percent_max, text_percent_reduce) are ignored by the
 *   damage engine — stat-only passive, no proc features.
 *
 * Settings key: `weapon_alley_hunter` (stack count 0–10)
 * serializeId: 23 (from raw DbObjectWeapon.serializeId)
 */

import type { DbObjectWeapon, ConditionStacks } from "@genshin/types";
import { AlleyHunterStatTable } from "../generated/weaponStatTables.js";

// Source: AlleyHunter.js:15-29 — ConditionStacks, maxStacks: 10, levelSetting: 'weapon_refine',
// StatTable('dmg_all', [2, 2.5, 3, 3.5, 4]) per stack.
// text_percent_max / text_percent_reduce are display-only; engine ignores unknown stat keys.
const stackPassive: ConditionStacks = {
  type: "stacks",
  name: "weapon_alley_hunter",
  serializeId: 1,
  title: "talent_name.weapon_alley_hunter",
  description: "talent_descr.weapon_alley_hunter",
  maxStacks: 10,
  refinementStats: [
    { dmg_all: 2 },   // R1: 2% all DMG per stack
    { dmg_all: 2.5 }, // R2
    { dmg_all: 3 },   // R3
    { dmg_all: 3.5 }, // R4
    { dmg_all: 4 },   // R5
  ],
};

export const alleyHunter: DbObjectWeapon = {
  name: "alley_hunter",
  serializeId: 23,
  gameId: 15410,
  rarity: 4,
  weapon: "bow",
  // Reference the generated stat table by key — never re-transcribe values.
  statTable: AlleyHunterStatTable,
  conditions: [stackPassive],
};
