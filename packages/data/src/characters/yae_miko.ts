/**
 * Yae Miko — electro catalyst ATK scaler.
 *
 * 3-hit normal combo (all electro), electro charged hit, plunge/low/high (electro),
 * electro skill (Sesshou Sakura: tier 1/2/3; tier 4 is C2-gated, omitted),
 * electro burst (burst_dmg + miko_thunderbolt_dmg).
 *
 * A4 "Enlightened Blessing": PostEffectStatsMastery → dmg_skill_yaemiko
 * = 0.15 × mastery, no cap. Always-active at A6.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/YaeMiko.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (YaeMiko)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (YaeMiko)
 */

import type { DbObjectChar, Feature, TalentResolver, CharPostEffect } from "@genshin/types";
import { YaeMiko as YaeMikoStatTable } from "../generated/charTables.js";
import { YaeMiko as YaeMikoTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return YaeMikoTalents.s1.p1;
      if (name === "normal_hit_2") return YaeMikoTalents.s1.p2;
      if (name === "normal_hit_3") return YaeMikoTalents.s1.p3;
      if (name === "charged_hit") return YaeMikoTalents.s1.p4;
      if (name === "plunge") return YaeMikoTalents.s1.p6;
      if (name === "plunge_low") return YaeMikoTalents.s1.p7;
      if (name === "plunge_high") return YaeMikoTalents.s1.p8;
    }
    if (talent === "skill") {
      if (name === "miko_sesshou_sakura_1_dmg") return YaeMikoTalents.s2.p1;
      if (name === "miko_sesshou_sakura_2_dmg") return YaeMikoTalents.s2.p2;
      if (name === "miko_sesshou_sakura_3_dmg") return YaeMikoTalents.s2.p3;
    }
    if (talent === "burst") {
      if (name === "burst_dmg") return YaeMikoTalents.s3.p1;
      if (name === "miko_thunderbolt_dmg") return YaeMikoTalents.s3.p2;
    }
    throw new Error(`yae_miko talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (electro catalyst, always electro) ---
  // raw: FeatureDamageNormal element='electro' (YaeMiko.js:126-133)
  {
    name: "normal_hit_1",
    category: "attack",
    element: "electro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1") }],
  },
  // raw: FeatureDamageNormal element='electro' (YaeMiko.js:135-142)
  {
    name: "normal_hit_2",
    category: "attack",
    element: "electro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2") }],
  },
  // raw: FeatureDamageNormal element='electro' (YaeMiko.js:144-151)
  {
    name: "normal_hit_3",
    category: "attack",
    element: "electro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }],
  },
  // --- Charged attack ---
  // raw: FeatureDamageCharged element='electro' (YaeMiko.js:153-160)
  {
    name: "charged_hit",
    category: "attack",
    damageType: "charged",
    element: "electro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }],
  },
  // --- Plunge attacks (electro catalyst) ---
  // raw: FeatureDamagePlungeCollision element='electro' (YaeMiko.js:162-169)
  {
    name: "plunge",
    category: "attack",
    damageType: "plunge",
    element: "electro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge") }],
  },
  // raw: FeatureDamagePlungeShockWave element='electro' (YaeMiko.js:171-178)
  {
    name: "plunge_low",
    category: "attack",
    damageType: "plunge",
    element: "electro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_low") }],
  },
  // raw: FeatureDamagePlungeShockWave element='electro' (YaeMiko.js:180-187)
  {
    name: "plunge_high",
    category: "attack",
    damageType: "plunge",
    element: "electro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_high") }],
  },
  // --- Skill: Sesshou Sakura (electro turret) ---
  // raw: FeatureDamageSkill miko_sesshou_sakura_1_dmg (YaeMiko.js:189-198)
  {
    name: "miko_sesshou_sakura_1_dmg",
    category: "skill",
    element: "electro",
    damageBonuses: ["dmg_skill_yaemiko"],
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.miko_sesshou_sakura_1_dmg") }],
  },
  // raw: FeatureDamageSkill miko_sesshou_sakura_2_dmg (YaeMiko.js:199-208)
  {
    name: "miko_sesshou_sakura_2_dmg",
    category: "skill",
    element: "electro",
    damageBonuses: ["dmg_skill_yaemiko"],
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.miko_sesshou_sakura_2_dmg") }],
  },
  // raw: FeatureDamageSkill miko_sesshou_sakura_3_dmg (YaeMiko.js:209-218)
  {
    name: "miko_sesshou_sakura_3_dmg",
    category: "skill",
    element: "electro",
    damageBonuses: ["dmg_skill_yaemiko"],
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.miko_sesshou_sakura_3_dmg") }],
  },
  // miko_sesshou_sakura_4_dmg: C2-gated (ConditionConstellation{constellation:2}) → skip
  // --- Burst: Tenko Kenshin (electro) ---
  // raw: FeatureDamageBurst burst_dmg (YaeMiko.js:230-238)
  {
    name: "burst_dmg",
    category: "burst",
    element: "electro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") }],
  },
  // raw: FeatureDamageBurst miko_thunderbolt_dmg (YaeMiko.js:239-247)
  {
    name: "miko_thunderbolt_dmg",
    category: "burst",
    element: "electro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.miko_thunderbolt_dmg") }],
  },
];

// ---------------------------------------------------------------------------
// Post-effects
// ---------------------------------------------------------------------------

// A4 "Enlightened Blessing" (YaeMiko.js:106-112): PostEffectStatsMastery
// dmg_skill_yaemiko = 0.15 × mastery, no cap.
// Always-active at A6 (ConditionAscensionChar asc4 satisfied). No capValue.
const a4PostEffects: readonly CharPostEffect[] = [
  {
    fromStat: "mastery",
    toStat: "dmg_skill_yaemiko",
    ratio: 0.15,
  },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const yaeMiko: DbObjectChar = {
  name: "yae_miko",
  gameId: 10000058,
  rarity: 5,
  element: "electro",
  weapon: "catalyst",
  origin: "inazuma",
  statTable: YaeMikoStatTable,
  talents,
  features,
  multipliers: [],
  postEffects: a4PostEffects,
};
