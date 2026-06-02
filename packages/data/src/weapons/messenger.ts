/**
 * Messenger — 3★ Bow
 *
 * Source: raw/genshin_calc_pub/src/js/db/Weapon/Bow/Messenger.js
 *
 * Passive "Archer's Message":
 *   - Condition (ConditionStaticRefine) has ONLY a `text_percent_dmg` stat →
 *     pure UI text marker, numeric no-op → OMIT entire condition.
 *   - Proc "Aimed shot crit hit": deals 100/125/150/175/200% of ATK as physical
 *     (FeatureDamage, no element arg → physical). Refine-scaled.
 *
 * Fixture key: `weapon.messenger_aimed_hit`
 * R1 normal: 913.4  R5 normal: 1826.9 → values differ → refine-scaled (5 values).
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Weapon/Bow/Messenger.js:8-37
 */

import type { DbObjectWeapon, Feature, TalentTable } from "@genshin/types";
import { MessengerStatTable } from "../generated/weaponStatTables.js";

function refineValueTable(values: readonly number[]): TalentTable {
  return { getValue: (refine: number): number => values[Math.min(refine, values.length) - 1] ?? 0 };
}

// Aimed hit proc: 100/125/150/175/200% of ATK, physical, no element in raw → physical.
const aimedHitProc: Feature = {
  name: "messenger_aimed_hit",
  category: "weapon",
  element: "physical",
  multipliers: [
    {
      leveling: "weapon_refine",
      values: refineValueTable([100, 125, 150, 175, 200]),
    },
  ],
};

export const messenger: DbObjectWeapon = {
  name: "messenger",
  serializeId: 29,
  gameId: 15305,
  rarity: 3,
  weapon: "bow",
  statTable: MessengerStatTable,
  features: [aimedHitProc],
};
