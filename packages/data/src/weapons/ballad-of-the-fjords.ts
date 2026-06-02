/**
 * ballad_of_the_fjords — 4★ polearm
 *
 * Faithful port of her raw DbObjectWeapon, solo-oracle-correct.
 * Source: raw/genshin_calc_pub/src/js/db/Weapon/Polearm/BalladOfTheFjords.js
 *
 * Passive: Ode to Flowers
 *   - ConditionCalcElements: party-element accumulator — INERT (handled by engine when present).
 *   - ConditionStaticRefine (gated by party_elements_count_level >= 3):
 *       mastery at R1..R5: [120, 150, 180, 210, 240]
 *       Gate: ConditionBooleanValue(setting: "party_elements_count_level", cond: "ge", value: 3)
 *       INERT in solo oracle (party_elements_count_level=0, 0 >= 3 is false → no mastery).
 *
 * Oracle passiveToggles: {} — no toggles, mastery gate is dormant in solo.
 * Fixtures confirm: r1/r5 stats.mastery=55 (base only, no passive EM); r1/r5 identical.
 */

import type { DbObjectWeapon } from "@genshin/types";
import { BalladOfTheFjordsStatTable } from "../generated/weaponStatTables.js";

export const balladOfTheFjords: DbObjectWeapon = {
  name: "ballad_of_the_fjords",
  serializeId: 151,
  gameId: 13424,
  rarity: 4,
  weapon: "polearm",
  statTable: BalladOfTheFjordsStatTable,
  conditions: [
    {
      // ConditionStaticRefine gated by party_elements_count_level >= 3.
      // INERT in solo oracle (party_elements_count_level=0).
      type: "refine",
      title: "talent_name.weapon_ballad_of_the_fjords",
      description: "talent_descr.weapon_ballad_of_the_fjords",
      refinementStats: [
        { mastery: 120 }, // R1
        { mastery: 150 }, // R2
        { mastery: 180 }, // R3
        { mastery: 210 }, // R4
        { mastery: 240 }, // R5
      ],
      condition: {
        type: "boolean-value",
        setting: "party_elements_count_level",
        cond: "ge",
        value: 3,
      },
    },
  ],
};
