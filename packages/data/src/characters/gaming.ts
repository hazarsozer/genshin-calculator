/**
 * Gaming — pyro claymore ATK scaler.
 *
 * 4-hit normal combo, charged spin/final, plunge/low/high (physical on normals,
 * pyro on skill plunge), pyro skill "Bestial Ascent" (gaming_charmed_cloudstrider_dmg
 * typed as PlungeShockWave with element=pyro, damageBonuses including A4 key),
 * and pyro burst "Suanni's Gilded Dance" (gaming_suanni_man_dmg).
 *
 * A4 "Air of Prosperity" (second subCondition): unconditional in fixed solo C0 build
 * — adds dmg_skill_gaming +20% (ConditionStatic + ConditionNot(gaming_air_of_prosperity)).
 * This is applied via damageBonuses on the skill plunge feature.
 *
 * Heals (skill.gaming_dance_of_amity_heal, burst.heal) modelled as output:{kind:"heal"} (P3.5.3).
 * C6 crit bonuses (crit_rate_gaming, crit_dmg_gaming) need constellation 6 → not active
 * in the C0 build; A4SkillBonus=20 is unconditional via static conditions.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Gaming.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Gaming)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Gaming)
 */

import type { Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Gaming as GamingStatTable } from "../generated/charTables.js";
import { Gaming as GamingTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return GamingTalents.s1.p1;
      if (name === "normal_hit_2") return GamingTalents.s1.p2;
      if (name === "normal_hit_3") return GamingTalents.s1.p3;
      if (name === "normal_hit_4") return GamingTalents.s1.p4;
      if (name === "charged_spin") return GamingTalents.s1.p5;
      if (name === "charged_final") return GamingTalents.s1.p6;
      if (name === "plunge") return GamingTalents.s1.p9;
      if (name === "plunge_low") return GamingTalents.s1.p10;
      if (name === "plunge_high") return GamingTalents.s1.p11;
    }
    if (talent === "skill") {
      if (name === "gaming_charmed_cloudstrider_dmg") return GamingTalents.s2.p1;
    }
    if (talent === "burst") {
      if (name === "gaming_suanni_man_dmg") return GamingTalents.s3.p1;
      if (name === "heal") return GamingTalents.s3.p2;
    }
    throw new Error(`gaming talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (physical claymore) ---
  // raw/genshin_calc_pub/src/js/db/Char/Gaming.js: FeatureDamageNormal normal_hit_1
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
  // raw: FeatureDamageNormal normal_hit_3
  {
    name: "normal_hit_3",
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
  // raw: FeatureDamageCharged charged_spin
  {
    name: "charged_spin",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_spin") }],
  },
  // raw: FeatureDamageCharged charged_final
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
  // --- Skill: Bestial Ascent (pyro plunge) ---
  // raw: FeatureDamagePlungeShockWave gaming_charmed_cloudstrider_dmg
  // category='skill', element='pyro', damageBonuses=['dmg_skill_gaming']
  // A4 "Air of Prosperity" (second ConditionStatic): adds dmg_skill_gaming=20
  // unconditional in fixed solo C0 build → damageBonuses picks it up.
  // Gaming.js:214-227
  {
    name: "gaming_charmed_cloudstrider_dmg",
    tags: ["plunge_shockwave"],
    category: "skill",
    element: "pyro",
    damageType: "plunge",
    damageBonuses: ["dmg_skill_gaming"],
    // C6 "Adroit Spirit": +20% CR / +40% CD to this hit (crit_rate_gaming / crit_dmg_gaming,
    // contributed by the C6 condition). Constellation-gated → 0 at C0..C5, base-safe.
    // Raw Gaming.js:218-220.
    critRateBonuses: ["crit_rate_gaming"],
    critDamageBonuses: ["crit_dmg_gaming"],
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.gaming_charmed_cloudstrider_dmg") }],
  },
  // --- Burst: Suanni's Gilded Dance (pyro) ---
  // raw: FeatureDamageBurst gaming_suanni_man_dmg, element='pyro'
  // Gaming.js:240-249
  {
    name: "gaming_suanni_man_dmg",
    category: "burst",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.gaming_suanni_man_dmg") }],
  },
  // --- Skill heal (FeatureHeal): skill.gaming_dance_of_amity_heal — A1 "Plunging Attack" heal ---
  // Flat A1Heal = 1.5% Max HP (ValueTable constant), HP-scaled, auto-active at A6.
  // raw/genshin_calc_pub/src/js/db/Char/Gaming.js:228-239,112 (scaling:'hp*', ValueTable([A1Heal=1.5]))
  {
    name: "gaming_dance_of_amity_heal",
    category: "skill",
    output: { kind: "heal" },
    multipliers: [
      { scaling: "hp", leveling: "char_skill_elemental", values: { getValue: () => 1.5 } },
    ],
  },
  // --- Burst heal (FeatureHeal): burst.heal — HP-scaled (s3.p2), single FeatureMultiplier (no flat) ---
  // raw/genshin_calc_pub/src/js/db/Char/Gaming.js:250-260 (scaling:'hp*', char_skill_burst)
  {
    name: "heal",
    category: "burst",
    output: { kind: "heal" },
    multipliers: [
      { scaling: "hp", leveling: "char_skill_burst", values: talents.get("burst.heal") },
    ],
  },
  // --- C1 "Bringer of Blessing" burst heal (burst.gaming_bringer_of_blessing_heal) ---
  // raw: FeatureHeal({ category:'burst', multipliers:[FeatureMultiplier({ scaling:'hp*',
  //   leveling:'char_skill_burst', values:new ValueTable([TalentValues.C1Heal=15]) })],
  //   condition:ConditionConstellation({constellation:1}) })  Gaming.js:263-272. Constant value
  // (ValueTable single entry) but leveled per raw's own `leveling:'char_skill_burst'` field, same
  // shape as fischl_her_pilgrimage_of_bleak's constant-leveled multiplier.
  {
    name: "gaming_bringer_of_blessing_heal",
    category: "burst",
    output: { kind: "heal" },
    condition: { type: "constellation", constellation: 1 },
    multipliers: [
      { scaling: "hp", leveling: "char_skill_burst", values: { getValue: () => 15 }, source: "constellation1" },
    ],
  },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Constellation conditions (P2.C Wave-1)
// ---------------------------------------------------------------------------
// C1 "Bringer of Blessing": text_percent_heal (display-only) is inert; the actual heal is the
//   burst.gaming_bringer_of_blessing_heal FeatureHeal above (display-gap burndown Task 3).
// C2 "Plum Blossoms Underfoot": SELF ConditionBoolean toggle (atk_percent:20), gated C2. Now
//   ported (was a golden-blind SKIP — no golden toggles it).
// C4 "Soar Across Mountains": ConditionStatic no real stats → SKIP.
//
// Always-on at C6 build: C3 (+3 skill talent), C5 (+3 burst talent),
// C6 ConditionStatic with REAL stats crit_rate_gaming=20, crit_dmg_gaming=40
// (TalentValues: C6CritRate=20, C6CritDmg=40).
// Sources: raw/genshin_calc_pub/src/js/db/Char/Gaming.js:314-377

const constellationConditions: readonly Condition[] = [
  // C2 "Plum Blossoms Underfoot" — SELF toggle granting +20% ATK, gated C2. Raw cons[1]:
  // ConditionBoolean{ name:'gaming_plum_blossoms_underfoot', stats:{ atk_percent:20 } }.
  // Modelled as a boolean toggle with a constellation-2 sub-gate.
  {
    type: "boolean",
    name: "gaming_plum_blossoms_underfoot",
    stats: { atk_percent: 20 },
    condition: { type: "constellation", constellation: 2 },
  },
  // C3 "Unleashing the Fearless" — +3 Elemental Skill (Bestial Ascent).
  // Raw cons[2]: new Condition({ settings: { char_skill_elemental_bonus: 3 } }).
  { type: "constellation", constellation: 3, settings: { char_skill_elemental_bonus: 3 } },
  // C5 "Evolution!" — +3 Elemental Burst (Suanni's Gilded Dance).
  // Raw cons[4]: new Condition({ settings: { char_skill_burst_bonus: 3 } }).
  { type: "constellation", constellation: 5, settings: { char_skill_burst_bonus: 3 } },
  // C6 "To Tame All Beasts" — crit_rate_gaming +20%, crit_dmg_gaming +40%.
  // Raw cons[5]: ConditionStatic({ stats: { crit_rate_gaming: 20, crit_dmg_gaming: 40 } }).
  // Always active at C6 — no toggle (ConditionStatic, not ConditionBoolean).
  { type: "constellation", constellation: 6, stats: { crit_rate_gaming: 20, crit_dmg_gaming: 40 } },
];

// A4 "Air of Prosperity" second subCondition: ConditionStatic + ConditionNot(gaming_air_of_prosperity).
// At canonical C0 ascension-6 build, gaming_air_of_prosperity is not toggled (ConditionBoolean
// defaults to false), so ConditionNot evaluates true and dmg_skill_gaming=20 is active unconditionally.
// raw/genshin_calc_pub/src/js/db/Char/Gaming.js:299-313
const BASE_STATS: Record<string, number> = { dmg_skill_gaming: 20 };

export const gaming: DbObjectChar = {
  name: "gaming",
  gameId: 10000092,
  rarity: 4,
  element: "pyro",
  weapon: "claymore",
  origin: "liyue",
  statTable: GamingStatTable,
  talents,
  features,
  multipliers: [],
  baseStats: BASE_STATS,
  conditions: constellationConditions,
};
