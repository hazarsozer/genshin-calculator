/**
 * Dehya — pyro claymore ATK+HP scaler (5-star).
 *
 * 4-hit normal combo, charged spin/final, plunge/low/high (physical), pyro skill
 * (dehya_indomitable_flame_dmg ATK, dehya_ranging_flame_dmg ATK, dehya_field_dmg
 * ATK+HP with damageBonuses), pyro burst (dehya_flame_manes_fist_dmg ATK+HP,
 * dehya_incineration_drive_dmg ATK+HP).
 *
 * HP-scaling multipliers use scaling:'hp*' (Layla/Kirara pattern):
 *   dehya_field_dmg: s2.p3 (ATK%) + s2.p4 (HP%)
 *   dehya_flame_manes_fist_dmg: s3.p1 (ATK%) + s3.p2 (HP%)
 *   dehya_incineration_drive_dmg: s3.p3 (ATK%) + s3.p4 (HP%)
 *
 * A4 heals (dehya_stalwart_and_true_heal, dehya_stalwart_and_true_dot_heal)
 * are HP-scaling heals with empty damageType → not tested by golden suite.
 * C1 adds HP% bonus + HP→skill/burst multipliers (constellation-gated).
 * C4 heal: empty damageType, constellation-gated → not active at C0.
 *
 * No always-on passive damage stat bonuses → no baseStats needed.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Dehya.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Dehya)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Dehya)
 */

import type { CharMultiplier, Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Dehya as DehyaStatTable } from "../generated/charTables.js";
import { Dehya as DehyaTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1")  return DehyaTalents.s1.p1;
      if (name === "normal_hit_2")  return DehyaTalents.s1.p2;
      if (name === "normal_hit_3")  return DehyaTalents.s1.p3;
      if (name === "normal_hit_4")  return DehyaTalents.s1.p4;
      if (name === "charged_spin")  return DehyaTalents.s1.p5;
      if (name === "charged_final") return DehyaTalents.s1.p6;
      if (name === "plunge")        return DehyaTalents.s1.p9;
      if (name === "plunge_low")    return DehyaTalents.s1.p10;
      if (name === "plunge_high")   return DehyaTalents.s1.p11;
    }
    if (talent === "skill") {
      if (name === "dehya_indomitable_flame_dmg") return DehyaTalents.s2.p1;
      if (name === "dehya_ranging_flame_dmg")     return DehyaTalents.s2.p2;
      if (name === "dehya_field_dmg")             return DehyaTalents.s2.p3;
      if (name === "dehya_field_hp")              return DehyaTalents.s2.p4;
    }
    if (talent === "burst") {
      if (name === "dehya_flame_manes_fist_dmg")   return DehyaTalents.s3.p1;
      if (name === "dehya_flame_manes_fist_hp")    return DehyaTalents.s3.p2;
      if (name === "dehya_incineration_drive_dmg") return DehyaTalents.s3.p3;
      if (name === "dehya_incineration_drive_hp")  return DehyaTalents.s3.p4;
    }
    throw new Error(`dehya talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (physical claymore) ---
  // raw/genshin_calc_pub/src/js/db/Char/Dehya.js: FeatureDamageNormal normal_hit_1
  {
    name: "normal_hit_1",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1") }],
  },
  // raw: FeatureDamageNormal normal_hit_2
  {
    name: "normal_hit_2",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2") }],
  },
  // raw: FeatureDamageNormal normal_hit_3
  {
    name: "normal_hit_3",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }],
  },
  // raw: FeatureDamageNormal normal_hit_4
  {
    name: "normal_hit_4",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4") }],
  },
  // --- Charged attacks (physical) ---
  // raw: FeatureDamageCharged charged_spin
  {
    name: "charged_spin",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_spin") }],
  },
  // raw: FeatureDamageCharged charged_final
  {
    name: "charged_final",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_final") }],
  },
  // --- Plunge attacks (physical) ---
  // raw: FeatureDamagePlungeCollision plunge
  {
    name: "plunge",
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge") }],
  },
  // raw: FeatureDamagePlungeShockWave plunge_low
  {
    name: "plunge_low",
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_low") }],
  },
  // raw: FeatureDamagePlungeShockWave plunge_high
  {
    name: "plunge_high",
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_high") }],
  },
  // --- Skill: Molten Inferno (pyro) ---
  // raw: FeatureDamageSkill dehya_indomitable_flame_dmg, element='pyro' (ATK only)
  // Dehya.js:257-266
  {
    name: "dehya_indomitable_flame_dmg",
    category: "skill",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.dehya_indomitable_flame_dmg") }],
  },
  // raw: FeatureDamageSkill dehya_ranging_flame_dmg, element='pyro' (ATK only)
  // Dehya.js:267-276
  {
    name: "dehya_ranging_flame_dmg",
    category: "skill",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.dehya_ranging_flame_dmg") }],
  },
  // raw: FeatureDamageSkill dehya_field_dmg, element='pyro', damageBonuses=['dmg_skill_dehya']
  // Two multipliers: ATK (s2.p3) + HP* (s2.p4). Dehya.js:277-292
  {
    name: "dehya_field_dmg",
    category: "skill",
    element: "pyro",
    damageBonuses: ["dmg_skill_dehya"],
    multipliers: [
      { leveling: "char_skill_elemental", values: talents.get("skill.dehya_field_dmg") },
      { scaling: "hp", leveling: "char_skill_elemental", values: talents.get("skill.dehya_field_hp") },
    ],
  },
  // --- Burst: Leonine Bite (pyro) ---
  // raw: FeatureDamageBurst dehya_flame_manes_fist_dmg, element='pyro'
  // Two multipliers: ATK (s3.p1) + HP* (s3.p2). Dehya.js:293-307
  {
    name: "dehya_flame_manes_fist_dmg",
    category: "burst",
    element: "pyro",
    // C6 "The Burning Claws Cleaving": +10% burst crit rate (crit_rate_burst, always-on
    // ConditionStatic, Raw Dehya.js cons[5]). The engine folds crit_rate_<type>
    // GENERICALLY now, so every burst hit picks it up from the stats bag — no per-feature
    // critRateBonuses declaration needed.
    multipliers: [
      { leveling: "char_skill_burst", values: talents.get("burst.dehya_flame_manes_fist_dmg") },
      { scaling: "hp", leveling: "char_skill_burst", values: talents.get("burst.dehya_flame_manes_fist_hp") },
    ],
  },
  // raw: FeatureDamageBurst dehya_incineration_drive_dmg, element='pyro'
  // Two multipliers: ATK (s3.p3) + HP* (s3.p4). Dehya.js:308-322
  {
    name: "dehya_incineration_drive_dmg",
    category: "burst",
    element: "pyro",
    // C6: +10% burst crit rate (crit_rate_burst). Raw Dehya.js cons[5]. Now folded
    // generically by the engine (crit_rate_<type>) — no per-feature declaration needed.
    multipliers: [
      { leveling: "char_skill_burst", values: talents.get("burst.dehya_incineration_drive_dmg") },
      { scaling: "hp", leveling: "char_skill_burst", values: talents.get("burst.dehya_incineration_drive_hp") },
    ],
  },
];

// ---------------------------------------------------------------------------
// Constellations (P2.C)
// ---------------------------------------------------------------------------
// C1 "The Flame Incandescent": hp_percent +20%, skill_base_hp_percent +3.6%,
//   burst_base_hp_percent +6%. ConditionStatic (always-on at C1). Also adds
//   two HP-scaling char multipliers targeting skill and burst.
// C2 "The Sand Blades Glittering": dmg_skill_dehya toggle → SKIP.
// C3 "A Rage Swift as Fire": +3 Elemental Burst talent levels.
// C4 "An Oath Abiding": heal on burst (text_percent_heal, display-only) → SKIP.
// C5 "The Alpha Lumine": +3 Elemental Skill talent levels.
// C6 "The Burning Claws Cleaving": crit_rate_burst +10% (static) + ConditionStacks toggle.
//   The static part is always-on at C6 (ConditionStatic with no subCondition in raw).
//
// Sources: raw/genshin_calc_pub/src/js/db/Char/Dehya.js:381-480

const C1_SKILL_HP_BONUS = 3.6;
const C1_BURST_HP_BONUS = 6;

// C1 always-on HP multipliers targeting skill and burst hits.
const c1SkillHpMultiplier: CharMultiplier = {
  leveling: "",
  scaling: "hp*",
  source: "constellation1",
  values: { getValue: () => C1_SKILL_HP_BONUS },
  target: { damageTypes: ["skill"] },
  condition: { type: "constellation", constellation: 1 },
};
const c1BurstHpMultiplier: CharMultiplier = {
  leveling: "",
  scaling: "hp*",
  source: "constellation1",
  values: { getValue: () => C1_BURST_HP_BONUS },
  target: { damageTypes: ["burst"] },
  condition: { type: "constellation", constellation: 1 },
};

const constellationConditions: readonly Condition[] = [
  // C1: always-on HP% + named HP-scaling bonuses (skill_base_hp_percent /
  // burst_base_hp_percent used internally by her engine — carried here for fidelity).
  // Raw Dehya.js:401-414 ConditionStatic { stats: { hp_percent:20,
  //   skill_base_hp_percent:3.6, burst_base_hp_percent:6 } }
  {
    type: "constellation",
    constellation: 1,
    stats: { hp_percent: 20, skill_base_hp_percent: 3.6, burst_base_hp_percent: 6 },
  },
  // C3: +3 Elemental Burst talent levels.
  // Raw cons[2]: Condition{ settings:{ char_skill_burst_bonus:3 } }
  { type: "constellation", constellation: 3, settings: { char_skill_burst_bonus: 3 } },
  // C5: +3 Elemental Skill talent levels.
  // Raw cons[4]: Condition{ settings:{ char_skill_elemental_bonus:3 } }
  { type: "constellation", constellation: 5, settings: { char_skill_elemental_bonus: 3 } },
  // C6: crit_rate_burst +10%. ConditionStatic (no subCondition → always-on at C6).
  // The ConditionStacks part (crit_dmg_burst per stack) is a toggle → SKIP.
  // Raw cons[5]: ConditionStatic{ stats:{ crit_rate_burst:10 } }
  { type: "constellation", constellation: 6, stats: { crit_rate_burst: 10 } },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const dehya: DbObjectChar = {
  name: "dehya",
  gameId: 10000079,
  rarity: 5,
  element: "pyro",
  weapon: "claymore",
  origin: "sumeru",
  statTable: DehyaStatTable,
  talents,
  features,
  multipliers: [c1SkillHpMultiplier, c1BurstHpMultiplier],
  conditions: constellationConditions,
};
