/**
 * serenitys_call — 4★ sword (v6.0, live port; Nod-Krai craftable)
 *
 * Sub-stat: Energy Recharge. Passive "Solemn Silence": upon causing an Elemental Reaction,
 * increases Max HP by 16/20/24/28/32% for 12s (off-field triggerable). Moonsign Ascendant
 * Gleam (≥MS2): Max HP from this effect is further increased by the same amount (×2 total).
 * Only the base HP% is modeled here; the Moonsign doubling is a team/context effect deferred
 * exactly as the B1 weapons defer their Moonsign EM doubling.
 *
 * Passive shape: ConditionBooleanRefine granting hp_percent. Toggle: weapon_solemn_silence.
 *
 * Validation (armory-locked, no live gate): the off-field reaction-trigger uptime is a rotation
 * concern (not single-rep GCSim-gateable), so the armory port-snapshot on an HP-scaling rep (Hu Tao)
 * is the in-suite lock — its HP-scaled features change r1→r5, so the hp_percent passive IS exercised.
 * Values 2-witness-confirmed below. Stat-delta unit test: src/__tests__/serenitysCall.test.ts.
 *
 * Sources:
 *   Project Amber (pinned): tools/port/_fixtures/ambr/weapon/11433.json
 *     affix["111433"]: name "Solemn Silence", Max HP 16%→32% (R1→R5)
 *   GCSim (cross-check): /tmp/gcsim/internal/weapons/sword/serenityscall/serenityscall.go
 *     hppBuff = 0.12 + 0.04*r → R1=0.16, R5=0.32 (identical; *2 at MS2, deferred)
 *   live-weapons.json gameId 11433, slug "serenitys-call", type "sword"
 */

import type { DbObjectWeapon } from "@genshin/types";
import { SerenitysCallStatTable } from "../generated/serenitys-call.gen-weapon.js";

export const serenitysCall: DbObjectWeapon = {
  name: "serenitys_call",
  gameId: 11433,
  rarity: 4,
  weapon: "sword",
  statTable: SerenitysCallStatTable,
  conditions: [
    {
      type: "boolean-refine",
      name: "weapon_solemn_silence",
      serializeId: 1,
      title: "talent_name.solemn_silence",
      description: "talent_descr.solemn_silence",
      refinementStats: [
        { hp_percent: 16 }, // R1
        { hp_percent: 20 }, // R2
        { hp_percent: 24 }, // R3
        { hp_percent: 28 }, // R4
        { hp_percent: 32 }, // R5
      ],
    },
  ],
};
