/**
 * Lost Prayer to the Sacred Winds — 5★ Catalyst
 *
 * Source: raw/genshin_calc_pub/src/js/db/Weapon/Catalyst/LostPrayer.js
 *
 * Passive: "Boundless Blessing"
 *   Stack condition (0–4 stacks, key: `weapon_lost_prayer`).
 *   Each stack gives all elemental DMG +8/10/12/14/16% per stack at R1..R5.
 *   `levelSetting: "weapon_refine"` — the per-rank value is indexed by weapon_refine,
 *   and per-stack stats multiply by stack count in her engine's getData.
 *
 * Note: In our typed system, `refinementStats` carries all 7 elemental DMG keys
 * per refinement rank (one bag per R1..R5). Stack count × per-rank stat is
 * resolved by P2.2's conditionStats when it handles ConditionStacks.
 */

import type { DbObjectWeapon, ConditionStacks } from "@genshin/types";
import { LostPrayerStatTable } from "../generated/weaponStatTables.js";

/**
 * Build a per-rank elemental DMG stat bag (all 7 elements).
 * Source: LostPrayer.js — each of dmg_anemo/geo/pyro/electro/hydro/cryo/dendro
 * has the same value per rank.
 */
function allElementDmg(value: number): Record<string, number> {
  return {
    dmg_anemo: value,
    dmg_geo: value,
    dmg_pyro: value,
    dmg_electro: value,
    dmg_hydro: value,
    dmg_cryo: value,
    dmg_dendro: value,
  };
}

const stackPassive: ConditionStacks = {
  type: "stacks",
  name: "weapon_lost_prayer",
  serializeId: 1,
  title: "talent_name.weapon_lost_prayer",
  description: "talent_descr.weapon_lost_prayer",
  maxStacks: 4,
  refinementStats: [
    allElementDmg(8),  // R1: each stack adds 8% all elemental DMG
    allElementDmg(10), // R2
    allElementDmg(12), // R3
    allElementDmg(14), // R4
    allElementDmg(16), // R5
  ],
};

export const lostPrayer: DbObjectWeapon = {
  name: "lost_prayer_to_the_sacred_winds",
  gameId: 14502,
  rarity: 5,
  weapon: "catalyst",
  // Reference the generated stat table by key — never re-transcribe values.
  statTable: LostPrayerStatTable,
  conditions: [stackPassive],
};
