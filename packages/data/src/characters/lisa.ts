/**
 * Lisa — electro catalyst ATK scaler.
 *
 * 4-hit normal combo (all electro), electro charged hit, plunge,
 * electro skill (press, hold, stacked hold × 3), electro burst (initial + main).
 * All normals/charged/plunge are electro (catalyst infuses innately).
 *
 * lisa_initial_dmg: constant 10% ATK burst hit; source: 'talent_burst' in raw,
 * but the ValueTable is a 1-entry constant [10], so level doesn't matter.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Lisa.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Lisa)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Lisa)
 */

import type { Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Lisa as LisaStatTable } from "../generated/charTables.js";
import { Lisa as LisaTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return LisaTalents.s1.p1;
      if (name === "normal_hit_2") return LisaTalents.s1.p2;
      if (name === "normal_hit_3") return LisaTalents.s1.p3;
      if (name === "normal_hit_4") return LisaTalents.s1.p4;
      if (name === "charged_hit") return LisaTalents.s1.p5;
      if (name === "plunge") return LisaTalents.s1.p7;
      if (name === "plunge_low") return LisaTalents.s1.p8;
      if (name === "plunge_high") return LisaTalents.s1.p9;
    }
    if (talent === "skill") {
      if (name === "press_dmg") return LisaTalents.s2.p6;
      if (name === "hold_dmg") return LisaTalents.s2.p1;
      if (name === "lisa_stack_1") return LisaTalents.s2.p2;
      if (name === "lisa_stack_2") return LisaTalents.s2.p3;
      if (name === "lisa_stack_3") return LisaTalents.s2.p4;
    }
    if (talent === "burst") {
      if (name === "burst_dmg") return LisaTalents.s3.p1;
    }
    throw new Error(`lisa talents: unknown path '${path}'`);
  },
};

// Constant 10% ATK talent table for lisa_initial_dmg.
// raw: new ValueTable([BurstInitialDmg]) where BurstInitialDmg = 10.
const lisaInitialDmgValues = { getValue: (_level: number) => 10 };

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (electro catalyst, always electro) ---
  {
    name: "normal_hit_1",
    category: "attack",
    element: "electro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1") }],
  },
  {
    name: "normal_hit_2",
    category: "attack",
    element: "electro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2") }],
  },
  {
    name: "normal_hit_3",
    category: "attack",
    element: "electro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }],
  },
  {
    name: "normal_hit_4",
    category: "attack",
    element: "electro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4") }],
  },
  // --- Charged attack (electro) ---
  {
    name: "charged_hit",
    category: "attack",
    damageType: "charged",
    element: "electro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }],
  },
  // --- Plunge attacks (electro catalyst) ---
  {
    name: "plunge",
    category: "attack",
    damageType: "plunge",
    element: "electro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge") }],
  },
  {
    name: "plunge_low",
    tags: ["plunge_shockwave"],
    category: "attack",
    damageType: "plunge",
    element: "electro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_low") }],
  },
  {
    name: "plunge_high",
    tags: ["plunge_shockwave"],
    category: "attack",
    damageType: "plunge",
    element: "electro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_high") }],
  },
  // --- Skill: Violet Arc ---
  {
    name: "press_dmg",
    category: "skill",
    element: "electro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.press_dmg") }],
  },
  {
    name: "hold_dmg",
    category: "skill",
    element: "electro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.hold_dmg") }],
  },
  {
    name: "lisa_stack_1",
    category: "skill",
    element: "electro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.lisa_stack_1") }],
  },
  {
    name: "lisa_stack_2",
    category: "skill",
    element: "electro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.lisa_stack_2") }],
  },
  {
    name: "lisa_stack_3",
    category: "skill",
    element: "electro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.lisa_stack_3") }],
  },
  // --- Burst: Lightning Rose ---
  // lisa_initial_dmg: flat 10% ATK constant (talent_burst leveling, ValueTable[10])
  {
    name: "lisa_initial_dmg",
    category: "burst",
    element: "electro",
    multipliers: [{ leveling: "char_skill_burst", values: lisaInitialDmgValues }],
  },
  {
    name: "burst_dmg",
    category: "burst",
    element: "electro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") }],
  },
];

// ---------------------------------------------------------------------------
// Constellations (P2.C Wave-1)
// ---------------------------------------------------------------------------
// C1 "Infinite Circuit" (ConditionStatic description-only) → SKIP.
// C2 "Electromagnetic Field" (ConditionBoolean def_percent toggle) → SKIP (off).
// C3 "Resonant Thunder" → +3 Elemental Burst (Lightning Rose) levels.
//   raw: constellation[2]: Condition{ settings:{char_skill_burst_bonus:3} }
// C4 "Plasma Eruption" (ConditionStatic description-only) → SKIP.
// C5 "Electrocute" → +3 Elemental Skill (Violet Arc) levels.
//   raw: constellation[4]: Condition{ settings:{char_skill_elemental_bonus:3} }
// C6 "Pulsating Witch" (ConditionStatic description-only) → SKIP.
//
// Sources: raw/genshin_calc_pub/src/js/db/Char/Lisa.js:302-358

const constellationConditions: readonly Condition[] = [
  // C3: +3 Elemental Burst (Lightning Rose) levels.
  { type: "constellation", constellation: 3, settings: { char_skill_burst_bonus: 3 } },
  // C5: +3 Elemental Skill (Violet Arc) levels.
  { type: "constellation", constellation: 5, settings: { char_skill_elemental_bonus: 3 } },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const lisa: DbObjectChar = {
  name: "lisa",
  gameId: 10000006,
  rarity: 4,
  element: "electro",
  weapon: "catalyst",
  origin: "mondstadt",
  statTable: LisaStatTable,
  talents,
  features,
  multipliers: [],
  conditions: constellationConditions,
  // A4 "Static Electricity Field" — enemy DEF -15%.
  // Source: raw/genshin_calc_pub/src/js/db/Char/Lisa.js:112,292-294,367-369
  partyData: {
    conditions: [
      {
        type: "static",
        stats: { enemy_def_reduce: 15 },
        condition: { type: "boolean", name: "party.lisa_static_electricity_field" },
      },
    ],
  },
};
