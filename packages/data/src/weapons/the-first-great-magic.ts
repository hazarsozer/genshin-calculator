/**
 * the_first_great_magic — 5★ bow
 *
 * Faithful port of her raw DbObjectWeapon.
 * Source: raw/genshin_calc_pub/src/js/db/Weapon/Bow/TheFirstGreatMagic.js
 *
 * Passive: The First Great Magic
 *   - ConditionStaticRefine #1 (always-on):
 *       dmg_charged at R1..R5: [16, 20, 24, 28, 32]
 *   - ConditionStaticRefineFirstMagic (effectLevelSetting: party_elements_same_inc):
 *       level = min(3, party_elements_same_inc). Picks one of three atk_percent tiers:
 *         tier 1 (same_inc==1): [16, 20, 24, 28, 32]
 *         tier 2 (same_inc==2): [32, 40, 48, 56, 64]
 *         tier 3 (same_inc>=3): [48, 60, 72, 84, 96]
 *       Tiers are MUTUALLY EXCLUSIVE (pick, not add). In solo: same_inc=1 → tier-1.
 *       Source: raw/.../Condition/Static/Refine/FirstMagic.js:6 (getValue(level) picks tier).
 *   - ConditionStaticRefineFirstMagic #2 (effectLevelSetting: party_elements_different):
 *       Only carries move_speed (display-only), not emitted. INERT (solo: different=0).
 *
 * Oracle passiveToggles: {} (always-on only)
 * Fixtures confirm: r1 stats.atk=2430.66 (+16% atk at solo same_inc=1).
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
    // ConditionStaticRefineFirstMagic: tier 1 (same_inc < 2 — covers solo where the key is absent).
    // Her engine always emits same_inc >= 1 (solo → same + 1 = 0 + 1 = 1); our engine leaves
    // the key absent when no party is provided (reads 0 via BooleanValue). Both cases must fire
    // tier-1. Gate: NOT (same_inc >= 2) — true when key is absent (0 < 2) AND when same_inc == 1.
    // Source: raw/.../Condition/Static/Refine/FirstMagic.js:6, atk_table_1 = [16,20,24,28,32]
    {
      type: "refine",
      title: "talent_name.weapon_the_first_great_magic_2",
      description: "talent_descr.weapon_the_first_great_magic_2",
      condition: {
        type: "not",
        items: [{ type: "boolean-value", setting: "party_elements_same_inc", cond: "ge", value: 2 }],
      },
      refinementStats: [
        { atk_percent: 16 }, // R1
        { atk_percent: 20 }, // R2
        { atk_percent: 24 }, // R3
        { atk_percent: 28 }, // R4
        { atk_percent: 32 }, // R5
      ],
    },
    // ConditionStaticRefineFirstMagic: tier 2 (same_inc == 2).
    // Active when party_elements_same_inc >= 2 AND < 3.
    // Source: raw/.../Condition/Static/Refine/FirstMagic.js:6, atk_table_2 = [32,40,48,56,64]
    {
      type: "refine",
      title: "talent_name.weapon_the_first_great_magic_2",
      description: "talent_descr.weapon_the_first_great_magic_2",
      condition: {
        type: "and",
        items: [
          { type: "boolean-value", setting: "party_elements_same_inc", cond: "ge", value: 2 },
          { type: "not", items: [{ type: "boolean-value", setting: "party_elements_same_inc", cond: "ge", value: 3 }] },
        ],
      },
      refinementStats: [
        { atk_percent: 32 }, // R1
        { atk_percent: 40 }, // R2
        { atk_percent: 48 }, // R3
        { atk_percent: 56 }, // R4
        { atk_percent: 64 }, // R5
      ],
    },
    // ConditionStaticRefineFirstMagic: tier 3 (same_inc >= 3, capped at 3 by min(3, level)).
    // Active when party_elements_same_inc >= 3.
    // Source: raw/.../Condition/Static/Refine/FirstMagic.js:6, atk_table_3 = [48,60,72,84,96]
    {
      type: "refine",
      title: "talent_name.weapon_the_first_great_magic_2",
      description: "talent_descr.weapon_the_first_great_magic_2",
      condition: { type: "boolean-value", setting: "party_elements_same_inc", cond: "ge", value: 3 },
      refinementStats: [
        { atk_percent: 48 }, // R1
        { atk_percent: 60 }, // R2
        { atk_percent: 72 }, // R3
        { atk_percent: 84 }, // R4
        { atk_percent: 96 }, // R5
      ],
    },
    // ConditionStaticRefineFirstMagic #2 (effectLevelSetting: party_elements_different):
    // Only carries move_speed (display-only), not emitted. INERT in solo (different=0).
  ],
};
