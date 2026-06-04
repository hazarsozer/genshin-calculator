/**
 * Zhongli — geo polearm ATK+HP scaler.
 *
 * 6-hit normal combo (n5: 4-hit multihit → child _5_1), charged, plunge/low/high,
 * geo skill (stele + resonance + hold_dmg), geo burst (Planet Befall).
 *
 * A4 "Dominance of Earth": HP-based flat additive to base damage.
 *   - Normal/charged/plunge: +1.39% max HP
 *   - Skill: +1.9% max HP
 *   - Burst: +33% max HP
 * Auto-active at A6 (ConditionAscensionChar({ascension:4})). Folded as a second
 * hp-scaling multiplier on every relevant feature.
 *
 * Display-only features (damageType:"") — NOT tested by golden harness:
 *   - attack/skill/burst.zhongli_additional_dmg (PostEffectStatsHP)
 *   - skill.shield (FeatureShield)
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Zhongli.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Zhongli)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Zhongli)
 */

import type { Condition, DbObjectChar, Feature, FeatureMultiplierEntry, TalentResolver } from "@genshin/types";
import { Zhongli as ZhongliStatTable } from "../generated/charTables.js";
import { Zhongli as ZhongliTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return ZhongliTalents.s1.p1;
      if (name === "normal_hit_2") return ZhongliTalents.s1.p2;
      if (name === "normal_hit_3") return ZhongliTalents.s1.p3;
      if (name === "normal_hit_4") return ZhongliTalents.s1.p4;
      if (name === "normal_hit_5") return ZhongliTalents.s1.p5;
      if (name === "normal_hit_6") return ZhongliTalents.s1.p6;
      if (name === "charged_hit") return ZhongliTalents.s1.p7;
      if (name === "plunge") return ZhongliTalents.s1.p9;
      if (name === "plunge_low") return ZhongliTalents.s1.p10;
      if (name === "plunge_high") return ZhongliTalents.s1.p11;
    }
    if (talent === "skill") {
      if (name === "zhongli_stele_dmg") return ZhongliTalents.s2.p1;
      if (name === "zhongli_resonance_dmg") return ZhongliTalents.s2.p2;
      if (name === "hold_dmg") return ZhongliTalents.s2.p4;
    }
    if (talent === "burst") {
      if (name === "burst_dmg") return ZhongliTalents.s3.p1;
    }
    throw new Error(`zhongli talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// A4 "Dominance of Earth" — HP-based additive multipliers
// Auto-active at A6 (ConditionAscensionChar({ascension:4})).
// raw/genshin_calc_pub/src/js/db/Char/Zhongli.js:360-388
// ---------------------------------------------------------------------------

// 1.39% of max HP added to normal/charged/plunge base damage.
const hpNormal: FeatureMultiplierEntry = {
  scaling: "hp",
  leveling: "char_skill_attack",
  values: { getValue: (_level: number) => 1.39 },
};

// 1.9% of max HP added to skill base damage.
const hpSkill: FeatureMultiplierEntry = {
  scaling: "hp",
  leveling: "char_skill_elemental",
  values: { getValue: (_level: number) => 1.9 },
};

// 33% of max HP added to burst base damage.
const hpBurst: FeatureMultiplierEntry = {
  scaling: "hp",
  leveling: "char_skill_burst",
  values: { getValue: (_level: number) => 33 },
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (physical) ---
  // raw: FeatureDamageNormal normal_hit_1. Zhongli.js:143-150
  {
    name: "normal_hit_1",
    category: "attack",
    multipliers: [
      { leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1") },
      hpNormal,
    ],
  },
  // raw: FeatureDamageNormal normal_hit_2. Zhongli.js:151-158
  {
    name: "normal_hit_2",
    category: "attack",
    multipliers: [
      { leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2") },
      hpNormal,
    ],
  },
  // raw: FeatureDamageNormal normal_hit_3. Zhongli.js:159-166
  {
    name: "normal_hit_3",
    category: "attack",
    multipliers: [
      { leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") },
      hpNormal,
    ],
  },
  // raw: FeatureDamageNormal normal_hit_4. Zhongli.js:167-174
  {
    name: "normal_hit_4",
    category: "attack",
    multipliers: [
      { leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4") },
      hpNormal,
    ],
  },
  // raw: FeatureDamageMultihit normal_hit_5 (4 hits × p5). Parent = 4× sum.
  // Zhongli.js:175-191
  {
    name: "normal_hit_5",
    category: "attack",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_5") }, hpNormal] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_5") }, hpNormal] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_5") }, hpNormal] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_5") }, hpNormal] },
    ],
  },
  // raw: FeatureDamageNormal normal_hit_5_1 (isChild:true, one of the 4 hits).
  // Zhongli.js:192-202
  {
    name: "normal_hit_5_1",
    category: "attack",
    multipliers: [
      { leveling: "char_skill_attack", values: talents.get("attack.normal_hit_5") },
      hpNormal,
    ],
  },
  // raw: FeatureDamageNormal normal_hit_6. Zhongli.js:203-210
  {
    name: "normal_hit_6",
    category: "attack",
    multipliers: [
      { leveling: "char_skill_attack", values: talents.get("attack.normal_hit_6") },
      hpNormal,
    ],
  },
  // --- Charged attack ---
  // raw: FeatureDamageCharged charged_hit. Zhongli.js:211-218
  {
    name: "charged_hit",
    category: "attack",
    damageType: "charged",
    multipliers: [
      { leveling: "char_skill_attack", values: talents.get("attack.charged_hit") },
      hpNormal,
    ],
  },
  // --- Plunge attacks ---
  // raw: FeatureDamagePlungeCollision plunge. Zhongli.js:219-226
  {
    name: "plunge",
    category: "attack",
    damageType: "plunge",
    multipliers: [
      { leveling: "char_skill_attack", values: talents.get("attack.plunge") },
      hpNormal,
    ],
  },
  // raw: FeatureDamagePlungeShockWave plunge_low. Zhongli.js:227-234
  {
    name: "plunge_low",
    category: "attack",
    damageType: "plunge",
    multipliers: [
      { leveling: "char_skill_attack", values: talents.get("attack.plunge_low") },
      hpNormal,
    ],
  },
  // raw: FeatureDamagePlungeShockWave plunge_high. Zhongli.js:235-242
  {
    name: "plunge_high",
    category: "attack",
    damageType: "plunge",
    multipliers: [
      { leveling: "char_skill_attack", values: talents.get("attack.plunge_high") },
      hpNormal,
    ],
  },
  // --- Skill: Dominus Lapidis (geo) ---
  // raw: FeatureDamageSkill zhongli_stele_dmg (geo). Zhongli.js:251-259
  {
    name: "zhongli_stele_dmg",
    category: "skill",
    element: "geo",
    multipliers: [
      { leveling: "char_skill_elemental", values: talents.get("skill.zhongli_stele_dmg") },
      hpSkill,
    ],
  },
  // raw: FeatureDamageSkill zhongli_resonance_dmg (geo). Zhongli.js:260-267
  {
    name: "zhongli_resonance_dmg",
    category: "skill",
    element: "geo",
    multipliers: [
      { leveling: "char_skill_elemental", values: talents.get("skill.zhongli_resonance_dmg") },
      hpSkill,
    ],
  },
  // raw: FeatureDamageSkill hold_dmg (geo, skill hold). Zhongli.js:268-277
  {
    name: "hold_dmg",
    category: "skill",
    element: "geo",
    multipliers: [
      { leveling: "char_skill_elemental", values: talents.get("skill.hold_dmg") },
      hpSkill,
    ],
  },
  // --- Burst: Planet Befall (geo) ---
  // raw: FeatureDamageBurst burst_dmg (geo). Zhongli.js:297-305
  {
    name: "burst_dmg",
    category: "burst",
    element: "geo",
    multipliers: [
      { leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") },
      hpBurst,
    ],
  },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Constellations (P2.C Wave-1)
// ---------------------------------------------------------------------------
// C1: ConditionStatic display-only → SKIP.
// C2: ConditionStatic display-only → SKIP.
// C3 "Jade Shrine" — +3 Elemental Skill talent levels.
//   raw/genshin_calc_pub/src/js/db/Char/Zhongli.js:406-413 (constellation[2]).
// C4: ConditionStatic display-only → SKIP.
// C5 "Lazuli Crown" — +3 Burst talent levels.
//   raw/genshin_calc_pub/src/js/db/Char/Zhongli.js:423-430 (constellation[4]).
// C6: ConditionStatic with text_percent_* (display-only) → SKIP.

const constellationConditions: readonly Condition[] = [
  // C3 — char_skill_elemental_bonus +3 (skill talent level up).
  { type: "constellation", constellation: 3, settings: { char_skill_elemental_bonus: 3 } },
  // C5 — char_skill_burst_bonus +3 (burst talent level up).
  { type: "constellation", constellation: 5, settings: { char_skill_burst_bonus: 3 } },
];

export const zhongli: DbObjectChar = {
  name: "zhongli",
  gameId: 10000030,
  rarity: 5,
  element: "geo",
  weapon: "polearm",
  origin: "liyue",
  statTable: ZhongliStatTable,
  talents,
  features,
  multipliers: [],
  conditions: constellationConditions,
  partyData: {
    conditions: [
      // Jade Parcel shield — universal RES shred: all 7 elements + physical, -20% each.
      // Gated by party.zhongli_jade_shield (boolean toggle in baked teammate settings).
      // Source: raw/genshin_calc_pub/src/js/db/Char/Zhongli.js:445-463
      {
        type: "static",
        stats: {
          enemy_res_physical: -20,
          enemy_res_anemo: -20,
          enemy_res_geo: -20,
          enemy_res_pyro: -20,
          enemy_res_electro: -20,
          enemy_res_hydro: -20,
          enemy_res_cryo: -20,
          enemy_res_dendro: -20,
        },
        condition: { type: "boolean", name: "party.zhongli_jade_shield" },
      },
    ],
  },
};
