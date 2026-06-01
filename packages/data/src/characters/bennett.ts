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
  postEffects: [fantasticVoyageAtk],
  conditions: constellationConditions,
};
