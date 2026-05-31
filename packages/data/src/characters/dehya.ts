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

import type { DbObjectChar, Feature, TalentResolver } from "@genshin/types";
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
    multipliers: [
      { leveling: "char_skill_burst", values: talents.get("burst.dehya_incineration_drive_dmg") },
      { scaling: "hp", leveling: "char_skill_burst", values: talents.get("burst.dehya_incineration_drive_hp") },
    ],
  },
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
  multipliers: [],
};
