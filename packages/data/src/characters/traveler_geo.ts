/**
 * Traveler (Geo) — geo sword ATK scaler.
 *
 * 5-hit normal combo (physical sword). Charged 2-hit multihit
 * (charged_hit_total parent + standalone charged_hit_1/_2 — the fixture lists all
 * three independently, so the children are emitted, NOT isChild). Plunge/low/high.
 *
 * A4 "Frenzied Rockslide" (traveler_frenzied_rockslide): a flat 60% geo normal
 * attack, active at the canonical A6 build. Her raw models it as a FeatureDamageNormal
 * with element:'geo' and a constant FeatureMultiplier { source:'ascension4',
 * values: StatTable('traveler_frenzied_rockslide', [60]) } — a non-talent-scaled flat
 * 60% of ATK (source:'ascension4' is not a leveling key, so compileFeature reads
 * values.getValue(1) = 60). The condition's `text_percent_dmg: 60` is a display-only
 * `text_*` string, NOT a real dmg bonus — kept out of the stat bag.
 *
 * Skill:  skill_dmg — geo, ATK-scaled (char_skill_elemental, s2.p1) [Starfell Sword]
 * Burst:  traveler_shockwave — geo, ATK-scaled (char_skill_burst, s3.p1) [Wake of Earth]
 *
 * Geo ascension passive grants ATK% (Traveler statTable, 24% at A6) — already folded
 * into the generated charTables.Traveler. No always-on crit/dmg passive at C0:
 * A1 "Shattered Darkrock" is ConditionStatic text-only; the C1 crit_rate:10 and the
 * swordfighting/special-training ConditionBooleans are off in the fixed solo C0 build.
 *
 * reaction.electrocharged / reaction.shatter are emitted generically by the loader
 * from element 'geo'; reaction.crystalize (a shield, empty damageType) is excluded.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/TravelerGeo.js
 *   raw/genshin_calc_pub/src/js/db/Char/TravelerGeo.js:166-175 (A4 traveler_frenzied_rockslide, flat [60] geo)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Traveler)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (TravelerGeo)
 */

import type { Condition, DbObjectChar, Feature, TalentResolver, TalentTable } from "@genshin/types";
import { Traveler as TravelerStatTable } from "../generated/charTables.js";
import { TravelerGeo as TravelerGeoTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return TravelerGeoTalents.s1.p1;
      if (name === "normal_hit_2") return TravelerGeoTalents.s1.p2;
      if (name === "normal_hit_3") return TravelerGeoTalents.s1.p3;
      if (name === "normal_hit_4") return TravelerGeoTalents.s1.p4;
      if (name === "normal_hit_5") return TravelerGeoTalents.s1.p5;
      if (name === "charged_hit_1") return TravelerGeoTalents.s1.p6;
      if (name === "charged_hit_2") return TravelerGeoTalents.s1.p7;
      if (name === "plunge") return TravelerGeoTalents.s1.p9;
      if (name === "plunge_low") return TravelerGeoTalents.s1.p10;
      if (name === "plunge_high") return TravelerGeoTalents.s1.p11;
    }
    if (talent === "skill") {
      if (name === "skill_dmg") return TravelerGeoTalents.s2.p1;
    }
    if (talent === "burst") {
      if (name === "traveler_shockwave") return TravelerGeoTalents.s3.p1;
    }
    throw new Error(`traveler_geo talents: unknown path '${path}'`);
  },
};

// A4 "Frenzied Rockslide": constant 60% geo normal-attack multiplier.
// raw: new FeatureMultiplier({ source:'ascension4', values: new StatTable('traveler_frenzied_rockslide', [60]) })
// source:'ascension4' is not a leveling slot, so compileFeature reads getValue(1) = 60.
const A4_FRENZIED_ROCKSLIDE = 60;
const frenziedRockslideTable: TalentTable = { getValue: () => A4_FRENZIED_ROCKSLIDE };

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (physical sword) ---
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
  // --- A4 Frenzied Rockslide: flat 60% geo normal attack (active at A6) ---
  // raw/genshin_calc_pub/src/js/db/Char/TravelerGeo.js:166-175
  {
    name: "traveler_frenzied_rockslide",
    category: "attack",
    damageType: "normal",
    element: "geo",
    multipliers: [{ leveling: "ascension4", values: frenziedRockslideTable }],
  },
  // --- Charged attacks ---
  // raw: FeatureDamageMultihit charged_hit_total (2-hit: p6 + p7)
  {
    name: "charged_hit_total",
    category: "attack",
    damageType: "charged",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit_1") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit_2") }] },
    ],
  },
  // raw: FeatureDamageCharged charged_hit_1 (isChild in raw, but the fixture lists it
  // as an independent feature → emit it, do NOT mark isChild).
  {
    name: "charged_hit_1",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit_1") }],
  },
  // raw: FeatureDamageCharged charged_hit_2 (isChild in raw → emit, fixture lists it).
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
    tags: ["plunge_shockwave"],
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_low") }],
  },
  // raw: FeatureDamagePlungeShockWave plunge_high
  {
    name: "plunge_high",
    tags: ["plunge_shockwave"],
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_high") }],
  },
  // --- Skill: Starfell Sword (geo) ---
  // raw: FeatureDamageSkill skill_dmg (geo, ATK-scaled)
  {
    name: "skill_dmg",
    category: "skill",
    element: "geo",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.skill_dmg") }],
  },
  // --- Burst: Wake of Earth (geo) ---
  // raw: FeatureDamageBurst traveler_shockwave (geo, ATK-scaled)
  {
    name: "traveler_shockwave",
    category: "burst",
    element: "geo",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.traveler_shockwave") }],
  },
];

// ---------------------------------------------------------------------------
// Constellations (P2.C Wave-1) + SELF passive toggles
// ---------------------------------------------------------------------------
// SELF buffs (golden-blind SKIPPED — the port modelled only the party.* mirror of C1 and
// skipped the two shared passive toggles entirely; both are OFF in the fixed solo build, so the
// 58k DAMAGE goldens never exercised them — a diff-parity sweep surfaced every Geo hit diverging):
//   "Swordfighting Techniques" (traveler_swordfighting_techniques): +3 base ATK. Ungated
//     ConditionBoolean. raw TravelerGeo.js:284-292.
//   "Special Training" (traveler_special_training): +7 base ATK, +15 EM, +50 base HP. Ungated
//     ConditionBoolean. raw TravelerGeo.js:293-303.
//   C1 "Invincible Stonewall" (traveler_invincible_stonewall): +10% CRIT Rate. ConditionBoolean
//     gated at C1 (constellation[0] → THE CONSTELLATION IS A GATE). The SELF mirror of
//     party.traveler_invincible_stonewall. raw TravelerGeo.js:307-317.
// C2 "Rockcore Meltdown": ConditionStatic, no real stats — SKIP.
// C3 "Awakening Belladona": +3 burst talent (char_skill_burst_bonus).
// C4 "Reaction Force": ConditionStatic, no real stats — SKIP.
// C5 "Liverock Tattoo": +3 skill talent (char_skill_elemental_bonus).
// C6 "Everlasting Boulder": ConditionStatic, no real stats — SKIP.
// Sources: raw/genshin_calc_pub/src/js/db/Char/TravelerGeo.js:284-370

const constellationConditions: readonly Condition[] = [
  // C3 — +3 Elemental Burst (Wake of Earth).
  { type: "constellation", constellation: 3, settings: { char_skill_burst_bonus: 3 } },
  // C5 — +3 Elemental Skill (Starfell Sword).
  { type: "constellation", constellation: 5, settings: { char_skill_elemental_bonus: 3 } },
  // SELF shared passives — +base ATK (every hit) + EM (reactions) + base HP (damage-inert here).
  // Ungated ConditionBooleans. raw TravelerGeo.js:284-303.
  { type: "boolean", name: "traveler_swordfighting_techniques", stats: { atk_base: 3 } },
  { type: "boolean", name: "traveler_special_training", stats: { atk_base: 7, mastery: 15, hp_base: 50 } },
  // SELF C1 "Invincible Stonewall" — +10% CRIT Rate (lifts every hit's avg). ConditionBoolean gated
  // at C1 (THE CONSTELLATION IS A GATE; base-inert below C1 / when untoggled). raw TravelerGeo.js:307-317.
  {
    type: "boolean",
    name: "traveler_invincible_stonewall",
    stats: { crit_rate: 10 },
    condition: { type: "constellation", constellation: 1 },
  },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const travelerGeo: DbObjectChar = {
  name: "traveler_geo",
  gameId: 10000005,
  rarity: 5,
  element: "geo",
  weapon: "sword",
  origin: "foreign",
  statTable: TravelerStatTable,
  talents,
  features,
  multipliers: [],
  conditions: constellationConditions,
  // C1 "Invincible Stonewall" — +10% CRIT Rate while inside the Stone Wall.
  // Source: raw/genshin_calc_pub/src/js/db/Char/TravelerGeo.js (partyData conditions)
  partyData: {
    conditions: [
      {
        type: "static",
        stats: { crit_rate: 10 },
        condition: { type: "boolean", name: "party.traveler_invincible_stonewall" },
      },
    ],
  },
};
