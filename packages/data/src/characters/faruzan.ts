/**
 * Faruzan — anemo bow ATK scaler.
 *
 * 4-hit normal combo (physical), physical aimed shot, anemo fully charged aimed
 * shot, plunge/low/high (physical), anemo skill (skill_dmg +
 * faruzan_pressurized_collapse_vortex_dmg), anemo burst (burst_dmg).
 *
 * A4 "Lost Wisdom of the Seven Caverns" adds ATK-based damage to anemo hits
 * when faruzan_wind_benefit (burst buff) is active — this is a conditional toggle
 * that is OFF at C0 baseline, not folded into multipliers here.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Faruzan.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Faruzan)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Faruzan)
 */

import type { CharMultiplier, Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Faruzan as FaruzanStatTable } from "../generated/charTables.js";
import { Faruzan as FaruzanTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1")  return FaruzanTalents.s1.p1;
      if (name === "normal_hit_2")  return FaruzanTalents.s1.p2;
      if (name === "normal_hit_3")  return FaruzanTalents.s1.p3;
      if (name === "normal_hit_4")  return FaruzanTalents.s1.p4;
      if (name === "aimed")         return FaruzanTalents.s1.p5;
      if (name === "charged_aimed") return FaruzanTalents.s1.p6;
      if (name === "plunge")        return FaruzanTalents.s1.p7;
      if (name === "plunge_low")    return FaruzanTalents.s1.p8;
      if (name === "plunge_high")   return FaruzanTalents.s1.p9;
    }
    if (talent === "skill") {
      if (name === "skill_dmg")                                    return FaruzanTalents.s2.p1;
      if (name === "faruzan_pressurized_collapse_vortex_dmg")      return FaruzanTalents.s2.p2;
    }
    if (talent === "burst") {
      if (name === "burst_dmg") return FaruzanTalents.s3.p1;
    }
    throw new Error(`faruzan talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (bow — physical) ---
  // raw/genshin_calc_pub/src/js/db/Char/Faruzan.js
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
  {
    name: "normal_hit_4",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4") }],
  },
  // --- Charged attacks (bow aimed shots) ---
  // aimed: physical uncharged aimed shot (FeatureDamageChargedAimed → damageType="charged")
  {
    name: "aimed",
    isAimed: true,
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.aimed") }],
  },
  // charged_aimed: fully charged anemo aimed shot
  {
    name: "charged_aimed",
    isAimed: true,
    category: "attack",
    damageType: "charged",
    element: "anemo",
    // C6 crit_dmg_anemo reaches anemo hits via her getDefaultStatsCritDamage element push
    // (Damage.js: 'crit_dmg_'+element). Base-inert: crit_dmg_anemo reads 0 until C6 fires.
    critDamageBonuses: ["crit_dmg_anemo"],
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_aimed") }],
  },
  // --- Plunge attacks (bow — physical) ---
  {
    name: "plunge",
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge") }],
  },
  {
    name: "plunge_low",
    tags: ["plunge_shockwave"],
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_low") }],
  },
  {
    name: "plunge_high",
    tags: ["plunge_shockwave"],
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_high") }],
  },
  // --- Skill: Wind Realm of Nasamjnin (anemo) ---
  // skill_dmg: initial skill hit
  // raw/genshin_calc_pub/src/js/db/Char/Faruzan.js — FeatureDamageSkill skill_dmg
  {
    name: "skill_dmg",
    category: "skill",
    element: "anemo",
    critDamageBonuses: ["crit_dmg_anemo"],
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.skill_dmg") }],
  },
  // faruzan_pressurized_collapse_vortex_dmg: Pressurized Collapse vortex hit
  // raw/genshin_calc_pub/src/js/db/Char/Faruzan.js — FeatureDamageSkill
  {
    name: "faruzan_pressurized_collapse_vortex_dmg",
    category: "skill",
    element: "anemo",
    critDamageBonuses: ["crit_dmg_anemo"],
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.faruzan_pressurized_collapse_vortex_dmg") }],
  },
  // --- Burst: The Wind's Secret Ways (anemo) ---
  // raw/genshin_calc_pub/src/js/db/Char/Faruzan.js — FeatureDamageBurst burst_dmg
  {
    name: "burst_dmg",
    category: "burst",
    element: "anemo",
    critDamageBonuses: ["crit_dmg_anemo"],
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") }],
  },
];

// ---------------------------------------------------------------------------
// Constellations (P2.C)
// ---------------------------------------------------------------------------
// C1 "Truth by Any Means": ConditionStatic with no real stats → SKIP (inert).
// C2 "Overzealous Intellect": ConditionStatic with no real stats → SKIP (inert).
// C3 "Spirit-Orchard Stroll": +3 Elemental Skill talent levels.
//    Raw cons[2]: Condition{ settings:{ char_skill_elemental_bonus:3 } }
// C4 "Divine Comprehension": ConditionStatic with no real stats → SKIP (inert).
// C5 "Wonderland of Rumination": raw cons[4] = {} (empty object) → SKIP.
//    The C5 party bonus (faruzan_char_skill_burst_bonus) is in partyData → ignored here.
// C6 "The Wondrous Path of Truth": crit_dmg_anemo:40 ConditionStatic, but its
//    subConditions require faruzan_wind_benefit toggle which is OFF → inert at C6 in
//    the canonical build. SKIP.
//
// Sources: raw/genshin_calc_pub/src/js/db/Char/Faruzan.js:316-371

// A4AtkScale constant: 32 (TalentValues.A4AtkScale in raw/…/Faruzan.js:120)
const A4_ATK_SCALE = 32;

// faruzan_wind_benefit dmg_anemo% by burst talent level (burst.faruzan_anemo_dmg_bonus = s3.p2).
// raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.ts Faruzan.s3.p2.
const WIND_BENEFIT_DMG_ANEMO: readonly number[] = [
  18, 19.35, 20.7, 22.5, 23.85, 25.2, 27, 28.8, 30.6, 32.4, 34.2, 36, 38.25, 40.5, 42.75,
];

const constellationConditions: readonly Condition[] = [
  // C3: +3 Elemental Skill talent levels.
  // Raw cons[2]: Condition{ settings:{ char_skill_elemental_bonus:3 } }
  { type: "constellation", constellation: 3, settings: { char_skill_elemental_bonus: 3 } },
  // C5: +3 Elemental Burst talent levels. In raw this is a char-level Condition gated by
  // subConditions:[ConditionConstellation(5)] (NOT the cons array, whose index 4 is {}) —
  // Faruzan.js:251-258. Modelled as the equivalent constellation condition.
  { type: "constellation", constellation: 5, settings: { char_skill_burst_bonus: 3 } },
  // SELF buffs (the never-swept SELF mirror of partyData — golden-blind SKIP).
  // wind_bale: enemy Anemo RES −30 (burst.faruzan_anemo_res_decrease = s3.p4 = [30], ×−1, flat
  // across burst level → single-element levelStats), gated by the faruzan_wind_bale toggle.
  // raw Faruzan.js:258-271 (ConditionBooleanLevels, levelSetting char_skill_burst).
  {
    type: "static-level",
    levelSetting: "char_skill_burst",
    levelStats: { enemy_res_anemo: [-30] },
    condition: { type: "boolean", name: "faruzan_wind_bale" },
  },
  // wind_benefit: dmg_anemo% by burst talent level (s3.p2), gated by the faruzan_wind_benefit
  // toggle. raw Faruzan.js:272-281 (ConditionBooleanLevels, getAlias dmg_anemo).
  {
    type: "static-level",
    levelSetting: "char_skill_burst",
    levelStats: { dmg_anemo: WIND_BENEFIT_DMG_ANEMO },
    condition: { type: "boolean", name: "faruzan_wind_benefit" },
  },
  // C6 "The Wondrous Path of Truth": crit_dmg_anemo +40, gated C6 AND wind_benefit (raw
  // Faruzan.js:351-362, ConditionStatic stats crit_dmg_anemo, subConditions wind_benefit).
  // Modelled as `static` gated by `and[C6, wind_benefit]` — NOT a `constellation` condition,
  // whose evaluator ignores the nested `.condition` gate (would mis-apply at C6 wind_benefit-off).
  {
    type: "static",
    stats: { crit_dmg_anemo: 40 },
    condition: {
      type: "and",
      items: [
        { type: "constellation", constellation: 6 },
        { type: "boolean", name: "faruzan_wind_benefit" },
      ],
    },
  },
];

// A4 SELF multiplier — atk_base% × atk_base added to each ANEMO hit, gated by the A4 toggle
// faruzan_lost_wisdom_of_the_seven_caverns (raw Faruzan.js:305-315; the SELF mirror of the
// partyData multiplier below). Dropped in the original port (multipliers was []).
const faruzanSelfMultipliers: readonly CharMultiplier[] = [
  {
    source: "ascension4",
    scaling: "atk_base",
    leveling: "",
    values: { getValue: (): number => A4_ATK_SCALE },
    condition: { type: "boolean", name: "faruzan_lost_wisdom_of_the_seven_caverns" },
    target: { damageTypes: [], damageElements: ["anemo"] },
  } satisfies CharMultiplier,
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// partyData — teammate kit buff (P3.5.2 Bucket C).
// Source: raw/genshin_calc_pub/src/js/db/Char/Faruzan.js:370-462
// Scope: A4 "Lost Wisdom of the Seven Caverns" — Faruzan's ATK-scaled anemo-damage
// bonus applied to the recipient's anemo hits when Faruzan's wind_benefit burst buff
// is active. Condition ported = ONLY the lift the multiplier reads + the master gate.
// The many constellation/passive boolean conditions are deferred to the variant-rep pass.
// ---------------------------------------------------------------------------

const faruzanPartyMultipliers: readonly CharMultiplier[] = [
  // A4: faruzan_atk_base% × faruzan_atk_base added to each ANEMO hit of the recipient.
  // raw/genshin_calc_pub/src/js/db/Char/Faruzan.js:451-460
  {
    source: "ascension4",
    scaling: "faruzan_atk_base",
    leveling: "",
    values: { getValue: (): number => A4_ATK_SCALE },
    condition: { type: "boolean", name: "party.faruzan_lost_wisdom_of_the_seven_caverns" },
    // target: damageTypes:[] means no type filter (all types match, mirroring her
    // `FeatureMultiplierTarget` with empty damageTypes — Target.js:29, length check).
    // damageElements:['anemo'] restricts to anemo hits only.
    target: { damageTypes: [], damageElements: ["anemo"] },
  } satisfies CharMultiplier,
];

export const faruzan: DbObjectChar = {
  name: "faruzan",
  gameId: 10000076,
  rarity: 4,
  element: "anemo",
  weapon: "bow",
  origin: "sumeru",
  statTable: FaruzanStatTable,
  talents,
  features,
  multipliers: faruzanSelfMultipliers,
  conditions: constellationConditions,
  partyData: {
    loadStats: {
      stats: ["atk_base"],
      settings: ["char_skill_burst"],
    },
    conditions: [
      // Lift Faruzan's atk_base (partyStat) into the recipient bag as `faruzan_atk_base`.
      // raw: ConditionNumber({name:'faruzan_atk_base', partyStat:'atk_base', max:10000}).
      { type: "number", name: "faruzan_atk_base", max: 10000 },
    ],
    multipliers: faruzanPartyMultipliers,
  },
};
