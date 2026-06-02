/**
 * A Thousand Blazing Suns — 5★ Claymore (NOVEL hand-port; nightsoul char-attribute gate).
 *
 * Passive "Tectonic Awakening":
 *   1. `common.nightsoul_blessing_state` boolean toggle (UI gate for nightsoul state),
 *      gated by ConditionBooleanNightSoul (char_origin === "natlan").
 *      Eula (Mondstadt) → INERT (nightsoul gate fails → toggle is never surfaced).
 *   2. Main buff (boolean-refine toggle): CritDMG and ATK% at each refine rank.
 *      Raw values (StatTable R1..R5): crit_dmg: [20,25,30,35,40], atk_percent: [28,37,42,49,56].
 *      NOTE: R2/R4 atk_percent values are irregular (37, 49 — not uniform increments).
 *      This condition is NOT gated by nightsoul — ANY character can toggle it on.
 *      Fixture eula R1: crit_dmg +20 → total 158.4 (138.4+20) ✓; R5: +40 → 178.4 ✓.
 *      ACTIVE for eula rep when the user enables the toggle.
 *   3. NightSoul additive block (ConditionStaticRefine): additional CritDMG + ATK% at
 *      NightSoulRatio=0.75 of the main buff values, gated by [nightsoul AND
 *      common.nightsoul_blessing_state AND main-buff toggle]. INERT for eula.
 *      Raw values: crit_dmg × 0.75 = [15,18.75,22.5,26.25,30];
 *                  atk_percent × 0.75 = [21,27.75,31.5,36.75,42].
 *      NOTE: does NOT use dmg_own (contrary to some community notes).
 *      // nightsoul additive — deferred to ② (inert for eula rep)
 *
 * serializeId: 193.
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Weapon/Claymore/AThousandBlazingSuns.js
 *   raw/genshin_calc_pub/src/js/classes/Condition/Boolean/NightSoul.js
 */

import type { DbObjectWeapon } from "@genshin/types";
import { AThousandBlazingSunsStatTable } from "../generated/weaponStatTables.js";

export const aThousandBlazingSuns: DbObjectWeapon = {
  name: "a_thousand_blazing_suns",
  serializeId: 193,
  gameId: 12514,
  rarity: 5,
  weapon: "claymore",
  statTable: AThousandBlazingSunsStatTable,
  conditions: [
    // NightSoul blessing state toggle — gated on char_origin === "natlan".
    // Eula (Mondstadt) → INERT (nightsoul gate fails).
    {
      type: "boolean",
      name: "common.nightsoul_blessing_state",
      serializeId: 1,
      title: "talent_name.nightsoul_blessing_state",
      condition: { type: "nightsoul" },
    },
    // Main buff (user toggle): CritDMG + ATK% by refine. ACTIVE for any character.
    // R2 atk_percent=37, R4 atk_percent=49 are irregular (confirmed from raw StatTable).
    {
      type: "boolean-refine",
      name: "weapon_a_thousand_blazing_suns",
      serializeId: 2,
      title: "talent_name.weapon_a_thousand_blazing_suns",
      description: "talent_descr.weapon_a_thousand_blazing_suns_1",
      refinementStats: [
        { crit_dmg: 20, atk_percent: 28 }, // R1
        { crit_dmg: 25, atk_percent: 37 }, // R2
        { crit_dmg: 30, atk_percent: 42 }, // R3
        { crit_dmg: 35, atk_percent: 49 }, // R4
        { crit_dmg: 40, atk_percent: 56 }, // R5
      ],
    },
    // nightsoul additive — deferred to ② (INERT for eula rep; Mondstadt char_origin ≠ natlan)
    // Raw ConditionStaticRefine gated by [nightsoul, common.nightsoul_blessing_state,
    // weapon_a_thousand_blazing_suns]; values = main buff × 0.75.
    // crit_dmg: [15, 18.75, 22.5, 26.25, 30]; atk_percent: [21, 27.75, 31.5, 36.75, 42].
  ],
};
