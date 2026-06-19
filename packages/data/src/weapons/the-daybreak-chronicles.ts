/**
 * The Daybreak Chronicles — 5★ bow (v6.2, live port)
 *
 * Sub-stat: CRIT DMG. Passive "Daybreak's Battle Song":
 *   Integer stacks 1–6 (refine-scaled); per stack:
 *     +10% normal_dmg_ + skill_dmg_ + burst_dmg_  (R1)
 *     +12.5% per stack (R2), +15% (R3), +17.5% (R4), +20% (R5)
 *   Max at 6 stacks: +60% (R1), +75% (R2), +90% (R3), +105% (R4), +120% (R5).
 *
 * GO sheet: /tmp/genshin-optimizer/libs/gi/sheets/src/Weapons/Bow/TheDaybreakChronicles/index.tsx
 *   cond(key, 'passive') → condPassive
 *   passiveArr = range(1, 6) = [1..6]
 *   lookup(condPassive, objKeyMap(passiveArr, v => constant(v)), naught)
 *   dmg_arr = [-1, 0.1, 0.125, 0.15, 0.175, 0.2]  (index 1=R1..5=R5)
 *   normal_dmg_ = skill_dmg_ = burst_dmg_ = passiveMult × subscript(refinement, dmg_arr)
 *   GO conditional key: { TheDaybreakChronicles: { passive: "6" } }  (string — deepMapToConst)
 *
 * Modeled as ONE stacks condition (Alley-Hunter shape):
 *   - weapon_the_daybreak_chronicles (stacks 1–6): dmg_normal + dmg_skill + dmg_burst per stack.
 *   Per-stack percent values (integer %) × stacks = total buff applied by buildStats.
 *
 * Gate: GO-gate, RATIO mode. One rep on Jahoda (bow in roster):
 *   the-daybreak-chronicles-weapon-gate: normal hit (normal_dmg_), skill hit (skill_dmg_),
 *   burst hit (burst_dmg_) — all three keys gated at stacks=6.
 *
 * Amber fixture: tools/port/_fixtures/ambr/weapon/15515.json (verified name, type, rarity 5★).
 */

import type { ConditionStacks, DbObjectWeapon } from "@genshin/types";
import { TheDaybreakChroniclesStatTable } from "../generated/the-daybreak-chronicles.gen-weapon.js";

// Source: GO TheDaybreakChronicles/index.tsx
//   dmg_arr = [-1, 0.1, 0.125, 0.15, 0.175, 0.2]  (R1..R5 per-stack fraction)
//   All three hit types (normal/skill/burst) receive the same per-stack value.
const stackPassive: ConditionStacks = {
  type: "stacks",
  name: "weapon_the_daybreak_chronicles",
  serializeId: 1,
  title: "talent_name.weapon_the_daybreak_chronicles",
  description: "talent_descr.weapon_the_daybreak_chronicles",
  maxStacks: 6,
  refinementStats: [
    { dmg_normal: 10, dmg_skill: 10, dmg_burst: 10 }, // R1: +10% per stack
    { dmg_normal: 12.5, dmg_skill: 12.5, dmg_burst: 12.5 }, // R2
    { dmg_normal: 15, dmg_skill: 15, dmg_burst: 15 }, // R3
    { dmg_normal: 17.5, dmg_skill: 17.5, dmg_burst: 17.5 }, // R4
    { dmg_normal: 20, dmg_skill: 20, dmg_burst: 20 }, // R5
  ],
};

export const theDaybreakChronicles: DbObjectWeapon = {
  name: "the_daybreak_chronicles",
  gameId: 15515,
  rarity: 5,
  weapon: "bow",
  statTable: TheDaybreakChroniclesStatTable,
  conditions: [stackPassive],
};
