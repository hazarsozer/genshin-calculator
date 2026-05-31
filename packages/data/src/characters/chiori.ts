/**
 * Chiori — geo sword ATK+DEF scaler.
 *
 * 4-hit normal combo (physical sword), n3 2-hit multihit (child normal_hit_3_1 —
 * isChild:true, hits:2 in raw → drop isChild to emit), charged 2-hit multihit
 * (children charged_hit_1/2 — isChild:true → drop isChild to emit),
 * plunge/low/high (physical), geo skill (chiori_sode_dmg: ATK%+DEF%,
 * chiori_upward_sweep_dmg: ATK%+DEF%), geo burst (burst_dmg: ATK%+DEF%).
 *
 * Skill and burst damage each have TWO multipliers: ATK-scaled (char_skill_elemental
 * or char_skill_burst) + DEF-scaled (same leveling, scaling:'def').
 *   chiori_sode_dmg:        s2.p1 (ATK%) + s2.p2 (DEF%)
 *   chiori_upward_sweep_dmg: s2.p5 (ATK%) + s2.p6 (DEF%)
 *   burst_dmg:              s3.p1 (ATK%) + s3.p2 (DEF%)
 *
 * A1 "Tailor Made": ConditionStatic (display-only text_percent_dmg) + ConditionBoolean
 * (geo infusion, attack_infusion:'geo') — requires manual toggle; NOT auto-active.
 * A4 "The Finishing Touch": ConditionBoolean (dmg_geo:20) — requires toggle; omit.
 * C2 'chiori_kinu_dmg': C2-gated → omit.
 * C6: C6-gated multiplier on normal_hit_3 (conditional DEF% bonus) → omit.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Chiori.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Chiori)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Chiori)
 */

import type { Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Chiori as ChioriStatTable } from "../generated/charTables.js";
import { Chiori as ChioriTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1")  return ChioriTalents.s1.p1;
      if (name === "normal_hit_2")  return ChioriTalents.s1.p2;
      if (name === "normal_hit_3")  return ChioriTalents.s1.p3;
      if (name === "normal_hit_4")  return ChioriTalents.s1.p5;
      if (name === "charged_hit_1") return ChioriTalents.s1.p6;
      if (name === "charged_hit_2") return ChioriTalents.s1.p7;
      if (name === "plunge")        return ChioriTalents.s1.p9;
      if (name === "plunge_low")    return ChioriTalents.s1.p10;
      if (name === "plunge_high")   return ChioriTalents.s1.p11;
    }
    if (talent === "skill") {
      // chiori_sode_dmg: ATK% (p1) + DEF% (p2)
      if (name === "chiori_sode_dmg")          return ChioriTalents.s2.p1;
      if (name === "chiori_sode_dmg_def")       return ChioriTalents.s2.p2;
      // chiori_upward_sweep_dmg: ATK% (p5) + DEF% (p6)
      if (name === "chiori_upward_sweep_dmg")      return ChioriTalents.s2.p5;
      if (name === "chiori_upward_sweep_dmg_def")  return ChioriTalents.s2.p6;
    }
    if (talent === "burst") {
      // burst_dmg: ATK% (p1) + DEF% (p2)
      if (name === "burst_dmg")     return ChioriTalents.s3.p1;
      if (name === "burst_dmg_def") return ChioriTalents.s3.p2;
    }
    throw new Error(`chiori talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (physical sword) ---
  // raw: FeatureDamageNormal normal_hit_1
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
  // raw: FeatureDamageMultihit normal_hit_3 (2-hit, single multiplier p3 × 2)
  // raw/genshin_calc_pub/src/js/db/Char/Chiori.js:175-191
  {
    name: "normal_hit_3",
    category: "attack",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }] },
    ],
  },
  // raw: FeatureDamageNormal normal_hit_3_1 (isChild:true, hits:2 → drop isChild to emit)
  // raw/genshin_calc_pub/src/js/db/Char/Chiori.js:192-202
  {
    name: "normal_hit_3_1",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }],
  },
  // raw: FeatureDamageNormal normal_hit_4
  {
    name: "normal_hit_4",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4") }],
  },
  // --- Charged attacks ---
  // raw: FeatureDamageMultihit charged_hit_total (parent = _1 + _2)
  // raw/genshin_calc_pub/src/js/db/Char/Chiori.js:212-234
  {
    name: "charged_hit_total",
    category: "attack",
    damageType: "charged",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit_1") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit_2") }] },
    ],
  },
  // raw: FeatureDamageCharged charged_hit_1 (isChild:true → drop isChild to emit)
  {
    name: "charged_hit_1",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit_1") }],
  },
  // raw: FeatureDamageCharged charged_hit_2 (isChild:true → drop isChild to emit)
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
  // --- Skill: Fluttering Hasode (geo) ---
  // raw: FeatureDamageSkill chiori_sode_dmg (element:'geo', ATK% s2.p1 + DEF% s2.p2)
  // raw/genshin_calc_pub/src/js/db/Char/Chiori.js:283-297
  {
    name: "chiori_sode_dmg",
    category: "skill",
    element: "geo",
    multipliers: [
      { leveling: "char_skill_elemental", values: talents.get("skill.chiori_sode_dmg") },
      { scaling: "def", leveling: "char_skill_elemental", values: talents.get("skill.chiori_sode_dmg_def") },
    ],
  },
  // raw: FeatureDamageSkill chiori_upward_sweep_dmg (element:'geo', ATK% s2.p5 + DEF% s2.p6)
  // raw/genshin_calc_pub/src/js/db/Char/Chiori.js:298-312
  {
    name: "chiori_upward_sweep_dmg",
    category: "skill",
    element: "geo",
    multipliers: [
      { leveling: "char_skill_elemental", values: talents.get("skill.chiori_upward_sweep_dmg") },
      { scaling: "def", leveling: "char_skill_elemental", values: talents.get("skill.chiori_upward_sweep_dmg_def") },
    ],
  },
  // --- Burst: Twin Blades (geo) ---
  // raw: FeatureDamageBurst burst_dmg (element:'geo', ATK% s3.p1 + DEF% s3.p2)
  // raw/genshin_calc_pub/src/js/db/Char/Chiori.js:333-347
  {
    name: "burst_dmg",
    category: "burst",
    element: "geo",
    multipliers: [
      { leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") },
      { scaling: "def", leveling: "char_skill_burst", values: talents.get("burst.burst_dmg_def") },
    ],
  },
  // --- C2 "In Five Colors Dyed": cons-added FeatureDamageSkill (geo, 170% of chiori_sode_dmg ATK+DEF).
  // Raw Chiori.js:313-332: FeatureDamageSkill name:'chiori_kinu_dmg', element:'geo',
  //   two multipliers with scalingMultiplier: TalentValues.C2DamageRatio/100 = 170/100 = 1.7
  //   (1) leveling:'char_skill_elemental', values:Talents.get('skill.chiori_sode_dmg') s2.p1, scalingSource:'constellation2'
  //   (2) scaling:'def*', leveling:'char_skill_elemental', values:Talents.get('skill.chiori_sode_dmg_def') s2.p2, scalingSource:'constellation2'
  //   condition: ConditionConstellation({constellation:2}).
  {
    name: "chiori_kinu_dmg",
    category: "skill",
    element: "geo",
    condition: { type: "constellation", constellation: 2 },
    multipliers: [
      {
        leveling: "char_skill_elemental",
        values: talents.get("skill.chiori_sode_dmg"),
        scalingMultiplier: 1.7,
        source: "constellation2",
      },
      {
        scaling: "def",
        leveling: "char_skill_elemental",
        values: talents.get("skill.chiori_sode_dmg_def"),
        scalingMultiplier: 1.7,
        source: "constellation2",
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Constellation conditions (P2.C)
// ---------------------------------------------------------------------------
// C1: ConditionStatic (display-only) → SKIP.
// C2: Cons-added chiori_kinu_dmg feature above (C2 slot is ConditionStatic display-only).
// C3: +3 levels to Fluttering Hasode (skill). Raw cons[2] settings char_skill_elemental_bonus:3.
//   NOTE: C3=skill, C5=burst — REVERSED from amber's pattern. Raw Chiori.js:432-436.
// C4: ConditionStatic (display-only) → SKIP.
// C5: +3 levels to Twin Blades (burst). Raw cons[4] settings char_skill_burst_bonus:3.
// C6: ConditionBoolean toggle (DEF-scale on normal) → SKIP (toggle OFF).
const constellationConditions: readonly Condition[] = [
  // C3: +3 levels to skill (Fluttering Hasode). Raw cons[2] char_skill_elemental_bonus:3.
  { type: "constellation", constellation: 3, settings: { char_skill_elemental_bonus: 3 } },
  // C5: +3 levels to burst (Twin Blades). Raw cons[4] char_skill_burst_bonus:3.
  { type: "constellation", constellation: 5, settings: { char_skill_burst_bonus: 3 } },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const chiori: DbObjectChar = {
  name: "chiori",
  gameId: 10000094,
  rarity: 5,
  element: "geo",
  weapon: "sword",
  origin: "inazuma",
  statTable: ChioriStatTable,
  talents,
  features,
  multipliers: [],
  conditions: constellationConditions,
};
