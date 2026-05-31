/**
 * Beidou — electro claymore ATK scaler.
 *
 * 5-hit normal combo, charged spin/final, plunge, electro skill (base + counter
 * bonus variants), electro burst (initial + lightning).
 *
 * skill_dmg: base tidecaller hit.
 * beidou_damage_1_hit: skill_dmg + beidou_skill_dmg_bonus×1 (1-counter max).
 * beidou_damage_2_hit: skill_dmg + beidou_skill_dmg_bonus×2 (2-counter max).
 * beidou_stunning_revenge (C4 only) is gated, skipped at C0.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Beidou.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Beidou)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Beidou)
 */

import type { DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Beidou as BeidouStatTable } from "../generated/charTables.js";
import { Beidou as BeidouTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return BeidouTalents.s1.p1;
      if (name === "normal_hit_2") return BeidouTalents.s1.p2;
      if (name === "normal_hit_3") return BeidouTalents.s1.p3;
      if (name === "normal_hit_4") return BeidouTalents.s1.p4;
      if (name === "normal_hit_5") return BeidouTalents.s1.p5;
      if (name === "charged_spin") return BeidouTalents.s1.p6;
      if (name === "charged_final") return BeidouTalents.s1.p7;
      if (name === "plunge") return BeidouTalents.s1.p10;
      if (name === "plunge_low") return BeidouTalents.s1.p11;
      if (name === "plunge_high") return BeidouTalents.s1.p12;
    }
    if (talent === "skill") {
      if (name === "skill_dmg") return BeidouTalents.s2.p3;
      if (name === "beidou_skill_dmg_bonus") return BeidouTalents.s2.p4;
    }
    if (talent === "burst") {
      if (name === "burst_dmg") return BeidouTalents.s3.p1;
      if (name === "beidou_lightning_dmg") return BeidouTalents.s3.p2;
    }
    throw new Error(`beidou talents: unknown path '${path}'`);
  },
};

// beidou_damage_1_hit: skill_dmg + beidou_skill_dmg_bonus×1 (1 counter hit)
// raw/genshin_calc_pub/src/js/db/Char/Beidou.js:272-285
const beidouBonus1Values = {
  getValue: (level: number) => BeidouTalents.s2.p4.getValue(level) * 1,
};

// beidou_damage_2_hit: skill_dmg + beidou_skill_dmg_bonus×2 (2 counter hits)
// raw/genshin_calc_pub/src/js/db/Char/Beidou.js:286-302
// scalingMultiplier: 2 on beidou_skill_dmg_bonus
const beidouBonus2Values = {
  getValue: (level: number) => BeidouTalents.s2.p4.getValue(level) * 2,
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks ---
  // raw/genshin_calc_pub/src/js/db/Char/Beidou.js:148-192
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
  // raw/genshin_calc_pub/src/js/db/Char/Beidou.js:205-222
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
  // raw/genshin_calc_pub/src/js/db/Char/Beidou.js:223-249
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
  // --- Skill: Tidecaller ---
  // skill_dmg: base electro hit
  // raw/genshin_calc_pub/src/js/db/Char/Beidou.js:262-271
  {
    name: "skill_dmg",
    category: "skill",
    element: "electro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.skill_dmg") }],
  },
  // beidou_damage_1_hit: base + 1× bonus (1 counter hit)
  // raw/genshin_calc_pub/src/js/db/Char/Beidou.js:272-285
  {
    name: "beidou_damage_1_hit",
    category: "skill",
    element: "electro",
    multipliers: [
      { leveling: "char_skill_elemental", values: talents.get("skill.skill_dmg") },
      { leveling: "char_skill_elemental", values: beidouBonus1Values },
    ],
  },
  // beidou_damage_2_hit: base + 2× bonus (2 counter hits)
  // raw/genshin_calc_pub/src/js/db/Char/Beidou.js:286-302
  {
    name: "beidou_damage_2_hit",
    category: "skill",
    element: "electro",
    multipliers: [
      { leveling: "char_skill_elemental", values: talents.get("skill.skill_dmg") },
      { leveling: "char_skill_elemental", values: beidouBonus2Values },
    ],
  },
  // --- Burst: Stormbreaker ---
  // raw/genshin_calc_pub/src/js/db/Char/Beidou.js:302-321
  {
    name: "burst_dmg",
    category: "burst",
    element: "electro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") }],
  },
  {
    name: "beidou_lightning_dmg",
    category: "burst",
    element: "electro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.beidou_lightning_dmg") }],
  },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const beidou: DbObjectChar = {
  name: "beidou",
  gameId: 10000024,
  rarity: 4,
  element: "electro",
  weapon: "claymore",
  origin: "liyue",
  statTable: BeidouStatTable,
  talents,
  features,
  multipliers: [],
};
