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

import type { Condition, DbObjectChar, Feature, TalentResolver, TalentTable } from "@genshin/types";
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
      if (name === "razor_companion_dmg") return RazorTalents.s3.p2;
    }
    throw new Error(`razor talents: unknown path '${path}'`);
  },
};

// Base normal% fractions (÷100) per talent level, the TABLE factor for the wolf-form
// burst normals below. Derived from the char_skill_attack talent tables (15 levels).
// Razor has NO char_skill_attack_bonus at any constellation, so the (bonus-blind)
// scalingMultiplierFromTable read of char_skill_attack is exact; the bonus-bearing factor
// (razor_companion_dmg @ char_skill_burst, +3 at C3) is the `values`/`leveling` path,
// which DOES apply the talent _bonus — see the razor_normal_hit features.
const frac = (t: TalentTable): readonly number[] =>
  Array.from({ length: 15 }, (_unused, i) => t.getValue(i + 1) / 100);
const NORMAL_HIT_FRACTIONS: readonly (readonly number[])[] = [
  frac(talents.get("attack.normal_hit_1")),
  frac(talents.get("attack.normal_hit_2")),
  frac(talents.get("attack.normal_hit_3")),
  frac(talents.get("attack.normal_hit_4")),
];

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
  // --- Wolf-form burst normals (razor_wolf_within stance) ---
  // raw: 4 FeatureDamageBurst({category:'attack', element:'electro'}) gated by
  // ConditionBoolean(razor_wolf_within), each a FeatureMultiplierRazorBurst whose
  // getTreeBonusMultiplier multiplies the base normal by razor_companion_dmg (the burst
  // "Sigil of Whispers" companion %, s3.p2) at the BURST talent level:
  //   term = normal_hit_N(char_skill_attack)/100 × ATK × razor_companion_dmg(char_skill_burst)/100
  // (Razor.js:182-233, RazorBurst.js). damageType is 'burst' (FeatureDamageBurst forces it) so
  // the hits pick up dmg_burst keys even though category is 'attack'. Feature-gated on
  // razor_wolf_within (a C0 ConditionBoolean, OFF in every base build → base-inert).
  // Ported via scalingMultiplierFromTable: the base normal% is the table (÷100) keyed by
  // char_skill_attack; the razor_companion_dmg burst% is the leveled talent value.
  ...([1, 2, 3, 4] as const).map(
    (n): Feature => ({
      name: `razor_normal_hit_${n}`,
      category: "attack",
      damageType: "burst",
      element: "electro",
      condition: { type: "boolean", name: "razor_wolf_within" },
      multipliers: [
        {
          leveling: "char_skill_burst",
          values: talents.get("burst.razor_companion_dmg"),
          scalingMultiplierFromTable: {
            table: NORMAL_HIT_FRACTIONS[n - 1]!,
            levelSetting: "char_skill_attack",
          },
        },
      ],
    })
  ),
  // --- Charged attacks ---
  // raw: gated by ConditionNot([razor_wolf_within]) — the wolf-form (burst stance)
  // REPLACES the charged combo with burst-electro normals, so charged is suppressed
  // while the wolf is out (Razor.js:242-256). Inert at wolf_within OFF (all goldens).
  {
    name: "charged_spin",
    category: "attack",
    damageType: "charged",
    condition: { type: "not", items: [{ type: "boolean", name: "razor_wolf_within" }] },
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_spin") }],
  },
  {
    name: "charged_final",
    category: "attack",
    damageType: "charged",
    condition: { type: "not", items: [{ type: "boolean", name: "razor_wolf_within" }] },
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
