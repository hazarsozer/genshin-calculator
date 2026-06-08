/**
 * Mona — hydro catalyst.
 *
 * 4-hit normal combo (all hydro), hydro charged hit, plunge/low/high.
 * Hydro skill: dot_dmg + explosion_dmg.
 * A1 "Come 'n' Get Me, Hag!" grants mona_phantom_explosion_dmg = 50% of
 * explosion_dmg (auto-active at ascension 1+; build is A6 so always on).
 * Hydro burst: burst_dmg.
 * other.hydro_dmg_bonus: A4 ER→Hydro-DMG% readout, MODELLED below as a FeatureStatic
 *   (scaling:"recharge_total"); the harness DOES assert it (non-damage output).
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Mona.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Mona)
 */

import type { CharPostEffect, Condition, DbObjectChar, Feature, TalentResolver, TalentTable } from "@genshin/types";
import { Mona as MonaStatTable } from "../generated/charTables.js";
import { Mona as MonaTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return MonaTalents.s1.p1;
      if (name === "normal_hit_2") return MonaTalents.s1.p2;
      if (name === "normal_hit_3") return MonaTalents.s1.p3;
      if (name === "normal_hit_4") return MonaTalents.s1.p4;
      if (name === "charged_hit")  return MonaTalents.s1.p5;
      if (name === "plunge")       return MonaTalents.s1.p7;
      if (name === "plunge_low")   return MonaTalents.s1.p8;
      if (name === "plunge_high")  return MonaTalents.s1.p9;
    }
    if (talent === "skill") {
      if (name === "dot_dmg")       return MonaTalents.s2.p1;
      if (name === "explosion_dmg") return MonaTalents.s2.p2;
    }
    if (talent === "burst") {
      if (name === "burst_dmg") return MonaTalents.s4.p2;
    }
    throw new Error(`mona talents: unknown path '${path}'`);
  },
};

// A4 "Waterborne Destiny": ER% → Hydro DMG% (20% of recharge → dmg_hydro).
// raw: PostEffectStatsRecharge({ percent: StatTable('dmg_hydro', [20]), conditions:[A4] }).
// Build is A6 so always active; omit conditions (empty array = always runs).
const monaA4PostEffect: CharPostEffect = {
  fromStat: "recharge",
  toStat: "dmg_hydro",
  ratio: 0.2,
};

// A1 "Come 'n' Get Me, Hag!": mona_phantom_explosion_dmg = 50% of explosion_dmg.
// raw: scalingMultiplier: A1SkillDmg / 100 (= 50/100 = 0.5) on Talents.get('skill.explosion_dmg').
const monaPhantomTable: TalentTable = {
  getValue(level: number): number {
    return MonaTalents.s2.p2.getValue(level) * 0.5;
  },
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (hydro catalyst, always hydro) ---
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
  // --- Charged attack ---
  {
    name: "charged_hit",
    category: "attack",
    damageType: "charged",
    element: "hydro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }],
  },
  // --- Plunge attacks ---
  {
    name: "plunge",
    category: "attack",
    damageType: "plunge",
    element: "hydro",
    // FeatureDamagePlungeCollision sets cannotReact (raw .../Feature2/Damage/Plunge/Collision.js:5):
    // the descent-collision plunge does NOT trigger amplifying reactions, unlike plunge_low/high
    // (FeatureDamagePlungeShockWave). Oracle: attack.plunge isReacted:false. Without this flag,
    // vaporize would wrongly amplify it.
    cannotReact: true,
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
  // --- Skill: Mirror Reflection of Doom ---
  {
    name: "dot_dmg",
    category: "skill",
    element: "hydro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.dot_dmg") }],
  },
  {
    name: "explosion_dmg",
    category: "skill",
    element: "hydro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.explosion_dmg") }],
  },
  // A1: mona_phantom_explosion_dmg = 50% of explosion_dmg (auto-active at A1+; build is A6).
  // raw: scalingMultiplier: 0.5 on explosion_dmg table; condition: ConditionAscensionChar(1).
  {
    name: "mona_phantom_explosion_dmg",
    category: "skill",
    element: "hydro",
    multipliers: [{ leveling: "char_skill_elemental", values: monaPhantomTable }],
  },
  // --- Burst: Stellaris Phantasm ---
  {
    name: "burst_dmg",
    category: "burst",
    element: "hydro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") }],
  },
  // --- C2 "Lunar Chain": on charged hit, 20% chance of another free charged hit.
  // raw: FeatureDamageCharged name:'mona_charged_hit', element:'hydro',
  //   same charged_hit talent, condition:ConditionConstellation({constellation:2}).
  //   FeatureDamageCharged → damageType:"charged". Mona.js:201-213.
  //   rotationHitCount:C2ChargedProb/100 = 0.20 — her per-feature ROTATION weight: this hit
  //   lands 0.2× per rotation cycle (the 20% proc chance), so compileRotation scales its whole
  //   triple by 0.2 in rotation.total. It is APPLIED to the total (her Tree.js:83-90), NOT
  //   display-only. Inert outside a rotation (and in all 58k damage goldens).
  {
    name: "mona_charged_hit",
    category: "attack",
    damageType: "charged",
    element: "hydro",
    rotationHitMulti: 0.2,
    condition: { type: "constellation", constellation: 2 },
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }],
  },
  // --- other.hydro_dmg_bonus: A4 "Waterborne Destiny" ER→Hydro-DMG readout (FeaturePostEffectValue → static) ---
  // Raw Mona.js:126,287-293 — hydroDmgPost = PostEffectStatsRecharge({ percent: StatTable('dmg_hydro',
  // [A4HydroDmgRatio=20]) }), format:'percent'. Her getTree: value(=20)/100 (isPercent('dmg_hydro')) ×
  // recharge_total_DECIMAL (recharge/100), then ×100 (format:'percent') = 20 × recharge_decimal × (1/100 × 100)
  // = 20 × recharge_decimal. In our engine the term is (getValue/100) × recharge_total (PERCENT form, e.g. 232),
  // i.e. getValue/100 × recharge_percent = getValue × recharge_decimal → getValue = raw A4HydroDmgRatio = 20
  // (recharge-scaled: the ×100 percent-format fold is "free"). Modelled WITHOUT the A4 gate. NEVER baked.
  {
    name: "hydro_dmg_bonus",
    category: "other",
    output: { kind: "static" },
    multipliers: [
      { scaling: "recharge_total", leveling: "", values: { getValue: () => 20 } },
    ],
  },
];

// ---------------------------------------------------------------------------
// Constellation conditions (P2.C)
// ---------------------------------------------------------------------------
// C1 "Prophecy of Submersion": ConditionBoolean toggle (reaction bonuses) → SKIP.
// C2 "Lunar Chain": ConditionStatic (display-only text_percent_chance) → no stat entry;
//   actual hit modeled as mona_charged_hit feature above. Mona.js:356-365.
// C3 "Restless Revolution": +3 levels to Stellaris Phantasm (burst). Mona.js:295-301.
// C4 "Prophecy of Oblivion": ConditionBoolean toggle (+15% crit_rate) → SKIP.
// C5 "Mockery of Fortuna": +3 levels to Mirror Reflection of Doom (skill). Mona.js:381-389.
// C6 "Rhetoric of Calamitas": ConditionStacks toggle (charged DMG stacks) → SKIP.
const constellationConditions: readonly Condition[] = [
  // C3: +3 levels to Stellaris Phantasm (elemental burst). Mona.js:295-301.
  { type: "constellation", constellation: 3, settings: { char_skill_burst_bonus: 3 } },
  // C5: +3 levels to Mirror Reflection of Doom (elemental skill). Mona.js:381-389.
  { type: "constellation", constellation: 5, settings: { char_skill_elemental_bonus: 3 } },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const mona: DbObjectChar = {
  name: "mona",
  gameId: 10000041,
  rarity: 5,
  element: "hydro",
  weapon: "catalyst",
  origin: "mondstadt",
  statTable: MonaStatTable,
  talents,
  features,
  multipliers: [],
  conditions: constellationConditions,
  postEffects: [monaA4PostEffect],
  // partyData — teammate kit buffs (P3.5.2 Bucket A)
  // C3 "Restless Revolution" toggle: ConditionBoolean → settings burst talent +3.
  //   name='party.mona_constellation_5' (raw uses serializeId for C3).
  // Burst "Omen" (BooleanLevels): ConditionBooleanLevels(party.mona_omen)
  //   → dmg_all per burst talent level from s4.p10=[42,44,46,48,50,52,54,56,58,60].
  //   Level from mona_char_skill_burst (baked via sourceSettings).
  // C1 "Prophecy of Submersion": ConditionBoolean → dmg_reaction_ bonuses (+15).
  //   duration_frozen and dmg_reaction_lunarcharged are display/non-damage, skipped.
  //   C1ReactionBonus=15.
  // C4 "Prophecy of Oblivion": ConditionBoolean → crit_rate:15, gated on omen toggle.
  //   C4CritRate=15.
  //   Source: raw/genshin_calc_pub/src/js/db/Char/Mona.js partyData
  partyData: {
    conditions: [
      // C3 toggle: +3 burst talent levels.
      {
        type: "boolean",
        name: "party.mona_constellation_5",
        settings: { mona_char_skill_burst_bonus: 3 },
      },
      // Burst "Omen": dmg_all per burst talent level.
      // raw s4.p10: [42,44,46,48,50,52,54,56,58,60]
      {
        type: "static-level",
        levelSetting: "mona_char_skill_burst",
        levelStats: { dmg_all: [42, 44, 46, 48, 50, 52, 54, 56, 58, 60] },
        condition: { type: "boolean", name: "party.mona_omen" },
      },
      // C1 "Prophecy of Submersion": reaction DMG bonuses +15.
      {
        type: "boolean",
        name: "party.mona_prophecy_of_submersion",
        stats: {
          dmg_reaction_electrocharged: 15,
          dmg_reaction_vaporize: 15,
          dmg_reaction_swirl_hydro: 15,
        },
      },
      // C4 "Prophecy of Oblivion": +15% crit rate, gated on omen toggle.
      {
        type: "boolean",
        name: "party.mona_prophecy_of_oblivion",
        stats: { crit_rate: 15 },
        condition: { type: "boolean", name: "party.mona_omen" },
      },
    ],
  },
};
