/**
 * Nahida — dendro catalyst.
 *
 * 4-hit normal combo (all dendro), dendro charged hit, plunge/low/high.
 * Dendro skill: press_dmg, hold_dmg, nahida_trikarma_purification_dmg
 * (dual ATK+EM multipliers; critRateBonuses/damageBonuses are burst-gated → OFF).
 * No burst damage asserted in fixture (burst is a party-buff only).
 * other.nahida_mastery_bonus: damageType="" → not asserted by harness.
 *
 * A4 passives (crit_rate_nahida, dmg_skill_nahida) require EM > 200 and are
 * driven by PostEffectStatsMastery with conditions — off at settings={} baseline
 * unless EM > 200. Fixture stats.mastery = 170.2 < 200, so they are inactive.
 * The critRateBonuses/damageBonuses on trikarma reference these keys but the
 * engine reads absent keys as 0 — no additional modelling needed.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Nahida.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Nahida)
 */

import type { Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Nahida as NahidaStatTable } from "../generated/charTables.js";
import { Nahida as NahidaTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return NahidaTalents.s1.p1;
      if (name === "normal_hit_2") return NahidaTalents.s1.p2;
      if (name === "normal_hit_3") return NahidaTalents.s1.p3;
      if (name === "normal_hit_4") return NahidaTalents.s1.p4;
      if (name === "charged_hit")  return NahidaTalents.s1.p5;
      if (name === "plunge")       return NahidaTalents.s1.p7;
      if (name === "plunge_low")   return NahidaTalents.s1.p8;
      if (name === "plunge_high")  return NahidaTalents.s1.p9;
    }
    if (talent === "skill") {
      if (name === "press_dmg")  return NahidaTalents.s2.p1;
      if (name === "hold_dmg")   return NahidaTalents.s2.p2;
      if (name === "trikarma_atk")    return NahidaTalents.s2.p3;
      if (name === "trikarma_mastery") return NahidaTalents.s2.p4;
    }
    throw new Error(`nahida talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (dendro catalyst, always dendro) ---
  {
    name: "normal_hit_1",
    category: "attack",
    element: "dendro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1") }],
  },
  {
    name: "normal_hit_2",
    category: "attack",
    element: "dendro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2") }],
  },
  {
    name: "normal_hit_3",
    category: "attack",
    element: "dendro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }],
  },
  {
    name: "normal_hit_4",
    category: "attack",
    element: "dendro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4") }],
  },
  // --- Charged attack ---
  {
    name: "charged_hit",
    category: "attack",
    damageType: "charged",
    element: "dendro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }],
  },
  // --- Plunge attacks ---
  {
    name: "plunge",
    category: "attack",
    damageType: "plunge",
    element: "dendro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge") }],
  },
  {
    name: "plunge_low",
    category: "attack",
    damageType: "plunge",
    element: "dendro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_low") }],
  },
  {
    name: "plunge_high",
    category: "attack",
    damageType: "plunge",
    element: "dendro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_high") }],
  },
  // --- Skill: All Schemes to Know ---
  {
    name: "press_dmg",
    category: "skill",
    element: "dendro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.press_dmg") }],
  },
  {
    name: "hold_dmg",
    category: "skill",
    element: "dendro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.hold_dmg") }],
  },
  // nahida_trikarma_purification_dmg: dual ATK + EM multipliers.
  // raw: FeatureDamageSkill({ multipliers: [ATK leveling s2.p3, mastery* leveling s2.p4] })
  // critRateBonuses/damageBonuses are included here per raw, even though they are 0
  // at baseline (absent keys read as 0 in the engine).
  {
    name: "nahida_trikarma_purification_dmg",
    category: "skill",
    element: "dendro",
    critRateBonuses: ["crit_rate_nahida"],
    damageBonuses: ["dmg_skill_nahida"],
    multipliers: [
      { leveling: "char_skill_elemental", values: talents.get("skill.trikarma_atk") },
      { scaling: "mastery*", leveling: "char_skill_elemental", values: talents.get("skill.trikarma_mastery") },
    ],
  },
  // Burst: Illusory Heart — party buff, no damage hit in fixture. Not declared.
  // other.nahida_mastery_bonus: damageType="" → display-only, not asserted.
  // --- C6 "The Fruit of Reason's Culmination": cons-added FeatureDamageSkill.
  // Fixed multipliers: 200% ATK + 400% mastery-scaled (no leveling → level 1).
  // Same critRateBonuses/damageBonuses as trikarma.
  // Raw Nahida.js:303-320 (ConditionConstellation(6)).
  {
    name: "nahida_trikarma_purification_karmic_dmg",
    category: "skill",
    element: "dendro",
    critRateBonuses: ["crit_rate_nahida"],
    damageBonuses: ["dmg_skill_nahida"],
    condition: { type: "constellation", constellation: 6 },
    multipliers: [
      { leveling: "", values: { getValue: (_level: number) => 200 }, source: "constellation6" },
      { scaling: "mastery*", leveling: "", values: { getValue: (_level: number) => 400 }, source: "constellation6" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Constellation conditions (P2.C)
// ---------------------------------------------------------------------------
// C1 "The Seed of Stored Knowledge": ConditionStatic display-only → SKIP.
// C2 "The Root of All Fullness": ConditionStatic (crit_rate_bloom/crit_dmg_bloom
//   for reactions) + ConditionBoolean toggle (enemy_def_reduce:30) → SKIP (toggles).
// C3 "The Shoot of Awakening Moment": +3 levels to All Schemes to Know (skill).
//   Raw: constellation array index 2 → Condition({ settings:{ char_skill_elemental_bonus:3 } }).
// C4 "The Stem of Manifest Inference": ConditionLevelSelect mastery stacks → SKIP (toggle).
// C5 "The Leaves of Awakening Moment": +3 levels to Illusory Heart (burst).
//   Raw: char-level conditions array → Condition({ settings:{ char_skill_burst_bonus:3 },
//   subConditions:[ ConditionConstellation({constellation:5}) ] }).
// C6 "The Fruit of Reason's Culmination": ConditionStatic (display-only text) in cons array → SKIP.
//   The actual C6 damage comes from nahida_trikarma_purification_karmic_dmg feature above.
// Raw: db/Char/Nahida.js conditions + constellation arrays.
const constellationConditions: readonly Condition[] = [
  // C3: +3 levels to All Schemes to Know (skill). Raw Nahida.js:472-478 (cons[2]).
  { type: "constellation", constellation: 3, settings: { char_skill_elemental_bonus: 3 } },
  // C5: +3 levels to Illusory Heart (burst). Raw Nahida.js:328-334 (char conditions).
  { type: "constellation", constellation: 5, settings: { char_skill_burst_bonus: 3 } },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const nahida: DbObjectChar = {
  name: "nahida",
  gameId: 10000073,
  rarity: 5,
  element: "dendro",
  weapon: "catalyst",
  origin: "sumeru",
  statTable: NahidaStatTable,
  talents,
  features,
  multipliers: [],
  conditions: constellationConditions,
};
