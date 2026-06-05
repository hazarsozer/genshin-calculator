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

import type { Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
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
  // --- C4 "Stunning Revenge": cons-added electro counter hit (fixed 20% ATK).
  // Raw: base FeatureDamage (NOT FeatureDamageNormal) → damageType:"" (no dmg_type bonus,
  // only dmg_all + dmg_electro). Fixed ValueTable([20]), category:'attack', element:'electro'.
  // Raw Beidou.js:193-204. TalentValues.C4Damage = 20.
  {
    name: "beidou_stunning_revenge",
    category: "attack",
    element: "electro",
    damageType: "",
    condition: { type: "constellation", constellation: 4 },
    multipliers: [
      {
        leveling: "char_skill_attack",
        values: { getValue: (_level: number) => 20 },
        source: "constellation4",
      },
    ],
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
// Constellation conditions (P2.C)
// ---------------------------------------------------------------------------
// C1 "Sea Beast's Scourge": ConditionStatic (text_percent_shield:16) display-only → SKIP.
//   The C1 shield (beidou_stormbreaker_shield) is in the features list above as a
//   FeatureShield — already emitted from raw features, not from the cons array.
// C2 "Upon the Turbulent Sea, the Thunder Arises": ConditionStatic display-only → SKIP.
// C3: +3 levels to Tidecaller (skill). Raw cons[2] settings char_skill_elemental_bonus:3.
// C4 "Stunning Revenge": ConditionStatic (text_percent_dmg:20) display-only → SKIP.
//   The actual C4 damage comes from the beidou_stunning_revenge feature above.
// C5: +3 levels to Stormbreaker (burst). Raw cons[4] settings char_skill_burst_bonus:3.
// C6 "Bane of Evil": ConditionBoolean (enemy_res_electro:-15 toggle) → SKIP (toggle OFF).
// Raw: Beidou.js:374-437 (constellation array).
const constellationConditions: readonly Condition[] = [
  // C3: +3 levels to Tidecaller (skill).
  { type: "constellation", constellation: 3, settings: { char_skill_elemental_bonus: 3 } },
  // C5: +3 levels to Stormbreaker (burst).
  { type: "constellation", constellation: 5, settings: { char_skill_burst_bonus: 3 } },
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
  conditions: constellationConditions,
  // C6 "Bane of Evil" — enemy Electro RES -15%.
  // Source: raw/genshin_calc_pub/src/js/db/Char/Beidou.js (partyData conditions)
  partyData: {
    conditions: [
      {
        type: "static",
        stats: { enemy_res_electro: -15 },
        condition: { type: "boolean", name: "party.beidou_bane_of_the_evil" },
      },
    ],
  },
};
