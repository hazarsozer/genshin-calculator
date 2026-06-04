/**
 * Alhaitham — dendro sword ATK+EM scaler.
 *
 * 5-hit normal combo (hit 3: 2-hit multihit → child normal_hit_3_1), 2-hit
 * charged (charged_hit_total parent + charged_hit_1 child), plunge/low/high.
 * Skill "Universality: An Elaboration on Form": rush_dmg, then chisel-light
 * Projection-Attack mirror instances — mirror_1_dmg (1 hit), mirror_2 (2 hits:
 * total parent + child), mirror_3 (3 hits: total parent + child). All skill hits
 * are dendro and scale on ATK + a `mastery*` (EM) term. Burst "Particular Field:
 * Fetters of Phenomena": alhaitham_single_instance_dmg (dendro, ATK+EM).
 *
 * The dendro-infused normals during skill are modelled by the fixture as the
 * separate mirror features; the listed `normal_hit_*`/`charged_hit_*`/`plunge_*`
 * are the un-infused (physical) base attacks — settings={} → no infusion → physical.
 *
 * A4 "Mysteries Laid Bare" (Alhaitham.js:482-496): PostEffectStatsMastery →
 * dmg_skill_alhaitham = dmg_burst_alhaitham = 0.1 × mastery, capped at 100 (percent).
 * Always-active at the A6 canonical build. Applied to all mirror skill hits and the
 * burst (they carry the matching `damageBonuses`); the rush hit does NOT carry it.
 * Verified against the oracle: rush matches with NO A4 bonus, mirrors/burst match
 * only WITH the +0.110128 (= 0.1 × 110.128) dendro bonus.
 *
 * C0 build: constellations skipped (C2/C4 EM stacks, C3/C5 talent levels, C6 crit
 * are all OFF). A1 (infusion toggle) is a ConditionBoolean — off at baseline.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Alhaitham.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Alhaitham)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Alhaitham)
 */

import type { CharPostEffect, Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Alhaitham as AlhaithamStatTable } from "../generated/charTables.js";
import { Alhaitham as AlhaithamTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return AlhaithamTalents.s1.p1;
      if (name === "normal_hit_2") return AlhaithamTalents.s1.p2;
      if (name === "normal_hit_3") return AlhaithamTalents.s1.p3;
      if (name === "normal_hit_4") return AlhaithamTalents.s1.p5;
      if (name === "normal_hit_5") return AlhaithamTalents.s1.p6;
      if (name === "charged_hit")  return AlhaithamTalents.s1.p7;
      if (name === "plunge")       return AlhaithamTalents.s1.p10;
      if (name === "plunge_low")   return AlhaithamTalents.s1.p11;
      if (name === "plunge_high")  return AlhaithamTalents.s1.p12;
    }
    if (talent === "skill") {
      if (name === "rush_dmg")        return AlhaithamTalents.s2.p1;
      if (name === "rush_mastery")    return AlhaithamTalents.s2.p2;
      if (name === "mirror_1_dmg")     return AlhaithamTalents.s2.p4;
      if (name === "mirror_1_mastery") return AlhaithamTalents.s2.p5;
      if (name === "mirror_2_dmg")     return AlhaithamTalents.s2.p6;
      if (name === "mirror_2_mastery") return AlhaithamTalents.s2.p7;
      if (name === "mirror_3_dmg")     return AlhaithamTalents.s2.p8;
      if (name === "mirror_3_mastery") return AlhaithamTalents.s2.p9;
    }
    if (talent === "burst") {
      if (name === "single_instance_dmg")     return AlhaithamTalents.s3.p1;
      if (name === "single_instance_mastery") return AlhaithamTalents.s3.p2;
    }
    throw new Error(`alhaitham talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (physical sword; un-infused at settings={}) ---
  // raw: FeatureDamageNormal normal_hit_1/2 (Alhaitham.js:202-219)
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
  // normal_hit_3: 2-hit multihit parent (same multiplier × 2). (Alhaitham.js:220-236)
  {
    name: "normal_hit_3",
    category: "attack",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }] },
    ],
  },
  // normal_hit_3_1: child sub-hit of normal_hit_3 (single hit). raw is isChild:true
  // (Alhaitham.js:237-247); the fixture asserts it as its own feature → emit it.
  {
    name: "normal_hit_3_1",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }],
  },
  // raw: FeatureDamageNormal normal_hit_4/5 (Alhaitham.js:248-265)
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
  // --- Charged attack (2-hit multihit) ---
  // charged_hit_total: 2-hit multihit parent. (Alhaitham.js:266-282)
  {
    name: "charged_hit_total",
    category: "attack",
    damageType: "charged",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }] },
    ],
  },
  // charged_hit_1: child single hit of charged_hit_total. raw isChild:true
  // (Alhaitham.js:283-293) → fixture asserts it → emit it.
  {
    name: "charged_hit_1",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }],
  },
  // --- Plunge attacks (physical) ---
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
  // --- Skill: Universality — An Elaboration on Form (dendro, ATK + EM) ---
  // rush_dmg: the Projection Attack rush hit. NO A4 bonus (no damageBonuses).
  // raw: FeatureDamageSkill (Alhaitham.js:321-335)
  {
    name: "alhaitham_rush_dmg",
    category: "skill",
    element: "dendro",
    multipliers: [
      { leveling: "char_skill_elemental", values: talents.get("skill.rush_dmg") },
      { scaling: "mastery*", leveling: "char_skill_elemental", values: talents.get("skill.rush_mastery") },
    ],
  },
  // mirror_1_dmg: single chisel-light mirror hit. Carries A4 dmg_skill_alhaitham.
  // raw: FeatureDamageSkill (Alhaitham.js:336-351)
  {
    name: "alhaitham_mirror_1_dmg",
    category: "skill",
    element: "dendro",
    damageBonuses: ["dmg_skill_alhaitham"],
    multipliers: [
      { leveling: "char_skill_elemental", values: talents.get("skill.mirror_1_dmg") },
      { scaling: "mastery*", leveling: "char_skill_elemental", values: talents.get("skill.mirror_1_mastery") },
    ],
  },
  // mirror_2_total_dmg: 2-hit multihit parent. raw: FeatureDamageMultihit (Alhaitham.js:352-374)
  {
    name: "alhaitham_mirror_2_total_dmg",
    category: "skill",
    element: "dendro",
    damageBonuses: ["dmg_skill_alhaitham"],
    items: [
      {
        multipliers: [
          { leveling: "char_skill_elemental", values: talents.get("skill.mirror_2_dmg") },
          { scaling: "mastery*", leveling: "char_skill_elemental", values: talents.get("skill.mirror_2_mastery") },
        ],
      },
      {
        multipliers: [
          { leveling: "char_skill_elemental", values: talents.get("skill.mirror_2_dmg") },
          { scaling: "mastery*", leveling: "char_skill_elemental", values: talents.get("skill.mirror_2_mastery") },
        ],
      },
    ],
  },
  // mirror_2_dmg: child single hit of mirror_2_total. raw isChild:true (Alhaitham.js:375-392) → emit.
  {
    name: "alhaitham_mirror_2_dmg",
    category: "skill",
    element: "dendro",
    damageBonuses: ["dmg_skill_alhaitham"],
    multipliers: [
      { leveling: "char_skill_elemental", values: talents.get("skill.mirror_2_dmg") },
      { scaling: "mastery*", leveling: "char_skill_elemental", values: talents.get("skill.mirror_2_mastery") },
    ],
  },
  // mirror_3_total_dmg: 3-hit multihit parent. raw: FeatureDamageMultihit (Alhaitham.js:393-415)
  {
    name: "alhaitham_mirror_3_total_dmg",
    category: "skill",
    element: "dendro",
    damageBonuses: ["dmg_skill_alhaitham"],
    items: [
      {
        multipliers: [
          { leveling: "char_skill_elemental", values: talents.get("skill.mirror_3_dmg") },
          { scaling: "mastery*", leveling: "char_skill_elemental", values: talents.get("skill.mirror_3_mastery") },
        ],
      },
      {
        multipliers: [
          { leveling: "char_skill_elemental", values: talents.get("skill.mirror_3_dmg") },
          { scaling: "mastery*", leveling: "char_skill_elemental", values: talents.get("skill.mirror_3_mastery") },
        ],
      },
      {
        multipliers: [
          { leveling: "char_skill_elemental", values: talents.get("skill.mirror_3_dmg") },
          { scaling: "mastery*", leveling: "char_skill_elemental", values: talents.get("skill.mirror_3_mastery") },
        ],
      },
    ],
  },
  // mirror_3_dmg: child single hit of mirror_3_total. raw isChild:true (Alhaitham.js:416-433) → emit.
  {
    name: "alhaitham_mirror_3_dmg",
    category: "skill",
    element: "dendro",
    damageBonuses: ["dmg_skill_alhaitham"],
    multipliers: [
      { leveling: "char_skill_elemental", values: talents.get("skill.mirror_3_dmg") },
      { scaling: "mastery*", leveling: "char_skill_elemental", values: talents.get("skill.mirror_3_mastery") },
    ],
  },
  // --- Burst: Particular Field — Fetters of Phenomena (dendro, ATK + EM) ---
  // raw: FeatureDamageBurst (Alhaitham.js:434-449). Carries A4 dmg_burst_alhaitham.
  {
    name: "alhaitham_single_instance_dmg",
    category: "burst",
    element: "dendro",
    damageBonuses: ["dmg_burst_alhaitham"],
    multipliers: [
      { leveling: "char_skill_burst", values: talents.get("burst.single_instance_dmg") },
      { scaling: "mastery*", leveling: "char_skill_burst", values: talents.get("burst.single_instance_mastery") },
    ],
  },
];

// ---------------------------------------------------------------------------
// Post-effects
// ---------------------------------------------------------------------------

// A4 "Mysteries Laid Bare" (Alhaitham.js:482-496): PostEffectStatsMastery
// dmg_skill_alhaitham = dmg_burst_alhaitham = 0.1 × mastery, capped at 100 (percent).
// Auto-active at ascension 4+; no toggle at the A6 canonical build.
// Stored as a raw percent (ratio 0.1 × EM, ceiling 100); buildStats divides by 100
// at emit, yielding the engine fraction 0.110128 at EM 110.128.
const a4PostEffects: readonly CharPostEffect[] = [
  {
    fromStat: "mastery",
    toStat: "dmg_skill_alhaitham",
    ratio: 0.1,
    capValue: 100,
  },
  {
    fromStat: "mastery",
    toStat: "dmg_burst_alhaitham",
    ratio: 0.1,
    capValue: 100,
  },
];

// ---------------------------------------------------------------------------
// Constellation conditions (P2.C)
// ---------------------------------------------------------------------------
// C1 "Intuition": ConditionStatic no stats → display-only, SKIP.
// C2 "Debate": ConditionStacks mastery toggle → SKIP (toggle off).
// C4 "Elucidation": ConditionStacks dmg_dendro + mastery toggle → SKIP.
// C6 "Structuration": ConditionBoolean crit_rate/crit_dmg toggle → SKIP.
//
// Source: raw/genshin_calc_pub/src/js/db/Char/Alhaitham.js:498-568

const constellationConditions: readonly Condition[] = [
  // C3 "Compact Ingenuity": +3 levels to Universality: An Elaboration on Form (Elemental Skill).
  // Raw cons[2]: Condition{ settings:{ char_skill_elemental_bonus: 3 } }.
  { type: "constellation", constellation: 3, settings: { char_skill_elemental_bonus: 3 } },
  // C5 "Sagacity": +3 levels to Particular Field: Fetters of Phenomena (Elemental Burst).
  // Raw cons[4]: Condition{ settings:{ char_skill_burst_bonus: 3 } }.
  { type: "constellation", constellation: 5, settings: { char_skill_burst_bonus: 3 } },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const alhaitham: DbObjectChar = {
  name: "alhaitham",
  gameId: 10000078,
  rarity: 5,
  element: "dendro",
  weapon: "sword",
  origin: "sumeru",
  statTable: AlhaithamStatTable,
  talents,
  features,
  multipliers: [],
  postEffects: a4PostEffects,
  conditions: constellationConditions,
  // partyData — teammate kit buffs (P3.5.2 Bucket A)
  // C4 "Elucidation": ConditionStacks(party.alhaitham_elucidation) maxStacks:3
  //   → mastery:30 per stack (text_value_dendro/mastery display keys skipped).
  //   C4Mastery=30.
  //   Source: raw/genshin_calc_pub/src/js/db/Char/Alhaitham.js partyData.conditions[0]
  partyData: {
    conditions: [
      {
        type: "stacks",
        name: "party.alhaitham_elucidation",
        maxStacks: 3,
        stats: { mastery: 30 },
      },
    ],
  },
};
