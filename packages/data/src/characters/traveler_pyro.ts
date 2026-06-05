/**
 * Traveler (Pyro) — pyro sword.
 *
 * Sword normals/charged/plunge are physical (no innate infusion in solo C0 —
 * the pyro attack infusion is a C6 constellation, skipped). Skill (Flowfire
 * Blade: blazing-threshold + hold + scorching-threshold) and burst (Plains
 * Scorcher) are pyro.
 *
 * charged_hit_total is a 2-hit multihit (p6 + p7); the fixture also asserts the
 * two component hits charged_hit_1 / charged_hit_2 as independent features, so
 * each is modelled as its own row (the raw children, isChild dropped so they emit).
 *
 * No always-on passive stat bonuses in the fixed solo build: the ascension
 * passives (True Flame of Incineration A1, Embers Unspent A4) carry no stats;
 * the Swordfighting-Techniques / Special-Training bonuses are toggle conditions
 * (OFF here). The ascension secondary (pyro DMG) is already folded into the
 * generated Traveler stat table (atk_percent ascension scale).
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/TravelerPyro.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Traveler)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (TravelerPyro)
 */

import type { Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Traveler as TravelerStatTable } from "../generated/charTables.js";
import { TravelerPyro as TravelerPyroTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return TravelerPyroTalents.s1.p1;
      if (name === "normal_hit_2") return TravelerPyroTalents.s1.p2;
      if (name === "normal_hit_3") return TravelerPyroTalents.s1.p3;
      if (name === "normal_hit_4") return TravelerPyroTalents.s1.p4;
      if (name === "normal_hit_5") return TravelerPyroTalents.s1.p5;
      if (name === "charged_hit_1") return TravelerPyroTalents.s1.p6;
      if (name === "charged_hit_2") return TravelerPyroTalents.s1.p7;
      if (name === "plunge") return TravelerPyroTalents.s1.p9;
      if (name === "plunge_low") return TravelerPyroTalents.s1.p10;
      if (name === "plunge_high") return TravelerPyroTalents.s1.p11;
    }
    if (talent === "skill") {
      if (name === "traveler_blazing_threshold_dmg") return TravelerPyroTalents.s2.p1;
      if (name === "hold_dmg") return TravelerPyroTalents.s2.p2;
      if (name === "traveler_scorching_threshold_dmg") return TravelerPyroTalents.s2.p3;
    }
    if (talent === "burst") {
      if (name === "burst_dmg") return TravelerPyroTalents.s3.p1;
    }
    throw new Error(`traveler_pyro talents: unknown path '${path}'`);
  },
};

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
  // --- Charged attack: 2-hit multihit (charged_hit_1 + charged_hit_2) ---
  // raw: FeatureDamageMultihit({ name: 'charged_hit_total', items: [p6, p7] })
  {
    name: "charged_hit_total",
    category: "attack",
    damageType: "charged",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit_1") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit_2") }] },
    ],
  },
  // Component hits of charged_hit_total (raw children, isChild dropped to emit).
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
  // --- Skill: Flowfire Blade (pyro) ---
  {
    name: "traveler_blazing_threshold_dmg",
    category: "skill",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.traveler_blazing_threshold_dmg") }],
  },
  {
    name: "hold_dmg",
    category: "skill",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.hold_dmg") }],
  },
  {
    name: "traveler_scorching_threshold_dmg",
    category: "skill",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.traveler_scorching_threshold_dmg") }],
  },
  // --- Burst: Plains Scorcher (pyro) ---
  {
    name: "burst_dmg",
    category: "burst",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") }],
  },
];

// ---------------------------------------------------------------------------
// Constellations (P2.C Wave-1)
// ---------------------------------------------------------------------------
// C1 "Starfire's Flowing Light": ConditionBoolean toggle (dmg_all) — SKIP.
// C2 "Ever-Lit Candle": ConditionStatic, no real stats — SKIP.
// C3 "Hearth's Illumination": +3 skill talent (char_skill_elemental_bonus).
// C4 "Ravaging Flame": ConditionBoolean toggle (dmg_pyro) — SKIP.
// C5 "Radiant Flames": +3 burst talent (char_skill_burst_bonus).
// C6 "The Sacred Flame Imperishable": ConditionBoolean toggle (crit_dmg + infusion) — SKIP.
// Sources: raw/genshin_calc_pub/src/js/db/Char/TravelerPyro.js:323-400

const constellationConditions: readonly Condition[] = [
  // C3 — +3 Elemental Skill (Flowfire Blade).
  { type: "constellation", constellation: 3, settings: { char_skill_elemental_bonus: 3 } },
  // C5 — +3 Elemental Burst (Plains Scorcher).
  { type: "constellation", constellation: 5, settings: { char_skill_burst_bonus: 3 } },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const travelerPyro: DbObjectChar = {
  name: "traveler_pyro",
  gameId: 10000005,
  rarity: 5,
  element: "pyro",
  weapon: "sword",
  origin: "foreign",
  statTable: TravelerStatTable,
  talents,
  features,
  multipliers: [],
  conditions: constellationConditions,
  // partyData — teammate kit buffs (P3.5.2 Bucket A)
  // C1 "Controlled Cremation": two ConditionBoolean buffs.
  //   cond[0]: party.traveler_pyro_starfires_flowing_light → dmg_all:6 (C1DmgBonus=6).
  //   cond[1]: party.traveler_pyro_starfires_flowing_light_2 → dmg_all:9 (C1DmgBonusNightsoul=9)
  //     gated by and[cond[0], nightsoul].
  //   Source: raw/genshin_calc_pub/src/js/db/Char/TravelerPyro.js partyData
  partyData: {
    conditions: [
      {
        type: "boolean",
        name: "party.traveler_pyro_starfires_flowing_light",
        stats: { dmg_all: 6 },
      },
      {
        type: "boolean",
        name: "party.traveler_pyro_starfires_flowing_light_2",
        stats: { dmg_all: 9 },
        condition: {
          type: "and",
          items: [
            { type: "boolean", name: "party.traveler_pyro_starfires_flowing_light" },
            { type: "nightsoul" },
          ],
        },
      },
    ],
  },
};
