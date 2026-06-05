/**
 * Yun Jin — geo polearm, ATK-based normals, DEF-based skill.
 *
 * 5-hit normal combo (n3: 2-hit multihit → children _3_1/_3_2;
 * n4: 2-hit multihit → children _4_1/_4_2), charged, plunge/low/high.
 * Skill: Opening Flourish (press + 2 charge levels), DEF-based geo.
 * Burst: Cliffbreaker's Banner (ATK-based geo, burst_dmg).
 *
 * Yun Jin's party buff (Flying Cloud Flag Formation): adds DEF-based flat
 * additive to party normal hits when yunjin_flag toggle is ON. This is a
 * ConditionBoolean toggle (OFF at canonical C0 solo build) — NOT modelled.
 * We model only Yun Jin's OWN direct damage features.
 *
 * Display-only features (damageType:"") — skipped:
 *   - burst.yunjin_dmg_bonus (PostEffectStatsDef display)
 *   - skill.shield (FeatureShield)
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/YunJin.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (YunJin)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (YunJin)
 */

import type { Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { YunJin as YunJinStatTable } from "../generated/charTables.js";
import { YunJin as YunJinTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return YunJinTalents.s1.p1;
      if (name === "normal_hit_2") return YunJinTalents.s1.p2;
      if (name === "normal_hit_3_1") return YunJinTalents.s1.p3;
      if (name === "normal_hit_3_2") return YunJinTalents.s1.p4;
      if (name === "normal_hit_4_1") return YunJinTalents.s1.p5;
      if (name === "normal_hit_4_2") return YunJinTalents.s1.p6;
      if (name === "normal_hit_5") return YunJinTalents.s1.p7;
      if (name === "charged_hit") return YunJinTalents.s1.p8;
      if (name === "plunge") return YunJinTalents.s1.p10;
      if (name === "plunge_low") return YunJinTalents.s1.p11;
      if (name === "plunge_high") return YunJinTalents.s1.p12;
    }
    if (talent === "skill") {
      if (name === "press_dmg") return YunJinTalents.s2.p3;
      if (name === "yunjin_charge_1_dmg") return YunJinTalents.s2.p4;
      if (name === "yunjin_charge_2_dmg") return YunJinTalents.s2.p5;
    }
    if (talent === "burst") {
      if (name === "burst_dmg") return YunJinTalents.s3.p1;
    }
    throw new Error(`yun_jin talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (ATK-based, physical) ---
  // raw: FeatureDamageNormal normal_hit_1. YunJin.js:158-165
  {
    name: "normal_hit_1",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1") }],
  },
  // raw: FeatureDamageNormal normal_hit_2. YunJin.js:166-173
  {
    name: "normal_hit_2",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2") }],
  },
  // raw: FeatureDamageMultihit normal_hit_3 (2 hits: _3_1 + _3_2). YunJin.js:174-197
  {
    name: "normal_hit_3",
    category: "attack",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3_1") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3_2") }] },
    ],
  },
  // raw: FeatureDamageNormal normal_hit_3_1 (isChild:true → emit as standalone). YunJin.js:198-206
  {
    name: "normal_hit_3_1",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3_1") }],
  },
  // raw: FeatureDamageNormal normal_hit_3_2 (isChild:true → emit as standalone). YunJin.js:207-215
  {
    name: "normal_hit_3_2",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3_2") }],
  },
  // raw: FeatureDamageMultihit normal_hit_4 (2 hits: _4_1 + _4_2). YunJin.js:216-239
  {
    name: "normal_hit_4",
    category: "attack",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4_1") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4_2") }] },
    ],
  },
  // raw: FeatureDamageNormal normal_hit_4_1 (isChild:true → emit as standalone). YunJin.js:240-249
  {
    name: "normal_hit_4_1",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4_1") }],
  },
  // raw: FeatureDamageNormal normal_hit_4_2 (isChild:true → emit as standalone). YunJin.js:250-259
  {
    name: "normal_hit_4_2",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4_2") }],
  },
  // raw: FeatureDamageNormal normal_hit_5. YunJin.js:260-267
  {
    name: "normal_hit_5",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_5") }],
  },
  // --- Charged attack ---
  // raw: FeatureDamageCharged charged_hit. YunJin.js:268-276
  {
    name: "charged_hit",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }],
  },
  // --- Plunge attacks ---
  // raw: FeatureDamagePlungeCollision plunge. YunJin.js:277-285
  {
    name: "plunge",
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge") }],
  },
  // raw: FeatureDamagePlungeShockWave plunge_low. YunJin.js:286-293
  {
    name: "plunge_low",
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_low") }],
  },
  // raw: FeatureDamagePlungeShockWave plunge_high. YunJin.js:294-301
  {
    name: "plunge_high",
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_high") }],
  },
  // --- Skill: Opening Flourish (geo, DEF-based) ---
  // raw: FeatureDamageSkill press_dmg (scaling:'def*'). YunJin.js:304-313
  {
    name: "press_dmg",
    category: "skill",
    element: "geo",
    multipliers: [{ scaling: "def", leveling: "char_skill_elemental", values: talents.get("skill.press_dmg") }],
  },
  // raw: FeatureDamageSkill yunjin_charge_1_dmg (scaling:'def*'). YunJin.js:314-323
  {
    name: "yunjin_charge_1_dmg",
    category: "skill",
    element: "geo",
    multipliers: [{ scaling: "def", leveling: "char_skill_elemental", values: talents.get("skill.yunjin_charge_1_dmg") }],
  },
  // raw: FeatureDamageSkill yunjin_charge_2_dmg (scaling:'def*'). YunJin.js:324-333
  {
    name: "yunjin_charge_2_dmg",
    category: "skill",
    element: "geo",
    multipliers: [{ scaling: "def", leveling: "char_skill_elemental", values: talents.get("skill.yunjin_charge_2_dmg") }],
  },
  // --- Burst: Cliffbreaker's Banner (geo, ATK-based) ---
  // raw: FeatureDamageBurst burst_dmg. YunJin.js:345-353
  {
    name: "burst_dmg",
    category: "burst",
    element: "geo",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") }],
  },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Constellations (P2.C Wave-1)
// ---------------------------------------------------------------------------
// C1: ConditionStatic display-only → SKIP.
// C2: ConditionBoolean toggle (dmg_normal:15) → SKIP.
// C3 "Seafaring General" — +3 Burst talent levels (NOTE: C3 is burst, C5 is skill here).
//   raw/genshin_calc_pub/src/js/db/Char/YunJin.js:430-438 (constellation[2]).
// C4: ConditionBoolean toggle (def_percent:20) → SKIP.
// C5 "War God" — +3 Elemental Skill talent levels (NOTE: reversed C3↔C5 vs typical).
//   raw/genshin_calc_pub/src/js/db/Char/YunJin.js:452-459 (constellation[4]).
// C6: ConditionStatic{atk_speed_normal:12} gated by ConditionBoolean(yunjin_flag) → SKIP.

const constellationConditions: readonly Condition[] = [
  // C3 — char_skill_burst_bonus +3 (burst talent level up — Yun Jin reverses C3/C5).
  { type: "constellation", constellation: 3, settings: { char_skill_burst_bonus: 3 } },
  // C5 — char_skill_elemental_bonus +3 (skill talent level up).
  { type: "constellation", constellation: 5, settings: { char_skill_elemental_bonus: 3 } },
];

// partyData (Bucket C) DEFERRED: her NA-DMG buff multiplier carries bonusLeveling/
// bonusValues (yunjin_traditionalist_stacks → [2.5,5,7.5,11.5]% of DEF by party-element
// count; raw YunJin.js + Feature2/Multiplier.js getValue). Our CharMultiplier lacks a
// bonus-by-stacks term, so a faithful port needs an engine extension (cf. reverted Iansan
// ratioPerStack.multi) → engine-extension pass. Modeling it as a constant would game the gate.

export const yunJin: DbObjectChar = {
  name: "yun_jin",
  gameId: 10000064,
  rarity: 4,
  element: "geo",
  weapon: "polearm",
  origin: "liyue",
  statTable: YunJinStatTable,
  talents,
  features,
  multipliers: [],
  conditions: constellationConditions,
};
