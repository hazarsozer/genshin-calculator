/**
 * Qiqi — cryo sword ATK scaler.
 *
 * 5-hit normal combo (physical sword), n3 and n4 each a 2-hit multihit with
 * child _3_1 / _4_1. Charged: 2x same multiplier (charged_hit_total parent +
 * charged_hit child). Plunge/low/high physical. Cryo skill (skill_dmg +
 * herald_of_frost dot). Heals (skill.party_heal_on_hit, skill.heal_dot, burst.heal)
 * modelled as output:{kind:"heal"} (ATK-scaled, P3.5.3). Cryo burst (burst_dmg).
 *
 * A1 "Life-Prolonging Methods" is a conditional toggle (ConditionBoolean) →
 * not active in the fixed solo build; omitted.
 * A4 "A Glimpse Into Arcanum" is ConditionStatic text_only (description only) → no stats.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Qiqi.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Qiqi)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Qiqi)
 */

import type { Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Qiqi as QiqiStatTable } from "../generated/charTables.js";
import { Qiqi as QiqiTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return QiqiTalents.s1.p1;
      if (name === "normal_hit_2") return QiqiTalents.s1.p2;
      if (name === "normal_hit_3") return QiqiTalents.s1.p3;
      if (name === "normal_hit_4") return QiqiTalents.s1.p4;
      if (name === "normal_hit_5") return QiqiTalents.s1.p5;
      // charged_hit and plunge share the same multiplier table (s1.p6).
      // raw/genshin_calc_pub/src/js/db/Char/Qiqi.js:52-54 and :62
      if (name === "charged_hit") return QiqiTalents.s1.p6;
      if (name === "plunge") return QiqiTalents.s1.p6;
      if (name === "plunge_low") return QiqiTalents.s1.p9;
      if (name === "plunge_high") return QiqiTalents.s1.p10;
    }
    if (talent === "skill") {
      if (name === "skill_dmg") return QiqiTalents.s2.p8;
      if (name === "qiqi_herald_of_frost") return QiqiTalents.s2.p5;
      if (name === "party_heal_on_hit_percent") return QiqiTalents.s2.p1;
      if (name === "party_heal_on_hit_flat")    return QiqiTalents.s2.p2;
      if (name === "heal_dot_percent")          return QiqiTalents.s2.p3;
      if (name === "heal_dot_flat")             return QiqiTalents.s2.p4;
    }
    if (talent === "burst") {
      if (name === "burst_dmg") return QiqiTalents.s3.p3;
      if (name === "heal_percent") return QiqiTalents.s3.p1;
      if (name === "heal_flat")    return QiqiTalents.s3.p2;
    }
    throw new Error(`qiqi talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (physical sword, no element override) ---
  // raw/genshin_calc_pub/src/js/db/Char/Qiqi.js:155-163
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
  // normal_hit_3: 2-hit multihit parent (items × 2 of p3).
  // raw/genshin_calc_pub/src/js/db/Char/Qiqi.js:173-189
  {
    name: "normal_hit_3",
    category: "attack",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }] },
    ],
  },
  // Child: individual hit of normal_hit_3.
  // raw/genshin_calc_pub/src/js/db/Char/Qiqi.js:190-200
  {
    name: "normal_hit_3_1",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }],
  },
  // normal_hit_4: 2-hit multihit parent (items × 2 of p4).
  // raw/genshin_calc_pub/src/js/db/Char/Qiqi.js:201-217
  {
    name: "normal_hit_4",
    category: "attack",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4") }] },
    ],
  },
  // Child: individual hit of normal_hit_4.
  // raw/genshin_calc_pub/src/js/db/Char/Qiqi.js:218-228
  {
    name: "normal_hit_4_1",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4") }],
  },
  {
    name: "normal_hit_5",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_5") }],
  },
  // charged_hit_total: 2x charged_hit multihit parent.
  // raw/genshin_calc_pub/src/js/db/Char/Qiqi.js:238-254
  {
    name: "charged_hit_total",
    category: "attack",
    damageType: "charged",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }] },
    ],
  },
  // Child: individual charged hit.
  // raw/genshin_calc_pub/src/js/db/Char/Qiqi.js:255-265
  {
    name: "charged_hit",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }],
  },
  // --- Plunge attacks (physical) ---
  // raw/genshin_calc_pub/src/js/db/Char/Qiqi.js:266-292
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
  // --- Skill: Herald of Frost ---
  // skill_dmg: cryo initial hit on cast.
  // raw/genshin_calc_pub/src/js/db/Char/Qiqi.js:293-302
  {
    name: "skill_dmg",
    category: "skill",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.skill_dmg") }],
  },
  // qiqi_herald_of_frost: cryo periodic hit during skill duration.
  // raw/genshin_calc_pub/src/js/db/Char/Qiqi.js:303-312
  {
    name: "qiqi_herald_of_frost",
    category: "skill",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.qiqi_herald_of_frost") }],
  },
  // --- Burst: Preserver of Fortune ---
  // burst_dmg: cryo burst hit.
  // raw/genshin_calc_pub/src/js/db/Char/Qiqi.js:334-343
  {
    name: "burst_dmg",
    category: "burst",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") }],
  },
  // --- Heals (FeatureHeal) — ATK-scaled (her default scaling), output:{kind:"heal"} ---
  // skill.party_heal_on_hit: Herald of Frost on-hit party heal — ATK% (s2.p1) + flat (s2.p2).
  // raw/genshin_calc_pub/src/js/db/Char/Qiqi.js:313-322 (FeatureMultiplierList, char_skill_elemental, partyHeal)
  {
    name: "party_heal_on_hit",
    category: "skill",
    output: { kind: "heal", partyHeal: true },
    multipliers: [
      { leveling: "char_skill_elemental", values: talents.get("skill.party_heal_on_hit_percent"), flatValues: talents.get("skill.party_heal_on_hit_flat") },
    ],
  },
  // skill.heal_dot: Herald of Frost per-tick heal — ATK% (s2.p3) + flat (s2.p4).
  // raw/genshin_calc_pub/src/js/db/Char/Qiqi.js:324-333 (FeatureMultiplierList, char_skill_elemental)
  {
    name: "heal_dot",
    category: "skill",
    output: { kind: "heal" },
    multipliers: [
      { leveling: "char_skill_elemental", values: talents.get("skill.heal_dot_percent"), flatValues: talents.get("skill.heal_dot_flat") },
    ],
  },
  // burst.heal: Preserver of Fortune heal — ATK% (s3.p1) + flat (s3.p2).
  // raw/genshin_calc_pub/src/js/db/Char/Qiqi.js:344-353 (FeatureMultiplierList, char_skill_burst)
  {
    name: "heal",
    category: "burst",
    output: { kind: "heal" },
    multipliers: [
      { leveling: "char_skill_burst", values: talents.get("burst.heal_percent"), flatValues: talents.get("burst.heal_flat") },
    ],
  },
];

// ---------------------------------------------------------------------------
// Constellation conditions (P2.C Wave-1)
// ---------------------------------------------------------------------------
// C1 "Ascetics of Frost": ConditionStatic with no real stats (description only) → SKIP.
// C2 "Frozen to the Bone": ConditionStatic with dmg_normal/dmg_charged +15, gated by
//    constellation 2 AND subCondition ConditionEnemyStatus({status:['cryo']}). The port SKIPPED
//    the SELF version (golden-blind: no golden sets common.enemy_status='cryo'). Now ported as a
//    constellation-2 condition with the enemy-status sub-gate. raw Qiqi.js:388-401 (C2NormalDmg=15).
// C3 "Canticle of Cultivar": +3 Elemental Burst talent levels.
//    Raw cons[2]: Condition{ settings:{ char_skill_burst_bonus:3 } }
// C4 "Divine Suppression": ConditionStatic with no real stats → SKIP.
// C5 "Crimson Lotus Flower": +3 Elemental Skill talent levels.
//    Raw cons[4]: Condition{ settings:{ char_skill_elemental_bonus:3 } }
// C6 "Rite of Resurrection": ConditionStatic with no real stats → SKIP.
//
// Sources: raw/genshin_calc_pub/src/js/db/Char/Qiqi.js:378-438

const constellationConditions: readonly Condition[] = [
  // C2 "Frozen to the Bone": +15% Normal/Charged DMG vs cryo-afflicted enemies, gated C2.
  // Raw cons[1]: ConditionStatic{ stats:{ dmg_normal:15, dmg_charged:15 },
  //   subConditions:[ ConditionEnemyStatus({status:['cryo']}) ] } → modelled as a C2-gated
  //   condition with the enemy-status sub-gate (active only when common.enemy_status='cryo').
  {
    type: "static",
    name: "qiqi_frozen_to_the_bone",
    stats: { dmg_normal: 15, dmg_charged: 15 },
    condition: {
      type: "and",
      items: [
        { type: "constellation", constellation: 2 },
        { type: "enemy-status", statuses: ["cryo"] },
      ],
    },
  },
  // C3: +3 Elemental Burst (Preserver of Fortune).
  // Raw cons[2]: new Condition({ settings: { char_skill_burst_bonus: 3 } }).
  { type: "constellation", constellation: 3, settings: { char_skill_burst_bonus: 3 } },
  // C5: +3 Elemental Skill (Herald of Frost).
  // Raw cons[4]: new Condition({ settings: { char_skill_elemental_bonus: 3 } }).
  { type: "constellation", constellation: 5, settings: { char_skill_elemental_bonus: 3 } },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const qiqi: DbObjectChar = {
  name: "qiqi",
  gameId: 10000035,
  rarity: 5,
  element: "cryo",
  weapon: "sword",
  origin: "liyue",
  statTable: QiqiStatTable,
  talents,
  features,
  multipliers: [],
  conditions: constellationConditions,
  // A4 "Life-Prolonging Methods" — +20% Healing Received (healing_recv is damage-inert).
  // Block ported faithfully; no oracle rep (no damage delta).
  // Source: raw/genshin_calc_pub/src/js/db/Char/Qiqi.js (partyData conditions)
  partyData: {
    conditions: [
      {
        type: "static",
        stats: { healing_recv: 20 },
        condition: { type: "boolean", name: "party.qiqi_life_prolonging_methods" },
      },
    ],
  },
};
