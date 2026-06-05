/**
 * Kirara — dendro sword ATK+HP scaler.
 *
 * 4-hit normal combo (n3: 2-hit multihit → children _3_1/_3_2), charged 3-hit
 * multihit (children _1/_2/_3 + parent total), plunge/low/high, dendro skill
 * (flying kick, urgent neko parcel, flipclaw strike), dendro burst (burst_dmg +
 * cat grass explosion). Shield features (empty damageType) are not tested.
 *
 * A4 "Pupillary Variance": HP→dmg_skill_kirara and HP→dmg_burst_kirara post-effects
 * (A4SkillBonus=0.4 → ratio 0.4/1000, A4BurstBonus=0.3 → ratio 0.3/1000).
 * ConditionAscensionChar(4) → auto-active at ascension 6.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Kirara.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Kirara)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Kirara)
 */

import type {
  CharPostEffect,
  Condition,
  DbObjectChar,
  Feature,
  TalentResolver,
} from "@genshin/types";
import { Kirara as KiraraStatTable } from "../generated/charTables.js";
import { Kirara as KiraraTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return KiraraTalents.s1.p1;
      if (name === "normal_hit_2") return KiraraTalents.s1.p2;
      if (name === "normal_hit_3_1") return KiraraTalents.s1.p3;
      if (name === "normal_hit_3_2") return KiraraTalents.s1.p4;
      if (name === "normal_hit_4") return KiraraTalents.s1.p5;
      if (name === "charged_hit_1") return KiraraTalents.s1.p6;
      if (name === "charged_hit_2") return KiraraTalents.s1.p7;
      if (name === "charged_hit_3") return KiraraTalents.s1.p8;
      if (name === "plunge") return KiraraTalents.s1.p10;
      if (name === "plunge_low") return KiraraTalents.s1.p11;
      if (name === "plunge_high") return KiraraTalents.s1.p12;
    }
    if (talent === "skill") {
      if (name === "kirara_flying_kick_dmg") return KiraraTalents.s2.p1;
      if (name === "kirara_urgent_neko_parcel_dmg") return KiraraTalents.s2.p7;
      if (name === "kirara_flipclaw_strike_dmg") return KiraraTalents.s2.p9;
    }
    if (talent === "burst") {
      if (name === "burst_dmg") return KiraraTalents.s3.p1;
      if (name === "kirara_cat_grass_explosion_dmg") return KiraraTalents.s3.p2;
    }
    throw new Error(`kirara talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Post-effects (A4 "Pupillary Variance": HP → skill/burst DMG bonus)
// A4SkillBonus=0.4 → ratio 0.4/1000=0.0004 (her percent/1000 fold).
// A4BurstBonus=0.3 → ratio 0.3/1000=0.0003.
// Writes a percent value (e.g. HP*0.0004 ≈ 12.6) → buildStats emits /100 as fraction.
// ConditionAscensionChar(ascension=4) → auto-active at canonical ascension 6.
// raw/genshin_calc_pub/src/js/db/Char/Kirara.js postEffects + TalentValues
// ---------------------------------------------------------------------------

const hpToSkillDmg: CharPostEffect = {
  priority: 1,
  fromStat: "hp",
  toStat: "dmg_skill_kirara",
  ratio: 0.4 / 1000,
  // ConditionAscensionChar(4): true at ascension 6 → unconditional under canonical build
};

const hpToBurstDmg: CharPostEffect = {
  priority: 1,
  fromStat: "hp",
  toStat: "dmg_burst_kirara",
  ratio: 0.3 / 1000,
  // ConditionAscensionChar(4): true at ascension 6 → unconditional under canonical build
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks ---
  // raw/genshin_calc_pub/src/js/db/Char/Kirara.js: FeatureDamageNormal normal_hit_1
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
  // raw: FeatureDamageMultihit normal_hit_3 (parent = sum of _3_1 + _3_2)
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
  // raw: FeatureDamageMultihit charged_hit_total (parent = sum of _1+_2+_3)
  {
    name: "charged_hit_total",
    category: "attack",
    damageType: "charged",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit_1") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit_2") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit_3") }] },
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
  // raw: FeatureDamageCharged charged_hit_3 (isChild:true → drop isChild to emit)
  {
    name: "charged_hit_3",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit_3") }],
  },
  // --- Plunge attacks ---
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
  // --- Skill: Meow-teor Kick (dendro) ---
  // raw: FeatureDamageSkill kirara_flying_kick_dmg damageBonuses:['dmg_skill_kirara']
  {
    name: "kirara_flying_kick_dmg",
    category: "skill",
    element: "dendro",
    damageBonuses: ["dmg_skill_kirara"],
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.kirara_flying_kick_dmg") }],
  },
  // raw: FeatureDamageSkill kirara_urgent_neko_parcel_dmg damageBonuses:['dmg_skill_kirara']
  {
    name: "kirara_urgent_neko_parcel_dmg",
    category: "skill",
    element: "dendro",
    damageBonuses: ["dmg_skill_kirara"],
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.kirara_urgent_neko_parcel_dmg") }],
  },
  // raw: FeatureDamageSkill kirara_flipclaw_strike_dmg damageBonuses:['dmg_skill_kirara']
  {
    name: "kirara_flipclaw_strike_dmg",
    category: "skill",
    element: "dendro",
    damageBonuses: ["dmg_skill_kirara"],
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.kirara_flipclaw_strike_dmg") }],
  },
  // --- Burst: Surprise Dispatch (dendro) ---
  // raw: FeatureDamageBurst burst_dmg damageBonuses:['dmg_burst_kirara']
  {
    name: "burst_dmg",
    category: "burst",
    element: "dendro",
    damageBonuses: ["dmg_burst_kirara"],
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") }],
  },
  // raw: FeatureDamageBurst kirara_cat_grass_explosion_dmg damageBonuses:['dmg_burst_kirara']
  {
    name: "kirara_cat_grass_explosion_dmg",
    category: "burst",
    element: "dendro",
    damageBonuses: ["dmg_burst_kirara"],
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.kirara_cat_grass_explosion_dmg") }],
  },
  // --- C1 "Material Circulation": extra burst explosion that scales with HP.
  // Raw: FeatureDamageBurst kirara_cat_grass_explosion_extra_dmg, FeatureMultiplierKiraraBurst
  // (floor(HP/8000) capped at 4), damageBonuses:['dmg_burst_kirara'], cannotReact:true.
  // Raw: Kirara.js:427-439. ConditionConstellation(1).
  // RUNTIME COEFFICIENT (M1): coefficientFromStat floor(hp_total/8000) capped at 4.
  // At the fixed build (HP=31503.32 → floor(/8000)=3) → same result as scalingMultiplier:3.
  // Tracks any HP build (desyncs off-build with the old constant fold).
  {
    name: "kirara_cat_grass_explosion_extra_dmg",
    category: "burst",
    element: "dendro",
    damageBonuses: ["dmg_burst_kirara"],
    condition: { type: "constellation", constellation: 1 },
    multipliers: [
      {
        leveling: "char_skill_burst",
        values: talents.get("burst.kirara_cat_grass_explosion_dmg"),
        coefficientFromStat: { stat: "hp", divisor: 8000, cap: 4 },
        source: "constellation1",
      },
    ],
  },
  // --- C4 "Steed of Skanda": coordinated attack (200% ATK, fixed value).
  // Raw: FeatureDamageBurst kirara_coordinated_dmg, ValueTable([200]), damageBonuses:['dmg_burst_kirara'].
  // Raw: Kirara.js:440-451. ConditionConstellation(4).
  {
    name: "kirara_coordinated_dmg",
    category: "burst",
    element: "dendro",
    damageBonuses: ["dmg_burst_kirara"],
    condition: { type: "constellation", constellation: 4 },
    multipliers: [
      {
        leveling: "char_skill_burst",
        values: { getValue: (_level: number) => 200 },
        source: "constellation4",
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Constellation conditions (P2.C)
// ---------------------------------------------------------------------------
// C1 "Material Circulation": ConditionStatic text_value_hp → display-only; actual damage
//   is kirara_cat_grass_explosion_extra_dmg feature above. Raw Kirara.js:493-503.
// C2 "Perfectly Packaged": ConditionStatic text_percent_shield → display-only; the
//   kirara_party_shield feature (damageType:"") is gated by constellation:2 in raw
//   but is not in the coverage gate. Raw Kirara.js:504-512.
// C3: +3 levels to Meow-teor Kick (skill). Raw Kirara.js:513-521 char_skill_elemental_bonus:3.
// C4: ConditionStatic text_percent_atk → display-only; actual damage is kirara_coordinated_dmg
//   above. Raw Kirara.js:522-530.
// C5: +3 levels to Surprise Dispatch (burst). Raw Kirara.js:531-539 char_skill_burst_bonus:3.
// C6 "Countless Sights to See": ConditionBoolean toggle (dmg_<element>:12 for all) → SKIP.
const constellationConditions: readonly Condition[] = [
  // C3: +3 levels to Meow-teor Kick (elemental skill). Raw cons[2] settings.
  { type: "constellation", constellation: 3, settings: { char_skill_elemental_bonus: 3 } },
  // C5: +3 levels to Surprise Dispatch (elemental burst). Raw cons[4] settings.
  { type: "constellation", constellation: 5, settings: { char_skill_burst_bonus: 3 } },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const kirara: DbObjectChar = {
  name: "kirara",
  gameId: 10000061,
  rarity: 4,
  element: "dendro",
  weapon: "sword",
  origin: "inazuma",
  statTable: KiraraStatTable,
  talents,
  features,
  multipliers: [],
  conditions: constellationConditions,
  postEffects: [hpToSkillDmg, hpToBurstDmg],
  // C6 "Countless Sights to See" — +12% ALL element DMG to party.
  // Source: raw/genshin_calc_pub/src/js/db/Char/Kirara.js (partyData conditions)
  partyData: {
    conditions: [
      {
        type: "static",
        stats: {
          dmg_anemo: 12,
          dmg_geo: 12,
          dmg_pyro: 12,
          dmg_electro: 12,
          dmg_hydro: 12,
          dmg_cryo: 12,
          dmg_dendro: 12,
        },
        condition: { type: "boolean", name: "party.kirara_countless_sights_to_see" },
      },
    ],
  },
};
