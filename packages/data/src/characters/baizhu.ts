/**
 * Baizhu — dendro catalyst ATK scaler.
 *
 * 4-hit normal combo (all dendro — catalyst infuses innately), n3 2-hit multihit
 * (parent + child normal_hit_3_1 — isChild:true in raw → drop isChild to emit),
 * dendro charged hit, plunge/low/high (dendro), dendro skill (skill_dmg), dendro
 * burst (baizu_spiritvein_dmg — note raw typo "baizu" not "baizhu").
 *
 * Non-damage outputs (output: { kind: "shield" }):
 *   - burst.baizhu_seamless_shield — HP-scaled burst shield (s3.p1 % + s3.p2 flat)
 *
 * Heals/shields still omitted (not ported in this pass):
 *   skill.heal, burst.baizhu_seamless_heal.
 * FeaturePostEffectValue outputs (bloom/quicken bonuses) also have empty damageType
 * → not damage triples; omitted: burst.baizhu_bloom_bonus, burst.baizhu_quicken_bonus.
 *
 * A1 "Five Fortunes Forever" is ConditionBoolean / ConditionStatic (conditional toggle
 * or text-only) → not auto-active at C0 solo; omitted.
 * A4 "All Things Are of the Earth" is ConditionBoolean gated by ConditionAscensionChar(4)
 * → requires manual toggle; omitted.
 * C6 HP scale on baizu_spiritvein_dmg is C6-gated (ConditionConstellation(6)) → omit.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Baizhu.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Baizhu)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Baizhu)
 */

import type { CharMultiplier, Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Baizhu as BaizhuStatTable } from "../generated/charTables.js";
import { Baizhu as BaizhuTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return BaizhuTalents.s1.p1;
      if (name === "normal_hit_2") return BaizhuTalents.s1.p2;
      if (name === "normal_hit_3") return BaizhuTalents.s1.p3;
      if (name === "normal_hit_4") return BaizhuTalents.s1.p4;
      if (name === "charged_hit")  return BaizhuTalents.s1.p5;
      if (name === "plunge")       return BaizhuTalents.s1.p7;
      if (name === "plunge_low")   return BaizhuTalents.s1.p8;
      if (name === "plunge_high")  return BaizhuTalents.s1.p9;
    }
    if (talent === "skill") {
      if (name === "skill_dmg") return BaizhuTalents.s2.p1;
    }
    if (talent === "burst") {
      // raw: Talents.get('burst.baizu_spiritvein_dmg') → s3.p7
      if (name === "baizu_spiritvein_dmg") return BaizhuTalents.s3.p7;
      if (name === "baizhu_seamless_shield_percent") return BaizhuTalents.s3.p1;
      if (name === "baizhu_seamless_shield_flat")    return BaizhuTalents.s3.p2;
    }
    throw new Error(`baizhu talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (dendro — catalyst infuses innately) ---
  // raw: FeatureDamageNormal normal_hit_1 (element: 'dendro')
  {
    name: "normal_hit_1",
    category: "attack",
    element: "dendro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1") }],
  },
  // raw: FeatureDamageNormal normal_hit_2 (element: 'dendro')
  {
    name: "normal_hit_2",
    category: "attack",
    element: "dendro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2") }],
  },
  // raw: FeatureDamageMultihit normal_hit_3 (2-hit, dendro) — parent sum
  {
    name: "normal_hit_3",
    category: "attack",
    element: "dendro",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }] },
    ],
  },
  // raw: FeatureDamageNormal normal_hit_3_1 (isChild:true, hits:3 in raw → drop isChild to emit)
  // raw/genshin_calc_pub/src/js/db/Char/Baizhu.js:213-223
  {
    name: "normal_hit_3_1",
    category: "attack",
    element: "dendro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }],
  },
  // raw: FeatureDamageNormal normal_hit_4 (element: 'dendro')
  {
    name: "normal_hit_4",
    category: "attack",
    element: "dendro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4") }],
  },
  // --- Charged attack (dendro) ---
  // raw: FeatureDamageCharged charged_hit (element: 'dendro')
  {
    name: "charged_hit",
    category: "attack",
    damageType: "charged",
    element: "dendro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }],
  },
  // --- Plunge attacks (dendro) ---
  // raw: FeatureDamagePlungeCollision plunge (element: 'dendro')
  {
    name: "plunge",
    category: "attack",
    damageType: "plunge",
    element: "dendro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge") }],
  },
  // raw: FeatureDamagePlungeShockWave plunge_low (element: 'dendro')
  {
    name: "plunge_low",
    tags: ["plunge_shockwave"],
    category: "attack",
    damageType: "plunge",
    element: "dendro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_low") }],
  },
  // raw: FeatureDamagePlungeShockWave plunge_high (element: 'dendro')
  {
    name: "plunge_high",
    tags: ["plunge_shockwave"],
    category: "attack",
    damageType: "plunge",
    element: "dendro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_high") }],
  },
  // --- Skill: Universal Diagnosis (dendro) ---
  // raw: FeatureDamageSkill skill_dmg (element: 'dendro')
  // raw/genshin_calc_pub/src/js/db/Char/Baizhu.js:274-283
  {
    name: "skill_dmg",
    category: "skill",
    element: "dendro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.skill_dmg") }],
  },
  // --- C2 "Incisive Discernment": cons-added FeatureDamageSkill hit (dendro, fixed 250% ATK).
  // Raw Baizhu.js:284-294: FeatureDamageSkill name:'baizhu_gossamer_splice_dmg',
  //   multipliers:[FeatureMultiplier({ leveling:'char_skill_elemental',
  //   values: new ValueTable([C2Damage]) })], condition: ConditionConstellation({constellation:2}).
  //   C2Damage = 250.
  {
    name: "baizhu_gossamer_splice_dmg",
    category: "skill",
    element: "dendro",
    condition: { type: "constellation", constellation: 2 },
    multipliers: [
      {
        leveling: "char_skill_elemental",
        values: { getValue: (_level: number) => 250 },
      },
    ],
  },
  // --- Burst: Holistic Revivification (dendro) ---
  // raw: FeatureDamageBurst baizu_spiritvein_dmg (element: 'dendro')
  // NOTE: raw and fixture both use "baizu" (typo), not "baizhu".
  // raw/genshin_calc_pub/src/js/db/Char/Baizhu.js:323-337
  {
    name: "baizu_spiritvein_dmg",
    category: "burst",
    element: "dendro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.baizu_spiritvein_dmg") }],
  },
  // --- Shield (FeatureShield): burst.baizhu_seamless_shield ---
  // FeatureMultiplierList: (percent/100 × hp_total) + flat, then × (1 + shield).
  // Source: raw/genshin_calc_pub/src/js/db/Char/Baizhu.js:339-350 (FeatureShield)
  // baizhu_seamless_shield: s3.p1 (% HP) + s3.p2 (flat)
  {
    name: "baizhu_seamless_shield",
    category: "burst",
    output: { kind: "shield" },
    multipliers: [
      { scaling: "hp", leveling: "char_skill_burst", values: talents.get("burst.baizhu_seamless_shield_percent"), flatValues: talents.get("burst.baizhu_seamless_shield_flat") },
    ],
  },
];

// ---------------------------------------------------------------------------
// Constellation conditions (P2.C)
// ---------------------------------------------------------------------------
// C1: ConditionStatic (display-only, text only) → SKIP.
// C2: Cons-added baizhu_gossamer_splice_dmg feature above (ConditionStatic in cons[1] is display-only).
// C3: +3 levels to Holistic Revivification (burst). Raw cons[2] settings char_skill_burst_bonus:3.
// C4: ConditionBoolean toggle (mastery:80) → SKIP (toggle OFF).
// C5: +3 levels to Universal Diagnosis (skill). Raw cons[4] settings char_skill_elemental_bonus:3.
// C6: ConditionStatic (display-only text_percent) → hp-scale is a per-feature multiplier on
//   baizu_spiritvein_dmg (Baizhu.js:329-336). Modelled as a CharMultiplier targeting burst.
// Raw Baizhu.js:426-485.
const constellationConditions: readonly Condition[] = [
  // C3: +3 levels to burst.
  { type: "constellation", constellation: 3, settings: { char_skill_burst_bonus: 3 } },
  // C5: +3 levels to skill.
  { type: "constellation", constellation: 5, settings: { char_skill_elemental_bonus: 3 } },
];

// C6 "Elimination of Malicious Qi": +8% HP-scaling added to baizu_spiritvein_dmg (the only burst
// damage feature). Raw Baizhu.js:329-336: FeatureMultiplier({ scaling:'hp*', source:'constellation6',
// values: new ValueTable([C6HpScale]) = [8], condition: ConditionConstellation({constellation:6}) })
// inside baizu_spiritvein_dmg's multipliers array. Modelled as a char-level multiplier targeting all
// burst features (only one: baizu_spiritvein_dmg) gated at C6.
const charMultipliers: readonly CharMultiplier[] = [
  {
    scaling: "hp*",
    leveling: "char_skill_burst",
    values: { getValue: (_level: number) => 8 },
    source: "constellation6",
    target: { damageTypes: ["burst"] },
    condition: { type: "constellation", constellation: 6 },
  },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const baizhu: DbObjectChar = {
  name: "baizhu",
  gameId: 10000082,
  rarity: 5,
  element: "dendro",
  weapon: "catalyst",
  origin: "liyue",
  statTable: BaizhuStatTable,
  talents,
  features,
  multipliers: charMultipliers,
  conditions: constellationConditions,
  // A1 "Five Fortunes Forever" — auto-active at A6 under canonical solo C0 build:
  // ConditionStatic with subConditions [ConditionAscensionChar(1), ConditionNot([bool toggle])].
  // Since the boolean 'baizhu_five_fortunes_forever' is OFF by default, the NOT fires → +25% dendro DMG.
  // raw/genshin_calc_pub/src/js/db/Char/Baizhu.js:376-392
  baseStats: { dmg_dendro: 25 },
};
