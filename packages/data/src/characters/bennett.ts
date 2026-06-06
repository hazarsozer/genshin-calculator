/**
 * Bennett — pyro sword ATK scaler.
 *
 * 5-hit normal combo, 2-hit charged (separate child hits + total multihit parent),
 * plunge, pyro press skill, pyro hold (charge_level_1 multihit parent + children _1_1/_1_2,
 * charge_level_2 multihit parent + children _2_1/_2_2), pyro burst_dmg.
 * bennet_unexpected_odyssey_dmg = charge_level_1_2 × 1.35 (always-on at C0, no condition
 * in the engine since the C4 wrapper just declares a separate feature — the engine emits it
 * at C0 too; the fixture confirms it is present in the oracle).
 *
 * Raw module has single-t typo: Bennet.js. TS file and export use the correct bennett.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Bennet.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Bennett)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Bennett)
 */

import type { CharPostEffect, Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Bennett as BennettStatTable } from "../generated/charTables.js";
import { Bennett as BennettTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return BennettTalents.s1.p1;
      if (name === "normal_hit_2") return BennettTalents.s1.p2;
      if (name === "normal_hit_3") return BennettTalents.s1.p3;
      if (name === "normal_hit_4") return BennettTalents.s1.p4;
      if (name === "normal_hit_5") return BennettTalents.s1.p5;
      if (name === "charged_hit_1") return BennettTalents.s1.p6;
      if (name === "charged_hit_2") return BennettTalents.s1.p7;
      if (name === "plunge") return BennettTalents.s1.p9;
      if (name === "plunge_low") return BennettTalents.s1.p10;
      if (name === "plunge_high") return BennettTalents.s1.p11;
    }
    if (talent === "skill") {
      if (name === "press_dmg") return BennettTalents.s2.p1;
      // charge_level_1: two sub-hits
      if (name === "charge_level_1_1") return BennettTalents.s2.p2;
      if (name === "charge_level_1_2") return BennettTalents.s2.p3;
      // charge_level_2: two sub-hits
      if (name === "charge_level_2_1") return BennettTalents.s2.p4;
      if (name === "charge_level_2_2") return BennettTalents.s2.p5;
      // C4 explosion_dmg (FeatureDamageSkill gated by constellation 4)
      if (name === "explosion_dmg") return BennettTalents.s2.p6;
    }
    if (talent === "burst") {
      if (name === "burst_dmg") return BennettTalents.s3.p1;
      if (name === "heal_dot_percent") return BennettTalents.s3.p2;
      if (name === "heal_dot_flat") return BennettTalents.s3.p3;
    }
    throw new Error(`bennett talents: unknown path '${path}'`);
  },
};

// bennet_unexpected_odyssey_dmg = charge_level_1_2 × 1.35
// raw/genshin_calc_pub/src/js/db/Char/Bennet.js:419-430
// Talents.getMulti({ from: 'skill.charge_level_1_2', multi: 135 / 100 })
const unexpectedOdysseyValues = {
  getValue: (level: number) => BennettTalents.s2.p3.getValue(level) * 1.35,
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks ---
  // raw/genshin_calc_pub/src/js/db/Char/Bennet.js:188-233
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
  // charged_hit_total: 2-hit multihit parent
  // raw/genshin_calc_pub/src/js/db/Char/Bennet.js:234-257
  {
    name: "charged_hit_total",
    category: "attack",
    damageType: "charged",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit_1") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit_2") }] },
    ],
  },
  // Individual charged sub-hits
  // raw/genshin_calc_pub/src/js/db/Char/Bennet.js:258-277
  {
    name: "charged_hit_1",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit_1") }],
  },
  {
    name: "charged_hit_2",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit_2") }],
  },
  // --- Plunge attacks ---
  // raw/genshin_calc_pub/src/js/db/Char/Bennet.js:278-304
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
  // --- Skill: Passion Overload ---
  // press_dmg: single press
  // raw/genshin_calc_pub/src/js/db/Char/Bennet.js:305-314
  {
    name: "press_dmg",
    category: "skill",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.press_dmg") }],
  },
  // charge_level_1: 2-hit multihit parent (_1_1 + _1_2)
  // raw/genshin_calc_pub/src/js/db/Char/Bennet.js:315-338
  {
    name: "charge_level_1",
    category: "skill",
    damageType: "skill",
    element: "pyro",
    items: [
      { multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.charge_level_1_1") }] },
      { multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.charge_level_1_2") }] },
    ],
  },
  // Sub-hits of charge_level_1
  // raw/genshin_calc_pub/src/js/db/Char/Bennet.js:339-360
  {
    name: "charge_level_1_1",
    category: "skill",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.charge_level_1_1") }],
  },
  {
    name: "charge_level_1_2",
    category: "skill",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.charge_level_1_2") }],
  },
  // charge_level_2: 2-hit multihit parent (_2_1 + _2_2)
  // raw/genshin_calc_pub/src/js/db/Char/Bennet.js:361-384
  {
    name: "charge_level_2",
    category: "skill",
    damageType: "skill",
    element: "pyro",
    items: [
      { multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.charge_level_2_1") }] },
      { multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.charge_level_2_2") }] },
    ],
  },
  // Sub-hits of charge_level_2
  // raw/genshin_calc_pub/src/js/db/Char/Bennet.js:385-406
  {
    name: "charge_level_2_1",
    category: "skill",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.charge_level_2_1") }],
  },
  {
    name: "charge_level_2_2",
    category: "skill",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.charge_level_2_2") }],
  },
  // bennet_unexpected_odyssey_dmg = charge_level_1_2 × 1.35 (C4 mechanic, always emitted)
  // raw/genshin_calc_pub/src/js/db/Char/Bennet.js:419-430
  {
    name: "bennet_unexpected_odyssey_dmg",
    category: "skill",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_elemental", values: unexpectedOdysseyValues }],
  },
  // --- C4 "Unexpected Odyssey": hitting the explosion also deals 135% ATK as pyro skill DMG.
  // Cons-added FeatureDamageSkill gated by ConditionConstellation(4).
  // Raw Bennet.js:407-417 — explosion_dmg, element:'pyro', condition:ConditionConstellation(4).
  {
    name: "explosion_dmg",
    category: "skill",
    element: "pyro",
    condition: { type: "constellation", constellation: 4 },
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.explosion_dmg") }],
  },
  // --- Burst: Fantastic Voyage ---
  // raw/genshin_calc_pub/src/js/db/Char/Bennet.js:431-440
  {
    name: "burst_dmg",
    category: "burst",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") }],
  },
  // --- Burst heal: burst.heal_dot = Fantastic Voyage per-tick HP regen (FeatureHeal, HP-scaled list) ---
  // FeatureMultiplierList scaling:'hp*', leveling:'char_skill_burst', values=getList('burst.heal_dot') =
  // [s3.p2 (% of HP), s3.p3 (flat)]. base = (s3.p2/100)×hp_total + s3.p3; no healing-bonus passive (ER ascension).
  // raw/genshin_calc_pub/src/js/db/Char/Bennet.js:120-127,441-451.
  {
    name: "heal_dot",
    category: "burst",
    output: { kind: "heal" },
    multipliers: [
      { scaling: "hp", leveling: "char_skill_burst", values: talents.get("burst.heal_dot_percent"), flatValues: talents.get("burst.heal_dot_flat") },
    ],
  },
  // --- burst.atk_bonus: Fantastic Voyage ATK-buff readout (FeaturePostEffectValue → static) ---
  // Raw Bennet.js:156-175,453-457 — selfBuffPost = PostEffectStats{ from:'atk_base',
  // percent:getMulti(burst.atk_ratio, 0.01) }, exposed as a FeaturePostEffectValue. The buff =
  // white base ATK × (burst atk_ratio @L10 × 0.01) = atk_base × 1.008 (the same ratio the live
  // `fantasticVoyageAtk` CharPostEffect applies — reused here, not hardcoded). The atk_base scaling
  // now resolves via the eval-bag atk_base emit (buildStats). The selfBuffPost carries NO
  // application gate (no toggle/asc/cons), so the readout is the canonical C0 value. The C1
  // percentBonus (+20% ATK, ValueTable([C1BuffBonus/100]) gated by char_constellation≥1) is ABSENT
  // at C0 → omitted (matches the C0-canonical oracle). The engine divides values.getValue()/100, so
  // getValue() returns the raw burst atk_ratio table value (100.8) — /100 → 1.008. NEVER baked.
  {
    name: "atk_bonus",
    category: "burst",
    output: { kind: "static" },
    multipliers: [
      // scaling atk_base × (BennettTalents.s3.p4@L10 / 100) = atk_base × 1.008.
      { scaling: "atk_base", leveling: "", values: { getValue: () => BennettTalents.s3.p4.getValue(10) } },
    ],
  },
];

// ---------------------------------------------------------------------------
// Constellation conditions (P2.C)
// ---------------------------------------------------------------------------
// C1: ConditionStatic with bonus_bennet_atk (party buff display) — no damage stat → SKIP.
// C2: ConditionBoolean toggle (recharge) → SKIP (toggle OFF).
// C3: +3 levels to Passion Overload (skill). Raw Bennet.js cons[2] settings
//     char_skill_elemental_bonus:3.
// C4: cons-added explosion_dmg feature (above, gated in features array).
//     ConditionStatic with text_percent_dmg:135 (display-only) → SKIP here.
// C5: +3 levels to Fantastic Voyage (burst). Raw Bennet.js cons[4] settings
//     char_skill_burst_bonus:3.
// C6: ConditionStatic gated by bennet_fantastic_voyage (toggle) → SKIP.
const constellationConditions: readonly Condition[] = [
  // C3: +3 levels to Passion Overload (elemental skill). Raw Bennet.js cons[2].
  { type: "constellation", constellation: 3, settings: { char_skill_elemental_bonus: 3 } },
  // C5: +3 levels to Fantastic Voyage (burst). Raw Bennet.js cons[4].
  { type: "constellation", constellation: 5, settings: { char_skill_burst_bonus: 3 } },
];

// ---------------------------------------------------------------------------
// Post-effects
// ---------------------------------------------------------------------------

// "Fantastic Voyage" burst: +ATK = base ATK × (burst atk_ratio @L10 × 0.01).
// Raw Bennet.js:156-175 — PostEffectStats{ from:'atk_base', percent:burst.atk_ratio × 0.01,
// conditions:[ConditionBoolean({name:'bennet_fantastic_voyage'})] }.
// BUILD-COUPLED at burst level 10 (the oracle's fixed talent level), like itto/sayu carries.
// BennettTalents.s3.p4 = atk_ratio table; getValue(10) = 100.8; ratio = 1.008.
const fantasticVoyageAtk: CharPostEffect = {
  fromStat: "atk_base",
  toStat: "atk",
  ratio: BennettTalents.s3.p4.getValue(10) * 0.01,  // 100.8 × 0.01 = 1.008
  conditions: [{ type: "boolean", name: "bennet_fantastic_voyage" }],
};

// C1 "Grand Expectation": adds +20% of base ATK to the buff (the in-game C1 also lifts
// the ATK-bonus cap, which this base post-effect never modelled — only the additive
// +20% is relevant here). Raw Bennet.js:150,164,171 — percentBonus ValueTable([C1BuffBonus=20 / 100])
// on the same post-effect, gated by `setting:'char_constellation'` ≥ 1. Modelled as a
// second base-ATK post-effect gated by the toggle AND constellation ≥ 1 (additive with
// the base buff → base_atk × (1.008 + 0.20) at C1). Base-safe: the C1 gate is off at
// C0, so the toggles-family (C0) bennett is unaffected.
const fantasticVoyageC1Atk: CharPostEffect = {
  fromStat: "atk_base",
  toStat: "atk",
  ratio: 0.2,
  conditions: [
    { type: "boolean", name: "bennet_fantastic_voyage" },
    { type: "constellation", constellation: 1 },
  ],
};

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const bennett: DbObjectChar = {
  name: "bennett",
  gameId: 10000032,
  rarity: 4,
  element: "pyro",
  weapon: "sword",
  origin: "mondstadt",
  statTable: BennettStatTable,
  talents,
  features,
  multipliers: [],
  postEffects: [fantasticVoyageAtk, fantasticVoyageC1Atk],
  conditions: constellationConditions,
  // partyData — teammate kit buffs (P3.5.2 Bucket B batch 1).
  // Source: raw/genshin_calc_pub/src/js/db/Char/Bennet.js:573-709
  // Scope: the core ATK battery + C1 (P3.5.2 engine-ext pass — percentBonus field).
  // Remaining constellations/passives deferred to the variant-rep pass (gated reps):
  //   C1 "Grand Expectation": +20% party ATK — PORTED below via the postEffect percentBonus
  //     + bonusCondition (party.bennet_constellation_1), oracle rep bennett-atk-c1-on-ganyu.
  //   C5 "True Explorer": +3 burst levels — moot here (the atk_ratio is clamped to L10).
  //   C6 "Fire Ventures With Me": dmg_pyro +15% + pyro infusion, gated on Fantastic Voyage.
  partyData: {
    loadStats: {
      stats: ["atk_base"],
    },
    conditions: [
      // ConditionNumber: lifts the teammate's atk_base into the recipient's stat bag.
      { type: "number", name: "bennet_atk_base", max: 10000 },
      // Fantastic Voyage master toggle (gates the ATK battery postEffect below).
      { type: "boolean", name: "party.bennet_fantastic_voyage" },
    ],
    postEffects: [
      // Fantastic Voyage ATK battery: atk_base × burst atk_ratio, clamped at talent L10
      // (raw PostEffectStats.maxLevelSetting:10 → effective level = min(level, 10)). Pinned
      // to the L10 table value (1.008) — exact for every realistic build: baked burst is ≥10,
      // and C5's +3 only pushes it higher (still clamped to 10). Matches the capped-postEffect
      // idiom of Bennett's own self-buff (fantasticVoyageAtk) + Itto/Sayu carries.
      {
        fromStat: "bennet_atk_base",
        toStat: "atk",
        ratio: BennettTalents.s3.p4.getValue(10) * 0.01,  // 100.8 × 0.01 = 1.008
        conditions: [{ type: "boolean", name: "party.bennet_fantastic_voyage" }],
        // C1 "Grand Expectation": +20% added to the ATK ratio (her percentBonus
        // ValueTable([C1BuffBonus=20 / 100]) + bonusCondition party.bennet_constellation_1,
        // raw Bennet.js:698,704-706). Composes additively → atk_base × (1.008 + 0.20) at C1.
        // Base-inert at C0 (toggle off): the C0 baseline rep is byte-unchanged.
        percentBonus: { value: 0.2, condition: { type: "boolean", name: "party.bennet_constellation_1" } },
      },
    ],
  },
};
