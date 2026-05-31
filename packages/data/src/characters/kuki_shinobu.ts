/**
 * Kuki Shinobu — electro sword HP scaler.
 *
 * 4-hit normal combo, 2-hit charged (charged_hit_total parent + child hit_1/hit_2),
 * plunge/low/high, electro skill (skill_dmg + ring_dmg HP-plus-mastery-A4),
 * electro burst (HP-scaled), ring heal (not tested, empty damageType).
 *
 * A4 "Heart's Repose": adds 25% × mastery base damage to all skill hits (auto-active
 * at A6). Modelled as a second multiplier with scaling:'mastery' on each skill feature.
 *
 * Raw: FeatureMultiplier({scaling:'mastery*', source:'ascension4', values:25,
 *   condition:ConditionAscensionChar(4), target:FeatureMultiplierTarget({damageTypes:['skill']})})
 * Kuki.js:327-337. Always-active at canonical build (A6).
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Kuki.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Kuki)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Kuki)
 */

import type { DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Kuki as KukiStatTable } from "../generated/charTables.js";
import { Kuki as KukiTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return KukiTalents.s1.p1;
      if (name === "normal_hit_2") return KukiTalents.s1.p2;
      if (name === "normal_hit_3") return KukiTalents.s1.p3;
      if (name === "normal_hit_4") return KukiTalents.s1.p4;
      if (name === "charged_hit_1") return KukiTalents.s1.p5;
      if (name === "charged_hit_2") return KukiTalents.s1.p6;
      if (name === "plunge") return KukiTalents.s1.p8;
      if (name === "plunge_low") return KukiTalents.s1.p9;
      if (name === "plunge_high") return KukiTalents.s1.p10;
    }
    if (talent === "skill") {
      if (name === "skill_dmg") return KukiTalents.s2.p1;
      if (name === "kuki_shinobu_ring_dmg") return KukiTalents.s2.p4;
    }
    if (talent === "burst") {
      if (name === "kuki_shinobu_burst_dmg") return KukiTalents.s3.p1;
    }
    throw new Error(`kuki_shinobu talents: unknown path '${path}'`);
  },
};

// A4 "Heart's Repose": constant 25% × mastery added to skill hits (auto-active A6).
// raw: new ValueTable([A4MasteryDmg=25]) with source:'ascension4' → talentLevel=1.
const a4MasteryValues = { getValue: (_level: number) => 25 };

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks ---
  // raw: FeatureDamageNormal normal_hit_1 (Kuki.js:158-165)
  {
    name: "normal_hit_1",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1") }],
  },
  // raw: FeatureDamageNormal normal_hit_2 (Kuki.js:167-174)
  {
    name: "normal_hit_2",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2") }],
  },
  // raw: FeatureDamageNormal normal_hit_3 (Kuki.js:176-183)
  {
    name: "normal_hit_3",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }],
  },
  // raw: FeatureDamageNormal normal_hit_4 (Kuki.js:185-192)
  {
    name: "normal_hit_4",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4") }],
  },
  // --- Charged attacks ---
  // raw: FeatureDamageMultihit charged_hit_total (Kuki.js:194-217) — 2-hit total
  {
    name: "charged_hit_total",
    category: "attack",
    damageType: "charged",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit_1") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit_2") }] },
    ],
  },
  // raw: FeatureDamageCharged charged_hit_1 (Kuki.js:218-227)
  {
    name: "charged_hit_1",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit_1") }],
  },
  // raw: FeatureDamageCharged charged_hit_2 (Kuki.js:228-237)
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
  // --- Skill: Sanctifying Ring (electro) ---
  // raw: FeatureDamageSkill skill_dmg (Kuki.js:265-274) + A4 mastery term
  {
    name: "skill_dmg",
    category: "skill",
    element: "electro",
    multipliers: [
      { leveling: "char_skill_elemental", values: talents.get("skill.skill_dmg") },
      // A4: 25% × mastery base term, always-active at A6 (Kuki.js:327-337)
      { scaling: "mastery", leveling: "ascension4", values: a4MasteryValues },
    ],
  },
  // raw: FeatureDamageSkill kuki_shinobu_ring_dmg (Kuki.js:292-301) + A4 mastery term
  {
    name: "kuki_shinobu_ring_dmg",
    category: "skill",
    element: "electro",
    multipliers: [
      { leveling: "char_skill_elemental", values: talents.get("skill.kuki_shinobu_ring_dmg") },
      // A4: 25% × mastery base term, always-active at A6 (Kuki.js:327-337)
      { scaling: "mastery", leveling: "ascension4", values: a4MasteryValues },
    ],
  },
  // --- Burst: Gyoei Narukami Kariyama Rite (electro, HP scaler) ---
  // raw: FeatureDamageBurst kuki_shinobu_burst_dmg, scaling:'hp*' (Kuki.js:302-311)
  {
    name: "kuki_shinobu_burst_dmg",
    category: "burst",
    element: "electro",
    multipliers: [{ scaling: "hp", leveling: "char_skill_burst", values: talents.get("burst.kuki_shinobu_burst_dmg") }],
  },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const kukiShinobu: DbObjectChar = {
  name: "kuki_shinobu",
  gameId: 10000065,
  rarity: 4,
  element: "electro",
  weapon: "sword",
  origin: "inadzuma",
  statTable: KukiStatTable,
  talents,
  features,
  multipliers: [],
};
