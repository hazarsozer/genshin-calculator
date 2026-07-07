/**
 * Gest of the Mighty Wolf — 5★ claymore (v6.4, live port)
 *
 * Sub-stat: CRIT Rate. Passive "Pack Tactics" (name from GO):
 *   Integer stacks 1–4 (teamBuff: true in GO); per stack:
 *     +7.5% all DMG (R1), +9.5% (R2), +11.5% (R3), +13.5% (R4), +15.5% (R5).
 *
 * GO sheet: /tmp/genshin-optimizer/libs/gi/sheets/src/Weapons/Claymore/GestOfTheMightyWolf/index.tsx
 *   cond(key, 'stacks') → condStacks
 *   stacksArr = range(1, 4) = [1..4]
 *   lookup(condStacks, objKeyMap(stacksArr, v => constant(v)), naught)
 *   dmg_arr = [-1, 0.075, 0.095, 0.115, 0.135, 0.155]  (index 1=R1..5=R5)
 *   all_dmg_ = stacks × subscript(refinement, dmg_arr)
 *   GO conditional key: { GestOfTheMightyWolf: { stacks: "4" } }  (string — deepMapToConst)
 *
 * SELF PATH ONLY: GO marks this `teamBuff: true`. Our port gates only the SELF
 * all_dmg_ path (the wielder gets it from team-merge self-application in `uiDataForTeam`).
 *
 * QUARANTINED (no code shipped):
 *   (a) Team propagation of all_dmg_: off-field/weapon_other teammate buff channel —
 *       out of scope; the lean-port pattern applies (document, don't fake-gate).
 *   (b) CRIT DMG per-stack (+7.5% R1, same scaling as all_dmg_) when Hexerei tally ≥ 2:
 *       runtime tally — no engine primitive; quarantined per gate-mode discipline.
 *
 * KEY: our engine's all-DMG bonus key is `dmg_all` (confirmed: alley-hunter, absolution,
 * aqua-simulacra, freedom-sworn, the-bell all use `dmg_all`; GO's `all_dmg_` maps to
 * our `dmg_all` via the same buildStats channel at line ~98).
 *
 * Gate: GO-gate, RATIO mode. Varka (anemo claymore, pure ATK, already in roster).
 *   gest-of-the-mighty-wolf-weapon-gate: stacks=4 → ×1.30 on any hit.
 *
 * Amber fixture: tools/port/_fixtures/ambr/weapon/12515.json (name "Gest of the Mighty Wolf",
 *   type Claymore, rank 5 = 5★, specialProp FIGHT_PROP_CRITICAL = CRIT Rate substat).
 */

import type { ConditionStacks, DbObjectWeapon } from "@genshin/types";
import { GestOfTheMightyWolfStatTable } from "../generated/gest-of-the-mighty-wolf.gen-weapon.js";

// Source: GO GestOfTheMightyWolf/index.tsx
//   dmg_arr = [-1, 0.075, 0.095, 0.115, 0.135, 0.155]  (R1..R5 per-stack fraction)
//   all_dmg_ = stacks × subscript(refinement, dmg_arr)
//   teamBuff: true — SELF path only; team propagation quarantined.
//   QUARANTINED: critDMG_ per-stack gated on tally.hexerei >= 2 (runtime, no engine primitive).
const stackPassive: ConditionStacks = {
  type: "stacks",
  name: "weapon_gest_of_the_mighty_wolf",
  serializeId: 1,
  title: "talent_name.weapon_gest_of_the_mighty_wolf",
  description: "talent_descr.weapon_gest_of_the_mighty_wolf",
  maxStacks: 4,
  refinementStats: [
    { dmg_all: 7.5 },  // R1: +7.5% all DMG per stack
    { dmg_all: 9.5 },  // R2
    { dmg_all: 11.5 }, // R3
    { dmg_all: 13.5 }, // R4
    { dmg_all: 15.5 }, // R5
  ],
};

export const gestOfTheMightyWolf: DbObjectWeapon = {
  name: "gest_of_the_mighty_wolf",
  gameId: 12515,
  rarity: 5,
  weapon: "claymore",
  statTable: GestOfTheMightyWolfStatTable,
  conditions: [stackPassive],
};
