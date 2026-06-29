/**
 * Amber — pyro bow ATK scaler.
 *
 * 5-hit normal combo, physical aimed shot, pyro fully charged aimed shot,
 * plunge, pyro skill (Baron Bunny explosion), pyro burst (Fiery Rain).
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Amber.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Amber)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Amber)
 */

import type { Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Amber as AmberStatTable } from "../generated/charTables.js";
import { Amber as AmberTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return AmberTalents.s1.p1;
      if (name === "normal_hit_2") return AmberTalents.s1.p2;
      if (name === "normal_hit_3") return AmberTalents.s1.p3;
      if (name === "normal_hit_4") return AmberTalents.s1.p4;
      if (name === "normal_hit_5") return AmberTalents.s1.p5;
      if (name === "aimed") return AmberTalents.s1.p6;
      if (name === "charged_aimed") return AmberTalents.s1.p7;
      if (name === "plunge") return AmberTalents.s1.p8;
      if (name === "plunge_low") return AmberTalents.s1.p9;
      if (name === "plunge_high") return AmberTalents.s1.p10;
    }
    if (talent === "skill") {
      if (name === "explosion_dmg") return AmberTalents.s2.p2;
      if (name === "amber_baron_hp") return AmberTalents.s2.p1;
    }
    if (talent === "burst") {
      if (name === "wave_dmg") return AmberTalents.s3.p1;
    }
    throw new Error(`amber talents: unknown path '${path}'`);
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
  // --- Charged attacks (bow aimed shots) ---
  // aimed: physical charged shot (FeatureDamageChargedAimed → damageType="charged")
  {
    name: "aimed",
    isAimed: true,
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.aimed") }],
  },
  // charged_aimed: fully charged pyro arrow
  {
    name: "charged_aimed",
    isAimed: true,
    category: "attack",
    damageType: "charged",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_aimed") }],
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
  // --- C1 "One Arrow to Rule Them All": a SECOND arrow per aimed shot, dealing 20%
  // of the first. Cons-added features gated by ConditionConstellation(1); the 20% is a
  // numeric scalingMultiplier on the same aimed/charged-aimed talent. Raw Amber.js:180-214.
  {
    name: "second_aimed",
    isAimed: true,
    category: "attack",
    damageType: "charged",
    condition: { type: "constellation", constellation: 1 },
    multipliers: [
      {
        leveling: "char_skill_attack",
        values: talents.get("attack.aimed"),
        scalingMultiplier: 0.2,
        source: "constellation1",
      },
    ],
  },
  {
    name: "second_charged_aimed",
    isAimed: true,
    category: "attack",
    damageType: "charged",
    element: "pyro",
    condition: { type: "constellation", constellation: 1 },
    multipliers: [
      {
        leveling: "char_skill_attack",
        values: talents.get("attack.charged_aimed"),
        scalingMultiplier: 0.2,
        source: "constellation1",
      },
    ],
  },
  // --- Skill: Explosive Puppet — Baron Bunny explosion (pyro) ---
  {
    name: "explosion_dmg",
    category: "skill",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.explosion_dmg") }],
  },
  // --- C2 "Bunny Triggered": manual Baron Bunny detonation deals +200% skill DMG
  // (dmg_skill_amber, from the C2 condition). Cons-added feature gated at C≥2.
  // Raw Amber.js:252-263 + cons[1] dmg_skill_amber:200 (Amber.js:328-338).
  {
    name: "amber_explosion_dmg",
    category: "skill",
    element: "pyro",
    damageBonuses: ["dmg_skill_amber"],
    condition: { type: "constellation", constellation: 2 },
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.explosion_dmg") }],
  },
  // --- Burst: Fiery Rain (pyro) ---
  // A1 "Every Arrow Finds Its Target" gives +10% crit rate to the burst; it is
  // auto-active at A6 (ConditionStatic gated only by ConditionAscensionChar, no
  // toggle), so it folds in via critRateBonuses + the char's baseStats.
  {
    name: "wave_dmg",
    category: "burst",
    element: "pyro",
    critRateBonuses: ["crit_rate_amber"],
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.wave_dmg") }],
  },
  // --- Skill static readout: skill.amber_baron_hp = Baron Bunny HP (talent% of Max HP) ---
  // FeatureStatic + plain FeatureMultiplier(scaling:'hp*'), char_skill_elemental, format="".
  // raw/genshin_calc_pub/src/js/db/Char/Amber.js:264-275
  {
    name: "amber_baron_hp",
    category: "skill",
    output: { kind: "static" },
    multipliers: [
      { scaling: "hp", leveling: "char_skill_elemental", values: talents.get("skill.amber_baron_hp") },
    ],
  },
];

// ---------------------------------------------------------------------------
// Constellation conditions (P2.C)
// ---------------------------------------------------------------------------
// C2 contributes the dmg_skill_amber stat consumed by amber_explosion_dmg; C3/C5
// bump the burst/skill talent levels (+3). C1 is the second-arrow features above;
// C4 (CD) + C6 (atk toggle) are inert in the constellations config (toggle off).
// Raw: db/Char/Amber.js constellation array (Amber.js:315-382).
const constellationConditions: readonly Condition[] = [
  // C2 "Bunny Triggered": +200% skill DMG on the manual detonation (amber_explosion_dmg).
  { type: "constellation", constellation: 2, stats: { dmg_skill_amber: 200 } },
  // C3: +3 levels to Fiery Rain (burst). Raw cons[2] settings char_skill_burst_bonus:3.
  { type: "constellation", constellation: 3, settings: { char_skill_burst_bonus: 3 } },
  // C5: +3 levels to Explosive Puppet (skill). Raw cons[4] settings char_skill_elemental_bonus:3.
  { type: "constellation", constellation: 5, settings: { char_skill_elemental_bonus: 3 } },
  // SELF "Precise Shot" (A4) — +15% ATK (A4AtkBonus=15) while a weak-spot is hit, lifting every Amber
  // damage feature. ConditionBoolean ascension passive (rep at A6 → modelled ungated, the toggle is the
  // gate). Self-only (no party.* mirror); the port SKIPPED it → golden-blind SKIP (no golden toggles it).
  // Source: raw/genshin_calc_pub/src/js/db/Char/Amber.js:301-313 (conditions[1], ConditionBoolean, info.ascension 4).
  { type: "boolean", name: "amber_precise_shot", stats: { atk_percent: 15 } },
  // SELF "Wildfire" (C6) — +15% ATK (C6AtkBonus=15; move_speed is display-only), lifting every Amber
  // damage feature. ConditionBoolean gated at C6 (lives in constellation[5] → THE CONSTELLATION IS A
  // GATE). SELF mirror of party.amber_wildfire; the port modelled only the party.* version → golden-blind SKIP.
  // Source: raw/genshin_calc_pub/src/js/db/Char/Amber.js:368-381 (constellation[5], ConditionBoolean).
  {
    type: "boolean",
    name: "amber_wildfire",
    stats: { atk_percent: 15 },
    condition: { type: "constellation", constellation: 6 },
  },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const amber: DbObjectChar = {
  name: "amber",
  gameId: 10000021,
  rarity: 4,
  element: "pyro",
  weapon: "bow",
  origin: "mondstadt",
  statTable: AmberStatTable,
  talents,
  features,
  multipliers: [],
  conditions: constellationConditions,
  // A1 "Every Arrow Finds Its Target": +10% crit rate to Fiery Rain (burst).
  // Auto-active at A6 (ConditionStatic gated only by ConditionAscensionChar),
  // so it is part of the baseline build. Raw: db/Char/Amber.js:289-300.
  baseStats: { crit_rate_amber: 10 },
  // C6 "Wildfire" — +15% ATK and +15% Movement SPD to party (move_speed is display-only).
  // Source: raw/genshin_calc_pub/src/js/db/Char/Amber.js (partyData conditions)
  partyData: {
    conditions: [
      {
        type: "static",
        stats: { atk_percent: 15 },
        condition: { type: "boolean", name: "party.amber_wildfire" },
      },
    ],
  },
};
