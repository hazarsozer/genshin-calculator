/**
 * Kagotsurube Isshin — 4★ Sword (NOVEL hand-port; weapon FeatureDamage).
 *
 * Passive "Isshin Art Clarity" (ConditionBooleanRefine):
 *   - text_percent (UI-only display marker) — dropped.
 *   - atk_percent: +15% ATK, constant across all refinements (raw StatTable('atk_percent', [15])
 *     — single value, clamps to 15 at R1..R5 → identical bags across refinementStats).
 *   - Damage proc: `kagotsurube_isshin_dmg` = 180% of ATK, CONSTANT (raw StatTable had [180],
 *     one value → refineValueTable([180]) clamps correctly at all refinement levels).
 *
 * Proc key: `weapon.kagotsurube_isshin_dmg`. Verified CONSTANT: R1 and R5 fixture normal values
 * are both ~2501.9 — identical, confirming the single-value StatTable.
 * element:"physical" mandatory (no element in raw FeatureDamage).
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Weapon/Sword/KagotsurubeIsshin.js
 */

import type {
  ConditionBooleanRefine,
  DbObjectWeapon,
  Feature,
  TalentTable,
} from "@genshin/types";
import { KagotsurubeIsshinStatTable } from "../generated/weaponStatTables.js";

function refineValueTable(values: readonly number[]): TalentTable {
  return {
    getValue: (refine: number): number =>
      values[Math.min(refine, values.length) - 1] ?? 0,
  };
}

// ConditionBooleanRefine: toggle passive, ATK +15% constant across all refinements.
// text_percent stat omitted (UI display marker, no-op in buildStats).
const atkToggle: ConditionBooleanRefine = {
  type: "boolean-refine",
  name: "weapon_kagotsurube_isshin",
  serializeId: 1,
  title: "talent_name.weapon_kagotsurube_isshin",
  description: "talent_descr.weapon_kagotsurube_isshin",
  refinementStats: [
    { atk_percent: 15 }, // R1
    { atk_percent: 15 }, // R2
    { atk_percent: 15 }, // R3
    { atk_percent: 15 }, // R4
    { atk_percent: 15 }, // R5
  ],
};

// Constant proc — raw StatTable('kagotsurube_isshin_dmg', [180]) → single value.
const kagotsurubeProc: Feature = {
  name: "kagotsurube_isshin_dmg",
  category: "weapon",
  element: "physical",
  multipliers: [
    {
      leveling: "weapon_refine",
      values: refineValueTable([180]),
    },
  ],
};

export const kagotsurubeIsshin: DbObjectWeapon = {
  name: "kagotsurube_isshin",
  serializeId: 124,
  gameId: 11416,
  rarity: 4,
  weapon: "sword",
  statTable: KagotsurubeIsshinStatTable,
  conditions: [atkToggle],
  features: [kagotsurubeProc],
};
