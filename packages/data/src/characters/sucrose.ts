/**
 * Sucrose — anemo catalyst ATK scaler.
 *
 * 4-hit normal combo (anemo), anemo charged hit, plunge/low/high (anemo),
 * anemo skill (skill_dmg), anemo burst (dot_dmg + 4 element-specific
 * anemoskill hits: pyro/hydro/cryo/electro each using the same anemoskill_dmg
 * multiplier but different element for resistance lookup).
 *
 * A4 "Mollis Favonius" shares 20% of Sucrose's EM with the party. The self-readout
 * other.sucrose_mastery_bonus (= 0.2 × her EM) is modelled as output:{kind:"static"}
 * (P3.5.3); the teammate-buff side is in partyData.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Sucrose.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Sucrose)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Sucrose)
 */

import type { CharPostEffect, Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Sucrose as SucroseStatTable } from "../generated/charTables.js";
import { Sucrose as SucroseTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return SucroseTalents.s1.p1;
      if (name === "normal_hit_2") return SucroseTalents.s1.p2;
      if (name === "normal_hit_3") return SucroseTalents.s1.p3;
      if (name === "normal_hit_4") return SucroseTalents.s1.p4;
      if (name === "charged_hit")  return SucroseTalents.s1.p5;
      if (name === "plunge")       return SucroseTalents.s1.p7;
      if (name === "plunge_low")   return SucroseTalents.s1.p8;
      if (name === "plunge_high")  return SucroseTalents.s1.p9;
    }
    if (talent === "skill") {
      if (name === "skill_dmg") return SucroseTalents.s2.p1;
    }
    if (talent === "burst") {
      if (name === "dot_dmg")        return SucroseTalents.s3.p1;
      if (name === "anemoskill_dmg") return SucroseTalents.s3.p2;
    }
    throw new Error(`sucrose talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (anemo catalyst — all anemo) ---
  // raw/genshin_calc_pub/src/js/db/Char/Sucrose.js — FeatureDamageNormal × 4
  {
    name: "normal_hit_1",
    category: "attack",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1") }],
  },
  {
    name: "normal_hit_2",
    category: "attack",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2") }],
  },
  {
    name: "normal_hit_3",
    category: "attack",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }],
  },
  {
    name: "normal_hit_4",
    category: "attack",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4") }],
  },
  // --- Charged attack (anemo catalyst) ---
  // raw/genshin_calc_pub/src/js/db/Char/Sucrose.js — FeatureDamageCharged charged_hit
  {
    name: "charged_hit",
    category: "attack",
    damageType: "charged",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }],
  },
  // --- Plunge attacks (anemo catalyst) ---
  // raw/genshin_calc_pub/src/js/db/Char/Sucrose.js — FeatureDamagePlunge*
  {
    name: "plunge",
    category: "attack",
    damageType: "plunge",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge") }],
  },
  {
    name: "plunge_low",
    tags: ["plunge_shockwave"],
    category: "attack",
    damageType: "plunge",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_low") }],
  },
  {
    name: "plunge_high",
    tags: ["plunge_shockwave"],
    category: "attack",
    damageType: "plunge",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_high") }],
  },
  // --- Skill: Astable Anemohypostasis Creation - 6308 (anemo) ---
  // raw/genshin_calc_pub/src/js/db/Char/Sucrose.js — FeatureDamageSkill skill_dmg
  {
    name: "skill_dmg",
    category: "skill",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.skill_dmg") }],
  },
  // --- Burst: Forbidden Creation - Isomer 75 / Type II (anemo) ---
  // dot_dmg: continuous DoT (anemo)
  // raw/genshin_calc_pub/src/js/db/Char/Sucrose.js — FeatureDamageBurst dot_dmg
  {
    name: "dot_dmg",
    category: "burst",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.dot_dmg") }],
  },
  // anemoskill_*_dmg: element-specific burst hits — same multiplier, different element
  // raw/genshin_calc_pub/src/js/db/Char/Sucrose.js — FeatureDamageBurst anemoskill_pyro_dmg etc.
  {
    name: "anemoskill_pyro_dmg",
    category: "burst",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.anemoskill_dmg") }],
  },
  {
    name: "anemoskill_hydro_dmg",
    category: "burst",
    element: "hydro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.anemoskill_dmg") }],
  },
  {
    name: "anemoskill_cryo_dmg",
    category: "burst",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.anemoskill_dmg") }],
  },
  {
    name: "anemoskill_electro_dmg",
    category: "burst",
    element: "electro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.anemoskill_dmg") }],
  },
  // --- A4 "Mollis Favonius" static readout: other.sucrose_mastery_bonus = 20% of Sucrose's EM ---
  // FeaturePostEffectValue(PostEffectStatsMastery, percent=const 0.2), auto-active at A6, format="" (no ×100).
  // The TEAMMATE-buff side is modelled in partyData below; this is the self-readout value (0.2 × mastery_total).
  // raw/genshin_calc_pub/src/js/db/Char/Sucrose.js:244-251
  {
    name: "sucrose_mastery_bonus",
    category: "other",
    output: { kind: "static" },
    multipliers: [
      { scaling: "mastery", leveling: "", values: { getValue: () => 20 } },
    ],
  },
];

// ---------------------------------------------------------------------------
// Constellations (P2.C Wave-1)
// ---------------------------------------------------------------------------
// C1 "Clustered Vacuum Field": ConditionStatic no real stats → SKIP.
// C2 "Unbound Form": ConditionStatic no real stats → SKIP.
// C3 "Flawless Alchemistress": +3 Elemental Skill talent levels.
//   Raw cons[2]: Condition{ settings:{ char_skill_elemental_bonus:3 } }
// C4 "Alchemania": ConditionStatic no real stats → SKIP.
// C5 "Carefree Wishes": +3 Elemental Burst talent levels.
//   Raw cons[4]: Condition{ settings:{ char_skill_burst_bonus:3 } }
// C6 "Chaotic Entropy": ConditionDropdownElement (element toggle for DMG%) → SKIP.
// Sources: raw/genshin_calc_pub/src/js/db/Char/Sucrose.js:277-363

const constellationConditions: readonly Condition[] = [
  // C3 "Flawless Alchemistress" — +3 Elemental Skill talent levels.
  // Raw cons[2]: Condition{ settings:{ char_skill_elemental_bonus:3 } }
  { type: "constellation", constellation: 3, settings: { char_skill_elemental_bonus: 3 } },
  // C5 "Carefree Wishes" — +3 Elemental Burst talent levels.
  // Raw cons[4]: Condition{ settings:{ char_skill_burst_bonus:3 } }
  { type: "constellation", constellation: 5, settings: { char_skill_burst_bonus: 3 } },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const sucrose: DbObjectChar = {
  name: "sucrose",
  gameId: 10000043,
  rarity: 4,
  element: "anemo",
  weapon: "catalyst",
  origin: "mondstadt",
  statTable: SucroseStatTable,
  talents,
  features,
  multipliers: [],
  conditions: constellationConditions,
  // partyData — teammate kit buffs (P3.5.2 Bucket B).
  // Source: raw/genshin_calc_pub/src/js/db/Char/Sucrose.js:361-467
  // Scope: oracle-gated core only — A4 "Mollis Favonius" EM share (20% of Sucrose EM).
  // Deferred to the P3.5.2 variant-rep pass:
  //   A1 "Catalyst Conversion": +50 EM to matching-element party (element-gated subConditions, needs
  //     dropdown-element condition support in engine).
  //   C6 "Chaotic Entropy": +20% elemental DMG per swirled element (ConditionDropdownElement).
  partyData: {
    loadStats: {
      stats: ["mastery_total"],
    },
    conditions: [
      // ConditionNumber: lifts the teammate's mastery_total into the recipient's stat bag.
      { type: "number", name: "sucrose_mastery", max: 10000 },
      // Mollis Favonius master toggle (A4 passive; gates the EM postEffect below).
      { type: "boolean", name: "party.sucrose_mollis_favonius" },
    ],
    postEffects: [
      // A4 "Mollis Favonius": shares 20% of Sucrose's EM with the party.
      // Raw: percent: StatTable('mastery', [0.2])
      // Source: raw/genshin_calc_pub/src/js/db/Char/Sucrose.js:442-449
      {
        fromStat: "sucrose_mastery",
        toStat: "mastery",
        ratio: 0.2,
        conditions: [{ type: "boolean", name: "party.sucrose_mollis_favonius" }],
      } satisfies CharPostEffect,
    ],
  },
};
