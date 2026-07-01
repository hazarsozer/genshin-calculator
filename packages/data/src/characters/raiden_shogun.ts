/**
 * Raiden Shogun (Baal) — electro polearm (5-star).
 *
 * BURST-STANCE SWAP: the `baal_musou_isshin` (Musou Isshin) toggle swaps her ground
 * polearm normals/charged/plunge for ELECTRO burst-infused versions. Her engine gates
 * the ground set with `ConditionNot([baal_musou_isshin])` and the burst set with
 * `ConditionBoolean(it)`, and the toggle publishes `attack_infusion: 'electro'`. Both
 * stances are modelled; the golden/fixture build has the stance OFF (ground set produced).
 *   - Ground set (stance OFF): normal/charged/plunge are PHYSICAL (default element).
 *   - Burst set (stance ON): category 'attack' (same keys) + damageType 'burst' (they carry
 *     dmg_burst) + tags ['raiden_attacks'] + electro infusion, char_skill_burst leveled.
 *
 * RESOLVE STACKS (`baal_resolve_stacks`, 0..60): scale the burst-stance attacks via a
 * char-level per-stack ATK% multiplier (s3.p3) targeting the `raiden_attacks` tag, and lift
 * the burst via a 2nd per-stack term (s3.p2) on `baal_musou_no_hitotachi_dmg`. Both use
 * `stacksFactor` → at 0 stacks (the dump default) they vanish; at N stacks they contribute.
 *
 * Burst Musou no Hitotachi (`baal_musou_no_hitotachi_dmg`): base burst % (s3.p1) + the
 * per-Resolve-stack term above. At 0 stacks the base multiplier alone matches the oracle.
 *
 * Multihit `normal_hit_4`: a 2-sub-hit attack. The combined row is modelled as a
 * Multihit (both items summed → matches fixture `attack.normal_hit_4`); the two
 * sub-hits `normal_hit_4_1`/`normal_hit_4_2` (raw `isChild`) are modelled as
 * independent single-hit rows so they emit and match the fixture's per-sub-hit keys.
 *
 * NON-DAMAGE readouts (modelled as FeatureStatic outputs; the harness asserts these):
 *   burst.baal_energy_recharge — ER readout (const term + recharge term, format decimal) = 4.48
 *   other.electro_dmg_bonus  — ER→Electro-DMG  (scaling:"recharge_total", exceedStatValue) = 52.8
 *   other.burst_dmg_bonus    — energy→Burst-DMG (scaling:"burst_energy_cost") = 27
 * Each modelled WITHOUT its application gate (oracle dumps the canonical-active value).
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
      // Musou Isshin (burst-stance) resolve scalings — per-Resolve-stack % (char_skill_burst).
      if (name === "baal_resolve_burst") return RaidenShogunTalents.s3.p2; // per-stack on the burst
      if (name === "baal_resolve_atk") return RaidenShogunTalents.s3.p3; // per-stack ATK% on raiden_attacks
      // Musou Isshin (burst-stance) normals/charged — char_skill_burst leveling, tables in the burst group.
      if (name === "normal_hit_1") return RaidenShogunTalents.s3.p5;
      if (name === "normal_hit_2") return RaidenShogunTalents.s3.p6;
      if (name === "normal_hit_3") return RaidenShogunTalents.s3.p7;
      if (name === "normal_hit_4_1") return RaidenShogunTalents.s3.p8;
      if (name === "normal_hit_4_2") return RaidenShogunTalents.s3.p9;
      if (name === "normal_hit_5") return RaidenShogunTalents.s3.p10;
      if (name === "charged_hit_1") return RaidenShogunTalents.s3.p11;
      if (name === "charged_hit_2") return RaidenShogunTalents.s3.p12;
    }
    throw new Error(`raiden_shogun talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Musou Isshin (Secret Art: Musou Shinsetsu) BURST STANCE toggle
// ---------------------------------------------------------------------------
// When ON, Raiden's polearm normals/charged/plunge are replaced by ELECTRO burst-infused
// versions (char_skill_burst-leveled, damageType 'burst' → they carry dmg_burst; tagged
// 'raiden_attacks'). Her engine gates the base set with ConditionNot([baal_musou_isshin])
// and the burst set with ConditionBoolean(it); the toggle publishes attack_infusion:'electro'.
// Resolve stacks (baal_resolve_stacks, 0..60) then scale the burst-stance attacks (a char-level
// per-stack ATK% multiplier over raiden_attacks) and the burst (a 2nd per-stack term); at 0
// stacks (the dump default) both vanish. raw RaidenShogun.js:213-559, 615-628, 675-687.
const STANCE: Condition = { type: "boolean", name: "baal_musou_isshin" };
const NOT_STANCE: Condition = { type: "not", items: [{ type: "boolean", name: "baal_musou_isshin" }] };

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (physical polearm — RANGED/ground stance, gated OFF in burst stance) ---
  // raw: FeatureDamageNormal normal_hit_1, condition NOT baal_musou_isshin
  {
    name: "normal_hit_1",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1") }],
    condition: NOT_STANCE,
  },
  {
    name: "normal_hit_2",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2") }],
    condition: NOT_STANCE,
  },
  {
    name: "normal_hit_3",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }],
    condition: NOT_STANCE,
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
    condition: NOT_STANCE,
  },
  // raw: FeatureDamageNormal normal_hit_4_1 (isChild) — emitted as independent sub-hit row
  {
    name: "normal_hit_4_1",
    category: "attack",
    damageType: "normal",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4_1") }],
    condition: NOT_STANCE,
  },
  // raw: FeatureDamageNormal normal_hit_4_2 (isChild) — emitted as independent sub-hit row
  {
    name: "normal_hit_4_2",
    category: "attack",
    damageType: "normal",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4_2") }],
    condition: NOT_STANCE,
  },
  {
    name: "normal_hit_5",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_5") }],
    condition: NOT_STANCE,
  },
  // --- Charged attack (physical) — ground stance ---
  // raw: FeatureDamageCharged charged_hit
  {
    name: "charged_hit",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }],
    condition: NOT_STANCE,
  },
  // --- Plunge attacks (physical) — ground stance ---
  // raw: FeatureDamagePlungeCollision plunge
  {
    name: "plunge",
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge") }],
    condition: NOT_STANCE,
  },
  // raw: FeatureDamagePlungeShockWave plunge_low
  {
    name: "plunge_low",
    tags: ["plunge_shockwave"],
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_low") }],
    condition: NOT_STANCE,
  },
  // raw: FeatureDamagePlungeShockWave plunge_high
  {
    name: "plunge_high",
    tags: ["plunge_shockwave"],
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_high") }],
    condition: NOT_STANCE,
  },
  // ========================================================================
  // MUSOU ISSHIN (burst stance) moveset — parallel ELECTRO burst-infused normals/charged/plunge,
  // gated ON. category 'attack' (same keys), damageType 'burst' (FeatureDamageBurst → they carry
  // dmg_burst), tags ['raiden_attacks'] (the resolve multiplier targets them), element via the
  // stance's attack_infusion:'electro'. char_skill_burst leveling. raw RaidenShogun.js:362-559.
  // ========================================================================
  {
    name: "normal_hit_1",
    category: "attack",
    damageType: "burst",
    tags: ["raiden_attacks"],
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.normal_hit_1") }],
    condition: STANCE,
  },
  {
    name: "normal_hit_2",
    category: "attack",
    damageType: "burst",
    tags: ["raiden_attacks"],
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.normal_hit_2") }],
    condition: STANCE,
  },
  {
    name: "normal_hit_3",
    category: "attack",
    damageType: "burst",
    tags: ["raiden_attacks"],
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.normal_hit_3") }],
    condition: STANCE,
  },
  // normal_hit_4: 2-hit multihit (burst.normal_hit_4_1 + burst.normal_hit_4_2), damageType 'burst'.
  {
    name: "normal_hit_4",
    category: "attack",
    damageType: "burst",
    tags: ["raiden_attacks"],
    items: [
      { multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.normal_hit_4_1") }] },
      { multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.normal_hit_4_2") }] },
    ],
    condition: STANCE,
  },
  // normal_hit_4_1 / normal_hit_4_2: the two sub-hits, emitted standalone (raw isChild dropped).
  {
    name: "normal_hit_4_1",
    category: "attack",
    damageType: "burst",
    tags: ["raiden_attacks"],
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.normal_hit_4_1") }],
    condition: STANCE,
  },
  {
    name: "normal_hit_4_2",
    category: "attack",
    damageType: "burst",
    tags: ["raiden_attacks"],
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.normal_hit_4_2") }],
    condition: STANCE,
  },
  {
    name: "normal_hit_5",
    category: "attack",
    damageType: "burst",
    tags: ["raiden_attacks"],
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.normal_hit_5") }],
    condition: STANCE,
  },
  // charged_hit_total: 2-hit multihit (burst.charged_hit_1 + burst.charged_hit_2), damageType 'burst'.
  {
    name: "charged_hit_total",
    category: "attack",
    damageType: "burst",
    tags: ["raiden_attacks"],
    items: [
      { multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.charged_hit_1") }] },
      { multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.charged_hit_2") }] },
    ],
    condition: STANCE,
  },
  {
    name: "charged_hit_1",
    category: "attack",
    damageType: "burst",
    tags: ["raiden_attacks"],
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.charged_hit_1") }],
    condition: STANCE,
  },
  {
    name: "charged_hit_2",
    category: "attack",
    damageType: "burst",
    tags: ["raiden_attacks"],
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.charged_hit_2") }],
    condition: STANCE,
  },
  // Burst-stance plunges: FeatureDamageBurst (damageType 'burst', tags raiden_attacks) that REUSE
  // the ground plunge tables (attack.plunge*) at char_skill_burst leveling. NOT plunge_shockwave-
  // tagged (they are FeatureDamageBurst, not PlungeShockWave). raw RaidenShogun.js:522-559.
  {
    name: "plunge",
    category: "attack",
    damageType: "burst",
    tags: ["raiden_attacks"],
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("attack.plunge") }],
    condition: STANCE,
  },
  {
    name: "plunge_low",
    category: "attack",
    damageType: "burst",
    tags: ["raiden_attacks"],
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("attack.plunge_low") }],
    condition: STANCE,
  },
  {
    name: "plunge_high",
    category: "attack",
    damageType: "burst",
    tags: ["raiden_attacks"],
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("attack.plunge_high") }],
    condition: STANCE,
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
  // raw: FeatureDamageBurst baal_musou_no_hitotachi_dmg, element='electro'. TWO multipliers:
  //   1. base burst % (s3.p1), always active.
  //   2. per-Resolve-stack burst % (s3.p2, baal_resolve_burst) × min(baal_resolve_stacks, 60),
  //      gated ON the burst stance. At 0 resolve stacks (dump default) the stacksFactor is 0 → the
  //      term vanishes; it lifts the burst only when stacks are set. raw RaidenShogun.js:581-596.
  {
    name: "baal_musou_no_hitotachi_dmg",
    category: "burst",
    element: "electro",
    multipliers: [
      { leveling: "char_skill_burst", values: talents.get("burst.baal_musou_no_hitotachi_dmg") },
      {
        leveling: "char_skill_burst",
        values: talents.get("burst.baal_resolve_burst"),
        stacksFactor: { setting: "baal_resolve_stacks", maxStacks: 60 },
        condition: STANCE,
      },
    ],
  },
  // --- burst.baal_energy_recharge: A4 "Wishes Unnumbered" ER readout (FeatureStatic, format:'decimal') ---
  // Raw RaidenShogun.js:597-616 — TWO multipliers, summed:
  //   (1) FeatureMultiplierStatic(ValueTable([1])) → her getTreeStatValue = CConst(100) → const term = 1.
  //       Modelled as the gorou const-term idiom: 0×stat + flatValues(=1).
  //   (2) FeatureMultiplier({ scaling:'recharge*', leveling:'char_skill_elemental',
  //       values: getMulti({ from:'burst.baal_energy_recharge'(=s3.p17), multi:60 }) }).
  //       Her value = talent(L) × 60 (getMulti maps each table value × multi); at L10: 2.5 × 60 = 150.
  //       Her term = value/100 × recharge_DECIMAL (makeStatTotalItem('recharge') → percent flag → /100).
  //       In our engine (getValue/100) × recharge_total(PERCENT, 232), so getValue = talent(10) × 60 / 100 = 1.5:
  //       the extra /100 compensates for our recharge_total carrying the percent (×100) factor her decimal lacks.
  //       NEVER baked — derived from s3.p17@L10 × the raw multi 60. format:'decimal' → no further ×100.
  // Total = 1 + 1.5/100 × 232 = 4.48. Modelled WITHOUT the A4 gate (canonical value the oracle dumps).
  {
    name: "baal_energy_recharge",
    category: "burst",
    output: { kind: "static" },
    multipliers: [
      { leveling: "", values: { getValue: () => 0 }, flatValues: { getValue: () => 1 } },
      {
        scaling: "recharge_total",
        leveling: "",
        values: { getValue: () => (RaidenShogunTalents.s3.p17.getValue(10) * 60) / 100 },
      },
    ],
  },
  // --- other.electro_dmg_bonus: A4 "Enlightened One" ER→Electro-DMG readout (FeaturePostEffectValue → static) ---
  // Raw RaidenShogun.js:194-198,623-628 — electroDmgPost = PostEffectStatsExceedRecharge({
  // percent: StatTable('dmg_electro', [40]) }), format:'percent'. ExceedRecharge base = max(recharge_DECIMAL − 1, 0)
  // (ExceedRecharge.js:6-14). Her getTree: value(=40)/100 (isPercent('dmg_electro')) × max(recharge_decimal − 1, 0)
  // × 100 (format:'percent') = 40 × max(recharge_decimal − 1, 0). In our engine (getValue/100) ×
  // max(recharge_total − exceedStatValue, 0) with recharge_total PERCENT (232): getValue = raw constant 40
  // (recharge absorbs the ×100), exceedStatValue = 100 = her −1 decimal threshold in percent units (mirrors the
  // existing engulfing-lightning offset:100 and this char's A4 dmg_electro postEffect offset:100).
  // = 40/100 × max(232 − 100, 0) = 0.4 × 132 = 52.8. Modelled WITHOUT the A4 gate (canonical value). NEVER baked.
  {
    name: "electro_dmg_bonus",
    category: "other",
    output: { kind: "static" },
    multipliers: [
      { scaling: "recharge_total", leveling: "", values: { getValue: () => 40 }, exceedStatValue: 100 },
    ],
  },
  // --- other.burst_dmg_bonus: "Eye of Stormy Judgment" energy→Burst-DMG readout (FeaturePostEffectValue → static) ---
  // Raw RaidenShogun.js:185-192,617-622 — burstDmgPost = PostEffectStats({ from:'burst_energy_cost',
  // levelSetting:'char_skill_elemental', percent: getAlias('skill.baal_burst_bonus'(=s2.p4), 'dmg_burst') }),
  // format:'percent'. Her getTree: value(=s2.p4@L10=0.3)/100 (isPercent('dmg_burst')) × burst_energy_cost(=90,
  // makeStatItem verbatim, not percent → no /100) × 100 (format:'percent') = 0.3 × 90 = 27. In our engine
  // (getValue/100) × burst_energy_cost(=90, from the new bag emit): getValue = s2.p4@L10 × 100 = 0.3 × 100 = 30
  // (the percent-format ×100 folds into getValue; the energy count is read raw). = 30/100 × 90 = 27.
  // s2.p4 (9-entry table) clamps to 0.3 for levels ≥ 9. Modelled WITHOUT the eye-of-judgment gate. NEVER baked.
  {
    name: "burst_dmg_bonus",
    category: "other",
    output: { kind: "static" },
    multipliers: [
      { scaling: "burst_energy_cost", leveling: "", values: { getValue: () => RaidenShogunTalents.s2.p4.getValue(10) * 100 } },
    ],
  },
];

// ---------------------------------------------------------------------------
// Toggle conditions
// ---------------------------------------------------------------------------

// "Eye of Stormy Judgment" skill bonus: dmg_burst += energy_cost × baal_burst_bonus.
// Raw RaidenShogun.js:185-192 — PostEffectStats{ from:'burst_energy_cost'(=90),
// percent:skill.'baal_burst_bonus' = 0.3% per energy → dmg_burst = 90 × 0.3 = 27 }.
// BUILD-COUPLED at the oracle's elemental talent level 10 (the per-energy table tops out
// at 0.3 — its last entry — so levels ≥ 9 all yield 0.3).
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
  // Resolve-stacks char-level multiplier (Musou Isshin): a per-Resolve-stack ATK% bonus
  // (s3.p3, baal_resolve_atk) added to the base term of every raiden_attacks-tagged feature
  // (the burst-stance normals/charged/plunge), scaled by min(baal_resolve_stacks, 60). Gated on
  // the burst stance; at 0 stacks (dump default) the stacksFactor is 0 → contributes nothing.
  // raw RaidenShogun.js:675-687 (char.multipliers, target.tags:['raiden_attacks']).
  multipliers: [
    {
      leveling: "char_skill_burst",
      values: talents.get("burst.baal_resolve_atk"),
      stacksFactor: { setting: "baal_resolve_stacks", maxStacks: 60 },
      target: { damageTypes: [], tags: ["raiden_attacks"] },
      condition: STANCE,
      source: "talent_burst",
    },
  ],
  // baal_musou_isshin burst-stance toggle: publishes attack_infusion:'electro' so the
  // burst-stance normals/charged/plunge (no explicit element) resolve electro. The moveset
  // swap is via the per-feature STANCE / NOT_STANCE gates above. raw RaidenShogun.js:637-646.
  conditions: [
    { type: "boolean", name: "baal_musou_isshin", settings: { attack_infusion: "electro" } },
    ...toggleConditions,
    ...constellationConditions,
  ],
};
