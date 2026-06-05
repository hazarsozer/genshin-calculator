/**
 * Jean — anemo sword ATK scaler.
 *
 * 5-hit normal combo (physical sword), charged hit, plunge/low/high (physical),
 * anemo skill (skill_dmg), anemo burst (burst_dmg + field_dmg).
 * Also has heal features (party_heal_on_hit, heal, heal_dot) but those have
 * empty damageType and are display-only — skipped by the harness.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Jean.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Jean)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Jean)
 */

import type { Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Jean as JeanStatTable } from "../generated/charTables.js";
import { Jean as JeanTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return JeanTalents.s1.p1;
      if (name === "normal_hit_2") return JeanTalents.s1.p2;
      if (name === "normal_hit_3") return JeanTalents.s1.p3;
      if (name === "normal_hit_4") return JeanTalents.s1.p4;
      if (name === "normal_hit_5") return JeanTalents.s1.p5;
      if (name === "charged_hit")  return JeanTalents.s1.p6;
      if (name === "plunge")       return JeanTalents.s1.p8;
      if (name === "plunge_low")   return JeanTalents.s1.p9;
      if (name === "plunge_high")  return JeanTalents.s1.p10;
    }
    if (talent === "skill") {
      if (name === "skill_dmg") return JeanTalents.s2.p1;
    }
    if (talent === "burst") {
      if (name === "burst_dmg") return JeanTalents.s3.p1;
      if (name === "field_dmg") return JeanTalents.s3.p2;
    }
    throw new Error(`jean talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (sword — physical) ---
  // raw/genshin_calc_pub/src/js/db/Char/Jean.js
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
  {
    name: "normal_hit_5",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_5") }],
  },
  // --- Charged attack (sword — physical) ---
  {
    name: "charged_hit",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }],
  },
  // --- Plunge attacks (sword — physical) ---
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
  // --- Skill: Gale Blade (anemo) ---
  // raw/genshin_calc_pub/src/js/db/Char/Jean.js — FeatureDamageSkill skill_dmg
  {
    name: "skill_dmg",
    category: "skill",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.skill_dmg") }],
  },
  // --- Burst: Dandelion Breeze (anemo) ---
  // raw/genshin_calc_pub/src/js/db/Char/Jean.js — FeatureDamageBurst burst_dmg + field_dmg
  {
    name: "burst_dmg",
    category: "burst",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") }],
  },
  {
    name: "field_dmg",
    category: "burst",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.field_dmg") }],
  },
];

// ---------------------------------------------------------------------------
// Constellation conditions (P2.C Wave-1)
// ---------------------------------------------------------------------------
// C1 "Spiraling Tempest": ConditionBoolean toggle (dmg_skill_jean=40) → SKIP.
// C2 "People's Aegis": ConditionBoolean toggle (atk_speed_normal, move_speed) → SKIP.
// C4 "Land's of Dandelion": ConditionBoolean toggle (enemy_res_anemo=-40) → SKIP.
// C6 "Lion's Fang, Fair Protector of Mondstadt": ConditionStatic with
//   dmg_reduction=35 — dmg_reduction is a damage-mitigation display stat, NOT a
//   damage-bonus key (doesn't appear in any feature's damageBonuses) → SKIP.
//
// Always-on: C3 (+3 burst talent), C5 (+3 skill talent).
// Sources: raw/genshin_calc_pub/src/js/db/Char/Jean.js:314-382

const constellationConditions: readonly Condition[] = [
  // C3 "When the West Wind Arises" — +3 Elemental Burst (Dandelion Breeze).
  // Raw cons[2]: new Condition({ settings: { char_skill_burst_bonus: 3 } }).
  { type: "constellation", constellation: 3, settings: { char_skill_burst_bonus: 3 } },
  // C5 "Outbursting Gust" — +3 Elemental Skill (Gale Blade).
  // Raw cons[4]: new Condition({ settings: { char_skill_elemental_bonus: 3 } }).
  { type: "constellation", constellation: 5, settings: { char_skill_elemental_bonus: 3 } },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const jean: DbObjectChar = {
  name: "jean",
  gameId: 10000003,
  rarity: 5,
  element: "anemo",
  weapon: "sword",
  origin: "mondstadt",
  statTable: JeanStatTable,
  talents,
  features,
  multipliers: [],
  conditions: constellationConditions,
  // C2 "People's Aegis" — +15% ATK speed + +15% movement speed (both damage-inert).
  // C4 "Land's of Dandelion" — enemy Anemo RES -40%.
  // Source: raw/genshin_calc_pub/src/js/db/Char/Jean.js:122,126-128,334-360,393-408
  partyData: {
    conditions: [
      {
        type: "static",
        stats: { atk_speed_normal: 15, move_speed: 15 },
        condition: { type: "boolean", name: "party.jean_peoples_aegis" },
      },
      {
        type: "static",
        stats: { enemy_res_anemo: -40 },
        condition: { type: "boolean", name: "party.jean_lands_of_dandelion" },
      },
    ],
  },
};
