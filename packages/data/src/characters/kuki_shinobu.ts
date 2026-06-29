/**
 * Kuki Shinobu — electro sword HP scaler.
 *
 * 4-hit normal combo, 2-hit charged (charged_hit_total parent + child hit_1/hit_2),
 * plunge/low/high, electro skill (skill_dmg + ring_dmg HP-plus-mastery-A4),
 * electro burst (HP-scaled), ring heal (kuki_shinobu_ring_healing — HP + mastery-A4).
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

import type { Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
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
      if (name === "kuki_shinobu_ring_healing") return KukiTalents.s2.p2;
      if (name === "kuki_shinobu_ring_healing_flat") return KukiTalents.s2.p3;
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

// A4 mastery-scaling term for the ring heal (auto-active A6).
// raw: new FeatureMultiplier({ scaling:'mastery*', source:'ascension4', values:new ValueTable([75]) })
// Kuki.js:284-289. ValueTable([75]) → getValue(1)=75.
const a4MasteryHealValues = { getValue: (_level: number) => 75 };

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
  // --- kuki_shinobu_ring_healing: HP-scaled + flat (FeatureMultiplierList) + A4 mastery ---
  // raw: FeatureHeal({ name:'kuki_shinobu_ring_healing', category:'skill',
  //   multipliers:[
  //     FeatureMultiplierList({ scaling:'hp*', leveling:'char_skill_elemental',
  //       values:[s2.p2 (% HP), s2.p3 (flat HP)] }),   ← values[0]=%, values[1]=flat
  //     FeatureMultiplier({ scaling:'mastery*', source:'ascension4', values:[75],
  //       condition:ConditionAscensionChar({ascension:4}) }),
  //   ] }) — Kuki.js:275-291
  {
    name: "kuki_shinobu_ring_healing",
    category: "skill",
    output: { kind: "heal" },
    multipliers: [
      {
        scaling: "hp",
        leveling: "char_skill_elemental",
        values: talents.get("skill.kuki_shinobu_ring_healing"),
        flatValues: talents.get("skill.kuki_shinobu_ring_healing_flat"),
      },
      { scaling: "mastery", leveling: "ascension4", values: a4MasteryHealValues },
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
  // --- C4 "To Sever Sealing": cons-added electro skill-category hit, HP-scaled (9.7%).
  // raw: FeatureDamageSkill name:'kuki_shinobu_to_sever_sealing_dmg', category:'other',
  //   scaling:'hp*', source:'constellation4', ValueTable([9.7]),
  //   condition:ConditionConstellation({constellation:4}). Kuki.js:313-325.
  // category omitted → loader infers "other." prefix; FeatureDamageSkill → damageType:"skill".
  {
    name: "kuki_shinobu_to_sever_sealing_dmg",
    element: "electro",
    damageType: "skill",
    condition: { type: "constellation", constellation: 4 },
    multipliers: [
      {
        scaling: "hp",
        leveling: "char_skill_elemental",
        values: { getValue: (_level: number) => 9.7 },
        source: "constellation4",
      },
      // A4: 25% × mastery base term — her A4 multiplier targets damageTypes:['skill'],
      // so this skill-type hit picks it up too (same per-feature model as skill_dmg/ring_dmg).
      { scaling: "mastery", leveling: "ascension4", values: a4MasteryValues },
    ],
  },
];

// ---------------------------------------------------------------------------
// Constellation conditions (P2.C)
// ---------------------------------------------------------------------------
// C1 "To Cloister Compassion": ConditionStatic (display-only) → SKIP.
// C2 "To Forsake Fortune": ConditionStatic (display-only) → SKIP.
// C3 "To Sever Sealing": +3 levels to skill (elemental). Kuki.js:382-390.
// C4 "To Sever Sealing" damage: cons-added feature above; cons array slot is
//   ConditionStatic (display-only text_percent:9.7) → no stat entry needed here.
// C5 "To Ward Weakness": +3 levels to burst. Kuki.js:401-409.
// C6 "To Ward Weakness" mastery: ConditionBoolean toggle (+150 EM, modelled below) — was golden-
//   blind SKIPPED (the self toggle is OFF in the fixed build, so the goldens never exercised it; a
//   diff-parity sweep surfaced her skill hits + reactions diverging from cons 6). +150 EM lifts her
//   skill damage (via the A4 mastery→skill multiplier) AND her transformative reactions.
const constellationConditions: readonly Condition[] = [
  // C3: +3 levels to Sanctifying Ring (elemental skill). Kuki.js:382-390.
  { type: "constellation", constellation: 3, settings: { char_skill_elemental_bonus: 3 } },
  // C5: +3 levels to Gyoei Narukami Kariyama Rite (burst). Kuki.js:401-409.
  { type: "constellation", constellation: 5, settings: { char_skill_burst_bonus: 3 } },
  // SELF C6 "To Ward Weakness" — +150 Elemental Mastery (mastery). ConditionBoolean toggle gated at
  // C6 (constellation[5] → THE CONSTELLATION IS A GATE; base-inert below C6 / when untoggled). Lifts
  // her skill damage through the A4 mastery→skill multiplier + her reactions (EM scales them). No
  // party mirror (self-only). raw Kuki.js:411-423 (C6Mastery = 150).
  {
    type: "boolean",
    name: "kuki_shinobu_to_ward_weakness",
    stats: { mastery: 150 },
    condition: { type: "constellation", constellation: 6 },
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
  conditions: constellationConditions,
};
