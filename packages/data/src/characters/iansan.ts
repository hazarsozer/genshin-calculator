/**
 * Iansan — P1.9 electro polearm (Natlan, Nightsoul support).
 *
 * Pure ATK scaler for damage purposes. Her A6-ascension stat is `atk_percent`
 * (24% at A6, in the generated statTable → folded by buildStats automatically),
 * so no passive ATK% needs to be declared here. Covers normal/charged/plunge
 * attacks (the second charged hit `iansan_charged_hit` and the skill/burst are
 * electro), plus the generic electro transformative reactions (overloaded,
 * superconduct, hyperbloom, electrocharged, shatter) auto-emitted by the loader.
 *
 * NOT modelled (faithful to the canonical solo C0 build + the golden harness):
 *   - A1 `iansan_enhanced_resistance_training` (+20% ATK): a ConditionBoolean
 *     toggle (raw Iansan.js:269-283) → OFF at baseline → not folded. The fixture
 *     `stats.atk` (2325.40) confirms only the A6 atk% (24) + the build's atk% (18)
 *     are applied, not the A1 20%.
 *   - `burst.atk_bonus` — gated by ConditionNumber(iansan_points); at solo points=0
 *     the FEATURE is not produced (condition gates production) → absent from the fixture.
 *   - Constellations C0 build → skipped.
 *
 * Modelled as non-damage outputs (P3.5.3):
 *   - `burst.iansan_bonus_max` — PostEffectStats from 'atk*', percent 0.27, statCap
 *     burst.iansan_bonus_max (s3.p4) → min(0.27×atk_total, 690) (cap inert: 627.86<690).
 *   - `other.iansan_heal` — A4 heal = 60% ATK (ValueTable[A4Heal=60]), auto-active at A6.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Iansan.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Iansan: atk% asc stat)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Iansan s1/s2/s3)
 */

import type { CharPostEffect, Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Iansan as IansanStatTable } from "../generated/charTables.js";
import { Iansan as IansanTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return IansanTalents.s1.p1;
      if (name === "normal_hit_2") return IansanTalents.s1.p2;
      if (name === "normal_hit_3") return IansanTalents.s1.p3;
      if (name === "charged_hit") return IansanTalents.s1.p4;
      if (name === "iansan_charged_hit") return IansanTalents.s1.p5;
      if (name === "plunge") return IansanTalents.s1.p7;
      if (name === "plunge_low") return IansanTalents.s1.p8;
      if (name === "plunge_high") return IansanTalents.s1.p9;
    }
    if (talent === "skill") {
      if (name === "skill_dmg") return IansanTalents.s2.p1;
    }
    if (talent === "burst") {
      if (name === "burst_dmg") return IansanTalents.s3.p1;
    }
    throw new Error(`iansan talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Features (standard damage; reactions auto-emitted by the loader)
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (physical via character innate) ---
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
  // --- Charged attacks ---
  // First charged hit is physical (FeatureDamageCharged, no element).
  {
    name: "charged_hit",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }],
  },
  // Second charged hit is electro (raw: FeatureDamageCharged element:'electro').
  {
    name: "iansan_charged_hit",
    category: "attack",
    damageType: "charged",
    element: "electro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.iansan_charged_hit") }],
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
  // --- Skill: Thunderbolt Rush (electro) ---
  {
    name: "skill_dmg",
    category: "skill",
    element: "electro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.skill_dmg") }],
  },
  // --- Burst: The Three Principles of Power (electro) ---
  {
    name: "burst_dmg",
    category: "burst",
    element: "electro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") }],
  },
  // --- Burst static readout: burst.iansan_bonus_max = MAX ATK battery bonus (the cap value) ---
  // FeaturePostEffectValue(PostEffectStats from:'atk*', percent=StatTable('',[0.27]),
  // statCap=Talents.get('burst.iansan_bonus_max')=s3.p4). '' name not isPercent + fmt="" → displayed =
  // min(0.27×atk_total, s3.p4). values = 0.27×100 = 27 → (27/100)×atk_total = 0.27×atk_total (≈627.86);
  // capValue = 690 (s3.p4 @ burst lv10, inert here: 627.86 < 690). raw/genshin_calc_pub/src/js/db/Char/Iansan.js:259-269.
  {
    name: "iansan_bonus_max",
    category: "burst",
    output: { kind: "static" },
    multipliers: [
      { scaling: "atk", leveling: "char_skill_burst", values: { getValue: () => 27 }, capValue: 690 },
    ],
  },
  // --- A4 heal: other.iansan_heal = 60% ATK (FeatureHeal, ValueTable[A4Heal=60], source ascension4, auto at A6) ---
  // base = (60/100)×atk_total; no healing-bonus passive (atk% ascension) → heal = base.
  // raw/genshin_calc_pub/src/js/db/Char/Iansan.js:122,270-282.
  {
    name: "iansan_heal",
    category: "other",
    output: { kind: "heal" },
    multipliers: [
      { scaling: "atk", leveling: "ascension4", values: { getValue: () => 60 } },
    ],
  },
];

// ---------------------------------------------------------------------------
// Constellation conditions (P2.C Wave-1)
// ---------------------------------------------------------------------------
// C1 "Starting's Never Easy": ConditionStatic, no real stats → SKIP.
// C2 "Laziness Is the Enemy": ConditionStatic + ConditionAscensionChar with
//   text_percent (display-only atk%) → SKIP (text_percent is a display key).
// C4 "Slow and Steady Wins the Race": ConditionStatic, no real stats → SKIP.
// C6 "Teachings of the Collective of Plenty": ConditionBoolean toggle
//   (iansan_teachings_of_the_collective_of_plenty, dmg_all) → OFF → SKIP.
//
// Always-on: C3 (+3 skill talent), C5 (+3 burst talent).
// Sources: raw/genshin_calc_pub/src/js/db/Char/Iansan.js:316-388

const constellationConditions: readonly Condition[] = [
  // C3 "Hard Work Always Beats Talent" — +3 Elemental Skill.
  // Raw cons[2]: new Condition({ settings: { char_skill_elemental_bonus: 3 } }).
  { type: "constellation", constellation: 3, settings: { char_skill_elemental_bonus: 3 } },
  // C5 "Never Idle" — +3 Elemental Burst.
  // Raw cons[4]: new Condition({ settings: { char_skill_burst_bonus: 3 } }).
  { type: "constellation", constellation: 5, settings: { char_skill_burst_bonus: 3 } },
];

// ---------------------------------------------------------------------------
// partyData — Nightsoul-points-scaled ATK battery (P3.5.2 engine-ext pass).
// Source: raw/genshin_calc_pub/src/js/db/Char/Iansan.js:385-471
//
// Her burst grants teammates +ATK = min((perPointRatio × points + 0.06@≥42) × atk_total,
// iansan_bonus_max). perPointRatio = burst.iansan_conversion_low × 0.01 (her getMulti folds
// the ×0.01 into the table; our ratioFromTalent multi:0.01 reproduces it exactly). The whole
// per-point ratio is multiplied by the live Nightsoul-points count (her stacksSetting →
// getStacks → CMulti), then the +0.06 percentBonus addend applies at ≥42 points (her
// bonusCondition ConditionBooleanValue ge 42), then ×atk_total, then capped at the level-scaled
// iansan_bonus_max (her statCap StatTable keyed by the teammate's burst level).
//
// This is the re-port that earlier got reverted (a7b5067) for baking party_iansan_points:1 — a
// multiply-by-1 that DODGED the stacks scaling. Now the multiply is the CharPostEffect.stacksSetting
// field and the oracle rep gates it at the real operating point (points=42), so the ×points term
// is load-bearing.
//
// NOT ported (variant-rep pass / out of scope): A1 +20% ATK, C2 +30% ATK, C5 +3 burst,
// C6 +25% dmg_all — her partyData conditions (:417-449) gated by party.* toggles / ascension /
// constellation, all OFF at the C0 baseline rep. The energy/heal kit is non-damage (spec §6).
const partyAtkPost: CharPostEffect = {
  fromStat: "iansan_atk_total",
  toStat: "atk",
  // perPointRatio = burst.iansan_conversion_low (s3.p3) × 0.01 (her getMulti multi:0.01).
  ratioFromTalent: {
    table: IansanTalents.s3.p3,
    levelSetting: "iansan_char_skill_burst",
    multi: 0.01,
  },
  // Multiplicative Nightsoul points: ratio ×= party_iansan_points (her stacksSetting).
  stacksSetting: "party_iansan_points",
  // +0.06 flat addend to the ratio at ≥42 points (her percentBonus ValueTable([0.06]) +
  // bonusCondition ConditionBooleanValue{setting:'party_iansan_points', cond:'ge', value:42}).
  percentBonus: {
    value: 0.06,
    condition: { type: "boolean-value", setting: "party_iansan_points", cond: "ge", value: 42 },
  },
  // Absolute cap = iansan_bonus_max (s3.p4) at the teammate's burst level (her statCap StatTable).
  capValueFromTalent: {
    table: IansanTalents.s3.p4,
    levelSetting: "iansan_char_skill_burst",
  },
  // Master gate: the burst battery is active only while Nightsoul points are present
  // (her FeaturePostEffectValue condition ConditionBoolean{name:'party_iansan_points'}).
  conditions: [{ type: "boolean", name: "party_iansan_points" }],
};

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const iansan: DbObjectChar = {
  name: "iansan",
  gameId: 10000110,
  rarity: 4,
  element: "electro",
  weapon: "polearm",
  origin: "natlan",
  statTable: IansanStatTable,
  talents,
  features,
  multipliers: [],
  conditions: constellationConditions,
  partyData: {
    loadStats: {
      stats: ["atk_total"],
      settings: ["char_skill_burst"],
    },
    conditions: [
      // ConditionNumber: lifts the teammate's atk_total into the recipient's stat bag, read by
      // the postEffect's `from` (her ConditionNumber{name:'iansan_atk_total', partyStat:'atk_total',
      // max:10000}, raw Iansan.js:391-398). The burst-level and points inputs (iansan_char_skill_burst
      // / party_iansan_points) flow as baked settings into the EvalContext, so the postEffect reads
      // them via levelSetting/stacksSetting without a separate lift.
      { type: "number", name: "iansan_atk_total", max: 10000 },
    ],
    postEffects: [partyAtkPost],
  },
};
