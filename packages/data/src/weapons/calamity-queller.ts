/**
 * Calamity Queller — 5★ Polearm
 *
 * Passive "Consummation" (raw CalamityQueller.js:33-75):
 *   1. Always-on all-7-element DMG +12/15/18/21/24% (ConditionStaticRefine).
 *   2. A stacking ATK% buff: +3.2/4/4.8/5.6/6.4% per stack (per refine), up to 6 stacks
 *      (ConditionStacks `weapon_calamity_queller`).
 *   3. An off-field toggle (`weapon_calamity_queller_off_field`) — a pure gate, no stats.
 *   4. OFF-FIELD DOUBLING: while off-field the consummation ATK% bonus is doubled. Her
 *      raw models this as a `ConditionStacksHidden` (= ConditionStacks with getType()→''
 *      — a UI-only override with NO calc effect) that re-applies the SAME per-stack
 *      atk_percent[3.2..6.4], reading the SAME stack count, gated by the off-field boolean.
 *
 * Port note: the hidden second copy is modelled as a plain `stacks` condition gated by
 * `.condition` (the port's standard mapping of her `subConditions`). It reads the same
 * `weapon_calamity_queller` count and emits the same atk_percent, so off-field → the
 * consummation ATK% applies twice = doubled — behaviorally identical to her
 * ConditionStacksHidden (whose only raw difference is the UI-invisible getType()). No new
 * engine variant needed. Uses the 7 explicit dmg_<element> keys exactly as her raw (NOT dmg_own).
 *
 * Numeric proof (via stats.atk, off-field + 6 stacks ON in the fixture): consummation ATK%
 * = 2 × 6 × 3.2 = 38.40 (R1) / 2 × 6 × 6.4 = 76.80 (R5) — both confirmed exactly (single
 * copy would be half). stats.atk 2971.107 (R1) / 3630.824 (R5).
 *
 * serializeId: 118, gameId: 13507.
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Weapon/Polearm/CalamityQueller.js:33-75
 *   raw/genshin_calc_pub/src/js/classes/Condition/Stacks/Hidden.js (ConditionStacks + getType()→'')
 */

import type {
  ConditionBoolean,
  ConditionStacks,
  ConditionStaticRefine,
  DbObjectWeapon,
} from "@genshin/types";
import { CalamityQuellerStatTable } from "../generated/weaponStatTables.js";

// Per-refine, per-stack consummation ATK% (CalamityQueller.js:55 / :69 — identical for both copies).
const consummationAtkPerStack = [
  { atk_percent: 3.2 }, // R1
  { atk_percent: 4 }, // R2
  { atk_percent: 4.8 }, // R3
  { atk_percent: 5.6 }, // R4
  { atk_percent: 6.4 }, // R5
] as const;

// 1. Always-on all-7-element consummation DMG (CalamityQueller.js:34-46).
const consummationDmg: ConditionStaticRefine = {
  type: "refine",
  title: "talent_name.weapon_calamity_queller",
  description: "talent_descr.weapon_calamity_queller",
  refinementStats: [
    { dmg_anemo: 12, dmg_geo: 12, dmg_pyro: 12, dmg_electro: 12, dmg_hydro: 12, dmg_cryo: 12, dmg_dendro: 12 }, // R1
    { dmg_anemo: 15, dmg_geo: 15, dmg_pyro: 15, dmg_electro: 15, dmg_hydro: 15, dmg_cryo: 15, dmg_dendro: 15 }, // R2
    { dmg_anemo: 18, dmg_geo: 18, dmg_pyro: 18, dmg_electro: 18, dmg_hydro: 18, dmg_cryo: 18, dmg_dendro: 18 }, // R3
    { dmg_anemo: 21, dmg_geo: 21, dmg_pyro: 21, dmg_electro: 21, dmg_hydro: 21, dmg_cryo: 21, dmg_dendro: 21 }, // R4
    { dmg_anemo: 24, dmg_geo: 24, dmg_pyro: 24, dmg_electro: 24, dmg_hydro: 24, dmg_cryo: 24, dmg_dendro: 24 }, // R5
  ],
};

// 2. Visible consummation ATK% stacks (CalamityQueller.js:47-57).
const consummationStacks: ConditionStacks = {
  type: "stacks",
  name: "weapon_calamity_queller",
  serializeId: 1,
  title: "talent_name.weapon_calamity_queller",
  description: "talent_descr.weapon_calamity_queller_2",
  maxStacks: 6,
  refinementStats: consummationAtkPerStack,
};

// 3. Off-field toggle — pure gate, contributes no stats (CalamityQueller.js:58-63).
const offFieldToggle: ConditionBoolean = {
  type: "boolean",
  name: "weapon_calamity_queller_off_field",
  serializeId: 2,
  title: "talent_name.weapon_calamity_queller",
  description: "talent_descr.weapon_calamity_queller_3",
};

// 4. Off-field doubling — a hidden second copy of the ATK% stacks, gated on the off-field
//    boolean, reading the SAME stack count (CalamityQueller.js:64-74, her ConditionStacksHidden).
const offFieldDoubling: ConditionStacks = {
  type: "stacks",
  name: "weapon_calamity_queller",
  maxStacks: 6,
  condition: { type: "boolean", name: "weapon_calamity_queller_off_field" },
  refinementStats: consummationAtkPerStack,
};

export const calamityQueller: DbObjectWeapon = {
  name: "calamity_queller",
  serializeId: 118,
  gameId: 13507,
  rarity: 5,
  weapon: "polearm",
  statTable: CalamityQuellerStatTable,
  conditions: [consummationDmg, consummationStacks, offFieldToggle, offFieldDoubling],
};
