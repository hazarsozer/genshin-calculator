/**
 * Hu Tao — full P1.7b character data (HP-scaling exemplar).
 *
 * Replaces the minimal P1.7a test stub with real CharTables / CharTalentTables data.
 * Features include all damage moves (attack/charged/plunge + skill blood blossom + burst),
 * the Paramita Papilio HP→ATK post-effect, and the Paramita condition.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Hutao.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js:1342
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js:2085
 */

import type {
  CharPostEffect,
  Condition,
  DbObjectChar,
  Feature,
  TalentResolver,
} from "@genshin/types";
import { Hutao as HutaoStatTable } from "../generated/charTables.js";
import { Hutao as HutaoTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return HutaoTalents.s1.p1;
      if (name === "normal_hit_2") return HutaoTalents.s1.p2;
      if (name === "normal_hit_3") return HutaoTalents.s1.p3;
      if (name === "normal_hit_4") return HutaoTalents.s1.p4;
      if (name === "normal_hit_5_1") return HutaoTalents.s1.p5;
      if (name === "normal_hit_5_2") return HutaoTalents.s1.p6;
      if (name === "normal_hit_6") return HutaoTalents.s1.p7;
      if (name === "charged_hit") return HutaoTalents.s1.p8;
      if (name === "plunge") return HutaoTalents.s1.p10;
      if (name === "plunge_low") return HutaoTalents.s1.p11;
      if (name === "plunge_high") return HutaoTalents.s1.p12;
    }
    if (talent === "skill") {
      if (name === "hutao_atk_bonus") return HutaoTalents.s2.p2;
      if (name === "hutao_blood_blossom") return HutaoTalents.s2.p3;
    }
    if (talent === "burst") {
      if (name === "burst_dmg") return HutaoTalents.s3.p1;
      if (name === "hutao_burst_dmg_lowhp") return HutaoTalents.s3.p2;
      if (name === "heal") return HutaoTalents.s3.p3;
      if (name === "hutao_heal_lowhp") return HutaoTalents.s3.p4;
    }
    throw new Error(`hu-tao talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Conditions
// ---------------------------------------------------------------------------

const paramita: Condition = {
  type: "boolean",
  name: "hutao_paramita_papilio",
};

// ---------------------------------------------------------------------------
// Post-effects
// ---------------------------------------------------------------------------

/**
 * HP→ATK conversion during Paramita Papilio (Guide to Afterlife skill).
 * ratio = hutao_atk_bonus @ skill level 10 × 0.01 = 6.256 × 0.01 = 0.06256
 * cap = 400% of atk_base (cap.capRatio = 4 on atk_base, but getTotal reads "atk")
 *
 * Source: Hutao.js:145-159
 */
const hpToAtk: CharPostEffect = {
  priority: 1,
  fromStat: "hp",
  toStat: "atk",
  ratio: HutaoTalents.s2.p2.getValue(10) * 0.01,
  cap: { capStat: "atk", capRatio: 4 },
  conditions: [paramita],
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks ---
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
  // normal_hit_5: multihit (two sub-items), models the combined hit
  {
    name: "normal_hit_5",
    category: "attack",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_5_1") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_5_2") }] },
    ],
  },
  // Child hits (isChild = true — excluded from compileCharacter rotation by default)
  {
    name: "normal_hit_5_1",
    category: "attack",
    isChild: true,
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_5_1") }],
  },
  {
    name: "normal_hit_5_2",
    category: "attack",
    isChild: true,
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_5_2") }],
  },
  {
    name: "normal_hit_6",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_6") }],
  },
  // --- Charged attack ---
  {
    name: "charged_hit",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }],
  },
  // --- Plunge attacks (her FeatureDamagePlunge: category="attack", damageType="plunge") ---
  {
    name: "plunge",
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge") }],
  },
  {
    name: "plunge_low",
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_low") }],
  },
  {
    name: "plunge_high",
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_high") }],
  },
  // --- Skill: Blood Blossom ---
  {
    name: "hutao_blood_blossom",
    category: "skill",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.hutao_blood_blossom") }],
  },
  // --- Burst: Spirit Soother ---
  {
    name: "burst_dmg",
    category: "burst",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") }],
  },
  {
    name: "hutao_burst_dmg_lowhp",
    category: "burst",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.hutao_burst_dmg_lowhp") }],
  },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const huTao: DbObjectChar = {
  name: "hu_tao",
  gameId: 10000046,
  rarity: 5,
  element: "pyro",
  weapon: "polearm",
  origin: "liyue",
  statTable: HutaoStatTable,
  talents,
  features,
  multipliers: [],
  postEffects: [hpToAtk],
  conditions: [paramita],
};
