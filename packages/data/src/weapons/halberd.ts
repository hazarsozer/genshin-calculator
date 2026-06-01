/**
 * Halberd — 3★ Polearm (NOVEL hand-port; weapon FeatureDamage).
 *
 * Passive: "Heavy":
 *   - UI text only: text_percent_dmg [160,200,240,280,320] — UI display marker, no-op in buildStats.
 *     The ConditionStaticRefine has ONLY text_* stats → entire condition dropped.
 *   - Damage proc: `halberd_dmg` = 160/200/240/280/320% of ATK, PHYSICAL, refine-scaled.
 *
 * Proc key: `weapon.halberd_dmg`. Verified scaled: R1 normal ~1510.1, R5 normal ~3020.3 (2× ratio
 * matches 320/160=2). element:"physical" mandatory (no element in raw FeatureDamage).
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Weapon/Polearm/Halberd.js
 */

import type { DbObjectWeapon, Feature, TalentTable } from "@genshin/types";
import { HalberdStatTable } from "../generated/weaponStatTables.js";

function refineValueTable(values: readonly number[]): TalentTable {
  return {
    getValue: (refine: number): number =>
      values[Math.min(refine, values.length) - 1] ?? 0,
  };
}

const halberdProc: Feature = {
  name: "halberd_dmg",
  category: "weapon",
  element: "physical",
  multipliers: [
    {
      leveling: "weapon_refine",
      values: refineValueTable([160, 200, 240, 280, 320]),
    },
  ],
};

export const halberd: DbObjectWeapon = {
  name: "halberd",
  serializeId: 83,
  gameId: 13302,
  rarity: 3,
  weapon: "polearm",
  statTable: HalberdStatTable,
  features: [halberdProc],
};
