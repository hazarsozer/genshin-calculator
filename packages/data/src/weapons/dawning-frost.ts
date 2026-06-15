/**
 * dawning_frost — 4★ catalyst (v6.0, live port; Nod-Krai craftable)
 *
 * Sub-stat: CRIT DMG. Passive "Nocturnal Dreams": for 10s after a Charged Attack hits an
 * opponent, Elemental Mastery is increased by 72/90/108/126/144 (R1→R5); for 10s after an
 * Elemental Skill hits an opponent, Elemental Mastery is increased by 48/60/72/84/96 (R1→R5).
 * The two bonuses are INDEPENDENT (different triggers, different uptimes) and stack, so each is
 * its own toggle.
 *
 * Passive shape: two ConditionBooleanRefine granting `mastery` — one per trigger (the Snare Hook
 * EM-passive shape, doubled). Toggles: weapon_nocturnal_dreams_charged + weapon_nocturnal_dreams_skill.
 *
 * Validation (B2 4★ doctrine — value cross-checked + armory-locked): both EM values are two-witness
 * confirmed (Amber + GCSim source); the armory port-snapshot reps exercise them via the EM-scaling
 * reaction features (r1≠r5 load-bearing — cf. snare_hook).
 *
 * Sources:
 *   Project Amber (pinned): tools/port/_fixtures/ambr/weapon/14434.json
 *     affix["114434"]: name "Nocturnal Dreams", Charged-Atk EM 72→144, Skill EM 48→96 (R1→R5)
 *   GCSim (cross-check): /tmp/gcsim/internal/weapons/catalyst/dawningfrost/dawningfrost.go
 *     emBuffCa[EM] = 54 + r*18 → 72…144; emBuffSkill[EM] = 36 + r*12 → 48…96 (identical)
 *   live-weapons.json gameId 14434, slug "dawning-frost", type "catalyst"
 */

import type { DbObjectWeapon } from "@genshin/types";
import { DawningFrostStatTable } from "../generated/dawning-frost.gen-weapon.js";

export const dawningFrost: DbObjectWeapon = {
  name: "dawning_frost",
  gameId: 14434,
  rarity: 4,
  weapon: "catalyst",
  statTable: DawningFrostStatTable,
  conditions: [
    // After a Charged Attack hits: +EM (72→144).
    {
      type: "boolean-refine",
      name: "weapon_nocturnal_dreams_charged",
      serializeId: 1,
      title: "talent_name.nocturnal_dreams",
      description: "talent_descr.nocturnal_dreams",
      refinementStats: [
        { mastery: 72 },  // R1
        { mastery: 90 },  // R2
        { mastery: 108 }, // R3
        { mastery: 126 }, // R4
        { mastery: 144 }, // R5
      ],
    },
    // After an Elemental Skill hits: +EM (48→96). Independent of the Charged-Attack bonus (stacks).
    {
      type: "boolean-refine",
      name: "weapon_nocturnal_dreams_skill",
      serializeId: 2,
      title: "talent_name.nocturnal_dreams",
      description: "talent_descr.nocturnal_dreams",
      refinementStats: [
        { mastery: 48 }, // R1
        { mastery: 60 }, // R2
        { mastery: 72 }, // R3
        { mastery: 84 }, // R4
        { mastery: 96 }, // R5
      ],
    },
  ],
};
