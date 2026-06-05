/**
 * Kachina — geo polearm DEF scaler (Nightsoul drill, "Turbo Twirly").
 *
 * 4-hit normal combo (physical). normal_hit_2 is a 2-sub-hit multihit
 * (_2_1 + _2_2, both isChild:true in raw → dropped here so each sub-hit emits
 * as its own fixture feature). Charged hit (physical), plunge/low/high.
 *
 * Skill (Go! Go! Turbo Twirly) — both DEF-scaled geo:
 *   kachina_ride_dmg       — s2.p1 (scaling:'def*', char_skill_elemental)
 *   kachina_independed_dmg — s2.p2 (scaling:'def*', char_skill_elemental)
 *
 * Burst (Time to Get Serious!):
 *   burst_dmg — s3.p1 (scaling:'def*', char_skill_burst), geo
 *
 * A4 "The Weight of Stone": char-level FeatureMultiplier
 *   { scaling:'def*', source:'ascension4', values:[20], target:{damageTypes:['skill']} }
 * adds +20% of DEF as a base-damage term to skill hits, auto-active at C0/A6.
 * Modelled per-skill-feature as an extra scaling:"def" multiplier (same pattern
 * as Itto's A4 charged-DEF term, Itto.js:124 / :320-330).
 *
 * A1 "Mountain Echoes": +20% geo DMG, but a ConditionBoolean (ascension toggle)
 * that reads 0 in the fixed solo build → NOT folded.
 * dmg_geo_base at A6 = 24 is already folded into the stat table (charTables).
 * C6 kachina_shield_dmg is constellation-gated → skipped (C0 build).
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Kachina.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Kachina)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Kachina)
 */

import type { Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Kachina as KachinaStatTable } from "../generated/charTables.js";
import { Kachina as KachinaTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1")   return KachinaTalents.s1.p1;
      if (name === "normal_hit_2_1") return KachinaTalents.s1.p2;
      if (name === "normal_hit_2_2") return KachinaTalents.s1.p3;
      if (name === "normal_hit_3")   return KachinaTalents.s1.p4;
      if (name === "normal_hit_4")   return KachinaTalents.s1.p5;
      if (name === "charged_hit")    return KachinaTalents.s1.p6;
      if (name === "plunge")         return KachinaTalents.s1.p8;
      if (name === "plunge_low")     return KachinaTalents.s1.p9;
      if (name === "plunge_high")    return KachinaTalents.s1.p10;
    }
    if (talent === "skill") {
      if (name === "kachina_ride_dmg")       return KachinaTalents.s2.p1;
      if (name === "kachina_independed_dmg") return KachinaTalents.s2.p2;
    }
    if (talent === "burst") {
      if (name === "burst_dmg") return KachinaTalents.s3.p1;
    }
    throw new Error(`kachina talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// A4 "The Weight of Stone" — +20% of DEF as a skill base-damage term.
// raw Kachina.js TalentValues.A4SkillDmg = 20; char-level multiplier
// { scaling:'def*', source:'ascension4', target:{damageTypes:['skill']} },
// auto-active at C0/A6. Modelled per-skill-feature as scaling:"def" term.
// ---------------------------------------------------------------------------

const A4_SKILL_DEF = 20; // raw/genshin_calc_pub/src/js/db/Char/Kachina.js TalentValues.A4SkillDmg

const a4SkillDefTerm = {
  leveling: "",
  scaling: "def",
  values: { getValue: () => A4_SKILL_DEF },
} as const;

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (physical) ---
  // raw: FeatureDamageNormal normal_hit_1 (Kachina.js)
  {
    name: "normal_hit_1",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1") }],
  },
  // normal_hit_2: 2-sub-hit multihit parent (_2_1 + _2_2, two different tables).
  // raw: FeatureDamageMultihit({ items: [{ p2 }, { p3 }] })
  {
    name: "normal_hit_2",
    category: "attack",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2_1") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2_2") }] },
    ],
  },
  // Sub-hits of normal_hit_2 (isChild:true in raw → dropped so each emits).
  // raw/genshin_calc_pub/src/js/db/Char/Kachina.js (normal_hit_2_1 / _2_2)
  {
    name: "normal_hit_2_1",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2_1") }],
  },
  {
    name: "normal_hit_2_2",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2_2") }],
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
  // --- Charged attack (geo polearm — physical by default, no element override) ---
  // raw: FeatureDamageCharged charged_hit
  {
    name: "charged_hit",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }],
  },
  // --- Plunge attacks (physical) ---
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
    tags: ["plunge_shockwave"],
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_low") }],
  },
  // raw: FeatureDamagePlungeShockWave plunge_high
  {
    name: "plunge_high",
    tags: ["plunge_shockwave"],
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_high") }],
  },
  // --- Skill: Go! Go! Turbo Twirly (geo, DEF-scaled) ---
  // kachina_ride_dmg: s2.p1, scaling:'def*' + A4 +20% DEF base term.
  // raw/genshin_calc_pub/src/js/db/Char/Kachina.js (FeatureDamageSkill, element:'geo')
  {
    name: "kachina_ride_dmg",
    category: "skill",
    element: "geo",
    multipliers: [
      { scaling: "def", leveling: "char_skill_elemental", values: talents.get("skill.kachina_ride_dmg") },
      a4SkillDefTerm,
    ],
  },
  // kachina_independed_dmg: s2.p2, scaling:'def*' + A4 +20% DEF base term.
  {
    name: "kachina_independed_dmg",
    category: "skill",
    element: "geo",
    multipliers: [
      { scaling: "def", leveling: "char_skill_elemental", values: talents.get("skill.kachina_independed_dmg") },
      a4SkillDefTerm,
    ],
  },
  // --- Burst: Time to Get Serious! (geo, DEF-scaled) ---
  // burst_dmg: s3.p1, scaling:'def*'. A4 targets only skill damageTypes → no term here.
  {
    name: "burst_dmg",
    category: "burst",
    element: "geo",
    multipliers: [
      { scaling: "def", leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") },
    ],
  },
  // --- C6 "This Time I've Gotta Win!": Shield hit (geo, DEF-scaled) ---
  // FeatureDamage (base class), category:'other' → omit category (loader derives "other." prefix).
  // 200% of DEF, fixed value (ValueTable([C6DefDmg=200])). damageType:"none" matches
  // fixture "none" output — base FeatureDamage carries no damage-type bonus.
  // Raw Kachina.js:295-307 (FeatureDamage, scaling:'def*', ConditionConstellation(6)).
  {
    name: "kachina_shield_dmg",
    damageType: "none",
    element: "geo",
    condition: { type: "constellation", constellation: 6 },
    multipliers: [
      {
        scaling: "def",
        leveling: "",
        values: { getValue: (_level: number) => 200 },
        source: "constellation6",
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Constellation conditions (P2.C)
// ---------------------------------------------------------------------------
// C1 "Shards Are Gems Too": ConditionStatic display-only → SKIP.
// C2 "Never Leave Home Without Turbo Twirly": ConditionStatic display-only → SKIP.
// C3: +3 levels to Go! Go! Turbo Twirly (skill). Raw cons[2] settings char_skill_elemental_bonus:3.
// C4 "More Foes, More Caution": ConditionDropdown (def_percent stacks) → SKIP (toggle-like).
// C5: +3 levels to Time to Get Serious! (burst). Raw cons[4] settings char_skill_burst_bonus:3.
// C6: kachina_shield_dmg feature (cons-added, gated above). Raw cons[5] ConditionStatic
//     with text_percent_dmg → display-only, SKIP.
// Raw: raw/genshin_calc_pub/src/js/db/Char/Kachina.js constellation array (Kachina.js:346-403).
const constellationConditions: readonly Condition[] = [
  // C3: +3 levels to Go! Go! Turbo Twirly (elemental skill). Raw cons[2].
  { type: "constellation", constellation: 3, settings: { char_skill_elemental_bonus: 3 } },
  // C5: +3 levels to Time to Get Serious! (elemental burst). Raw cons[4].
  { type: "constellation", constellation: 5, settings: { char_skill_burst_bonus: 3 } },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const kachina: DbObjectChar = {
  name: "kachina",
  gameId: 10000100,
  rarity: 4,
  element: "geo",
  weapon: "polearm",
  origin: "natlan",
  statTable: KachinaStatTable,
  talents,
  features,
  multipliers: [],
  conditions: constellationConditions,
  // partyData — teammate kit buffs (P3.5.2 Bucket A, A-straggler)
  // C4 "More Foes, More Caution": a numeric dropdown (party.kachina_more_foes_more_caution,
  //   value 1-4 = nearby enemy count) granting DEF +8/12/16/20%.
  //   raw constants C4Stack1..4 = 8/12/16/20 (Kachina.js:117-120, C4Values Kachina.js:124-141).
  //   Her ConditionDropdown wraps a PLAIN ConditionStatic per option (new Condition({stats:…}),
  //   NOT refine-scaled). Our `dropdown` condition type, by contrast, is weapon-centric: it
  //   resolves each option through `refineBag`, which yields {} when `weapon_refine` is absent —
  //   and a teammate buff applied to a recipient has NO weapon_refine in context, so a `dropdown`
  //   here silently drops its stats. So this is modeled faithfully (and refine-independently) as
  //   four `boolean-value` conditions, each active when the numeric selection equals its tier
  //   (cond:"eq"). Exactly one fires for any single selection — identical to her single-select
  //   dropdown semantics. Source: raw/genshin_calc_pub/src/js/db/Char/Kachina.js:404-416
  partyData: {
    conditions: [
      // value 1 → +8% DEF (C4Stack1).
      {
        type: "boolean-value",
        setting: "party.kachina_more_foes_more_caution",
        cond: "eq",
        value: 1,
        stats: { def_percent: 8 },
      },
      // value 2 → +12% DEF (C4Stack2).
      {
        type: "boolean-value",
        setting: "party.kachina_more_foes_more_caution",
        cond: "eq",
        value: 2,
        stats: { def_percent: 12 },
      },
      // value 3 → +16% DEF (C4Stack3).
      {
        type: "boolean-value",
        setting: "party.kachina_more_foes_more_caution",
        cond: "eq",
        value: 3,
        stats: { def_percent: 16 },
      },
      // value 4 → +20% DEF (C4Stack4).
      {
        type: "boolean-value",
        setting: "party.kachina_more_foes_more_caution",
        cond: "eq",
        value: 4,
        stats: { def_percent: 20 },
      },
    ],
  },
};
