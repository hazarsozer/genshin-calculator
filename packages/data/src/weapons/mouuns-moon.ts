/**
 * Mouun's Moon — 4★ Bow (NOVEL hand-port; weapon post-effect consumer).
 *
 * Identical "Watatsumi Wavewalker" mechanic to Akuoumaru: Elemental Burst DMG +=
 * 0.12/0.15/0.18/0.21/0.24% of the party's combined Max Energy, capped at 40/50/60/70/80%
 * (refine-scaled). `PostEffectPartyEnergy` → base = `fromStat: "burst_energy_cost"` (wielder) +
 * `fromStatAddend: "party_burst_energy_cost"` (party-summed teammate energy, buildPartyBuffs) →
 * `dmg_burst`, refine-scaled cap via `capValueFromTalent`. Both raw energy ints, no fold.
 *
 * serializeId: 114. UI markers omitted. Sources: raw/.../Weapon/Bow/MouunsMoon.js,
 *   raw/.../classes/PostEffect/Stats/PartyEnergy.js.
 */

import type { CharPostEffect, DbObjectWeapon, TalentTable } from "@genshin/types";
import { MouunsMoonStatTable } from "../generated/weaponStatTables.js";

function refineRatioTable(values: readonly number[]): TalentTable {
  return { getValue: (refine: number): number => values[refine - 1] ?? 0 };
}

const energyToBurst: CharPostEffect = {
  priority: 1,
  fromStat: "burst_energy_cost",
  fromStatAddend: "party_burst_energy_cost",
  toStat: "dmg_burst",
  ratioFromTalent: {
    table: refineRatioTable([0.12, 0.15, 0.18, 0.21, 0.24]),
    levelSetting: "weapon_refine",
    multi: 1,
  },
  capValueFromTalent: {
    table: refineRatioTable([40, 50, 60, 70, 80]),
    levelSetting: "weapon_refine",
  },
};

export const mouunsMoon: DbObjectWeapon = {
  name: "mouuns_moon",
  serializeId: 114,
  gameId: 15416,
  rarity: 4,
  weapon: "bow",
  statTable: MouunsMoonStatTable,
  postEffects: [energyToBurst],
};
