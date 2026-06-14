/**
 * master_key — 4★ claymore (v6.0, live port)
 *
 * In-game name: "Master Key" (Amber: "Master Key"; no apostrophe-s in the data).
 * Sub-stat: Energy Recharge (ER). Passive: "Fall Into Place" — upon causing an Elemental
 * Reaction, increases Elemental Mastery by 60/75/90/105/120 for 12s. Moonsign: Ascendant
 * Gleam: EM from this effect is further increased by the same amount (×2 total at ≥MS2).
 * The Moonsign EM doubling is a team/context effect outside this weapon's static passive;
 * only the base EM buff is modelled here.
 *
 * Passive shape: ConditionBooleanRefine (identical to Sapwood Blade's "Forest Sanctuary").
 * Toggle name: weapon_fall_into_place. R1=60 EM, R2=75, R3=90, R4=105, R5=120.
 *
 * Name resolution: live-weapons.json lists "Master Key"; Amber gameId 12433 data["id":12433]
 * .name="Master Key" (no apostrophe). GO localization not checked (Amber+GCSim agree).
 * DbObjectWeapon.name = "master_key" (snake_case of the canonical in-game name).
 *
 * GCSim oracle gate: master-key-gcsim (see tools/oracle/gate-reps.mjs).
 * Character rep: Razor (claymore, electro) + Kaeya superconduct (absolute mode, EM=120 at R5).
 * Anti-gaming: disable passive → mastery=0 → superconduct drops ~47% → gate RED.
 *
 * Sources:
 *   Project Amber (pinned): tools/port/_fixtures/ambr/weapon/12433.json
 *     affixData["112433"]: name "Fall Into Place", upgrade[4] "+120 EM for 12s"
 *   GCSim (cross-check): /tmp/gcsim/internal/weapons/claymore/masterkey/masterkey.go
 *     emBuff = 45 + 15*r → R5=120 (identical values, identical logic)
 *   live-weapons.json gameId 12433, slug "masters-key", type "claymore"
 */

import type { DbObjectWeapon } from "@genshin/types";
import { MastersKeyStatTable } from "../generated/masters-key.gen-weapon.js";

export const masterKey: DbObjectWeapon = {
  name: "master_key",
  gameId: 12433,
  rarity: 4,
  weapon: "claymore",
  statTable: MastersKeyStatTable,
  conditions: [
    {
      type: "boolean-refine",
      name: "weapon_fall_into_place",
      serializeId: 1,
      title: "talent_name.fall_into_place",
      description: "talent_descr.fall_into_place",
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
