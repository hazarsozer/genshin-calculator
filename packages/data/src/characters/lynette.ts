/**
 * Lynette — anemo sword ATK scaler.
 *
 * 4-hit normal combo (physical sword), n3 2-hit multihit (children normal_hit_3_1
 * and normal_hit_3_2 — isChild:true in raw → drop isChild to emit both), charged
 * 2-hit multihit (children charged_hit_1/2 — isChild:true → drop isChild to emit),
 * plunge/low/high (physical), anemo skill (lynette_enigma_thrust_dmg,
 * surging_blade_dmg), anemo burst (burst_dmg, lynette_bogglecat_box_dmg) +
 * element-absorbing vivid shots (hydro/pyro/cryo/electro variants).
 *
 * All burst features carry damageBonuses: ['dmg_burst_lynette'] (from A4 and C6);
 * A4 "Props Positively Prepped" is ConditionBoolean gated by ConditionAscensionChar(4)
 * → requires manual toggle; NOT auto-active at canonical solo C0 build → reads 0.
 *
 * A1 "Sophisticated Synergy" is ConditionBooleanLevels (party-based, conditional)
 * → NOT auto-active in solo; omitted.
 * C6 "Watchful Eye" grants anemo DMG bonus behind a ConditionBoolean → C6-gated; omit.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Lynette.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Lynette)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Lynette)
 */

import type { Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Lynette as LynetteStatTable } from "../generated/charTables.js";
import { Lynette as LynetteTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1")  return LynetteTalents.s1.p1;
      if (name === "normal_hit_2")  return LynetteTalents.s1.p2;
      if (name === "normal_hit_3_1") return LynetteTalents.s1.p3;
      if (name === "normal_hit_3_2") return LynetteTalents.s1.p4;
      if (name === "normal_hit_4")  return LynetteTalents.s1.p5;
      if (name === "charged_hit_1") return LynetteTalents.s1.p6;
      if (name === "charged_hit_2") return LynetteTalents.s1.p7;
      if (name === "plunge")        return LynetteTalents.s1.p9;
      if (name === "plunge_low")    return LynetteTalents.s1.p10;
      if (name === "plunge_high")   return LynetteTalents.s1.p11;
    }
    if (talent === "skill") {
      if (name === "lynette_enigma_thrust_dmg") return LynetteTalents.s2.p1;
      if (name === "surging_blade_dmg")         return LynetteTalents.s2.p3;
    }
    if (talent === "burst") {
      if (name === "burst_dmg")                  return LynetteTalents.s3.p1;
      if (name === "lynette_bogglecat_box_dmg")  return LynetteTalents.s3.p2;
      if (name === "lynette_vivid_shot_dmg")     return LynetteTalents.s3.p3;
    }
    throw new Error(`lynette talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (physical sword) ---
  // raw: FeatureDamageNormal normal_hit_1
  {
    name: "normal_hit_1",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1") }],
  },
  // raw: FeatureDamageNormal normal_hit_2
  {
    name: "normal_hit_2",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2") }],
  },
  // raw: FeatureDamageMultihit normal_hit_3 (parent = _3_1 + _3_2)
  // raw/genshin_calc_pub/src/js/db/Char/Lynette.js:166-189
  {
    name: "normal_hit_3",
    category: "attack",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3_1") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3_2") }] },
    ],
  },
  // raw: FeatureDamageNormal normal_hit_3_1 (isChild:true → drop isChild to emit)
  {
    name: "normal_hit_3_1",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3_1") }],
  },
  // raw: FeatureDamageNormal normal_hit_3_2 (isChild:true → drop isChild to emit)
  {
    name: "normal_hit_3_2",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3_2") }],
  },
  // raw: FeatureDamageNormal normal_hit_4
  {
    name: "normal_hit_4",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4") }],
  },
  // --- Charged attacks ---
  // raw: FeatureDamageMultihit charged_hit_total (parent = _1 + _2)
  // raw/genshin_calc_pub/src/js/db/Char/Lynette.js:219-243
  {
    name: "charged_hit_total",
    category: "attack",
    damageType: "charged",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit_1") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit_2") }] },
    ],
  },
  // raw: FeatureDamageCharged charged_hit_1 (isChild:true → drop isChild to emit)
  {
    name: "charged_hit_1",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit_1") }],
  },
  // raw: FeatureDamageCharged charged_hit_2 (isChild:true → drop isChild to emit)
  {
    name: "charged_hit_2",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit_2") }],
  },
  // --- Plunge attacks (physical sword) ---
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
  // --- Skill: Enigmatic Feint (anemo) ---
  // raw: FeatureDamageSkill lynette_enigma_thrust_dmg (element: 'anemo')
  // raw/genshin_calc_pub/src/js/db/Char/Lynette.js:290-299
  {
    name: "lynette_enigma_thrust_dmg",
    category: "skill",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.lynette_enigma_thrust_dmg") }],
  },
  // raw: FeatureDamageSkill surging_blade_dmg (element: 'anemo', cannotReact:true)
  // raw/genshin_calc_pub/src/js/db/Char/Lynette.js:300-310
  {
    name: "surging_blade_dmg",
    category: "skill",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.surging_blade_dmg") }],
  },
  // --- Burst: Astonishing Shift (anemo) ---
  // raw: FeatureDamageBurst burst_dmg (element: 'anemo', damageBonuses: ['dmg_burst_lynette'])
  // raw/genshin_calc_pub/src/js/db/Char/Lynette.js:311-321
  {
    name: "burst_dmg",
    category: "burst",
    element: "anemo",
    damageBonuses: ["dmg_burst_lynette"],
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") }],
  },
  // raw: FeatureDamageBurst lynette_bogglecat_box_dmg (element: 'anemo', damageBonuses: ['dmg_burst_lynette'])
  // raw/genshin_calc_pub/src/js/db/Char/Lynette.js:322-332
  {
    name: "lynette_bogglecat_box_dmg",
    category: "burst",
    element: "anemo",
    damageBonuses: ["dmg_burst_lynette"],
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.lynette_bogglecat_box_dmg") }],
  },
  // raw: FeatureDamageBurst lynette_vivid_shot_hydro_dmg (element: 'hydro', damageBonuses: ['dmg_burst_lynette'])
  // raw/genshin_calc_pub/src/js/db/Char/Lynette.js:333-343
  {
    name: "lynette_vivid_shot_hydro_dmg",
    category: "burst",
    element: "hydro",
    damageBonuses: ["dmg_burst_lynette"],
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.lynette_vivid_shot_dmg") }],
  },
  // raw: FeatureDamageBurst lynette_vivid_shot_pyro_dmg (element: 'pyro', damageBonuses: ['dmg_burst_lynette'])
  // raw/genshin_calc_pub/src/js/db/Char/Lynette.js:344-354
  {
    name: "lynette_vivid_shot_pyro_dmg",
    category: "burst",
    element: "pyro",
    damageBonuses: ["dmg_burst_lynette"],
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.lynette_vivid_shot_dmg") }],
  },
  // raw: FeatureDamageBurst lynette_vivid_shot_cryo_dmg (element: 'cryo', damageBonuses: ['dmg_burst_lynette'])
  // raw/genshin_calc_pub/src/js/db/Char/Lynette.js:355-365
  {
    name: "lynette_vivid_shot_cryo_dmg",
    category: "burst",
    element: "cryo",
    damageBonuses: ["dmg_burst_lynette"],
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.lynette_vivid_shot_dmg") }],
  },
  // raw: FeatureDamageBurst lynette_vivid_shot_electro_dmg (element: 'electro', damageBonuses: ['dmg_burst_lynette'])
  // raw/genshin_calc_pub/src/js/db/Char/Lynette.js:366-376
  {
    name: "lynette_vivid_shot_electro_dmg",
    category: "burst",
    element: "electro",
    damageBonuses: ["dmg_burst_lynette"],
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.lynette_vivid_shot_dmg") }],
  },
];

// ---------------------------------------------------------------------------
// Constellations (P2.C Wave-1)
// ---------------------------------------------------------------------------
// C1 "A Cold Blade Like a Shadow" (ConditionStatic description-only) → SKIP.
// C2 "Endless Mysteries" (ConditionStatic description-only) → SKIP.
// C3 "Cognition-Inverting Gaze" → +3 Elemental Burst (Astonishing Shift) levels.
//   raw: constellation[2]: Condition{ settings:{char_skill_burst_bonus:3} }
// C4 "Tacit Coordination" (ConditionStatic description-only) → SKIP.
// C5 "Obscuring Ambiguity" → +3 Elemental Skill (Enigmatic Feint) levels.
//   raw: constellation[4]: Condition{ settings:{char_skill_elemental_bonus:3} }
// C6 "Watchful Eye": two entries in constellation[5]:
//   (a) Condition{ settings:{allowed_infusion_anemo:1} } — always-on at C6, enables
//       anemo infusion on normal attacks. PORT as constellation settings condition.
//   (b) ConditionBoolean "lynette_watchful_eye" (dmg_anemo toggle + attack_infusion_anemo
//       settings) → SKIP (ConditionBoolean toggle, off in fixed build).
//
// Sources: raw/genshin_calc_pub/src/js/db/Char/Lynette.js:413-477

const constellationConditions: readonly Condition[] = [
  // C3: +3 Elemental Burst (Astonishing Shift) levels.
  { type: "constellation", constellation: 3, settings: { char_skill_burst_bonus: 3 } },
  // C5: +3 Elemental Skill (Enigmatic Feint) levels.
  { type: "constellation", constellation: 5, settings: { char_skill_elemental_bonus: 3 } },
  // C6 (a): always-on anemo infusion enablement.
  { type: "constellation", constellation: 6, settings: { allowed_infusion_anemo: 1 } },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const lynette: DbObjectChar = {
  name: "lynette",
  gameId: 10000083,
  rarity: 4,
  element: "anemo",
  weapon: "sword",
  origin: "fontaine",
  statTable: LynetteStatTable,
  talents,
  features,
  multipliers: [],
  conditions: constellationConditions,
  // partyData — teammate kit buffs (P3.5.2 Bucket A, A-straggler)
  // A1 "Sophisticated Synergy": team ATK% indexed by the party's distinct-element count
  //   (party_elements_count_level, 1-4 → 8/12/16/20%), gated by the boolean
  //   party.lynette_sophisticated_synergy. raw A1AtkBonus = [8,12,16,20] (Lynette.js:132,491).
  //   Her ConditionBooleanLevels reads getLevel = settings[levelSetting] || 1 and indexes the
  //   StatTable at that level. Our `static-level` with fromZero unset resolves level = raw || 1
  //   (incl. the same _bonus offsets), so it is byte-faithful for any party (count_level ≥ 1).
  //   The raw ConditionCalcElements({}) publisher needs no port — party_elements_count_level is
  //   already published by buildPartyContext (partyContext.ts:77).
  //   Source: raw/genshin_calc_pub/src/js/db/Char/Lynette.js:478-495
  partyData: {
    conditions: [
      {
        type: "static-level",
        levelSetting: "party_elements_count_level",
        levelStats: { atk_percent: [8, 12, 16, 20] },
        condition: { type: "boolean", name: "party.lynette_sophisticated_synergy" },
      },
    ],
  },
};
