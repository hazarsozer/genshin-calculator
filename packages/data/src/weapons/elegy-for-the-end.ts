/**
 * Elegy for the End — 5★ Bow
 *
 * Passive "The Parting Refrain" — TWO parts:
 *   Part 1 (always-on): Elemental Mastery +60/75/90/105/120 (ConditionStaticRefine).
 *   Part 2 (Millennial Movement / "Sigil of Remembrance" team aura): once 4 sigils
 *     are gathered, the party gains ATK +20/25/30/35/40% and EM +100/125/150/175/200
 *     for 12s. In the SOLO oracle the wielder is in their own party, so the aura
 *     SELF-applies — the manifest sets `weapon_elegy_for_the_end: true`. Modelled as a
 *     ConditionBooleanRefine gated on that toggle (active in the fixture).
 *
 * The aura's stats live in her global Static buff via ConditionMillenialMovement
 * (Buffs/Static.js:13-26): a shared `atkBuff` atk_percent[20..40] (active whenever any
 * Millennial-Movement weapon's toggle is on — solo = this weapon's refine) plus this
 * weapon's `masteryBuff` mastery[100..200]. NOT the `text_*` display keys.
 *
 * Numeric proof (exact, build-independent via stats.mastery): fixture EM = baseline
 * 170.2 + Part-1 static + Part-2 MM mastery. R1 170.2+60+100 = 330.2 ✓; R5 170.2+120+200
 * = 490.2 ✓. (The reverted prior port had only the +60/120 static → EM 100-200 short.)
 *
 * serializeId: 27, gameId: 15503.
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Weapon/Bow/ElegyfortheEnd.js
 *   raw/genshin_calc_pub/src/js/classes/Condition/MillenialMovement.js:8-13 (gating)
 *   raw/genshin_calc_pub/src/js/db/Buffs/Static.js:13-26 (atkBuff + masteryBuff tables)
 */

import type { ConditionBooleanRefine, ConditionStaticRefine, DbObjectWeapon } from "@genshin/types";
import { ElegyfortheEndStatTable } from "../generated/weaponStatTables.js";

// Part 1 — always-on Elemental Mastery (ElegyfortheEnd.js, refine-scaled).
const masteryPassive: ConditionStaticRefine = {
  type: "refine",
  title: "talent_name.weapon_the_parting_refrain",
  description: "talent_descr.weapon_the_parting_refrain_passive",
  refinementStats: [
    { mastery: 60 }, // R1
    { mastery: 75 }, // R2
    { mastery: 90 }, // R3
    { mastery: 105 }, // R4
    { mastery: 120 }, // R5
  ],
};

// Part 2 — Millennial Movement self-buff (toggle ON in the solo oracle):
// shared atkBuff atk_percent[20..40] + this weapon's masteryBuff mastery[100..200].
const millennialMovement: ConditionBooleanRefine = {
  type: "boolean-refine",
  name: "weapon_elegy_for_the_end",
  serializeId: 1,
  title: "talent_name.weapon_the_parting_refrain",
  description: "talent_descr.weapon_the_parting_refrain",
  refinementStats: [
    { atk_percent: 20, mastery: 100 }, // R1
    { atk_percent: 25, mastery: 125 }, // R2
    { atk_percent: 30, mastery: 150 }, // R3
    { atk_percent: 35, mastery: 175 }, // R4
    { atk_percent: 40, mastery: 200 }, // R5
  ],
};

export const elegyForTheEnd: DbObjectWeapon = {
  name: "elegy_for_the_end",
  serializeId: 27,
  gameId: 15503,
  rarity: 5,
  weapon: "bow",
  statTable: ElegyfortheEndStatTable,
  conditions: [masteryPassive, millennialMovement],
};
