/**
 * Lightbearing Moonshard — 5★ sword (v6.3, live port)
 *
 * Sub-stat: CRIT DMG (19.2% base). Passive "Legacy of Lang-Gan":
 *   (a) ALWAYS-ON: DEF +20% (R1..R5: 20/25/30/35/40%).
 *   (b) TOGGLE `passive` (5s after Elemental Skill): Lunar-Crystallize DMG +64%
 *       (R1..R5: 64/80/96/112/128%).
 *
 * GO sheet: /tmp/genshin-optimizer/libs/gi/sheets/src/Weapons/Sword/LightbearingMoonshard/index.tsx
 *   def_arr = [-1, 0.20, 0.25, 0.30, 0.35, 0.40]                (always-on DEF%)
 *   lunarcrystallize_dmg_arr = [-1, 0.64, 0.80, 0.96, 1.12, 1.28] (toggle, condPassive='on')
 *
 * Modeled as:
 *   - condition type "refine" (always-on DEF%): def_percent at R1..R5.
 *   - condition type "boolean-refine" (toggle `passive`): dmg_reaction_lunarcrystallize.
 *     Our key `dmg_reaction_lunarcrystallize` maps to GO's `lunarcrystallize_dmg_`, feeding
 *     the `(1 + emBonus + Σ reactionBonus)` factor on Zibai / Linnea's `lunardirect` features
 *     via `reactionBonusKeys: ["dmg_reaction_lunarcrystallize"]`. New key added to
 *     REACTION_BONUS_PERCENT_KEYS in buildStats.ts (raw percent → /100 at emit).
 *
 * ALWAYS-ON DEF%: ratio-INERT on non-DEF reps (DEF doesn't scale ATK damage). On Zibai's
 *   Lunar-Crystallize hits the gate is ABSOLUTE (the a0 term makes them non-∝-DEF); adding the
 *   DEF% would require a matched-build stat injection beyond the gate scope. Modeled faithfully;
 *   gated via the toggle component only (the lunarcrystallize_dmg_ term).
 *
 * Gate: GO-gate, ABSOLUTE mode on Zibai (stride_2 / burst_2), tol 1e-5.
 *   lightbearing-moonshard-passive: Zibai stride_2 + burst_2 with `passive` toggle ON → +64%
 *   into the Lunar-Crystallize reaction factor.
 *
 * Amber fixture: tools/port/_fixtures/ambr/weapon/11519.json (verified name, type, rarity 5★).
 */

import type { DbObjectWeapon } from "@genshin/types";
import { LightbearingMoonshardStatTable } from "../generated/lightbearing-moonshard.gen-weapon.js";

export const lightbearingMoonshard: DbObjectWeapon = {
  name: "lightbearing_moonshard",
  gameId: 11519,
  rarity: 5,
  weapon: "sword",
  statTable: LightbearingMoonshardStatTable,
  conditions: [
    // Always-on DEF% (GO: def_ = equal(input.weapon.key, key, subscript(refinement, def_arr))).
    // Modeled as "refine" (no condition key — unconditional, scales with refinement).
    {
      type: "refine",
      title: "talent_name.lightbearing_moonshard_def",
      description: "talent_descr.lightbearing_moonshard_def",
      refinementStats: [
        { def_percent: 20 }, // R1
        { def_percent: 25 }, // R2
        { def_percent: 30 }, // R3
        { def_percent: 35 }, // R4
        { def_percent: 40 }, // R5
      ],
    },
    // Toggle `passive` (5s post-Skill): Lunar-Crystallize DMG +64% (R1..R5: 64/80/96/112/128%).
    // GO: equal('on', condPassive, subscript(refinement, lunarcrystallize_dmg_arr)).
    // Our `dmg_reaction_lunarcrystallize` reads into Zibai/Linnea's lunardirect reactionBonusKeys.
    {
      type: "boolean-refine",
      name: "weapon_lightbearing_moonshard_1",
      serializeId: 1,
      title: "talent_name.lightbearing_moonshard_passive",
      description: "talent_descr.lightbearing_moonshard_passive",
      refinementStats: [
        { dmg_reaction_lunarcrystallize: 64 },  // R1
        { dmg_reaction_lunarcrystallize: 80 },  // R2
        { dmg_reaction_lunarcrystallize: 96 },  // R3
        { dmg_reaction_lunarcrystallize: 112 }, // R4
        { dmg_reaction_lunarcrystallize: 128 }, // R5
      ],
    },
  ],
};
