/**
 * Tighnari — dendro bow ATK scaler.
 *
 * 4-hit normal combo (hit 3: 2-hit multihit, child normal_hit_3_1 isChild:true),
 * aimed/charged shots (physical aimed, dendro tighnari_charged_dmg, dendro wreath
 * arrow tighnari_wreath_arrow_dmg), dendro clusterbloom arrow, plunge/low/high,
 * dendro skill, dendro burst (primary + secondary).
 *
 * A4 "Scholarly Blade": PostEffectStatsMastery → dmg_charged_tighnari (and
 * dmg_burst_tighnari) = 0.06 × min(mastery, 60). Always-active at A6.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Tighnari.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Tighnari)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Tighnari)
 */

import type { DbObjectChar, Feature, TalentResolver, CharPostEffect } from "@genshin/types";
import { Tighnari as TighnariStatTable } from "../generated/charTables.js";
import { Tighnari as TighnariTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return TighnariTalents.s1.p1;
      if (name === "normal_hit_2") return TighnariTalents.s1.p2;
      if (name === "normal_hit_3") return TighnariTalents.s1.p3;
      if (name === "normal_hit_4") return TighnariTalents.s1.p4;
      if (name === "aimed") return TighnariTalents.s1.p5;
      if (name === "tighnari_charged_dmg") return TighnariTalents.s1.p6;
      if (name === "tighnari_wreath_arrow_dmg") return TighnariTalents.s1.p7;
      if (name === "tighnari_clusterbloom_arrow_dmg") return TighnariTalents.s1.p8;
      if (name === "plunge") return TighnariTalents.s1.p9;
      if (name === "plunge_low") return TighnariTalents.s1.p10;
      if (name === "plunge_high") return TighnariTalents.s1.p11;
    }
    if (talent === "skill") {
      if (name === "skill_dmg") return TighnariTalents.s2.p1;
    }
    if (talent === "burst") {
      if (name === "tighnari_primary_dmg") return TighnariTalents.s3.p1;
      if (name === "tighnari_secondary_dmg") return TighnariTalents.s3.p2;
    }
    throw new Error(`tighnari talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks ---
  // raw: FeatureDamageNormal normal_hit_1 (Tighnari.js:137-144)
  {
    name: "normal_hit_1",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1") }],
  },
  // raw: FeatureDamageNormal normal_hit_2 (Tighnari.js:145-152)
  {
    name: "normal_hit_2",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2") }],
  },
  // raw: FeatureDamageMultihit normal_hit_3 (Tighnari.js:153-169) — parent, 2 hits total
  {
    name: "normal_hit_3",
    category: "attack",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }] },
    ],
  },
  // raw: FeatureDamageNormal normal_hit_3_1 (Tighnari.js:170-180) — child sub-hit
  {
    name: "normal_hit_3_1",
    category: "attack",
    isChild: true,
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }],
  },
  // raw: FeatureDamageNormal normal_hit_4 (Tighnari.js:181-188)
  {
    name: "normal_hit_4",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4") }],
  },
  // --- Charged attacks ---
  // raw: FeatureDamageChargedAimed aimed — physical aimed shot (Tighnari.js:189-197)
  {
    name: "aimed",
    category: "attack",
    damageType: "charged",
    damageBonuses: ["dmg_charged_tighnari"],
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.aimed") }],
  },
  // raw: FeatureDamageChargedAimed tighnari_charged_dmg — dendro charged (Tighnari.js:198-207)
  {
    name: "tighnari_charged_dmg",
    category: "attack",
    damageType: "charged",
    element: "dendro",
    damageBonuses: ["dmg_charged_tighnari"],
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.tighnari_charged_dmg") }],
  },
  // raw: FeatureDamageChargedAimed tighnari_wreath_arrow_dmg — dendro wreath arrow (Tighnari.js:208-217)
  {
    name: "tighnari_wreath_arrow_dmg",
    category: "attack",
    damageType: "charged",
    element: "dendro",
    damageBonuses: ["dmg_charged_tighnari"],
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.tighnari_wreath_arrow_dmg") }],
  },
  // raw: FeatureDamageCharged tighnari_clusterbloom_arrow_dmg — dendro charged (Tighnari.js:218-227)
  {
    name: "tighnari_clusterbloom_arrow_dmg",
    category: "attack",
    damageType: "charged",
    element: "dendro",
    damageBonuses: ["dmg_charged_tighnari"],
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.tighnari_clusterbloom_arrow_dmg") }],
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
  // --- Skill: Vijnana-Phala Mine (dendro) ---
  // raw: FeatureDamageSkill skill_dmg (Tighnari.js:264-271)
  {
    name: "skill_dmg",
    category: "skill",
    element: "dendro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.skill_dmg") }],
  },
  // --- Burst: Fashioner's Tanglevine Shaft (dendro) ---
  // raw: FeatureDamageBurst tighnari_primary_dmg (Tighnari.js:273-281)
  {
    name: "tighnari_primary_dmg",
    category: "burst",
    element: "dendro",
    damageBonuses: ["dmg_burst_tighnari"],
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.tighnari_primary_dmg") }],
  },
  // raw: FeatureDamageBurst tighnari_secondary_dmg (Tighnari.js:282-290)
  {
    name: "tighnari_secondary_dmg",
    category: "burst",
    element: "dendro",
    damageBonuses: ["dmg_burst_tighnari"],
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.tighnari_secondary_dmg") }],
  },
];

// ---------------------------------------------------------------------------
// Post-effects
// ---------------------------------------------------------------------------

// A4 "Scholarly Blade" (Tighnari.js:113-123): PostEffectStatsMastery
// dmg_charged_tighnari = dmg_burst_tighnari = 0.06 × min(mastery, 60).
// Auto-active at ascension 4+; no toggle needed at A6 canonical build.
// capValue = 0.06 × 60 = 3.6 (the display cap, percent-valued).
const a4PostEffects: readonly CharPostEffect[] = [
  {
    fromStat: "mastery",
    toStat: "dmg_charged_tighnari",
    ratio: 0.06,
    capValue: 3.6,
  },
  {
    fromStat: "mastery",
    toStat: "dmg_burst_tighnari",
    ratio: 0.06,
    capValue: 3.6,
  },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const tighnari: DbObjectChar = {
  name: "tighnari",
  gameId: 10000069,
  rarity: 5,
  element: "dendro",
  weapon: "bow",
  origin: "sumeru",
  statTable: TighnariStatTable,
  talents,
  features,
  multipliers: [],
  postEffects: a4PostEffects,
};
