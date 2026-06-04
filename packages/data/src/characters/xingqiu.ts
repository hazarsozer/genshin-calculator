/**
 * Xingqiu — hydro sword ATK scaler.
 *
 * 5-hit normal combo (n3: 2-hit multihit → child _3_1; n5: 2-hit multihit → child _5_1),
 * charged 2-hit multihit (total + children _1/_2), plunge/low/high,
 * skill_dmg 2-hit multihit parent (skill_1 + skill_2 are modelled as children),
 * hydro burst (rain sword hit).
 *
 * A4 "Blades Amidst Raindrops": +20% hydro DMG — auto-active at A6 (ConditionStatic
 * gated only by ConditionAscensionChar({ascension:4})). Folded into baseStats.
 *
 * A1 "Hydropathic" (heal on rain sword) and skill dmg_reduction (FeaturePostEffectValue)
 * are display-only (damageType: "") — not tested by golden harness; omitted here.
 *
 * Skill hits (xingqiu_skill_1_dmg / xingqiu_skill_2_dmg) are isChild:true in raw →
 * they emit as standalone features; skill_dmg is the multihit parent total.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Xingqiu.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Xingqiu)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Xingqiu)
 */

import type { Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Xingqiu as XingqiuStatTable } from "../generated/charTables.js";
import { Xingqiu as XingqiuTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return XingqiuTalents.s1.p1;
      if (name === "normal_hit_2") return XingqiuTalents.s1.p2;
      if (name === "normal_hit_3") return XingqiuTalents.s1.p3;
      if (name === "normal_hit_4") return XingqiuTalents.s1.p5;
      if (name === "normal_hit_5") return XingqiuTalents.s1.p6;
      if (name === "charged_hit_1") return XingqiuTalents.s1.p8;
      if (name === "charged_hit_2") return XingqiuTalents.s1.p9;
      if (name === "plunge") return XingqiuTalents.s1.p11;
      if (name === "plunge_low") return XingqiuTalents.s1.p12;
      if (name === "plunge_high") return XingqiuTalents.s1.p13;
    }
    if (talent === "skill") {
      if (name === "xingqiu_skill_1_dmg") return XingqiuTalents.s2.p1;
      if (name === "xingqiu_skill_2_dmg") return XingqiuTalents.s2.p2;
    }
    if (talent === "burst") {
      if (name === "xingqiu_rain_sword") return XingqiuTalents.s3.p1;
    }
    throw new Error(`xingqiu talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks ---
  // raw: FeatureDamageNormal normal_hit_1 (Xingqiu.js:135-142)
  {
    name: "normal_hit_1",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1") }],
  },
  // raw: FeatureDamageNormal normal_hit_2 (Xingqiu.js:143-150)
  {
    name: "normal_hit_2",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2") }],
  },
  // raw: FeatureDamageMultihit normal_hit_3 (2 hits × p3). Parent = total.
  // raw/genshin_calc_pub/src/js/db/Char/Xingqiu.js:151-167
  {
    name: "normal_hit_3",
    category: "attack",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }] },
    ],
  },
  // raw: FeatureDamageNormal normal_hit_3_1 (isChild:true, one of the 2 hits).
  // raw/genshin_calc_pub/src/js/db/Char/Xingqiu.js:168-178
  {
    name: "normal_hit_3_1",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }],
  },
  // raw: FeatureDamageNormal normal_hit_4 (Xingqiu.js:179-186, p5 in talent table)
  {
    name: "normal_hit_4",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4") }],
  },
  // raw: FeatureDamageMultihit normal_hit_5 (2 hits × p6). Parent = total.
  // raw/genshin_calc_pub/src/js/db/Char/Xingqiu.js:187-203
  {
    name: "normal_hit_5",
    category: "attack",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_5") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_5") }] },
    ],
  },
  // raw: FeatureDamageNormal normal_hit_5_1 (isChild:true, one of the 2 hits).
  // raw/genshin_calc_pub/src/js/db/Char/Xingqiu.js:204-214
  {
    name: "normal_hit_5_1",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_5") }],
  },
  // --- Charged attacks ---
  // raw: FeatureDamageMultihit charged_hit_total (hit_1 + hit_2). Parent = total.
  // raw/genshin_calc_pub/src/js/db/Char/Xingqiu.js:215-238
  {
    name: "charged_hit_total",
    category: "attack",
    damageType: "charged",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit_1") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit_2") }] },
    ],
  },
  // raw: FeatureDamageCharged charged_hit_1 (isChild:true). Xingqiu.js:239-248
  {
    name: "charged_hit_1",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit_1") }],
  },
  // raw: FeatureDamageCharged charged_hit_2 (isChild:true). Xingqiu.js:249-258
  {
    name: "charged_hit_2",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit_2") }],
  },
  // --- Plunge attacks ---
  // raw: FeatureDamagePlungeCollision plunge. Xingqiu.js:257-264
  {
    name: "plunge",
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge") }],
  },
  // raw: FeatureDamagePlungeShockWave plunge_low. Xingqiu.js:265-272
  {
    name: "plunge_low",
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_low") }],
  },
  // raw: FeatureDamagePlungeShockWave plunge_high. Xingqiu.js:273-280
  {
    name: "plunge_high",
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_high") }],
  },
  // --- Skill: Fatal Rainscreen (hydro) ---
  // skill_dmg: 2-hit multihit parent (skill_1 + skill_2). Xingqiu.js:281-317
  {
    name: "skill_dmg",
    category: "skill",
    element: "hydro",
    items: [
      { multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.xingqiu_skill_1_dmg") }] },
      { multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.xingqiu_skill_2_dmg") }] },
    ],
  },
  // raw: FeatureDamageSkill xingqiu_skill_1_dmg (isChild:true). Xingqiu.js:318-333
  {
    name: "xingqiu_skill_1_dmg",
    category: "skill",
    element: "hydro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.xingqiu_skill_1_dmg") }],
  },
  // raw: FeatureDamageSkill xingqiu_skill_2_dmg (isChild:true). Xingqiu.js:334-349
  {
    name: "xingqiu_skill_2_dmg",
    category: "skill",
    element: "hydro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.xingqiu_skill_2_dmg") }],
  },
  // --- Burst: Guhua Sword: Raincutter (hydro) ---
  // raw: FeatureDamageBurst xingqiu_rain_sword. Xingqiu.js:376-384
  {
    name: "xingqiu_rain_sword",
    category: "burst",
    element: "hydro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.xingqiu_rain_sword") }],
  },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Constellations (P2.C Wave-1)
// ---------------------------------------------------------------------------
// C1: ConditionStatic no real stats → SKIP.
// C2: ConditionBoolean toggle (enemy_res_hydro:-15) → SKIP.
// C3 "Weaver of Verses" — +3 Burst talent levels (constellation[2]).
//   raw/genshin_calc_pub/src/js/db/Char/Xingqiu.js:446-451.
// C4: ConditionBoolean toggle → SKIP.
// C5 "Embrace of Rain" — +3 Elemental Skill talent levels (char-level conditions:).
//   raw/genshin_calc_pub/src/js/db/Char/Xingqiu.js:387-393.
// C6: ConditionStatic no real stats → SKIP.

const constellationConditions: readonly Condition[] = [
  // C3 — char_skill_burst_bonus +3 (burst talent level up).
  { type: "constellation", constellation: 3, settings: { char_skill_burst_bonus: 3 } },
  // C5 — char_skill_elemental_bonus +3 (skill talent level up).
  { type: "constellation", constellation: 5, settings: { char_skill_elemental_bonus: 3 } },
];

export const xingqiu: DbObjectChar = {
  name: "xingqiu",
  gameId: 10000025,
  rarity: 4,
  element: "hydro",
  weapon: "sword",
  origin: "liyue",
  statTable: XingqiuStatTable,
  talents,
  features,
  multipliers: [],
  // A4 "Blades Amidst Raindrops": +20% hydro DMG bonus — auto-active at A6
  // (ConditionStatic gated only by ConditionAscensionChar({ascension:4})).
  // raw/genshin_calc_pub/src/js/db/Char/Xingqiu.js:406-416
  baseStats: { dmg_hydro: 20 },
  conditions: constellationConditions,
  // C2 "Rainbow Upon the Azure Sky" — enemy Hydro RES -15%.
  // Source: raw/genshin_calc_pub/src/js/db/Char/Xingqiu.js (partyData conditions)
  partyData: {
    conditions: [
      {
        type: "static",
        stats: { enemy_res_hydro: -15 },
        condition: { type: "boolean", name: "party.xingqiu_rainbow_upon_the_azure_sky" },
      },
    ],
  },
};
