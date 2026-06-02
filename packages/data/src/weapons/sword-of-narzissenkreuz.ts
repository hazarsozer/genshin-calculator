/**
 * Sword of Narzissenkreuz — 4★ Sword (NOVEL hand-port; weapon FeatureDamage).
 *
 * Passive "Sea of Brass":
 *   - UI text only: text_percent_dmg [160,200,240,280,320] — UI display marker, no-op in buildStats.
 *     The ConditionStaticRefine has ONLY text_* stats → entire condition dropped.
 *   - Damage proc: `sword_of_narzissenkreuz_dmg` = 160/200/240/280/320% of ATK, PHYSICAL,
 *     refine-scaled.
 *
 * Proc key: `weapon.sword_of_narzissenkreuz_dmg`. Verified scaled: R1 normal ~2032.6,
 * R5 normal ~4065.2 (320/160=2 ratio confirmed). element:"physical" mandatory (no element
 * in raw FeatureDamage).
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Weapon/Sword/SwordOfNarzissenkreuz.js
 */

import type { DbObjectWeapon, Feature, TalentTable } from "@genshin/types";
import { SwordOfNarzissenkreuzStatTable } from "../generated/weaponStatTables.js";

function refineValueTable(values: readonly number[]): TalentTable {
  return {
    getValue: (refine: number): number =>
      values[Math.min(refine, values.length) - 1] ?? 0,
  };
}

const narzissenkreuzProc: Feature = {
  name: "sword_of_narzissenkreuz_dmg",
  category: "weapon",
  element: "physical",
  multipliers: [
    {
      leveling: "weapon_refine",
      values: refineValueTable([160, 200, 240, 280, 320]),
    },
  ],
};

export const swordOfNarzissenkreuz: DbObjectWeapon = {
  name: "sword_of_narzissenkreuz",
  serializeId: 166,
  gameId: 11428,
  rarity: 4,
  weapon: "sword",
  statTable: SwordOfNarzissenkreuzStatTable,
  features: [narzissenkreuzProc],
};
