/**
 * Nilou — hydro sword HP scaler.
 *
 * 3-hit normal combo, charged 2-hit multihit (children _1/_2 emitted standalone
 * + parent total), plunge/low/high. All normals/charged/plunge are ATK-based
 * physical (char_skill_attack), matching her FeatureDamageNormal/Charged/Plunge.
 *
 * Skill "Dance of Haftkarsvar" (Sword Dance / Whirling Steps stances) — all HP-
 * scaling hydro (scaling:'hp*', char_skill_elemental):
 *   skill_dmg, nilou_sword_dance_1_dmg, nilou_sword_dance_2_dmg,
 *   nilou_watery_moon_dmg, nilou_whirling_steps_1_dmg, nilou_whirling_steps_2_dmg,
 *   nilou_water_wheel_dmg.
 *   nilou_watery_moon_dmg carries damageBonuses:['dmg_skill_nilou'] (C1 bonus,
 *   inactive at C0 → reads 0). Faithful to Nilou.js:nilou_watery_moon_dmg.
 *
 * Burst "Distant Dreams, Listening Spring" — HP-scaling hydro:
 *   burst_dmg, nilou_lingering_aeon (scaling:'hp*', char_skill_burst).
 *
 * NOT MODELLED (intentional):
 *   - other.nilou_bloom_bonus — a FeaturePostEffectValue percent readout (A4
 *     "Dreamy Dance of Aeons": (HP−30000)×0.9% capped at 400), value-display only
 *     (empty damageType). The golden harness's isDamageTripleEntry excludes empty-
 *     damageType entries from assertions, so it is not a gate. The engine has no
 *     value-feature-from-post-effect path (CharPostEffect is HP→ATK style only), so
 *     it is genuinely unmodelled here and correctly omitted (no orphan key).
 *   - reaction.rupture / electrocharged / shatter — emitted GENERICALLY by the
 *     loader from element="hydro" (transformativeReactionFeatures), not per-char.
 *
 * STATS: no Nilou-specific baseStats. Her A1 EM (+100) is a conditional toggle
 * (nilou_stance_attacked, gated by NilouParty + nilou_stance_bonus) → OFF in the
 * fixed solo C0 build. The fixture's mastery=110.128 is the weapon (Alley Flash)
 * EM, supplied by buildStats — identical to Layla/Xingqiu (same sword). Constellations
 * skipped (C0). atk/hp/def/crit/recharge all derive from statTable + weapon + STAT_BLOCK.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Nilou.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Nilou)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Nilou)
 */

import type { Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Nilou as NilouStatTable } from "../generated/charTables.js";
import { Nilou as NilouTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return NilouTalents.s1.p1;
      if (name === "normal_hit_2") return NilouTalents.s1.p2;
      if (name === "normal_hit_3") return NilouTalents.s1.p3;
      if (name === "charged_hit_1") return NilouTalents.s1.p4;
      if (name === "charged_hit_2") return NilouTalents.s1.p5;
      if (name === "plunge") return NilouTalents.s1.p7;
      if (name === "plunge_low") return NilouTalents.s1.p8;
      if (name === "plunge_high") return NilouTalents.s1.p9;
    }
    if (talent === "skill") {
      if (name === "skill_dmg") return NilouTalents.s2.p1;
      if (name === "nilou_sword_dance_1_dmg") return NilouTalents.s2.p6;
      if (name === "nilou_sword_dance_2_dmg") return NilouTalents.s2.p7;
      if (name === "nilou_watery_moon_dmg") return NilouTalents.s2.p4;
      if (name === "nilou_whirling_steps_1_dmg") return NilouTalents.s2.p2;
      if (name === "nilou_whirling_steps_2_dmg") return NilouTalents.s2.p3;
      if (name === "nilou_water_wheel_dmg") return NilouTalents.s2.p5;
    }
    if (talent === "burst") {
      if (name === "burst_dmg") return NilouTalents.s3.p1;
      if (name === "nilou_lingering_aeon") return NilouTalents.s3.p2;
    }
    throw new Error(`nilou talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (physical sword, ATK) ---
  // raw: FeatureDamageNormal normal_hit_1/2/3
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
  {
    name: "normal_hit_3",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }],
  },
  // --- Charged attacks (2-hit multihit + standalone children) ---
  // raw: FeatureDamageMultihit charged_hit_total (parent = _1 + _2)
  {
    name: "charged_hit_total",
    category: "attack",
    damageType: "charged",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit_1") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit_2") }] },
    ],
  },
  // raw: FeatureDamageCharged charged_hit_1 (isChild:true → drop isChild so it emits)
  {
    name: "charged_hit_1",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit_1") }],
  },
  // raw: FeatureDamageCharged charged_hit_2 (isChild:true → drop isChild so it emits)
  {
    name: "charged_hit_2",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit_2") }],
  },
  // --- Plunge attacks (physical sword) ---
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
  // --- Skill: Dance of Haftkarsvar (hydro, HP-scaled) ---
  // raw: FeatureDamageSkill skill_dmg (scaling:'hp*', char_skill_elemental, s2.p1)
  {
    name: "skill_dmg",
    category: "skill",
    element: "hydro",
    multipliers: [{ scaling: "hp", leveling: "char_skill_elemental", values: talents.get("skill.skill_dmg") }],
  },
  // raw: FeatureDamageSkill nilou_sword_dance_1_dmg (s2.p6)
  {
    name: "nilou_sword_dance_1_dmg",
    category: "skill",
    element: "hydro",
    multipliers: [{ scaling: "hp", leveling: "char_skill_elemental", values: talents.get("skill.nilou_sword_dance_1_dmg") }],
  },
  // raw: FeatureDamageSkill nilou_sword_dance_2_dmg (s2.p7)
  {
    name: "nilou_sword_dance_2_dmg",
    category: "skill",
    element: "hydro",
    multipliers: [{ scaling: "hp", leveling: "char_skill_elemental", values: talents.get("skill.nilou_sword_dance_2_dmg") }],
  },
  // raw: FeatureDamageSkill nilou_watery_moon_dmg (s2.p4, damageBonuses dmg_skill_nilou — C1, reads 0 at C0)
  {
    name: "nilou_watery_moon_dmg",
    category: "skill",
    element: "hydro",
    damageBonuses: ["dmg_skill_nilou"],
    multipliers: [{ scaling: "hp", leveling: "char_skill_elemental", values: talents.get("skill.nilou_watery_moon_dmg") }],
  },
  // raw: FeatureDamageSkill nilou_whirling_steps_1_dmg (s2.p2)
  {
    name: "nilou_whirling_steps_1_dmg",
    category: "skill",
    element: "hydro",
    multipliers: [{ scaling: "hp", leveling: "char_skill_elemental", values: talents.get("skill.nilou_whirling_steps_1_dmg") }],
  },
  // raw: FeatureDamageSkill nilou_whirling_steps_2_dmg (s2.p3)
  {
    name: "nilou_whirling_steps_2_dmg",
    category: "skill",
    element: "hydro",
    multipliers: [{ scaling: "hp", leveling: "char_skill_elemental", values: talents.get("skill.nilou_whirling_steps_2_dmg") }],
  },
  // raw: FeatureDamageSkill nilou_water_wheel_dmg (s2.p5)
  {
    name: "nilou_water_wheel_dmg",
    category: "skill",
    element: "hydro",
    multipliers: [{ scaling: "hp", leveling: "char_skill_elemental", values: talents.get("skill.nilou_water_wheel_dmg") }],
  },
  // --- Burst: Distant Dreams, Listening Spring (hydro, HP-scaled) ---
  // raw: FeatureDamageBurst burst_dmg (scaling:'hp*', char_skill_burst, s3.p1)
  {
    name: "burst_dmg",
    category: "burst",
    element: "hydro",
    multipliers: [{ scaling: "hp", leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") }],
  },
  // raw: FeatureDamageBurst nilou_lingering_aeon (s3.p2)
  {
    name: "nilou_lingering_aeon",
    category: "burst",
    element: "hydro",
    multipliers: [{ scaling: "hp", leveling: "char_skill_burst", values: talents.get("burst.nilou_lingering_aeon") }],
  },
];

// ---------------------------------------------------------------------------
// Constellation conditions (P2.C Wave-1)
// ---------------------------------------------------------------------------
// C1 "Dance of the Waning Moon": ConditionStatic — dmg_skill_nilou +65 (always-on).
//    Raw cons[0]: ConditionStatic{ stats:{ dmg_skill_nilou: C1SkillDmg=65 } }
//    nilou_watery_moon_dmg feature already carries damageBonuses:['dmg_skill_nilou'].
// C2 "The Starry Skies Their Flowers Rain": ConditionBoolean (enemy hydro/dendro RES,
//    gated by NilouParty + stance_bonus + ascension) → SKIP (toggle+party condition).
// C3 "Orchestrated Pearls of Slaughter": +3 Elemental Burst talent levels.
//    Raw cons[2]: Condition{ settings:{ char_skill_burst_bonus:3 } }
// C4 "Fricative Pulse": ConditionBoolean toggle (dmg_burst) → SKIP.
// C5 "Twirling Lotus": +3 Elemental Skill talent levels.
//    Raw cons[4]: Condition{ settings:{ char_skill_elemental_bonus:3 } }
// C6 "Frostbreaker's Melody": ConditionStatic with ONLY text_percent display keys → SKIP.
//    (text_percent_rate/max, text_percent_dmg/max are display-only, not real stat keys.)
//
// Sources: raw/genshin_calc_pub/src/js/db/Char/Nilou.js:459-546

const constellationConditions: readonly Condition[] = [
  // C1: dmg_skill_nilou +65 (always-on ConditionStatic, no subConditions).
  // nilou_watery_moon_dmg already has damageBonuses:['dmg_skill_nilou'] → picks this up.
  { type: "constellation", constellation: 1, stats: { dmg_skill_nilou: 65 } },
  // C3: +3 Elemental Burst (Distant Dreams, Listening Spring).
  // Raw cons[2]: new Condition({ settings: { char_skill_burst_bonus: 3 } }).
  { type: "constellation", constellation: 3, settings: { char_skill_burst_bonus: 3 } },
  // C5: +3 Elemental Skill (Dance of Haftkarsvar).
  // Raw cons[4]: new Condition({ settings: { char_skill_elemental_bonus: 3 } }).
  { type: "constellation", constellation: 5, settings: { char_skill_elemental_bonus: 3 } },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const nilou: DbObjectChar = {
  name: "nilou",
  gameId: 10000070,
  rarity: 5,
  element: "hydro",
  weapon: "sword",
  origin: "sumeru",
  statTable: NilouStatTable,
  talents,
  features,
  multipliers: [],
  conditions: constellationConditions,
};
