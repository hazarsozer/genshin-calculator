/**
 * Escoffier — cryo polearm.
 *
 * 3-hit normal combo (n3 is a 2-hit multihit with children _3_1 and _3_2),
 * cryo charged hit (from char's element infusion behavior? polearm defaults to
 * physical but Escoffier's n/c are physical; fixture confirms physical),
 * plunge/low/high.
 * Cryo skill: skill_dmg + escoffier_frozen_parfait_attack_dmg + surging_blade_dmg.
 * Cryo burst: burst_dmg.
 * Heals ported in P3.5.3:
 *   burst.heal — ATK-scaled FeatureMultiplierList (s3.p2 percent + s3.p3 flat).
 *   other.escoffier_rehab_diet_heal — constant 138.24 ATK-scaled A1 heal, crit-bearing.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Escoffier.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Escoffier)
 */

import type { CharMultiplier, Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
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
  // --- Skill: Low Temperature Cooking ---
  // crit_dmg_cryo (C1 "Pre-Dinner Dance") folds into the crit term of Escoffier's cryo hits —
  // her getDefaultStatsCritDamage auto-includes crit_dmg_<element>; the port requires each feature
  // to declare it (collectFeatureBonusKeys). Base-inert: crit_dmg_cryo=0 until the C1 condition
  // fires (constellation 1 + 4 hydro/cryo slots) → root goldens byte-identical.
  {
    name: "skill_dmg",
    category: "skill",
    element: "cryo",
    critDamageBonuses: ["crit_dmg_cryo"],
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.skill_dmg") }],
  },
  {
    name: "escoffier_frozen_parfait_attack_dmg",
    category: "skill",
    element: "cryo",
    critDamageBonuses: ["crit_dmg_cryo"],
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.escoffier_frozen_parfait_attack_dmg") }],
  },
  // surging_blade_dmg: cryo skill DoT (cannotReact in raw but still asserted as skill hit).
  {
    name: "surging_blade_dmg",
    category: "skill",
    element: "cryo",
    critDamageBonuses: ["crit_dmg_cryo"],
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.surging_blade_dmg") }],
  },
  // --- Burst: Scoring Cuts ---
  {
    name: "burst_dmg",
    category: "burst",
    element: "cryo",
    critDamageBonuses: ["crit_dmg_cryo"],
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") }],
  },
  // --- FeatureHeal: burst.heal (ATK-scaled FeatureMultiplierList, auto-active) ---
  // raw: FeatureHeal({ category:'burst', multipliers:[FeatureMultiplierList({
  //   leveling:'char_skill_burst', values:Talents.getList('burst.heal') })] })
  //   Escoffier.js:276-283. Talents.getList('burst.heal') → [s3.p2, s3.p3].
  //   FeatureMultiplierList.getValue divides values[0] by 100 (percent); getValueFlat = values[1].
  //   Default scaling = 'atk*' (no override) → ATK total.
  {
    name: "heal",
    category: "burst",
    output: { kind: "heal" },
    multipliers: [
      {
        leveling: "char_skill_burst",
        values: EscoffierTalents.s3.p2,
        flatValues: EscoffierTalents.s3.p3,
      },
    ],
  },
  // --- FeatureHeal: other.escoffier_rehab_diet_heal (A1, constant ATK-scaled, crit-bearing) ---
  // raw: FeatureHeal({ name:'escoffier_rehab_diet_heal', category:'other',
  //   critRateBonuses:['crit_rate_base','crit_rate'],
  //   critDamageBonuses:['crit_dmg_escofier_heal'],
  //   multipliers:[FeatureMultiplier({ source:'ascension1',
  //     values:new ValueTable([A1Heal=138.24]) })],
  //   condition:ConditionAscensionChar({ascension:1}) })  Escoffier.js:285-296.
  // No scaling field → default 'atk*' (ATK total). Source 'ascension1' → leveling.
  // crit_dmg_escofier_heal=0 at C0, so all three values equal (no critting in base build).
  // Auto-active at canonical A6 (ConditionAscensionChar(1) satisfied).
  {
    name: "escoffier_rehab_diet_heal",
    category: "other",
    output: { kind: "heal" },
    critRateBonuses: ["crit_rate_base", "crit_rate"],
    critDamageBonuses: ["crit_dmg_escofier_heal"],
    multipliers: [
      {
        leveling: "ascension1",
        values: { getValue: (_level: number) => 138.24 },
        source: "ascension1",
      },
    ],
  },
  // --- C6 "Tea Parties Bursting with Color": cons-added cryo damage hit (500% ATK,
  // fixed, not talent-leveled). Raw class is FeatureDamageSkill → damageType:"skill".
  // Raw category:'other' → OMIT category (loader derives "other." prefix from absent
  // category; LESSON 5: never write category:"other" — tsc rejects it).
  // Raw Escoffier.js:298-309 (FeatureDamageSkill + ConditionConstellation(6) + ValueTable([500])).
  {
    name: "escoffier_special_grade_frozen_parfait_dmg",
    // category intentionally OMITTED — raw has category:'other', loader derives "other." prefix.
    element: "cryo",
    damageType: "skill",
    critDamageBonuses: ["crit_dmg_cryo"], // C1 cryo crit DMG (base-inert; see cryo-feature note above).
    condition: { type: "constellation", constellation: 6 },
    multipliers: [
      {
        source: "constellation6",
        leveling: "char_skill_elemental",
        values: { getValue: (_level: number) => 500 },
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// SELF conditions: A4 res-shred + C1 crit-DMG (party-element-count, Tier-B ε) + C3/C5.
// ---------------------------------------------------------------------------
// Her ConditionCalcElementsEscoffier (raw Condition/CalcElementsEscoffier.js:5-31) scans
// char_element + resonance_element_1/2/3, counting members whose element ∈ {hydro,cryo} into
// `escoffier_chars_count`, and sets `escoffier_chars_only=1` iff every non-empty slot is
// hydro/cryo. Escoffier is cryo, so char_element always contributes → count ≥ 1 (solo = 1).
//
// A4 "Inspiration Immersed Seasoning" (raw Escoffier.js:336-347): a ConditionStaticLevel gated
//   ONLY by ConditionAscensionChar({ascension:4}) (auto-active at canonical A6, no toggle),
//   levelSetting `escoffier_chars_count`, shredding enemy_res_cryo/enemy_res_hydro by
//   A4ResShred = [-5,-10,-15,-55] indexed by count (getLevel ||= 1 → min tier -5). The count
//   is derived from PARTY COMPOSITION, so solo (char-axis) only exercises count=1 (-5); the
//   -10/-15/-55 tiers need the party-axis. Modeled as four CUMULATIVE `elements-count` set
//   tiers over {hydro,cryo} (deltas -5/-5/-5/-40 → totals -5/-10/-15/-55), REPLACING the old
//   baked baseStats -5/-5: the count=1 tier reproduces the solo shred exactly (char_element=cryo
//   ∈ set), higher tiers are inert until a hydro/cryo teammate joins → root goldens byte-identical.
//   Ungated by ascension like Navia/YunJin A4 (the port has no ascension type; every oracle rep
//   builds at A6). max count = 4 slots, so no clamp needed. Source Escoffier.js:336-347 (StatTable
//   'enemy_res_cryo'/'enemy_res_hydro' = A4ResShred) + Condition/Static/Level.js.
// C1 "Pre-Dinner Dance for Your Taste Buds" (raw Escoffier.js:355-372): crit_dmg_cryo +60 gated by
//   ConditionAnd([ConditionBoolean('escoffier_chars_only'), ConditionBooleanValue(escoffier_chars_count
//   ge 4)]). There are exactly 4 slots, so count ≥ 4 ⟺ all 4 slots hydro/cryo ⟺ (chars_only=1 AND
//   count=4): `elements-count({hydro,cryo}, 4)` captures the full gate. Base-inert: solo count=1 < 4.
// C2: ConditionBoolean toggle escoffier_fresh_fragrant_stew_is_an_art — SKIP (toggle OFF; the raw
//   self multiplier is also commented out in source). Teammate side is ported in partyData below.
// C3: +3 levels to Low Temperature Cooking (elemental skill). Raw cons[2] char_skill_elemental_bonus:3.
// C4: ConditionStatic crit_dmg_escofier_heal:100, gated by ConditionAscensionChar(1) — affects the
//   escoffier_rehab_diet_heal only (a heal). PORTED below (the ascension gate is always-active at the
//   canonical A6 build every oracle rep uses, matching the elements-count A4/C1 precedent's ungated
//   modelling — Escoffier.js:389-393).
// C5: +3 levels to Scoring Cuts (burst). Raw cons[4] char_skill_burst_bonus:3.
// C6: ConditionStatic display-only (text_percent_dmg:500). Actual damage is the
//   escoffier_special_grade_frozen_parfait_dmg feature above. No flat stat needed.
const ESCOFFIER_ELEMENTS = ["hydro", "cryo"] as const;

const charConditions: readonly Condition[] = [
  // A4 res-shred, four cumulative party-element-count tiers over {hydro,cryo}.
  { type: "elements-count", element: ESCOFFIER_ELEMENTS, count: 1, stats: { enemy_res_cryo: -5, enemy_res_hydro: -5 } },
  { type: "elements-count", element: ESCOFFIER_ELEMENTS, count: 2, stats: { enemy_res_cryo: -5, enemy_res_hydro: -5 } },
  { type: "elements-count", element: ESCOFFIER_ELEMENTS, count: 3, stats: { enemy_res_cryo: -5, enemy_res_hydro: -5 } },
  { type: "elements-count", element: ESCOFFIER_ELEMENTS, count: 4, stats: { enemy_res_cryo: -40, enemy_res_hydro: -40 } },
  // C1: crit_dmg_cryo +60 when all four slots are hydro/cryo (count ≥ 4 ⟺ chars_only && count=4).
  {
    type: "static",
    stats: { crit_dmg_cryo: 60 },
    condition: { type: "and", items: [
      { type: "constellation", constellation: 1 },
      { type: "elements-count", element: ESCOFFIER_ELEMENTS, count: 4 },
    ] },
  },
  // C3: +3 levels to elemental skill (Low Temperature Cooking).
  { type: "constellation", constellation: 3, settings: { char_skill_elemental_bonus: 3 } },
  // C4: crit_dmg_escofier_heal +100 — the escoffier_rehab_diet_heal feature already carries
  // critDamageBonuses:['crit_dmg_escofier_heal'] (reads this stat via cStat); previously never
  // injected → the heal's crit-dmg leg stayed 0. Raw Escoffier.js:389-393 (stats injection, same
  // mechanism as the C1 crit_dmg_cryo entry above); the ConditionAscensionChar(1) sub-gate is
  // always-active at the canonical A6 build (see note above).
  { type: "constellation", constellation: 4, stats: { crit_dmg_escofier_heal: 100 } },
  // C5: +3 levels to burst (Scoring Cuts).
  { type: "constellation", constellation: 5, settings: { char_skill_burst_bonus: 3 } },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// partyData — teammate kit buff (P3.5.2 Bucket C).
// Source: raw/genshin_calc_pub/src/js/db/Char/Escoffier.js:420-486
// Scope: C2 "Fresh Fragrant Stew is an Art" — Escoffier's ATK-scaled cryo-damage
// bonus applied to the recipient's cryo hits. Condition ported = ONLY the lift the
// multiplier reads + the master gate. Other conditions deferred to variant-rep pass.
// ---------------------------------------------------------------------------

// C2BonusDmg constant: 240 (raw/genshin_calc_pub/src/js/db/Char/Escoffier.js:132)
const C2_BONUS_DMG = 240;

const escoffierPartyMultipliers: readonly CharMultiplier[] = [
  // C2: escoffier_atk_total% × escoffier_atk_total added to each CRYO hit of the
  // recipient (normal/charged/plunge/skill/burst).
  // raw/genshin_calc_pub/src/js/db/Char/Escoffier.js:474-484
  {
    source: "escoffier",
    scaling: "escoffier_atk_total",
    leveling: "",
    values: { getValue: (): number => C2_BONUS_DMG },
    condition: { type: "boolean", name: "party_escoffier_fresh_fragrant_stew_is_an_art" },
    target: {
      damageElements: ["cryo"],
      damageTypes: ["normal", "charged", "plunge", "skill", "burst"],
    },
  } satisfies CharMultiplier,
];

export const escoffier: DbObjectChar = {
  name: "escoffier",
  gameId: 10000112,
  rarity: 5,
  element: "cryo",
  weapon: "polearm",
  origin: "fontaine",
  statTable: EscoffierStatTable,
  // A4 res-shred is now the count=1 `elements-count` tier in charConditions (was baked
  // baseStats -5/-5); see the charConditions comment block for the full A4/C1 rationale.
  talents,
  features,
  multipliers: [],
  conditions: charConditions,
  partyData: {
    loadStats: {
      stats: ["atk_total"],
    },
    conditions: [
      // Lift Escoffier's atk_total (partyStat) into recipient bag as `escoffier_atk_total`.
      // raw: ConditionNumber({name:'escoffier_atk_total', partyStat:'atk_total', max:10000}).
      { type: "number", name: "escoffier_atk_total", max: 10000 },
    ],
    multipliers: escoffierPartyMultipliers,
  },
};
