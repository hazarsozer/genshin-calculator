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

import type { DbObjectChar, Feature, TalentResolver, TalentTable } from "@genshin/types";
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
  // --- Charged attacks (bow aimed shots) ---
  // aimed: physical charged shot
  {
    name: "aimed",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.aimed") }],
  },
  // charged_aimed: fully charged electro arrow
  {
    name: "charged_aimed",
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
  // --- Skill: Nightrider (electro) ---
  // fischl_oz_dmg: Oz initial attack on summon
  {
    name: "fischl_oz_dmg",
    category: "skill",
    element: "electro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.fischl_oz_dmg") }],
  },
  // skill_dmg: Fischl's re-summon attack (C0 only uses base table, no C2 bonus)
  {
    name: "skill_dmg",
    category: "skill",
    element: "electro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.skill_dmg") }],
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
  // --- Burst: Midnight Phantasmagoria (electro) ---
  {
    name: "burst_dmg",
    category: "burst",
    element: "electro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") }],
  },
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
};
