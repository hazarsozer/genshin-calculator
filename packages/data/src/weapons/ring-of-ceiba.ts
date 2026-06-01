/**
 * Ring of Yaxche (raw `ring_of_ceiba`) — 4★ Catalyst (NOVEL hand-port; weapon post-effect consumer).
 *
 * Passive: while the toggle is active, Normal Attack DMG += 0.06/0.07/0.08/0.09/0.10% of Max HP,
 * capped at 16/20/24/28/32% (refine-scaled). A `PostEffectStatsHP` HP→`dmg_normal` fold — the reason
 * this is a hand-port. The ratio is already a fraction in raw (0.0006…0.001 → makeStatTotalItem,
 * ×HP, emitted as a RAW PERCENT into the `dmg_normal` bonus bag, ÷100 at emit).
 *
 * The refine-scaled cap (16/20/24/28/32% per refine) BINDS for the rep (Klee's HP_total ≈ 33234 →
 * 0.0006×HP = 19.94% > 16% at R1, 0.001×HP = 33.23% > 32% at R5), so it is modelled via the
 * refine-indexed `capValueFromTalent` (her `statCap: StatTable('', [16,20,24,28,32])` keyed off
 * `weapon_refine`).
 *
 * serializeId: 180. The `text_percent`/`text_percent_max` markers are UI-only → omitted.
 *
 * Sources: raw/.../Weapon/Catalyst/RingofCeiba.js, raw/.../classes/PostEffect/Stats/HP.js.
 */

import type { CharPostEffect, DbObjectWeapon, TalentTable } from "@genshin/types";
import { RingOfCeibaStatTable } from "../generated/weaponStatTables.js";

function refineRatioTable(fractions: readonly number[]): TalentTable {
  return { getValue: (refine: number): number => fractions[refine - 1] ?? 0 };
}

const hpToNormalDmg: CharPostEffect = {
  priority: 1,
  fromStat: "hp",
  toStat: "dmg_normal",
  ratioFromTalent: {
    table: refineRatioTable([0.0006, 0.0007, 0.0008, 0.0009, 0.001]),
    levelSetting: "weapon_refine",
    multi: 1,
  },
  capValueFromTalent: {
    table: refineRatioTable([16, 20, 24, 28, 32]),
    levelSetting: "weapon_refine",
  },
  conditions: [{ type: "boolean", name: "weapon_ring_of_ceiba" }],
};

export const ringOfCeiba: DbObjectWeapon = {
  name: "ring_of_ceiba",
  serializeId: 180,
  gameId: 14431,
  rarity: 4,
  weapon: "catalyst",
  statTable: RingOfCeibaStatTable,
  postEffects: [hpToNormalDmg],
};
