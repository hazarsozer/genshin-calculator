/**
 * Wavebreaker's Fin — 4★ Polearm (NOVEL hand-port; weapon post-effect consumer).
 *
 * Identical "Watatsumi Wavewalker" mechanic to Akuoumaru / Mouun's Moon: Elemental Burst DMG +=
 * 0.12/0.15/0.18/0.21/0.24% of the party's combined Max Energy, capped at 40/50/60/70/80%
 * (refine-scaled). `PostEffectPartyEnergy` → base = `fromStat: "burst_energy_cost"` (wielder) +
 * `fromStatAddend: "party_burst_energy_cost"` (party-summed teammate energy, buildPartyBuffs) →
 * `dmg_burst`, refine-scaled cap via `capValueFromTalent`. Both raw energy ints, no fold.
 *
 * serializeId: 115. UI markers omitted. Sources: raw/.../Weapon/Polearm/WavebreakersFin.js,
 *   raw/.../classes/PostEffect/Stats/PartyEnergy.js.
 */

import type { CharPostEffect, DbObjectWeapon, TalentTable } from "@genshin/types";
import { WavebreakersFinStatTable } from "../generated/weaponStatTables.js";

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

export const wavebreakersFin: DbObjectWeapon = {
  name: "wavebreakers_fin",
  serializeId: 115,
  gameId: 13416,
  rarity: 4,
  weapon: "polearm",
  statTable: WavebreakersFinStatTable,
  postEffects: [energyToBurst],
};
