/**
 * Ineffa — P1.7b Lunar-Charged representative (electro polearm).
 *
 * Exercises the electro stat table, crit-rate ascension substat, and the
 * crit-bearing Lunar-Charged archetype. Standard damage features (normal
 * attacks, skill, burst) compile via the normal-hit path; the Lunar-Charged
 * features route through the P1.6 reaction factory (see compileFeature's
 * `compileReaction`):
 *   - `reaction.lunarcharged_contrubution` — rate-based Lunar-Charged reaction
 *     (`1.8 × (1+lunarcharged_multi) × levelMult × (1+emBonus+…) × res`, crits).
 *   - `skill.ineffa_birgitta_coordinated_dmg` — A1 base-scaled lunardirect hit
 *     (`A1 65% × ATK × (1+lunarcharged_multi) × (1+emBonus+…) × 3 × res`, crits).
 *
 * Post-effects:
 *   - "Assemblage Hub" passive sets the Lunar-Charged scaling stat from ATK:
 *     lunarcharged_multi = min(0.00007 × atk_total, 0.14). Flows through
 *     buildStats; the reaction features read it via scalingStatKeys.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Ineffa.js
 *   raw/genshin_calc_pub/src/js/db/Features/Reactions.js (lunarcharged_contrubution)
 *   raw/genshin_calc_pub/src/js/classes/Feature2/Reaction/Transformative/Lunar/*.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js:4320
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js:2240
 */

import type {
  CharPostEffect,
  Condition,
  DbObjectChar,
  Feature,
  TalentResolver,
} from "@genshin/types";
import { Ineffa as IneffaStatTable } from "../generated/charTables.js";
import { Ineffa as IneffaTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return IneffaTalents.s1.p1;
      if (name === "normal_hit_2") return IneffaTalents.s1.p2;
      if (name === "normal_hit_3_1") return IneffaTalents.s1.p3;
      if (name === "normal_hit_3_2") return IneffaTalents.s1.p4;
      if (name === "normal_hit_4") return IneffaTalents.s1.p5;
      if (name === "charged_hit") return IneffaTalents.s1.p6;
      if (name === "plunge") return IneffaTalents.s1.p8;
      if (name === "plunge_low") return IneffaTalents.s1.p9;
      if (name === "plunge_high") return IneffaTalents.s1.p10;
    }
    if (talent === "skill") {
      if (name === "skill_dmg") return IneffaTalents.s2.p1;
      if (name === "shield_percent") return IneffaTalents.s2.p2;
      if (name === "shield_flat") return IneffaTalents.s2.p3;
      if (name === "ineffa_birgitta_dmg") return IneffaTalents.s2.p4;
    }
    if (talent === "burst") {
      if (name === "burst_dmg") return IneffaTalents.s3.p1;
    }
    throw new Error(`ineffa talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Lunar-Charged constants & shared reaction stat keys
// ---------------------------------------------------------------------------

/** A1 "Overclocking Circuit" coordinated-attack multiplier (65% of ATK). */
const A1_COORDINATED_DMG = 65;
/** ChargedLike flat amplifying factor: CMultiplierAmplifying([3%]) → bare ×3. */
const LUNAR_DIRECT_AMPLIFY = 3;
/** `(1 + lunarcharged_multi)` rate/base scaling key (her getScalingStat). */
const LUNAR_SCALING_KEYS = ["lunarcharged_multi"] as const;
/** Reaction-DMG-bonus key folded into `(1 + emBonus + Σ)`. */
const LUNAR_REACTION_BONUS_KEYS = ["dmg_reaction_lunarcharged"] as const;
/**
 * Crit keys read from the build. buildStats folds the per-element/-type crit
 * keys her engine sums (`crit_rate_electro`, …) into the aggregated totals, so
 * the data layer reads the totals — same convention as the normal-hit path.
 */
const LUNAR_CRIT_RATE_KEYS = ["crit_rate_total"] as const;
const LUNAR_CRIT_DMG_KEYS = ["crit_dmg_total"] as const;

// ---------------------------------------------------------------------------
// Post-effects
// ---------------------------------------------------------------------------

/**
 * "Assemblage Hub" passive — sets the Lunar-Charged scaling stat from ATK:
 *   lunarcharged_multi = min(0.00007 × atk_total, 0.14)
 *
 * Her `lunarPost` (Ineffa.js:139-142) is a `PostEffectStatsAtk` writing the
 * percent stat `lunarcharged_multi` at `PassiveLunarScale/100 = 0.7/100 = 0.007`
 * of ATK, capped at `PassiveLunarScaleCap = 14`. Because `isPercent('…_multi')`
 * is true (Stats.js:332), `PostEffectStats.getTree` (Stats.js:58-65) divides
 * both by a further 100 — yielding ratio 0.00007 and an ABSOLUTE cap of 0.14.
 * Unconditional (no `condition` on lunarPost).
 *
 * Source: raw/genshin_calc_pub/src/js/db/Char/Ineffa.js:125-142
 *         raw/genshin_calc_pub/src/js/classes/PostEffect/Stats.js:58-65
 *         raw/genshin_calc_pub/src/js/classes/Stats.js:327-337 (isPercent)
 */
const PASSIVE_LUNAR_SCALE = 0.7; // raw PassiveLunarScale
const PASSIVE_LUNAR_SCALE_CAP = 14; // raw PassiveLunarScaleCap
const lunarMultiFromAtk: CharPostEffect = {
  priority: 1,
  fromStat: "atk",
  toStat: "lunarcharged_multi",
  // /100 (her `percent`) then /100 again (isPercent fold) → 0.00007.
  ratio: PASSIVE_LUNAR_SCALE / 100 / 100,
  // statCap 14, isPercent-folded /100 → absolute 0.14.
  capValue: PASSIVE_LUNAR_SCALE_CAP / 100,
};

/**
 * A4 "Panoramic Permutation Protocol" — SELF-side ATK→EM conversion (the
 * teammate mirror already exists on `partyData.postEffects`; this is the
 * missing self version).
 *
 * Her `emBuffPost` (Ineffa.js:130-133) is a `PostEffectStatsAtk` writing the
 * FLAT stat `mastery` at `A4EmScale/100 = 6/100 = 0.06` of ATK, gated by
 * `ConditionBoolean('ineffa_panoramic_permutation_protocol')` (the A4 toggle,
 * `ConditionAscensionChar({ascension:4})`-gated in her `conditions` list — the
 * toggle's own visibility gate, not re-checked by the post-effect itself).
 * `mastery` is NOT `isPercent` (Stats.js:332) → no extra /100 fold, matching
 * the already-ported `partyData` mirror's `ratio: 0.06` exactly.
 *
 * Source: raw/genshin_calc_pub/src/js/db/Char/Ineffa.js:130-133,190-199
 *         raw/genshin_calc_pub/src/js/classes/PostEffect/Stats/Atk.js
 */
const A4_EM_SCALE = 6; // raw A4EmScale
const emFromAtk: CharPostEffect = {
  priority: 1,
  fromStat: "atk",
  toStat: "mastery",
  ratio: A4_EM_SCALE / 100,
  conditions: [{ type: "boolean", name: "ineffa_panoramic_permutation_protocol" }],
};

/**
 * C1 "Rectifying Processor" — SELF-side ATK→`dmg_reaction_lunarcharged` bonus,
 * feeding the SAME `LUNAR_REACTION_BONUS_KEYS` every lunarcharged/lunardirect
 * feature above already reads.
 *
 * Her `lunarPost2` (Ineffa.js:144-151) is a `PostEffectStatsAtk` writing the
 * percent stat `dmg_reaction_lunarcharged` at `C1AtkScale/100 = 2.5/100 = 0.025`
 * of ATK, capped at `C1AtkScaleCap = 50`, gated by
 * `ConditionAnd([ConditionConstellation(1), ConditionBoolean('ineffa_rectifying_processor')])`.
 *
 * IMPORTANT scale note (differs from `lunarMultiFromAtk` above): raw applies a
 * SECOND `isPercent` /100 fold inside `PostEffectStats.getTree` because
 * `dmg_reaction_lunarcharged` is a percent stat there. In THIS engine that key
 * is emitted via `REACTION_BONUS_PERCENT_KEYS` (buildStats.ts), which expects
 * every contribution in the shared `raw` bag to be a RAW PERCENT (e.g.
 * FracturedHalo 40-80, ThunderingFury 20) and applies the /100 fold ONCE,
 * uniformly, at emit time — a post-effect contribution sharing that same bag
 * key must therefore write a RAW PERCENT too (single fold, `C1AtkScale/100`),
 * NOT the doubly-folded fraction, so it combines correctly with any
 * condition-sourced contribution to the same key. `capValue` is likewise the
 * raw `C1AtkScaleCap` (50), not `/100`, for the same reason: at emit the
 * capped raw-percent bonus is divided by 100 exactly once, landing on the same
 * 0.5 fraction ceiling her double-folded engine produces.
 *
 * Source: raw/genshin_calc_pub/src/js/db/Char/Ineffa.js:144-151,392-409
 *         packages/data/src/buildStats.ts (`REACTION_BONUS_PERCENT_KEYS`)
 */
const C1_ATK_SCALE = 2.5; // raw C1AtkScale
const C1_ATK_SCALE_CAP = 50; // raw C1AtkScaleCap (raw-percent units, not /100)
const lunarReactionBonusFromAtk: CharPostEffect = {
  priority: 1,
  fromStat: "atk",
  toStat: "dmg_reaction_lunarcharged",
  ratio: C1_ATK_SCALE / 100,
  capValue: C1_ATK_SCALE_CAP,
  conditions: [
    { type: "constellation", constellation: 1 },
    { type: "boolean", name: "ineffa_rectifying_processor" },
  ],
};

// ---------------------------------------------------------------------------
// Features (normal damage + the crit-bearing Lunar-Charged family)
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (electro element via character innate) ---
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
  // normal_hit_3: multihit (2 × p3 per hit)
  {
    name: "normal_hit_3",
    category: "attack",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3_1") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3_2") }] },
    ],
  },
  {
    name: "normal_hit_3_1",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3_1") }],
  },
  {
    name: "normal_hit_4",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4") }],
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
  // --- Skill: Carrier Frequency ---
  {
    name: "skill_dmg",
    category: "skill",
    element: "electro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.skill_dmg") }],
  },
  // --- Shield: Carrier Frequency (ATK-scaled) ---
  // raw: FeatureShield, category:'skill', FeatureMultiplierList (no scaling → ATK default).
  // getList('skill.ineffa_base_shield_dmg_absorption') → [s2.p2 (%), s2.p3 (flat)].
  // raw/genshin_calc_pub/src/js/db/Char/Ineffa.js:266-275
  {
    name: "ineffa_base_shield_dmg_absorption",
    category: "skill",
    output: { kind: "shield" },
    multipliers: [
      { leveling: "char_skill_elemental", values: talents.get("skill.shield_percent"), flatValues: talents.get("skill.shield_flat") },
    ],
  },
  {
    name: "ineffa_birgitta_dmg",
    category: "skill",
    element: "electro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.ineffa_birgitta_dmg") }],
  },
  // --- Burst: Cyclonic Exterminator ---
  {
    name: "burst_dmg",
    category: "burst",
    element: "electro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") }],
  },
  // --- Lunar-Charged: standalone reaction (rate-based, crit-bearing) ---
  // 1.8 × (1+lunarcharged_multi) × levelMult × (1 + 6·EM/(EM+2000) + dmg_reaction) × res.
  // Source: raw/.../db/Features/Reactions.js (FeatureReactionLunarCharged 'lunarcharged_contrubution').
  {
    name: "lunarcharged_contrubution",
    category: "reaction",
    damageType: "lunarreaction",
    reaction: {
      variant: "lunarcharged",
      element: "electro",
      scalingStatKeys: LUNAR_SCALING_KEYS,
      reactionBonusKeys: LUNAR_REACTION_BONUS_KEYS,
      critRateKeys: LUNAR_CRIT_RATE_KEYS,
      critDmgKeys: LUNAR_CRIT_DMG_KEYS,
    },
  },
  // Penalized variants: same formula but rate × 1/2 and rate × 1/12.
  // Source: raw/.../db/Features/Reactions.js:99-112 (penalty: 1/2, 1/12).
  {
    name: "lunarcharged_contrubution_2",
    category: "reaction",
    damageType: "lunarreaction",
    reaction: {
      variant: "lunarcharged",
      element: "electro",
      scalingStatKeys: LUNAR_SCALING_KEYS,
      reactionBonusKeys: LUNAR_REACTION_BONUS_KEYS,
      critRateKeys: LUNAR_CRIT_RATE_KEYS,
      critDmgKeys: LUNAR_CRIT_DMG_KEYS,
      penalty: 1 / 2,
    },
  },
  {
    name: "lunarcharged_contrubution_12",
    category: "reaction",
    damageType: "lunarreaction",
    reaction: {
      variant: "lunarcharged",
      element: "electro",
      scalingStatKeys: LUNAR_SCALING_KEYS,
      reactionBonusKeys: LUNAR_REACTION_BONUS_KEYS,
      critRateKeys: LUNAR_CRIT_RATE_KEYS,
      critDmgKeys: LUNAR_CRIT_DMG_KEYS,
      penalty: 1 / 12,
    },
  },
  // --- A1 lunardirect: Birgitta coordinated attack (base-scaled, crit-bearing) ---
  // (65% × ATK) × (1+lunarcharged_multi) × (1 + 6·EM/(EM+2000) + dmg_reaction) × 3 × res.
  // Source: raw/.../db/Char/Ineffa.js (FeatureReactionLunarChargedLike, ascension1).
  {
    name: "ineffa_birgitta_coordinated_dmg",
    category: "skill",
    damageType: "lunardirect",
    multipliers: [
      { leveling: "", scaling: "atk", values: { getValue: () => A1_COORDINATED_DMG } },
    ],
    reaction: {
      variant: "lunardirect",
      element: "electro",
      scalingStatKeys: LUNAR_SCALING_KEYS,
      reactionBonusKeys: LUNAR_REACTION_BONUS_KEYS,
      amplifyingMultiplier: LUNAR_DIRECT_AMPLIFY,
      critRateKeys: LUNAR_CRIT_RATE_KEYS,
      critDmgKeys: LUNAR_CRIT_DMG_KEYS,
    },
  },
  // --- C2 "Support Cleaning Module": Punishment Edict burst lunardirect (300% ATK) ---
  // FeatureReactionLunarChargedLike, category:'burst', cons-added at C≥2.
  // (300% × ATK) × (1+lunarcharged_multi) × (1 + emBonus + dmg_reaction) × 3 × res.
  // Raw Ineffa.js:307-319 (FeatureReactionLunarChargedLike, C2Dmg=300, ConditionConstellation(2)).
  {
    name: "ineffa_punishment_edict_dmg",
    category: "burst",
    damageType: "lunardirect",
    condition: { type: "constellation", constellation: 2 },
    multipliers: [
      {
        leveling: "",
        scaling: "atk",
        values: { getValue: (_level: number) => 300 },
        source: "constellation2",
      },
    ],
    reaction: {
      variant: "lunardirect",
      element: "electro",
      scalingStatKeys: LUNAR_SCALING_KEYS,
      reactionBonusKeys: LUNAR_REACTION_BONUS_KEYS,
      amplifyingMultiplier: LUNAR_DIRECT_AMPLIFY,
      critRateKeys: LUNAR_CRIT_RATE_KEYS,
      critDmgKeys: LUNAR_CRIT_DMG_KEYS,
    },
  },
  // --- C6 "A Dawning Morn for You": Carrier Flow composite lunardirect (135% ATK) ---
  // FeatureReactionLunarChargedLike, category:'other' → omit category, cons-added at C≥6.
  // (135% × ATK) × (1+lunarcharged_multi) × (1 + emBonus + dmg_reaction) × 3 × res.
  // Raw Ineffa.js:338-350 (FeatureReactionLunarChargedLike, C6Dmg=135, ConditionConstellation(6)).
  {
    name: "ineffa_carrier_flow_composite_dmg",
    damageType: "lunardirect",
    condition: { type: "constellation", constellation: 6 },
    multipliers: [
      {
        leveling: "",
        scaling: "atk",
        values: { getValue: (_level: number) => 135 },
        source: "constellation6",
      },
    ],
    reaction: {
      variant: "lunardirect",
      element: "electro",
      scalingStatKeys: LUNAR_SCALING_KEYS,
      reactionBonusKeys: LUNAR_REACTION_BONUS_KEYS,
      amplifyingMultiplier: LUNAR_DIRECT_AMPLIFY,
      critRateKeys: LUNAR_CRIT_RATE_KEYS,
      critDmgKeys: LUNAR_CRIT_DMG_KEYS,
    },
  },
  // --- A4 static readout: other.mastery_bonus = ATK→EM conversion value (A4EmScale% of ATK) ---
  // FeaturePostEffectValue(PostEffectStatsAtk, percent=const A4EmScale/100=0.06), format="".
  // The ineffa_panoramic toggle gates the post-effect's APPLICATION; the readout shows the ungated
  // value (oracle nonzero at solo). raw/genshin_calc_pub/src/js/db/Char/Ineffa.js:134-137,320-324 (A4EmScale=6).
  {
    name: "mastery_bonus",
    category: "other",
    output: { kind: "static" },
    multipliers: [
      { scaling: "atk", leveling: "", values: { getValue: () => 6 } },
    ],
  },
  // --- other.ineffa_lunar_bonus: lunar-charged DMG-bonus readout (FeaturePostEffectValue(lunarPost) → static) ---
  // Raw Ineffa.js:139-142,325-328 — lunarPost = PostEffectStatsAtk({ percent: StatTable('lunarcharged_multi',
  // [PassiveLunarScale/100 = 0.007]), statCap: ValueTable([PassiveLunarScaleCap=14]) }), format:'percent'.
  // Her getTree: value(=0.007)/100 (isPercent('…_multi')) × atk_total (REAL_TOTAL → full magnitude) × 100
  // (format:'percent') = 0.007 × atk_total, capped at 14. In our engine (getValue/100) × atk_total, so
  // getValue = (PassiveLunarScale/100) × 100 = PassiveLunarScale = 0.7 folds the percent-format ×100 in.
  // capValue = raw PassiveLunarScaleCap 14 (display units; the cap BINDS at this solo build → output 14.0).
  // Same PostEffectStatsAtk shape as the green sibling mastery_bonus above. Modelled WITHOUT the
  // ineffa_panoramic application gate (ungated readout the oracle dumps). NEVER baked.
  {
    name: "ineffa_lunar_bonus",
    category: "other",
    output: { kind: "static" },
    multipliers: [
      { scaling: "atk", leveling: "", values: { getValue: () => PASSIVE_LUNAR_SCALE }, capValue: PASSIVE_LUNAR_SCALE_CAP },
    ],
  },
  // --- other.ineffa_lunar_bonus_2: C1 lunar-charged DMG-bonus readout (FeaturePostEffectValue(lunarPost2) → static) ---
  // Raw Ineffa.js:144-151,331-337 — lunarPost2 = PostEffectStatsAtk({ percent: StatTable('dmg_reaction_lunarcharged',
  // [C1AtkScale/100 = 0.025]), statCap: ValueTable([C1AtkScaleCap=50]) }), format:'percent', condition:
  // ConditionAnd([ConditionConstellation(1), ConditionBoolean(ineffa_rectifying_processor)]) on the postEffect,
  // PLUS the feature's own condition:ConditionConstellation(1). 'dmg_reaction_lunarcharged' isPercent (Stats.js
  // `dmg_` prefix) → her /100 and format:'percent' ×100 CANCEL = 0.025×atk_total, capped 50. values = C1AtkScale
  // (=2.5) folds the percent-format ×100 in — the SAME ratio the lunarReactionBonusFromAtk postEffect above
  // applies (reused constants, not re-derived). Modelled WITHOUT the ineffa_rectifying_processor toggle
  // (FeaturePostEffectValue ignores the postEffect's own conditions — the sibling ineffa_lunar_bonus precedent)
  // but WITH the feature-level ConditionConstellation(1) gate (mirrors the postEffect's ConditionAnd's
  // constellation half).
  {
    name: "ineffa_lunar_bonus_2",
    category: "other",
    output: { kind: "static" },
    condition: { type: "constellation", constellation: 1 },
    multipliers: [
      { scaling: "atk", leveling: "", values: { getValue: () => C1_ATK_SCALE }, capValue: C1_ATK_SCALE_CAP },
    ],
  },
];

// ---------------------------------------------------------------------------
// Constellation conditions (P2.C)
// ---------------------------------------------------------------------------
// C1: ConditionBoolean toggle (ineffa_rectifying_processor → dmg_reaction_lunarcharged
//     via the `lunarReactionBonusFromAtk` postEffect, gated `and[constellation1, boolean toggle]`).
//     ineffa_lunar_bonus_2 display value (her `ineffa_lunar_bonus_2` static readout,
//     damageType:"") still skipped — not in the damage-output coverage gate.
// C2: ineffa_punishment_edict_dmg feature (cons-added, gated above).
// C3: +3 levels to Carrier Frequency (skill). Raw cons[2] settings char_skill_elemental_bonus:3.
// C4: ConditionStatic display-only → SKIP.
// C5: +3 levels to Cyclonic Exterminator (burst). Raw cons[4] settings char_skill_burst_bonus:3.
// C6: ineffa_carrier_flow_composite_dmg feature (cons-added, gated above).
//     Raw cons[5] ConditionStatic with text_percent_dmg → display-only, SKIP.
// Raw: raw/genshin_calc_pub/src/js/db/Char/Ineffa.js constellation array (Ineffa.js:392-455).
const constellationConditions: readonly Condition[] = [
  // C3: +3 levels to Carrier Frequency (elemental skill). Raw cons[2].
  { type: "constellation", constellation: 3, settings: { char_skill_elemental_bonus: 3 } },
  // C5: +3 levels to Cyclonic Exterminator (elemental burst). Raw cons[4].
  { type: "constellation", constellation: 5, settings: { char_skill_burst_bonus: 3 } },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const ineffa: DbObjectChar = {
  name: "ineffa",
  gameId: 10000116,
  rarity: 5,
  element: "electro",
  weapon: "polearm",
  origin: "nodkrai",
  statTable: IneffaStatTable,
  talents,
  features,
  multipliers: [],
  conditions: constellationConditions,
  postEffects: [lunarMultiFromAtk, emFromAtk, lunarReactionBonusFromAtk],
  // Her `allowed_lunarcharged: 1` default (Char/Ineffa.js:355) — suppresses the
  // generic `electrocharged` contribution; the Lunar-Charged variants are declared
  // explicitly in `features` above.
  lunarChargedActive: true,
  // partyData — teammate kit buffs (P3.5.2 Bucket B).
  // Source: raw/genshin_calc_pub/src/js/db/Char/Ineffa.js:456-519
  // Scope: effect 1 only — A4 "Panoramic Permutation Protocol" ATK→EM (6/100 per ATK unit).
  // Defer: effect 2 (lunarcharged_multi always-on, raw Ineffa.js:507-511) and
  //   effect 3 (C1 dmg_reaction_lunarcharged, Ineffa.js:512-518) — both need a
  //   lunarcharged-capable recipient; addressed in the variant/engine pass.
  partyData: {
    loadStats: {
      stats: ["atk_total"],
    },
    conditions: [
      // ConditionNumber: lifts the teammate's atk_total into the recipient's stat bag.
      { type: "number", name: "ineffa_atk_total", max: 10000 },
      // A4 "Panoramic Permutation Protocol" master toggle.
      { type: "boolean", name: "party.ineffa_panoramic_permutation_protocol" },
    ],
    postEffects: [
      // A4 "Panoramic Permutation Protocol": ATK → +EM (6 per 100 ATK = 0.06 per ATK unit).
      // Raw Ineffa.js:502-506: PostEffectStats{ from:'ineffa_atk_total',
      //   percent: new StatTable('mastery', [A4EmScale/100]) }. A4EmScale=6, /100=0.06.
      // 'mastery' is NOT isPercent → no extra /100 fold → ratio = 0.06 directly.
      // e.g. 2000 ATK → 2000 × 0.06 = 120 EM.
      {
        fromStat: "ineffa_atk_total",
        toStat: "mastery",
        ratio: 0.06,  // raw A4EmScale/100 = 6/100 = 0.06
        conditions: [{ type: "boolean", name: "party.ineffa_panoramic_permutation_protocol" }],
      },
    ],
  },
};
