/**
 * Yanfei — pyro catalyst ATK scaler.
 *
 * 3-hit normal combo (pyro, catalyst infuses innately), a charged hit plus the
 * Scarlet-Seal-consuming charged variants (yanfei_charged_1/2/3 — one per seal
 * consumed; the 4-seal variant yanfei_charged_4 is C6-gated → skipped at C0),
 * the A4 Blazing Eye charged follow-up (flat 80% ATK), plunge, pyro skill,
 * pyro burst. All normals/charged/plunge are pyro.
 *
 * yanfei_blazing_eye: A4 passive (Blazing Eye). Her FeatureMultiplier carries
 * `source: 'ascension4'` with a constant ValueTable [80] — no talent leveling,
 * so it is a flat 80%-of-ATK charged hit (modelled with a 1-entry constant
 * table). raw: FeatureDamageChargedYanfei → damageType 'charged'.
 *
 * SOLO C0 fixed-build modelling notes:
 *   - Ascension secondary is Pyro DMG (`dmg_pyro_base`, +24% at A6) — always on,
 *     auto-folded by buildStats from the generated stat table. NOT modelled here.
 *   - A1 Proviso (`text_percent_dmg`) and A4 Blazing Eye's `text_percent_dmg: 80`
 *     are display-only text rows, not stat bonuses → nothing to fold.
 *   - A1's conditional `dmg_pyro` flat bonus is Scarlet-Seal-gated (OFF in the
 *     fixed solo build with no seal toggle) → not folded.
 *   - Constellations C2/C3/C5/C6 are ported (see constellationConditions and the
 *     C6-gated yanfei_charged_4 feature below). C1's text_percent is a display-only
 *     text row with nothing to fold → skipped. C4's shield (other.yanfei_shield) IS a
 *     real FeatureShield, ported in the features list below (Task 2, display-gap burndown).
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/YanFei.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js:1428 (YanFei)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (YanFei)
 */

import type { Condition, DbObjectChar, Feature, TalentResolver, TalentTable } from "@genshin/types";
import { YanFei as YanFeiStatTable } from "../generated/charTables.js";
import { YanFei as YanFeiTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return YanFeiTalents.s1.p1;
      if (name === "normal_hit_2") return YanFeiTalents.s1.p2;
      if (name === "normal_hit_3") return YanFeiTalents.s1.p3;
      if (name === "charged_hit") return YanFeiTalents.s1.p4;
      if (name === "yanfei_charged_1") return YanFeiTalents.s1.p5;
      if (name === "yanfei_charged_2") return YanFeiTalents.s1.p6;
      if (name === "yanfei_charged_3") return YanFeiTalents.s1.p7;
      if (name === "yanfei_charged_4") return YanFeiTalents.s1.p8;
      if (name === "plunge") return YanFeiTalents.s1.p16;
      if (name === "plunge_low") return YanFeiTalents.s1.p17;
      if (name === "plunge_high") return YanFeiTalents.s1.p18;
    }
    if (talent === "skill") {
      if (name === "skill_dmg") return YanFeiTalents.s2.p1;
    }
    if (talent === "burst") {
      if (name === "burst_dmg") return YanFeiTalents.s3.p1;
    }
    throw new Error(`yanfei talents: unknown path '${path}'`);
  },
};

// A4 Blazing Eye: flat 80% ATK, no talent leveling (raw: source 'ascension4',
// ValueTable [80]). Constant 1-entry table → getValue ignores the level.
const blazingEyeValues: TalentTable = { getValue: (_level: number) => 80 };

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (pyro catalyst) ---
  {
    name: "normal_hit_1",
    category: "attack",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1") }],
  },
  {
    name: "normal_hit_2",
    category: "attack",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2") }],
  },
  {
    name: "normal_hit_3",
    category: "attack",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }],
  },
  // --- Charged attacks (pyro) ---
  // charged_hit = 0-seal charged; yanfei_charged_N = N-seal-consuming variants.
  {
    name: "charged_hit",
    category: "attack",
    damageType: "charged",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }],
  },
  {
    name: "yanfei_charged_1",
    category: "attack",
    damageType: "charged",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.yanfei_charged_1") }],
  },
  {
    name: "yanfei_charged_2",
    category: "attack",
    damageType: "charged",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.yanfei_charged_2") }],
  },
  {
    name: "yanfei_charged_3",
    category: "attack",
    damageType: "charged",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.yanfei_charged_3") }],
  },
  // --- C6 "Extra Clause": unlocks a 4th Scarlet Seal slot → yanfei_charged_4 (4-seal consume).
  // Raw FeatureDamageCharged with element 'pyro', Talents.get('attack.yanfei_charged_4'),
  // ConditionConstellation({constellation:6}). YanFei.js:212-222.
  {
    name: "yanfei_charged_4",
    category: "attack",
    damageType: "charged",
    element: "pyro",
    condition: { type: "constellation", constellation: 6 },
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.yanfei_charged_4") }],
  },
  // --- A4 Blazing Eye: flat 80% ATK charged follow-up ---
  // ROTATION object-branch hitMulti: her A4 feature is a `FeatureDamageChargedYanfei`, whose
  // `getRotationHitMiltiplier` returns `getCritRateBlock(data)` (a CCritRate, Charged/Yanfei.js:4-6)
  // pushed DIRECTLY into varNormal (Tree.js:84-85). So in a rotation this hit's whole triple is
  // scaled by its (CLAMPED) crit rate, modelling the A4 proc whose chance == the charged crit rate
  // (raw `rotationHitDescription: 'talent_activation_chance'`, YanFei.js:225). compileRotation reads
  // this flag and folds the bag's clamped crit-rate sum into the weight. The other Yanfei charged
  // features (charged_hit / yanfei_charged_1..4) are plain FeatureDamageCharged → inherited weight 1.
  {
    name: "yanfei_blazing_eye",
    category: "attack",
    damageType: "charged",
    element: "pyro",
    rotationHitMultiFromCritRate: true,
    multipliers: [{ leveling: "ascension4", values: blazingEyeValues }],
  },
  // --- Plunge attacks (pyro catalyst) ---
  {
    name: "plunge",
    category: "attack",
    damageType: "plunge",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge") }],
  },
  {
    name: "plunge_low",
    tags: ["plunge_shockwave"],
    category: "attack",
    damageType: "plunge",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_low") }],
  },
  {
    name: "plunge_high",
    tags: ["plunge_shockwave"],
    category: "attack",
    damageType: "plunge",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_high") }],
  },
  // --- C4 shield: other.yanfei_shield ---
  // FeatureShield, HP-scaled constant (no talent leveling — source:'constellation4',
  // values:StatTable('yanfei_shield', [45])). Gated ConditionConstellation(4). The prior
  // header comment dismissed C4's shield as a "display-only text row" — that described
  // the cons-array text_percent_hp:45 readout; the FeatureShield itself is a separate
  // features-array entry the display-gap sweep's non-damage fixture now checks.
  // raw/genshin_calc_pub/src/js/db/Char/YanFei.js:279-290 (values [45], pyro).
  {
    name: "yanfei_shield",
    category: "other",
    output: { kind: "shield" },
    condition: { type: "constellation", constellation: 4 },
    multipliers: [
      { scaling: "hp", leveling: "", values: { getValue: () => 45 } },
    ],
  },
  // --- Skill: Signed Edict ---
  {
    name: "skill_dmg",
    category: "skill",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.skill_dmg") }],
  },
  // --- Burst: Done Deal ---
  {
    name: "burst_dmg",
    category: "burst",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") }],
  },
];

// Burst "Done Deal" — "Brilliance" Scarlet-Seal regeneration grants Charged-Attack DMG% per her OWN
// burst talent level (her ConditionBooleanLevels yanfei_brilliance, levelSetting char_skill_burst,
// StatTable('yanfei_charged_bonus', s3.p2) aliased to dmg_charged). Values = YanFeiTalents.s3.p2
// (burst levels 1..15). raw YanFei.js:301-310.
const BRILLIANCE_DMG_CHARGED: readonly number[] = [
  33.4, 35.4, 37.4, 40, 42, 44, 46.6, 49.2, 51.8, 54.4, 57, 59.6, 62.2, 64.8, 67.4,
];

// ---------------------------------------------------------------------------
// Conditions (P2.C) — SELF buffs (golden-blind SKIPPED: the port modelled nothing here; all are
// toggle/stack/cons-gated → OFF in the fixed solo build, so the 58k DAMAGE goldens never exercised
// them — a diff-parity sweep surfaced her pyro/charged hits diverging):
//   "Brilliance" (yanfei_brilliance): +Charged DMG% per OWN burst talent level (above table),
//     ConditionBooleanLevels toggle. raw YanFei.js:301-310.
//   A1 "Proviso" / Scarlet Seal (yanfei_scarlet_seal): +5% Pyro DMG per consumed Scarlet Seal
//     (table [5,10,15,20] indexed by the seal count), ConditionLevels gated boolean(yanfei_scarlet_seal)
//     [+ ascension-1, vacuous at A6]. raw YanFei.js:331-341. (The seal ConditionStacks itself only
//     adds stamina_consume — damage-inert, omitted.)
//   C2 "Right of Final Interpretation" (yanfei_interpretation): +20% Charged-Attack CRIT Rate
//     (crit_rate_charged auto-applies to charged hits by damageType), gated C2 (THE CONSTELLATION IS
//     A GATE). text_percent_hp display omitted. raw YanFei.js:379-388.
// C1: ConditionStatic stats:{text_percent:10} — display-only, SKIP.
// C3: +3 levels to Signed Edict (skill). Raw cons[2] settings char_skill_elemental_bonus:3.
// C4: ConditionStatic stats:{text_percent_hp:45} display row is display-only; but the
//     FeatureShield itself (other.yanfei_shield, no damage triple, category 'other') is
//     ported above in the features list (Task 2, display-gap burndown).
// C5: +3 levels to Done Deal (burst). Raw char-level condition with
//     subConditions:[ConditionConstellation({constellation:5})].
// C6: cons-ADDED feature yanfei_charged_4 handled above in features array.
//     Raw cons[5] has ConditionStatic — display only, SKIP.
// Raw: db/Char/YanFei.js constellation array + conditions array (YanFei.js:292-420).
const constellationConditions: readonly Condition[] = [
  // C3: +3 levels to elemental skill talent.
  { type: "constellation", constellation: 3, settings: { char_skill_elemental_bonus: 3 } },
  // C5: +3 levels to burst talent (raw: char conditions entry gated by ConditionConstellation(5)).
  { type: "constellation", constellation: 5, settings: { char_skill_burst_bonus: 3 } },
  // SELF "Brilliance" — +Charged DMG% per OWN burst talent level. ConditionBooleanLevels toggle
  // (ungated; reads char_skill_burst incl. the C5 +3 bonus). raw YanFei.js:301-310.
  {
    type: "static-level",
    levelSetting: "char_skill_burst",
    levelStats: { dmg_charged: BRILLIANCE_DMG_CHARGED },
    condition: { type: "boolean", name: "yanfei_brilliance" },
  },
  // SELF A1 Scarlet Seal — +5/10/15/20% Pyro DMG at 1/2/3/4 consumed seals (yanfei_scarlet_seal-
  // indexed). Gated boolean(yanfei_scarlet_seal) (ascension-1 sub vacuous at A6). raw YanFei.js:331-341.
  {
    type: "static-level",
    levelSetting: "yanfei_scarlet_seal",
    levelStats: { dmg_pyro: [5, 10, 15, 20] },
    condition: { type: "boolean", name: "yanfei_scarlet_seal" },
  },
  // SELF C2 "Right of Final Interpretation" — +20% Charged CRIT Rate (crit_rate_charged auto-applies
  // to charged hits). ConditionBoolean gated at C2 (THE CONSTELLATION IS A GATE). raw YanFei.js:379-388.
  {
    type: "boolean",
    name: "yanfei_interpretation",
    stats: { crit_rate_charged: 20 },
    condition: { type: "constellation", constellation: 2 },
  },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const yanfei: DbObjectChar = {
  name: "yanfei",
  gameId: 10000048,
  rarity: 4,
  element: "pyro",
  weapon: "catalyst",
  origin: "liyue",
  statTable: YanFeiStatTable,
  talents,
  features,
  multipliers: [],
  conditions: constellationConditions,
};
