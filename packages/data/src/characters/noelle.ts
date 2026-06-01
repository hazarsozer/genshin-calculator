/**
 * Noelle — geo claymore DEF/ATK scaler.
 *
 * 4-hit normal combo (physical, infusable via burst), 2 charged attacks (spin/final),
 * plunge/low/high physical, geo skill (skill_dmg DEF-scaled), geo burst
 * (burst_dmg + noelle_skill_dmg ATK-scaled, with DEF→ATK conversion when burst active).
 *
 * In the fixed solo C0 build with `settings = {}`:
 *   - noelle_sweeping_time (burst toggle) is inactive → DEF→ATK conversion OFF.
 *   - noelle_devotion_shield (A1) has damageType: "" → not tested.
 *   - shield/heal have damageType: "" → not tested.
 *   - No constellations modelled (C0 build).
 *
 * skill_dmg DEF-scaling: `scaling: "def"` multiplier (s2.p6 at talent level 10 = 216).
 * burst_dmg + noelle_skill_dmg: ATK-scaling (s3.p1/p2); burst geo element.
 * normals/charged/plunge: physical (no infusion in settings = {}).
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Noelle.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js:513 (Noelle)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js:4665 (Noelle)
 */

import type { Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Noelle as NoelleStatTable } from "../generated/charTables.js";
import { Noelle as NoelleTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return NoelleTalents.s1.p1;
      if (name === "normal_hit_2") return NoelleTalents.s1.p2;
      if (name === "normal_hit_3") return NoelleTalents.s1.p3;
      if (name === "normal_hit_4") return NoelleTalents.s1.p4;
      if (name === "charged_spin") return NoelleTalents.s1.p5;
      if (name === "charged_final") return NoelleTalents.s1.p6;
      if (name === "plunge") return NoelleTalents.s1.p9;
      if (name === "plunge_low") return NoelleTalents.s1.p10;
      if (name === "plunge_high") return NoelleTalents.s1.p11;
    }
    if (talent === "skill") {
      if (name === "skill_dmg") return NoelleTalents.s2.p6;
    }
    if (talent === "burst") {
      if (name === "burst_dmg") return NoelleTalents.s3.p1;
      if (name === "noelle_skill_dmg") return NoelleTalents.s3.p2;
    }
    throw new Error(`noelle talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (physical claymore) ---
  // raw/genshin_calc_pub/src/js/db/Char/Noelle.js: FeatureDamageNormal normal_hit_1
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
  // raw: FeatureDamageNormal normal_hit_3
  {
    name: "normal_hit_3",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }],
  },
  // raw: FeatureDamageNormal normal_hit_4
  {
    name: "normal_hit_4",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4") }],
  },
  // --- Charged attacks ---
  // raw: FeatureDamageCharged charged_spin (s1.p5)
  {
    name: "charged_spin",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_spin") }],
  },
  // raw: FeatureDamageCharged charged_final (s1.p6)
  {
    name: "charged_final",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_final") }],
  },
  // --- Plunge attacks ---
  // raw: FeatureDamagePlungeCollision plunge (s1.p9)
  {
    name: "plunge",
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge") }],
  },
  // raw: FeatureDamagePlungeShockWave plunge_low (s1.p10)
  {
    name: "plunge_low",
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_low") }],
  },
  // raw: FeatureDamagePlungeShockWave plunge_high (s1.p11)
  {
    name: "plunge_high",
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_high") }],
  },
  // --- Skill: Breastplate (geo DEF-scaled) ---
  // raw: FeatureDamageSkill skill_dmg, scaling:'def*', element:'geo', s2.p6
  // raw/genshin_calc_pub/src/js/db/Char/Noelle.js: FeatureDamageSkill skill_dmg
  {
    name: "skill_dmg",
    category: "skill",
    element: "geo",
    multipliers: [
      { scaling: "def", leveling: "char_skill_elemental", values: talents.get("skill.skill_dmg") },
    ],
  },
  // --- Burst: Sweeping Time (geo ATK-scaled) ---
  // raw: FeatureDamageBurst burst_dmg, element:'geo', s3.p1
  // raw/genshin_calc_pub/src/js/db/Char/Noelle.js: FeatureDamageBurst burst_dmg
  {
    name: "burst_dmg",
    category: "burst",
    element: "geo",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") }],
  },
  // raw: FeatureDamageBurst noelle_skill_dmg, element:'geo', s3.p2
  // raw/genshin_calc_pub/src/js/db/Char/Noelle.js: FeatureDamageBurst noelle_skill_dmg
  {
    name: "noelle_skill_dmg",
    category: "burst",
    element: "geo",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.noelle_skill_dmg") }],
  },
  // --- C4 "To Be Cleaned": cons-added geo hit, 400% ATK (shield-damage proc).
  // raw: FeatureDamage (base class) name:'noelle_to_be_cleaned', category:'skill',
  //   element:'geo', source:'constellation4', ValueTable([400]),
  //   condition:ConditionConstellation({constellation:4}). Noelle.js:272-283.
  // Base FeatureDamage → damageType:"" (fixture shows "none" for this class).
  {
    name: "noelle_to_be_cleaned",
    category: "skill",
    element: "geo",
    damageType: "",
    condition: { type: "constellation", constellation: 4 },
    multipliers: [
      {
        leveling: "char_skill_elemental",
        values: { getValue: (_level: number) => 400 },
        source: "constellation4",
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Constellation conditions (P2.C)
// ---------------------------------------------------------------------------
// C1 "I Got Your Back": ConditionStatic (display-only) → SKIP. Noelle.js:363-371.
// C2 "Combat Maid": ConditionStatic (text: stamina/dmg_charged display) → SKIP. Noelle.js:372-382.
// C3 "Invulnerable Maid": +3 levels to Breastplate (skill). Noelle.js:383-390.
// C4 "To Be Cleaned": ConditionStatic (display-only text_percent_dmg:400) → no stat entry;
//   actual damage modeled as noelle_to_be_cleaned feature above. Noelle.js:391-398.
// C5 "Favonius Sweeper Master": +3 levels to Sweeping Time (burst). Noelle.js:399-406.
// C6 "Must Be Spotless": ConditionStatic gated by noelle_sweeping_time boolean → SKIP. Noelle.js:407-427.
const constellationConditions: readonly Condition[] = [
  // C3: +3 levels to Breastplate (elemental skill). Noelle.js:383-390.
  { type: "constellation", constellation: 3, settings: { char_skill_elemental_bonus: 3 } },
  // C5: +3 levels to Sweeping Time (elemental burst). Noelle.js:399-406.
  { type: "constellation", constellation: 5, settings: { char_skill_burst_bonus: 3 } },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const noelle: DbObjectChar = {
  name: "noelle",
  gameId: 10000034,
  rarity: 4,
  element: "geo",
  weapon: "claymore",
  origin: "mondstadt",
  statTable: NoelleStatTable,
  talents,
  features,
  multipliers: [],
  conditions: constellationConditions,
};
