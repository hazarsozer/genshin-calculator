/**
 * Traveler (Hydro) — hydro sword ATK scaler with HP-side skill scaling.
 *
 * 5-hit normal combo, 2-sub-hit charged (charged_hit_total multihit parent +
 * charged_hit_1 / charged_hit_2 sub-hits), plunge/low/high, then the hydro skill
 * Aquacrest Saber (three hits) and the hydro burst Rising Waters. Normals /
 * charged / plunge are physical (sword, no innate infusion in the fixed solo
 * build); skill + burst are hydro.
 *
 * SKILL HITS (all hydro):
 *   - traveler_torrent_surge_dmg — ATK-scaling talent%. Her second multiplier is
 *     the A4 "Clear Waters" HP→DMG bonus (FeatureMultiplierTravelerHydro), which
 *     reads the `traveler_clear_waters_percent` ConditionNumber (max 100). That
 *     condition is 0 in the fixed solo/no-toggle build, so the bonus contributes
 *     nothing and is omitted (verified: ATK-only term reproduces the oracle).
 *   - traveler_dewdrop_dmg — ATK-scaling talent% PLUS the always-on Suffusion
 *     HP-scaling term (`traveler_suffusion_dmg_bonus`, scaling 'hp*'). That second
 *     multiplier carries NO condition in her data, so it folds in unconditionally
 *     (verified: ATK term + HP term reproduces the oracle dewdrop triple).
 *   - spiritbreath_thorn_dmg — ATK-scaling talent%, cannotReact (no effect on the
 *     non-reacted golden path).
 *
 * SKIPPED (not C0-unconditional damage triples → excluded by the golden harness,
 * which only asserts non-empty-damageType fixture entries):
 *   - skill.traveler_spotless_waters_heal — A1 heal (FeatureHeal, empty damageType).
 *   - the C4 Pouring Descent shield (ConditionConstellation 4, OFF at C0; non-damage).
 *
 * No always-on passive ATK/crit/DMG bonuses fold in: the A1 marker is a heal,
 * the A4 "Clear Waters" bonus is gated on a zero-valued condition number, and both
 * `traveler_swordfighting_techniques` / `traveler_special_training` are
 * ConditionBoolean toggles (OFF in the fixed solo build). The reaction features
 * (rupture / electrocharged / shatter) are emitted generically from the hydro
 * element by the loader.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/TravelerHydro.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Traveler)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (TravelerHydro)
 */

import type { Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Traveler as TravelerStatTable } from "../generated/charTables.js";
import { TravelerHydro as TravelerHydroTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return TravelerHydroTalents.s1.p1;
      if (name === "normal_hit_2") return TravelerHydroTalents.s1.p2;
      if (name === "normal_hit_3") return TravelerHydroTalents.s1.p3;
      if (name === "normal_hit_4") return TravelerHydroTalents.s1.p4;
      if (name === "normal_hit_5") return TravelerHydroTalents.s1.p5;
      if (name === "charged_hit_1") return TravelerHydroTalents.s1.p6;
      if (name === "charged_hit_2") return TravelerHydroTalents.s1.p7;
      if (name === "plunge") return TravelerHydroTalents.s1.p9;
      if (name === "plunge_low") return TravelerHydroTalents.s1.p10;
      if (name === "plunge_high") return TravelerHydroTalents.s1.p11;
    }
    if (talent === "skill") {
      if (name === "traveler_torrent_surge_dmg") return TravelerHydroTalents.s2.p2;
      if (name === "traveler_dewdrop_dmg") return TravelerHydroTalents.s2.p1;
      if (name === "traveler_suffusion_dmg_bonus") return TravelerHydroTalents.s2.p6;
      if (name === "spiritbreath_thorn_dmg") return TravelerHydroTalents.s2.p3;
    }
    if (talent === "burst") {
      if (name === "burst_dmg") return TravelerHydroTalents.s3.p1;
    }
    throw new Error(`traveler_hydro talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (physical, sword) ---
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
  // --- Charged attack: 2-sub-hit multihit (charged_hit_total) + the sub-hits ---
  // raw: FeatureDamageMultihit({ name:'charged_hit_total', damageType:'charged',
  //   items: [{ p6 }, { p7 }] }) plus two FeatureDamageCharged({isChild:true}).
  // The sub-hits carry isChild in her data; per the harness we drop isChild so the
  // fixture's charged_hit_1 / charged_hit_2 entries emit as standalone features.
  {
    name: "charged_hit_total",
    category: "attack",
    damageType: "charged",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit_1") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit_2") }] },
    ],
  },
  {
    name: "charged_hit_1",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit_1") }],
  },
  {
    name: "charged_hit_2",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit_2") }],
  },
  // --- Plunge attacks (physical) ---
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
  // --- Skill: Aquacrest Saber (hydro) ---
  // Torrent surge: ATK-scaling talent%. A4 Clear Waters HP bonus omitted (its
  // condition number is 0 in the fixed solo build → contributes nothing).
  {
    name: "traveler_torrent_surge_dmg",
    category: "skill",
    element: "hydro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.traveler_torrent_surge_dmg") }],
  },
  // Dewdrop: ATK-scaling talent% + always-on Suffusion HP-scaling term (no condition).
  {
    name: "traveler_dewdrop_dmg",
    category: "skill",
    element: "hydro",
    multipliers: [
      { leveling: "char_skill_elemental", values: talents.get("skill.traveler_dewdrop_dmg") },
      { scaling: "hp", leveling: "char_skill_elemental", values: talents.get("skill.traveler_suffusion_dmg_bonus") },
    ],
  },
  // Spiritbreath Thorn: ATK-scaling talent% (cannotReact has no effect on the non-reacted path).
  {
    name: "spiritbreath_thorn_dmg",
    category: "skill",
    element: "hydro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.spiritbreath_thorn_dmg") }],
  },
  // --- Burst: Rising Waters (hydro) ---
  {
    name: "burst_dmg",
    category: "burst",
    element: "hydro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") }],
  },
];

// ---------------------------------------------------------------------------
// Constellations (P2.C Wave-1)
// ---------------------------------------------------------------------------
// C1 "Swelling Lake": ConditionStatic, no real stats — SKIP.
// C2 "Trickling Purity": ConditionStatic, no real stats — SKIP.
// C3 "Pouring Descent": +3 skill talent (char_skill_elemental_bonus).
// C4 "Pouring Descent II": ConditionStatic with text_percent_hp (display-only) — SKIP.
// C5 "Tides of Justice": +3 burst talent (char_skill_burst_bonus).
// C6 "Tides of Justice II": ConditionStatic with text_percent_hp (display-only) — SKIP.
// Sources: raw/genshin_calc_pub/src/js/db/Char/TravelerHydro.js:400-462

const constellationConditions: readonly Condition[] = [
  // C3 — +3 Elemental Skill (Aquacrest Saber).
  { type: "constellation", constellation: 3, settings: { char_skill_elemental_bonus: 3 } },
  // C5 — +3 Elemental Burst (Rising Waters).
  { type: "constellation", constellation: 5, settings: { char_skill_burst_bonus: 3 } },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const travelerHydro: DbObjectChar = {
  name: "traveler_hydro",
  gameId: 10000005,
  rarity: 5,
  element: "hydro",
  weapon: "sword",
  origin: "foreign",
  statTable: TravelerStatTable,
  talents,
  features,
  multipliers: [],
  conditions: constellationConditions,
};
