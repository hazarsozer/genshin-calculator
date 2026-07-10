/**
 * Charlotte — cryo catalyst ATK scaler.
 *
 * 3-hit normal combo (all cryo), cryo charged hit, cryo plunge, cryo
 * spiritbreath thorn (from normals, also damageType=charged), cryo skill
 * (press / hold / snappy-silhouette mark / focused-impression mark), cryo burst
 * (burst_dmg + kamera_dmg). Heals (heal, charlotte_kamera_heal,
 * charlotte_verification_heal [C1], charlotte_coordinate_heal [C6]) have no
 * damageType and are skipped by the golden harness.
 *
 * A4 "Diversified Investigation" — two ConditionStaticLevel paths:
 *   same-origin  → healing [0,5,10,15] gated on party_origin_same ≥ 1 (feeds her heal readouts)
 *   diff-origin  → dmg_cryo [0,5,10,15] gated on party_origin_different ≥ 1
 * Solo: both settings absent/0 → level 1 → table[0] = 0 → no effect.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Charlotte.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Charlotte)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Charlotte)
 */

import type { Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Charlotte as CharlotteStatTable } from "../generated/charTables.js";
import { Charlotte as CharlotteTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return CharlotteTalents.s1.p1;
      if (name === "normal_hit_2") return CharlotteTalents.s1.p2;
      if (name === "normal_hit_3") return CharlotteTalents.s1.p3;
      if (name === "charged_hit") return CharlotteTalents.s1.p4;
      if (name === "plunge") return CharlotteTalents.s1.p6;
      if (name === "plunge_low") return CharlotteTalents.s1.p7;
      if (name === "plunge_high") return CharlotteTalents.s1.p8;
      if (name === "spiritbreath_thorn_dmg") return CharlotteTalents.s1.p9;
    }
    if (talent === "skill") {
      if (name === "charlotte_photo_press_dmg") return CharlotteTalents.s2.p1;
      if (name === "charlotte_photo_hold_dmg") return CharlotteTalents.s2.p2;
      if (name === "charlotte_snappy_silhouette_mark_dmg") return CharlotteTalents.s2.p3;
      if (name === "charlotte_focused_impression_mark_dmg") return CharlotteTalents.s2.p6;
    }
    if (talent === "burst") {
      if (name === "heal_percent")              return CharlotteTalents.s3.p1;
      if (name === "heal_flat")                 return CharlotteTalents.s3.p2;
      if (name === "burst_dmg")                 return CharlotteTalents.s3.p3;
      if (name === "charlotte_kamera_heal_percent") return CharlotteTalents.s3.p4;
      if (name === "charlotte_kamera_heal_flat")    return CharlotteTalents.s3.p5;
      if (name === "charlotte_kamera_dmg")      return CharlotteTalents.s3.p6;
    }
    throw new Error(`charlotte talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// C4 "A Responsibility to Oversee" — scalingMultiplier ×1.1 on her burst damage
// (burst_dmg, charlotte_kamera_dmg, charlotte_coordinate_dmg), gated AND(toggle, C4).
// raw: scalingMultiplier:1.1 (C4BurstBonus), scalingSource:'constellation4',
// scalingMultiplierCondition: ConditionAnd([Boolean(charlotte_a_responsibility_to_oversee),
// Constellation(4)]) (Charlotte.js:308-318, 333-343, 360-370). The port has no conditional
// scalingMultiplier field, so the ×1.1 is folded as a SECOND base-term multiplier of +0.1×
// the same talent% (talent%×atk + talent%×atk×0.1 = talent%×atk×1.1), gated by this condition.
// SELF buff (no party.* mirror) → was golden-blind SKIPPED (no golden sets the toggle).
// ---------------------------------------------------------------------------
const c4OverseeGate: Condition = {
  type: "and",
  items: [
    { type: "boolean", name: "charlotte_a_responsibility_to_oversee" },
    { type: "constellation", constellation: 4 },
  ],
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (cryo catalyst, always cryo) ---
  // raw/genshin_calc_pub/src/js/db/Char/Charlotte.js:172-181
  {
    name: "normal_hit_1",
    category: "attack",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1") }],
  },
  {
    name: "normal_hit_2",
    category: "attack",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2") }],
  },
  {
    name: "normal_hit_3",
    category: "attack",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }],
  },
  // --- Charged attack ---
  // raw/genshin_calc_pub/src/js/db/Char/Charlotte.js:202-211
  {
    name: "charged_hit",
    category: "attack",
    damageType: "charged",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }],
  },
  // --- Plunge attacks ---
  // raw/genshin_calc_pub/src/js/db/Char/Charlotte.js:212-241
  {
    name: "plunge",
    category: "attack",
    damageType: "plunge",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge") }],
  },
  {
    name: "plunge_low",
    tags: ["plunge_shockwave"],
    category: "attack",
    damageType: "plunge",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_low") }],
  },
  {
    name: "plunge_high",
    tags: ["plunge_shockwave"],
    category: "attack",
    damageType: "plunge",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_high") }],
  },
  // --- Spiritbreath Thorn (FeatureDamageCharged, cryo, cannotReact) ---
  // Shoots out on charged attack; uses attack talent p9.
  // raw/genshin_calc_pub/src/js/db/Char/Charlotte.js:242-252
  {
    name: "spiritbreath_thorn_dmg",
    category: "attack",
    damageType: "charged",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.spiritbreath_thorn_dmg") }],
  },
  // --- Skill: Freezing Point Composition ---
  // raw/genshin_calc_pub/src/js/db/Char/Charlotte.js:253-292
  {
    name: "charlotte_photo_press_dmg",
    category: "skill",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.charlotte_photo_press_dmg") }],
  },
  {
    name: "charlotte_photo_hold_dmg",
    category: "skill",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.charlotte_photo_hold_dmg") }],
  },
  {
    name: "charlotte_snappy_silhouette_mark_dmg",
    category: "skill",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.charlotte_snappy_silhouette_mark_dmg") }],
  },
  {
    name: "charlotte_focused_impression_mark_dmg",
    category: "skill",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.charlotte_focused_impression_mark_dmg") }],
  },
  // --- Burst: Comprehensive Confirmation ---
  // burst_dmg: cryo burst hit. raw/genshin_calc_pub/src/js/db/Char/Charlotte.js:303-318
  {
    name: "burst_dmg",
    category: "burst",
    element: "cryo",
    multipliers: [
      { leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") },
      // C4 ×1.1 (folded as +0.1× base term, gated AND(toggle, C4)). Charlotte.js:308-318.
      {
        leveling: "char_skill_burst",
        values: talents.get("burst.burst_dmg"),
        scalingMultiplier: 0.1,
        source: "constellation4",
        condition: c4OverseeGate,
      },
    ],
  },
  // charlotte_kamera_dmg: periodic kamera hits during burst.
  // raw/genshin_calc_pub/src/js/db/Char/Charlotte.js:329-344
  {
    name: "charlotte_kamera_dmg",
    category: "burst",
    element: "cryo",
    multipliers: [
      { leveling: "char_skill_burst", values: talents.get("burst.charlotte_kamera_dmg") },
      // C4 ×1.1 (folded as +0.1× base term, gated AND(toggle, C4)). Charlotte.js:333-343.
      {
        leveling: "char_skill_burst",
        values: talents.get("burst.charlotte_kamera_dmg"),
        scalingMultiplier: 0.1,
        source: "constellation4",
        condition: c4OverseeGate,
      },
    ],
  },
  // C6 "A Summation of Interest": cons-added burst coordinate hit at 180% ATK.
  // Raw: Charlotte.js features FeatureDamageBurst charlotte_coordinate_dmg,
  // ValueTable([180]), source:'constellation6', condition:ConditionConstellation({constellation:6}).
  // scalingMultiplierCondition (C4 boolean toggle) is OFF in fixed build → omit scalingMultiplier.
  // Charlotte.js:356-372.
  {
    name: "charlotte_coordinate_dmg",
    category: "burst",
    element: "cryo",
    condition: { type: "constellation", constellation: 6 },
    multipliers: [
      {
        leveling: "char_skill_burst",
        values: { getValue: (_level: number) => 180 },
        source: "constellation6",
      },
      // C4 ×1.1 (folded as +0.1× base term, gated AND(toggle, C4)). Charlotte.js:360-370.
      {
        leveling: "char_skill_burst",
        values: { getValue: (_level: number) => 180 },
        scalingMultiplier: 0.1,
        source: "constellation4",
        condition: c4OverseeGate,
      },
    ],
  },
  // --- FeatureHeal: burst heals — ATK-scaled FeatureMultiplierList (Charlotte.js:293-328) ---
  // heal: s3.p1 (% ATK) + s3.p2 (flat). Charlotte.js:293-301. No scaling: key → default atk*.
  {
    name: "heal",
    category: "burst",
    output: { kind: "heal" },
    multipliers: [
      {
        scaling: "atk",
        leveling: "char_skill_burst",
        values: talents.get("burst.heal_percent"),
        flatValues: talents.get("burst.heal_flat"),
      },
    ],
  },
  // charlotte_kamera_heal: s3.p4 (% ATK) + s3.p5 (flat). Charlotte.js:319-327. Same default atk*.
  {
    name: "charlotte_kamera_heal",
    category: "burst",
    output: { kind: "heal" },
    multipliers: [
      {
        scaling: "atk",
        leveling: "char_skill_burst",
        values: talents.get("burst.charlotte_kamera_heal_percent"),
        flatValues: talents.get("burst.charlotte_kamera_heal_flat"),
      },
    ],
  },
  // --- C1 "A Need to Verify Facts" burst heal (burst.charlotte_verification_heal) ---
  // raw: FeatureHeal({ category:'burst', name:'charlotte_verification_heal',
  //   multipliers:[FeatureMultiplier({ source:'constellation1',
  //     values:new ValueTable([TalenValues.C1VerificationHeal=80]) })],
  //   condition:ConditionConstellation({constellation:1}) })  Charlotte.js:347-355. No `scaling`
  // field in raw → default atk* (same as heal/charlotte_kamera_heal above). No leveling table
  // (constant value) → leveling:"".
  {
    name: "charlotte_verification_heal",
    category: "burst",
    output: { kind: "heal" },
    condition: { type: "constellation", constellation: 1 },
    multipliers: [
      { scaling: "atk", leveling: "", values: { getValue: () => 80 }, source: "constellation1" },
    ],
  },
  // --- C6 "A Summation of Interest" burst heal (burst.charlotte_coordinate_heal) ---
  // raw: FeatureHeal({ category:'burst', name:'charlotte_coordinate_heal',
  //   multipliers:[FeatureMultiplier({ source:'constellation6',
  //     values:new ValueTable([TalenValues.C6CoordHeal=42]) })],
  //   condition:ConditionConstellation({constellation:6}) })  Charlotte.js:375-383. Default atk*
  // scaling, constant value, riding alongside the C6 charlotte_coordinate_dmg feature above.
  {
    name: "charlotte_coordinate_heal",
    category: "burst",
    output: { kind: "heal" },
    condition: { type: "constellation", constellation: 6 },
    multipliers: [
      { scaling: "atk", leveling: "", values: { getValue: () => 42 }, source: "constellation6" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Passive A4: Diversified Investigation (Charlotte.js:409-422)
// diff-origin path: dmg_cryo +5%/10%/15% per 1/2/3 party members of different origin.
// levelSetting: party_origin_different; fromZero:true → level = party_origin_different + 1.
// table (raw StatTable, excl. text_number display entry): [0, 5, 10, 15].
// gated by ConditionBoolean(party_origin_different) — only active when ≥ 1 diff-origin member.
// ---------------------------------------------------------------------------
const a4DiffOrigin: Condition = {
  type: "static-level",
  levelSetting: "party_origin_different",
  fromZero: true,
  levelStats: { dmg_cryo: [0, 5, 10, 15] },
  condition: { type: "boolean", name: "party_origin_different" },
};

// same-origin path (Charlotte.js:395-408): healing +5%/10%/15% per 1/2/3 same-origin
// (Fontaine) party members — outgoing-healing bonus feeding her heal features'
// (1 + healing + …) factor. Was omitted as "inert in golden harness" (damage-only-era
// fossil): her burst heals ran ÷1.15 vs the party/origin-same oracle (found 2026-07-10).
const a4SameOrigin: Condition = {
  type: "static-level",
  levelSetting: "party_origin_same",
  fromZero: true,
  levelStats: { healing: [0, 5, 10, 15] },
  condition: { type: "boolean", name: "party_origin_same" },
};

// ---------------------------------------------------------------------------
// Constellation conditions (P2.C)
// ---------------------------------------------------------------------------
// C1 "A Need to Verify Facts": ConditionStatic display-only — no flat-stat condition; the actual
//    heal is the burst.charlotte_verification_heal FeatureHeal above (display-gap burndown Task 4).
// C2 "A Duty to Pursue Truth": ConditionStacks charlotte_pursue_truth (atk_percent +10/stack, max 3
//    = +30% ATK on every hit), gated C2. SELF buff (no party.* mirror) — was golden-blind SKIPPED;
//    modelled below. raw Charlotte.js:443-446 (constellation[1]).
// C3: +3 levels to Comprehensive Confirmation (burst). Raw cons[2] settings char_skill_burst_bonus:3.
// C4 "A Responsibility to Oversee": ConditionBoolean charlotte_a_responsibility_to_oversee — the
//    scalingMultiplier ×1.1 gate on her 3 burst damage features (folded into the feature multipliers
//    above via c4OverseeGate). Its own stat is text_percent_dmg (display) → no stat condition here.
// C5: +3 levels to Freezing Point Composition (skill). Raw cons[4] settings char_skill_elemental_bonus:3.
// C6 "A Summation of Interest": cons-added feature above; ConditionStatic display wrapper → no
//    condition here. Also unlocks the burst.charlotte_coordinate_heal FeatureHeal above
//    (display-gap burndown Task 4).
// Raw: Charlotte.js constellation array (Charlotte.js:424-493).
const constellationConditions: readonly Condition[] = [
  // C3: +3 levels to elemental burst.
  { type: "constellation", constellation: 3, settings: { char_skill_burst_bonus: 3 } },
  // C5: +3 levels to elemental skill.
  { type: "constellation", constellation: 5, settings: { char_skill_elemental_bonus: 3 } },
  // SELF "A Duty to Pursue Truth" (C2) — +10% ATK per stack, max 3 (+30% atk_percent on every hit).
  // ConditionStacks gated at C2 (constellation[1] → THE CONSTELLATION IS A GATE). raw Charlotte.js:443-446.
  {
    type: "stacks",
    name: "charlotte_pursue_truth",
    maxStacks: 3,
    stats: { atk_percent: 10 },
    condition: { type: "constellation", constellation: 2 },
  },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const charlotte: DbObjectChar = {
  name: "charlotte",
  gameId: 10000088,
  rarity: 4,
  element: "cryo",
  weapon: "catalyst",
  origin: "fontaine",
  statTable: CharlotteStatTable,
  talents,
  features,
  multipliers: [],
  conditions: [a4DiffOrigin, a4SameOrigin, ...constellationConditions],
};
