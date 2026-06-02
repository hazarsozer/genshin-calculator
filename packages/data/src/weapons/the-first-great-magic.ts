/**
 * the_first_great_magic — 5★ bow
 *
 * Faithful port of her raw DbObjectWeapon, solo-oracle-correct.
 * Source: raw/genshin_calc_pub/src/js/db/Weapon/Bow/TheFirstGreatMagic.js
 *
 * Passive: The First Great Magic
 *   - ConditionStaticRefine #1 (always-on):
 *       dmg_charged at R1..R5: [16, 20, 24, 28, 32]
 *   - ConditionStaticRefineFirstMagic #1 (effectLevelSetting: party_elements_same_inc):
 *       In solo oracle, party_elements_same_inc reads as 1 → tier-1 atk_percent always active.
 *       Modelled as plain always-on refine (solo-correct):
 *       atk_percent at R1..R5: [16, 20, 24, 28, 32]
 *   - ConditionStaticRefineFirstMagic #2 (effectLevelSetting: party_elements_different):
 *       Only carries move_speed (display-only) and is gated by party_elements_different >= 1.
 *       INERT in solo oracle + move_speed not emitted — deferred to ② (party-element).
 *
 * Oracle passiveToggles: {} (always-on only)
 * Fixtures confirm: r1 stats.atk=2430.66 (+16% atk), r5 stats.atk=2720.89 (+32% atk).
 */

import type { DbObjectWeapon } from "@genshin/types";
import { TheFirstGreatMagicStatTable } from "../generated/weaponStatTables.js";

export const theFirstGreatMagic: DbObjectWeapon = {
  name: "the_first_great_magic",
  serializeId: 157,
  gameId: 15512,
  rarity: 5,
  weapon: "bow",
  statTable: TheFirstGreatMagicStatTable,
  conditions: [
    {
      type: "refine",
      title: "talent_name.weapon_the_first_great_magic_1",
      description: "talent_descr.weapon_the_first_great_magic_1",
      refinementStats: [
        { dmg_charged: 16 }, // R1
        { dmg_charged: 20 }, // R2
        { dmg_charged: 24 }, // R3
        { dmg_charged: 28 }, // R4
        { dmg_charged: 32 }, // R5
      ],
    },
    {
      // ConditionStaticRefineFirstMagic tier-1 (party_elements_same_inc=1 in solo → always active).
      // Tier-2 and tier-3 (atk_table_2/3) require same_inc >= 2/3 — INERT in solo.
      // Full party-tier logic deferred to ② (party-element).
      type: "refine",
      title: "talent_name.weapon_the_first_great_magic_2",
      description: "talent_descr.weapon_the_first_great_magic_2",
      refinementStats: [
        { atk_percent: 16 }, // R1
        { atk_percent: 20 }, // R2
        { atk_percent: 24 }, // R3
        { atk_percent: 28 }, // R4
        { atk_percent: 32 }, // R5
      ],
    },
    // ConditionStaticRefineFirstMagic #2 (effectLevelSetting: party_elements_different):
    // INERT in solo (party_elements_different=0) + only carries move_speed (display-only).
    // deferred to ② (party-element)
  ],
};
