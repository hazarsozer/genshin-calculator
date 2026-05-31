/**
 * Albedo — geo sword DEF+ATK scaler.
 *
 * 5-hit normal combo (physical sword). Charged 2-hit multihit
 * (charged_hit_total parent + isChild:true _1/_2). Plunge/low/high.
 *
 * Skill:
 *   skill_dmg — geo, ATK-scaled (char_skill_elemental, s2.p1)
 *   albedo_blossom — geo, DEF-scaled (scaling:'def', s2.p2),
 *     damageBonuses:['dmg_skill_albedo'] (A1 toggle, reads 0 in fixed build)
 *
 * Burst:
 *   burst_dmg — geo, ATK-scaled (char_skill_burst, s3.p1)
 *   albedo_fatal_blossom — geo, ATK-scaled (char_skill_burst, s3.p2)
 *
 * A1 "Calcite Might": ConditionBoolean dmg_skill_albedo:25 — toggle, off in
 * fixed build; damageBonuses key reads 0.
 * A4 "Homuncular Nature": ConditionBoolean mastery:125 — toggle, off.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Albedo.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Albedo)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Albedo)
 */

import type { DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Albedo as AlbedoStatTable } from "../generated/charTables.js";
import { Albedo as AlbedoTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1")  return AlbedoTalents.s1.p1;
      if (name === "normal_hit_2")  return AlbedoTalents.s1.p2;
      if (name === "normal_hit_3")  return AlbedoTalents.s1.p3;
      if (name === "normal_hit_4")  return AlbedoTalents.s1.p4;
      if (name === "normal_hit_5")  return AlbedoTalents.s1.p5;
      if (name === "charged_hit_1") return AlbedoTalents.s1.p6;
      if (name === "charged_hit_2") return AlbedoTalents.s1.p7;
      if (name === "plunge")        return AlbedoTalents.s1.p9;
      if (name === "plunge_low")    return AlbedoTalents.s1.p10;
      if (name === "plunge_high")   return AlbedoTalents.s1.p11;
    }
    if (talent === "skill") {
      if (name === "skill_dmg")       return AlbedoTalents.s2.p1;
      if (name === "albedo_blossom")  return AlbedoTalents.s2.p2;
    }
    if (talent === "burst") {
      if (name === "burst_dmg")              return AlbedoTalents.s3.p1;
      if (name === "albedo_fatal_blossom")   return AlbedoTalents.s3.p2;
    }
    throw new Error(`albedo talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (physical sword) ---
  // raw: FeatureDamageNormal normal_hit_1..5 (Albedo.js)
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
  // --- Skill: Solar Isotoma (geo) ---
  // raw: FeatureDamageSkill skill_dmg (geo, ATK-scaled, Albedo.js)
  {
    name: "skill_dmg",
    category: "skill",
    element: "geo",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.skill_dmg") }],
  },
  // raw: FeatureDamageSkill albedo_blossom (geo, DEF-scaled via scaling:'def*')
  // damageBonuses:['dmg_skill_albedo'] — A1 toggle, reads 0 in fixed build.
  // Albedo.js: new FeatureMultiplier({ scaling:'def*', leveling:'char_skill_elemental', values:p2 })
  {
    name: "albedo_blossom",
    category: "skill",
    element: "geo",
    damageBonuses: ["dmg_skill_albedo"],
    multipliers: [
      { scaling: "def", leveling: "char_skill_elemental", values: talents.get("skill.albedo_blossom") },
    ],
  },
  // --- Burst: Tectonic Tide (geo) ---
  // raw: FeatureDamageBurst burst_dmg (geo, ATK-scaled)
  {
    name: "burst_dmg",
    category: "burst",
    element: "geo",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") }],
  },
  // raw: FeatureDamageBurst albedo_fatal_blossom (geo, ATK-scaled)
  {
    name: "albedo_fatal_blossom",
    category: "burst",
    element: "geo",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.albedo_fatal_blossom") }],
  },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const albedo: DbObjectChar = {
  name: "albedo",
  gameId: 10000038,
  rarity: 5,
  element: "geo",
  weapon: "sword",
  origin: "mondstadt",
  statTable: AlbedoStatTable,
  talents,
  features,
  multipliers: [],
};
