/**
 * Sayu — anemo claymore ATK scaler.
 *
 * 4-hit normal combo (n3: 2-hit multihit → child _3_1), charged spin/final,
 * plunge/low/high (physical), anemo skill (sayu_windwheel_dmg, sayu_windwheel_kick_dmg,
 * sayu_windwheel_kick_hold_dmg, plus elemental variants for pyro/hydro/cryo/electro),
 * anemo burst (sayu_burst_dmg, sayu_mujimuji_dmg).
 *
 * Heals (sayu_heal, sayu_mujimuji_heal, sayu_mujimuji_add_heal, sayu_mujimuji_swirl_heal)
 * modelled as output:{kind:"heal"} (P3.5.3). The C6 mastery multipliers on the two
 * mujimuji heals are constellation-gated → omitted at solo C0.
 *
 * sayu_mujimuji_dmg uses a FeatureMultiplierSayuBurst second multiplier conditional on
 * constellation 6 — inactive at C0; only s3.p4 contributes.
 *
 * No always-on active passive stat bonuses: A1 is ConditionAscensionChar heal
 * (FeatureHeal only, no damage stats), A4 is ConditionAscensionChar text/heal
 * (ConditionStatic, heal display only). No baseStats needed.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Sayu.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Sayu)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Sayu)
 */

import type { Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Sayu as SayuStatTable } from "../generated/charTables.js";
import { Sayu as SayuTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1")   return SayuTalents.s1.p1;
      if (name === "normal_hit_2")   return SayuTalents.s1.p2;
      if (name === "normal_hit_3")   return SayuTalents.s1.p3;
      if (name === "normal_hit_4")   return SayuTalents.s1.p5;
      if (name === "charged_spin")   return SayuTalents.s1.p6;
      if (name === "charged_final")  return SayuTalents.s1.p7;
      if (name === "plunge")         return SayuTalents.s1.p10;
      if (name === "plunge_low")     return SayuTalents.s1.p11;
      if (name === "plunge_high")    return SayuTalents.s1.p12;
    }
    if (talent === "skill") {
      if (name === "sayu_windwheel_dmg")              return SayuTalents.s2.p1;
      if (name === "sayu_windwheel_elemental_dmg")    return SayuTalents.s2.p2;
      if (name === "sayu_windwheel_kick_dmg")         return SayuTalents.s2.p3;
      if (name === "sayu_windwheel_kick_hold_dmg")    return SayuTalents.s2.p4;
      if (name === "sayu_windwheel_kick_elemental_dmg") return SayuTalents.s2.p5;
    }
    if (talent === "burst") {
      if (name === "sayu_burst_dmg")    return SayuTalents.s3.p1;
      if (name === "sayu_mujimuji_dmg") return SayuTalents.s3.p4;
      if (name === "sayu_heal_percent")          return SayuTalents.s3.p3;
      if (name === "sayu_heal_flat")             return SayuTalents.s3.p2;
      if (name === "sayu_mujimuji_heal_percent") return SayuTalents.s3.p6;
      if (name === "sayu_mujimuji_heal_flat")    return SayuTalents.s3.p5;
    }
    throw new Error(`sayu talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (physical claymore) ---
  // raw/genshin_calc_pub/src/js/db/Char/Sayu.js: FeatureDamageNormal (no name → normal_hit_1)
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
  // raw: FeatureDamageMultihit normal_hit_3 (items:[{hits:2, multipliers:[p3]}]) — parent=2×p3
  // Sayu.js:178-194
  {
    name: "normal_hit_3",
    category: "attack",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }] },
    ],
  },
  // raw: FeatureDamageNormal normal_hit_3_1 (isChild:true → drop to emit; single hit of the 2-hit combo)
  // Sayu.js:195-205
  {
    name: "normal_hit_3_1",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }],
  },
  // raw: FeatureDamageNormal normal_hit_4
  {
    name: "normal_hit_4",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4") }],
  },
  // --- Charged attacks (physical) ---
  // raw: FeatureDamageCharged (no name → charged_spin)
  {
    name: "charged_spin",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_spin") }],
  },
  // raw: FeatureDamageCharged (no name → charged_final)
  {
    name: "charged_final",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_final") }],
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
  // --- Skill: Fuuin Dash (anemo windwheel) ---
  // raw: FeatureDamageSkill (no name → sayu_windwheel_dmg), element='anemo'
  // Sayu.js:255-263
  {
    name: "sayu_windwheel_dmg",
    category: "skill",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.sayu_windwheel_dmg") }],
  },
  // raw: FeatureDamageSkill (no name → sayu_windwheel_kick_dmg), element='anemo', damageBonuses=['dmg_skill_sayu_press']
  // Sayu.js:264-273
  {
    name: "sayu_windwheel_kick_dmg",
    category: "skill",
    element: "anemo",
    damageBonuses: ["dmg_skill_sayu_press"],
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.sayu_windwheel_kick_dmg") }],
  },
  // raw: FeatureDamageSkill (no name → sayu_windwheel_kick_hold_dmg), element='anemo', damageBonuses=['dmg_skill_sayu_hold']
  // Sayu.js:274-283
  {
    name: "sayu_windwheel_kick_hold_dmg",
    category: "skill",
    element: "anemo",
    damageBonuses: ["dmg_skill_sayu_hold"],
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.sayu_windwheel_kick_hold_dmg") }],
  },
  // raw: FeatureDamageSkill sayu_windwheel_elemental_pyro_dmg, element='pyro'
  // Sayu.js:284-293
  {
    name: "sayu_windwheel_elemental_pyro_dmg",
    category: "skill",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.sayu_windwheel_elemental_dmg") }],
  },
  // raw: FeatureDamageSkill sayu_windwheel_kick_elemental_pyro_dmg, element='pyro', damageBonuses=['dmg_skill_sayu_hold']
  // Sayu.js:294-304
  {
    name: "sayu_windwheel_kick_elemental_pyro_dmg",
    category: "skill",
    element: "pyro",
    damageBonuses: ["dmg_skill_sayu_hold"],
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.sayu_windwheel_kick_elemental_dmg") }],
  },
  // raw: FeatureDamageSkill sayu_windwheel_elemental_hydro_dmg, element='hydro'
  // Sayu.js:305-314
  {
    name: "sayu_windwheel_elemental_hydro_dmg",
    category: "skill",
    element: "hydro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.sayu_windwheel_elemental_dmg") }],
  },
  // raw: FeatureDamageSkill sayu_windwheel_kick_elemental_hydro_dmg, element='hydro', damageBonuses=['dmg_skill_sayu_hold']
  // Sayu.js:315-325
  {
    name: "sayu_windwheel_kick_elemental_hydro_dmg",
    category: "skill",
    element: "hydro",
    damageBonuses: ["dmg_skill_sayu_hold"],
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.sayu_windwheel_kick_elemental_dmg") }],
  },
  // raw: FeatureDamageSkill sayu_windwheel_elemental_cryo_dmg, element='cryo'
  // Sayu.js:326-335
  {
    name: "sayu_windwheel_elemental_cryo_dmg",
    category: "skill",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.sayu_windwheel_elemental_dmg") }],
  },
  // raw: FeatureDamageSkill sayu_windwheel_kick_elemental_cryo_dmg, element='cryo', damageBonuses=['dmg_skill_sayu_hold']
  // Sayu.js:336-346
  {
    name: "sayu_windwheel_kick_elemental_cryo_dmg",
    category: "skill",
    element: "cryo",
    damageBonuses: ["dmg_skill_sayu_hold"],
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.sayu_windwheel_kick_elemental_dmg") }],
  },
  // raw: FeatureDamageSkill sayu_windwheel_elemental_electro_dmg, element='electro'
  // Sayu.js:347-356
  {
    name: "sayu_windwheel_elemental_electro_dmg",
    category: "skill",
    element: "electro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.sayu_windwheel_elemental_dmg") }],
  },
  // raw: FeatureDamageSkill sayu_windwheel_kick_elemental_electro_dmg, element='electro', damageBonuses=['dmg_skill_sayu_hold']
  // Sayu.js:357-367
  {
    name: "sayu_windwheel_kick_elemental_electro_dmg",
    category: "skill",
    element: "electro",
    damageBonuses: ["dmg_skill_sayu_hold"],
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.sayu_windwheel_kick_elemental_dmg") }],
  },
  // --- Burst: Mujina Flurry (anemo) ---
  // raw: FeatureDamageBurst (no name → sayu_burst_dmg), element='anemo'
  // Sayu.js:368-376
  {
    name: "sayu_burst_dmg",
    category: "burst",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.sayu_burst_dmg") }],
  },
  // raw: FeatureDamageBurst (no name → sayu_mujimuji_dmg), element='anemo'
  // Sayu.js:377-389. The 2nd multiplier (FeatureMultiplierSayuBurst, Multiplier/SayuBurst.js)
  // is a C6 ATK term whose coefficient = min(mastery_total × 0.002, 4) — a product of EM and
  // ATK our single-scaling-stat term can't express faithfully. RUNTIME COEFFICIENT (M1):
  // values=100 (/100 → 1.0 fraction) × min(mastery_total×0.002, 4) × ATK. At the fixed build's
  // mastery=151: min(151×0.002,4)=0.302, so 1.0×0.302×ATK = the old 0.302×ATK. Tracks any EM.
  {
    name: "sayu_mujimuji_dmg",
    category: "burst",
    element: "anemo",
    multipliers: [
      { leveling: "char_skill_burst", values: talents.get("burst.sayu_mujimuji_dmg") },
      {
        leveling: "char_skill_burst",
        scaling: "atk",
        values: { getValue: (_level: number) => 100 },
        coefficientFromStat: { stat: "mastery", ratio: 0.002, cap: 4 },
        source: "constellation6",
        condition: { type: "constellation", constellation: 6 },
      },
    ],
  },
  // --- Heals (FeatureHeal): 4 burst/swirl heals, output:{kind:"heal"} ---
  // burst.sayu_heal: cast party heal — ATK% (s3.p3) + flat (s3.p2). raw Sayu.js:390-398 (partyHeal).
  {
    name: "sayu_heal",
    category: "burst",
    output: { kind: "heal", partyHeal: true },
    multipliers: [
      { leveling: "char_skill_burst", values: talents.get("burst.sayu_heal_percent"), flatValues: talents.get("burst.sayu_heal_flat") },
    ],
  },
  // burst.sayu_mujimuji_heal: Fuufuu Windwheel per-tick heal — ATK% (s3.p6) + flat (s3.p5).
  // raw Sayu.js:400-416 (the C6 mastery multiplier — ConditionConstellation(6) — is gated OFF at C0; omitted).
  {
    name: "sayu_mujimuji_heal",
    category: "burst",
    output: { kind: "heal" },
    multipliers: [
      { leveling: "char_skill_burst", values: talents.get("burst.sayu_mujimuji_heal_percent"), flatValues: talents.get("burst.sayu_mujimuji_heal_flat") },
    ],
  },
  // other.sayu_mujimuji_swirl_heal: A4 swirl heal — EM-scaled (const 120% EM + 300 flat), auto-active at A6.
  // raw Sayu.js:417-431 (FeatureMultiplierList scaling:'mastery*', source:'ascension1', [ValueTable([120]), ValueTable([300])]).
  {
    name: "sayu_mujimuji_swirl_heal",
    category: "other",
    output: { kind: "heal" },
    multipliers: [
      { scaling: "mastery", leveling: "ascension1", values: { getValue: () => 120 }, flatValues: { getValue: () => 300 } },
    ],
  },
  // burst.sayu_mujimuji_add_heal: A4 additional heal = 0.2× the mujimuji_heal tree (her scalingMultiplier:0.2,
  // applied to BOTH the ATK% term AND the flat — List.getTree wraps CSum([%×atk, flat]) in CMulti([…, 0.2]);
  // the engine has no scalingMultiplier field, so wrap both tables by 0.2). raw Sayu.js:432-448.
  // (C6 mastery multiplier gated OFF at C0; omitted.)
  {
    name: "sayu_mujimuji_add_heal",
    category: "burst",
    output: { kind: "heal" },
    multipliers: [
      {
        leveling: "char_skill_burst",
        values: { getValue: (level: number) => 0.2 * SayuTalents.s3.p6.getValue(level) },
        flatValues: { getValue: (level: number) => 0.2 * SayuTalents.s3.p5.getValue(level) },
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Constellation conditions (P2.C Wave-1)
// ---------------------------------------------------------------------------
// C1 "Multi-Task No Jutsu": ConditionStatic, no real stats → SKIP.
// C2 "Egress Prep" — two conditions in the C2 block:
//   (a) Condition({ stats: { dmg_skill_sayu_press: 3.3 } }): no gate (plain
//       Condition, always-on at constellation 2) → ADD as constellation:2 stat.
//   (b) ConditionStacks({ name: 'sayu_egress_prep', stats:[dmg_skill_sayu_hold] }):
//       stack-count toggle (0..20) → OFF at baseline → SKIP.
// C4 "New and Improved": ConditionStatic, no real stats → SKIP.
// C6 "Sleep O'Clock": ConditionStatic, no real stats → SKIP.
//   (C6 FeatureMultiplierSayuBurst + mastery FeatureMultiplier in features are
//   ConditionConstellation-gated intra-feature multipliers — these are on existing
//   features but require the FeatureMultiplierSayuBurst type which is not supported
//   by the current engine port. Report as NEEDS CONS-FEATURE TREATMENT.)
//
// Always-on: C2 (dmg_skill_sayu_press +3.3), C3 (+3 burst talent), C5 (+3 skill talent).
// Sources: raw/genshin_calc_pub/src/js/db/Char/Sayu.js:478-547

const constellationConditions: readonly Condition[] = [
  // C2 "Egress Prep" — sayu_windwheel_kick_dmg gets +3.3% dmg_skill_sayu_press (always-on).
  // Raw cons[1]: Condition({ stats: { dmg_skill_sayu_press: 3.3 } }) with no boolean gate.
  { type: "constellation", constellation: 2, stats: { dmg_skill_sayu_press: 3.3 } },
  // C3 "Eh, Rest When You're Dead?" — +3 Elemental Burst (Mujina Flurry).
  // Raw cons[2]: new Condition({ settings: { char_skill_burst_bonus: 3 } }).
  { type: "constellation", constellation: 3, settings: { char_skill_burst_bonus: 3 } },
  // C5 "Speed Comes First" — +3 Elemental Skill (Fuuin Dash).
  // Raw cons[4]: new Condition({ settings: { char_skill_elemental_bonus: 3 } }).
  { type: "constellation", constellation: 5, settings: { char_skill_elemental_bonus: 3 } },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const sayu: DbObjectChar = {
  name: "sayu",
  gameId: 10000053,
  rarity: 4,
  element: "anemo",
  weapon: "claymore",
  origin: "inazuma",
  statTable: SayuStatTable,
  talents,
  features,
  multipliers: [],
  conditions: constellationConditions,
};
