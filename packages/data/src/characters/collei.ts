/**
 * Collei — dendro bow ATK scaler.
 *
 * 4-hit normal combo (physical), physical aimed shot, dendro fully charged aimed
 * shot, plunge/low/high, dendro skill, dendro burst (explosion + leap),
 * A1 "Floral Sidewinder" (40% flat ATK dendro, category "other", auto-active at A6).
 *
 * A1 is ConditionAscensionChar({ascension: 1}) — always active at ascension 6.
 * C6 constellation is off at C0.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Collei.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Collei)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Collei)
 */

import type { Condition, DbObjectChar, Feature, TalentResolver, TalentTable } from "@genshin/types";
import { Collei as ColleiStatTable } from "../generated/charTables.js";
import { Collei as ColleiTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return ColleiTalents.s1.p1;
      if (name === "normal_hit_2") return ColleiTalents.s1.p2;
      if (name === "normal_hit_3") return ColleiTalents.s1.p3;
      if (name === "normal_hit_4") return ColleiTalents.s1.p4;
      if (name === "aimed") return ColleiTalents.s1.p5;
      if (name === "charged_aimed") return ColleiTalents.s1.p6;
      if (name === "plunge") return ColleiTalents.s1.p7;
      if (name === "plunge_low") return ColleiTalents.s1.p8;
      if (name === "plunge_high") return ColleiTalents.s1.p9;
    }
    if (talent === "skill") {
      if (name === "skill_dmg") return ColleiTalents.s2.p1;
    }
    if (talent === "burst") {
      if (name === "collei_explosion_dmg") return ColleiTalents.s3.p1;
      if (name === "collei_leap_dmg") return ColleiTalents.s3.p2;
    }
    throw new Error(`collei talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Derived talent tables
// ---------------------------------------------------------------------------

// A1 "Floral Sidewinder": flat 40% ATK dendro hit (ValueTable([40]) constant).
// Auto-active at A6 (ConditionAscensionChar({ascension: 1})).
// raw/genshin_calc_pub/src/js/db/Char/Collei.js:99-103, 229-240
const floralSidewinderTable: TalentTable = { getValue: (_level: number) => 40 };

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (physical bow) ---
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
  // --- Charged attacks (bow aimed shots) ---
  // aimed: physical charged shot
  {
    name: "aimed",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.aimed") }],
  },
  // charged_aimed: fully charged dendro arrow
  {
    name: "charged_aimed",
    category: "attack",
    damageType: "charged",
    element: "dendro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_aimed") }],
  },
  // --- Plunge attacks (physical bow) ---
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
  // --- Skill: Floral Brush (dendro) ---
  {
    name: "skill_dmg",
    category: "skill",
    element: "dendro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.skill_dmg") }],
  },
  // --- Burst: Trump-Card Kitty (dendro) ---
  {
    name: "collei_explosion_dmg",
    category: "burst",
    element: "dendro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.collei_explosion_dmg") }],
  },
  {
    name: "collei_leap_dmg",
    category: "burst",
    element: "dendro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.collei_leap_dmg") }],
  },
  // --- A1 "Floral Sidewinder" (category defaults to "other", damageType "skill", dendro) ---
  // Flat 40% ATK dendro hit from Cuilein-Anbar; auto-active at A6.
  // category is intentionally omitted — `featureKey` maps undefined → "other",
  // producing the fixture key "other.collei_floral_sidewinder_dmg".
  // raw/genshin_calc_pub/src/js/db/Char/Collei.js:229-240
  {
    name: "collei_floral_sidewinder_dmg",
    damageType: "skill",
    element: "dendro",
    multipliers: [{ leveling: "char_skill_elemental", values: floralSidewinderTable }],
  },
  // --- C6 "Forest of Falling Arrows": cons-added dendro ATK hit at 200% ATK.
  // Raw is base FeatureDamage (NOT FeatureDamageSkill) with category:'other' →
  // damageType:"" suppresses dmg_<type>; gets dmg_all+dmg_dendro only.
  // category omitted → loader defaults to "other" (matches the fixture key
  // `other.collei_...`). Fixed ValueTable([200]); source:'constellation6'. Raw Collei.js:241-252.
  {
    name: "collei_forest_of_falling_arrows_dmg",
    element: "dendro",
    damageType: "",
    condition: { type: "constellation", constellation: 6 },
    multipliers: [
      { leveling: "char_skill_elemental", values: { getValue: (_level: number) => 200 }, source: "constellation6" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Constellation conditions (P2.C)
// ---------------------------------------------------------------------------
// C1 "Deepwood Patrol": ConditionBoolean toggle (recharge:20) → SKIP.
// C2 "Through Hill and Copse": ConditionStatic display-only (text_percent:40) → SKIP.
// C3: +3 levels to Floral Brush (skill). Raw cons[2] settings char_skill_elemental_bonus:3.
// C4 "Gift of the Woods": ConditionStatic display-only (text_value:60) → SKIP.
// C5: +3 levels to Trump-Card Kitty (burst). Raw cons[4] settings char_skill_burst_bonus:3.
// C6 "Forest of Falling Arrows": ConditionStatic display-only in cons array → SKIP.
//   The actual C6 damage comes from collei_forest_of_falling_arrows_dmg feature above.
// Raw: db/Char/Collei.js constellation array (Collei.js:276-341).
const constellationConditions: readonly Condition[] = [
  // C3: +3 levels to Floral Brush (skill). Raw Collei.js:301-307.
  { type: "constellation", constellation: 3, settings: { char_skill_elemental_bonus: 3 } },
  // C5: +3 levels to Trump-Card Kitty (burst). Raw Collei.js:321-327.
  { type: "constellation", constellation: 5, settings: { char_skill_burst_bonus: 3 } },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const collei: DbObjectChar = {
  name: "collei",
  gameId: 10000067,
  rarity: 4,
  element: "dendro",
  weapon: "bow",
  origin: "sumeru",
  statTable: ColleiStatTable,
  talents,
  features,
  multipliers: [],
  conditions: constellationConditions,
  // C4 "Gift of the Woods" — +60 Elemental Mastery to party.
  // Source: raw/genshin_calc_pub/src/js/db/Char/Collei.js:101,313-320
  partyData: {
    conditions: [
      {
        type: "static",
        stats: { mastery: 60 },
        condition: { type: "boolean", name: "party.collei_gift_of_the_woods" },
      },
    ],
  },
};
