/**
 * Layla — cryo sword ATK+HP scaler.
 *
 * 3-hit normal combo, charged 2-hit multihit (children _1/_2 + parent total),
 * plunge/low/high, cryo skill (skill_dmg + layla_shooting_star_dmg), cryo burst
 * (layla_starlight_slug_dmg, HP-scaling).
 *
 * layla_shooting_star_dmg has TWO multipliers:
 *   1. ATK-based (char_skill_elemental, s2.p2)
 *   2. HP-based (A4 "Sweet Slumber Undisturbed": 1.5% HP flat additive) —
 *      ConditionAscensionChar(4) → auto-active at canonical ascension 6.
 * raw/genshin_calc_pub/src/js/db/Char/Layla.js: layla_shooting_star_dmg
 *
 * layla_starlight_slug_dmg: HP-scaling burst (s3.p1, scaling: 'hp*').
 * damageBonuses: ['dmg_burst_layla'] — from C6 constellation (C6ShieldBonus:40),
 * inactive at C0, reads 0 from context.
 *
 * Shield (layla_base_shield_dmg_absorption) has empty damageType → not tested.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Layla.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Layla)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Layla)
 */

import type { CharMultiplier, Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Layla as LaylaStatTable } from "../generated/charTables.js";
import { Layla as LaylaTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return LaylaTalents.s1.p1;
      if (name === "normal_hit_2") return LaylaTalents.s1.p2;
      if (name === "normal_hit_3") return LaylaTalents.s1.p3;
      if (name === "charged_hit_1") return LaylaTalents.s1.p4;
      if (name === "charged_hit_2") return LaylaTalents.s1.p5;
      if (name === "plunge") return LaylaTalents.s1.p7;
      if (name === "plunge_low") return LaylaTalents.s1.p8;
      if (name === "plunge_high") return LaylaTalents.s1.p9;
    }
    if (talent === "skill") {
      if (name === "skill_dmg") return LaylaTalents.s2.p1;
      if (name === "layla_shooting_star_dmg") return LaylaTalents.s2.p2;
    }
    if (talent === "burst") {
      if (name === "layla_starlight_slug_dmg") return LaylaTalents.s3.p1;
    }
    throw new Error(`layla talents: unknown path '${path}'`);
  },
};

// A4 "Sweet Slumber Undisturbed": flat 1.5% of HP additive to shooting star DMG.
// ConditionAscensionChar(4) → auto-active at canonical ascension 6.
// raw/genshin_calc_pub/src/js/db/Char/Layla.js: layla_shooting_star_dmg multipliers
const a4HpScale = { getValue: (_level: number) => 1.5 };

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks ---
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
  // raw: FeatureDamageNormal normal_hit_3
  {
    name: "normal_hit_3",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }],
  },
  // --- Charged attacks ---
  // raw: FeatureDamageMultihit charged_hit_total (parent = _1 + _2)
  {
    name: "charged_hit_total",
    category: "attack",
    damageType: "charged",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit_1") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit_2") }] },
    ],
  },
  // raw: FeatureDamageCharged charged_hit_1 (isChild:true → drop to emit)
  {
    name: "charged_hit_1",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit_1") }],
  },
  // raw: FeatureDamageCharged charged_hit_2 (isChild:true → drop to emit)
  {
    name: "charged_hit_2",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit_2") }],
  },
  // --- Plunge attacks ---
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
  // --- Skill: Night's Formal Focus (cryo) ---
  // raw: FeatureDamageSkill skill_dmg (ATK-based, cryo)
  {
    name: "skill_dmg",
    category: "skill",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.skill_dmg") }],
  },
  // raw: FeatureDamageSkill layla_shooting_star_dmg (ATK + A4 HP additive, cryo)
  // Two multipliers: ATK-based at char_skill_elemental + HP-based (1.5%, A4 auto-active at asc6)
  {
    name: "layla_shooting_star_dmg",
    category: "skill",
    element: "cryo",
    // C6 "Shadowy Dream-Veil": +40% skill DMG (dmg_skill_layla, from the C6 condition).
    // Constellation-gated → 0 at C0..C5, base-safe. Raw Layla.js:254.
    damageBonuses: ["dmg_skill_layla"],
    multipliers: [
      { leveling: "char_skill_elemental", values: talents.get("skill.layla_shooting_star_dmg") },
      { scaling: "hp", leveling: "char_skill_elemental", values: a4HpScale },
    ],
  },
  // --- Burst: Dream of the Star-Stream Shaker (cryo) ---
  // raw: FeatureDamageBurst layla_starlight_slug_dmg (HP-scaling, cryo)
  // damageBonuses: ['dmg_burst_layla'] — C6 inactive at C0, reads 0.
  {
    name: "layla_starlight_slug_dmg",
    category: "burst",
    element: "cryo",
    damageBonuses: ["dmg_burst_layla"],
    multipliers: [
      { scaling: "hp", leveling: "char_skill_burst", values: talents.get("burst.layla_starlight_slug_dmg") },
    ],
  },
];

// ---------------------------------------------------------------------------
// Constellations (P2.C Wave-1)
// ---------------------------------------------------------------------------
// C1 "Fortress of Fantasy" (ConditionStatic text: shield bonus / party shield) → SKIP
//   (the +20% shield buff is baked into the feature-level ConditionConstellation(1)
//   multiplier in raw; the party shield feature is similarly gated by ConditionConstellation(1)
//   in the feature list — both are feature-level, not a char condition stat).
// C2 "Light's Remit" (ConditionStatic description-only) → SKIP.
// C3 "Starstream Calculations" → +3 Elemental Skill (Night's Formal Focus) levels.
//   raw: constellation[2]: Condition{ settings:{char_skill_elemental_bonus:3} }
// C4 "Starry Illumination" (ConditionBoolean HP→normal/charged multiplier toggle) → SKIP (off).
// C5 "Parallax Zenith" → +3 Elemental Burst (Dream of the Star-Stream Shaker) levels.
//   raw: constellation[4]: Condition{ settings:{char_skill_burst_bonus:3} }
// C6 "Radiant Soulfire" (ConditionStatic — always-on at C6, REAL stats):
//   dmg_skill_layla: +40, dmg_burst_layla: +40.
//   raw: constellation[5]: ConditionStatic{ stats:{dmg_skill_layla:40, dmg_burst_layla:40} }
//   No subConditions → unconditional at C6. Port as constellation stat condition.
//
// Sources: raw/genshin_calc_pub/src/js/db/Char/Layla.js:360-424

const constellationConditions: readonly Condition[] = [
  // C3: +3 Elemental Skill (Night's Formal Focus) levels.
  { type: "constellation", constellation: 3, settings: { char_skill_elemental_bonus: 3 } },
  // C5: +3 Elemental Burst (Dream of the Star-Stream Shaker) levels.
  { type: "constellation", constellation: 5, settings: { char_skill_burst_bonus: 3 } },
  // C6: Shooting Star DMG +40% and Starlight Slug DMG +40%.
  { type: "constellation", constellation: 6, stats: { dmg_skill_layla: 40, dmg_burst_layla: 40 } },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// partyData — teammate kit buff (P3.5.2 Bucket C).
// Source: raw/genshin_calc_pub/src/js/db/Char/Layla.js:425-468
// Scope: C4 "Starry Illumination" — HP-scaled normal/charged-DMG bonus on recipient.
// Gated by party.layla_starry_illumination master toggle.
// Conditions ported = ONLY the HP lift the multiplier reads + the master gate.
// Note: layla_max_hp is a teammate-namespaced bare key (not the recipient's hp total),
// so it still needs a RAW_BAG_SCALING_KEYS entry.
// ---------------------------------------------------------------------------

// C4NormalBonus = 5 (raw/genshin_calc_pub/src/js/db/Char/Layla.js:127)
const C4_NORMAL_BONUS = 5;

const laylaPartyMultipliers: readonly CharMultiplier[] = [
  // C4: layla_max_hp × 5% flat normal/charged DMG bonus on recipient.
  // raw/genshin_calc_pub/src/js/db/Char/Layla.js:457-466
  {
    source: "constellation4",
    scaling: "layla_max_hp",
    leveling: "",
    values: { getValue: (): number => C4_NORMAL_BONUS },
    condition: { type: "boolean", name: "party.layla_starry_illumination" },
    target: { damageTypes: ["normal", "charged"] },
  } satisfies CharMultiplier,
];

export const layla: DbObjectChar = {
  name: "layla",
  gameId: 10000074,
  rarity: 4,
  element: "cryo",
  weapon: "sword",
  origin: "sumeru",
  statTable: LaylaStatTable,
  talents,
  features,
  multipliers: [],
  conditions: constellationConditions,
  partyData: {
    // loadStats mirrors raw Layla.js:427-429 (hp_total stat).
    loadStats: {
      stats: ["hp_total"],
    },
    conditions: [
      // Lift Layla's hp_total (partyStat) into recipient bag as `layla_max_hp`.
      // raw: ConditionNumber({name:'layla_max_hp', partyStat:'hp_total', max:150000}).
      // CHARACTER_MAX_POSSIBLE_HP = 150000 (raw/genshin_calc_pub/src/js/db/Constants.js:1).
      { type: "number", name: "layla_max_hp", max: 150000 },
      // Master toggle — gates the C4 multiplier. raw: ConditionBoolean({name:'party.layla_starry_illumination'}).
      { type: "boolean", name: "party.layla_starry_illumination" },
    ],
    multipliers: laylaPartyMultipliers,
  },
};
