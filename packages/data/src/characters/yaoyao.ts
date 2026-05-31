/**
 * Yaoyao — dendro polearm ATK scaler.
 *
 * 4-hit normal combo (n3: 2-hit multihit → children _3_1/_3_2), charged hit,
 * plunge/low/high, dendro skill (yaoyao_radish_dmg), dendro burst (burst_dmg +
 * yaoyao_white_radish_dmg).
 *
 * Several features in raw have no explicit `name` — their key is derived from the
 * first multiplier's StatTable name (her Feature2 name-fallback pattern). In our
 * port, every feature gets an explicit name matching the fixture key.
 *
 * Heals (yaoyao_radish_heal, yaoyao_in_others_shoes_heal, yaoyao_white_radish_heal)
 * and other.mastery_bonus have empty damageType → not tested by golden suite.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Yaoyao.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Yaoyao)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Yaoyao)
 */

import type { DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Yaoyao as YaoyaoStatTable } from "../generated/charTables.js";
import { Yaoyao as YaoyaoTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return YaoyaoTalents.s1.p1;
      if (name === "normal_hit_2") return YaoyaoTalents.s1.p2;
      if (name === "normal_hit_3_1") return YaoyaoTalents.s1.p3;
      if (name === "normal_hit_3_2") return YaoyaoTalents.s1.p4;
      if (name === "normal_hit_4") return YaoyaoTalents.s1.p5;
      if (name === "charged_hit") return YaoyaoTalents.s1.p6;
      if (name === "plunge") return YaoyaoTalents.s1.p8;
      if (name === "plunge_low") return YaoyaoTalents.s1.p9;
      if (name === "plunge_high") return YaoyaoTalents.s1.p10;
    }
    if (talent === "skill") {
      if (name === "yaoyao_radish_dmg") return YaoyaoTalents.s2.p1;
    }
    if (talent === "burst") {
      if (name === "burst_dmg") return YaoyaoTalents.s3.p4;
      if (name === "yaoyao_white_radish_dmg") return YaoyaoTalents.s3.p1;
    }
    throw new Error(`yaoyao talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks ---
  // raw: FeatureDamageNormal normal_hit_1 (explicit name)
  {
    name: "normal_hit_1",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1") }],
  },
  // raw: FeatureDamageNormal normal_hit_2 (explicit name)
  {
    name: "normal_hit_2",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2") }],
  },
  // raw: FeatureDamageMultihit normal_hit_3 (parent = _3_1 + _3_2)
  {
    name: "normal_hit_3",
    category: "attack",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3_1") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3_2") }] },
    ],
  },
  // raw: FeatureDamageNormal isChild:true (name derived → 'normal_hit_3_1') → drop isChild to emit
  {
    name: "normal_hit_3_1",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3_1") }],
  },
  // raw: FeatureDamageNormal isChild:true (name derived → 'normal_hit_3_2') → drop isChild to emit
  {
    name: "normal_hit_3_2",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3_2") }],
  },
  // raw: FeatureDamageNormal normal_hit_4 (explicit name)
  {
    name: "normal_hit_4",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4") }],
  },
  // --- Charged attack (no explicit name → derived 'charged_hit') ---
  // raw: FeatureDamageCharged, name from multipliers[0].getName() = 'charged_hit'
  {
    name: "charged_hit",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }],
  },
  // --- Plunge attacks (no explicit names → derived from talent table) ---
  // raw: FeatureDamagePlungeCollision, name → 'plunge'
  {
    name: "plunge",
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge") }],
  },
  // raw: FeatureDamagePlungeShockWave, name → 'plunge_low'
  {
    name: "plunge_low",
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_low") }],
  },
  // raw: FeatureDamagePlungeShockWave, name → 'plunge_high'
  {
    name: "plunge_high",
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_high") }],
  },
  // --- Skill: Raphanus Sky Cluster (dendro) ---
  // raw: FeatureDamageSkill, no explicit name → derived 'yaoyao_radish_dmg'
  {
    name: "yaoyao_radish_dmg",
    category: "skill",
    element: "dendro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.yaoyao_radish_dmg") }],
  },
  // --- Burst: Moonjade Descent (dendro) ---
  // raw: FeatureDamageBurst, no explicit name → derived 'burst_dmg' (from s3.p4)
  {
    name: "burst_dmg",
    category: "burst",
    element: "dendro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") }],
  },
  // raw: FeatureDamageBurst, no explicit name → derived 'yaoyao_white_radish_dmg' (from s3.p1)
  {
    name: "yaoyao_white_radish_dmg",
    category: "burst",
    element: "dendro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.yaoyao_white_radish_dmg") }],
  },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const yaoyao: DbObjectChar = {
  name: "yaoyao",
  gameId: 10000077,
  rarity: 4,
  element: "dendro",
  weapon: "polearm",
  origin: "liyue",
  statTable: YaoyaoStatTable,
  talents,
  features,
  multipliers: [],
};
