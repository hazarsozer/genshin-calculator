/**
 * The Flute — 4★ Sword (NOVEL hand-port; weapon FeatureDamage).
 *
 * Passive: "Chord":
 *   - UI text only: text_percent_dmg [100,125,150,175,200] — UI display marker, no-op in buildStats.
 *     The ConditionStaticRefine has ONLY text_* stats → entire condition dropped.
 *   - Damage proc: `flute_aoe` = 100/125/150/175/200% of ATK, PHYSICAL, refine-scaled.
 *
 * Proc key: `weapon.flute_aoe`. Verified scaled: R1 normal ~1270.4, R5 normal ~2540.7
 * (200/100=2 ratio confirmed). element:"physical" mandatory (no element in raw FeatureDamage).
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Weapon/Sword/Flute.js
 */

import type { DbObjectWeapon, Feature, TalentTable } from "@genshin/types";
import { FluteStatTable } from "../generated/weaponStatTables.js";

function refineValueTable(values: readonly number[]): TalentTable {
  return {
    getValue: (refine: number): number =>
      values[Math.min(refine, values.length) - 1] ?? 0,
  };
}

const fluteAoeProc: Feature = {
  name: "flute_aoe",
  category: "weapon",
  element: "physical",
  multipliers: [
    {
      leveling: "weapon_refine",
      values: refineValueTable([100, 125, 150, 175, 200]),
    },
  ],
};

export const theFlute: DbObjectWeapon = {
  name: "the_flute",
  serializeId: 10,
  gameId: 11402,
  rarity: 4,
  weapon: "sword",
  statTable: FluteStatTable,
  features: [fluteAoeProc],
};
