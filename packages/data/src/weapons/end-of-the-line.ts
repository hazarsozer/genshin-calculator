/**
 * End of the Line — 4★ Bow
 *
 * Source: raw/genshin_calc_pub/src/js/db/Weapon/Bow/EndOfTheLine.js
 *
 * Passive "Net Snapper":
 *   - Condition (ConditionStaticRefine) has ONLY a `text_percent_dmg` stat →
 *     pure UI text marker, numeric no-op → OMIT entire condition.
 *   - Proc "Trawler": deals 80/100/120/140/160% of ATK as physical damage
 *     (FeatureDamage, no element arg → physical). Refine-scaled.
 *
 * Fixture key: `weapon.trawler_dmg`
 * R1 normal: 757.9  R5 normal: 1515.7 → values differ → refine-scaled (5 values).
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Weapon/Bow/EndOfTheLine.js:8-36
 */

import type { DbObjectWeapon, Feature, TalentTable } from "@genshin/types";
import { EndOfTheLineStatTable } from "../generated/weaponStatTables.js";

function refineValueTable(values: readonly number[]): TalentTable {
  return { getValue: (refine: number): number => values[Math.min(refine, values.length) - 1] ?? 0 };
}

// "Trawler" proc: 80/100/120/140/160% of ATK, physical, no element in raw → physical.
const trawlerProc: Feature = {
  name: "trawler_dmg",
  category: "weapon",
  element: "physical",
  multipliers: [
    {
      leveling: "weapon_refine",
      values: refineValueTable([80, 100, 120, 140, 160]),
    },
  ],
};

export const endOfTheLine: DbObjectWeapon = {
  name: "end_of_the_line",
  serializeId: 130,
  gameId: 15418,
  rarity: 4,
  weapon: "bow",
  statTable: EndOfTheLineStatTable,
  features: [trawlerProc],
};
