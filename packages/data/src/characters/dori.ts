/**
 * Dori — electro claymore ATK scaler.
 *
 * 3-hit normal combo: n1, n2 (multihit parent: 2-hit _2_1 + _2_2), n3.
 * Charged: charged_spin + charged_final. Plunge/low/high.
 * Electro skill: dori_troubleshooter_shot_dmg + dori_aftersales_service_round_dmg.
 * Electro burst: dori_connector_dmg.
 *
 * normal_hit_2 is a FeatureDamageMultihit (parent: sum of _2_1 + _2_2).
 * normal_hit_2_1 and normal_hit_2_2 are FeatureDamageNormal with isChild:true
 * but the fixture tests them as independent damage triples → drop isChild to emit.
 *
 * Non-damage features (damageType: "" in fixture, not tested):
 *   - burst.heal_dot         — HP-scaled heal (FeatureHeal)
 *   - skill.dori_compound_interest — A4 recharge display (FeaturePostEffectValue)
 *   - weapon.bell_shield     — weapon passive shield (not a damage feature)
 *
 * Reactions (5 auto-generated from electro element):
 *   electrocharged, hyperbloom, overloaded, shatter, superconduct
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Dori.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Dori)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js:1799 (Dori)
 */

import type { Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Dori as DoriStatTable } from "../generated/charTables.js";
import { Dori as DoriTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1")   return DoriTalents.s1.p1;
      if (name === "normal_hit_2_1") return DoriTalents.s1.p2;
      if (name === "normal_hit_2_2") return DoriTalents.s1.p3;
      if (name === "normal_hit_3")   return DoriTalents.s1.p4;
      if (name === "charged_spin")   return DoriTalents.s1.p5;
      if (name === "charged_final")  return DoriTalents.s1.p6;
      if (name === "plunge")         return DoriTalents.s1.p9;
      if (name === "plunge_low")     return DoriTalents.s1.p10;
      if (name === "plunge_high")    return DoriTalents.s1.p11;
    }
    if (talent === "skill") {
      if (name === "dori_troubleshooter_shot_dmg")       return DoriTalents.s2.p1;
      if (name === "dori_aftersales_service_round_dmg")  return DoriTalents.s2.p2;
    }
    if (talent === "burst") {
      if (name === "dori_connector_dmg") return DoriTalents.s3.p1;
      if (name === "heal_dot_percent") return DoriTalents.s3.p2;
      if (name === "heal_dot_flat")    return DoriTalents.s3.p3;
    }
    throw new Error(`dori talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (physical claymore) ---
  // raw: FeatureDamageNormal normal_hit_1 (s1.p1)
  {
    name: "normal_hit_1",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1") }],
  },
  // raw: FeatureDamageMultihit normal_hit_2 (parent: _2_1 + _2_2)
  // raw/genshin_calc_pub/src/js/db/Char/Dori.js: FeatureDamageMultihit normal_hit_2
  {
    name: "normal_hit_2",
    category: "attack",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2_1") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2_2") }] },
    ],
  },
  // raw: FeatureDamageNormal normal_hit_2_1 (isChild:true, but fixture tests it → emit)
  {
    name: "normal_hit_2_1",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2_1") }],
  },
  // raw: FeatureDamageNormal normal_hit_2_2 (isChild:true, but fixture tests it → emit)
  {
    name: "normal_hit_2_2",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2_2") }],
  },
  // raw: FeatureDamageNormal normal_hit_3 (s1.p4)
  {
    name: "normal_hit_3",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }],
  },
  // --- Charged attacks ---
  // raw: FeatureDamageCharged charged_spin (s1.p5)
  {
    name: "charged_spin",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_spin") }],
  },
  // raw: FeatureDamageCharged charged_final (s1.p6)
  {
    name: "charged_final",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_final") }],
  },
  // --- Plunge attacks ---
  // raw: FeatureDamagePlungeCollision plunge (s1.p9)
  {
    name: "plunge",
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge") }],
  },
  // raw: FeatureDamagePlungeShockWave plunge_low (s1.p10)
  {
    name: "plunge_low",
    tags: ["plunge_shockwave"],
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_low") }],
  },
  // raw: FeatureDamagePlungeShockWave plunge_high (s1.p11)
  {
    name: "plunge_high",
    tags: ["plunge_shockwave"],
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_high") }],
  },
  // --- Skill: Troubleshooter Cannon (electro ATK-scaled) ---
  // raw: FeatureDamageSkill dori_troubleshooter_shot_dmg, element:'electro' (s2.p1)
  {
    name: "dori_troubleshooter_shot_dmg",
    category: "skill",
    element: "electro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.dori_troubleshooter_shot_dmg") }],
  },
  // raw: FeatureDamageSkill dori_aftersales_service_round_dmg, element:'electro' (s2.p2)
  {
    name: "dori_aftersales_service_round_dmg",
    category: "skill",
    element: "electro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.dori_aftersales_service_round_dmg") }],
  },
  // --- C2 "Special Franchise": cons-added electro skill hit (50% ATK, fixed,
  // not talent-leveled). Raw class is FeatureDamageSkill → damageType:"skill".
  // Raw: Dori.js features array, FeatureDamageSkill({ name:'dori_special_franchise',
  // element:'electro', ValueTable([50]), condition:ConditionConstellation(2) }).
  {
    name: "dori_special_franchise",
    category: "skill",
    element: "electro",
    condition: { type: "constellation", constellation: 2 },
    multipliers: [
      {
        source: "constellation2",
        leveling: "char_skill_elemental",
        values: { getValue: (_level: number) => 50 },
      },
    ],
  },
  // --- Burst: Alcazarzaray's Exactitude (electro ATK-scaled) ---
  // raw: FeatureDamageBurst dori_connector_dmg, element:'electro' (s3.p1)
  {
    name: "dori_connector_dmg",
    category: "burst",
    element: "electro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.dori_connector_dmg") }],
  },
  // --- Burst heal: burst.heal_dot = Connector per-tick heal (FeatureHeal, HP-scaled list) ---
  // FeatureMultiplierList scaling:'hp*', getList('burst.heal_dot') = [s3.p2 (%), s3.p3 (flat)].
  // No healing-bonus passive (EM ascension) → heal = base. raw/.../Char/Dori.js:95-102,315-325.
  {
    name: "heal_dot",
    category: "burst",
    output: { kind: "heal" },
    multipliers: [
      { scaling: "hp", leveling: "char_skill_burst", values: talents.get("burst.heal_dot_percent"), flatValues: talents.get("burst.heal_dot_flat") },
    ],
  },
  // --- skill.dori_compound_interest: A4 "Compound Interest" ER recharge readout (FeaturePostEffectValue → static) ---
  // Raw Dori.js:281-291 — PostEffectStatsRecharge({ percent: StatTable('', [5]), statCap: ValueTable([15]) }),
  // format:'decimal'. It's a RECHARGE-scaled static (value × recharge_total_decimal), not an energy stat: her
  // getTree = value(=5) × recharge_decimal (isPercent('') FALSE → no /100; decimal format → no ×100), capped at 15.
  // In our engine (getValue/100) × recharge_total(PERCENT, e.g. 200) = 5/100 × recharge_percent = 5 × recharge_decimal
  // → getValue = raw StatTable constant 5; capValue = raw statCap 15 (display units, inert here). Modelled WITHOUT
  // the A4 gate (canonical value the oracle dumps). NEVER baked. (Reclassified from energy sub-project.)
  {
    name: "dori_compound_interest",
    category: "skill",
    output: { kind: "static" },
    multipliers: [
      { scaling: "recharge_total", leveling: "", values: { getValue: () => 5 }, capValue: 15 },
    ],
  },
];

// ---------------------------------------------------------------------------
// Constellation conditions (P2.C)
// ---------------------------------------------------------------------------
// C1: ConditionStatic display-only. SKIP.
// C2: ConditionStatic display-only (text_percent:50). Actual damage is the
//   dori_special_franchise feature above. No flat stat needed.
// C3: +3 levels to Troubleshooter Cannon (elemental skill). Raw cons[2]
//   settings char_skill_elemental_bonus:3. Raw Dori.js:367-374.
// C4: ConditionBoolean toggles (healing_recv:50, recharge:30) — SKIP (toggles OFF).
// C5: +3 levels to Alcazarzaray's Exactitude (burst). Raw cons[4] settings
//   char_skill_burst_bonus:3. Raw Dori.js:396-403.
// C6: Condition {allowed_infusion_electro:1} + ConditionBoolean toggle for
//   electro infusion + dori_sprinkling_weight heal feature. Toggle OFF in
//   constellations config → no infusion → normals stay physical. SKIP.
const constellationConditions: readonly Condition[] = [
  // C3: +3 levels to elemental skill (Troubleshooter Cannon).
  { type: "constellation", constellation: 3, settings: { char_skill_elemental_bonus: 3 } },
  // C5: +3 levels to burst (Alcazarzaray's Exactitude).
  { type: "constellation", constellation: 5, settings: { char_skill_burst_bonus: 3 } },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const dori: DbObjectChar = {
  name: "dori",
  gameId: 10000068,
  rarity: 4,
  element: "electro",
  weapon: "claymore",
  origin: "sumeru",
  statTable: DoriStatTable,
  talents,
  features,
  multipliers: [],
  conditions: constellationConditions,
  // C4 "Discretionary Supplement" — +50% Healing Received, +30% Energy Recharge.
  // Source: raw/genshin_calc_pub/src/js/db/Char/Dori.js:124,126-127 (TalentValues)
  partyData: {
    conditions: [
      {
        type: "static",
        stats: { healing_recv: 50 },
        condition: { type: "boolean", name: "party.dori_discretionary_supplement_1" },
      },
      {
        type: "static",
        stats: { recharge: 30 },
        condition: { type: "boolean", name: "party.dori_discretionary_supplement_2" },
      },
    ],
  },
};
