/**
 * elegy_for_the_end — 5★ Bow. BIND.
 *
 * Passive "The Parting Refrain":
 *   - Always-on (ConditionStaticRefine): Elemental Mastery +60/75/90/105/120 at R1..R5.
 *   - Toggle (ConditionBooleanRefine, "weapon_elegy_for_the_end"): stats are
 *     `text_value` [100..200] and `text_percent` [20..40] only → UI display markers
 *     (not in any buildStats emit list) → OMITTED.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Weapon/Bow/ElegyfortheEnd.js
 */

import type { DbObjectWeapon } from "@genshin/types";
import { ElegyfortheEndStatTable } from "../generated/weaponStatTables.js";

export const elegyForTheEnd: DbObjectWeapon = {
  name: "elegy_for_the_end",
  serializeId: 27,
  gameId: 15503,
  rarity: 5,
  weapon: "bow",
  statTable: ElegyfortheEndStatTable,
  conditions: [
    // Always-on Elemental Mastery +60/75/90/105/120 (ElegyfortheEnd.js:15-19).
    {
      type: "refine",
      title: "talent_name.weapon_elegy_for_the_end_passive",
      description: "talent_descr.weapon_elegy_for_the_end_passive",
      refinementStats: [
        { mastery: 60 },  // R1
        { mastery: 75 },  // R2
        { mastery: 90 },  // R3
        { mastery: 105 }, // R4
        { mastery: 120 }, // R5
      ],
    },
    // ConditionBooleanRefine toggle ("weapon_elegy_for_the_end") carries only
    // text_value/text_percent → display-only → OMITTED.
  ],
};
