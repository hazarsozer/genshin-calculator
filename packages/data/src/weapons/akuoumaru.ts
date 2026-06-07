/**
 * Akuoumaru — 4★ Claymore (NOVEL hand-port; weapon post-effect consumer).
 *
 * "Watatsumi Wavewalker": Elemental Burst DMG += 0.12/0.15/0.18/0.21/0.24% of the party's
 * combined Max Energy, capped at 40/50/60/70/80% (refine-scaled). A `PostEffectPartyEnergy`
 * (energy → dmg_burst) — the reason this is a hand-port.
 *
 * Base = `burst_energy_cost + party_burst_energy_cost` (her PartyEnergy.getBaseValueTree) —
 * modelled with `fromStat: "burst_energy_cost"` (the wielder's own term, e.g. Eula = 80) +
 * `fromStatAddend: "party_burst_energy_cost"` (the party-summed teammate energy, emitted by
 * buildPartyBuffs per Char.js:74-82). Both raw energy integers → summed before ratio/cap, no fold.
 * In a SOLO build `party_burst_energy_cost` is 0, so the base is the wielder's own cost alone. The
 * cap is refine-scaled → `capValueFromTalent`.
 *
 * serializeId: 113. The `text_percent_bonus`/`text_percent_cap` markers are UI-only → omitted.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Weapon/Claymore/Akoumaru.js
 *   raw/genshin_calc_pub/src/js/classes/PostEffect/Stats/PartyEnergy.js (base = burst_energy_cost + party_burst_energy_cost)
 */

import type { CharPostEffect, DbObjectWeapon, TalentTable } from "@genshin/types";
import { AkuoumaruStatTable } from "../generated/weaponStatTables.js";

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

export const akuoumaru: DbObjectWeapon = {
  name: "akuoumaru",
  serializeId: 113,
  gameId: 12416,
  rarity: 4,
  weapon: "claymore",
  statTable: AkuoumaruStatTable,
  postEffects: [energyToBurst],
};
