/**
 * astral_vultures_crimson_plumage — 5★ bow
 *
 * Faithful port of her raw DbObjectWeapon, solo-oracle-correct.
 * Source: raw/genshin_calc_pub/src/js/db/Weapon/Bow/AstralVulturesCrimsonPlumage.js
 *
 * Passive: Astral Vulture's Crimson Plumage
 *   - ConditionBooleanRefine (name: "astral_vultures_crimson_plumage", serializeId: 1):
 *       Toggle ACTIVE in oracle (passiveToggles: {astral_vultures_crimson_plumage: true}).
 *       atk_percent at R1..R5: [24, 30, 36, 42, 48]
 *   - ConditionStaticRefineCrimsonPlumage (effectLevelSetting: party_elements_different):
 *       A complex 2D party-element table gated by party_elements_different >= 1.
 *       INERT in solo oracle (party_elements_different=0).
 *       deferred to ② (party-element)
 *
 * Oracle passiveToggles: { astral_vultures_crimson_plumage: true }
 * Fixtures confirm: r1 stats.atk=2575.77 (+24% atk), r5 stats.atk=3011.11 (+48% atk).
 */

import type { DbObjectWeapon } from "@genshin/types";
import { AstralVulturesCrimsonPlumageStatTable } from "../generated/weaponStatTables.js";

export const astralVulturesCrimsonPlumage: DbObjectWeapon = {
  name: "astral_vultures_crimson_plumage",
  serializeId: 190,
  gameId: 15514,
  rarity: 5,
  weapon: "bow",
  statTable: AstralVulturesCrimsonPlumageStatTable,
  conditions: [
    {
      type: "boolean-refine",
      name: "astral_vultures_crimson_plumage",
      serializeId: 1,
      title: "talent_name.astral_vultures_crimson_plumage",
      description: "talent_descr.astral_vultures_crimson_plumage_1",
      refinementStats: [
        { atk_percent: 24 }, // R1
        { atk_percent: 30 }, // R2
        { atk_percent: 36 }, // R3
        { atk_percent: 42 }, // R4
        { atk_percent: 48 }, // R5
      ],
    },
    // ConditionStaticRefineCrimsonPlumage (effectLevelSetting: party_elements_different):
    // Complex 2D table (charged/burst dmg per party_elements_different tier) — INERT in solo.
    // deferred to ② (party-element)
  ],
};
