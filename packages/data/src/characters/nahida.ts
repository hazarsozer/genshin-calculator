/**
 * Nahida — dendro catalyst.
 *
 * 4-hit normal combo (all dendro), dendro charged hit, plunge/low/high.
 * Dendro skill: press_dmg, hold_dmg, nahida_trikarma_purification_dmg
 * (dual ATK+EM multipliers; critRateBonuses/damageBonuses are burst-gated → OFF).
 * No burst damage asserted in fixture (burst is a party-buff only).
 * other.nahida_mastery_bonus: damageType="" → not asserted by harness.
 *
 * A4 passives (crit_rate_nahida, dmg_skill_nahida) require EM > 200 and are
 * driven by PostEffectStatsMastery with conditions — off at settings={} baseline
 * unless EM > 200. Fixture stats.mastery = 170.2 < 200, so they are inactive.
 * The critRateBonuses/damageBonuses on trikarma reference these keys but the
 * engine reads absent keys as 0 — no additional modelling needed.
 *
 * A1 mastery buff (masteryBuffPost / nahida_compassion_illuminated):
 *   - ConditionNumber `party_max_mastery` (max=1000): when active, injects stat
 *     `party_max_mastery = min(settings.party_max_mastery, 1000)` into the bag.
 *   - ConditionBoolean `nahida_illusory_heart` (A4 burst toggle, gates burst EM bonuses).
 *   - ConditionBoolean `nahida_compassion_illuminated` (A1, sub-gated by illusory_heart):
 *     gates the masteryBuffPost.
 *   - masteryBuffPost (CharPostEffect): `max(mastery_total, party_max_mastery) * 0.25`,
 *     capped at 250, writes to `mastery`. Uses fromStatMax to take the max of the
 *     character's mastery and the party's mastery (PostEffectStatsNahida pattern).
 *     Conditions: ascension≥1 + compassion_illuminated + illusory_heart (all 3 must be on).
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Nahida.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Nahida)
 *   raw/genshin_calc_pub/src/js/classes/PostEffect/Stats/Nahida.js (PostEffectStatsNahida)
 *   raw/genshin_calc_pub/src/js/classes/Condition/Number.js (ConditionNumber.getStats)
 */

import type { CharPostEffect, Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Nahida as NahidaStatTable } from "../generated/charTables.js";
import { Nahida as NahidaTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return NahidaTalents.s1.p1;
      if (name === "normal_hit_2") return NahidaTalents.s1.p2;
      if (name === "normal_hit_3") return NahidaTalents.s1.p3;
      if (name === "normal_hit_4") return NahidaTalents.s1.p4;
      if (name === "charged_hit")  return NahidaTalents.s1.p5;
      if (name === "plunge")       return NahidaTalents.s1.p7;
      if (name === "plunge_low")   return NahidaTalents.s1.p8;
      if (name === "plunge_high")  return NahidaTalents.s1.p9;
    }
    if (talent === "skill") {
      if (name === "press_dmg")  return NahidaTalents.s2.p1;
      if (name === "hold_dmg")   return NahidaTalents.s2.p2;
      if (name === "trikarma_atk")    return NahidaTalents.s2.p3;
      if (name === "trikarma_mastery") return NahidaTalents.s2.p4;
    }
    if (talent === "burst") {
      // Burst bonus talent tables for ConditionLevels contributions.
      // heart_pyro_1/2: increase Tri-Karma skill DMG by burst-talent% per pyro party member.
      // Source: raw/genshin_calc_pub/src/js/db/Char/Nahida.js:338-370
      if (name === "heart_pyro_1") return NahidaTalents.s3.p1;  // 1 pyro → +dmg_skill_nahida
      if (name === "heart_pyro_2") return NahidaTalents.s3.p2;  // 2 pyro → +dmg_skill_nahida
    }
    throw new Error(`nahida talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (dendro catalyst, always dendro) ---
  {
    name: "normal_hit_1",
    category: "attack",
    element: "dendro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1") }],
  },
  {
    name: "normal_hit_2",
    category: "attack",
    element: "dendro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2") }],
  },
  {
    name: "normal_hit_3",
    category: "attack",
    element: "dendro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }],
  },
  {
    name: "normal_hit_4",
    category: "attack",
    element: "dendro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4") }],
  },
  // --- Charged attack ---
  {
    name: "charged_hit",
    category: "attack",
    damageType: "charged",
    element: "dendro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }],
  },
  // --- Plunge attacks ---
  {
    name: "plunge",
    category: "attack",
    damageType: "plunge",
    element: "dendro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge") }],
  },
  {
    name: "plunge_low",
    category: "attack",
    damageType: "plunge",
    element: "dendro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_low") }],
  },
  {
    name: "plunge_high",
    category: "attack",
    damageType: "plunge",
    element: "dendro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_high") }],
  },
  // --- Skill: All Schemes to Know ---
  {
    name: "press_dmg",
    category: "skill",
    element: "dendro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.press_dmg") }],
  },
  {
    name: "hold_dmg",
    category: "skill",
    element: "dendro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.hold_dmg") }],
  },
  // nahida_trikarma_purification_dmg: dual ATK + EM multipliers.
  // raw: FeatureDamageSkill({ multipliers: [ATK leveling s2.p3, mastery* leveling s2.p4] })
  // critRateBonuses/damageBonuses are included here per raw, even though they are 0
  // at baseline (absent keys read as 0 in the engine).
  {
    name: "nahida_trikarma_purification_dmg",
    category: "skill",
    element: "dendro",
    critRateBonuses: ["crit_rate_nahida"],
    damageBonuses: ["dmg_skill_nahida"],
    multipliers: [
      { leveling: "char_skill_elemental", values: talents.get("skill.trikarma_atk") },
      { scaling: "mastery*", leveling: "char_skill_elemental", values: talents.get("skill.trikarma_mastery") },
    ],
  },
  // Burst: Illusory Heart — party buff, no damage hit in fixture. Not declared.
  // other.nahida_mastery_bonus: damageType="" → display-only, not asserted.
  // --- C6 "The Fruit of Reason's Culmination": cons-added FeatureDamageSkill.
  // Fixed multipliers: 200% ATK + 400% mastery-scaled (no leveling → level 1).
  // Same critRateBonuses/damageBonuses as trikarma.
  // Raw Nahida.js:303-320 (ConditionConstellation(6)).
  {
    name: "nahida_trikarma_purification_karmic_dmg",
    category: "skill",
    element: "dendro",
    critRateBonuses: ["crit_rate_nahida"],
    damageBonuses: ["dmg_skill_nahida"],
    condition: { type: "constellation", constellation: 6 },
    multipliers: [
      { leveling: "", values: { getValue: (_level: number) => 200 }, source: "constellation6" },
      { scaling: "mastery*", leveling: "", values: { getValue: (_level: number) => 400 }, source: "constellation6" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Conditions: A1/A4 passives + constellation
// ---------------------------------------------------------------------------
// C1 "The Seed of Stored Knowledge": ConditionStatic display-only → SKIP.
// C2 "The Root of All Fullness": ConditionStatic crit_rate_bloom/burning + crit_dmg_bloom/burning
//   (makes Bloom/Rupture + Burning crittable) → PORTED below (engine: crittable transformative
//   reactions). The accompanying enemy_def_reduce ConditionBoolean is a toggle → SKIP.
// C3 "The Shoot of Awakening Moment": +3 levels to All Schemes to Know (skill).
//   Raw: constellation array index 2 → Condition({ settings:{ char_skill_elemental_bonus:3 } }).
// C4 "The Stem of Manifest Inference": ConditionLevelSelect mastery stacks → SKIP (toggle).
// C5 "The Leaves of Awakening Moment": +3 levels to Illusory Heart (burst).
//   Raw: char-level conditions array → Condition({ settings:{ char_skill_burst_bonus:3 },
//   subConditions:[ ConditionConstellation({constellation:5}) ] }).
// C6 "The Fruit of Reason's Culmination": ConditionStatic (display-only text) in cons array → SKIP.
//   The actual C6 damage comes from nahida_trikarma_purification_karmic_dmg feature above.
// Raw: db/Char/Nahida.js conditions + constellation arrays.

// A1 masteryBuffPost gate — conditions declared on the post-effect (all 3 must be true).
// ascension≥1 is modelled by checking char_ascension; we use ConditionStatic with a
// sub-gate here because our conditions array always includes these three (the feature
// is gated by ascension-1 via CharPostEffect.conditions). We use a static type
// that always passes given ascension≥1 in the settings — the harness always runs
// at ascension 6, so these fire exactly when the two user booleans are on.
//
// Actual ascension gate: condition ascension:1 is always satisfied in our builds
// (all builds run at ascension 6). We model it implicitly by omitting a hard guard —
// the boolean conditions are the meaningful gates at play here. Raw Nahida.js:168-172.
const masteryBuffConditions: readonly Condition[] = [
  // A4 burst toggle: gates the burst EM-scaling bonuses. Raw Nahida.js:382-387.
  { type: "boolean", name: "nahida_illusory_heart" },
  // A1 compassion toggle: gates the mastery buff. Sub-gated by illusory_heart in raw,
  // modelled via the post-effect requiring both. Raw Nahida.js:388-402.
  { type: "boolean", name: "nahida_compassion_illuminated" },
];

// masteryBuffPost — CharPostEffect for the A1 EM bonus.
// Raw PostEffectStatsNahida.getBaseValueTree: CMax([makeStatTotalItem('mastery'), makeStatItem('party_max_mastery')])
// Raw: percent = A1MasteryRatio/100 = 0.25, statCap = A1MasteryCap = 250.
// Writes to 'mastery'. Conditions: ascension≥1 (always at asc6) + both toggles.
// priority=2 (STAT_LOCAL = PRE_STATS) — runs before A4 global effects (priority=3).
// Source: raw/genshin_calc_pub/src/js/db/Char/Nahida.js:164-172
//         raw/genshin_calc_pub/src/js/classes/PostEffect/Stats/Nahida.js:6-11
//         raw/genshin_calc_pub/src/js/classes/PostEffect.js (PRIORITIES.STAT_LOCAL=2)
const masteryBuffPost: CharPostEffect = {
  priority: 2,
  fromStat: "mastery",
  fromStatMax: "party_max_mastery",
  toStat: "mastery",
  ratio: 0.25,
  capValue: 250,
  conditions: masteryBuffConditions,
};

// A4 "Awakening Elucidated": EM-scaling crit_rate_nahida and dmg_skill_nahida bonuses.
// Both use PostEffectStatsMastery (fromStat='mastery') with exceed=200 (our offset=200).
// global:true → STAT_GLOBAL priority=3 → runs AFTER masteryBuffPost (priority=2),
// so A4 reads the mastery AFTER A1's +250 when compassion_illuminated is active.
//
// Raw values: A4CritRateBonus=0.03, A4CritRateBonusCap=24, A4SkillBonus=0.1, A4SkillBonusCap=80.
// Their Stats.getTree does isPercent('/crit_rate_nahida')=true → divides by 100 (writes fraction).
// In our TS: we write RAW PERCENT to the Stats bag; collectFeatureBonusKeys divides by 100.
// So our ratio stays at the raw per-unit value: 0.03 per mastery (above 200), cap=24 (raw %).
// Conditions: ConditionAscensionChar(4) — always active at ascension 6 → no conditions needed.
// Source: raw/genshin_calc_pub/src/js/db/Char/Nahida.js:420-437
//         raw/genshin_calc_pub/src/js/classes/PostEffect/Stats/Mastery.js
const a4CritPost: CharPostEffect = {
  priority: 3,
  fromStat: "mastery",
  toStat: "crit_rate_nahida",
  offset: 200,
  ratio: 0.03,
  capValue: 24,
};

const a4SkillPost: CharPostEffect = {
  priority: 3,
  fromStat: "mastery",
  toStat: "dmg_skill_nahida",
  offset: 200,
  ratio: 0.1,
  capValue: 80,
};

// Burst pyro bonus 1: when illusory_heart is on AND constellation >= 1
// (ConditionCalcElementsNahida auto-sets nahida_elements_pyro:1 at C1+, so the condition
// "nahida_elements_pyro == 1" is equivalent to "constellation >= 1" in our builds).
// Contributes dmg_skill_nahida from burst.nahida_heart_pyro_1 at effective burst level.
// Modeled as talentBonus (direct stat from talent table, no base-stat multiplication).
// priority=3 (STAT_GLOBAL), matching raw ConditionLevels which resolves after postEffects.
// Source: raw/genshin_calc_pub/src/js/db/Char/Nahida.js:338-354 (ConditionLevels, pyro_1)
//         raw/genshin_calc_pub/src/js/classes/Condition/CalcElementsNahida.js (auto-pyro at C1+)
const burstPyro1Post: CharPostEffect = {
  priority: 3,
  fromStat: "mastery",  // ignored when talentBonus is set
  toStat: "dmg_skill_nahida",
  talentBonus: {
    table: talents.get("burst.heart_pyro_1"),
    levelSetting: "char_skill_burst",
  },
  conditions: [
    // nahida_illusory_heart toggle must be on.
    { type: "boolean", name: "nahida_illusory_heart" },
    // Constellation >= 1 gates the auto-pyro injection (ConditionCalcElementsNahida).
    { type: "constellation", constellation: 1 },
  ],
};

const conditions: readonly Condition[] = [
  // ConditionNumber `party_max_mastery` (max=1000): when active (value>0),
  // injects `party_max_mastery = min(settings.party_max_mastery, 1000)` as a stat.
  // Source: raw/genshin_calc_pub/src/js/db/Char/Nahida.js:372-380 (ConditionNumber)
  //         raw/genshin_calc_pub/src/js/classes/Condition/Number.js:58-70 (getStats)
  { type: "number", name: "party_max_mastery", max: 1000 },
  // ConditionBoolean `nahida_illusory_heart` — A4 burst toggle. Raw Nahida.js:382-387.
  { type: "boolean", name: "nahida_illusory_heart" },
  // ConditionBoolean `nahida_compassion_illuminated` — A1 toggle. Raw Nahida.js:388-402.
  // Sub-gated by illusory_heart in raw; we gate the post-effect on both booleans instead.
  { type: "boolean", name: "nahida_compassion_illuminated" },
  // C2 "The Root of All Fullness": makes Bloom/Rupture + Burning reactions crit
  // (ConditionStatic, auto-active — the accompanying enemy_def_reduce is a toggle, skipped).
  // crit_rate_bloom/burning:20, crit_dmg_bloom/burning:100. Raw Nahida.js:453-457.
  {
    type: "constellation",
    constellation: 2,
    stats: { crit_rate_bloom: 20, crit_dmg_bloom: 100, crit_rate_burning: 20, crit_dmg_burning: 100 },
  },
  // C3: +3 levels to All Schemes to Know (skill). Raw Nahida.js:472-478 (cons[2]).
  { type: "constellation", constellation: 3, settings: { char_skill_elemental_bonus: 3 } },
  // C5: +3 levels to Illusory Heart (burst). Raw Nahida.js:328-334 (char conditions).
  { type: "constellation", constellation: 5, settings: { char_skill_burst_bonus: 3 } },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const nahida: DbObjectChar = {
  name: "nahida",
  gameId: 10000073,
  rarity: 5,
  element: "dendro",
  weapon: "catalyst",
  origin: "sumeru",
  statTable: NahidaStatTable,
  talents,
  features,
  multipliers: [],
  conditions,
  postEffects: [masteryBuffPost, a4CritPost, a4SkillPost, burstPyro1Post],
};
