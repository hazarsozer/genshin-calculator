/**
 * Neuvillette — hydro catalyst HP scaler.
 *
 * Normal attacks (As Water Seeks Equilibrium): 3-hit hydro combo plus a
 * standard charged hit, AND the signature charged "Equitable Judgment"
 * (neuvillette_equitable_judgment_dmg) which is HP-scaled.
 *
 * Charged Equitable Judgment scaling: raw uses FeatureMultiplierNeuvilleteCharged,
 * whose getScalingMultiplier() returns reactionBonus.getValue(level) ONLY when
 * settings.neuvillette_ancient_seas_legacy > 0 (the Sourcewater-droplet stacks).
 * In the fixed solo C0 build that condition is OFF (level 0) → the override
 * returns 1, so the multiplier behaves as a plain HP-scaled charged attack.
 * Modelled here as scaling:'hp'. (Source: NeuvilleteCharged.js getScalingMultiplier.)
 * Its critDamageBonuses:['crit_dmg_neuvillette'] is C2-gated (Constellation.js c2)
 * → off at C0, omitted.
 *
 * Plunge: plunge / plunge_low / plunge_high (hydro, char_skill_attack).
 *
 * Skill (O Tears, I Shall Repay):
 *   skill_dmg            — hydro, HP-scaled (scaling:'hp*', s2.p1)
 *   spiritbreath_thorn_dmg — hydro, ATK-scaled default (s2.p2). raw flags
 *     cannotReact; that only suppresses reaction toggling and is irrelevant to
 *     the non-reacted damage triple the fixture asserts → no field needed.
 *
 * Burst (O Tides, I Have Returned):
 *   burst_dmg                  — hydro, HP-scaled (s3.p1)
 *   neuvillette_waterfall_dmg  — hydro, HP-scaled (s3.p2)
 *
 * Conditions/post-effects OFF at baseline (omitted):
 *   - A1 "Heir to the Ancient Seas' Authority" (neuvillette_ancient_seas_legacy)
 *     — Sourcewater-droplet stack ConditionStacks, level 0 in the fixed build.
 *   - A4 "Discipline of the Supreme Arbitration" — ConditionNumber + boolean
 *     PostEffectStatsNeuvillette (dmg_hydro from current HP), toggle off at baseline.
 *   - All constellations (C0 build): C2 crit_dmg_neuvillette, C6 current-HP feature, etc.
 *
 * Reaction features (electrocharged / rupture / shatter) are emitted generically
 * by the engine — not declared on the character (cf. yelan.ts, same set).
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Neuvillette.js
 *   raw/genshin_calc_pub/src/js/classes/Feature2/Multiplier/NeuvilleteCharged.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Neuvillette)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Neuvillette)
 */

import type { DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Neuvillette as NeuvilletteStatTable } from "../generated/charTables.js";
import { Neuvillette as NeuvilletteTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1")                       return NeuvilletteTalents.s1.p1;
      if (name === "normal_hit_2")                       return NeuvilletteTalents.s1.p2;
      if (name === "normal_hit_3")                       return NeuvilletteTalents.s1.p3;
      if (name === "charged_hit")                        return NeuvilletteTalents.s1.p4;
      if (name === "neuvillette_equitable_judgment_dmg") return NeuvilletteTalents.s1.p5;
      if (name === "plunge")                             return NeuvilletteTalents.s1.p11;
      if (name === "plunge_low")                         return NeuvilletteTalents.s1.p12;
      if (name === "plunge_high")                        return NeuvilletteTalents.s1.p13;
    }
    if (talent === "skill") {
      if (name === "skill_dmg")              return NeuvilletteTalents.s2.p1;
      if (name === "spiritbreath_thorn_dmg") return NeuvilletteTalents.s2.p2;
    }
    if (talent === "burst") {
      if (name === "burst_dmg")                 return NeuvilletteTalents.s3.p1;
      if (name === "neuvillette_waterfall_dmg") return NeuvilletteTalents.s3.p2;
    }
    throw new Error(`neuvillette talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (hydro catalyst) ---
  {
    name: "normal_hit_1",
    category: "attack",
    element: "hydro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1") }],
  },
  {
    name: "normal_hit_2",
    category: "attack",
    element: "hydro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2") }],
  },
  {
    name: "normal_hit_3",
    category: "attack",
    element: "hydro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }],
  },
  // --- Charged attacks ---
  // raw: FeatureDamageCharged charged_hit (hydro, ATK-scaled)
  {
    name: "charged_hit",
    category: "attack",
    damageType: "charged",
    element: "hydro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }],
  },
  // raw: FeatureDamageCharged neuvillette_equitable_judgment_dmg (hydro, HP-scaled).
  // FeatureMultiplierNeuvilleteCharged scaling-multiplier = 1 at droplet level 0.
  {
    name: "neuvillette_equitable_judgment_dmg",
    category: "attack",
    damageType: "charged",
    element: "hydro",
    multipliers: [{ scaling: "hp", leveling: "char_skill_attack", values: talents.get("attack.neuvillette_equitable_judgment_dmg") }],
  },
  // --- Plunge attacks (hydro) ---
  {
    name: "plunge",
    category: "attack",
    damageType: "plunge",
    element: "hydro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge") }],
  },
  {
    name: "plunge_low",
    category: "attack",
    damageType: "plunge",
    element: "hydro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_low") }],
  },
  {
    name: "plunge_high",
    category: "attack",
    damageType: "plunge",
    element: "hydro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_high") }],
  },
  // --- Skill: O Tears, I Shall Repay ---
  // raw: FeatureDamageSkill skill_dmg (hydro, HP-scaled)
  {
    name: "skill_dmg",
    category: "skill",
    element: "hydro",
    multipliers: [{ scaling: "hp", leveling: "char_skill_elemental", values: talents.get("skill.skill_dmg") }],
  },
  // raw: FeatureDamageSkill spiritbreath_thorn_dmg (hydro, ATK-scaled, cannotReact)
  {
    name: "spiritbreath_thorn_dmg",
    category: "skill",
    element: "hydro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.spiritbreath_thorn_dmg") }],
  },
  // --- Burst: O Tides, I Have Returned ---
  // raw: FeatureDamageBurst burst_dmg (hydro, HP-scaled)
  {
    name: "burst_dmg",
    category: "burst",
    element: "hydro",
    multipliers: [{ scaling: "hp", leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") }],
  },
  // raw: FeatureDamageBurst neuvillette_waterfall_dmg (hydro, HP-scaled)
  {
    name: "neuvillette_waterfall_dmg",
    category: "burst",
    element: "hydro",
    multipliers: [{ scaling: "hp", leveling: "char_skill_burst", values: talents.get("burst.neuvillette_waterfall_dmg") }],
  },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const neuvillette: DbObjectChar = {
  name: "neuvillette",
  gameId: 10000087,
  rarity: 5,
  element: "hydro",
  weapon: "catalyst",
  origin: "fontaine",
  statTable: NeuvilletteStatTable,
  talents,
  features,
  multipliers: [],
};
