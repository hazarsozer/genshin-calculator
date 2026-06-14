/**
 * prospectors_shovel — 4★ polearm (v6.0, live port)
 *
 * Sub-stat: ATK%. Passive "Swift and Sure": Electro-Charged DMG +48/60/72/84/96% and
 * Lunar-Charged DMG +12/15/18/21/24%. Moonsign Ascendant Gleam (≥MS2): Lunar-Charged DMG
 * +an additional 12/15/18/21/24%. Only the base (non-Moonsign) bonuses are modeled here;
 * the Moonsign extra Lunar-Charged is deferred (the B1/Serenity Moonsign-deferral precedent).
 *
 * Passive shape: ConditionBooleanRefine granting two reaction-DMG channels at once
 * (dmg_reaction_electrocharged + dmg_reaction_lunarcharged) — the Fractured Halo multi-channel
 * pattern, one toggle. Toggle: weapon_swift_and_sure.
 *
 * GCSim oracle gate: prospectors-shovel-gcsim (Electro-Charged reaction, absolute mode);
 * see tools/oracle/gate-reps.mjs + v6WeaponsGate.test.ts.
 *
 * Sources:
 *   Project Amber (pinned): tools/port/_fixtures/ambr/weapon/13433.json
 *     affix["113433"]: name "Swift and Sure", EC 48%→96%, LC 12%→24% (R1→R5)
 *   GCSim (cross-check): /tmp/gcsim/internal/weapons/spear/prospectorsshovel/prospectorsshovel.go
 *     buff = 0.09 + 0.03*r; EC = buff*4 (0.48→0.96); LC = buff (0.12→0.24), *2 at MS2 (deferred)
 *   live-weapons.json gameId 13433, slug "prospectors-shovel", type "polearm"
 */

import type { DbObjectWeapon } from "@genshin/types";
import { ProspectorsShovelStatTable } from "../generated/prospectors-shovel.gen-weapon.js";

export const prospectorsShovel: DbObjectWeapon = {
  name: "prospectors_shovel",
  gameId: 13433,
  rarity: 4,
  weapon: "polearm",
  statTable: ProspectorsShovelStatTable,
  conditions: [
    {
      type: "boolean-refine",
      name: "weapon_swift_and_sure",
      serializeId: 1,
      title: "talent_name.swift_and_sure",
      description: "talent_descr.swift_and_sure",
      refinementStats: [
        { dmg_reaction_electrocharged: 48, dmg_reaction_lunarcharged: 12 }, // R1
        { dmg_reaction_electrocharged: 60, dmg_reaction_lunarcharged: 15 }, // R2
        { dmg_reaction_electrocharged: 72, dmg_reaction_lunarcharged: 18 }, // R3
        { dmg_reaction_electrocharged: 84, dmg_reaction_lunarcharged: 21 }, // R4
        { dmg_reaction_electrocharged: 96, dmg_reaction_lunarcharged: 24 }, // R5
      ],
    },
  ],
};
