/**
 * The Catch — 4★ Polearm
 *
 * Source: raw/genshin_calc_pub/src/js/db/Weapon/Polearm/Catch.js
 *
 * Passive: "Shanty"
 *   Always-on: Elemental Burst DMG +16/20/24/28/32% + Burst Crit Rate +6/7.5/9/10.5/12%
 *   No toggle, no stacks — pure ConditionStaticRefine.
 *
 * serializeId: 109 (from raw DbObjectWeapon.serializeId)
 * Pure stat weapon — no features flagged.
 */

import type { DbObjectWeapon, ConditionStaticRefine } from "@genshin/types";
import { CatchStatTable } from "../generated/weaponStatTables.js";

const burstPassive: ConditionStaticRefine = {
  type: "refine",
  title: "talent_name.weapon_catch",
  description: "talent_descr.weapon_catch",
  refinementStats: [
    { dmg_burst: 16, crit_rate_burst: 6 },    // R1
    { dmg_burst: 20, crit_rate_burst: 7.5 },   // R2
    { dmg_burst: 24, crit_rate_burst: 9 },     // R3
    { dmg_burst: 28, crit_rate_burst: 10.5 },  // R4
    { dmg_burst: 32, crit_rate_burst: 12 },    // R5
  ],
};

export const theCatch: DbObjectWeapon = {
  name: "the_catch",
  serializeId: 109,
  gameId: 13415,
  rarity: 4,
  weapon: "polearm",
  // Reference the generated stat table by key — never re-transcribe values.
  statTable: CatchStatTable,
  conditions: [burstPassive],
};
