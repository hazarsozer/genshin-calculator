/**
 * Escoffier — cryo polearm.
 *
 * 3-hit normal combo (n3 is a 2-hit multihit with children _3_1 and _3_2),
 * cryo charged hit (from char's element infusion behavior? polearm defaults to
 * physical but Escoffier's n/c are physical; fixture confirms physical),
 * plunge/low/high.
 * Cryo skill: skill_dmg + escoffier_frozen_parfait_attack_dmg + surging_blade_dmg.
 * Cryo burst: burst_dmg.
 * burst.heal (FeatureMultiplierList) and other.escoffier_rehab_diet_heal
 * (FeatureHeal) both have damageType="" → not asserted by golden harness; omit.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Escoffier.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Escoffier)
 */

import type { DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Escoffier as EscoffierStatTable } from "../generated/charTables.js";
import { Escoffier as EscoffierTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1")  return EscoffierTalents.s1.p1;
      if (name === "normal_hit_2")  return EscoffierTalents.s1.p2;
      if (name === "normal_hit_3_1") return EscoffierTalents.s1.p3;
      if (name === "normal_hit_3_2") return EscoffierTalents.s1.p4;
      if (name === "charged_hit")   return EscoffierTalents.s1.p5;
      if (name === "plunge")        return EscoffierTalents.s1.p7;
      if (name === "plunge_low")    return EscoffierTalents.s1.p8;
      if (name === "plunge_high")   return EscoffierTalents.s1.p9;
    }
    if (talent === "skill") {
      if (name === "skill_dmg")                          return EscoffierTalents.s2.p1;
      if (name === "escoffier_frozen_parfait_attack_dmg") return EscoffierTalents.s2.p2;
      if (name === "surging_blade_dmg")                  return EscoffierTalents.s2.p4;
    }
    if (talent === "burst") {
      if (name === "burst_dmg") return EscoffierTalents.s3.p1;
    }
    throw new Error(`escoffier talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks ---
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
  // normal_hit_3: 2-hit multihit parent (two different tables: _3_1 and _3_2).
  // raw: FeatureDamageMultihit({ name:'normal_hit_3', items:[{mult:p3},{mult:p4}] })
  {
    name: "normal_hit_3",
    category: "attack",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3_1") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3_2") }] },
    ],
  },
  // Sub-hits of normal_hit_3: fixture asserts them individually (damageType:"normal").
  // raw: FeatureDamageNormal({ isChild:true, ... }) — emit as regular (no isChild in TS).
  {
    name: "normal_hit_3_1",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3_1") }],
  },
  {
    name: "normal_hit_3_2",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3_2") }],
  },
  // --- Charged attack (physical polearm) ---
  {
    name: "charged_hit",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }],
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
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_low") }],
  },
  {
    name: "plunge_high",
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_high") }],
  },
  // --- Skill: Low Temperature Cooking ---
  {
    name: "skill_dmg",
    category: "skill",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.skill_dmg") }],
  },
  {
    name: "escoffier_frozen_parfait_attack_dmg",
    category: "skill",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.escoffier_frozen_parfait_attack_dmg") }],
  },
  // surging_blade_dmg: cryo skill DoT (cannotReact in raw but still asserted as skill hit).
  {
    name: "surging_blade_dmg",
    category: "skill",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.surging_blade_dmg") }],
  },
  // --- Burst: Scoring Cuts ---
  {
    name: "burst_dmg",
    category: "burst",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") }],
  },
  // burst.heal (FeatureMultiplierList, HP-based heal, damageType="") — SKIP: not asserted.
  // other.escoffier_rehab_diet_heal (FeatureHeal, constant heal, damageType="") — SKIP.
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const escoffier: DbObjectChar = {
  name: "escoffier",
  gameId: 10000112,
  rarity: 5,
  element: "cryo",
  weapon: "polearm",
  origin: "fontaine",
  statTable: EscoffierStatTable,
  // A4 "Inspiration Immersed Seasoning": a ConditionStaticLevel gated ONLY by
  // ConditionAscensionChar({ascension:4}) (auto-active at the canonical A6, no
  // toggle), levelSetting `escoffier_chars_count`. Unset → getLevel() ||= 1, so
  // it indexes A4ResShred[0] = -5: enemy_res_cryo -= 5 and enemy_res_hydro -= 5
  // (RAW percents; buildStats folds them into the base enemy resistance → 0.05).
  // The oracle was generated with this shred active, so her cryo/hydro features
  // land at res 0.05, not 0.10. raw: db/Char/Escoffier.js:336-347 (StatTable
  // 'enemy_res_cryo'/'enemy_res_hydro' = A4ResShred), Condition/Static/Level.js.
  baseStats: { enemy_res_cryo: -5, enemy_res_hydro: -5 },
  talents,
  features,
  multipliers: [],
};
