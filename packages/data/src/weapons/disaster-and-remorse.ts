/**
 * Disaster and Remorse — 5★ polearm (v6.6, live port)
 *
 * Sub-stat: CRIT Rate. Passive "Tidal Requiem":
 *   Two INDEPENDENT boolean toggles —
 *   1. "Unforgivable" active: normal_dmg_ +40% & charged_dmg_ +40% (R1..R5: 40/50/60/70/80%).
 *   2. "Irreparable" active: skill_dmg_ +40% & burst_dmg_ +40% (R1..R5: 40/50/60/70/80%).
 *
 * GO sheet: /tmp/genshin-optimizer/libs/gi/sheets/src/Weapons/Polearm/DisasterAndRemorse/index.tsx
 *   condUnforgivable: cond(key, 'unforgivable') → equal('on', …)
 *   condIrreparable:  cond(key, 'irreparable')  → equal(condIrreparaable, 'on', …)
 *   dmg_ array (index 1-5): [−1, 0.4, 0.5, 0.6, 0.7, 0.8]
 *
 * Modeled as TWO boolean-refine toggles (blood-soaked-ruins shape):
 *   - weapon_disaster_and_remorse_1 (unforgivable): dmg_normal + dmg_charged
 *   - weapon_disaster_and_remorse_2 (irreparable):  dmg_skill  + dmg_burst
 * Both use integer percent values matching the GO subscript array × 100.
 *
 * QUARANTINED — Hexerei tally≥2 multiplier: the GO sheet uses
 *   prod(sum(one, greaterEq(tally.hexerei, 2, percent(0.75))), subscript(…))
 * This is a ×1.75 runtime multiplier on the +40% base, NOT an additive +75%.
 * Our engine has no weapon-condition primitive for conditional multipliers of this shape
 * (see gate plan §6 note in weapon-port-common.md). Ship NO code for it; document only.
 *
 * Gate: GO-gate, RATIO mode. Two reps on Lohen (polearm in our roster):
 *   disaster-and-remorse-unforgivable: normal_hit_1 with toggle 1 ON → normal_dmg_ +40%.
 *   disaster-and-remorse-irreparable: etch_dmg with toggle 2 ON → skill_dmg_ +40%.
 *
 * Amber fixture: tools/port/_fixtures/ambr/weapon/13517.json (verified name, type, rarity).
 */

import type { DbObjectWeapon } from "@genshin/types";
import { DisasterAndRemorseStatTable } from "../generated/disaster-and-remorse.gen-weapon.js";

export const disasterAndRemorse: DbObjectWeapon = {
  name: "disaster_and_remorse",
  gameId: 13517,
  rarity: 5,
  weapon: "polearm",
  statTable: DisasterAndRemorseStatTable,
  conditions: [
    // Toggle 1: "Unforgivable" active → Normal DMG +40% & Charged DMG +40%.
    {
      type: "boolean-refine",
      name: "weapon_disaster_and_remorse_1",
      serializeId: 1,
      title: "talent_name.disaster_and_remorse_unforgivable",
      description: "talent_descr.disaster_and_remorse_unforgivable",
      refinementStats: [
        { dmg_normal: 40, dmg_charged: 40 }, // R1
        { dmg_normal: 50, dmg_charged: 50 }, // R2
        { dmg_normal: 60, dmg_charged: 60 }, // R3
        { dmg_normal: 70, dmg_charged: 70 }, // R4
        { dmg_normal: 80, dmg_charged: 80 }, // R5
      ],
    },
    // Toggle 2: "Irreparable" active → Skill DMG +40% & Burst DMG +40%.
    {
      type: "boolean-refine",
      name: "weapon_disaster_and_remorse_2",
      serializeId: 2,
      title: "talent_name.disaster_and_remorse_irreparable",
      description: "talent_descr.disaster_and_remorse_irreparable",
      refinementStats: [
        { dmg_skill: 40, dmg_burst: 40 }, // R1
        { dmg_skill: 50, dmg_burst: 50 }, // R2
        { dmg_skill: 60, dmg_burst: 60 }, // R3
        { dmg_skill: 70, dmg_burst: 70 }, // R4
        { dmg_skill: 80, dmg_burst: 80 }, // R5
      ],
    },
  ],
};
