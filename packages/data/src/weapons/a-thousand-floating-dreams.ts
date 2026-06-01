/**
 * a_thousand_floating_dreams — 5★ catalyst
 *
 * Faithful port of her raw DbObjectWeapon, solo-oracle-correct.
 * Source: raw/genshin_calc_pub/src/js/db/Weapon/Catalyst/ThousandFloatingDreams.js
 *
 * Passive: A Thousand Nights' Dawnsong
 *   - ConditionStatic (display-only title/description with no stats) — OMITTED (no emit).
 *   - ConditionStaticRefineDreamsSame (gated by party_elements_same > 0):
 *       Reads party_elements_same as stack count (0-3); multiplies per-stack mastery.
 *       Modelled as stacks (name: "party_elements_same", maxStacks: 3).
 *       INERT in solo oracle (party_elements_same=0 → 0 stacks, no mastery).
 *       mastery per stack at R1..R5: [32, 40, 48, 56, 64]
 *   - ConditionStaticRefineDreamsOther (gated by party_elements_different > 0):
 *       Reads party_elements_different as stack count (0-3); multiplies per-stack dmg_own.
 *       Modelled as stacks (name: "party_elements_different", maxStacks: 3).
 *       INERT in solo oracle (party_elements_different=0 → 0 stacks, no dmg_own).
 *       dmg_own per stack at R1..R5: [10, 14, 18, 22, 26]
 *
 * Oracle passiveToggles: {} — both stacks dormant in solo.
 * Fixtures confirm: r1/r5 stats.mastery=434.81 (weapon substat only, no passive EM bonus);
 * r1/r5 are identical (no passive effect from either condition).
 */

import type { DbObjectWeapon } from "@genshin/types";
import { ThousandFloatingDreamsStatTable } from "../generated/weaponStatTables.js";

export const aThousandFloatingDreams: DbObjectWeapon = {
  name: "a_thousand_floating_dreams",
  serializeId: 138,
  gameId: 14511,
  rarity: 5,
  weapon: "catalyst",
  statTable: ThousandFloatingDreamsStatTable,
  conditions: [
    // ConditionStatic (title/description only, no stats) — omitted.
    {
      // ConditionStaticRefineDreamsSame: reads party_elements_same as stack count.
      // INERT in solo oracle (party_elements_same=0).
      type: "stacks",
      name: "party_elements_same",
      serializeId: 1,
      title: "talent_name.weapon_thousand_floating_dreams",
      description: "talent_descr.weapon_thousand_floating_dreams_same",
      maxStacks: 3,
      refinementStats: [
        { mastery: 32 }, // R1
        { mastery: 40 }, // R2
        { mastery: 48 }, // R3
        { mastery: 56 }, // R4
        { mastery: 64 }, // R5
      ],
    },
    {
      // ConditionStaticRefineDreamsOther: reads party_elements_different as stack count.
      // INERT in solo oracle (party_elements_different=0).
      type: "stacks",
      name: "party_elements_different",
      serializeId: 2,
      title: "talent_name.weapon_thousand_floating_dreams",
      description: "talent_descr.weapon_thousand_floating_dreams_other",
      maxStacks: 3,
      refinementStats: [
        { dmg_own: 10 }, // R1
        { dmg_own: 14 }, // R2
        { dmg_own: 18 }, // R3
        { dmg_own: 22 }, // R4
        { dmg_own: 26 }, // R5
      ],
    },
  ],
};
