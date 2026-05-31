/**
 * Xinyan — physical/pyro claymore ATK scaler.
 *
 * 4-hit normal combo (physical), spin/final charged (physical), plunge,
 * pyro skill (swing + dot_dmg shield-flame), physical burst (burst_dmg),
 * pyro burst dot (dot_dmg).
 *
 * burst_dmg: physical (FeatureDamageBurstXinyan extends FeatureDamageBurst,
 * no element param → defaults to 'phys'). C2 bonus crit rate is off at C0.
 * dot_dmg in burst: pyro (explicit element: 'pyro' in raw).
 *
 * Normals/charged/plunge: physical by default (no element on feature).
 * razor.ts is the proven exemplar for this physical-claymore + elemental-skill pattern.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Xinyan.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Xinyan)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Xinyan)
 */

import type { DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Xinyan as XinyanStatTable } from "../generated/charTables.js";
import { Xinyan as XinyanTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return XinyanTalents.s1.p1;
      if (name === "normal_hit_2") return XinyanTalents.s1.p2;
      if (name === "normal_hit_3") return XinyanTalents.s1.p3;
      if (name === "normal_hit_4") return XinyanTalents.s1.p4;
      if (name === "charged_spin") return XinyanTalents.s1.p5;
      if (name === "charged_final") return XinyanTalents.s1.p6;
      if (name === "plunge") return XinyanTalents.s1.p9;
      if (name === "plunge_low") return XinyanTalents.s1.p10;
      if (name === "plunge_high") return XinyanTalents.s1.p11;
    }
    if (talent === "skill") {
      if (name === "swing_dmg") return XinyanTalents.s2.p1;
      if (name === "dot_dmg") return XinyanTalents.s2.p8;
    }
    if (talent === "burst") {
      if (name === "burst_dmg") return XinyanTalents.s3.p1;
      if (name === "dot_dmg") return XinyanTalents.s3.p2;
    }
    throw new Error(`xinyan talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (physical, no element → defaults to physical) ---
  // raw/genshin_calc_pub/src/js/db/Char/Xinyan.js:152-183
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
  // --- Charged attacks (physical) ---
  // raw/genshin_calc_pub/src/js/db/Char/Xinyan.js:184-200
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
  // --- Plunge attacks (physical) ---
  // raw/genshin_calc_pub/src/js/db/Char/Xinyan.js:201-224
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
  // --- Skill: Sweeping Fervor ---
  // swing_dmg: pyro hit
  // raw/genshin_calc_pub/src/js/db/Char/Xinyan.js:225-233
  {
    name: "swing_dmg",
    category: "skill",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.swing_dmg") }],
  },
  // dot_dmg: pyro shield-flame DoT
  // raw/genshin_calc_pub/src/js/db/Char/Xinyan.js:234-242
  {
    name: "dot_dmg",
    category: "skill",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.dot_dmg") }],
  },
  // --- Burst: Riff Revolution ---
  // burst_dmg: PHYSICAL (FeatureDamageBurstXinyan has no element param → phys)
  // raw/genshin_calc_pub/src/js/db/Char/Xinyan.js:276-283
  // Must set element: "physical" explicitly to override charElement (pyro).
  {
    name: "burst_dmg",
    category: "burst",
    element: "physical",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") }],
  },
  // dot_dmg: pyro burst DoT (FeatureDamageBurst with element: 'pyro')
  // raw/genshin_calc_pub/src/js/db/Char/Xinyan.js:284-292
  {
    name: "dot_dmg",
    category: "burst",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.dot_dmg") }],
  },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const xinyan: DbObjectChar = {
  name: "xinyan",
  gameId: 10000044,
  rarity: 4,
  element: "pyro",
  weapon: "claymore",
  origin: "liyue",
  statTable: XinyanStatTable,
  talents,
  features,
  multipliers: [],
};
