/**
 * Fillet Blade — 3★ Sword (NOVEL hand-port; weapon FeatureDamage).
 *
 * Passive: "Edge of Sword-Mowing":
 *   - UI text only: text_percent_dmg [240,280,320,360,400] — UI display marker, no-op in buildStats.
 *     The ConditionStaticRefine has ONLY text_* stats → entire condition dropped.
 *   - Damage proc: `weapon_additional_dmg` = 240/280/320/360/400% of ATK, PHYSICAL, refine-scaled.
 *
 * Proc key: `weapon.weapon_additional_dmg`. Verified scaled: R1 normal ~2744.7, R5 normal ~4574.5
 * (400/240 ≈ 1.667 ratio confirmed). element:"physical" mandatory (no element in raw FeatureDamage).
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Weapon/Sword/FilletBlade.js
 */

import type { DbObjectWeapon, Feature, TalentTable } from "@genshin/types";
import { FilletBladeStatTable } from "../generated/weaponStatTables.js";

function refineValueTable(values: readonly number[]): TalentTable {
  return {
    getValue: (refine: number): number =>
      values[Math.min(refine, values.length) - 1] ?? 0,
  };
}

const filletBladeProcFeature: Feature = {
  name: "weapon_additional_dmg",
  category: "weapon",
  element: "physical",
  multipliers: [
    {
      leveling: "weapon_refine",
      values: refineValueTable([240, 280, 320, 360, 400]),
    },
  ],
};

export const filletBlade: DbObjectWeapon = {
  name: "fillet_blade",
  serializeId: 9,
  gameId: 11305,
  rarity: 3,
  weapon: "sword",
  statTable: FilletBladeStatTable,
  features: [filletBladeProcFeature],
};
