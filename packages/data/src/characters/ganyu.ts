/**
 * Ganyu — cryo bow ATK scaler.
 *
 * 6-hit normal combo, physical aimed shot, cryo fully-charged aimed shot, the
 * two Frostflake Arrow parts (arrow + bloom — both cryo, both +20% crit via A1),
 * plunge, cryo skill (Ice Lotus DMG), cryo burst (Celestial Shower).
 *
 * NOT folded (user-toggleable buffs, OFF in the fixed canonical build — verified
 * against the oracle: folding them inflates every cryo hit ~+20%):
 *   - A1 "Undivided Heart": +20% crit rate to the two Frostflake hits. A
 *     ConditionBoolean (serializeId 1, default OFF), NOT a ConditionStatic — the
 *     ConditionAscensionChar(1) subcondition only gates the toggle's availability,
 *     not auto-activation. Raw: Ganyu.js:290-302. (Contrast Amber's A1, which IS a
 *     ConditionStatic and therefore folds.)
 *   - A4 "Harmony Between Heaven and Earth": +20% Cryo DMG. Also a ConditionBoolean
 *     toggle (serializeId 2, default OFF), gated by ConditionAscensionChar(4).
 *     Raw: Ganyu.js:303-315.
 * Both omitted → no baseStats, no critRateBonuses on the Frostflake hits.
 *
 * Non-damage output:
 *   - skill.ganyu_lotus_hp — Ice Lotus HP (talent% of Max HP), modelled as
 *     output:{kind:"static"} (PostEffectStatsHP, P3.5.3).
 * Display-only / non-modelled (skipped, matching the harness):
 *   - reaction.{superconduct,electrocharged,shatter} — auto-emitted for every cryo
 *     character by compileCharacter's transformativeReactionFeatures(element).
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Ganyu.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Ganyu)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Ganyu)
 */

import type { Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Ganyu as GanyuStatTable } from "../generated/charTables.js";
import { Ganyu as GanyuTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return GanyuTalents.s1.p1;
      if (name === "normal_hit_2") return GanyuTalents.s1.p2;
      if (name === "normal_hit_3") return GanyuTalents.s1.p3;
      if (name === "normal_hit_4") return GanyuTalents.s1.p4;
      if (name === "normal_hit_5") return GanyuTalents.s1.p5;
      if (name === "normal_hit_6") return GanyuTalents.s1.p6;
      if (name === "aimed") return GanyuTalents.s1.p7;
      if (name === "charged_aimed") return GanyuTalents.s1.p8;
      if (name === "ganyu_frostflake") return GanyuTalents.s1.p9;
      if (name === "ganyu_frostflake_bloom") return GanyuTalents.s1.p10;
      if (name === "plunge") return GanyuTalents.s1.p11;
      if (name === "plunge_low") return GanyuTalents.s1.p12;
      if (name === "plunge_high") return GanyuTalents.s1.p13;
    }
    if (talent === "skill") {
      if (name === "skill_dmg") return GanyuTalents.s2.p2;
      if (name === "ganyu_lotus_hp") return GanyuTalents.s2.p1;
    }
    if (talent === "burst") {
      if (name === "burst_dmg") return GanyuTalents.s3.p1;
    }
    throw new Error(`ganyu talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (6-hit combo) ---
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
  {
    name: "normal_hit_6",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_6") }],
  },
  // --- Charged attacks (bow aimed shots) ---
  // aimed: physical charged shot (FeatureDamageChargedAimed → damageType="charged")
  {
    name: "aimed",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.aimed") }],
  },
  // charged_aimed: fully-charged cryo arrow
  {
    name: "charged_aimed",
    category: "attack",
    damageType: "charged",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_aimed") }],
  },
  // ganyu_frostflake: Frostflake Arrow itself (cryo). A1 crit bonus is a toggle, OFF here.
  {
    name: "ganyu_frostflake",
    category: "attack",
    damageType: "charged",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.ganyu_frostflake") }],
  },
  // ganyu_frostflake_bloom: Frostflake Arrow bloom (FeatureDamageCharged → damageType="charged"; cryo). A1 crit OFF here.
  {
    name: "ganyu_frostflake_bloom",
    category: "attack",
    damageType: "charged",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.ganyu_frostflake_bloom") }],
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
  // --- Skill: Trail of the Qilin — Ice Lotus DMG (cryo) ---
  {
    name: "skill_dmg",
    category: "skill",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.skill_dmg") }],
  },
  // --- Skill static readout: skill.ganyu_lotus_hp = Ice Lotus HP (talent% of Max HP) ---
  // FeaturePostEffectValue(PostEffectStatsHP, percent=talent×0.01), char_skill_elemental, format="" (no ×100).
  // raw/genshin_calc_pub/src/js/db/Char/Ganyu.js:266-277
  {
    name: "ganyu_lotus_hp",
    category: "skill",
    output: { kind: "static" },
    multipliers: [
      { scaling: "hp", leveling: "char_skill_elemental", values: talents.get("skill.ganyu_lotus_hp") },
    ],
  },
  // --- Burst: Celestial Shower (cryo) ---
  {
    name: "burst_dmg",
    category: "burst",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") }],
  },
];

// ---------------------------------------------------------------------------
// Constellation conditions (P2.C)
// ---------------------------------------------------------------------------
// C1 "Dew Drinker": ConditionBoolean toggle — OFF in constellations config. Skip.
// C2 "The Auspicious": ConditionStatic, no stats/settings, display only. Skip.
// C3 "Preserved for the Hunt": +3 levels to Celestial Shower (burst).
//    Raw cons[2]: new Condition({ settings: { char_skill_burst_bonus: 3 } })
//    Burst features compile at talent level 10+3=13 from C3.
// C4 "Westward Sojourn": ConditionStacks (toggle, default 0 stacks) — OFF. Skip.
// C5 "The Merciful": +3 levels to Trail of the Qilin (skill).
//    Raw cons[4]: new Condition({ settings: { char_skill_elemental_bonus: 3 } })
//    Skill features compile at talent level 10+3=13 from C5.
// C6 "The Clement": ConditionStatic, no stats/settings, display only. Skip.
// Sources: raw/genshin_calc_pub/src/js/db/Char/Ganyu.js:317-380
const constellationConditions: readonly Condition[] = [
  // C3: +3 levels to Celestial Shower (elemental burst).
  { type: "constellation", constellation: 3, settings: { char_skill_burst_bonus: 3 } },
  // C5: +3 levels to Trail of the Qilin (elemental skill).
  { type: "constellation", constellation: 5, settings: { char_skill_elemental_bonus: 3 } },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const ganyu: DbObjectChar = {
  name: "ganyu",
  gameId: 10000037,
  rarity: 5,
  element: "cryo",
  weapon: "bow",
  origin: "liyue",
  statTable: GanyuStatTable,
  talents,
  features,
  multipliers: [],
  conditions: constellationConditions,
  // No baseStats: Ganyu's A1 (+20% Frostflake crit) and A4 (+20% Cryo DMG) are both
  // ConditionBoolean toggles (default OFF), not auto-active passives — OFF in the fixed
  // canonical build (oracle-verified). Raw: db/Char/Ganyu.js:290-315.
  // A4 "Harmony Between Heaven and Earth" — +20% Cryo DMG.
  // C1 "Dew-Drinker" — enemy Cryo RES -15%.
  // C4 "Westward Sojourn" — +5% DMG (stacks up to ×5 = +25% dmg_all).
  // Source: raw/genshin_calc_pub/src/js/db/Char/Ganyu.js (partyData conditions)
  partyData: {
    conditions: [
      {
        type: "static",
        stats: { dmg_cryo: 20 },
        condition: { type: "boolean", name: "party.ganyu_harmony" },
      },
      {
        type: "static",
        stats: { enemy_res_cryo: -15 },
        condition: { type: "boolean", name: "party.ganyu_dew_drinker" },
      },
      {
        type: "stacks",
        name: "party.ganyu_westward_sojourn",
        maxStacks: 5,
        stats: { dmg_all: 5 },
      },
    ],
  },
};
