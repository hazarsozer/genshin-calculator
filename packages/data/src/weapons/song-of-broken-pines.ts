/**
 * Song of Broken Pines — 5★ Claymore
 *
 * Passive "Rebel's Banner-Hymn" — TWO parts:
 *   Part 1 (always-on): ATK +16/20/24/28/32% (ConditionStaticRefine).
 *   Part 2 (Millennial Movement: "Millennial Movement: Banner-Hymn" team aura): on hits
 *     the party gains Normal/Charged ATK SPEED +12/15/18/21/24% and ATK +20/25/30/35/40%
 *     for 12s. In the SOLO oracle the wielder is in their own party → the aura SELF-applies
 *     (manifest sets `weapon_song_of_broken_pines: true`). Modelled as a ConditionBooleanRefine
 *     gated on that toggle.
 *
 * The aura's stats come from her global Static buff via ConditionMillenialMovement
 * (Buffs/Static.js:13-26): shared `atkBuff` atk_percent[20..40] + this weapon's
 * `atkSpeedBuff` atk_speed_normal[12..24]. atk_speed_normal is damage-INERT (no buildStats
 * emit consumes it) — kept for faithfulness. NOT the `text_*` display keys. (The reverted
 * prior port had only the +16..32 atk_percent static, missing the +20..40 MM atk% → ~1.27x low.)
 *
 * serializeId: 96, gameId: 12503.
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Weapon/Claymore/SongofBrokenPines.js
 *   raw/genshin_calc_pub/src/js/classes/Condition/MillenialMovement.js:8-13 (gating)
 *   raw/genshin_calc_pub/src/js/db/Buffs/Static.js:13-26 (atkBuff + atkSpeedBuff tables)
 */

import type { ConditionBooleanRefine, ConditionStaticRefine, DbObjectWeapon } from "@genshin/types";
import { SongofBrokenPinesStatTable } from "../generated/weaponStatTables.js";

// Part 1 — always-on ATK% (SongofBrokenPines.js, refine-scaled).
const atkPassive: ConditionStaticRefine = {
  type: "refine",
  title: "talent_name.weapon_rebel_banner_hymn",
  description: "talent_descr.weapon_rebel_banner_hymn_passive",
  refinementStats: [
    { atk_percent: 16 }, // R1
    { atk_percent: 20 }, // R2
    { atk_percent: 24 }, // R3
    { atk_percent: 28 }, // R4
    { atk_percent: 32 }, // R5
  ],
};

// Part 2 — Millennial Movement self-buff (toggle ON in the solo oracle):
// shared atkBuff atk_percent[20..40] + this weapon's atkSpeedBuff atk_speed_normal[12..24]
// (atk_speed_normal is inert for damage — included for faithfulness).
const millennialMovement: ConditionBooleanRefine = {
  type: "boolean-refine",
  name: "weapon_song_of_broken_pines",
  serializeId: 1,
  title: "talent_name.weapon_rebel_banner_hymn",
  description: "talent_descr.weapon_rebel_banner_hymn",
  refinementStats: [
    { atk_percent: 20, atk_speed_normal: 12 }, // R1
    { atk_percent: 25, atk_speed_normal: 15 }, // R2
    { atk_percent: 30, atk_speed_normal: 18 }, // R3
    { atk_percent: 35, atk_speed_normal: 21 }, // R4
    { atk_percent: 40, atk_speed_normal: 24 }, // R5
  ],
};

export const songOfBrokenPines: DbObjectWeapon = {
  name: "song_of_broken_pines",
  serializeId: 96,
  gameId: 12503,
  rarity: 5,
  weapon: "claymore",
  statTable: SongofBrokenPinesStatTable,
  conditions: [atkPassive, millennialMovement],
};
