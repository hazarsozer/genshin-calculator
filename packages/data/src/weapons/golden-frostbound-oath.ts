/**
 * Golden Frostbound Oath — 5★ bow (v6.5, live port)
 *
 * Sub-stat: CRIT DMG (19.2% base). Passive "Alkonost's Pledge":
 *   (a) ALWAYS-ON: DEF +16% (R1..R5: 16/20/24/28/32%).
 *   (b) TOGGLE `skillOrLc` (after Skill use or Lunar-Crystallize hit): geo_dmg_ +40% AND
 *       lunarcrystallize_dmg_ +40% (R1..R5: 40/50/60/70/80% both).
 *       One boolean-refine condition sets BOTH keys (GO: `{ ...self_geo_dmg_ }` aliasing).
 *
 * GO sheet: /tmp/genshin-optimizer/libs/gi/sheets/src/Weapons/Bow/GoldenFrostboundOath/index.tsx
 *   def_arr         = [-1, 0.16, 0.20, 0.24, 0.28, 0.32]  (always-on DEF%)
 *   selfDmg_arr     = [-1, 0.40, 0.50, 0.60, 0.70, 0.80]  (toggle — geo_dmg_ AND lunarcrystallize_dmg_)
 *   condSkillOrLc   = 'on'  (GO: equal(condSkillOrLc, 'on', subscript(...)))
 *   teamDmg_arr     = [-1, 0.20, 0.25, 0.30, 0.35, 0.40]  → QUARANTINED moondrift team buff (see below)
 *
 * Our key `dmg_reaction_lunarcrystallize` (added by Lightbearing Moonshard, v6.3) is already in
 * REACTION_BONUS_PERCENT_KEYS in buildStats.ts and wired into Linnea + Zibai's `lunardirect` features
 * via `reactionBonusKeys`. NO engine touch needed — pure data port.
 *
 * KEY MAPPING: GO uses `geo_dmg_` but our engine key is `dmg_geo` (the DMG_BONUS_ELEMENT_KEYS pattern,
 * consistent with dmg_pyro/dmg_cryo/etc.; see buildStats.ts DMG_BONUS_ELEMENT_KEYS). Same as
 * skyward-atlas.ts and calamity-queller.ts which also buffer dmg_geo (not geo_dmg_).
 *
 * ALWAYS-ON DEF%: ratio-inert on non-DEF hits (DEF doesn't scale ATK damage). On Linnea's
 *   Lunar-Crystallize hits (skill_hammer) the gate is ABSOLUTE (the a0 term makes them non-∝-DEF);
 *   the always-on DEF% shifts those hits in ABSOLUTE mode even without a separate gate. Modeled
 *   faithfully; not gated independently (the toggle component's geo hit suffices for the ratio gate).
 *
 * QUARANTINED — `moondrift` team buff:
 *   GO models a SECOND conditional `condMoondrift` that, when both `condSkillOrLc` AND `condMoondrift`
 *   are 'on', grants TEAMMATES (not self) geo_dmg_ +20% AND lunarcrystallize_dmg_ +20% (R1).
 *   This is an off-field/team buff that CANNOT be toggled independently of `skillOrLc` and requires
 *   a teammate-buff propagation path not modeled in this weapon's scope (the `characterConditions.ts`
 *   team-buff channel). No code ships for it. Documented here for future extension.
 *
 * Gate: GO-gate, RATIO mode on Linnea.
 *   golden-frostbound-oath-geo:   Linnea skill.skill_pummeler with toggle ON → +40% dmg_geo (RATIO, DEF).
 *   golden-frostbound-oath-lunar: Linnea skill.skill_hammer with toggle ON → +40% dmg_reaction_lunarcrystallize
 *                                 (ABSOLUTE mode, tol 1e-5 — a0 term makes it non-∝-DEF, like Moonshard).
 *
 * Amber fixture: tools/port/_fixtures/ambr/weapon/15516.json (verified name, type Bow, rarity 5★).
 */

import type { DbObjectWeapon } from "@genshin/types";
import { GoldenFrostboundOathStatTable } from "../generated/golden-frostbound-oath.gen-weapon.js";

export const goldenFrostboundOath: DbObjectWeapon = {
  name: "golden_frostbound_oath",
  gameId: 15516,
  rarity: 5,
  weapon: "bow",
  statTable: GoldenFrostboundOathStatTable,
  conditions: [
    // Always-on DEF% (GO: def_ = subscript(refinement, def_arr), always applied).
    // Modeled as "refine" (unconditional, scales with refinement).
    {
      type: "refine",
      title: "talent_name.golden_frostbound_oath_def",
      description: "talent_descr.golden_frostbound_oath_def",
      refinementStats: [
        { def_percent: 16 }, // R1
        { def_percent: 20 }, // R2
        { def_percent: 24 }, // R3
        { def_percent: 28 }, // R4
        { def_percent: 32 }, // R5
      ],
    },
    // Toggle `skillOrLc` (after Skill or Lunar-Crystallize hit): geo_dmg_ +40% AND lunarcrystallize_dmg_ +40%
    // (R1..R5: 40/50/60/70/80% both). GO: equal(condSkillOrLc, 'on', subscript(refinement, selfDmg_arr))
    // applied to BOTH geo_dmg_ and lunarcrystallize_dmg_ (GO aliases the node: { ...self_geo_dmg_ }).
    // Our key `dmg_geo` maps to GO's `geo_dmg_` (DMG_BONUS_ELEMENT_KEYS pattern, consistent with
    // skyward-atlas/calamity-queller). Our `dmg_reaction_lunarcrystallize` maps to GO's
    // lunarcrystallize_dmg_, feeding Linnea/Zibai's lunardirect `reactionBonusKeys`.
    {
      type: "boolean-refine",
      name: "weapon_golden_frostbound_oath_1",
      serializeId: 1,
      title: "talent_name.golden_frostbound_oath_skill_or_lc",
      description: "talent_descr.golden_frostbound_oath_skill_or_lc",
      refinementStats: [
        { dmg_geo: 40, dmg_reaction_lunarcrystallize: 40 },  // R1
        { dmg_geo: 50, dmg_reaction_lunarcrystallize: 50 },  // R2
        { dmg_geo: 60, dmg_reaction_lunarcrystallize: 60 },  // R3
        { dmg_geo: 70, dmg_reaction_lunarcrystallize: 70 },  // R4
        { dmg_geo: 80, dmg_reaction_lunarcrystallize: 80 },  // R5
      ],
    },
    // QUARANTINED: `moondrift` team buff — geo_dmg_ +20% AND lunarcrystallize_dmg_ +20% to TEAMMATES
    // (R1..R5: 20/25/30/35/40%) when both `skillOrLc` AND `moondrift` are active. Requires a teammate
    // propagation path (characterConditions.ts team-buff channel); not independently toggleable from
    // `skillOrLc`. No engine primitive for nested-conditional team buffs. Out of scope for this port.
  ],
};
