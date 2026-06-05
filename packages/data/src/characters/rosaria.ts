/**
 * Rosaria — cryo polearm ATK scaler.
 *
 * 5-hit normal combo (n3: 2-hit multihit → child _3_1; n5: 2-sub-hit multihit
 * → children _5_1/_5_2), cryo charged hit, plunge/low/high, cryo skill
 * (stab + slash, both as children with skill_dmg as multihit parent),
 * cryo burst (swing + lance_dmg children + ice lance periodoic, burst_dmg parent),
 * burst display-only rosaria_crit_dmg_buff (no damageType, skipped by harness).
 *
 * No always-on passive ATK/crit bonuses: A1 is ConditionBoolean (toggle), A4 is
 * ConditionStatic text_only. The cryo stat bonus from the ascension passive is
 * already folded into the stat table via the generated charTables.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Rosaria.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Rosaria)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Rosaria)
 */

import type { CharPostEffect, Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Rosaria as RosariaStatTable } from "../generated/charTables.js";
import { Rosaria as RosariaTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return RosariaTalents.s1.p1;
      if (name === "normal_hit_2") return RosariaTalents.s1.p2;
      if (name === "normal_hit_3") return RosariaTalents.s1.p3;
      if (name === "normal_hit_4") return RosariaTalents.s1.p4;
      if (name === "normal_hit_5_1") return RosariaTalents.s1.p5;
      if (name === "normal_hit_5_2") return RosariaTalents.s1.p6;
      if (name === "charged_hit") return RosariaTalents.s1.p7;
      if (name === "plunge") return RosariaTalents.s1.p9;
      if (name === "plunge_low") return RosariaTalents.s1.p10;
      if (name === "plunge_high") return RosariaTalents.s1.p11;
    }
    if (talent === "skill") {
      if (name === "rosaria_stab_dmg") return RosariaTalents.s2.p1;
      if (name === "rosaria_slash_dmg") return RosariaTalents.s2.p2;
    }
    if (talent === "burst") {
      if (name === "rosaria_swing_dmg") return RosariaTalents.s3.p1;
      if (name === "rosaria_burst_lance_dmg") return RosariaTalents.s3.p2;
      if (name === "rosaria_ice_lance") return RosariaTalents.s3.p3;
    }
    throw new Error(`rosaria talents: unknown path '${path}'`);
  },
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
  // normal_hit_3: 2-hit multihit (same multiplier × 2). Parent models the total.
  // raw: FeatureDamageMultihit({ items: [{ hits: 2, multipliers: [p3] }] })
  {
    name: "normal_hit_3",
    category: "attack",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }] },
    ],
  },
  // Child hit: one of the 2 hits of normal_hit_3 (half the parent total).
  // raw/genshin_calc_pub/src/js/db/Char/Rosaria.js:168-179
  {
    name: "normal_hit_3_1",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }],
  },
  {
    name: "normal_hit_4",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4") }],
  },
  // normal_hit_5: 2-sub-hit multihit with two different tables (_5_1 and _5_2).
  // raw: FeatureDamageMultihit({ items: [{ multipliers: [p5] }, { multipliers: [p6] }] })
  {
    name: "normal_hit_5",
    category: "attack",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_5_1") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_5_2") }] },
    ],
  },
  // Sub-hits of normal_hit_5 (individual components of the 2-part combo).
  // raw/genshin_calc_pub/src/js/db/Char/Rosaria.js:211-231
  {
    name: "normal_hit_5_1",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_5_1") }],
  },
  {
    name: "normal_hit_5_2",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_5_2") }],
  },
  // --- Charged attack (cryo polearm — physical by default, no element override) ---
  {
    name: "charged_hit",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }],
  },
  // --- Plunge attacks ---
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
  // --- Skill: Ravaging Confession (cryo) ---
  // skill_dmg: 2-hit multihit parent (stab + slash).
  // raw/genshin_calc_pub/src/js/db/Char/Rosaria.js:268-291
  {
    name: "skill_dmg",
    category: "skill",
    element: "cryo",
    items: [
      { multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.rosaria_stab_dmg") }] },
      { multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.rosaria_slash_dmg") }] },
    ],
  },
  // Individual skill hits (sub-components of skill_dmg, shown separately in fixture).
  // raw/genshin_calc_pub/src/js/db/Char/Rosaria.js:292-313
  {
    name: "rosaria_stab_dmg",
    category: "skill",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.rosaria_stab_dmg") }],
  },
  {
    name: "rosaria_slash_dmg",
    category: "skill",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.rosaria_slash_dmg") }],
  },
  // --- Burst: Rites of Termination (cryo) ---
  // burst_dmg: 2-hit multihit parent (swing + lance).
  // raw/genshin_calc_pub/src/js/db/Char/Rosaria.js:314-337
  {
    name: "burst_dmg",
    category: "burst",
    element: "cryo",
    items: [
      { multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.rosaria_swing_dmg") }] },
      { multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.rosaria_burst_lance_dmg") }] },
    ],
  },
  // Individual burst hits (sub-components of burst_dmg, shown separately in fixture).
  // raw/genshin_calc_pub/src/js/db/Char/Rosaria.js:338-360
  {
    name: "rosaria_swing_dmg",
    category: "burst",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.rosaria_swing_dmg") }],
  },
  {
    name: "rosaria_burst_lance_dmg",
    category: "burst",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.rosaria_burst_lance_dmg") }],
  },
  // rosaria_ice_lance: periodic cryo lance during burst.
  // raw/genshin_calc_pub/src/js/db/Char/Rosaria.js:360-369
  {
    name: "rosaria_ice_lance",
    category: "burst",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.rosaria_ice_lance") }],
  },
];

// ---------------------------------------------------------------------------
// Constellation conditions (P2.C Wave-1)
// ---------------------------------------------------------------------------
// C1 "Unholy Revelation": ConditionBoolean toggle (atk_speed_normal + dmg_normal) → SKIP.
// C2 "Land Without Promise": ConditionStatic with no real stats (description only) → SKIP.
// C3 "The Wages of Sin": +3 Elemental Skill talent levels.
//    Raw cons[2]: Condition{ settings:{ char_skill_elemental_bonus:3 } }
// C4 "Painful Grace": ConditionStatic with no real stats (description only) → SKIP.
// C5 "Last Rites": +3 Elemental Burst talent levels.
//    Raw cons[4]: Condition{ settings:{ char_skill_burst_bonus:3 } }
// C6 "Divine Retribution": ConditionBoolean toggle (enemy_res_phys -20) → SKIP.
//
// Sources: raw/genshin_calc_pub/src/js/db/Char/Rosaria.js:407-469

const constellationConditions: readonly Condition[] = [
  // C3: +3 Elemental Skill (Ravaging Confession).
  // Raw cons[2]: new Condition({ settings: { char_skill_elemental_bonus: 3 } }).
  { type: "constellation", constellation: 3, settings: { char_skill_elemental_bonus: 3 } },
  // C5: +3 Elemental Burst (Rites of Termination).
  // Raw cons[4]: new Condition({ settings: { char_skill_burst_bonus: 3 } }).
  { type: "constellation", constellation: 5, settings: { char_skill_burst_bonus: 3 } },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const rosaria: DbObjectChar = {
  name: "rosaria",
  gameId: 10000045,
  rarity: 4,
  element: "cryo",
  weapon: "polearm",
  origin: "mondstadt",
  statTable: RosariaStatTable,
  talents,
  features,
  multipliers: [],
  conditions: constellationConditions,
  // partyData — teammate kit buffs (P3.5.2 Bucket B).
  // Source: raw/genshin_calc_pub/src/js/db/Char/Rosaria.js:470-535
  // Scope: oracle-gated core only — A4 "Shadow Samaritan" crit-rate share.
  // Deferred to the P3.5.2 variant-rep pass:
  //   C6 "Divine Retribution": enemy_res_phys:-20 (static shred, separate oracle rep needed).
  partyData: {
    loadStats: {
      stats: ["crit_rate_total"],
    },
    conditions: [
      // ConditionNumber: lifts the teammate's crit_rate_total into the recipient's stat bag.
      { type: "number", name: "rosaria_crit_rate_total", max: 100 },
      // Shadow Samaritan master toggle (A4 passive; gates the crit-rate postEffect below).
      { type: "boolean", name: "party.rosaria_shadow_samaritan" },
    ],
    postEffects: [
      // A4 "Shadow Samaritan": shares 15% of Rosaria's crit rate, hard-capped at 15%.
      // Raw: percent: StatTable('crit_rate', [0.15]), statCap: ValueTable([15])
      // Source: raw/genshin_calc_pub/src/js/db/Char/Rosaria.js:523-532
      {
        fromStat: "rosaria_crit_rate_total",
        toStat: "crit_rate",
        ratio: 0.15,
        capValue: 15,
        conditions: [{ type: "boolean", name: "party.rosaria_shadow_samaritan" }],
      } satisfies CharPostEffect,
    ],
  },
};
