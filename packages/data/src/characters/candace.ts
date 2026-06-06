/**
 * Candace — hydro polearm HP scaler.
 *
 * 4-hit normal combo (n3: 2-hit multihit → children _3_1/_3_2), charged hit,
 * plunge/low/high (physical), hydro skill (candace_press_dmg HP-scaling,
 * candace_hold_dmg HP-scaling), hydro burst (burst_dmg HP, candace_wave_dmg HP).
 *
 * HP-scaling multipliers use scaling:'hp' (Layla pattern):
 *   candace_press_dmg: s2.p3 (HP%)
 *   candace_hold_dmg:  s2.p4 (HP%)
 *   burst_dmg:         s3.p1 (HP%)
 *   candace_wave_dmg:  s3.p4 (HP%)
 *
 * The burst also emits candace_dmg_bonus (FeaturePostEffectValue, percent display:
 * A4 HP%→Normal DMG + flat 20%) and skill.shield (FeatureShield, HP-scaling) — both
 * have empty damageType (filtered by the golden suite); modelled as output features
 * (static / shield) for the P3.5.3 non-damage-output coverage gate.
 *
 * Burst infusion of PARTY normals is a party buff, NOT Candace's own damage.
 * candace_the_overflow_dmg is C6-gated (constellation 6, fixed 15% HP per hit).
 *
 * A4 "Celestial Dome of Sand" adds HP%-based dmg_normal_* bonuses active when
 * prayer_of_the_crimson_crown condition is toggled ON (ConditionBoolean). In the
 * fixed canonical C0 build with no conditions toggled, this is inactive.
 * No baseStats needed.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Candace.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Candace)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Candace)
 */

import type { CharPostEffect, Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Candace as CandaceStatTable } from "../generated/charTables.js";
import { Candace as CandaceTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1")   return CandaceTalents.s1.p1;
      if (name === "normal_hit_2")   return CandaceTalents.s1.p2;
      if (name === "normal_hit_3_1") return CandaceTalents.s1.p3;
      if (name === "normal_hit_3_2") return CandaceTalents.s1.p4;
      if (name === "normal_hit_4")   return CandaceTalents.s1.p5;
      if (name === "charged_hit")    return CandaceTalents.s1.p6;
      if (name === "plunge")         return CandaceTalents.s1.p8;
      if (name === "plunge_low")     return CandaceTalents.s1.p9;
      if (name === "plunge_high")    return CandaceTalents.s1.p10;
    }
    if (talent === "skill") {
      if (name === "shield_percent")     return CandaceTalents.s2.p1;
      if (name === "shield_flat")        return CandaceTalents.s2.p2;
      if (name === "candace_press_dmg") return CandaceTalents.s2.p3;
      if (name === "candace_hold_dmg")  return CandaceTalents.s2.p4;
    }
    if (talent === "burst") {
      if (name === "burst_dmg")          return CandaceTalents.s3.p1;
      if (name === "candace_wave_dmg")   return CandaceTalents.s3.p4;
    }
    throw new Error(`candace talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (physical polearm) ---
  // raw/genshin_calc_pub/src/js/db/Char/Candace.js: FeatureDamageNormal normal_hit_1
  {
    name: "normal_hit_1",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1") }],
  },
  // raw: FeatureDamageNormal normal_hit_2
  {
    name: "normal_hit_2",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2") }],
  },
  // raw: FeatureDamageMultihit normal_hit_3 (items: [p3, p4]) — parent = _3_1 + _3_2
  // Candace.js:175-198
  {
    name: "normal_hit_3",
    category: "attack",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3_1") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3_2") }] },
    ],
  },
  // raw: FeatureDamageNormal normal_hit_3_1 (isChild:true → drop to emit)
  // Candace.js:199-208
  {
    name: "normal_hit_3_1",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3_1") }],
  },
  // raw: FeatureDamageNormal normal_hit_3_2 (isChild:true → drop to emit)
  // Candace.js:209-218
  {
    name: "normal_hit_3_2",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3_2") }],
  },
  // raw: FeatureDamageNormal normal_hit_4
  {
    name: "normal_hit_4",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4") }],
  },
  // --- Charged attack ---
  // raw: FeatureDamageCharged charged_hit
  // Candace.js:228-237
  {
    name: "charged_hit",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }],
  },
  // --- Plunge attacks (physical) ---
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
    tags: ["plunge_shockwave"],
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_low") }],
  },
  // raw: FeatureDamagePlungeShockWave plunge_high
  {
    name: "plunge_high",
    tags: ["plunge_shockwave"],
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_high") }],
  },
  // --- Skill: Heron's Sanctum (hydro) ---
  // raw: FeatureDamageSkill candace_press_dmg, element='hydro', HP-scaling (s2.p3)
  // Candace.js:264-274
  {
    name: "candace_press_dmg",
    category: "skill",
    element: "hydro",
    multipliers: [{ scaling: "hp", leveling: "char_skill_elemental", values: talents.get("skill.candace_press_dmg") }],
  },
  // raw: FeatureDamageSkill candace_hold_dmg, element='hydro', HP-scaling (s2.p4)
  // Candace.js:275-285
  {
    name: "candace_hold_dmg",
    category: "skill",
    element: "hydro",
    multipliers: [{ scaling: "hp", leveling: "char_skill_elemental", values: talents.get("skill.candace_hold_dmg") }],
  },
  // --- Skill: Heron's Sanctum shield ---
  // FeatureShield: FeatureMultiplierList (s2.p1 % HP + s2.p2 flat), leveling:'char_skill_elemental'
  // raw/genshin_calc_pub/src/js/db/Char/Candace.js:286-297
  {
    name: "shield",
    category: "skill",
    output: { kind: "shield" },
    multipliers: [
      { scaling: "hp", leveling: "char_skill_elemental", values: talents.get("skill.shield_percent"), flatValues: talents.get("skill.shield_flat") },
    ],
  },
  // --- Burst: Wagtail's Tide (hydro) ---
  // raw: FeatureDamageBurst burst_dmg, element='hydro', HP-scaling (s3.p1)
  // Candace.js:298-308
  {
    name: "burst_dmg",
    category: "burst",
    element: "hydro",
    multipliers: [{ scaling: "hp", leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") }],
  },
  // raw: FeatureDamageBurst candace_wave_dmg, element='hydro', HP-scaling (s3.p4)
  // Candace.js:309-319
  {
    name: "candace_wave_dmg",
    category: "burst",
    element: "hydro",
    multipliers: [{ scaling: "hp", leveling: "char_skill_burst", values: talents.get("burst.candace_wave_dmg") }],
  },
  // --- C6 "The Overflow": each normal attack infused by Candace's prayer deals extra
  // hydro burst DMG equal to 15% of Candace's Max HP. Cons-added FeatureDamageBurst,
  // gated by ConditionConstellation(6). Fixed HP% value (ValueTable([15])).
  // Raw Candace.js:320-332 — scaling:'hp*', source:'constellation6', values:ValueTable([15]).
  {
    name: "candace_the_overflow_dmg",
    category: "burst",
    element: "hydro",
    condition: { type: "constellation", constellation: 6 },
    multipliers: [
      {
        scaling: "hp",
        leveling: "char_skill_burst",
        values: { getValue: (_level: number) => 15 },
        source: "constellation6",
      },
    ],
  },
  // --- A4 "Sculptural Stratagem" static readout: burst.candace_dmg_bonus = HP%→Normal DMG + flat 20% ---
  // FeaturePostEffectValue(PostEffectStatsHP, percent=StatTable('text_percent',[A4BonusScale=0.0005]),
  // flatBonus=ValueTable([BaseDmgBonus/100=0.2])), format:'percent'. 'text_percent' is isPercent → her /100 and the
  // format ×100 CANCEL, so displayed = 0.0005×hp_total + 20. values = A4BonusScale×100 = 0.05 → (0.05/100)×hp_total
  // = 0.0005×hp_total; flatValues = BaseDmgBonus = 20 (the flatBonus /100 + format ×100 cancel). No cap. asc4 gates
  // application not the readout → modelled without it. raw/genshin_calc_pub/src/js/db/Char/Candace.js:138-141,334-342.
  {
    name: "candace_dmg_bonus",
    category: "burst",
    output: { kind: "static" },
    multipliers: [
      { scaling: "hp", leveling: "", values: { getValue: () => 0.05 }, flatValues: { getValue: () => 20 } },
    ],
  },
];

// ---------------------------------------------------------------------------
// Constellation conditions (P2.C)
// ---------------------------------------------------------------------------
// C1: ConditionStatic (display-only, no damage stats) → SKIP.
// C2: ConditionBoolean toggle (hp_percent:20) → SKIP (toggle OFF).
// C3: +3 levels to Wagtail's Tide (burst). Raw Candace.js cons[2] settings
//     char_skill_burst_bonus:3.
// C4: ConditionStatic (display-only) → SKIP.
// C5: +3 levels to Heron's Sanctum (skill). Raw Candace.js cons[4] settings
//     char_skill_elemental_bonus:3.
// C6: cons-added candace_the_overflow_dmg feature (above, gated in features array).
//     ConditionStatic with text_percent_dmg:15 (display-only) → SKIP here.
const constellationConditions: readonly Condition[] = [
  // C3: +3 levels to Wagtail's Tide (burst). Raw Candace.js cons[2].
  { type: "constellation", constellation: 3, settings: { char_skill_burst_bonus: 3 } },
  // C5: +3 levels to Heron's Sanctum (skill). Raw Candace.js cons[4].
  { type: "constellation", constellation: 5, settings: { char_skill_elemental_bonus: 3 } },
];

// ---------------------------------------------------------------------------
// partyData — "Prayer of the Crimson Crown" + A4 per-element Normal-Attack DMG
// ---------------------------------------------------------------------------
// raw/genshin_calc_pub/src/js/db/Char/Candace.js:485-541 + TalentValues (l.139-140).
//
// Candace's burst infuses party Normal Attacks with hydro and grants a per-element
// Normal-Attack DMG bonus written to COMPOSITE keys `dmg_normal_<element>` (the
// seven non-physical elements). Two layers land in the SAME bag keys:
//   - the prayer ConditionBoolean: a flat `BaseDmgBonus = 20` per element.
//   - the A4 "Celestial Dome of Sand" PostEffectStats (from:`candace_hp_total`): `A4BonusScale × HP` per
//     element, gated on BOTH the prayer AND the dome toggles.
// Her getStatsDmgBonus reads `dmg_normal_<element>` only on a Normal hit whose
// RESOLVED element matches (Damage.js:58) → the composite-key engine extension.
//
// SCOPE (P3.5.2 engine-ext, DAMAGE surface): the composite-key buff + its HP lift.
// NOT ported: the prayer's `attack_infusion_hydro` (sword/claymore/polearm party
// infusion) — modelling party-set infusion that reaches `resolveElement` is a
// separate sub-gap. The oracle rep recipients an INNATELY-hydro-normal carry
// (Mona, a hydro catalyst) so `dmg_normal_hydro` applies WITHOUT the infusion;
// the composite-key mechanism is gated cleanly. A physical-normal carry would
// require the infusion → documented follow-up, not faked here. Constellations
// are out of scope (variant-rep pass).
const PRAYER_ELEMENTS = ["anemo", "geo", "pyro", "electro", "hydro", "cryo", "dendro"] as const;
const BaseDmgBonus = 20;    // flat per-element Normal DMG% (raw TalentValues.BaseDmgBonus)
const A4BonusScale = 0.0005; // A4 HP→Normal-DMG% scale (raw TalentValues.A4BonusScale)

// The prayer condition's flat stat bag: `dmg_normal_<element>: 20` for the 7 elements
// (RAW percent — buildStats' composite emit applies the /100, exactly her processPercent).
const prayerStats: Readonly<Record<string, number>> = Object.fromEntries(
  PRAYER_ELEMENTS.map((el) => [`dmg_normal_${el}`, BaseDmgBonus])
);

// A4 as 7 single-output CharPostEffects (her one multi-percent PostEffectStats
// (from:`candace_hp_total`) = 7 entries sharing the SAME input). `ratio` is the RAW
// scale (NOT pre-/100'd) — toPostEffect stores it raw and buildStats' composite emit
// /100's once, reproducing her PostEffectStats.getTree on a percent stat. Gated on BOTH the
// prayer AND the dome toggles (raw conditions[]). Accumulates additively onto the
// prayer's flat 20 in the same key. Base-inert when either toggle is off.
const a4DomeBonuses: readonly CharPostEffect[] = PRAYER_ELEMENTS.map((el) => ({
  fromStat: "candace_hp_total",
  toStat: `dmg_normal_${el}`,
  ratio: A4BonusScale,
  conditions: [
    { type: "boolean", name: "party.candace_prayer_of_the_crimson_crown" },
    { type: "boolean", name: "party.candace_celestial_dome_of_sand" },
  ],
}));

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const candace: DbObjectChar = {
  name: "candace",
  gameId: 10000072,
  rarity: 4,
  element: "hydro",
  weapon: "polearm",
  origin: "sumeru",
  statTable: CandaceStatTable,
  talents,
  features,
  multipliers: [],
  conditions: constellationConditions,
  // partyData — composite-key Normal-Attack DMG buff (P3.5.2 engine-ext pass).
  // Defined above: the prayer ConditionBoolean (flat 20 per element) + the A4 dome
  // (HP-scaled per element, 7 postEffects), with the `candace_hp_total` HP lift.
  partyData: {
    loadStats: {
      stats: ["hp_total"],
    },
    conditions: [
      // ConditionNumber: lifts the teammate's hp_total into the recipient's stat bag
      // (her ConditionNumber partyStat:'hp_total', max CHARACTER_MAX_POSSIBLE_HP = 150000;
      // raw/genshin_calc_pub/src/js/db/Constants.js:1).
      { type: "number", name: "candace_hp_total", max: 150000 },
      // Prayer master toggle: writes the flat per-element Normal DMG% (gates the A4 too).
      {
        type: "boolean",
        name: "party.candace_prayer_of_the_crimson_crown",
        stats: prayerStats,
      },
      // A4 "Celestial Dome of Sand" toggle (its own gate on the HP-scaled postEffects).
      { type: "boolean", name: "party.candace_celestial_dome_of_sand" },
    ],
    postEffects: a4DomeBonuses,
  },
};
