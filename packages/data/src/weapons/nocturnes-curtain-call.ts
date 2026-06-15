/**
 * nocturnes_curtain_call — 5★ catalyst (v6.2, live port; Columbina's signature)
 *
 * Sub-stat: CRIT DMG. Passive "Ballad of the Crossroads" — SELF-only: every effect lands on the
 * wielder. GCSim adds all stat mods to `char` (no c.Player.Chars() team loop); the affix's "off-field"
 * clause means the equipper can trigger/receive the buff while off-field, NOT that teammates are
 * buffed. Like Reliquary of Truth (B4 #2) there is NO weapon_other propagation — only Nightweaver's
 * (B4 #1) of the three B4 5★ catalysts is an actual team buff.
 *
 * Two conditions:
 *   1. Always-on: Max HP +10/12/14/16/18% (ConditionStaticRefine → hp_percent, folds into hp_total).
 *   2. weapon_sacred_wine ("Bountiful Sea's Sacred Wine", 12s after triggering a Lunar reaction or
 *      dealing Lunar Reaction DMG): Max HP +14/16/18/20/22% (hp_percent) AND CRIT DMG from Lunar
 *      Reaction DMG +60/80/100/120/140% (crit_dmg_lunar → crit_dmg_lunar_total, /100).
 *
 * The crit_dmg_lunar channel is REACTION-SCOPED: compileReaction appends crit_dmg_lunar_total to the
 * lunar variants' (lunarcharged / lunardirect) crit DMG only, so it buffs Lunar-Charged / Lunar-Bloom
 * reaction DMG and NOT the holder's normal/charged/skill/burst crits — faithful to GCSim's
 * AttackTagIsLunar gate (a global crit_dmg would wrongly buff every hit; the Night of the Sky's
 * Unveiling reaction-crit precedent). This is the user-chosen engine extension, and it is base-inert:
 * crit_dmg_lunar_total reads 0 for all v5.8 content, so the 58k goldens stay byte-identical.
 *
 * Energy recovery (14/15/16/17/18, once per 18s, off-field) is not a damage output → out of scope
 * (energy-gen, as elsewhere).
 *
 * Values 2-witness-confirmed (no single source; see CLAUDE.md § Source-of-truth discipline):
 *   Project Amber (pinned): tools/port/_fixtures/ambr/weapon/14522.json
 *     affix["114522"] "Ballad of the Crossroads": HP 10→18% base, +14→22% wine, lunar CRIT DMG
 *     60→140%, energy 14→18 (R1→R5).
 *   GCSim (cross-check): /tmp/gcsim/internal/weapons/catalyst/nocturnes/nocturnes.go
 *     m[HPP] = 0.08 + 0.02r (0.10→0.18); hpBuff[HPP] = 0.12 + 0.02r (0.14→0.22);
 *     critBuff[CD] = 0.4 + 0.2r (0.60→1.40), applied via an AttackMod gated on AttackTagIsLunar;
 *     energy = 13 + r (14→18, 18s ICD).
 *   live-weapons.json gameId 14522, slug "nocturnes-curtain-call", type "catalyst".
 *
 * Validation (B4 5★ doctrine): values 2-witness; armory port-snapshot on Columbina (HP-scaling lunar
 * catalyst — load-bearing r1≠r5 on the HP% passive AND her crit-capable lunar hits via crit_dmg_lunar).
 * No live gate (Lunar reactions are not single-rep gateable — no lunarbloom driver contributor; the
 * Nightweaver's / Reliquary precedent). Stat-delta unit test: src/__tests__/nocturnesCurtainCall.test.ts;
 * the crit_dmg_lunar reaction-scoping: src/__tests__/lunarReactionCritDmg.test.ts.
 */

import type { DbObjectWeapon } from "@genshin/types";
import { NocturnesCurtainCallStatTable } from "../generated/nocturnes-curtain-call.gen-weapon.js";

export const nocturnesCurtainCall: DbObjectWeapon = {
  name: "nocturnes_curtain_call",
  gameId: 14522,
  rarity: 5,
  weapon: "catalyst",
  statTable: NocturnesCurtainCallStatTable,
  conditions: [
    // Always-on: Max HP +10/12/14/16/18% (the Skyward Blade static-refine passive shape).
    {
      type: "refine",
      title: "talent_name.ballad_of_the_crossroads",
      description: "talent_descr.ballad_of_the_crossroads",
      refinementStats: [
        { hp_percent: 10 }, // R1
        { hp_percent: 12 }, // R2
        { hp_percent: 14 }, // R3
        { hp_percent: 16 }, // R4
        { hp_percent: 18 }, // R5
      ],
    },
    // Bountiful Sea's Sacred Wine — 12s after triggering a Lunar reaction / dealing Lunar Reaction
    // DMG: extra Max HP + CRIT DMG for Lunar Reaction DMG. (Energy restore is out of damage scope.)
    {
      type: "boolean-refine",
      name: "weapon_sacred_wine",
      serializeId: 1,
      title: "talent_name.bountiful_seas_sacred_wine",
      description: "talent_descr.ballad_of_the_crossroads",
      refinementStats: [
        { hp_percent: 14, crit_dmg_lunar: 60 }, // R1
        { hp_percent: 16, crit_dmg_lunar: 80 }, // R2
        { hp_percent: 18, crit_dmg_lunar: 100 }, // R3
        { hp_percent: 20, crit_dmg_lunar: 120 }, // R4
        { hp_percent: 22, crit_dmg_lunar: 140 }, // R5
      ],
    },
  ],
};
