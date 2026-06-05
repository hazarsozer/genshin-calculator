/**
 * Thoma — pyro polearm ATK+HP scaler.
 *
 * 4-hit normal combo: n1, n2, n3 (multihit parent: 2×p3, child n3_1), n4.
 * Charged: single thrust (charged_hit). Plunge/low/high.
 * Pyro skill: skill_dmg (ATK-scaled).
 * Pyro burst: burst_dmg (ATK-scaled) + thoma_fiery_collapse_dmg (ATK + A4 HP-based).
 *
 * normal_hit_3 is FeatureDamageMultihit (items: 2 identical hits of s1.p3).
 * normal_hit_3_1 is FeatureDamageNormal with isChild:true → drop isChild to emit.
 *
 * thoma_fiery_collapse_dmg has TWO multipliers:
 *   1. ATK-scaled (char_skill_burst, s3.p2)
 *   2. HP-scaled (A4 "Flaming Assault": 2.2% HP, ConditionAscensionChar{ascension:4})
 *      Auto-active at canonical A6 build → include unconditionally.
 *
 * Non-damage features (damageType: "" in fixture, not tested):
 *   - skill.shield / skill.shield_max_absorption — HP-scaled shields
 *   - burst.shield — HP-scaled burst shield
 *
 * Reactions (5 auto-generated from pyro element):
 *   burgeon, burning, electrocharged, overloaded, shatter
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Thoma.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Thoma)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js:5729 (Thoma)
 */

import type { Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Thoma as ThomaStatTable } from "../generated/charTables.js";
import { Thoma as ThomaTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return ThomaTalents.s1.p1;
      if (name === "normal_hit_2") return ThomaTalents.s1.p2;
      if (name === "normal_hit_3") return ThomaTalents.s1.p3;
      if (name === "normal_hit_4") return ThomaTalents.s1.p4;
      if (name === "charged_hit")  return ThomaTalents.s1.p5;
      if (name === "plunge")       return ThomaTalents.s1.p7;
      if (name === "plunge_low")   return ThomaTalents.s1.p8;
      if (name === "plunge_high")  return ThomaTalents.s1.p9;
    }
    if (talent === "skill") {
      if (name === "skill_dmg") return ThomaTalents.s2.p1;
    }
    if (talent === "burst") {
      if (name === "burst_dmg")                  return ThomaTalents.s3.p1;
      if (name === "thoma_fiery_collapse_dmg")   return ThomaTalents.s3.p2;
    }
    throw new Error(`thoma talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// A4 "Flaming Assault" HP-scale additive on thoma_fiery_collapse_dmg.
// ConditionAscensionChar({ascension: 4}) → auto-active at canonical A6 build.
// raw/genshin_calc_pub/src/js/db/Char/Thoma.js: thoma_fiery_collapse_dmg multipliers
// ---------------------------------------------------------------------------

const A4_HP_SCALE = 2.2; // TalentValues not in raw — from source FeatureMultiplier: values: new ValueTable([2.2])
const a4HpTerm = {
  scaling: "hp",
  leveling: "",
  values: { getValue: (_level: number) => A4_HP_SCALE },
} as const;

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (physical polearm) ---
  // raw: FeatureDamageNormal normal_hit_1 (s1.p1)
  {
    name: "normal_hit_1",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1") }],
  },
  // raw: FeatureDamageNormal normal_hit_2 (s1.p2)
  {
    name: "normal_hit_2",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2") }],
  },
  // raw: FeatureDamageMultihit normal_hit_3 (2 hits of s1.p3 — items[0].hits = 2)
  // raw/genshin_calc_pub/src/js/db/Char/Thoma.js: FeatureDamageMultihit normal_hit_3
  {
    name: "normal_hit_3",
    category: "attack",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }] },
    ],
  },
  // raw: FeatureDamageNormal normal_hit_3_1 (isChild:true, but fixture tests it → emit)
  {
    name: "normal_hit_3_1",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }],
  },
  // raw: FeatureDamageNormal normal_hit_4 (s1.p4)
  {
    name: "normal_hit_4",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4") }],
  },
  // --- Charged attack ---
  // raw: FeatureDamageCharged charged_hit (s1.p5)
  {
    name: "charged_hit",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }],
  },
  // --- Plunge attacks ---
  // raw: FeatureDamagePlungeCollision plunge (s1.p7)
  {
    name: "plunge",
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge") }],
  },
  // raw: FeatureDamagePlungeShockWave plunge_low (s1.p8)
  {
    name: "plunge_low",
    tags: ["plunge_shockwave"],
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_low") }],
  },
  // raw: FeatureDamagePlungeShockWave plunge_high (s1.p9)
  {
    name: "plunge_high",
    tags: ["plunge_shockwave"],
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_high") }],
  },
  // --- Skill: Blazing Blessing (pyro ATK-scaled) ---
  // raw: FeatureDamageSkill skill_dmg, element:'pyro' (s2.p1)
  {
    name: "skill_dmg",
    category: "skill",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.skill_dmg") }],
  },
  // --- Burst: Crimson Ooyoroi (pyro ATK-scaled) ---
  // raw: FeatureDamageBurst burst_dmg, element:'pyro' (s3.p1)
  {
    name: "burst_dmg",
    category: "burst",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") }],
  },
  // raw: FeatureDamageBurst thoma_fiery_collapse_dmg, element:'pyro' (s3.p2)
  //      + A4 HP-scaling multiplier (2.2% HP, auto-active at A6)
  // raw/genshin_calc_pub/src/js/db/Char/Thoma.js: thoma_fiery_collapse_dmg multipliers
  {
    name: "thoma_fiery_collapse_dmg",
    category: "burst",
    element: "pyro",
    multipliers: [
      { leveling: "char_skill_burst", values: talents.get("burst.thoma_fiery_collapse_dmg") },
      a4HpTerm,
    ],
  },
];

// ---------------------------------------------------------------------------
// Constellations (P2.C Wave-1)
// ---------------------------------------------------------------------------
// C1 "A Comrade's Duty": ConditionStatic no real stats → SKIP.
// C2 "A Subordinate's Skills": ConditionStatic no real stats → SKIP.
// C3 "Fortified Resolve": +3 Elemental Skill talent levels.
//   Raw cons[2]: Condition{ settings:{ char_skill_elemental_bonus:3 } }
// C4 "Long-term Planning": ConditionStatic no real stats → SKIP.
// C5 "Raging Wildfire": +3 Elemental Burst talent levels.
//   Raw cons[4]: Condition{ settings:{ char_skill_burst_bonus:3 } }
// C6 "Burning Heart": ConditionBoolean (dmg_normal/charged/plunge toggle) → SKIP.
// Sources: raw/genshin_calc_pub/src/js/db/Char/Thoma.js:325-410

const constellationConditions: readonly Condition[] = [
  // C3 "Fortified Resolve" — +3 Elemental Skill talent levels (Blazing Blessing).
  // Raw cons[2]: Condition{ settings:{ char_skill_elemental_bonus:3 } }
  { type: "constellation", constellation: 3, settings: { char_skill_elemental_bonus: 3 } },
  // C5 "Raging Wildfire" — +3 Elemental Burst talent levels (Crimson Ooyoroi).
  // Raw cons[4]: Condition{ settings:{ char_skill_burst_bonus:3 } }
  { type: "constellation", constellation: 5, settings: { char_skill_burst_bonus: 3 } },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const thoma: DbObjectChar = {
  name: "thoma",
  gameId: 10000050,
  rarity: 4,
  element: "pyro",
  weapon: "polearm",
  origin: "inazuma",
  statTable: ThomaStatTable,
  talents,
  features,
  multipliers: [],
  conditions: constellationConditions,
  // C6 "Burning Heart" — +15% DMG to Normal / Charged / Plunge attacks.
  // Source: raw/genshin_calc_pub/src/js/db/Char/Thoma.js (partyData condition)
  partyData: {
    conditions: [
      {
        type: "static",
        stats: { dmg_normal: 15, dmg_charged: 15, dmg_plunge: 15 },
        condition: { type: "boolean", name: "party.thoma_burning_heart" },
      },
    ],
  },
};
