/**
 * Kaeya — cryo sword ATK scaler.
 *
 * Standard 5-hit normal combo with 2-hit charged (multihit), plunge,
 * cryo skill (single hit), cryo burst (single hit). No post-effects at C0.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Kaeya.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Kaeya)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Kaeya)
 */

import type { Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Kaeya as KaeyaStatTable } from "../generated/charTables.js";
import { Kaeya as KaeyaTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return KaeyaTalents.s1.p1;
      if (name === "normal_hit_2") return KaeyaTalents.s1.p2;
      if (name === "normal_hit_3") return KaeyaTalents.s1.p3;
      if (name === "normal_hit_4") return KaeyaTalents.s1.p4;
      if (name === "normal_hit_5") return KaeyaTalents.s1.p5;
      if (name === "charged_hit_1") return KaeyaTalents.s1.p6;
      if (name === "charged_hit_2") return KaeyaTalents.s1.p7;
      if (name === "plunge") return KaeyaTalents.s1.p9;
      if (name === "plunge_low") return KaeyaTalents.s1.p10;
      if (name === "plunge_high") return KaeyaTalents.s1.p11;
    }
    if (talent === "skill") {
      if (name === "skill_dmg") return KaeyaTalents.s2.p1;
    }
    if (talent === "burst") {
      if (name === "burst_dmg") return KaeyaTalents.s3.p1;
    }
    throw new Error(`kaeya talents: unknown path '${path}'`);
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
  {
    name: "normal_hit_5",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_5") }],
  },
  // --- Charged attacks (2-hit multihit combo, plus individual child hits) ---
  {
    name: "charged_hit_total",
    category: "attack",
    damageType: "charged",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit_1") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit_2") }] },
    ],
  },
  {
    name: "charged_hit_1",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit_1") }],
  },
  {
    name: "charged_hit_2",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit_2") }],
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
  // --- Skill: Frostgnaw (cryo) ---
  {
    name: "skill_dmg",
    category: "skill",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.skill_dmg") }],
  },
  // --- Burst: Glacial Waltz (cryo) ---
  {
    name: "burst_dmg",
    category: "burst",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") }],
  },
];

// ---------------------------------------------------------------------------
// Constellation conditions (P2.C Wave-1)
// ---------------------------------------------------------------------------
// C1 "Excellent Blood": ConditionBoolean toggle (crit_rate_kaeya=15) → SKIP.
// C2 "Never-Ending Performance": ConditionStatic, no real stats → SKIP.
// C4 "Frozen Kiss": FeatureShield gated by ConditionConstellation(4) —
//   shield features are not damage triples (no element/damageType multiplier),
//   not in the golden fixture → SKIP (no cons-feature flag needed).
// C6 "Glacial Whirlwind": ConditionStatic, no real stats → SKIP.
//
// Always-on: C3 (+3 skill talent), C5 (+3 burst talent).
// Sources: raw/genshin_calc_pub/src/js/db/Char/Kaeya.js:313-370

const constellationConditions: readonly Condition[] = [
  // C3 "Heart of the Abyss" — +3 Elemental Skill (Frostgnaw).
  // Raw cons[2]: new Condition({ settings: { char_skill_elemental_bonus: 3 } }).
  { type: "constellation", constellation: 3, settings: { char_skill_elemental_bonus: 3 } },
  // C5 "Praise of Ice" — +3 Elemental Burst (Glacial Waltz).
  // Raw cons[4]: new Condition({ settings: { char_skill_burst_bonus: 3 } }).
  { type: "constellation", constellation: 5, settings: { char_skill_burst_bonus: 3 } },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const kaeya: DbObjectChar = {
  name: "kaeya",
  gameId: 10000015,
  rarity: 4,
  element: "cryo",
  weapon: "sword",
  origin: "mondstadt",
  statTable: KaeyaStatTable,
  talents,
  features,
  multipliers: [],
  conditions: constellationConditions,
};
