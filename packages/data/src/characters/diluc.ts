/**
 * Diluc — P1.7b ATK-scaling representative.
 *
 * Pure ATK scaler (no HP/DEF post-effects). Covers normal/charged/plunge
 * physical attacks plus pyro skill (3 hits) and pyro burst (slash + DoT + explosion).
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Diluc.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js:265
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js:1311
 */

import type { DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Diluc as DilucStatTable } from "../generated/charTables.js";
import { Diluc as DilucTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return DilucTalents.s1.p1;
      if (name === "normal_hit_2") return DilucTalents.s1.p2;
      if (name === "normal_hit_3") return DilucTalents.s1.p3;
      if (name === "normal_hit_4") return DilucTalents.s1.p4;
      if (name === "charged_spin") return DilucTalents.s1.p5;
      if (name === "charged_final") return DilucTalents.s1.p6;
      if (name === "plunge") return DilucTalents.s1.p9;
      if (name === "plunge_low") return DilucTalents.s1.p10;
      if (name === "plunge_high") return DilucTalents.s1.p11;
    }
    if (talent === "skill") {
      if (name === "skill_hit_1") return DilucTalents.s2.p1;
      if (name === "skill_hit_2") return DilucTalents.s2.p2;
      if (name === "skill_hit_3") return DilucTalents.s2.p3;
    }
    if (talent === "burst") {
      if (name === "diluc_burst_slash") return DilucTalents.s3.p1;
      if (name === "dilic_burst_dot") return DilucTalents.s3.p2;
      if (name === "diluc_burst_explosion") return DilucTalents.s3.p3;
    }
    throw new Error(`diluc talents: unknown path '${path}'`);
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
  // --- Charged attacks ---
  {
    name: "charged_spin",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_spin") }],
  },
  {
    name: "charged_final",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_final") }],
  },
  // --- Plunge attacks ---
  {
    name: "plunge",
    category: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge") }],
  },
  {
    name: "plunge_low",
    category: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_low") }],
  },
  {
    name: "plunge_high",
    category: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_high") }],
  },
  // --- Skill: Searing Onslaught (all 3 hits are pyro) ---
  {
    name: "skill_hit_1",
    category: "skill",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.skill_hit_1") }],
  },
  {
    name: "skill_hit_2",
    category: "skill",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.skill_hit_2") }],
  },
  {
    name: "skill_hit_3",
    category: "skill",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.skill_hit_3") }],
  },
  // --- Burst: Dawn ---
  {
    name: "diluc_burst_slash",
    category: "burst",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.diluc_burst_slash") }],
  },
  {
    name: "dilic_burst_dot",
    category: "burst",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.dilic_burst_dot") }],
  },
  {
    name: "diluc_burst_explosion",
    category: "burst",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.diluc_burst_explosion") }],
  },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const diluc: DbObjectChar = {
  name: "diluc",
  gameId: 10000016,
  rarity: 5,
  element: "pyro",
  weapon: "claymore",
  origin: "mondstadt",
  statTable: DilucStatTable,
  talents,
  features,
  multipliers: [],
};
