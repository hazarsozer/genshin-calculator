/**
 * Yelan — hydro bow HP scaler.
 *
 * 4-hit normal combo (physical bow). Normal hit 4 appears as a simple
 * feature in the raw (not a separate multihit parent/children).
 *
 * Charged attacks:
 *   aimed — physical aimed shot (FeatureDamageChargedAimed, no element)
 *   charged_aimed — hydro full-charge aimed shot
 *   yelan_breakthrough_barb_dmg — hydro, HP-scaled (scaling:'hp*')
 *
 * Plunge: plunge / plunge_low / plunge_high (physical bow).
 *
 * Skill: skill_dmg — hydro, HP-scaled (scaling:'hp*').
 *
 * Burst:
 *   burst_dmg — hydro, HP-scaled (scoring:'hp*')
 *   yelan_exquisite_throw_dmg — hydro, HP-scaled
 *
 * A1 "Turn Control": ConditionStaticLevel + ConditionCalcElements. The oracle
 * computes with a single-char party (Yelan herself = 1 unique element), so
 * party_elements_count_level=1 → hp_percent:6 is always applied. Fold into
 * baseStats so our hp_total matches.
 * A4 crit_rate ascension bonus IS folded in via charTables (asc6 = +19.2).
 *
 * C6 yelan_breakthrough_barb_c6_dmg and C2 burst feature — constellation-gated, omit.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Yelan.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Yelan)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Yelan)
 */

import type { DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Yelan as YelanStatTable } from "../generated/charTables.js";
import { Yelan as YelanTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1")                return YelanTalents.s1.p1;
      if (name === "normal_hit_2")                return YelanTalents.s1.p2;
      if (name === "normal_hit_3")                return YelanTalents.s1.p3;
      if (name === "normal_hit_4")                return YelanTalents.s1.p4;
      if (name === "aimed")                       return YelanTalents.s1.p5;
      if (name === "charged_aimed")               return YelanTalents.s1.p6;
      if (name === "yelan_breakthrough_barb_dmg") return YelanTalents.s1.p7;
      if (name === "plunge")                      return YelanTalents.s1.p8;
      if (name === "plunge_low")                  return YelanTalents.s1.p9;
      if (name === "plunge_high")                 return YelanTalents.s1.p10;
    }
    if (talent === "skill") {
      if (name === "skill_dmg") return YelanTalents.s2.p1;
    }
    if (talent === "burst") {
      if (name === "burst_dmg")                   return YelanTalents.s3.p1;
      if (name === "yelan_exquisite_throw_dmg")   return YelanTalents.s3.p2;
    }
    throw new Error(`yelan talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (physical bow) ---
  // raw: FeatureDamageNormal (no explicit name — engine infers from talent key)
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
  // normal_hit_4: single FeatureDamageNormal in raw (the talent type:'multihit' hits:3
  // is a talent-display hint only; the feature itself is one damage instance).
  {
    name: "normal_hit_4",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4") }],
  },
  // --- Charged attacks (bow: aimed / full-charge / breakthrough barb) ---
  // raw: FeatureDamageChargedAimed aimed (physical, no element)
  {
    name: "aimed",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.aimed") }],
  },
  // raw: FeatureDamageChargedAimed charged_aimed (hydro full-charge)
  {
    name: "charged_aimed",
    category: "attack",
    damageType: "charged",
    element: "hydro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_aimed") }],
  },
  // raw: FeatureDamageChargedAimed yelan_breakthrough_barb_dmg (hydro, HP-scaled)
  // Yelan.js: scaling:'hp*', leveling:'char_skill_attack', values:s1.p7
  {
    name: "yelan_breakthrough_barb_dmg",
    category: "attack",
    damageType: "charged",
    element: "hydro",
    multipliers: [{ scaling: "hp", leveling: "char_skill_attack", values: talents.get("attack.yelan_breakthrough_barb_dmg") }],
  },
  // --- Plunge attacks (physical bow) ---
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
  // --- Skill: Lingering Lifeline (hydro, HP-scaled) ---
  // raw: FeatureDamageSkill (scaling:'hp*', leveling:'char_skill_elemental', values:s2.p1)
  {
    name: "skill_dmg",
    category: "skill",
    element: "hydro",
    multipliers: [{ scaling: "hp", leveling: "char_skill_elemental", values: talents.get("skill.skill_dmg") }],
  },
  // --- Burst: Depth-Clarion Dice (hydro, HP-scaled) ---
  // raw: FeatureDamageBurst (scaling:'hp*', s3.p1)
  {
    name: "burst_dmg",
    category: "burst",
    element: "hydro",
    multipliers: [{ scaling: "hp", leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") }],
  },
  // raw: FeatureDamageBurst yelan_exquisite_throw_dmg (scaling:'hp*', s3.p2)
  {
    name: "yelan_exquisite_throw_dmg",
    category: "burst",
    element: "hydro",
    multipliers: [{ scaling: "hp", leveling: "char_skill_burst", values: talents.get("burst.yelan_exquisite_throw_dmg") }],
  },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const yelan: DbObjectChar = {
  name: "yelan",
  gameId: 10000060,
  rarity: 5,
  element: "hydro",
  weapon: "bow",
  origin: "liyue",
  statTable: YelanStatTable,
  talents,
  features,
  multipliers: [],
  // A1 "Turn Control": oracle runs with a single-char party (Yelan = 1 unique element)
  // → ConditionCalcElements sets party_elements_count_level=1 → hp_percent[0]=6.
  // Source: raw/genshin_calc_pub/src/js/db/Char/Yelan.js ConditionStaticLevel hp_percent:[6,12,18,30]
  baseStats: { hp_percent: 6 },
};
