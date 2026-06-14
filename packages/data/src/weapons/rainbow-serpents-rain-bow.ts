/**
 * rainbow_serpents_rain_bow — 4★ bow (v6.2, live port)
 *
 * Sub-stat: ATK%. Passive "Astral Whispers Beyond the Sacred Throne": ATK is increased by
 * 28/35/42/49/56% for 8s after the equipping character's attacks hit an opponent WHILE
 * OFF-FIELD. Modeled as an always-on ATK% buff (the off-field uptime is a rotation concern,
 * quarantined like the v6-set on-hit windows); the player toggles it via weapon_astral_whispers.
 *
 * Passive shape: ConditionBooleanRefine granting atk_percent (Fractured Halo / Sapwood pattern).
 *
 * Validation: the off-field trigger can't be cleanly isolated in a single-rep GCSim gate, so the
 * armory port-snapshot on an ATK-scaling rep is the in-suite lock (ATK% changes every hit → the
 * passive IS exercised there, unlike the EM-on-reaction B1 weapons). Values cross-checked below.
 *
 * Sources:
 *   Project Amber (pinned): tools/port/_fixtures/ambr/weapon/15434.json
 *     affix["115434"]: name "Astral Whispers Beyond the Sacred Throne", ATK 28%→56% (R1→R5)
 *   GCSim (cross-check): /tmp/gcsim/internal/weapons/bow/rainbow/rainbow.go
 *     m[ATKP] = 0.21 + 0.07*r → R1=0.28, R5=0.56 (identical values)
 *   live-weapons.json gameId 15434, slug "rainbow-serpents-rain-bow", type "bow"
 */

import type { DbObjectWeapon } from "@genshin/types";
import { RainbowSerpentsRainBowStatTable } from "../generated/rainbow-serpents-rain-bow.gen-weapon.js";

export const rainbowSerpentsRainBow: DbObjectWeapon = {
  name: "rainbow_serpents_rain_bow",
  gameId: 15434,
  rarity: 4,
  weapon: "bow",
  statTable: RainbowSerpentsRainBowStatTable,
  conditions: [
    {
      type: "boolean-refine",
      name: "weapon_astral_whispers",
      serializeId: 1,
      title: "talent_name.astral_whispers",
      description: "talent_descr.astral_whispers",
      refinementStats: [
        { atk_percent: 28 }, // R1
        { atk_percent: 35 }, // R2
        { atk_percent: 42 }, // R3
        { atk_percent: 49 }, // R4
        { atk_percent: 56 }, // R5
      ],
    },
  ],
};
