/**
 * Gorou — geo bow DEF/ATK scaler.
 *
 * 4-hit normal combo (physical), aimed shot (physical charged), fully charged
 * geo arrow, plunge, geo skill (skill_dmg), geo burst (burst_dmg +
 * gorou_crystal_collapse_dmg both DEF-scaled).
 *
 * A4 "A Favor Repaid" (auto-active at A6 = ascension ≥ 4):
 *   - skill_dmg gains +156% of DEF as an additional base-damage term.
 *   - burst_dmg and gorou_crystal_collapse_dmg each gain +15.6% of DEF.
 * Modelled per-feature as extra `scaling:"def"` multipliers (same pattern as
 * Itto's A4 charged DEF term, Itto.js:124 / :320-330).
 *
 * dmg_geo_base at A6 = 24 (charTables.ts → buildStats folds as dmg_geo fraction).
 * gorou_def_bonus: static display row (damageType: ""), NOT a damage feature —
 * filtered by isDamageTripleEntry, so it is NOT modelled here.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Gorou.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Gorou)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Gorou)
 */

import type { DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Gorou as GorouStatTable } from "../generated/charTables.js";
import { Gorou as GorouTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return GorouTalents.s1.p1;
      if (name === "normal_hit_2") return GorouTalents.s1.p2;
      if (name === "normal_hit_3") return GorouTalents.s1.p3;
      if (name === "normal_hit_4") return GorouTalents.s1.p4;
      if (name === "aimed")        return GorouTalents.s1.p5;
      if (name === "charged_aimed") return GorouTalents.s1.p6;
      if (name === "plunge")       return GorouTalents.s1.p7;
      if (name === "plunge_low")   return GorouTalents.s1.p8;
      if (name === "plunge_high")  return GorouTalents.s1.p9;
    }
    if (talent === "skill") {
      if (name === "skill_dmg") return GorouTalents.s2.p1;
    }
    if (talent === "burst") {
      if (name === "burst_dmg")                   return GorouTalents.s3.p1;
      if (name === "gorou_crystal_collapse_dmg")  return GorouTalents.s3.p2;
    }
    throw new Error(`gorou talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// A4 "A Favor Repaid" — DEF base-damage additions (auto-active at A6)
//
// skill_dmg: +156% of DEF  — Gorou.js TalentValues.A4SkillDefScale = 156
// burst_dmg / crystal_collapse: +15.6% of DEF — TalentValues.A4BurstDefScale = 15.6
//
// Modelled as extra multiplier entries with scaling:"def" (mirrors how Itto's A4
// charged-DEF term is inlined per-feature, raw/genshin_calc_pub/.../Itto.js:124).
// ---------------------------------------------------------------------------

const A4_SKILL_DEF = 156; // raw/genshin_calc_pub/src/js/db/Char/Gorou.js TalentValues.A4SkillDefScale
const A4_BURST_DEF = 15.6; // raw/genshin_calc_pub/src/js/db/Char/Gorou.js TalentValues.A4BurstDefScale

const a4SkillDefTerm = {
  leveling: "",
  scaling: "def",
  values: { getValue: () => A4_SKILL_DEF },
} as const;

const a4BurstDefTerm = {
  leveling: "",
  scaling: "def",
  values: { getValue: () => A4_BURST_DEF },
} as const;

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (physical) ---
  // raw/genshin_calc_pub/src/js/db/Char/Gorou.js:148-191
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
  // aimed: physical (FeatureDamageChargedAimed without element → physical)
  // raw/genshin_calc_pub/src/js/db/Char/Gorou.js:192-209
  {
    name: "aimed",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.aimed") }],
  },
  // charged_aimed: fully charged geo arrow (explicit element: "geo")
  // raw/genshin_calc_pub/src/js/db/Char/Gorou.js:210-220
  {
    name: "charged_aimed",
    category: "attack",
    damageType: "charged",
    element: "geo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_aimed") }],
  },
  // --- Plunge attacks (physical) ---
  // raw/genshin_calc_pub/src/js/db/Char/Gorou.js:221-248
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
  // --- Skill: Inuzaka All-Round Defense ---
  // skill_dmg: geo ATK-scaled hit + A4 DEF addition (156% DEF, auto-active A6)
  // raw/genshin_calc_pub/src/js/db/Char/Gorou.js:262-271 (FeatureDamageSkill, element: 'geo')
  // TalentValues.A4SkillDefScale = 156 → multipliers[1]: scaling:'def*', A4 cond active at A6
  {
    name: "skill_dmg",
    category: "skill",
    element: "geo",
    multipliers: [
      { leveling: "char_skill_elemental", values: talents.get("skill.skill_dmg") },
      a4SkillDefTerm,
    ],
  },
  // --- Burst: For unto Victory ---
  // burst_dmg: geo DEF-scaled + A4 DEF addition (15.6% DEF)
  // raw/genshin_calc_pub/src/js/db/Char/Gorou.js (FeatureDamageBurst, scaling:'def*')
  // TalentValues.A4BurstDefScale = 15.6 → auto-active at A6
  {
    name: "burst_dmg",
    category: "burst",
    element: "geo",
    multipliers: [
      { leveling: "char_skill_burst", scaling: "def", values: talents.get("burst.burst_dmg") },
      a4BurstDefTerm,
    ],
  },
  // gorou_crystal_collapse_dmg: geo DEF-scaled + A4 DEF addition (15.6% DEF)
  // raw/genshin_calc_pub/src/js/db/Char/Gorou.js (FeatureDamageBurst, scaling:'def*')
  {
    name: "gorou_crystal_collapse_dmg",
    category: "burst",
    element: "geo",
    multipliers: [
      { leveling: "char_skill_burst", scaling: "def", values: talents.get("burst.gorou_crystal_collapse_dmg") },
      a4BurstDefTerm,
    ],
  },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const gorou: DbObjectChar = {
  name: "gorou",
  gameId: 10000055,
  rarity: 4,
  element: "geo",
  weapon: "bow",
  origin: "inazuma",
  statTable: GorouStatTable,
  talents,
  features,
  multipliers: [],
};
