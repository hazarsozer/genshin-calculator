/**
 * Xiangling — pyro polearm ATK scaler.
 *
 * 5-hit normal combo with multihit normals (n3: 2×, n4: 4×), single charged,
 * plunge, pyro skill (Guoba), pyro burst (swing hits × 3 + Pyronado).
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Xiangling.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Xiangling)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Xiangling)
 */

import type { DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Xiangling as XianglingStatTable } from "../generated/charTables.js";
import { Xiangling as XianglingTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return XianglingTalents.s1.p1;
      if (name === "normal_hit_2") return XianglingTalents.s1.p2;
      if (name === "normal_hit_3") return XianglingTalents.s1.p3;
      if (name === "normal_hit_4") return XianglingTalents.s1.p4;
      if (name === "normal_hit_5") return XianglingTalents.s1.p5;
      if (name === "charged_hit") return XianglingTalents.s1.p6;
      if (name === "plunge") return XianglingTalents.s1.p8;
      if (name === "plunge_low") return XianglingTalents.s1.p9;
      if (name === "plunge_high") return XianglingTalents.s1.p10;
    }
    if (talent === "skill") {
      if (name === "skill_dmg") return XianglingTalents.s2.p1;
    }
    if (talent === "burst") {
      if (name === "xiangling_swing_hit_1") return XianglingTalents.s3.p1;
      if (name === "xiangling_swing_hit_2") return XianglingTalents.s3.p2;
      if (name === "xiangling_swing_hit_3") return XianglingTalents.s3.p3;
      if (name === "xiangling_pyronado") return XianglingTalents.s3.p4;
    }
    throw new Error(`xiangling talents: unknown path '${path}'`);
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
  // normal_hit_3: 2-hit combo (same multiplier twice)
  {
    name: "normal_hit_3",
    category: "attack",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }] },
    ],
  },
  {
    name: "normal_hit_3_1",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }],
  },
  // normal_hit_4: 4-hit combo (same multiplier four times)
  {
    name: "normal_hit_4",
    category: "attack",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4") }] },
    ],
  },
  {
    name: "normal_hit_4_1",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4") }],
  },
  {
    name: "normal_hit_5",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_5") }],
  },
  // --- Charged attack ---
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
  // --- Skill: Guoba Attack (pyro) ---
  {
    name: "skill_dmg",
    category: "skill",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.skill_dmg") }],
  },
  // --- Burst: Pyronado (pyro) ---
  {
    name: "xiangling_swing_hit_1",
    category: "burst",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.xiangling_swing_hit_1") }],
  },
  {
    name: "xiangling_swing_hit_2",
    category: "burst",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.xiangling_swing_hit_2") }],
  },
  {
    name: "xiangling_swing_hit_3",
    category: "burst",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.xiangling_swing_hit_3") }],
  },
  {
    name: "xiangling_pyronado",
    category: "burst",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.xiangling_pyronado") }],
  },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const xiangling: DbObjectChar = {
  name: "xiangling",
  gameId: 10000023,
  rarity: 4,
  element: "pyro",
  weapon: "polearm",
  origin: "liyue",
  statTable: XianglingStatTable,
  talents,
  features,
  multipliers: [],
};
