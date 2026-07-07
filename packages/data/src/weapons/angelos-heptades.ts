/**
 * Angelos' Heptades — 5★ catalyst (v6.6, live port)
 *
 * Sub-stat: ATK% (3.6% base → 7.2% at L90A6).
 * Passive "Crown of the Final Scion":
 *   (a) ALWAYS-ON: ATK +12% (R1..R5: 12/15/18/21/24%).
 *       Modelled as a `"refine"` condition (always-active, no toggle).
 *       ABSOLUTE matched-build gate (ATK% cancels in damage/ATK ratio;
 *       statBlock: {} on Nicole → matched build).
 *   (b) TOGGLE `shield` (after equipping char creates a Shield, 20s duration):
 *       all-DMG += min(10% per 1000 ATK, 26%) at R1.
 *       = min(0.01 × atk_total, 26) in raw-percent scale (÷100 at buildStats emit).
 *       R1..R5 ratio: 0.01/0.013/0.016/0.019/0.022 (per-ATK raw-percent).
 *       R1..R5 cap: 26/34/42/50/58 (raw percent).
 *       Modelled as a `postEffect` with `fromStat:"atk"`, `ratioFromTalent`,
 *       `capValueFromTalent`, gated on the boolean `weapon_angelos_heptades_shield`.
 *       This uses the EXISTING weapon-postEffect mechanism (Ring of Ceiba / Peak
 *       Patrol Song precedent) — NO new engine extension required.
 *       RATIO mode gate: GO's `all_dmg_` changes by 1+min(0.0001×ATK,0.26) vs OFF.
 *
 * QUARANTINED (no code, documented):
 *   - Off-field Hexerei chars get 50% of the shield DMG bonus: off-field propagation
 *     + Hexerei `target.isHexerei` tally — no engine primitive. DO NOT model.
 *   - "Guide's Contentment" (Elemental Energy restore on shield): non-damage utility.
 *
 * GO sheet: /tmp/genshin-optimizer/libs/gi/sheets/src/Weapons/Catalyst/AngelosHeptades/index.tsx
 *   atk_arr = [-1, 0.12, 0.15, 0.18, 0.21, 0.24]        (R1..R5 always-on ATK%)
 *   dmg_arr = [-1, 0.1, 0.13, 0.16, 0.19, 0.22]          (per-1000-ATK fraction)
 *   maxDmg_arr = [-1, 0.26, 0.34, 0.42, 0.50, 0.58]      (cap fractions)
 *   cond(key, 'shield') → condShield; state "on" activates
 *   prod(subscript(refinement, dmg_arr), input.premod.atk, 1/1000) → GO fraction
 *   GO conditional: { AngelosHeptades: { shield: "on" } }
 *
 * Gate:
 *   (a) ATK% — ABSOLUTE, Nicole, statBlock:{}, weapon_refine=1; normal_hit_1.
 *       ATK% toggle ON: our ATK = GO ATK = Nicole's natural build; ratio 1.0.
 *       Perturb 12→11 → gate RED.
 *   (b) shield postEffect — RATIO, Nicole, statBlock:{atk_base:2000},
 *       weapon_angelos_heptades_shield:true.
 *       At ATK ≈ 2000 (below cap ≥2600): ratio = 1 + 0.01×ATK_total/100.
 *       Cap proof: at atk_base=3000 ratio = 1.26 = 1 + 26/100 (cap bound).
 *       Perturb ratio 0.01→0.009 → gate RED; restore → GREEN.
 *
 * Amber fixture: tools/port/_fixtures/ambr/weapon/14523.json
 *   (verified: name "Angelos' Heptades", type Catalyst, rank 5 = 5★,
 *    specialProp FIGHT_PROP_ATTACK_PERCENT = ATK% substat).
 */

import type { CharPostEffect, DbObjectWeapon, TalentTable } from "@genshin/types";
import { AngelosHeptadesStatTable } from "../generated/angelos-heptades.gen-weapon.js";

function refineTable(values: readonly number[]): TalentTable {
  return { getValue: (refine: number): number => values[refine - 1] ?? 0 };
}

// Shield toggle → all-DMG += min(ratio × ATK_total, cap) (raw-percent; ÷100 at emit).
// R1..R5 per-ATK-raw-percent: 0.01/0.013/0.016/0.019/0.022
//   derived from GO's dmg_arr = [0.1,0.13,0.16,0.19,0.22] per 1000 ATK
//   = dmg_arr[ref] × ATK / 1000 → raw percent = dmg_arr[ref] × ATK / 10
//   → ratio = dmg_arr[ref] / 10 × 100 / 100 ... simplified: ratio = dmg_arr[ref] / 10
//   At R1: 0.1 / 10 = 0.01. At ATK=2600: 0.01×2600=26 = cap. ✓
// R1..R5 caps (raw percent): 26/34/42/50/58 (GO maxDmg_arr × 100).
const shieldToDmgAll: CharPostEffect = {
  priority: 1,
  fromStat: "atk",
  toStat: "dmg_all",
  ratioFromTalent: {
    table: refineTable([0.01, 0.013, 0.016, 0.019, 0.022]),
    levelSetting: "weapon_refine",
    multi: 1,
  },
  capValueFromTalent: {
    table: refineTable([26, 34, 42, 50, 58]),
    levelSetting: "weapon_refine",
  },
  conditions: [{ type: "boolean", name: "weapon_angelos_heptades_shield" }],
};

export const angelosHeptades: DbObjectWeapon = {
  name: "angelos_heptades",
  gameId: 14523,
  rarity: 5,
  weapon: "catalyst",
  statTable: AngelosHeptadesStatTable,
  conditions: [
    // (a) Always-on: ATK +12% (R1..R5: 12/15/18/21/24%).
    // GO: equal(input.weapon.key, key, subscript(refinement, atk_arr)) → premod.atk_.
    // Modelled as "refine" (no toggle, always active). ABSOLUTE gate on Nicole.
    {
      type: "refine",
      title: "talent_name.angelos_heptades_atk",
      description: "talent_descr.angelos_heptades_atk",
      refinementStats: [
        { atk_percent: 12 }, // R1
        { atk_percent: 15 }, // R2
        { atk_percent: 18 }, // R3
        { atk_percent: 21 }, // R4
        { atk_percent: 24 }, // R5
      ],
    },
  ],
  postEffects: [shieldToDmgAll],
};
