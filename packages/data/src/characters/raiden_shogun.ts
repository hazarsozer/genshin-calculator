/**
 * Raiden Shogun (Baal) — electro polearm (5-star).
 *
 * FIXED SOLO C0 BUILD MODELLING
 * The oracle fixture is computed with `baal_musou_isshin` (burst stance) OFF: the
 * fixture asserts the *normal* attack/charged/plunge features (gated on
 * `NOT baal_musou_isshin`), NOT the burst-infused versions (gated ON it). With the
 * stance OFF:
 *   - Normal/charged/plunge hits are PHYSICAL (no electro infusion) — default element.
 *   - The burst-version normal/charged/plunge features and the per-stack Resolve
 *     buff (char-level `multipliers` with `stacksLeveling: 'baal_resolve_stacks'`,
 *     `target.tags: ['raiden_attacks']`) are OFF. Those char-level targeted/stacked
 *     multipliers are also not engine-supported, but they are inactive here anyway.
 *
 * Burst Musou no Hitotachi (`baal_musou_no_hitotachi_dmg`): two raw multipliers —
 *   1. base burst % (s3.p1), electro, ATK
 *   2. per-Resolve-stack burst % (s3.p2) gated on `baal_musou_isshin`
 * Only multiplier #1 is active in the fixed solo build (stance OFF), so the modelled
 * burst is the base multiplier alone. Oracle confirms: 14398.81 normal matches the
 * base 721.44% × ATK_total path without the stack term.
 *
 * Multihit `normal_hit_4`: a 2-sub-hit attack. The combined row is modelled as a
 * Multihit (both items summed → matches fixture `attack.normal_hit_4`); the two
 * sub-hits `normal_hit_4_1`/`normal_hit_4_2` (raw `isChild`) are modelled as
 * independent single-hit rows so they emit and match the fixture's per-sub-hit keys.
 *
 * SKIPPED (display-only / not damage triples — harness filters `damageType: ""`):
 *   other.burst_dmg_bonus, other.electro_dmg_bonus  (FeaturePostEffectValue)
 *   burst.baal_energy_recharge                       (FeatureStatic, format decimal)
 * Constellations (C0 build) skipped. Reactions emitted generically from element.
 *
 * ALWAYS-ON PASSIVE (A4 Enlightened One → dynamic Electro DMG%):
 *   A4 grants Electro DMG = 0.4% per 1% of Energy Recharge above 100%, capped 80%.
 *   Her engine derives this via PostEffectStatsExceedRecharge (ExceedRecharge.js:
 *   max(0, recharge_decimal − 1) × (40/100), where recharge is stored as a decimal
 *   post processPercent). In our engine recharge is raw percent, so the equivalent is
 *   max(0, recharge − 100) × 0.4, capped at 80 — modelled as a dynamic `postEffect`:
 *     `{ fromStat:"recharge", toStat:"dmg_electro", offset:100, ratio:0.4, capValue:80 }`
 *   At base ER=232: (232−100)×0.4 = 52.8 (matches the former constant). At full-build
 *   ER=252 (Emblem 2pc): (252−100)×0.4 = 60.8 (correct; the old constant 52.8 was wrong).
 *   `dmg_electro` is emitted as a raw-percent stat; the emit loop divides by 100.
 *
 *   A1 (Wishes Unnumbered): party energy/burst-DMG support — not a solo self damage stat.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/RaidenShogun.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (RaidenShogun)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (RaidenShogun)
 */

import type { Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { RaidenShogun as RaidenShogunStatTable } from "../generated/charTables.js";
import { RaidenShogun as RaidenShogunTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1")   return RaidenShogunTalents.s1.p1;
      if (name === "normal_hit_2")   return RaidenShogunTalents.s1.p2;
      if (name === "normal_hit_3")   return RaidenShogunTalents.s1.p3;
      if (name === "normal_hit_4_1") return RaidenShogunTalents.s1.p4;
      if (name === "normal_hit_4_2") return RaidenShogunTalents.s1.p5;
      if (name === "normal_hit_5")   return RaidenShogunTalents.s1.p6;
      if (name === "charged_hit")    return RaidenShogunTalents.s1.p7;
      if (name === "plunge")         return RaidenShogunTalents.s1.p9;
      if (name === "plunge_low")     return RaidenShogunTalents.s1.p10;
      if (name === "plunge_high")    return RaidenShogunTalents.s1.p11;
    }
    if (talent === "skill") {
      if (name === "skill_dmg")                return RaidenShogunTalents.s2.p1;
      if (name === "baal_coordinated_atk_dmg") return RaidenShogunTalents.s2.p2;
    }
    if (talent === "burst") {
      if (name === "baal_musou_no_hitotachi_dmg") return RaidenShogunTalents.s3.p1;
    }
    throw new Error(`raiden_shogun talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (physical polearm — stance OFF → no electro infusion) ---
  // raw: FeatureDamageNormal normal_hit_1, condition NOT baal_musou_isshin
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
  // raw: FeatureDamageMultihit normal_hit_4 — combined 2-sub-hit (s1.p4 + s1.p5)
  {
    name: "normal_hit_4",
    category: "attack",
    damageType: "normal",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4_1") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4_2") }] },
    ],
  },
  // raw: FeatureDamageNormal normal_hit_4_1 (isChild) — emitted as independent sub-hit row
  {
    name: "normal_hit_4_1",
    category: "attack",
    damageType: "normal",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4_1") }],
  },
  // raw: FeatureDamageNormal normal_hit_4_2 (isChild) — emitted as independent sub-hit row
  {
    name: "normal_hit_4_2",
    category: "attack",
    damageType: "normal",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4_2") }],
  },
  {
    name: "normal_hit_5",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_5") }],
  },
  // --- Charged attack (physical) ---
  // raw: FeatureDamageCharged charged_hit
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
  // --- Skill: Transcendence: Baleful Omen (electro) ---
  // raw: FeatureDamageSkill skill_dmg, element='electro'
  {
    name: "skill_dmg",
    category: "skill",
    element: "electro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.skill_dmg") }],
  },
  // raw: FeatureDamageSkill baal_coordinated_atk_dmg, element='electro'
  {
    name: "baal_coordinated_atk_dmg",
    category: "skill",
    element: "electro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.baal_coordinated_atk_dmg") }],
  },
  // --- Burst: Secret Art: Musou Shinsetsu (electro) ---
  // raw: FeatureDamageBurst baal_musou_no_hitotachi_dmg, element='electro'.
  // Base multiplier only (s3.p1); the per-Resolve-stack multiplier is gated on
  // baal_musou_isshin (OFF in fixed solo build) → excluded.
  {
    name: "baal_musou_no_hitotachi_dmg",
    category: "burst",
    element: "electro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.baal_musou_no_hitotachi_dmg") }],
  },
];

// ---------------------------------------------------------------------------
// Toggle conditions
// ---------------------------------------------------------------------------

// "Eye of Stormy Judgment" skill bonus: dmg_burst += energy_cost × baal_burst_bonus@L9.
// Raw RaidenShogun.js:185-192 — PostEffectStats{ from:'burst_energy_cost'(=90),
// percent:skill.'baal_burst_bonus'@L9 = 0.3% per energy → dmg_burst = 90 × 0.3 = 27 }.
// BUILD-COUPLED at skill level 9 (the oracle's fixed talent level).
// s2.p4 = baal_burst_bonus table (9 values); getValue(9) = 0.3; 90 × 0.3 = 27.
const toggleConditions: readonly Condition[] = [
  { type: "boolean", name: "baal_eye_of_stormy_judgment", stats: { dmg_burst: 27 } },
];

// ---------------------------------------------------------------------------
// Constellation conditions (P2.C Wave-1)
// ---------------------------------------------------------------------------
// C1 "Ominous Inscription": ConditionStatic with no real stats (description only) → SKIP.
// C2 "Steelbreaker": ConditionStatic — enemy_def_ignore_burst: 60 (always-on).
//    Raw cons[1]: ConditionStatic{ stats:{ enemy_def_ignore_burst:60 } }
//    Applies to burst features via the engine's standard def-ignore path.
// C3 "Shinkage Bygones": +3 Elemental Burst talent levels.
//    Raw cons[2]: Condition{ settings:{ char_skill_burst_bonus:3 } }
// C4 "Pledge of Propriety": ConditionStatic with ONLY text_percent: 30 (display) → SKIP.
// C5 "Shogun's Descent": +3 Elemental Skill talent levels.
//    Raw cons[4]: Condition{ settings:{ char_skill_elemental_bonus:3 } }
// C6 "Wishbearer": ConditionStatic with no real stats → SKIP.
//
// Sources: raw/genshin_calc_pub/src/js/db/Char/RaidenShogun.js:687-744

const constellationConditions: readonly Condition[] = [
  // C2: enemy_def_ignore_burst +60 (always-on ConditionStatic).
  // Raw cons[1]: ConditionStatic{ stats:{ enemy_def_ignore_burst: 60 } }.
  { type: "constellation", constellation: 2, stats: { enemy_def_ignore_burst: 60 } },
  // C3: +3 Elemental Burst (Secret Art: Musou Shinsetsu).
  // Raw cons[2]: new Condition({ settings: { char_skill_burst_bonus: 3 } }).
  { type: "constellation", constellation: 3, settings: { char_skill_burst_bonus: 3 } },
  // C5: +3 Elemental Skill (Transcendence: Baleful Omen).
  // Raw cons[4]: new Condition({ settings: { char_skill_elemental_bonus: 3 } }).
  { type: "constellation", constellation: 5, settings: { char_skill_elemental_bonus: 3 } },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const raidenShogun: DbObjectChar = {
  name: "raiden_shogun",
  gameId: 10000052,
  rarity: 5,
  element: "electro",
  weapon: "polearm",
  origin: "inazuma",
  statTable: RaidenShogunStatTable,
  // A4 (Enlightened One): Electro DMG = 0.4% per 1% Energy Recharge above 100%,
  // capped at +80%. Modelled as a dynamic post-effect so builds with ER > 232%
  // (e.g. full-build with Emblem 2pc) correctly compute a higher bonus.
  //
  // Formula: max(0, recharge_total − 100) × 0.4, capped at 80.
  // At base build ER=232: (232−100)×0.4 = 52.8 ✓ (matches the old constant).
  //
  // Our engine stores `recharge` as raw percent (e.g. 232); `offset:100` mirrors
  // her PostEffectStatsExceedRecharge which subtracts 1 from the decimal (2.32−1).
  // `ratio:0.4` mirrors the StatTable('dmg_electro',[40]) value / 100 = 0.4.
  // `dmg_electro` is a raw-percent stat; the emit loop divides by 100 at output.
  //
  // Source: raw/genshin_calc_pub/src/js/db/Char/RaidenShogun.js:194-198
  //         raw/genshin_calc_pub/src/js/classes/PostEffect/Stats/ExceedRecharge.js
  postEffects: [
    {
      fromStat: "recharge",
      toStat: "dmg_electro",
      offset: 100,
      ratio: 0.4,
      capValue: 80,
    },
  ],
  talents,
  features,
  multipliers: [],
  conditions: [...toggleConditions, ...constellationConditions],
};
