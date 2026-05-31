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

import type { DbObjectChar, Feature, TalentResolver } from "@genshin/types";
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
};
