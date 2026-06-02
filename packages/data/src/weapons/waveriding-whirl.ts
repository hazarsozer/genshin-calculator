/**
 * waveriding_whirl — 4★ catalyst
 *
 * Faithful port of her raw DbObjectWeapon, solo-oracle-correct.
 * Source: raw/genshin_calc_pub/src/js/db/Weapon/Catalyst/WaveridingWhirl.js
 *
 * Passive: Waveriding Whirl
 *   - ConditionStaticRefine (display-only "text_percent: [15]"):
 *       Carries only text_percent — display-only, no buildStats emit. OMITTED.
 *   - ConditionBooleanRefine (name: "waveriding_whirl", serializeId: 1):
 *       Toggle ACTIVE in oracle (passiveToggles: {waveriding_whirl: true}).
 *       hp_percent at R1..R5: [20, 25, 30, 35, 40]
 *   - ConditionStaticRefineWaveridingWhirl (effectLevelSetting: party_elements_different):
 *       Hydro-count gated 2D hp_percent table — INERT in solo (Hu Tao is pyro, no hydro party).
 *       deferred to ② (party-element)
 *
 * Oracle passiveToggles: { waveriding_whirl: true }
 * Fixtures confirm: r1 stats.hp=34533.97 (+20% hp), r5 stats.hp=40289.63 (+40% hp);
 * stats.atk identical r1/r5 (no atk modifier from conditions), confirming hp-only change.
 */

import type { DbObjectWeapon } from "@genshin/types";
import { WaveridingWhirlStatTable } from "../generated/weaponStatTables.js";

export const waveridingWhirl: DbObjectWeapon = {
  name: "waveriding_whirl",
  serializeId: 192,
  gameId: 14430,
  rarity: 4,
  weapon: "catalyst",
  statTable: WaveridingWhirlStatTable,
  conditions: [
    {
      // ConditionStaticRefine: carries text_percent only (display-only) — omitted.
      // ConditionBooleanRefine: toggle ACTIVE in oracle.
      type: "boolean-refine",
      name: "waveriding_whirl",
      serializeId: 1,
      title: "talent_name.waveriding_whirl",
      description: "talent_descr.waveriding_whirl_2",
      refinementStats: [
        { hp_percent: 20 }, // R1
        { hp_percent: 25 }, // R2
        { hp_percent: 30 }, // R3
        { hp_percent: 35 }, // R4
        { hp_percent: 40 }, // R5
      ],
    },
    // ConditionStaticRefineWaveridingWhirl (effectLevelSetting: party_elements_different):
    // Hydro-count gated hp_percent 2D table — INERT in solo oracle.
    // deferred to ② (party-element)
  ],
};
