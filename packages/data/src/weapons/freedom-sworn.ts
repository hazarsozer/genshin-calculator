/**
 * Freedom-Sworn — 5★ Sword
 *
 * Passive "Revolutionary Chorus" — TWO parts:
 *   Part 1 (always-on): DMG +10/12.5/15/17.5/20% (ConditionStaticRefine, dmg_all).
 *   Part 2 (Millennial Movement: "Song of Resistance" team aura): on triggering certain
 *     reactions the party gains ATK +20/25/30/35/40% and Normal/Charged/Plunging DMG
 *     +16/20/24/28/32% for 12s. In the SOLO oracle the wielder is in their own party →
 *     the aura SELF-applies (manifest sets `weapon_freedom_sworn: true`). Modelled as a
 *     ConditionBooleanRefine gated on that toggle.
 *
 * The aura's stats come from her global Static buff via ConditionMillenialMovement
 * (Buffs/Static.js:13-26): shared `atkBuff` atk_percent[20..40] + this weapon's
 * `affixBuff` dmg_normal/dmg_charged/dmg_plunge[16..32]. NOT the `text_*` display keys.
 * (The reverted prior port had only the +10..20 dmg_all static, missing atk% + the
 * +16..32 normal/charged/plunge → its damage ran ~1.66x low at R5.)
 *
 * serializeId: 97, gameId: 11503.
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Weapon/Sword/FreedomSworn.js
 *   raw/genshin_calc_pub/src/js/classes/Condition/MillenialMovement.js:8-13 (gating)
 *   raw/genshin_calc_pub/src/js/db/Buffs/Static.js:13-26 (atkBuff + affixBuff tables)
 */

import type { ConditionBooleanRefine, ConditionStaticRefine, DbObjectWeapon } from "@genshin/types";
import { FreedomSwornStatTable } from "../generated/weaponStatTables.js";

// Part 1 — always-on DMG bonus (FreedomSworn.js, refine-scaled, dmg_all).
const dmgPassive: ConditionStaticRefine = {
  type: "refine",
  title: "talent_name.weapon_revolutionary_chorus",
  description: "talent_descr.weapon_revolutionary_chorus_passive",
  refinementStats: [
    { dmg_all: 10 }, // R1
    { dmg_all: 12.5 }, // R2
    { dmg_all: 15 }, // R3
    { dmg_all: 17.5 }, // R4
    { dmg_all: 20 }, // R5
  ],
};

// Part 2 — Millennial Movement self-buff (toggle ON in the solo oracle):
// shared atkBuff atk_percent[20..40] + this weapon's affixBuff dmg_normal/charged/plunge[16..32].
const millennialMovement: ConditionBooleanRefine = {
  type: "boolean-refine",
  name: "weapon_freedom_sworn",
  serializeId: 1,
  title: "talent_name.weapon_revolutionary_chorus",
  description: "talent_descr.weapon_revolutionary_chorus",
  refinementStats: [
    { atk_percent: 20, dmg_normal: 16, dmg_charged: 16, dmg_plunge: 16 }, // R1
    { atk_percent: 25, dmg_normal: 20, dmg_charged: 20, dmg_plunge: 20 }, // R2
    { atk_percent: 30, dmg_normal: 24, dmg_charged: 24, dmg_plunge: 24 }, // R3
    { atk_percent: 35, dmg_normal: 28, dmg_charged: 28, dmg_plunge: 28 }, // R4
    { atk_percent: 40, dmg_normal: 32, dmg_charged: 32, dmg_plunge: 32 }, // R5
  ],
};

export const freedomSworn: DbObjectWeapon = {
  name: "freedom_sworn",
  serializeId: 97,
  gameId: 11503,
  rarity: 5,
  weapon: "sword",
  statTable: FreedomSwornStatTable,
  conditions: [dmgPassive, millennialMovement],
};
