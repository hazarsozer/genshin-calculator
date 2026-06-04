/**
 * Yelan — hydro bow HP scaler.
 *
 * 4-hit normal combo (physical bow). Normal hit 4 appears as a simple
 * feature in the raw (not a separate multihit parent/children).
 *
 * Charged attacks:
 *   aimed — physical aimed shot (FeatureDamageChargedAimed, no element)
 *   charged_aimed — hydro full-charge aimed shot
 *   yelan_breakthrough_barb_dmg — hydro, HP-scaled (scaling:'hp*')
 *
 * Plunge: plunge / plunge_low / plunge_high (physical bow).
 *
 * Skill: skill_dmg — hydro, HP-scaled (scaling:'hp*').
 *
 * Burst:
 *   burst_dmg — hydro, HP-scaled (scoring:'hp*')
 *   yelan_exquisite_throw_dmg — hydro, HP-scaled
 *
 * A1 "Turn Control": ConditionStaticLevel keyed on party_elements_count_level.
 * Raw: ConditionCalcElements (publisher) + ConditionStaticLevel hp_percent:[6,12,18,30]
 * (Yelan.js:270-287). party_elements_count_level is published by buildPartyContext.
 * Without party, party_elements_count_level is absent → level = 0||1 = 1 → hp_percent[0]=6
 * (matches previous baseStats:{hp_percent:6} behaviour; base golden unchanged).
 * A4 crit_rate ascension bonus IS folded in via charTables (asc6 = +19.2).
 *
 * C6 yelan_breakthrough_barb_c6_dmg (FeatureDamageCharged, ×1.56 scalingMultiplier).
 * C2 yelan_taking_all_comers_dmg (FeatureDamageBurst, fixed 14% HP).
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Yelan.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Yelan)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Yelan)
 */

import type { Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Yelan as YelanStatTable } from "../generated/charTables.js";
import { Yelan as YelanTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1")                return YelanTalents.s1.p1;
      if (name === "normal_hit_2")                return YelanTalents.s1.p2;
      if (name === "normal_hit_3")                return YelanTalents.s1.p3;
      if (name === "normal_hit_4")                return YelanTalents.s1.p4;
      if (name === "aimed")                       return YelanTalents.s1.p5;
      if (name === "charged_aimed")               return YelanTalents.s1.p6;
      if (name === "yelan_breakthrough_barb_dmg") return YelanTalents.s1.p7;
      if (name === "plunge")                      return YelanTalents.s1.p8;
      if (name === "plunge_low")                  return YelanTalents.s1.p9;
      if (name === "plunge_high")                 return YelanTalents.s1.p10;
    }
    if (talent === "skill") {
      if (name === "skill_dmg") return YelanTalents.s2.p1;
    }
    if (talent === "burst") {
      if (name === "burst_dmg")                   return YelanTalents.s3.p1;
      if (name === "yelan_exquisite_throw_dmg")   return YelanTalents.s3.p2;
    }
    throw new Error(`yelan talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (physical bow) ---
  // raw: FeatureDamageNormal (no explicit name — engine infers from talent key)
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
  // normal_hit_4: single FeatureDamageNormal in raw (the talent type:'multihit' hits:3
  // is a talent-display hint only; the feature itself is one damage instance).
  {
    name: "normal_hit_4",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4") }],
  },
  // --- Charged attacks (bow: aimed / full-charge / breakthrough barb) ---
  // raw: FeatureDamageChargedAimed aimed (physical, no element)
  {
    name: "aimed",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.aimed") }],
  },
  // raw: FeatureDamageChargedAimed charged_aimed (hydro full-charge)
  {
    name: "charged_aimed",
    category: "attack",
    damageType: "charged",
    element: "hydro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_aimed") }],
  },
  // raw: FeatureDamageChargedAimed yelan_breakthrough_barb_dmg (hydro, HP-scaled)
  // Yelan.js: scaling:'hp*', leveling:'char_skill_attack', values:s1.p7
  {
    name: "yelan_breakthrough_barb_dmg",
    category: "attack",
    damageType: "charged",
    element: "hydro",
    multipliers: [{ scaling: "hp", leveling: "char_skill_attack", values: talents.get("attack.yelan_breakthrough_barb_dmg") }],
  },
  // --- Plunge attacks (physical bow) ---
  // raw: FeatureDamagePlungeCollision plunge
  {
    name: "plunge",
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge") }],
  },
  // raw: FeatureDamagePlungeShockWave plunge_low
  {
    name: "plunge_low",
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_low") }],
  },
  // raw: FeatureDamagePlungeShockWave plunge_high
  {
    name: "plunge_high",
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_high") }],
  },
  // --- Skill: Lingering Lifeline (hydro, HP-scaled) ---
  // raw: FeatureDamageSkill (scaling:'hp*', leveling:'char_skill_elemental', values:s2.p1)
  {
    name: "skill_dmg",
    category: "skill",
    element: "hydro",
    multipliers: [{ scaling: "hp", leveling: "char_skill_elemental", values: talents.get("skill.skill_dmg") }],
  },
  // --- Burst: Depth-Clarion Dice (hydro, HP-scaled) ---
  // raw: FeatureDamageBurst (scaling:'hp*', s3.p1)
  {
    name: "burst_dmg",
    category: "burst",
    element: "hydro",
    multipliers: [{ scaling: "hp", leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") }],
  },
  // raw: FeatureDamageBurst yelan_exquisite_throw_dmg (scaling:'hp*', s3.p2)
  {
    name: "yelan_exquisite_throw_dmg",
    category: "burst",
    element: "hydro",
    multipliers: [{ scaling: "hp", leveling: "char_skill_burst", values: talents.get("burst.yelan_exquisite_throw_dmg") }],
  },
  // --- C2 "Taking All Comers": cons-added burst hit (14% HP, fixed, not talent-leveled).
  // Raw: FeatureDamageBurst, StatTable('yelan_taking_all_comers_dmg', [14]),
  // source:'constellation2', scaling:'hp*', ConditionConstellation(2). Yelan.js:257-268.
  {
    name: "yelan_taking_all_comers_dmg",
    category: "burst",
    element: "hydro",
    condition: { type: "constellation", constellation: 2 },
    multipliers: [
      {
        scaling: "hp",
        leveling: "char_skill_burst",
        values: { getValue: (_level: number) => 14 },
        source: "constellation2",
      },
    ],
  },
  // --- C6 "Winner Takes All": cons-added charged hit (breakthrough barb × 1.56).
  // Raw: FeatureDamageCharged (NOT FeatureDamageChargedAimed) → damageType:"charged",
  // name:'yelan_breakthrough_barb_c6_dmg', hydro, hp-scaled, scalingMultiplier:1.56,
  // scalingSource:'constellation6', same talent as yelan_breakthrough_barb_dmg (s1.p7).
  // ConditionConstellation(6). Yelan.js:190-202.
  {
    name: "yelan_breakthrough_barb_c6_dmg",
    category: "attack",
    damageType: "charged",
    element: "hydro",
    condition: { type: "constellation", constellation: 6 },
    multipliers: [
      {
        scaling: "hp",
        leveling: "char_skill_attack",
        values: talents.get("attack.yelan_breakthrough_barb_dmg"),
        scalingMultiplier: 1.56,
        source: "constellation6",
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Toggle conditions
// ---------------------------------------------------------------------------

// "Adapt with Ease" passive: dmg_all += buffValues[stacks-1].
// Raw Yelan.js:116,289-325 — ConditionLevels table buffValues=[1,4.5,8,...,50] (15 stacks),
// levelSetting:'yelan_adapt_with_ease', stats:[StatTable('dmg_all', buffValues)].
// Gate (ConditionBooleanValue ge 1): inactive when yelan_adapt_with_ease is absent/0.
// With fromZero unset: level = (ctx[levelSetting] || 0) || 1; gate ensures 0 is gated out.
// Transcribed from raw/genshin_calc_pub/src/js/db/Char/Yelan.js:116
//   buffValues = [1, 4.5, 8, 11.5, 15, 18.5, 22, 25.5, 29, 32.5, 36, 39.5, 43, 46.5, 50]
// Anchors: stacks 1 → buffValues[0]=1; stacks 7 → buffValues[6]=22; stacks 15 → buffValues[14]=50.
const toggleConditions: readonly Condition[] = [
  {
    type: "static-level",
    levelSetting: "yelan_adapt_with_ease",
    levelStats: { dmg_all: [1, 4.5, 8, 11.5, 15, 18.5, 22, 25.5, 29, 32.5, 36, 39.5, 43, 46.5, 50] },
    condition: { type: "boolean-value", setting: "yelan_adapt_with_ease", cond: "ge", value: 1 },
  },
];

// ---------------------------------------------------------------------------
// A1 condition — "Turn Control" hp_percent table
// ---------------------------------------------------------------------------
// Raw Yelan.js:270-287 — ConditionCalcElements (publisher) + ConditionStaticLevel.
// levelSetting:'party_elements_count_level', hp_percent:[6,12,18,30].
// party_elements_count_level is published by buildPartyContext; absent → level=0||1=1 → 6.
// No gate needed: always-active mirrors ConditionAscensionChar(1) at our fixed asc-6 builds.
// Transcribed from raw/genshin_calc_pub/src/js/db/Char/Yelan.js:280-281.
// Anchors: count_level 1 → hp_percent[0]=6; count_level 4 → hp_percent[3]=30.
const a1Conditions: readonly Condition[] = [
  {
    type: "static-level",
    levelSetting: "party_elements_count_level",
    levelStats: { hp_percent: [6, 12, 18, 30] },
  },
];

// ---------------------------------------------------------------------------
// Constellation conditions (P2.C)
// ---------------------------------------------------------------------------
// C1 "Enter the Plotters": ConditionStatic (display-only) → SKIP.
// C2 "Taking All Comers": ConditionStatic (display-only, text_percent:14) → SKIP.
//   The actual C2 damage comes from the yelan_taking_all_comers_dmg feature above.
// C3: +3 levels to Depth-Clarion Dice (burst). Raw cons[2] settings char_skill_burst_bonus:3.
//   Yelan.js:347-355.
// C4 "Bait-and-Switch": ConditionStacks (hp_percent per stack, toggle) → SKIP (toggle/stacks OFF).
// C5: +3 levels to Lingering Lifeline (elemental skill).
//   Raw cons[4] settings char_skill_elemental_bonus:3. Yelan.js:371-379.
// C6 "Winner Takes All": ConditionStatic (display-only text_percent:156) → SKIP.
//   The actual C6 damage comes from the yelan_breakthrough_barb_c6_dmg feature above.
const constellationConditions: readonly Condition[] = [
  // C3: +3 levels to Depth-Clarion Dice (burst).
  { type: "constellation", constellation: 3, settings: { char_skill_burst_bonus: 3 } },
  // C5: +3 levels to Lingering Lifeline (elemental skill).
  { type: "constellation", constellation: 5, settings: { char_skill_elemental_bonus: 3 } },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const yelan: DbObjectChar = {
  name: "yelan",
  gameId: 10000060,
  rarity: 5,
  element: "hydro",
  weapon: "bow",
  origin: "liyue",
  statTable: YelanStatTable,
  talents,
  features,
  multipliers: [],
  conditions: [...toggleConditions, ...a1Conditions, ...constellationConditions],
  // partyData — teammate kit buffs (P3.5.2 Bucket A)
  // A4 "Adapt with Ease": ConditionStacks(party.yelan_adapt_with_ease, maxStacks:15) +
  //   ConditionLevels(levelSetting:'party.yelan_adapt_with_ease') → dmg_all per level.
  //   buffValues: [1,4.5,8,11.5,15,18.5,22,25.5,29,32.5,36,39.5,43,46.5,50]
  //   Stacks UI is empty-stats (just a selector); ConditionLevels reads it via static-level.
  //   Gate: subConditions:[ConditionBooleanValue(ge 1)] → active when stacks>=1.
  // C4 "Bait-and-Switch": ConditionStacks(party.yelan_bait_and_switch, maxStacks:4)
  //   → hp_percent:10 per stack. text_percent_max:40 is display-only, skipped.
  //   Source: raw/genshin_calc_pub/src/js/db/Char/Yelan.js partyData
  partyData: {
    conditions: [
      // A4 UI selector (stacks 0-15, no stats of own — just the level source).
      {
        type: "stacks",
        name: "party.yelan_adapt_with_ease",
        maxStacks: 15,
        stats: {},
      },
      // A4 dmg_all buff indexed by stack count.
      // buffValues: [1,4.5,8,11.5,15,18.5,22,25.5,29,32.5,36,39.5,43,46.5,50]
      {
        type: "static-level",
        levelSetting: "party.yelan_adapt_with_ease",
        levelStats: {
          dmg_all: [1, 4.5, 8, 11.5, 15, 18.5, 22, 25.5, 29, 32.5, 36, 39.5, 43, 46.5, 50],
        },
        condition: { type: "boolean-value", setting: "party.yelan_adapt_with_ease", cond: "ge", value: 1 },
      },
      // C4 "Bait-and-Switch": +10% max HP per stack (max 4 stacks = 40%).
      {
        type: "stacks",
        name: "party.yelan_bait_and_switch",
        maxStacks: 4,
        stats: { hp_percent: 10 },
      },
    ],
  },
};
