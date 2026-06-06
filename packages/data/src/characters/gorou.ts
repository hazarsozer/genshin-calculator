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

import type { Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
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
      if (name === "gorou_def_bonus") return GorouTalents.s2.p2;
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
    isAimed: true,
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.aimed") }],
  },
  // charged_aimed: fully charged geo arrow (explicit element: "geo")
  // raw/genshin_calc_pub/src/js/db/Char/Gorou.js:210-220
  {
    name: "charged_aimed",
    isAimed: true,
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
  // --- Skill static readout: skill.gorou_def_bonus = General's War Banner flat DEF bonus (raw talent value) ---
  // FeatureStatic + FeatureMultiplierStatic (her getTreeStatValue = CConst(100) → term = talent value, NO stat
  // scaling). Modelled as values:0 + flatValues:<talent> → base term = 0×stat + talent = the raw value.
  // char_skill_elemental, format="". raw/genshin_calc_pub/src/js/db/Char/Gorou.js:235-245
  {
    name: "gorou_def_bonus",
    category: "skill",
    output: { kind: "static" },
    multipliers: [
      { leveling: "char_skill_elemental", values: { getValue: () => 0 }, flatValues: talents.get("skill.gorou_def_bonus") },
    ],
  },
];

// ---------------------------------------------------------------------------
// Constellation conditions (P2.C Wave-1)
// ---------------------------------------------------------------------------
// C1 "Rushing Hound: Swift as the Wind": ConditionStatic, no real stats → SKIP.
// C2 "Steady Hound: Steadfast as a Clock": ConditionStatic, no real stats → SKIP.
// C4 "Lapping Hound: Warm as Water": FeatureHeal gated by ConditionConstellation(4)
//   (heal feature, not a damage triple → not in golden suite) → SKIP.
// C6 "Inviolable Essence": Condition(crit_dmg_geo) gated by ConditionBoolean toggles
//   (gorou_generals_war_banner + ConditionElementsCount) → OFF at baseline → SKIP.
//
// Always-on: C3 (+3 skill talent), C5 (+3 burst talent).
// Sources: raw/genshin_calc_pub/src/js/db/Char/Gorou.js — char.conditions C3 + constellation C5.

const constellationConditions: readonly Condition[] = [
  // C3 "Mauling Hound: Fierce as Fire" — +3 Elemental Skill.
  // Raw char.conditions: new Condition({ settings: { char_skill_elemental_bonus: 3 },
  //   condition: new ConditionConstellation({ constellation: 3 }) }).
  { type: "constellation", constellation: 3, settings: { char_skill_elemental_bonus: 3 } },
  // C5 "Flowerfall" — +3 Elemental Burst.
  // Raw constellation[4]: new Condition({ settings: { char_skill_burst_bonus: 3 } }).
  { type: "constellation", constellation: 5, settings: { char_skill_burst_bonus: 3 } },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// gorou_def_bonus talent table — General's War Banner's flat DEF bonus by skill
// level (raw Gorou.js:76 `new StatTable('gorou_def_bonus', charTalentTables.Gorou.s2.p2)`).
// standing_firm reads it via `getAlias('skill.gorou_def_bonus','def')` (Gorou.js:470),
// i.e. these values are added under the `def` stat key, indexed by the skill level.
// Inlined as a raw number[] because `static-level`'s `levelStats` consumes a value
// array (StatTable.getValue semantics), not a TalentTable. Values mirror
// GorouTalents.s2.p2 (generated/charTalentTables.ts → Gorou.s2.p2); level 1..15.
// Source: raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Gorou s2.p2)
// ---------------------------------------------------------------------------
const GOROU_DEF_BONUS = [
  206.16, 221.622, 237.084, 257.7, 273.162, 288.624, 309.24, 329.856, 350.472, 371.088, 391.704,
  412.32, 438.09, 463.86, 489.63,
] as const;

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
  conditions: constellationConditions,
  // partyData — teammate kit buffs (P3.5.2 Bucket A, A-straggler). PARTIAL port:
  // the clean A-level DEF core. The geo-element-count tiers (gorou_crunch dmg_geo,
  // and ALL of C6 — fierce_as_fire / mountainous_fealty / the three crit_dmg_geo
  // tiers) are DEFERRED — see the "Deferred conditions" block below.
  // Source: raw/genshin_calc_pub/src/js/db/Char/Gorou.js:434-543
  partyData: {
    // Descriptive metadata mirroring her partyData.loadStats (the teammate's input
    // contract). Gorou's loadStats declares only the skill level (Gorou.js:435-437);
    // the engine consumes the inputs as explicit baked settings, not via loadStats.
    loadStats: { settings: ["char_skill_elemental"] },
    conditions: [
      // gorou_char_skill_elemental (ConditionNumberTalent, partySetting:'char_skill_elemental')
      // — lifts Gorou's Elemental Skill level into `gorou_char_skill_elemental` so
      // standing_firm's level-indexed DEF table can read it. Number-lift idiom (mirrors
      // Shenhe's `shenhe_char_skill_elemental`). The level itself is read from the merged
      // settings by static-level's getLevel; this entry re-emits the clamped value under
      // `gorou_char_skill_elemental` but contributes no DAMAGE-relevant stat, so it is
      // functionally a documentary/schema marker (mirrors Shenhe's lift; removing it leaves
      // the rep green because static-level reads the level from the merged baked settings).
      // raw/genshin_calc_pub/src/js/db/Char/Gorou.js:439-444
      { type: "number", name: "gorou_char_skill_elemental" },
      // party.gorou_standing_firm (ConditionBooleanLevels) — flat DEF scaled by Gorou's
      // skill level, modelled as `static-level` over `gorou_char_skill_elemental` emitting
      // the `def` stat from the gorou_def_bonus table. Her ConditionBooleanLevels extends
      // ConditionBoolean, so isActive = (settings['party.gorou_standing_firm'] truthy) AND
      // (.condition gate). We reproduce BOTH arms with an AND gate: the buff's OWN toggle
      // (party.gorou_standing_firm — the Boolean-subtype's name-activeness, the same idiom
      // as Lynette's same-setting gate) AND the master skill toggle
      // (party.gorou_generals_war_banner — her `.condition`). getLevel maps level → the
      // gorou_def_bonus value via StatTable.getValue, identical to her getValue path.
      // raw/genshin_calc_pub/src/js/db/Char/Gorou.js:462-473
      {
        type: "static-level",
        levelSetting: "gorou_char_skill_elemental",
        levelStats: { def: GOROU_DEF_BONUS },
        condition: {
          type: "and",
          items: [
            { type: "boolean", name: "party.gorou_standing_firm" },
            { type: "boolean", name: "party.gorou_generals_war_banner" },
          ],
        },
      },
      // party.gorou_heedless_of_the_wind_and_weather (A1, ConditionBoolean) — +25% DEF.
      // A1DefBonus=25 (Gorou.js:122). A plain boolean toggle with a flat stat.
      // raw/genshin_calc_pub/src/js/db/Char/Gorou.js:493-503
      {
        type: "boolean",
        name: "party.gorou_heedless_of_the_wind_and_weather",
        stats: { def_percent: 25 },
      },
    ],
    // ── Deferred conditions (NOT ported — documented per the partial-port doctrine) ──
    // The following Gorou.js:445-541 partyData conditions are intentionally omitted:
    //   - party.gorou_generals_war_banner (ConditionBoolean, Gorou.js:455-461): the master
    //     skill toggle. It carries NO stats of its own — it only GATES standing_firm/crunch/
    //     impregnable. The gate above reads its baked setting directly (party.gorou_generals_
    //     war_banner), so a standalone stat-less boolean condition would contribute nothing;
    //     omitted (matches mavuika's toggle-only-boolean handling).
    //   - gorou_impregnable (ConditionStatic, Gorou.js:474-481): display-only (text_* stats);
    //     nothing to model.
    //   - gorou_crunch (Gorou.js:482-492): dmg_geo +15 (SkillGeoBonus), gated by
    //     generals_war_banner AND ConditionElementsCount(geo, 3).
    //   - C6: party.gorou_fierce_as_fire (Gorou.js:445-454, +3 skill level), party.gorou_
    //     mountainous_fealty (Gorou.js:504-512), and the three crit_dmg_geo tiers
    //     (Gorou.js:513-541, C6CritDmgGeo1/2/3 = 10/10/20), the latter two gated by
    //     ConditionElementsCount(geo, 2) / (geo, 3).
    // DEFERRAL REASON: these need (a) a new `elements-count` core Condition variant — our
    // union has none (`resonance` only fires at count>=2 hardcoded, not parameterized by
    // element+count); and (b) a MULTI-teammate oracle rep — the geo>=2/>=3 tiers cannot be
    // exercised by the single-teammate `partyBuffSourceItem` harness. Both are out of scope
    // for this A-straggler DATA port; tracked for a future focused engine session.
  },
};
