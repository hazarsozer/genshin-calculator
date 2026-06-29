/**
 * Aloy — cryo bow ATK scaler (collab character, foreign origin).
 *
 * 4-hit normal combo where normal_hit_1 is a 2-sub-hit multihit (tables
 * _1_1 + _1_2, children shown separately), physical aimed shot, fully-charged
 * cryo aimed shot, plunge (collision) + plunge_low/high (shockwave), two cryo
 * skill hits (Frozen Wilds: freeze bomb + chillwater bomblets), cryo burst.
 *
 * NORMALS ARE PHYSICAL in the fixed solo-C0 build. Aloy's cryo infusion comes
 * only from the `aloy_coils` stack condition (sets `attack_infusion: 'cryo'` at
 * max coils via Rushing Ice) — a stack toggle that is OFF under `settings: {}`,
 * so normals/aimed stay physical. Only `charged_aimed`, the two skills, and the
 * burst carry an explicit cryo element. The fixture confirms: normal/aimed are
 * physical (pick up dmg_phys), charged_aimed/skills/burst are cryo.
 *
 * NO always-on passive bonuses at solo C0:
 *   - A1 "Combat Override" (+atk%): ConditionBoolean toggle → OFF at baseline.
 *   - A4 "Strong Strike" (+cryo dmg per coil): ConditionStacks → 0 stacks OFF.
 *   - Coil normal-dmg bonuses: ConditionStacks (coils) → OFF.
 * None fold into baseStats/critRateBonuses/damageBonuses.
 *
 * skill.aloy_atk_decrease is a FeatureStatic (format: percent, damageType: "")
 * — an enemy-ATK-decrease readout, modelled as output:{kind:"static"} (P3.5.3,
 * raw-talent value via FeatureMultiplierStatic). The cryo transformative reactions
 * (superconduct, electrocharged, shatter) are emitted generically from the cryo
 * element by the loader.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Aloy.js
 *   raw/genshin_calc_pub/src/js/classes/Feature2/Damage/Multihit.js (multihit tree)
 *   raw/genshin_calc_pub/src/js/classes/Feature2/Damage/Plunge/ShockWave.js (dmg_plunge_shockwave)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Aloy)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Aloy)
 */

import type { Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Aloy as AloyStatTable } from "../generated/charTables.js";
import { Aloy as AloyTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1_1") return AloyTalents.s1.p1;
      if (name === "normal_hit_1_2") return AloyTalents.s1.p2;
      if (name === "normal_hit_2") return AloyTalents.s1.p3;
      if (name === "normal_hit_3") return AloyTalents.s1.p4;
      if (name === "normal_hit_4") return AloyTalents.s1.p5;
      if (name === "aimed") return AloyTalents.s1.p6;
      if (name === "charged_aimed") return AloyTalents.s1.p7;
      if (name === "plunge") return AloyTalents.s1.p8;
      if (name === "plunge_low") return AloyTalents.s1.p9;
      if (name === "plunge_high") return AloyTalents.s1.p10;
    }
    if (talent === "skill") {
      if (name === "aloy_freeze_bomb_dmg") return AloyTalents.s2.p1;
      if (name === "aloy_chillwater_bomblets") return AloyTalents.s2.p2;
      if (name === "aloy_atk_decrease") return AloyTalents.s2.p3;
    }
    if (talent === "burst") {
      if (name === "burst_dmg") return AloyTalents.s3.p1;
    }
    throw new Error(`aloy talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks ---
  // normal_hit_1: 2-sub-hit multihit (tables _1_1 + _1_2). Parent = sum of both.
  // raw: FeatureDamageMultihit({ items: [{hits:1, [_1_1]}, {hits:1, [_1_2]}] }).
  // Per-hit bonus/res/def are identical, so Σ(base)×B×R×D ≡ her per-hit sum.
  {
    name: "normal_hit_1",
    category: "attack",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1_1") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1_2") }] },
    ],
  },
  // Sub-hits of normal_hit_1 (raw marks isChild — DROPPED so they emit, since the
  // fixture asserts them as independent features). raw Aloy.js child decls.
  {
    name: "normal_hit_1_1",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1_1") }],
  },
  {
    name: "normal_hit_1_2",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1_2") }],
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
  // --- Charged attacks (bow aimed shots) ---
  // aimed: physical charged shot (FeatureDamageChargedAimed → damageType="charged").
  {
    name: "aimed",
    isAimed: true,
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.aimed") }],
  },
  // charged_aimed: fully-charged cryo arrow.
  {
    name: "charged_aimed",
    isAimed: true,
    category: "attack",
    damageType: "charged",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_aimed") }],
  },
  // --- Plunge attacks ---
  // plunge: collision (FeatureDamagePlungeCollision → damageType="plunge").
  {
    name: "plunge",
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge") }],
  },
  // plunge_low / plunge_high: shockwave (FeatureDamagePlungeShockWave). Its
  // getStatsDmgBonus adds dmg_plunge_shockwave (modelled via damageBonuses;
  // absent from the fixed STAT_BLOCK so it reads 0 — a faithful no-op).
  {
    name: "plunge_low",
    tags: ["plunge_shockwave"],
    category: "attack",
    damageType: "plunge",
    damageBonuses: ["dmg_plunge_shockwave"],
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_low") }],
  },
  {
    name: "plunge_high",
    tags: ["plunge_shockwave"],
    category: "attack",
    damageType: "plunge",
    damageBonuses: ["dmg_plunge_shockwave"],
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_high") }],
  },
  // --- Skill: Frozen Wilds (cryo) ---
  {
    name: "aloy_freeze_bomb_dmg",
    category: "skill",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.aloy_freeze_bomb_dmg") }],
  },
  {
    name: "aloy_chillwater_bomblets",
    category: "skill",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.aloy_chillwater_bomblets") }],
  },
  // --- Burst: Prophecies of Dawn (cryo) ---
  {
    name: "burst_dmg",
    category: "burst",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") }],
  },
  // --- Skill static readout: skill.aloy_atk_decrease = Frozen Wilds enemy-ATK decrease (raw talent value) ---
  // FeatureStatic + FeatureMultiplierStatic (her getTreeStatValue = CConst(100) → term = talent value, NO stat
  // scaling). Pattern 2: values:0 + flatValues:<talent> → base = 0×stat + talent. leveling char_skill_elemental,
  // format="" (the % display is hers; our static value == the talent number, 15 at the canonical skill level).
  // raw/genshin_calc_pub/src/js/db/Char/Aloy.js:282-293 (FeatureStatic, multiplier values Talents skill.aloy_atk_decrease).
  {
    name: "aloy_atk_decrease",
    category: "skill",
    output: { kind: "static" },
    multipliers: [
      { leveling: "char_skill_elemental", values: { getValue: () => 0 }, flatValues: talents.get("skill.aloy_atk_decrease") },
    ],
  },
];

// ---------------------------------------------------------------------------
// SELF conditions (golden-blind SKIPPED — the port modelled ONLY party.aloy_combat_override; her
// SELF coil/combat-override/strong-strike toggles are OFF in the fixed solo-C0 build, so the 58k
// DAMAGE goldens never exercised them; a diff-parity sweep surfaced every Aloy hit diverging when
// aloy_coils/aloy_combat_override/aloy_strong_strike are on). All additive stat buffs + a cryo
// infusion — no stat-conversion, no new multiplier surface. raw Aloy.js:305-398.
// ---------------------------------------------------------------------------

// A1 "Combat Override" SELF ATK bonus (the SELF +16% vs the party +8% mirror). raw A1AtkSelf:16,
// ConditionAscensionChar(1) → auto-active at canonical asc6, so ungated. raw Aloy.js:368-382.
const A1_ATK_SELF = 16;
// A4 "Strong Strike" SELF cryo-DMG per coil (3.5%/stack, max 10 = +35%). raw A4CryoDmg:3.5,
// ConditionAscensionChar(4) → auto-active at asc6, ungated. raw Aloy.js:383-398.
const A4_CRYO_DMG = 3.5;

// Coil "Normal Attack DMG Bonus" tiers — dmg_normal indexed by skill talent level
// (char_skill_elemental), each gated by the EXACT coil count (aloy_coils == N). At the max tier
// (== 4, "Rushing Ice") the bonus is larger AND her physical normals gain a cryo infusion
// (attack_infusion:'cryo'). raw Aloy.js:313-367 (ConditionLevels, getAlias skill.aloy_coil_bonus*
// → dmg_normal, subConditions ConditionBooleanValue(aloy_coils eq N)). Values = CharTalentTables
// Aloy.s2.p5/p6/p7/p8 (talent levels 1..15).
const COIL_BONUS_1: readonly number[] = [5.845, 6.195, 6.545, 7, 7.35, 7.7, 8.155, 8.61, 9.065, 9.52, 9.975, 10.43, 10.885, 11.34, 11.795];
const COIL_BONUS_2: readonly number[] = [11.69, 12.39, 13.09, 14, 14.7, 15.4, 16.31, 17.22, 18.13, 19.04, 19.95, 20.86, 21.77, 22.68, 23.59];
const COIL_BONUS_3: readonly number[] = [17.535, 18.585, 19.635, 21, 22.05, 23.1, 24.465, 25.83, 27.195, 28.56, 29.925, 31.29, 32.655, 34.02, 35.385];
const RUSHING_ICE_BONUS: readonly number[] = [29.225, 30.975, 32.725, 35, 36.75, 38.5, 40.775, 43.05, 45.325, 47.6, 49.875, 52.15, 54.425, 56.7, 58.975];

const selfConditions: readonly Condition[] = [
  // A1 "Combat Override" — SELF +16% ATK (lifting every hit). ConditionBoolean (asc-1 gate vacuous at A6).
  { type: "boolean", name: "aloy_combat_override", stats: { atk_percent: A1_ATK_SELF } },
  // A4 "Strong Strike" — +3.5% Cryo DMG per stack (max 10 = +35%), lifting her cryo hits. ConditionStacks.
  { type: "stacks", name: "aloy_strong_strike", maxStacks: 10, stats: { dmg_cryo: A4_CRYO_DMG } },
  // Coil tiers — dmg_normal at EXACTLY N coils (char_skill_elemental-indexed). aloy_coils == 1/2/3.
  { type: "static-level", levelSetting: "char_skill_elemental", levelStats: { dmg_normal: COIL_BONUS_1 }, condition: { type: "boolean-value", setting: "aloy_coils", cond: "eq", value: 1 } },
  { type: "static-level", levelSetting: "char_skill_elemental", levelStats: { dmg_normal: COIL_BONUS_2 }, condition: { type: "boolean-value", setting: "aloy_coils", cond: "eq", value: 2 } },
  { type: "static-level", levelSetting: "char_skill_elemental", levelStats: { dmg_normal: COIL_BONUS_3 }, condition: { type: "boolean-value", setting: "aloy_coils", cond: "eq", value: 3 } },
  // Max tier "Rushing Ice" (== 4 coils) — bigger dmg_normal + cryo infusion on her physical normals.
  {
    type: "static-level",
    levelSetting: "char_skill_elemental",
    levelStats: { dmg_normal: RUSHING_ICE_BONUS },
    settings: { attack_infusion: "cryo" },
    condition: { type: "boolean-value", setting: "aloy_coils", cond: "eq", value: 4 },
  },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const aloy: DbObjectChar = {
  name: "aloy",
  gameId: 10000062,
  rarity: 5,
  element: "cryo",
  weapon: "bow",
  origin: "foreign",
  statTable: AloyStatTable,
  talents,
  features,
  multipliers: [],
  conditions: selfConditions,
  // partyData — teammate kit buffs (P3.5.2 Bucket A)
  // A1 "Combat Override": ConditionBoolean(party.aloy_combat_override) → atk_percent:8.
  //   text_percent_1/text_percent_2 are display-only, skipped.
  //   TalentValues.A1AtkOther=8, TalentValues.A1AtkSelf=16 (self-only, display).
  //   Source: raw/genshin_calc_pub/src/js/db/Char/Aloy.js partyData.conditions[0]
  partyData: {
    conditions: [
      {
        type: "boolean",
        name: "party.aloy_combat_override",
        stats: { atk_percent: 8 },
      },
    ],
  },
};
