/**
 * Klee — pyro catalyst ATK scaler.
 *
 * 3-hit normal combo, charged Jumpy Dumpty (catalyst-infused → pyro), plunge,
 * pyro skill (Jumpy Dumpty bomb + mine), pyro burst (Sparks 'n' Splash baseline).
 * All normals/charged/plunge are pyro (catalyst infuses innately; raw marks every
 * feature element: 'pyro').
 *
 * Folded bonuses: NONE active in the solo C0 fixed build.
 *   - A1 "Pounding Surprise" (+50% charged DMG) is a ConditionBoolean (user toggle,
 *     default OFF). The fixture is generated with settings:{}, so it is not applied —
 *     charged_hit gets only the build's standard dmg_charged. Modelling it would
 *     diverge from the oracle, so it is omitted.
 *   - A4 "Sparkling Burst" is energy-regen only (no damage stat) → nothing to fold.
 *   - The pyro ascension DMG% (dmg_pyro_base) comes from the statTable via buildStats.
 *   - Constellations skipped (C0 build).
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Klee.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Klee)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Klee)
 */

import type { Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Klee as KleeStatTable } from "../generated/charTables.js";
import { Klee as KleeTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return KleeTalents.s1.p1;
      if (name === "normal_hit_2") return KleeTalents.s1.p2;
      if (name === "normal_hit_3") return KleeTalents.s1.p3;
      if (name === "charged_hit") return KleeTalents.s1.p4;
      if (name === "plunge") return KleeTalents.s1.p6;
      if (name === "plunge_low") return KleeTalents.s1.p7;
      if (name === "plunge_high") return KleeTalents.s1.p8;
    }
    if (talent === "skill") {
      if (name === "klee_jumpy_dumpty") return KleeTalents.s2.p1;
      if (name === "klee_mine") return KleeTalents.s2.p4;
    }
    if (talent === "burst") {
      if (name === "burst_dmg") return KleeTalents.s3.p1;
    }
    throw new Error(`klee talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (pyro catalyst) ---
  {
    name: "normal_hit_1",
    category: "attack",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1") }],
  },
  {
    name: "normal_hit_2",
    category: "attack",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2") }],
  },
  {
    name: "normal_hit_3",
    category: "attack",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }],
  },
  // --- Charged attack: Jumpy Dumpty (pyro) ---
  {
    name: "charged_hit",
    category: "attack",
    damageType: "charged",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }],
  },
  // --- Plunge attacks (pyro catalyst) ---
  {
    name: "plunge",
    category: "attack",
    damageType: "plunge",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge") }],
  },
  {
    name: "plunge_low",
    category: "attack",
    damageType: "plunge",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_low") }],
  },
  {
    name: "plunge_high",
    category: "attack",
    damageType: "plunge",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_high") }],
  },
  // --- Skill: Jumpy Dumpty (pyro bomb + mine) ---
  {
    name: "klee_jumpy_dumpty",
    category: "skill",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.klee_jumpy_dumpty") }],
  },
  {
    name: "klee_mine",
    category: "skill",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.klee_mine") }],
  },
  // --- Burst: Sparks 'n' Splash (pyro) ---
  {
    name: "burst_dmg",
    category: "burst",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") }],
  },
  // --- C1 "Chained Reactions": bonus burst hit = 120% of burst_dmg.
  // Raw: FeatureDamageBurst klee_chained_reactions, scalingMultiplier: 120/100=1.2,
  // leveling:'char_skill_burst', values: burst_dmg talent. Raw Klee.js:221-231.
  // ConditionConstellation(1).
  {
    name: "klee_chained_reactions",
    category: "burst",
    element: "pyro",
    condition: { type: "constellation", constellation: 1 },
    multipliers: [
      {
        leveling: "char_skill_burst",
        values: talents.get("burst.burst_dmg"),
        scalingMultiplier: 1.2,
        source: "constellation1",
      },
    ],
  },
  // --- C4 "Sparkly Explosion": fixed 555% ATK burst hit (FeatureDamage base class).
  // Raw: FeatureDamage klee_sparkly_explosion, category:'burst', ValueTable([555]),
  // no leveling (→ ''), source:'constellation4'. Base FeatureDamage → damageType:"".
  // Raw Klee.js:233-244. ConditionConstellation(4).
  {
    name: "klee_sparkly_explosion",
    category: "burst",
    element: "pyro",
    damageType: "",
    condition: { type: "constellation", constellation: 4 },
    multipliers: [
      {
        leveling: "",
        values: { getValue: (_level: number) => 555 },
        source: "constellation4",
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Constellation conditions (P2.C)
// ---------------------------------------------------------------------------
// C1 "Chained Reactions": ConditionStatic text_percent_dmg:120 → display-only;
//   actual damage from klee_chained_reactions feature above. Raw Klee.js:269-280.
// C2 "Explosive Frags": ConditionBoolean toggle (enemy_def_reduce:23) → SKIP (toggle OFF).
// C3: +3 levels to Jumpy Dumpty (skill). Raw cons[2] settings char_skill_elemental_bonus:3.
// C4 "Sparkly Explosion": ConditionStatic text_percent_dmg:555 → display-only;
//   actual damage from klee_sparkly_explosion feature above. Raw Klee.js:300-311.
// C5: +3 levels to Sparks 'n' Splash (burst). Raw cons[4] settings char_skill_burst_bonus:3.
// C6 "Blazing Delight": ConditionBoolean toggle (dmg_pyro:10) → SKIP (toggle OFF).
const constellationConditions: readonly Condition[] = [
  // C3: +3 levels to Jumpy Dumpty (elemental skill). Raw cons[2] settings.
  { type: "constellation", constellation: 3, settings: { char_skill_elemental_bonus: 3 } },
  // C5: +3 levels to Sparks 'n' Splash (elemental burst). Raw cons[4] settings.
  { type: "constellation", constellation: 5, settings: { char_skill_burst_bonus: 3 } },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const klee: DbObjectChar = {
  name: "klee",
  gameId: 10000029,
  rarity: 5,
  element: "pyro",
  weapon: "catalyst",
  origin: "mondstadt",
  statTable: KleeStatTable,
  talents,
  features,
  multipliers: [],
  conditions: constellationConditions,
  // C2 "Explosive Frags" — enemy DEF -23%.
  // C6 "Blazing Delight" — +10% Pyro DMG to party.
  // Source: raw/genshin_calc_pub/src/js/db/Char/Klee.js (partyData conditions)
  partyData: {
    conditions: [
      {
        type: "static",
        stats: { enemy_def_reduce: 23 },
        condition: { type: "boolean", name: "party.klee_explosive_frags" },
      },
      {
        type: "static",
        stats: { dmg_pyro: 10 },
        condition: { type: "boolean", name: "party.klee_blazing_delight" },
      },
    ],
  },
};
