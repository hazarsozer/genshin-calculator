/**
 * Escoffier — cryo polearm.
 *
 * 3-hit normal combo (n3 is a 2-hit multihit with children _3_1 and _3_2),
 * cryo charged hit (from char's element infusion behavior? polearm defaults to
 * physical but Escoffier's n/c are physical; fixture confirms physical),
 * plunge/low/high.
 * Cryo skill: skill_dmg + escoffier_frozen_parfait_attack_dmg + surging_blade_dmg.
 * Cryo burst: burst_dmg.
 * burst.heal (FeatureMultiplierList) and other.escoffier_rehab_diet_heal
 * (FeatureHeal) both have damageType="" → not asserted by golden harness; omit.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Escoffier.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Escoffier)
 */

import type { CharMultiplier, Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Escoffier as EscoffierStatTable } from "../generated/charTables.js";
import { Escoffier as EscoffierTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1")  return EscoffierTalents.s1.p1;
      if (name === "normal_hit_2")  return EscoffierTalents.s1.p2;
      if (name === "normal_hit_3_1") return EscoffierTalents.s1.p3;
      if (name === "normal_hit_3_2") return EscoffierTalents.s1.p4;
      if (name === "charged_hit")   return EscoffierTalents.s1.p5;
      if (name === "plunge")        return EscoffierTalents.s1.p7;
      if (name === "plunge_low")    return EscoffierTalents.s1.p8;
      if (name === "plunge_high")   return EscoffierTalents.s1.p9;
    }
    if (talent === "skill") {
      if (name === "skill_dmg")                          return EscoffierTalents.s2.p1;
      if (name === "escoffier_frozen_parfait_attack_dmg") return EscoffierTalents.s2.p2;
      if (name === "surging_blade_dmg")                  return EscoffierTalents.s2.p4;
    }
    if (talent === "burst") {
      if (name === "burst_dmg") return EscoffierTalents.s3.p1;
    }
    throw new Error(`escoffier talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks ---
  {
    name: "normal_hit_1",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1") }],
  },
  {
    name: "normal_hit_2",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2") }],
  },
  // normal_hit_3: 2-hit multihit parent (two different tables: _3_1 and _3_2).
  // raw: FeatureDamageMultihit({ name:'normal_hit_3', items:[{mult:p3},{mult:p4}] })
  {
    name: "normal_hit_3",
    category: "attack",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3_1") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3_2") }] },
    ],
  },
  // Sub-hits of normal_hit_3: fixture asserts them individually (damageType:"normal").
  // raw: FeatureDamageNormal({ isChild:true, ... }) — emit as regular (no isChild in TS).
  {
    name: "normal_hit_3_1",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3_1") }],
  },
  {
    name: "normal_hit_3_2",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3_2") }],
  },
  // --- Charged attack (physical polearm) ---
  {
    name: "charged_hit",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }],
  },
  // --- Plunge attacks ---
  {
    name: "plunge",
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge") }],
  },
  {
    name: "plunge_low",
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_low") }],
  },
  {
    name: "plunge_high",
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_high") }],
  },
  // --- Skill: Low Temperature Cooking ---
  {
    name: "skill_dmg",
    category: "skill",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.skill_dmg") }],
  },
  {
    name: "escoffier_frozen_parfait_attack_dmg",
    category: "skill",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.escoffier_frozen_parfait_attack_dmg") }],
  },
  // surging_blade_dmg: cryo skill DoT (cannotReact in raw but still asserted as skill hit).
  {
    name: "surging_blade_dmg",
    category: "skill",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.surging_blade_dmg") }],
  },
  // --- Burst: Scoring Cuts ---
  {
    name: "burst_dmg",
    category: "burst",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") }],
  },
  // burst.heal (FeatureMultiplierList, HP-based heal, damageType="") — SKIP: not asserted.
  // other.escoffier_rehab_diet_heal (FeatureHeal, constant heal, damageType="") — SKIP.
  // --- C6 "Tea Parties Bursting with Color": cons-added cryo damage hit (500% ATK,
  // fixed, not talent-leveled). Raw class is FeatureDamageSkill → damageType:"skill".
  // Raw category:'other' → OMIT category (loader derives "other." prefix from absent
  // category; LESSON 5: never write category:"other" — tsc rejects it).
  // Raw Escoffier.js:298-309 (FeatureDamageSkill + ConditionConstellation(6) + ValueTable([500])).
  {
    name: "escoffier_special_grade_frozen_parfait_dmg",
    // category intentionally OMITTED — raw has category:'other', loader derives "other." prefix.
    element: "cryo",
    damageType: "skill",
    condition: { type: "constellation", constellation: 6 },
    multipliers: [
      {
        source: "constellation6",
        leveling: "char_skill_elemental",
        values: { getValue: (_level: number) => 500 },
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Constellation conditions (P2.C)
// ---------------------------------------------------------------------------
// C1: ConditionStatic with crit_dmg_cryo:60, gated by ConditionAnd([ConditionBoolean,
//   ConditionBooleanValue(escoffier_chars_count>=4)]) — party toggle condition. SKIP.
// C2: ConditionBoolean toggle escoffier_fresh_fragrant_stew_is_an_art — SKIP (toggle OFF).
//   (The multiplier in raw multipliers[] is also commented out in source.)
// C3: +3 levels to Low Temperature Cooking (elemental skill). Raw cons[2] settings
//   char_skill_elemental_bonus:3. Raw Escoffier.js:379-386.
// C4: ConditionStatic with crit_dmg_escofier_heal:100, gated by ConditionAscensionChar(1)
//   — affects escoffier_rehab_diet_heal (damageType="" in fixture, not tested). SKIP.
// C5: +3 levels to Scoring Cuts (burst). Raw cons[4] settings char_skill_burst_bonus:3.
//   Raw Escoffier.js:399-406.
// C6: ConditionStatic display-only (text_percent_dmg:500). Actual damage is the
//   escoffier_special_grade_frozen_parfait_dmg feature above. No flat stat needed.
const constellationConditions: readonly Condition[] = [
  // C3: +3 levels to elemental skill (Low Temperature Cooking).
  { type: "constellation", constellation: 3, settings: { char_skill_elemental_bonus: 3 } },
  // C5: +3 levels to burst (Scoring Cuts).
  { type: "constellation", constellation: 5, settings: { char_skill_burst_bonus: 3 } },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// partyData — teammate kit buff (P3.5.2 Bucket C).
// Source: raw/genshin_calc_pub/src/js/db/Char/Escoffier.js:420-486
// Scope: C2 "Fresh Fragrant Stew is an Art" — Escoffier's ATK-scaled cryo-damage
// bonus applied to the recipient's cryo hits. Condition ported = ONLY the lift the
// multiplier reads + the master gate. Other conditions deferred to variant-rep pass.
// ---------------------------------------------------------------------------

// C2BonusDmg constant: 240 (raw/genshin_calc_pub/src/js/db/Char/Escoffier.js:132)
const C2_BONUS_DMG = 240;

const escoffierPartyMultipliers: readonly CharMultiplier[] = [
  // C2: escoffier_atk_total% × escoffier_atk_total added to each CRYO hit of the
  // recipient (normal/charged/plunge/skill/burst).
  // raw/genshin_calc_pub/src/js/db/Char/Escoffier.js:474-484
  {
    source: "escoffier",
    scaling: "escoffier_atk_total",
    leveling: "",
    values: { getValue: (): number => C2_BONUS_DMG },
    condition: { type: "boolean", name: "party_escoffier_fresh_fragrant_stew_is_an_art" },
    target: {
      damageElements: ["cryo"],
      damageTypes: ["normal", "charged", "plunge", "skill", "burst"],
    },
  } satisfies CharMultiplier,
];

export const escoffier: DbObjectChar = {
  name: "escoffier",
  gameId: 10000112,
  rarity: 5,
  element: "cryo",
  weapon: "polearm",
  origin: "fontaine",
  statTable: EscoffierStatTable,
  // A4 "Inspiration Immersed Seasoning": a ConditionStaticLevel gated ONLY by
  // ConditionAscensionChar({ascension:4}) (auto-active at the canonical A6, no
  // toggle), levelSetting `escoffier_chars_count`. Unset → getLevel() ||= 1, so
  // it indexes A4ResShred[0] = -5: enemy_res_cryo -= 5 and enemy_res_hydro -= 5
  // (RAW percents; buildStats folds them into the base enemy resistance → 0.05).
  // The oracle was generated with this shred active, so her cryo/hydro features
  // land at res 0.05, not 0.10. raw: db/Char/Escoffier.js:336-347 (StatTable
  // 'enemy_res_cryo'/'enemy_res_hydro' = A4ResShred), Condition/Static/Level.js.
  baseStats: { enemy_res_cryo: -5, enemy_res_hydro: -5 },
  talents,
  features,
  multipliers: [],
  conditions: constellationConditions,
  partyData: {
    loadStats: {
      stats: ["atk_total"],
    },
    conditions: [
      // Lift Escoffier's atk_total (partyStat) into recipient bag as `escoffier_atk_total`.
      // raw: ConditionNumber({name:'escoffier_atk_total', partyStat:'atk_total', max:10000}).
      { type: "number", name: "escoffier_atk_total", max: 10000 },
    ],
    multipliers: escoffierPartyMultipliers,
  },
};
