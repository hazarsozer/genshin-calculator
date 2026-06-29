/**
 * Xinyan — physical/pyro claymore ATK scaler.
 *
 * 4-hit normal combo (physical), spin/final charged (physical), plunge,
 * pyro skill (swing + dot_dmg shield-flame), physical burst (burst_dmg),
 * pyro burst dot (dot_dmg).
 *
 * burst_dmg: physical (FeatureDamageBurstXinyan extends FeatureDamageBurst,
 * no element param → defaults to 'phys'). C2 bonus crit rate is off at C0.
 * dot_dmg in burst: pyro (explicit element: 'pyro' in raw).
 *
 * Normals/charged/plunge: physical by default (no element on feature).
 * razor.ts is the proven exemplar for this physical-claymore + elemental-skill pattern.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Xinyan.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Xinyan)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Xinyan)
 */

import type { Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Xinyan as XinyanStatTable } from "../generated/charTables.js";
import { Xinyan as XinyanTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return XinyanTalents.s1.p1;
      if (name === "normal_hit_2") return XinyanTalents.s1.p2;
      if (name === "normal_hit_3") return XinyanTalents.s1.p3;
      if (name === "normal_hit_4") return XinyanTalents.s1.p4;
      if (name === "charged_spin") return XinyanTalents.s1.p5;
      if (name === "charged_final") return XinyanTalents.s1.p6;
      if (name === "plunge") return XinyanTalents.s1.p9;
      if (name === "plunge_low") return XinyanTalents.s1.p10;
      if (name === "plunge_high") return XinyanTalents.s1.p11;
    }
    if (talent === "skill") {
      if (name === "swing_dmg")               return XinyanTalents.s2.p1;
      if (name === "shield_level_1_percent")  return XinyanTalents.s2.p2;
      if (name === "shield_level_1_flat")     return XinyanTalents.s2.p3;
      if (name === "shield_level_2_percent")  return XinyanTalents.s2.p4;
      if (name === "shield_level_2_flat")     return XinyanTalents.s2.p5;
      if (name === "shield_level_3_percent")  return XinyanTalents.s2.p6;
      if (name === "shield_level_3_flat")     return XinyanTalents.s2.p7;
      if (name === "dot_dmg")                 return XinyanTalents.s2.p8;
    }
    if (talent === "burst") {
      if (name === "burst_dmg") return XinyanTalents.s3.p1;
      if (name === "dot_dmg") return XinyanTalents.s3.p2;
    }
    throw new Error(`xinyan talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (physical, no element → defaults to physical) ---
  // raw/genshin_calc_pub/src/js/db/Char/Xinyan.js:152-183
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
  // --- Charged attacks (physical) ---
  // raw/genshin_calc_pub/src/js/db/Char/Xinyan.js:184-200
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
  // --- Plunge attacks (physical) ---
  // raw/genshin_calc_pub/src/js/db/Char/Xinyan.js:201-224
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
  // --- Skill: Sweeping Fervor ---
  // swing_dmg: pyro hit
  // raw/genshin_calc_pub/src/js/db/Char/Xinyan.js:225-233
  {
    name: "swing_dmg",
    category: "skill",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.swing_dmg") }],
  },
  // dot_dmg: pyro shield-flame DoT
  // raw/genshin_calc_pub/src/js/db/Char/Xinyan.js:234-242
  {
    name: "dot_dmg",
    category: "skill",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.dot_dmg") }],
  },
  // --- Shields (FeatureShield): skill.xinyan_shield_level_{1,2,3} ---
  // FeatureMultiplierList: (percent/100 × def_total) + flat, then × (1 + shield).
  // Source: raw/genshin_calc_pub/src/js/db/Char/Xinyan.js:243-275 (three FeatureShield defs)
  // xinyan_shield_level_1: s2.p2 (% DEF) + s2.p3 (flat)
  {
    name: "xinyan_shield_level_1",
    category: "skill",
    output: { kind: "shield" },
    multipliers: [
      { scaling: "def", leveling: "char_skill_elemental", values: talents.get("skill.shield_level_1_percent"), flatValues: talents.get("skill.shield_level_1_flat") },
    ],
  },
  // xinyan_shield_level_2: s2.p4 (% DEF) + s2.p5 (flat)
  {
    name: "xinyan_shield_level_2",
    category: "skill",
    output: { kind: "shield" },
    multipliers: [
      { scaling: "def", leveling: "char_skill_elemental", values: talents.get("skill.shield_level_2_percent"), flatValues: talents.get("skill.shield_level_2_flat") },
    ],
  },
  // xinyan_shield_level_3: s2.p6 (% DEF) + s2.p7 (flat)
  {
    name: "xinyan_shield_level_3",
    category: "skill",
    output: { kind: "shield" },
    multipliers: [
      { scaling: "def", leveling: "char_skill_elemental", values: talents.get("skill.shield_level_3_percent"), flatValues: talents.get("skill.shield_level_3_flat") },
    ],
  },
  // --- Burst: Riff Revolution ---
  // burst_dmg: PHYSICAL (FeatureDamageBurstXinyan has no element param → phys)
  // raw/genshin_calc_pub/src/js/db/Char/Xinyan.js:276-283
  // Must set element: "physical" explicitly to override charElement (pyro).
  // C2 "Impromptu Opening": ConditionStatic (always-on) crit_rate_xinyan +100% on burst_dmg.
  // raw/genshin_calc_pub/src/js/db/Char/Xinyan.js:343-350 (constellation[1]).
  // crit_rate_xinyan is a char-suffixed key → must be wired to critRateBonuses here.
  {
    name: "burst_dmg",
    category: "burst",
    element: "physical",
    critRateBonuses: ["crit_rate_xinyan"],
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") }],
  },
  // dot_dmg: pyro burst DoT (FeatureDamageBurst with element: 'pyro')
  // raw/genshin_calc_pub/src/js/db/Char/Xinyan.js:284-292
  {
    name: "dot_dmg",
    category: "burst",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.dot_dmg") }],
  },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Constellations (P2.C Wave-1)
// ---------------------------------------------------------------------------
// C1: ConditionBoolean toggle (atk_speed — display-only keys) → SKIP.
// C2 "Impromptu Opening" — ConditionStatic (always-on at C2+), crit_rate_xinyan +100%
//   on burst_dmg. Wired via critRateBonuses in the burst_dmg feature above.
//   raw/genshin_calc_pub/src/js/db/Char/Xinyan.js:341-351 (constellation[1]).
// C3 "Double-Stop" — +3 Elemental Skill talent levels.
//   raw/genshin_calc_pub/src/js/db/Char/Xinyan.js:352-360 (constellation[2]).
// C4 "Wildfire Rhythm" — SELF enemy Physical RES -15% (ConditionBoolean toggle). Ported
//   below as the SELF mirror of party.xinyan_wildfire_rhythm (was golden-blind SKIPPED).
//   raw/genshin_calc_pub/src/js/db/Char/Xinyan.js:362-373 (constellation[3]).
// C5 "Banned Music" — +3 Burst talent levels.
//   raw/genshin_calc_pub/src/js/db/Char/Xinyan.js:373-381 (constellation[4]).
// C6 "Rockin' in a Flaming World": a PostEffectStatsDef (ATK += 30% DEF, gated boolean
//   xinyan_rockin_in_a_flaming_world AND C6) — a DEF→ATK stat CONVERSION, not an additive
//   stat buff → out of this additive-self-buff sweep's scope; still SKIP (Tier-B).
//   raw/genshin_calc_pub/src/js/db/Char/Xinyan.js:294-302.

const constellationConditions: readonly Condition[] = [
  // SELF "Now That's Rock 'N' Roll!" (A4) — +15% Physical DMG, buffing every one of Xinyan's
  // OWN physical damage features. A4 ascension passive (ConditionBoolean toggle; rep always at
  // ascension 6 → modelled ungated, the toggle is the gate). The SELF mirror of
  // party.xinyan_now_thats_rock (the teammate version, below) — was golden-blind SKIPPED (no
  // golden sets the self toggle). Raw key `dmg_phys` (matches the partyData entry).
  // Source: raw/genshin_calc_pub/src/js/db/Char/Xinyan.js:312-324 (conditions[1], ConditionBoolean, info.ascension 4).
  { type: "boolean", name: "xinyan_now_thats_rock", stats: { dmg_phys: 15 } },
  // SELF "Wildfire Rhythm" (C4) — enemy Physical RES -15%, buffing every Xinyan physical hit
  // (and reaction.shatter). ConditionBoolean toggle gated at C4 (lives in constellation[3] →
  // THE CONSTELLATION IS A GATE). SELF mirror of party.xinyan_wildfire_rhythm. Raw key
  // `enemy_res_phys` → engine bag key `enemy_res_physical`.
  // Source: raw/genshin_calc_pub/src/js/db/Char/Xinyan.js:362-373 (constellation[3], ConditionBoolean).
  {
    type: "boolean",
    name: "xinyan_wildfire_rhythm",
    stats: { enemy_res_physical: -15 },
    condition: { type: "constellation", constellation: 4 },
  },
  // C2 — crit_rate_xinyan +100% (always-on ConditionStatic; wired to burst_dmg above).
  { type: "constellation", constellation: 2, stats: { crit_rate_xinyan: 100 } },
  // C3 — char_skill_elemental_bonus +3 (skill talent level up).
  { type: "constellation", constellation: 3, settings: { char_skill_elemental_bonus: 3 } },
  // C5 — char_skill_burst_bonus +3 (burst talent level up).
  { type: "constellation", constellation: 5, settings: { char_skill_burst_bonus: 3 } },
];

export const xinyan: DbObjectChar = {
  name: "xinyan",
  gameId: 10000044,
  rarity: 4,
  element: "pyro",
  weapon: "claymore",
  origin: "liyue",
  statTable: XinyanStatTable,
  talents,
  features,
  multipliers: [],
  conditions: constellationConditions,
  // A4 "Now That's Rock 'N' Roll!" — +15% Physical DMG.
  // C4 "Wildfire Rhythm" — enemy Physical RES -15%.
  // Source: raw/genshin_calc_pub/src/js/db/Char/Xinyan.js (partyData conditions)
  // Note: raw key `enemy_res_phys` → engine bag key `enemy_res_physical`.
  partyData: {
    conditions: [
      {
        type: "static",
        stats: { dmg_phys: 15 },
        condition: { type: "boolean", name: "party.xinyan_now_thats_rock" },
      },
      {
        type: "static",
        stats: { enemy_res_physical: -15 },
        condition: { type: "boolean", name: "party.xinyan_wildfire_rhythm" },
      },
    ],
  },
};
