/**
 * Candace — hydro polearm HP scaler.
 *
 * 4-hit normal combo (n3: 2-hit multihit → children _3_1/_3_2), charged hit,
 * plunge/low/high (physical), hydro skill (candace_press_dmg HP-scaling,
 * candace_hold_dmg HP-scaling), hydro burst (burst_dmg HP, candace_wave_dmg HP).
 *
 * HP-scaling multipliers use scaling:'hp' (Layla pattern):
 *   candace_press_dmg: s2.p3 (HP%)
 *   candace_hold_dmg:  s2.p4 (HP%)
 *   burst_dmg:         s3.p1 (HP%)
 *   candace_wave_dmg:  s3.p4 (HP%)
 *
 * The burst also emits candace_dmg_bonus (FeaturePostEffectValue, percent display)
 * and skill.shield (FeatureShield, HP-scaling) — both have empty damageType →
 * not tested by the golden suite.
 *
 * Burst infusion of PARTY normals is a party buff, NOT Candace's own damage.
 * candace_the_overflow_dmg is C6-gated (constellation 6, fixed 15% HP per hit).
 *
 * A4 "Celestial Dome of Sand" adds HP%-based dmg_normal_* bonuses active when
 * prayer_of_the_crimson_crown condition is toggled ON (ConditionBoolean). In the
 * fixed canonical C0 build with no conditions toggled, this is inactive.
 * No baseStats needed.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Candace.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Candace)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Candace)
 */

import type { Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Candace as CandaceStatTable } from "../generated/charTables.js";
import { Candace as CandaceTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1")   return CandaceTalents.s1.p1;
      if (name === "normal_hit_2")   return CandaceTalents.s1.p2;
      if (name === "normal_hit_3_1") return CandaceTalents.s1.p3;
      if (name === "normal_hit_3_2") return CandaceTalents.s1.p4;
      if (name === "normal_hit_4")   return CandaceTalents.s1.p5;
      if (name === "charged_hit")    return CandaceTalents.s1.p6;
      if (name === "plunge")         return CandaceTalents.s1.p8;
      if (name === "plunge_low")     return CandaceTalents.s1.p9;
      if (name === "plunge_high")    return CandaceTalents.s1.p10;
    }
    if (talent === "skill") {
      if (name === "candace_press_dmg") return CandaceTalents.s2.p3;
      if (name === "candace_hold_dmg")  return CandaceTalents.s2.p4;
    }
    if (talent === "burst") {
      if (name === "burst_dmg")          return CandaceTalents.s3.p1;
      if (name === "candace_wave_dmg")   return CandaceTalents.s3.p4;
    }
    throw new Error(`candace talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (physical polearm) ---
  // raw/genshin_calc_pub/src/js/db/Char/Candace.js: FeatureDamageNormal normal_hit_1
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
  // raw: FeatureDamageMultihit normal_hit_3 (items: [p3, p4]) — parent = _3_1 + _3_2
  // Candace.js:175-198
  {
    name: "normal_hit_3",
    category: "attack",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3_1") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3_2") }] },
    ],
  },
  // raw: FeatureDamageNormal normal_hit_3_1 (isChild:true → drop to emit)
  // Candace.js:199-208
  {
    name: "normal_hit_3_1",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3_1") }],
  },
  // raw: FeatureDamageNormal normal_hit_3_2 (isChild:true → drop to emit)
  // Candace.js:209-218
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
  // --- Charged attack ---
  // raw: FeatureDamageCharged charged_hit
  // Candace.js:228-237
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
  // --- Skill: Heron's Sanctum (hydro) ---
  // raw: FeatureDamageSkill candace_press_dmg, element='hydro', HP-scaling (s2.p3)
  // Candace.js:264-274
  {
    name: "candace_press_dmg",
    category: "skill",
    element: "hydro",
    multipliers: [{ scaling: "hp", leveling: "char_skill_elemental", values: talents.get("skill.candace_press_dmg") }],
  },
  // raw: FeatureDamageSkill candace_hold_dmg, element='hydro', HP-scaling (s2.p4)
  // Candace.js:275-285
  {
    name: "candace_hold_dmg",
    category: "skill",
    element: "hydro",
    multipliers: [{ scaling: "hp", leveling: "char_skill_elemental", values: talents.get("skill.candace_hold_dmg") }],
  },
  // --- Burst: Wagtail's Tide (hydro) ---
  // raw: FeatureDamageBurst burst_dmg, element='hydro', HP-scaling (s3.p1)
  // Candace.js:298-308
  {
    name: "burst_dmg",
    category: "burst",
    element: "hydro",
    multipliers: [{ scaling: "hp", leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") }],
  },
  // raw: FeatureDamageBurst candace_wave_dmg, element='hydro', HP-scaling (s3.p4)
  // Candace.js:309-319
  {
    name: "candace_wave_dmg",
    category: "burst",
    element: "hydro",
    multipliers: [{ scaling: "hp", leveling: "char_skill_burst", values: talents.get("burst.candace_wave_dmg") }],
  },
  // --- C6 "The Overflow": each normal attack infused by Candace's prayer deals extra
  // hydro burst DMG equal to 15% of Candace's Max HP. Cons-added FeatureDamageBurst,
  // gated by ConditionConstellation(6). Fixed HP% value (ValueTable([15])).
  // Raw Candace.js:320-332 — scaling:'hp*', source:'constellation6', values:ValueTable([15]).
  {
    name: "candace_the_overflow_dmg",
    category: "burst",
    element: "hydro",
    condition: { type: "constellation", constellation: 6 },
    multipliers: [
      {
        scaling: "hp",
        leveling: "char_skill_burst",
        values: { getValue: (_level: number) => 15 },
        source: "constellation6",
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Constellation conditions (P2.C)
// ---------------------------------------------------------------------------
// C1: ConditionStatic (display-only, no damage stats) → SKIP.
// C2: ConditionBoolean toggle (hp_percent:20) → SKIP (toggle OFF).
// C3: +3 levels to Wagtail's Tide (burst). Raw Candace.js cons[2] settings
//     char_skill_burst_bonus:3.
// C4: ConditionStatic (display-only) → SKIP.
// C5: +3 levels to Heron's Sanctum (skill). Raw Candace.js cons[4] settings
//     char_skill_elemental_bonus:3.
// C6: cons-added candace_the_overflow_dmg feature (above, gated in features array).
//     ConditionStatic with text_percent_dmg:15 (display-only) → SKIP here.
const constellationConditions: readonly Condition[] = [
  // C3: +3 levels to Wagtail's Tide (burst). Raw Candace.js cons[2].
  { type: "constellation", constellation: 3, settings: { char_skill_burst_bonus: 3 } },
  // C5: +3 levels to Heron's Sanctum (skill). Raw Candace.js cons[4].
  { type: "constellation", constellation: 5, settings: { char_skill_elemental_bonus: 3 } },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const candace: DbObjectChar = {
  name: "candace",
  gameId: 10000072,
  rarity: 4,
  element: "hydro",
  weapon: "polearm",
  origin: "sumeru",
  statTable: CandaceStatTable,
  talents,
  features,
  multipliers: [],
  conditions: constellationConditions,
  // partyData — BLOCKER: composite dmg_<type>_<element> bonus keys (dmg_normal_hydro etc.)
  // are NOT in buildStats' DMG_BONUS_TYPE_KEYS/ELEMENT_KEYS and not read by compileFeature.
  // The A4 "Celestial Dome of Sand" effect writes these keys but they have NO effect in
  // our engine. Requires an engine pass to:
  //   (a) extend buildStats emit to include composite dmg_<type>_<element> keys (7×5=35 keys),
  //   (b) extend compileFeature to read them in the damage bonus block.
  // Infusion (attack_infusion_hydro on sword/claymore/polearm via prayer toggle) is also
  // deferred to the party-setting infusion engine pass.
  // The partyData data port is DEFERRED until the engine supports composite bonus keys.
};
