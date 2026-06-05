/**
 * Hu Tao — full P1.7b character data (HP-scaling exemplar).
 *
 * Replaces the minimal P1.7a test stub with real CharTables / CharTalentTables data.
 * Features include all damage moves (attack/charged/plunge + skill blood blossom + burst),
 * the Paramita Papilio HP→ATK post-effect, and the Paramita condition.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Hutao.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js:1342
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js:2085
 */

import type {
  CharMultiplier,
  CharPostEffect,
  Condition,
  DbObjectChar,
  Feature,
  TalentResolver,
} from "@genshin/types";
import { Hutao as HutaoStatTable } from "../generated/charTables.js";
import { Hutao as HutaoTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return HutaoTalents.s1.p1;
      if (name === "normal_hit_2") return HutaoTalents.s1.p2;
      if (name === "normal_hit_3") return HutaoTalents.s1.p3;
      if (name === "normal_hit_4") return HutaoTalents.s1.p4;
      if (name === "normal_hit_5_1") return HutaoTalents.s1.p5;
      if (name === "normal_hit_5_2") return HutaoTalents.s1.p6;
      if (name === "normal_hit_6") return HutaoTalents.s1.p7;
      if (name === "charged_hit") return HutaoTalents.s1.p8;
      if (name === "plunge") return HutaoTalents.s1.p10;
      if (name === "plunge_low") return HutaoTalents.s1.p11;
      if (name === "plunge_high") return HutaoTalents.s1.p12;
    }
    if (talent === "skill") {
      if (name === "hutao_atk_bonus") return HutaoTalents.s2.p2;
      if (name === "hutao_blood_blossom") return HutaoTalents.s2.p3;
    }
    if (talent === "burst") {
      if (name === "burst_dmg") return HutaoTalents.s3.p1;
      if (name === "hutao_burst_dmg_lowhp") return HutaoTalents.s3.p2;
      if (name === "heal") return HutaoTalents.s3.p3;
      if (name === "hutao_heal_lowhp") return HutaoTalents.s3.p4;
    }
    throw new Error(`hu-tao talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Conditions
// ---------------------------------------------------------------------------

const paramita: Condition = {
  type: "boolean",
  name: "hutao_paramita_papilio",
  settings: { attack_infusion: "pyro" },
};

// ---------------------------------------------------------------------------
// Constellations (P2.C)
// ---------------------------------------------------------------------------
// Only the always-on cons effects the `constellations` (C6, toggles off) config
// exercises: C2 (Blood Blossom +10% Max HP), C3 (skill talent +3), C5 (burst
// talent +3). C1 (stamina) is inert; C4 (party CR on-kill) and C6 (revive + CR/RES
// on low-HP Blood Blossom) are toggles, validated by the toggles/cons-mid configs.

/**
 * C2 "Ominous Rainfall" — Blood Blossom DMG +10% of Max HP. A constellation-gated
 * char-level targeted multiplier on `skill`: `0.10 × hp_total` summed into Blood
 * Blossom's base term (the Albedo-C2 shape, P2.3). Gate false at C0/C1 → inert.
 *
 * Source: raw/genshin_calc_pub/src/js/db/Char/Hutao.js:416-426
 *   (FeatureMultiplier{ scaling:'hp*', source:'constellation2', values:ValueTable([10]),
 *    condition:ConditionConstellation(2), target:{damageTypes:['skill']} }).
 */
const C2_SKILL_HP_BONUS = 10;
const c2SkillHpMultiplier: CharMultiplier = {
  leveling: "",
  scaling: "hp*",
  source: "constellation2",
  values: { getValue: () => C2_SKILL_HP_BONUS },
  target: { damageTypes: ["skill"] },
  condition: { type: "constellation", constellation: 2 },
};

/**
 * C3 "Lingering Carmine" — +3 levels to Guide to Afterlife (Elemental Skill).
 * Modelled as her data does: a constellation-gated condition contributing the
 * `char_skill_elemental_bonus` settings key (no stats), which the talent-level
 * resolver adds to the skill level (her Feature.getTalentLevel; compileFeature
 * `baseDamageTerm`). So Blood Blossom compiles at skill level 10+3=13 from C3.
 *
 * Source: raw/genshin_calc_pub/src/js/db/Char/Hutao.js:373-378
 *   (ConditionConstellation{ constellation:3, settings:{char_skill_elemental_bonus:3} }).
 */
const c3SkillTalentBonus: Condition = {
  type: "constellation",
  constellation: 3,
  settings: { char_skill_elemental_bonus: 3 },
};

/**
 * C5 "Crimson Sky" — +3 levels to Spirit Soother (Elemental Burst). Contributes
 * `char_skill_burst_bonus`, added to the burst talent level by the resolver, so the
 * burst features compile at level 13 from C5. (In her data this lives in the
 * constellation array index 4; modelled here as a constellation-gated char condition
 * — identical effect via the channel the engine already iterates.)
 *
 * Source: raw/genshin_calc_pub/src/js/db/Char/Hutao.js:462-470
 *   (constellation[4] → Condition{ settings:{char_skill_burst_bonus:3} }).
 */
const c5BurstTalentBonus: Condition = {
  type: "constellation",
  constellation: 5,
  settings: { char_skill_burst_bonus: 3 },
};

// ---------------------------------------------------------------------------
// Post-effects
// ---------------------------------------------------------------------------

/**
 * HP→ATK conversion during Paramita Papilio (Guide to Afterlife skill).
 * The ratio is talent-scaled: `hutao_atk_bonus @ effective_skill_level × 0.01`.
 * At C0 (skill level 10): 6.256 × 0.01 = 0.06256.
 * At C6 (skill level 13, bumped by C3 +3 bonus): 7.152 × 0.01 = 0.07152.
 * `ratioFromTalent` resolves at runtime using `settings.char_skill_elemental` (base)
 * + `settings.char_skill_elemental_bonus` (C3 offset), mirroring her PostEffect.getLevel.
 * cap = 400% of atk_BASE. Her `statCapPost` base is a `from: 'atk_base'` term
 * (a plain makeStatItem('atk_base'), NOT getTotal) × an atk_percent[SkillMaxBonus=
 * 400] table → 4 × atk_base (Hutao.js:155-158). `capUsesBase: true` reads
 * `atk_base × 4`, not `getTotal('atk') × 4`, so the build's atk_percent / flat ATK
 * do not loosen the cap.
 *
 * Source: Hutao.js:145-159, PostEffect.js (getLevel)
 */
const hpToAtk: CharPostEffect = {
  priority: 1,
  fromStat: "hp",
  toStat: "atk",
  ratioFromTalent: {
    table: HutaoTalents.s2.p2,
    levelSetting: "char_skill_elemental",
    multi: 0.01,
  },
  cap: { capStat: "atk", capRatio: 4 },
  capUsesBase: true,
  conditions: [paramita],
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks ---
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
  {
    name: "normal_hit_3",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }],
  },
  {
    name: "normal_hit_4",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4") }],
  },
  // normal_hit_5: multihit (two sub-items), models the combined hit
  {
    name: "normal_hit_5",
    category: "attack",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_5_1") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_5_2") }] },
    ],
  },
  // Sub-hits of normal_hit_5 (individual components of the 2-part combo).
  {
    name: "normal_hit_5_1",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_5_1") }],
  },
  {
    name: "normal_hit_5_2",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_5_2") }],
  },
  {
    name: "normal_hit_6",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_6") }],
  },
  // --- Charged attack ---
  {
    name: "charged_hit",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }],
  },
  // --- Plunge attacks (her FeatureDamagePlunge: category="attack", damageType="plunge") ---
  {
    name: "plunge",
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge") }],
  },
  {
    name: "plunge_low",
    tags: ["plunge_shockwave"],
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_low") }],
  },
  {
    name: "plunge_high",
    tags: ["plunge_shockwave"],
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_high") }],
  },
  // --- Skill: Blood Blossom ---
  {
    name: "hutao_blood_blossom",
    category: "skill",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.hutao_blood_blossom") }],
  },
  // --- Burst: Spirit Soother ---
  {
    name: "burst_dmg",
    category: "burst",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") }],
  },
  {
    name: "hutao_burst_dmg_lowhp",
    category: "burst",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.hutao_burst_dmg_lowhp") }],
  },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const huTao: DbObjectChar = {
  name: "hu_tao",
  gameId: 10000046,
  rarity: 5,
  element: "pyro",
  weapon: "polearm",
  origin: "liyue",
  statTable: HutaoStatTable,
  talents,
  features,
  multipliers: [c2SkillHpMultiplier],
  postEffects: [hpToAtk],
  conditions: [paramita, c3SkillTalentBonus, c5BurstTalentBonus],
  // A1 "Flutter By" — +12% CRIT Rate to nearby party.
  // C4 "Garden of Eternal Rest" — +12% CRIT Rate to nearby party (on enemy killed by Hutao/ally).
  // Source: raw/genshin_calc_pub/src/js/db/Char/Hutao.js (partyData conditions)
  partyData: {
    conditions: [
      {
        type: "static",
        stats: { crit_rate: 12 },
        condition: { type: "boolean", name: "party.hu_tao_flutter_by" },
      },
      {
        type: "static",
        stats: { crit_rate: 12 },
        condition: { type: "boolean", name: "party.hu_tao_garden_of_eternal_rest" },
      },
    ],
  },
};
