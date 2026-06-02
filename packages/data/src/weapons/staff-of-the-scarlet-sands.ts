/**
 * Staff of the Scarlet Sands — 5★ Polearm (NOVEL hand-port; weapon post-effect consumer).
 *
 * "Heat Haze at Horizon's End": ATK += 52/65/78/91/104% of Elemental Mastery (always-on base), PLUS
 * after an Elemental Skill hits, ATK += 28/35/42/49/56% of EM per stack (max 3, toggle
 * `weapon_staff_of_the_scarlet_sands`). Her `PostEffectStatsMastery` with `percent` (base) +
 * `percentBonus × bonusStackSettings` (per-stack) → modelled via `ratioFromTalent` (base) +
 * `ratioPerStack` (the new per-stack additive). At 3 stacks R1: (0.52 + 0.28×3) × EM = 1.36 × EM.
 *
 * serializeId: 132. The two `text_percent` display conditions are UI-only → omitted.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Weapon/Polearm/StaffofScarletSands.js
 *   raw/genshin_calc_pub/src/js/classes/PostEffect/Stats.js (percent + percentBonus × bonusStackSettings)
 */

import type { CharPostEffect, DbObjectWeapon, TalentTable } from "@genshin/types";
import { StaffOfScarletSandsStatTable } from "../generated/weaponStatTables.js";

function refineRatioTable(values: readonly number[]): TalentTable {
  return { getValue: (refine: number): number => values[refine - 1] ?? 0 };
}

const emToAtk: CharPostEffect = {
  priority: 1,
  fromStat: "mastery",
  toStat: "atk",
  ratioFromTalent: {
    table: refineRatioTable([0.52, 0.65, 0.78, 0.91, 1.04]),
    levelSetting: "weapon_refine",
    multi: 1,
  },
  ratioPerStack: {
    setting: "weapon_staff_of_the_scarlet_sands",
    table: refineRatioTable([0.28, 0.35, 0.42, 0.49, 0.56]),
    levelSetting: "weapon_refine",
  },
};

export const staffOfTheScarletSands: DbObjectWeapon = {
  name: "staff_of_the_scarlet_sands",
  serializeId: 132,
  gameId: 13511,
  rarity: 5,
  weapon: "polearm",
  statTable: StaffOfScarletSandsStatTable,
  postEffects: [emToAtk],
};
