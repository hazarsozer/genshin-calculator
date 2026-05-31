/**
 * Citlali — cryo catalyst ATK scaler (Nightsoul / Itzpapalotl).
 *
 * 3-hit normal combo (all cryo — catalyst infuses innately), cryo charged hit,
 * plunge / plunge_low / plunge_high (cryo), cryo skill (obsidian + frostfall storm),
 * cryo burst (ice storm + spiritvessel skull). All damage features are plain
 * ATK-scaled cryo hits at the fixed solo C0 build.
 *
 * --- Fixture features NOT modelled ---
 * skill.shield_absorption — a FeatureShield (raw Shield.js) whose value is
 *   (skillLevel% × mastery_total + flatBase) × (1 + shield%), with NO crit / RES /
 *   DEF. The harness's isDamageTripleEntry FILTERS it out (damageType: "" → display
 *   row), so it is not asserted. It is also unsupported infra: the FeatureShield
 *   shape (FeatureMultiplierList: levelMult×EM PLUS a second flat ValueTable, wrapped
 *   in CShield with the 'shield' bonus only) cannot be expressed through the generic
 *   compileFeature damage tree (no flat-add term, no shield category). Omitted.
 *
 * --- Conditional bonuses OFF in the fixed solo C0 build (omitted) ---
 *   - A4 "Itzpapalotl's Star Garments" (citlali_itzpapalotls_star_garments) — a
 *     manual ConditionBoolean toggle, default OFF (settings {}). Its two mastery*-
 *     scaled multiplier terms (+90% EM on skill frostfall_storm, +1200% EM on burst
 *     ice_storm) are gated by ConditionAnd([that boolean, ConditionAscensionChar(4)]).
 *     ConditionBoolean.isActive requires settings[name] truthy → false at baseline →
 *     the AND is false → both EM-bonus terms are off. So both features are plain
 *     ATK-scaled cryo hits here. (raw Citlali.js: the FeatureMultiplier scaling:'mastery*'
 *     source:'ascension4' entries on s2.p5 / s3.p1.)
 *   - A1 "Mama'lo'aco's Frigid Rain" (citlali_mamaloacos_frigid_rain) — ConditionBoolean
 *     pyro/hydro RES shred toggle, default OFF. Irrelevant to a cryo self-hit anyway.
 *   - All constellations (C0 build): C1/C2 EM-DMG, C3/C5 talent levels, C4 extra skull,
 *     C6 point DMG — omitted.
 *
 * Reaction features (superconduct / electrocharged / shatter — the cryo set) are
 * emitted generically by the engine from char.element, not declared here.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Citlali.js
 *   raw/genshin_calc_pub/src/js/classes/Feature2/Shield.js (shield shape; omitted)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Citlali)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Citlali)
 */

import type { DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Citlali as CitlaliStatTable } from "../generated/charTables.js";
import { Citlali as CitlaliTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return CitlaliTalents.s1.p1;
      if (name === "normal_hit_2") return CitlaliTalents.s1.p2;
      if (name === "normal_hit_3") return CitlaliTalents.s1.p3;
      if (name === "charged_hit")  return CitlaliTalents.s1.p4;
      if (name === "plunge")       return CitlaliTalents.s1.p6;
      if (name === "plunge_low")   return CitlaliTalents.s1.p7;
      if (name === "plunge_high")  return CitlaliTalents.s1.p8;
    }
    if (talent === "skill") {
      if (name === "citlali_obsidian_tzitzimitl_dmg") return CitlaliTalents.s2.p1;
      if (name === "citlali_frostfall_storm_dmg")     return CitlaliTalents.s2.p5;
    }
    if (talent === "burst") {
      if (name === "citlali_ice_storm_dmg")           return CitlaliTalents.s3.p1;
      if (name === "citlali_spiritvessel_skull_dmg")  return CitlaliTalents.s3.p2;
    }
    throw new Error(`citlali talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (cryo — catalyst infuses innately) ---
  // raw: FeatureDamageNormal normal_hit_1 (element: 'cryo')
  {
    name: "normal_hit_1",
    category: "attack",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1") }],
  },
  // raw: FeatureDamageNormal normal_hit_2 (element: 'cryo')
  {
    name: "normal_hit_2",
    category: "attack",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2") }],
  },
  // raw: FeatureDamageNormal normal_hit_3 (element: 'cryo')
  {
    name: "normal_hit_3",
    category: "attack",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }],
  },
  // --- Charged attack (cryo) ---
  // raw: FeatureDamageCharged charged_hit (element: 'cryo')
  {
    name: "charged_hit",
    category: "attack",
    damageType: "charged",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }],
  },
  // --- Plunge attacks (cryo) ---
  // raw: FeatureDamagePlungeCollision plunge (element: 'cryo')
  {
    name: "plunge",
    category: "attack",
    damageType: "plunge",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge") }],
  },
  // raw: FeatureDamagePlungeShockWave plunge_low (element: 'cryo')
  {
    name: "plunge_low",
    category: "attack",
    damageType: "plunge",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_low") }],
  },
  // raw: FeatureDamagePlungeShockWave plunge_high (element: 'cryo')
  {
    name: "plunge_high",
    category: "attack",
    damageType: "plunge",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_high") }],
  },
  // --- Skill: Dawnfrost Darkstar (cryo) ---
  // raw: FeatureDamageSkill citlali_obsidian_tzitzimitl_dmg (element: 'cryo')
  {
    name: "citlali_obsidian_tzitzimitl_dmg",
    category: "skill",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.citlali_obsidian_tzitzimitl_dmg") }],
  },
  // raw: FeatureDamageSkill citlali_frostfall_storm_dmg (element: 'cryo')
  // A4 mastery* term (source:'ascension4') is gated OFF at baseline → plain ATK hit.
  {
    name: "citlali_frostfall_storm_dmg",
    category: "skill",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.citlali_frostfall_storm_dmg") }],
  },
  // --- Burst: Edict of Entwined Splendor (cryo) ---
  // raw: FeatureDamageBurst citlali_ice_storm_dmg (element: 'cryo')
  // A4 mastery* term (source:'ascension4') is gated OFF at baseline → plain ATK hit.
  {
    name: "citlali_ice_storm_dmg",
    category: "burst",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.citlali_ice_storm_dmg") }],
  },
  // raw: FeatureDamageBurst citlali_spiritvessel_skull_dmg (element: 'cryo')
  {
    name: "citlali_spiritvessel_skull_dmg",
    category: "burst",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.citlali_spiritvessel_skull_dmg") }],
  },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const citlali: DbObjectChar = {
  name: "citlali",
  gameId: 10000107,
  rarity: 5,
  element: "cryo",
  weapon: "catalyst",
  origin: "natlan",
  statTable: CitlaliStatTable,
  talents,
  features,
  multipliers: [],
};
