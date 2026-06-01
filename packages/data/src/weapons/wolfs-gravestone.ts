/**
 * Wolf's Gravestone — 5★ Claymore
 *
 * Source: raw/genshin_calc_pub/src/js/db/Weapon/Claymore/WolfsGravestone.js
 *
 * Passive: "Wolfish Tracker"
 *   Always-on: ATK +20/25/30/35/40% (R1..R5) — ConditionStaticRefine
 *   Toggle:    ATK +40/50/60/70/80% when attacker's ATK ≤ 30K — ConditionBooleanRefine (refine-scaled toggle)
 *
 * Settings key: `weapon_wolfs_gravestone` (0 = off, 1 = on)
 * serializeId: 63 (from raw DbObjectWeapon.serializeId)
 */

import type { DbObjectWeapon, ConditionStaticRefine, ConditionBooleanRefine } from "@genshin/types";
import { WolfsGravestoneStatTable } from "../generated/weaponStatTables.js";

const alwaysOnPassive: ConditionStaticRefine = {
  type: "refine",
  title: "talent_name.weapon_wolfish_tracker",
  description: "talent_descr.bonus_atk",
  refinementStats: [
    { atk_percent: 20 }, // R1
    { atk_percent: 25 }, // R2
    { atk_percent: 30 }, // R3
    { atk_percent: 35 }, // R4
    { atk_percent: 40 }, // R5
  ],
};

const togglePassive: ConditionBooleanRefine = {
  type: "boolean-refine",
  name: "weapon_wolfs_gravestone",
  serializeId: 1,
  title: "talent_name.weapon_wolfish_tracker",
  description: "talent_descr.weapon_wolfish_tracker",
  refinementStats: [
    { atk_percent: 40 }, // R1
    { atk_percent: 50 }, // R2
    { atk_percent: 60 }, // R3
    { atk_percent: 70 }, // R4
    { atk_percent: 80 }, // R5
  ],
};

export const wolfsGravestone: DbObjectWeapon = {
  name: "wolfs_gravestone",
  serializeId: 63,
  gameId: 12502,
  rarity: 5,
  weapon: "claymore",
  // Reference the generated stat table by key — never re-transcribe values.
  statTable: WolfsGravestoneStatTable,
  conditions: [alwaysOnPassive, togglePassive],
};
