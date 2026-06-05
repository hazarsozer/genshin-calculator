/**
 * Barbara — hydro catalyst ATK scaler.
 *
 * 4-hit normal combo (hydro catalyst, always hydro), hydro charged hit,
 * hydro plunge/low/high, hydro skill (barbara_droplet_dmg).
 * Heal features (skill.heal_normal_atk, skill.heal_charged_atk, skill.heal_dot,
 * burst.heal) have empty damageType and are display-only — skipped by the harness.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Barbara.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Barbara)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Barbara)
 */

import type { Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Barbara as BarbaraStatTable } from "../generated/charTables.js";
import { Barbara as BarbaraTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return BarbaraTalents.s1.p1;
      if (name === "normal_hit_2") return BarbaraTalents.s1.p2;
      if (name === "normal_hit_3") return BarbaraTalents.s1.p3;
      if (name === "normal_hit_4") return BarbaraTalents.s1.p4;
      if (name === "charged_hit")  return BarbaraTalents.s1.p5;
      if (name === "plunge")       return BarbaraTalents.s1.p7;
      if (name === "plunge_low")   return BarbaraTalents.s1.p8;
      if (name === "plunge_high")  return BarbaraTalents.s1.p9;
    }
    if (talent === "skill") {
      if (name === "barbara_droplet_dmg") return BarbaraTalents.s2.p5;
    }
    throw new Error(`barbara talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (hydro catalyst, always hydro) ---
  // raw/genshin_calc_pub/src/js/db/Char/Barbara.js
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
  {
    name: "normal_hit_4",
    category: "attack",
    element: "hydro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4") }],
  },
  // --- Charged attack (hydro) ---
  {
    name: "charged_hit",
    category: "attack",
    damageType: "charged",
    element: "hydro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }],
  },
  // --- Plunge attacks (hydro catalyst) ---
  {
    name: "plunge",
    category: "attack",
    damageType: "plunge",
    element: "hydro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge") }],
  },
  {
    name: "plunge_low",
    tags: ["plunge_shockwave"],
    category: "attack",
    damageType: "plunge",
    element: "hydro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_low") }],
  },
  {
    name: "plunge_high",
    tags: ["plunge_shockwave"],
    category: "attack",
    damageType: "plunge",
    element: "hydro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_high") }],
  },
  // --- Skill: Let the Show Begin (hydro) ---
  // barbara_droplet_dmg: Melody Loop droplet damage
  // raw/genshin_calc_pub/src/js/db/Char/Barbara.js — FeatureDamageSkill barbara_droplet_dmg
  {
    name: "barbara_droplet_dmg",
    category: "skill",
    element: "hydro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.barbara_droplet_dmg") }],
  },
];

// ---------------------------------------------------------------------------
// Constellation conditions (P2.C)
// ---------------------------------------------------------------------------
// NOTE: Barbara's C3 bumps the BURST talent and C5 bumps the ELEMENTAL SKILL —
// the reverse of most characters. Raw cons[2]=burst_bonus, cons[4]=elemental_bonus.
//
// C1 "Gleeful Songs": ConditionStatic no stats → display-only, SKIP.
// C2 "Vitality Burst": ConditionBoolean dmg_hydro toggle → SKIP.
// C4 "Attentiveness Be My Power": ConditionStatic no stats → display-only, SKIP.
// C6 "Dedicating Everything to You": ConditionStatic no stats → display-only, SKIP.
//
// Source: raw/genshin_calc_pub/src/js/db/Char/Barbara.js:297-354

const constellationConditions: readonly Condition[] = [
  // C3 "Banshin's Instant Recharge": +3 levels to Shining Miracle (Elemental Burst).
  // Raw cons[2]: Condition{ settings:{ char_skill_burst_bonus: 3 } }.
  { type: "constellation", constellation: 3, settings: { char_skill_burst_bonus: 3 } },
  // C5 "Ethereal Dance": +3 levels to Let the Show Begin (Elemental Skill).
  // Raw cons[4]: Condition{ settings:{ char_skill_elemental_bonus: 3 } }.
  { type: "constellation", constellation: 5, settings: { char_skill_elemental_bonus: 3 } },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const barbara: DbObjectChar = {
  name: "barbara",
  gameId: 10000014,
  rarity: 4,
  element: "hydro",
  weapon: "catalyst",
  origin: "mondstadt",
  statTable: BarbaraStatTable,
  talents,
  features,
  multipliers: [],
  conditions: constellationConditions,
  // partyData — teammate kit buffs (P3.5.2 Bucket A)
  // A1 "Glorious Season": stamina_consume:12 is display-only (no damage stat), skipped.
  // C2 "Vitality Burst": ConditionBoolean(party.barbara_vitality_burst) → dmg_hydro:15.
  //   crit_dmg is omitted here as there's no `crit_dmg_hydro` key; the raw also has
  //   text_percent_cd:15 (display-only).
  //   TalentValues.C2HydroBonus=15 — Source: raw/genshin_calc_pub/src/js/db/Char/Barbara.js
  partyData: {
    conditions: [
      // C2 "Vitality Burst" — hydro DMG% buff to party.
      {
        type: "boolean",
        name: "party.barbara_vitality_burst",
        stats: { dmg_hydro: 15 },
      },
    ],
  },
};
