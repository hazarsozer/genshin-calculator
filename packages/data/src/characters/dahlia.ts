/**
 * Dahlia — hydro sword ATK scaler.
 *
 * 4-hit normal combo (physical sword), n3 2-hit multihit (children normal_hit_3_1
 * and normal_hit_3_2 — isChild:true in raw → drop isChild to emit both), charged
 * 2-hit multihit (children charged_hit_1/2 — isChild:true → drop isChild to emit),
 * plunge/low/high (physical), hydro skill (skill_dmg), hydro burst (burst_dmg).
 *
 * NOTE: In the raw JS, normal_hit_4, plunge, plunge_low, plunge_high, skill, and
 * burst features are declared without explicit `name` fields (Dahlia.js:208-215,
 * 260-283, 284-292, 293-301). Their fixture keys match the talent-table path names
 * used in the talent items. We assign explicit names here to match the oracle.
 *
 * Shield display (burst.dahlia_base_shield_dmg_absorption) and ATK-speed bonus display
 * (burst.dahlia_atk_speed_bonus) have empty damageType → not damage triples; omitted.
 *
 * A1 "The Wind's Gentle Grace": ConditionStatic display-only → no stats.
 * A4 "Prayer of Well-Wrought Joy": PostEffectStatsHP (HP→atk_speed%) gated by
 * ConditionBoolean → requires toggle; NOT auto-active at canonical solo C0 build.
 * C2 shield bonus: ConditionBoolean C2-gated → omit.
 * C6 atk_speed: ConditionBoolean C6-gated → omit.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Dahlia.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Dahlia)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Dahlia)
 */

import type { Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Dahlia as DahliaStatTable } from "../generated/charTables.js";
import { Dahlia as DahliaTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1")  return DahliaTalents.s1.p1;
      if (name === "normal_hit_2")  return DahliaTalents.s1.p2;
      if (name === "normal_hit_3_1") return DahliaTalents.s1.p3;
      if (name === "normal_hit_3_2") return DahliaTalents.s1.p4;
      if (name === "normal_hit_4")  return DahliaTalents.s1.p5;
      if (name === "charged_hit_1") return DahliaTalents.s1.p6;
      if (name === "charged_hit_2") return DahliaTalents.s1.p7;
      if (name === "plunge")        return DahliaTalents.s1.p9;
      if (name === "plunge_low")    return DahliaTalents.s1.p10;
      if (name === "plunge_high")   return DahliaTalents.s1.p11;
    }
    if (talent === "skill") {
      if (name === "skill_dmg") return DahliaTalents.s2.p1;
    }
    if (talent === "burst") {
      if (name === "burst_dmg") return DahliaTalents.s3.p1;
    }
    throw new Error(`dahlia talents: unknown path '${path}'`);
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
  // raw: FeatureDamageMultihit normal_hit_3 (parent = _3_1 + _3_2)
  // raw/genshin_calc_pub/src/js/db/Char/Dahlia.js:164-187
  {
    name: "normal_hit_3",
    category: "attack",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3_1") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3_2") }] },
    ],
  },
  // raw: FeatureDamageNormal normal_hit_3_1 (isChild:true → drop isChild to emit)
  {
    name: "normal_hit_3_1",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3_1") }],
  },
  // raw: FeatureDamageNormal normal_hit_3_2 (isChild:true → drop isChild to emit)
  {
    name: "normal_hit_3_2",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3_2") }],
  },
  // raw: FeatureDamageNormal normal_hit_4 (no explicit name in raw; fixture key = attack.normal_hit_4)
  // raw/genshin_calc_pub/src/js/db/Char/Dahlia.js:208-215
  {
    name: "normal_hit_4",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4") }],
  },
  // --- Charged attacks ---
  // raw: FeatureDamageMultihit charged_hit_total (parent = _1 + _2)
  // raw/genshin_calc_pub/src/js/db/Char/Dahlia.js:216-239
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
  // raw: FeatureDamagePlungeCollision (no explicit name in raw; fixture key = attack.plunge)
  // raw/genshin_calc_pub/src/js/db/Char/Dahlia.js:260-267
  {
    name: "plunge",
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge") }],
  },
  // raw: FeatureDamagePlungeShockWave (no explicit name; fixture key = attack.plunge_low)
  // raw/genshin_calc_pub/src/js/db/Char/Dahlia.js:268-275
  {
    name: "plunge_low",
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_low") }],
  },
  // raw: FeatureDamagePlungeShockWave (no explicit name; fixture key = attack.plunge_high)
  // raw/genshin_calc_pub/src/js/db/Char/Dahlia.js:276-283
  {
    name: "plunge_high",
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_high") }],
  },
  // --- Skill: Immersive Ordinance (hydro) ---
  // raw: FeatureDamageSkill (element:'hydro', no explicit name; fixture key = skill.skill_dmg)
  // raw/genshin_calc_pub/src/js/db/Char/Dahlia.js:284-292
  {
    name: "skill_dmg",
    category: "skill",
    element: "hydro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.skill_dmg") }],
  },
  // --- Burst: Radiant Psalter (hydro) ---
  // raw: FeatureDamageBurst (element:'hydro', no explicit name; fixture key = burst.burst_dmg)
  // raw/genshin_calc_pub/src/js/db/Char/Dahlia.js:293-301
  {
    name: "burst_dmg",
    category: "burst",
    element: "hydro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") }],
  },
];

// ---------------------------------------------------------------------------
// Constellation conditions (P2.C)
// ---------------------------------------------------------------------------
// C1 "Infallible Procession": ConditionStatic no stats → display-only, SKIP.
// C2 "Revelation of Mercy": ConditionBoolean shield toggle → SKIP.
// C4 "Collect of the Assembly": ConditionStatic no stats → display-only, SKIP.
// C6 "You Shall Go Out with Joy": ConditionBoolean atk_speed toggle → SKIP.
//
// Source: raw/genshin_calc_pub/src/js/db/Char/Dahlia.js:341-402

const constellationConditions: readonly Condition[] = [
  // C3 "Unity of Heart": +3 levels to Immersive Ordinance (Elemental Skill).
  // Raw cons[2]: Condition{ settings:{ char_skill_elemental_bonus: 3 } }.
  { type: "constellation", constellation: 3, settings: { char_skill_elemental_bonus: 3 } },
  // C5 "Everlasting Dedication": +3 levels to Radiant Psalter (Elemental Burst).
  // Raw cons[4]: Condition{ settings:{ char_skill_burst_bonus: 3 } }.
  { type: "constellation", constellation: 5, settings: { char_skill_burst_bonus: 3 } },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const dahlia: DbObjectChar = {
  name: "dahlia",
  gameId: 10000115,
  rarity: 4,
  element: "hydro",
  weapon: "sword",
  origin: "mondstadt",
  statTable: DahliaStatTable,
  talents,
  features,
  multipliers: [],
  conditions: constellationConditions,
};
