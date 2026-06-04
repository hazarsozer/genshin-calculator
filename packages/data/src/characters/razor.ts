/**
 * Razor — electro claymore ATK scaler.
 *
 * 4-hit normal combo, spin/final charged, plunge, electro press/hold skill,
 * electro burst. Burst-state normals (FeatureMultiplierRazorBurst) are C0
 * conditioned — not in fixture damage keys, skipped. No post-effects at C0.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Razor.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Razor)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Razor)
 */

import type { Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Razor as RazorStatTable } from "../generated/charTables.js";
import { Razor as RazorTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return RazorTalents.s1.p1;
      if (name === "normal_hit_2") return RazorTalents.s1.p2;
      if (name === "normal_hit_3") return RazorTalents.s1.p3;
      if (name === "normal_hit_4") return RazorTalents.s1.p4;
      if (name === "charged_spin") return RazorTalents.s1.p5;
      if (name === "charged_final") return RazorTalents.s1.p6;
      if (name === "plunge") return RazorTalents.s1.p9;
      if (name === "plunge_low") return RazorTalents.s1.p10;
      if (name === "plunge_high") return RazorTalents.s1.p11;
    }
    if (talent === "skill") {
      if (name === "press_dmg") return RazorTalents.s2.p1;
      if (name === "hold_dmg") return RazorTalents.s2.p2;
    }
    if (talent === "burst") {
      if (name === "burst_dmg") return RazorTalents.s3.p1;
    }
    throw new Error(`razor talents: unknown path '${path}'`);
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
  // --- Skill: Claw and Thunder (electro) ---
  {
    name: "press_dmg",
    category: "skill",
    element: "electro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.press_dmg") }],
  },
  {
    name: "hold_dmg",
    category: "skill",
    element: "electro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.hold_dmg") }],
  },
  // --- Burst: Lightning Fang (electro) ---
  {
    name: "burst_dmg",
    category: "burst",
    element: "electro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") }],
  },
  // --- C6 "Lupus Fulguris": cons-added electro "other" hit (100% ATK, fixed).
  // Raw FeatureDamage (base class → damageType:""), category:'other', element:'electro',
  // values: new ValueTable([100]) → fixed 100% ATK; leveling key used as source label only.
  // condition: ConditionConstellation(6). Raw Razor.js:315-326.
  {
    name: "razor_lupus_fulguris",
    element: "electro",
    damageType: "",
    condition: { type: "constellation", constellation: 6 },
    multipliers: [
      {
        leveling: "char_skill_attack",
        values: { getValue: (_level: number) => 100 },
        source: "constellation6",
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Constellation conditions (P2.C)
// ---------------------------------------------------------------------------
// C1 "Wolf's Instinct": ConditionBoolean toggle (dmg_all:10) → SKIP.
// C2 "Suppression": ConditionBoolean toggle (crit_rate_enemy:10) → SKIP.
// C3: +3 levels to Lightning Fang (burst). Raw conditions array
//   ConditionConstellation({constellation:3, settings:{char_skill_burst_bonus:3}}). Raw Razor.js:329-333.
// C4 "Bite": ConditionBoolean toggle (enemy_def_reduce:15) → SKIP.
// C5: +3 levels to Claw and Thunder (skill). Raw Razor.js:334-338.
// C6 "Lupus Fulguris": ConditionStatic (display text_percent_dmg:100) → damage handled by
//   the razor_lupus_fulguris cons-added feature above (ConditionConstellation gate on feature).
const constellationConditions: readonly Condition[] = [
  // C3: +3 levels to Lightning Fang (burst).
  { type: "constellation", constellation: 3, settings: { char_skill_burst_bonus: 3 } },
  // C5: +3 levels to Claw and Thunder (elemental skill).
  { type: "constellation", constellation: 5, settings: { char_skill_elemental_bonus: 3 } },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const razor: DbObjectChar = {
  name: "razor",
  gameId: 10000020,
  rarity: 4,
  element: "electro",
  weapon: "claymore",
  origin: "mondstadt",
  statTable: RazorStatTable,
  talents,
  features,
  multipliers: [],
  conditions: constellationConditions,
  // C4 "Bite" — enemy DEF -15%.
  // Source: raw/genshin_calc_pub/src/js/db/Char/Razor.js (partyData conditions)
  partyData: {
    conditions: [
      {
        type: "static",
        stats: { enemy_def_reduce: 15 },
        condition: { type: "boolean", name: "party.razor_bite" },
      },
    ],
  },
};
