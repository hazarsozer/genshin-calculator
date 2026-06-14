/**
 * snare_hook — 4★ bow (v6.0, live port)
 *
 * Sub-stat: Energy Recharge (ER). Passive: "Phantom Flash" — upon causing an Elemental
 * Reaction, increases Elemental Mastery by 60/75/90/105/120 for 12s. Moonsign: Ascendant
 * Gleam: EM from this effect is further increased by the same amount (×2 total at ≥MS2).
 * The Moonsign EM doubling is a team/context effect outside this weapon's static passive;
 * only the base EM buff is modelled here.
 *
 * Passive shape: ConditionBooleanRefine (identical to Sapwood Blade's "Forest Sanctuary").
 * Toggle name: weapon_phantom_flash. R1=60 EM, R2=75, R3=90, R4=105, R5=120.
 *
 * GCSim oracle gate: snare-hook-gcsim (see tools/oracle/gate-reps.mjs).
 * Character rep: Fischl (bow, electro) + Kaeya superconduct (absolute mode, EM=120 at R5).
 * Anti-gaming: disable passive → mastery=0 → superconduct drops ~47% → gate RED.
 *
 * Sources:
 *   Project Amber (pinned): tools/port/_fixtures/ambr/weapon/15433.json
 *     affix["115433"]: name "Phantom Flash", upgrade[4] "+120 EM for 12s"
 *   GCSim (cross-check): /tmp/gcsim/internal/weapons/bow/snarehook/snarehook.go
 *     emBuff = 45 + 15*r → R5=120 (identical values, identical logic)
 *   live-weapons.json gameId 15433, slug "snare-hook", type "bow"
 */

import type { DbObjectWeapon } from "@genshin/types";
import { SnareHookStatTable } from "../generated/snare-hook.gen-weapon.js";

export const snareHook: DbObjectWeapon = {
  name: "snare_hook",
  gameId: 15433,
  rarity: 4,
  weapon: "bow",
  statTable: SnareHookStatTable,
  conditions: [
    {
      type: "boolean-refine",
      name: "weapon_phantom_flash",
      serializeId: 1,
      title: "talent_name.phantom_flash",
      description: "talent_descr.phantom_flash",
      refinementStats: [
        { mastery: 60 }, // R1
        { mastery: 75 }, // R2
        { mastery: 90 }, // R3
        { mastery: 105 }, // R4
        { mastery: 120 }, // R5
      ],
    },
  ],
};
