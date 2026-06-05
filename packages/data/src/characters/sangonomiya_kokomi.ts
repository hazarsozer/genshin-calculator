/**
 * Sangonomiya Kokomi — hydro catalyst HP scaler.
 *
 * 3-hit normal combo (hydro catalyst). Charged hit (hydro). Plunge/low/high (hydro).
 *
 * Skill:
 *   kokomi_ripple_dmg — hydro skill (ATK-scaled, char_skill_elemental, s2.p3)
 *   heal_dot — skill heal (damageType:"", skipped by harness)
 *
 * Burst:
 *   burst_dmg — hydro burst (HP-scaled, scaling:'hp*', s3.p1)
 *   kokomi_burst_heal — burst heal (damageType:"", skipped by harness)
 *
 * Passive "Flawless Strategy" (ConditionStatic, ALWAYS active):
 *   healing: 25, crit_rate: -100
 *   → fold into baseStats. The -100 crit_rate causes crit_rate_total to be
 *     negative (clamped to 0), making average = normal for all damage features.
 *
 * A1/A4 passives (ConditionStatic display text only, or A4 healing bonus) —
 * healing bonus does not affect damage. Omit from baseStats.
 * "Ceremonial Garment" burst toggle (ConditionBoolean) — off in fixed build.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Kokomi.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Kokomi)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Kokomi)
 */

import type { Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Kokomi as KokomiStatTable } from "../generated/charTables.js";
import { Kokomi as KokomiTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return KokomiTalents.s1.p1;
      if (name === "normal_hit_2") return KokomiTalents.s1.p2;
      if (name === "normal_hit_3") return KokomiTalents.s1.p3;
      if (name === "charged_hit")  return KokomiTalents.s1.p4;
      if (name === "plunge")       return KokomiTalents.s1.p6;
      if (name === "plunge_low")   return KokomiTalents.s1.p7;
      if (name === "plunge_high")  return KokomiTalents.s1.p8;
    }
    if (talent === "skill") {
      if (name === "kokomi_ripple_dmg") return KokomiTalents.s2.p3;
    }
    if (talent === "burst") {
      if (name === "burst_dmg") return KokomiTalents.s3.p1;
    }
    throw new Error(`sangonomiya_kokomi talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (hydro catalyst) ---
  // raw: FeatureDamageNormal normal_hit_1/2/3 (element:'hydro', Kokomi.js)
  {
    name: "normal_hit_1",
    category: "attack",
    element: "hydro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1") }],
  },
  {
    name: "normal_hit_2",
    category: "attack",
    element: "hydro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2") }],
  },
  {
    name: "normal_hit_3",
    category: "attack",
    element: "hydro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }],
  },
  // --- Charged attack (hydro catalyst) ---
  // raw: FeatureDamageCharged charged_hit (element:'hydro')
  {
    name: "charged_hit",
    category: "attack",
    damageType: "charged",
    element: "hydro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }],
  },
  // --- Plunge attacks (hydro catalyst) ---
  // raw: FeatureDamagePlungeCollision plunge (element:'hydro')
  {
    name: "plunge",
    category: "attack",
    damageType: "plunge",
    element: "hydro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge") }],
  },
  // raw: FeatureDamagePlungeShockWave plunge_low (element:'hydro')
  {
    name: "plunge_low",
    tags: ["plunge_shockwave"],
    category: "attack",
    damageType: "plunge",
    element: "hydro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_low") }],
  },
  // raw: FeatureDamagePlungeShockWave plunge_high (element:'hydro')
  {
    name: "plunge_high",
    tags: ["plunge_shockwave"],
    category: "attack",
    damageType: "plunge",
    element: "hydro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_high") }],
  },
  // --- Skill: Kurage's Oath (hydro) ---
  // raw: FeatureDamageSkill kokomi_ripple_dmg (element:'hydro', ATK-scaled, s2.p3)
  {
    name: "kokomi_ripple_dmg",
    category: "skill",
    element: "hydro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.kokomi_ripple_dmg") }],
  },
  // heal_dot: FeatureHeal (category:'skill', damageType:"" → skipped by harness). Omit.
  // --- Burst: Nereid's Ascension (hydro, HP-scaled) ---
  // raw: FeatureDamageBurst burst_dmg (element:'hydro', scaling:'hp*', s3.p1)
  {
    name: "burst_dmg",
    category: "burst",
    element: "hydro",
    multipliers: [{ scaling: "hp", leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") }],
  },
  // kokomi_burst_heal: FeatureHeal (category:'burst', damageType:"" → skipped). Omit.
  // --- C1 "At Water's Edge": cons-added HP-scaling "other" hit (30% Max HP, fixed).
  // Raw FeatureDamage (base class → damageType:""), category:'other', element:'hydro',
  // scaling:'hp*', leveling:'char_skill_attack', values: ValueTable([30]) (C1AttackDmg=30).
  // condition: ConditionConstellation(1). Raw Kokomi.js:285-297.
  {
    name: "kokomi_swimming_fish_dmg",
    element: "hydro",
    damageType: "",
    condition: { type: "constellation", constellation: 1 },
    multipliers: [
      {
        scaling: "hp",
        leveling: "char_skill_attack",
        values: { getValue: (_level: number) => 30 },
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Constellation conditions (P2.C)
// ---------------------------------------------------------------------------
// C1 "At Water's Edge": ConditionStatic display-only (text_percent_dmg:30) in the cons array;
//   actual damage is the kokomi_swimming_fish_dmg feature above (gated by constellation:1).
// C2 "The Clouds Like Waves Rippling": ConditionBoolean toggle → SKIP (heal-only anyway).
// C3: +3 levels to Nereid's Ascension (burst). Raw cons[2] settings char_skill_burst_bonus:3.
//   Raw Kokomi.js:401-408.
// C4 "The Moon Overlooks the Waters": ConditionStatic with ConditionBooleanLevels gate
//   (burst toggle dependent) → SKIP.
// C5: +3 levels to Kurage's Oath (skill). Raw cons[4] settings char_skill_elemental_bonus:3.
//   Raw Kokomi.js:424-430.
// C6 "Sango Isshin": ConditionBoolean toggle nested in kokomi_ceremonial_garment
//   (burst toggle) → SKIP (double-toggle, toggle OFF).
const constellationConditions: readonly Condition[] = [
  // C3: +3 levels to Nereid's Ascension (burst).
  { type: "constellation", constellation: 3, settings: { char_skill_burst_bonus: 3 } },
  // C5: +3 levels to Kurage's Oath (elemental skill).
  { type: "constellation", constellation: 5, settings: { char_skill_elemental_bonus: 3 } },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const sangonomiyaKokomi: DbObjectChar = {
  name: "sangonomiya_kokomi",
  gameId: 10000054,
  rarity: 5,
  element: "hydro",
  weapon: "catalyst",
  origin: "inazuma",
  statTable: KokomiStatTable,
  talents,
  features,
  multipliers: [],
  conditions: constellationConditions,
  // "Flawless Strategy" (ConditionStatic, always active):
  //   crit_rate: -100 → crit_rate_total becomes negative, clamped to 0 by engine.
  //   healing: 25 — heal bonus, does not affect damage features.
  // Source: raw/genshin_calc_pub/src/js/db/Char/Kokomi.js TalentValues.PassiveCritRate
  baseStats: { crit_rate: -100 },
  // Source: raw/genshin_calc_pub/src/js/db/Char/Kokomi.js (partyData: empty conditions)
  partyData: {},
};
