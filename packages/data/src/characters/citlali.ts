/**
 * Citlali — cryo catalyst ATK scaler (Nightsoul / Itzpapalotl).
 *
 * 3-hit normal combo (all cryo — catalyst infuses innately), cryo charged hit,
 * plunge / plunge_low / plunge_high (cryo), cryo skill (obsidian + frostfall storm),
 * cryo burst (ice storm + spiritvessel skull). All damage features are plain
 * ATK-scaled cryo hits at the fixed solo C0 build.
 *
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
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Citlali)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Citlali)
 */

import type { CharMultiplier, Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
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
      if (name === "shield_percent")                  return CitlaliTalents.s2.p2;
      if (name === "shield_flat")                     return CitlaliTalents.s2.p3;
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
    tags: ["plunge_shockwave"],
    category: "attack",
    damageType: "plunge",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_low") }],
  },
  // raw: FeatureDamagePlungeShockWave plunge_high (element: 'cryo')
  {
    name: "plunge_high",
    tags: ["plunge_shockwave"],
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
  // A4 "Itzpapalotl's Star Garments": SELF +90% (mastery*) EM-scaled damage-instance term added in
  // parallel to the ATK base, gated by the citlali_itzpapalotls_star_garments toggle (ascension-4
  // auto-true at the rep). The aino-A4 / alhaitham mastery* mirror; scales off her OWN EM. Was
  // golden-blind SKIPPED ("gated OFF at baseline") → her frostfall undershot the oracle when the
  // garments toggle is on. raw Citlali.js:236-244. Base-inert when untoggled.
  {
    name: "citlali_frostfall_storm_dmg",
    category: "skill",
    element: "cryo",
    multipliers: [
      { leveling: "char_skill_elemental", values: talents.get("skill.citlali_frostfall_storm_dmg") },
      {
        scaling: "mastery*",
        leveling: "",
        source: "ascension4",
        values: { getValue: () => 90 }, // A4SkillBonus
        condition: { type: "boolean", name: "citlali_itzpapalotls_star_garments" },
      },
    ],
  },
  // --- Shield (FeatureShield): skill.shield_absorption ---
  // FeatureMultiplierList: (percent/100 × mastery_total) + flat, then × (1 + shield).
  // Source: raw/genshin_calc_pub/src/js/db/Char/Citlali.js:247-257 (FeatureShield)
  // shield_absorption: s2.p2 (% EM) + s2.p3 (flat)
  {
    name: "shield_absorption",
    category: "skill",
    output: { kind: "shield" },
    multipliers: [
      { scaling: "mastery", leveling: "char_skill_elemental", values: talents.get("skill.shield_percent"), flatValues: talents.get("skill.shield_flat") },
    ],
  },
  // --- Burst: Edict of Entwined Splendor (cryo) ---
  // raw: FeatureDamageBurst citlali_ice_storm_dmg (element: 'cryo')
  // A4 "Itzpapalotl's Star Garments": SELF +1200% (mastery*) EM-scaled damage-instance term added in
  // parallel to the ATK base, gated by the citlali_itzpapalotls_star_garments toggle (the aino-A4 /
  // alhaitham mastery* mirror, scaling off her OWN EM). Was golden-blind SKIPPED → her ice-storm
  // undershot the oracle when the garments toggle is on. raw Citlali.js:265-273. Base-inert when untoggled.
  {
    name: "citlali_ice_storm_dmg",
    category: "burst",
    element: "cryo",
    multipliers: [
      { leveling: "char_skill_burst", values: talents.get("burst.citlali_ice_storm_dmg") },
      {
        scaling: "mastery*",
        leveling: "",
        source: "ascension4",
        values: { getValue: () => 1200 }, // A4BurstBonus
        condition: { type: "boolean", name: "citlali_itzpapalotls_star_garments" },
      },
    ],
  },
  // raw: FeatureDamageBurst citlali_spiritvessel_skull_dmg (element: 'cryo')
  {
    name: "citlali_spiritvessel_skull_dmg",
    category: "burst",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.citlali_spiritvessel_skull_dmg") }],
  },
  // C4 "Death Defier's Spirit Skull": EM-scaled extra skull hit. Base FeatureDamage →
  // category omitted (→ "other" in fixture key), damageType omitted (→ "none" in fixture).
  // Raw Citlali.js:285-296: FeatureDamage{category:'other', element:'cryo',
  //   multipliers:[FeatureMultiplier{scaling:'mastery*', source:'constellation4',
  //     values:StatTable('citlali_obsidian_spiritvessel_skull_dmg',[1800])}],
  //   condition:ConditionConstellation{constellation:4}}.
  // C4SkillDmg = 1800. leveling uses the source key 'constellation4' (constant table).
  {
    name: "citlali_obsidian_spiritvessel_skull_dmg",
    element: "cryo",
    condition: { type: "constellation", constellation: 4 },
    multipliers: [
      {
        scaling: "mastery*",
        leveling: "constellation4",
        values: { getValue: (_level: number) => 1800 },
        source: "constellation4",
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Constellation conditions (P2.C)
// ---------------------------------------------------------------------------
// C1 "Radiant Blades of Centzon Mimixcoah": ConditionStatic display-only (text_percent) → SKIP.
// C3 "Death Defier's Spirit Skull": +3 levels to Dawnfrost Darkstar (skill). Raw cons[2] settings.
// C4 "Death Defier's Spirit Skull" damage: cons-added feature above.
// C5 "Teoiztac's Secret Pact": +3 levels to Edict of Entwined Splendor (burst). Raw cons[4] settings.
// Raw: Citlali.js constellation array (Citlali.js:328-416).
//
// SELF buffs (were golden-blind SKIPPED — the port modelled only the party.* mirror; these SELF
// conditions default OFF in the fixed build, so the 58k DAMAGE goldens never exercised them; a
// diff-parity sweep surfaced her frostfall/ice-storm (the A4 mastery* features) + EM-scaled reactions
// diverging when the toggles are on):
//   - A4 "Itzpapalotl's Star Garments": the two mastery* terms on frostfall/ice-storm (ported above
//     on those features, gated by citlali_itzpapalotls_star_garments).
//   - C2 "Heart Devourer's Travail" (citlali_heart_devourers_travail): SELF mastery +125, lifting her
//     A4 mastery* terms, the C4 skull mastery* term, and her EM-scaled transformative reactions.
//     ConditionBoolean in constellation[1] → THE CONSTELLATION IS A GATE. raw Citlali.js:342-352.
//     (Its sibling A1 res-shred enemy_res_pyro/hydro is damage-inert for her CRYO hits → SKIP.)
const constellationConditions: readonly Condition[] = [
  // C3: +3 levels to Dawnfrost Darkstar (elemental skill).
  { type: "constellation", constellation: 3, settings: { char_skill_elemental_bonus: 3 } },
  // C5: +3 levels to Edict of Entwined Splendor (elemental burst).
  { type: "constellation", constellation: 5, settings: { char_skill_burst_bonus: 3 } },
  // SELF C2 "Heart Devourer's Travail" — +125 EM, gated at C2. raw Citlali.js:342-352.
  {
    type: "boolean",
    name: "citlali_heart_devourers_travail",
    stats: { mastery: 125 },
    condition: { type: "constellation", constellation: 2 },
  },
  // SELF C6 "Teoiztac's Secret Pact" (citlali_points, raw cons[5] ConditionNumberCitlali,
  // Citlali.js:401-413) — a 0..40-point slider (C6MaxPoints=40) whose getStats override adds
  // dmg_all += points×2.5 (selfBonus C6PointDmgBonusSelf) and dmg_pyro/dmg_hydro += points×1.5
  // (otherBonus C6PointDmgBonus). Only dmg_all lifts her own cryo hits (drives the C6 normals/
  // plunge/burst explosion); dmg_pyro/dmg_hydro are the teammate share — damage-inert for her
  // cryo, emitted for faithfulness to her getStats. Ported via bonusPerValue; gated C6.
  {
    type: "number",
    name: "citlali_points",
    max: 40,
    bonusPerValue: { dmg_all: 2.5, dmg_pyro: 1.5, dmg_hydro: 1.5 },
    condition: { type: "constellation", constellation: 6 },
  },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// partyData — teammate kit buff (P3.5.2 Bucket C).
// Source: raw/genshin_calc_pub/src/js/db/Char/Citlali.js:417-507
// Scope: C1 "Radiant Blades of Centzon Mimixcoah" — EM-scaled all-type-DMG bonus.
// Gated by party.citlali_radiant_blades_of_centzon_mimixcoah master toggle.
// Conditions ported = ONLY the EM lift the multiplier reads + the master gate.
// Other partyData conditions (A1 res-shred, C2 EM share, C6 points) deferred to variant-rep pass.
// ---------------------------------------------------------------------------

// C1MasteryDmgBonus = 200 (raw/genshin_calc_pub/src/js/db/Char/Citlali.js:136)
const C1_MASTERY_DMG_BONUS = 200;

const citlaliPartyMultipliers: readonly CharMultiplier[] = [
  // C1: citlali_mastery_total × 200% EM flat bonus added to every normal/charged/plunge/skill/burst hit.
  // No element filter (all elements). raw/genshin_calc_pub/src/js/db/Char/Citlali.js:497-505
  {
    source: "citlali",
    scaling: "citlali_mastery_total",
    leveling: "",
    values: { getValue: (): number => C1_MASTERY_DMG_BONUS },
    condition: { type: "boolean", name: "party.citlali_radiant_blades_of_centzon_mimixcoah" },
    target: { damageTypes: ["normal", "charged", "plunge", "skill", "burst"] },
  } satisfies CharMultiplier,
];

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
  conditions: constellationConditions,
  partyData: {
    // loadStats mirrors raw Citlali.js:419-421 (mastery_total stat).
    loadStats: {
      stats: ["mastery_total"],
    },
    conditions: [
      // Lift Citlali's mastery_total into recipient bag as `citlali_mastery_total`.
      // raw: ConditionNumber({name:'citlali_mastery_total', partyStat:'mastery_total', max:10000}).
      { type: "number", name: "citlali_mastery_total", max: 10000 },
      // Master toggle — gates the C1 multiplier. raw: ConditionBoolean({name:'party.citlali_radiant_blades_of_centzon_mimixcoah'}).
      { type: "boolean", name: "party.citlali_radiant_blades_of_centzon_mimixcoah" },
    ],
    multipliers: citlaliPartyMultipliers,
  },
};
