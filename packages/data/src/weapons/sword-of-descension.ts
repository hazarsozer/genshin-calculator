/**
 * Sword of Descension — 4★ Sword (NOVEL hand-port; ConditionBooleanChar + FeatureDamage).
 *
 * Passive "Descension":
 *   1. `common.ps_network` boolean toggle (PlayStation-network gate).
 *   2. +66 ATK (ConditionStatic): active ONLY when char is a Traveler variant AND ps_network on.
 *      Rep is Keqing (not Traveler) → INERT. Raw char list (transcribed verbatim from raw,
 *      including the "taveler_dendro" typo): traveler_anemo, traveler_geo, traveler_electro,
 *      taveler_dendro, traveler_hydro, traveler_pyro, traveler_cryo.
 *   3. FeatureDamage "Descension" proc: 200% ATK physical hit.
 *      Constant 200 across ALL refines (raw: `StatTable('sword_of_descension_dmg', [200])` —
 *      single-value array, `getValue(weapon_refine)` always returns 200).
 *      Gated by ps_network. In the oracle Keqing fixture this IS produced (ps_network presumed
 *      on in the oracle: fixture contains `weapon.sword_of_descension_dmg` key). Element is
 *      physical (raw FeatureDamage `element: 'phys'` → our wrapper uses "physical").
 *      Category "weapon" → feature key `weapon.sword_of_descension_dmg`.
 *
 * The second ConditionStatic in raw carries only `text_percent_chance`/`text_percent_dmg`
 * (UI display markers, no-ops in buildStats) → OMITTED per brief.
 *
 * Fixture: keqing → `weapon.sword_of_descension_dmg` present; +66 ATK INERT (not Traveler).
 *
 * serializeId: 21.
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Weapon/Sword/SwordofDescension.js
 *   raw/genshin_calc_pub/src/js/classes/Feature2/Damage.js (element default 'phys' → "physical")
 */

import type { DbObjectWeapon, Feature, TalentTable } from "@genshin/types";
import { SwordofDescensionStatTable } from "../generated/weaponStatTables.js";

/** Constant multiplier — 200% across all refines (single-value StatTable). */
const constantTable: TalentTable = { getValue: (): number => 200 };

// "Descension" AoE proc: 200% ATK, physical, no refine scaling.
// Gated by ps_network toggle. Category "weapon" → key `weapon.sword_of_descension_dmg`.
const descensionProc: Feature = {
  name: "sword_of_descension_dmg",
  category: "weapon",
  element: "physical",
  multipliers: [
    {
      leveling: "weapon_refine",
      values: constantTable,
    },
  ],
  condition: { type: "boolean", name: "common.ps_network" },
};

export const swordOfDescension: DbObjectWeapon = {
  name: "sword_of_descension",
  serializeId: 21,
  gameId: 11412,
  rarity: 4,
  weapon: "sword",
  statTable: SwordofDescensionStatTable,
  conditions: [
    // PlayStation-network gate toggle.
    {
      type: "boolean",
      name: "common.ps_network",
      serializeId: 1,
      title: "talent_name.ps_network",
      description: "talent_descr.ps_network",
    },
    // +66 ATK: Traveler variants only (AND ps_network on).
    // Raw typo preserved verbatim: "taveler_dendro" (not "traveler_dendro").
    // Keqing rep (not Traveler) → INERT.
    {
      type: "static",
      title: "talent_name.sword_of_descension",
      description: "talent_descr.sword_of_descension_1",
      stats: { atk: 66 },
      condition: {
        type: "and",
        items: [
          {
            type: "boolean-char",
            chars: [
              "traveler_anemo",
              "traveler_geo",
              "traveler_electro",
              "taveler_dendro", // raw typo: "taveler" (preserved exactly)
              "traveler_hydro",
              "traveler_pyro",
              "traveler_cryo",
            ],
          },
          { type: "boolean", name: "common.ps_network" },
        ],
      },
    },
    // Second raw ConditionStatic carries only text_percent_chance/text_percent_dmg (UI display
    // markers — no-ops in buildStats). OMITTED per brief.
  ],
  features: [descensionProc],
};
