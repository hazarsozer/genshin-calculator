/**
 * Fischl — electro bow ATK scaler.
 *
 * 5-hit normal combo (physical), physical aimed shot, electro fully charged aimed
 * shot, plunge/low/high, electro skill (Oz spawn + Oz attack), electro burst,
 * A1 "Stellar Predator" (152.7% × charged_aimed, electro, auto-active at A6),
 * A4 "Undone Be Thy Sinful Hex" (80% flat, electro, auto-active at A6).
 *
 * A1 and A4 are ConditionAscensionChar gated — always active at ascension 6.
 * C1/C2/C4/C6 constellation conditions are off at C0.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Fischl.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Fischl)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Fischl)
 */

import type { Condition, DbObjectChar, Feature, TalentResolver, TalentTable } from "@genshin/types";
import { Fischl as FischlStatTable } from "../generated/charTables.js";
import { Fischl as FischlTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return FischlTalents.s1.p1;
      if (name === "normal_hit_2") return FischlTalents.s1.p2;
      if (name === "normal_hit_3") return FischlTalents.s1.p3;
      if (name === "normal_hit_4") return FischlTalents.s1.p4;
      if (name === "normal_hit_5") return FischlTalents.s1.p5;
      if (name === "aimed") return FischlTalents.s1.p6;
      if (name === "charged_aimed") return FischlTalents.s1.p7;
      if (name === "plunge") return FischlTalents.s1.p8;
      if (name === "plunge_low") return FischlTalents.s1.p9;
      if (name === "plunge_high") return FischlTalents.s1.p10;
    }
    if (talent === "skill") {
      if (name === "fischl_oz_dmg") return FischlTalents.s2.p1;
      if (name === "skill_dmg") return FischlTalents.s2.p2;
    }
    if (talent === "burst") {
      if (name === "burst_dmg") return FischlTalents.s3.p1;
    }
    throw new Error(`fischl talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Derived talent tables
// ---------------------------------------------------------------------------

// A1 "Stellar Predator": electro charged arrow dealing 152.7% of a fully
// charged aimed shot. Her raw: scalingMultiplier: TalentValues.A1ChargedDmg / 100
// = 1.527, applied to the charged_aimed table.
// raw/genshin_calc_pub/src/js/db/Char/Fischl.js:199-210
const A1_SCALING = 152.7 / 100;
const stellarPredatorTable: TalentTable = {
  getValue(level: number): number {
    return FischlTalents.s1.p7.getValue(level) * A1_SCALING;
  },
};

// A4 "Undone Be Thy Sinful Hex": constant 80% ATK (ValueTable([80])).
// raw/genshin_calc_pub/src/js/db/Char/Fischl.js:262-273
const fischlUndoneTable: TalentTable = { getValue: (_level: number) => 80 };

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (physical bow) ---
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
  // --- C1 "Gaze of the Deep": Oz fires alongside normal attacks dealing 22% ATK.
  // Raw: FeatureDamageNormal with ValueTable([22]) and ConditionConstellation(1). Fischl.js:168-177
  {
    name: "fischl_gaze_of_the_deep",
    category: "attack",
    condition: { type: "constellation", constellation: 1 },
    multipliers: [
      {
        leveling: "char_skill_attack",
        values: { getValue: (_level: number) => 22 },
        source: "constellation1",
      },
    ],
  },
  // --- Charged attacks (bow aimed shots) ---
  // aimed: physical charged shot
  {
    name: "aimed",
    isAimed: true,
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.aimed") }],
  },
  // charged_aimed: fully charged electro arrow
  {
    name: "charged_aimed",
    isAimed: true,
    category: "attack",
    damageType: "charged",
    element: "electro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_aimed") }],
  },
  // A1 "Stellar Predator": 152.7% × charged_aimed values, electro, charged type.
  // Auto-active at A6 (ConditionAscensionChar({ascension: 1})).
  // raw/genshin_calc_pub/src/js/db/Char/Fischl.js:198-210
  {
    name: "fischl_stellar_predator",
    isAimed: true,
    category: "attack",
    damageType: "charged",
    element: "electro",
    multipliers: [{ leveling: "char_skill_attack", values: stellarPredatorTable }],
  },
  // --- Plunge attacks (physical bow) ---
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
  // --- Skill: Nightrider (electro) ---
  // fischl_oz_dmg: Oz initial attack on summon
  {
    name: "fischl_oz_dmg",
    category: "skill",
    element: "electro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.fischl_oz_dmg") }],
  },
  // skill_dmg: Fischl's re-summon attack. C2 "Devourer of All Sins" adds +200% ATK
  // as a second constellation-gated multiplier. Raw: Fischl.js:248-261
  {
    name: "skill_dmg",
    category: "skill",
    element: "electro",
    multipliers: [
      { leveling: "char_skill_elemental", values: talents.get("skill.skill_dmg") },
      // C2 "Devourer of All Sins": +200% ATK on the re-summon, gated by
      // ConditionConstellation(2). Per-feature multiplier conditions ARE honoured —
      // compileFeature.activeOwnMultipliers filters them via evaluate (her
      // FeatureMultiplier.isActive checks the gate at both char- and per-feature level),
      // so this contributes 0 at C<2 and the C0 golden is unaffected.
      // Raw: Fischl.js:257-260 new ValueTable([200]) + condition: ConditionConstellation(2).
      {
        leveling: "char_skill_elemental",
        values: { getValue: (_level: number) => 200 },
        source: "constellation2",
        condition: { type: "constellation", constellation: 2 },
      },
    ],
  },
  // A4 "Undone Be Thy Sinful Hex": 80% ATK flat Oz attack, electro skill.
  // Auto-active at A6 (ConditionAscensionChar({ascension: 4})).
  // raw/genshin_calc_pub/src/js/db/Char/Fischl.js:262-273
  {
    name: "fischl_undone",
    category: "skill",
    element: "electro",
    multipliers: [{ leveling: "char_skill_elemental", values: fischlUndoneTable }],
  },
  // --- C6 "Evernight Raven": Oz fires alongside ALL party members dealing 30% ATK electro.
  // Raw: FeatureDamageSkill with ValueTable([30]) and ConditionConstellation(6). Fischl.js:274-284
  {
    name: "fischl_evernight_raven",
    category: "skill",
    element: "electro",
    condition: { type: "constellation", constellation: 6 },
    multipliers: [
      {
        leveling: "char_skill_elemental",
        values: { getValue: (_level: number) => 30 },
        source: "constellation6",
      },
    ],
  },
  // --- Burst: Midnight Phantasmagoria (electro) ---
  {
    name: "burst_dmg",
    category: "burst",
    element: "electro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") }],
  },
  // --- C4 "Her Pilgrimage of Bleak": extra electro hit 222% ATK alongside burst.
  // Raw: FeatureDamage (base class, NOT FeatureDamageBurst) with category:'burst',
  // element:'electro', ValueTable([222]), ConditionConstellation(4). Fischl.js:295-306
  // Base FeatureDamage → damageType:"" (engine outputs "none" for this class/category combo).
  {
    name: "fischl_her_pilgrimage_of_bleak",
    category: "burst",
    damageType: "",
    element: "electro",
    condition: { type: "constellation", constellation: 4 },
    multipliers: [
      {
        leveling: "char_skill_burst",
        values: { getValue: (_level: number) => 222 },
        source: "constellation4",
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Constellation conditions (P2.C)
// ---------------------------------------------------------------------------
// C1 "Gaze of the Deep": ConditionStatic (display-only text_percent_dmg) → SKIP here;
//   the actual damage comes from fischl_gaze_of_the_deep feature above.
// C2 "Devourer of All Sins": ConditionStatic (display-only) → SKIP; damage modeled
//   as a per-feature conditional multiplier on skill_dmg above.
// C3 "Wings of Nightmare": +3 levels to Nightrider (elemental skill). Raw cons[2] settings char_skill_elemental_bonus:3.
// C4 "Her Pilgrimage of Bleak": ConditionStatic (display-only) → SKIP; damage modeled
//   as fischl_her_pilgrimage_of_bleak feature above.
// C5 "Against the Fleeing Light": +3 levels to Midnight Phantasmagoria (burst). Raw cons[4] settings char_skill_burst_bonus:3.
// C6 "Evernight Raven": ConditionStatic (display-only) → SKIP; damage modeled as
//   fischl_evernight_raven feature above.
// Raw: db/Char/Fischl.js constellation array (Fischl.js:344-409).
const constellationConditions: readonly Condition[] = [
  // C3: +3 levels to Nightrider (skill). Raw cons[2] settings char_skill_elemental_bonus:3.
  { type: "constellation", constellation: 3, settings: { char_skill_elemental_bonus: 3 } },
  // C5: +3 levels to Midnight Phantasmagoria (burst). Raw cons[4] settings char_skill_burst_bonus:3.
  { type: "constellation", constellation: 5, settings: { char_skill_burst_bonus: 3 } },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const fischl: DbObjectChar = {
  name: "fischl",
  gameId: 10000031,
  rarity: 4,
  element: "electro",
  weapon: "bow",
  origin: "mondstadt",
  statTable: FischlStatTable,
  talents,
  features,
  multipliers: [],
  conditions: constellationConditions,
};
