/**
 * etherlight_spindlelute — 4★ catalyst (v6.0, live port; Nod-Krai craftable)
 *
 * Sub-stat: Energy Recharge. Passive "Last Singer": for 20s after using an Elemental Skill,
 * Elemental Mastery is increased by 100/125/150/175/200 (R1→R5).
 *
 * Passive shape: ConditionBooleanRefine granting `mastery` (the Snare Hook / Master's Key
 * EM-passive shape). Toggle: weapon_last_singer (models the post-Skill uptime).
 *
 * Validation (B2 4★ doctrine — value cross-checked + armory-locked): the EM value is two-witness
 * confirmed (Amber + GCSim source); the armory port-snapshot reps exercise it via the EM-scaling
 * reaction features (r1≠r5 load-bearing, as snare_hook's reaction.superconduct r1 3652.54 ≠ r5
 * 4467.78 demonstrates the lock is EM-load-bearing).
 *
 * Sources:
 *   Project Amber (pinned): tools/port/_fixtures/ambr/weapon/14432.json
 *     affix["114432"]: name "Last Singer", EM 100→200 (R1→R5)
 *   GCSim (cross-check): /tmp/gcsim/internal/weapons/catalyst/etherlightspindlelute/etherlightspindlelute.go
 *     val[EM] = 75 + 25*r → R1=100 … R5=200 (identical)
 *   live-weapons.json gameId 14432, slug "etherlight-spindlelute", type "catalyst"
 */

import type { DbObjectWeapon } from "@genshin/types";
import { EtherlightSpindleluteStatTable } from "../generated/etherlight-spindlelute.gen-weapon.js";

export const etherlightSpindlelute: DbObjectWeapon = {
  name: "etherlight_spindlelute",
  gameId: 14432,
  rarity: 4,
  weapon: "catalyst",
  statTable: EtherlightSpindleluteStatTable,
  conditions: [
    {
      type: "boolean-refine",
      name: "weapon_last_singer",
      serializeId: 1,
      title: "talent_name.last_singer",
      description: "talent_descr.last_singer",
      refinementStats: [
        { mastery: 100 }, // R1
        { mastery: 125 }, // R2
        { mastery: 150 }, // R3
        { mastery: 175 }, // R4
        { mastery: 200 }, // R5
      ],
    },
  ],
};
