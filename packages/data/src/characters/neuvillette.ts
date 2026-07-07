/**
 * Neuvillette — hydro catalyst HP scaler.
 *
 * Normal attacks (As Water Seeks Equilibrium): 3-hit hydro combo plus a
 * standard charged hit, AND the signature charged "Equitable Judgment"
 * (neuvillette_equitable_judgment_dmg) which is HP-scaled.
 *
 * Charged Equitable Judgment scaling: raw uses FeatureMultiplierNeuvilleteCharged,
 * whose getScalingMultiplier() returns reactionBonus.getValue(level) [1.1,1.25,1.6]
 * when settings.neuvillette_ancient_seas_legacy > 0 (the Sourcewater-droplet stacks),
 * else 1. Modelled (S2-α) via scalingMultiplierFromTable on both equitable-judgment
 * features; at level 0 (the default) the factor is 1 → a plain HP-scaled charged attack.
 * (Source: NeuvilleteCharged.js getScalingMultiplier.) Its critDamageBonuses:
 * ['crit_dmg_neuvillette'] is the C2-published crit-dmg (crit_dmg_neuvillette [0,14,28,42]
 * keyed by the SAME legacy stacks) — modelled as the C2 static-level condition below (0 at
 * legacy 0 / below C2 → base-inert).
 *
 * Plunge: plunge / plunge_low / plunge_high (hydro, char_skill_attack).
 *
 * Skill (O Tears, I Shall Repay):
 *   skill_dmg            — hydro, HP-scaled (scaling:'hp*', s2.p1)
 *   spiritbreath_thorn_dmg — hydro, ATK-scaled default (s2.p2). raw flags
 *     cannotReact; that only suppresses reaction toggling and is irrelevant to
 *     the non-reacted damage triple the fixture asserts → no field needed.
 *
 * Burst (O Tides, I Have Returned):
 *   burst_dmg                  — hydro, HP-scaled (s3.p1)
 *   neuvillette_waterfall_dmg  — hydro, HP-scaled (s3.p2)
 *
 * Conditions/post-effects OFF at baseline (inert until toggled):
 *   - A1 "Heir to the Ancient Seas' Authority" (neuvillette_ancient_seas_legacy)
 *     — Sourcewater-droplet stack ConditionStacks; drives the equitable-judgment
 *     scalingMultiplierFromTable + the C2 crit-dmg (both modelled, inert at level 0).
 *   - A4 "Discipline of the Supreme Arbitration" — ConditionNumber + boolean
 *     PostEffectStatsNeuvillette (dmg_hydro from current HP), toggle off at baseline.
 *   - C2 crit_dmg_neuvillette (static-level, gated C2; 0 at legacy 0); C6 current-HP feature.
 *
 * Reaction features (electrocharged / rupture / shatter) are emitted generically
 * by the engine — not declared on the character (cf. yelan.ts, same set).
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Neuvillette.js
 *   raw/genshin_calc_pub/src/js/classes/Feature2/Multiplier/NeuvilleteCharged.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Neuvillette)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Neuvillette)
 */

import type { CharPostEffect, Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Neuvillette as NeuvilletteStatTable } from "../generated/charTables.js";
import { Neuvillette as NeuvilletteTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1")                       return NeuvilletteTalents.s1.p1;
      if (name === "normal_hit_2")                       return NeuvilletteTalents.s1.p2;
      if (name === "normal_hit_3")                       return NeuvilletteTalents.s1.p3;
      if (name === "charged_hit")                        return NeuvilletteTalents.s1.p4;
      if (name === "neuvillette_equitable_judgment_dmg") return NeuvilletteTalents.s1.p5;
      if (name === "plunge")                             return NeuvilletteTalents.s1.p11;
      if (name === "plunge_low")                         return NeuvilletteTalents.s1.p12;
      if (name === "plunge_high")                        return NeuvilletteTalents.s1.p13;
    }
    if (talent === "skill") {
      if (name === "skill_dmg")              return NeuvilletteTalents.s2.p1;
      if (name === "spiritbreath_thorn_dmg") return NeuvilletteTalents.s2.p2;
    }
    if (talent === "burst") {
      if (name === "burst_dmg")                 return NeuvilletteTalents.s3.p1;
      if (name === "neuvillette_waterfall_dmg") return NeuvilletteTalents.s3.p2;
    }
    throw new Error(`neuvillette talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (hydro catalyst) ---
  {
    name: "normal_hit_1",
    category: "attack",
    element: "hydro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1") }],
  },
  {
    name: "normal_hit_2",
    category: "attack",
    element: "hydro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2") }],
  },
  {
    name: "normal_hit_3",
    category: "attack",
    element: "hydro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }],
  },
  // --- Charged attacks ---
  // raw: FeatureDamageCharged charged_hit (hydro, ATK-scaled)
  {
    name: "charged_hit",
    category: "attack",
    damageType: "charged",
    element: "hydro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }],
  },
  // raw: FeatureDamageCharged neuvillette_equitable_judgment_dmg (hydro, HP-scaled).
  // FeatureMultiplierNeuvilleteCharged: the scaling multiplier is a ValueTable [1.1,1.25,1.6]
  // keyed by the Sourcewater-droplet stacks `neuvillette_ancient_seas_legacy` (=1 at level 0),
  // ported via scalingMultiplierFromTable (S2-α). raw carries critDamageBonuses:
  // ['crit_dmg_neuvillette'] — the C2 crit-dmg published by the C2 static-level below (0 at
  // legacy 0 / below C2, so base-inert). Both are co-driven by the SAME legacy stacks.
  {
    name: "neuvillette_equitable_judgment_dmg",
    category: "attack",
    damageType: "charged",
    element: "hydro",
    critDamageBonuses: ["crit_dmg_neuvillette"],
    multipliers: [
      {
        scaling: "hp",
        leveling: "char_skill_attack",
        values: talents.get("attack.neuvillette_equitable_judgment_dmg"),
        scalingMultiplierFromTable: { table: [1.1, 1.25, 1.6], levelSetting: "neuvillette_ancient_seas_legacy" },
      },
    ],
  },
  // C6 "Wrathful Recompense": cons-added charged hit at 10% HP per interval.
  // Raw: Neuvillette.js features FeatureDamageCharged neuvillette_equitable_judgment_current_dmg,
  // FeatureMultiplierNeuvilleteCharged scaling:'hp*', values: ValueTable([10]),
  // source:'constellation6', condition:ConditionConstellation({constellation:6}).
  // Same NeuvilleteCharged table as the A1 hit: scalingMultiplierFromTable [1.1,1.25,1.6] keyed
  // by neuvillette_ancient_seas_legacy (=1 at level 0 → plain HP%). critDamageBonuses:
  // ['crit_dmg_neuvillette'] (0 at legacy 0, safe at C0).
  {
    name: "neuvillette_equitable_judgment_current_dmg",
    category: "attack",
    damageType: "charged",
    element: "hydro",
    critDamageBonuses: ["crit_dmg_neuvillette"],
    condition: { type: "constellation", constellation: 6 },
    multipliers: [
      {
        scaling: "hp",
        leveling: "char_skill_attack",
        values: { getValue: (_level: number) => 10 },
        source: "constellation6",
        scalingMultiplierFromTable: { table: [1.1, 1.25, 1.6], levelSetting: "neuvillette_ancient_seas_legacy" },
      },
    ],
  },
  // --- Plunge attacks (hydro) ---
  {
    name: "plunge",
    category: "attack",
    damageType: "plunge",
    element: "hydro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge") }],
  },
  {
    name: "plunge_low",
    tags: ["plunge_shockwave"],
    category: "attack",
    damageType: "plunge",
    element: "hydro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_low") }],
  },
  {
    name: "plunge_high",
    tags: ["plunge_shockwave"],
    category: "attack",
    damageType: "plunge",
    element: "hydro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_high") }],
  },
  // --- Skill: O Tears, I Shall Repay ---
  // raw: FeatureDamageSkill skill_dmg (hydro, HP-scaled)
  {
    name: "skill_dmg",
    category: "skill",
    element: "hydro",
    multipliers: [{ scaling: "hp", leveling: "char_skill_elemental", values: talents.get("skill.skill_dmg") }],
  },
  // raw: FeatureDamageSkill spiritbreath_thorn_dmg (hydro, ATK-scaled, cannotReact)
  {
    name: "spiritbreath_thorn_dmg",
    category: "skill",
    element: "hydro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.spiritbreath_thorn_dmg") }],
  },
  // --- Burst: O Tides, I Have Returned ---
  // raw: FeatureDamageBurst burst_dmg (hydro, HP-scaled)
  {
    name: "burst_dmg",
    category: "burst",
    element: "hydro",
    multipliers: [{ scaling: "hp", leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") }],
  },
  // raw: FeatureDamageBurst neuvillette_waterfall_dmg (hydro, HP-scaled)
  {
    name: "neuvillette_waterfall_dmg",
    category: "burst",
    element: "hydro",
    multipliers: [{ scaling: "hp", leveling: "char_skill_burst", values: talents.get("burst.neuvillette_waterfall_dmg") }],
  },
];

// ---------------------------------------------------------------------------
// Constellation conditions (P2.C)
// ---------------------------------------------------------------------------
// C1 "Venerable Institution": ConditionStatic display-only → SKIP.
// C2 "Juridical Exhortation": ConditionStaticLevel — crit_dmg_neuvillette [0,14,28,42] keyed by
//    neuvillette_ancient_seas_legacy (fromZero, C2CritDmg=14), gated C2. Picked up by the two
//    equitable-judgment features' critDamageBonuses. Modelled (S2-α): the SAME legacy stacks that
//    drive the scalingMultiplierFromTable also drive this crit-dmg, so gate-on parity at C2+ needs it.
//    Base-inert: 0 at legacy 0 (the default) / below C2 → no golden moves.
// C3: +3 levels to As Water Seeks Equilibrium (attack). Raw cons[2] settings char_skill_attack_bonus:3.
// C4 "Crown of Commiseration": ConditionStatic display-only → SKIP.
// C5: +3 levels to O Tides, I Have Returned (burst). Raw cons[4] settings char_skill_burst_bonus:3.
// C6 "Wrathful Recompense": cons-added feature above; ConditionStatic display wrapper → no condition here.
// Raw: Neuvillette.js constellation array (Neuvillette.js:337-398), C2 at :346-360.
const constellationConditions: readonly Condition[] = [
  // C2: crit_dmg_neuvillette scaling by the Sourcewater-droplet stacks (fromZero → 0/14/28/42 at
  // legacy 0/1/2/3), gated at C2. Faithful to her ConditionStaticLevel (levelSetting the legacy key).
  {
    type: "static-level",
    levelSetting: "neuvillette_ancient_seas_legacy",
    fromZero: true,
    levelStats: { crit_dmg_neuvillette: [0, 14, 28, 42] },
    condition: { type: "constellation", constellation: 2 },
  },
  // C3: +3 levels to normal attack talent.
  { type: "constellation", constellation: 3, settings: { char_skill_attack_bonus: 3 } },
  // C5: +3 levels to elemental burst.
  { type: "constellation", constellation: 5, settings: { char_skill_burst_bonus: 3 } },
];

// A4 "High Arbitrator's Discipline" HP-input slider — owned by Neuvillette (her per-char
// ConditionNumber, raw/.../db/Char/Neuvillette.js:309-324). Emits the bag stat his A4
// post-effect reads (fromStat:"neuvillette_the_high_arbitrators_discipline"). Moved here
// from the global registry (single owner → no double-count).
const disciplineInput: Condition = {
  type: "number",
  name: "neuvillette_the_high_arbitrators_discipline",
  max: 1_000_000,
};

// ---------------------------------------------------------------------------
// Post-effects
// ---------------------------------------------------------------------------
// A4 "Discipline of the Supreme Arbitration": for every 1% of current HP above
// 30%, Neuvillette gains +0.6% Hydro DMG, capped at +30%. Faithful port of her A4
// PostEffectStatsNeuvillette (Neuvillette.js:326-335):
//   from: 'neuvillette_the_high_arbitrators_discipline',  // the HP-input slider
//   percent: StatTable('dmg_hydro', [A4HydroBonus = 0.6]),
//   exceed: 30,
//   statCap: ValueTable([A4HydroBonusCap = 30]),
//   conditions: [ConditionAscensionChar(4)].
// Her PostEffectStatsNeuvillette.getBaseValueTree (PostEffect/Stats/Neuvillette.js:7-20)
// first turns the slider into a pct: `pct = (slider > 100) ? slider/(hp_total/100) : slider`
// — modelled by `fromStatDivide: "hp"` (the >100 HP-ratio branch in buildStats). Then
// `exceed:30` ⇒ `max(0, pct − 30)` (the `offset`), `× ratio` (A4HydroBonus 0.6),
// capped at A4HydroBonusCap (30). `dmg_hydro` IS a percent stat: her getTree folds the
// ratio (0.6) and cap (30) /100 internally; our port carries the RAW A4HydroBonus/Cap
// and applies the single isPercent /100 at emit (the established percent-key idiom —
// dmg_hydro is in DMG_BONUS_ELEMENT_KEYS, /100'd in buildStats), so the post-effect
// writes `min(max(0, pct−30) × 0.6, 30)` RAW into `dmg_hydro` and the emit yields the
// fraction every hydro feature folds.
//   slider 30000, hp_total 27921.09 → pct = 107.45 → max(0, 77.45) × 0.6 = 46.47 → cap
//   30 (raw %) → /100 → +0.30 hydro DMG.
// A4 ascension gate dropped (every build is A6; Mizuki/Emilie/Furina-A4 precedent). The
// effect is instead gated on the slider being SET (> 0) — her ConditionNumber.isActive —
// so it stays fully inert (`contribute` returns {}, never a spurious dmg_hydro:0) for
// every build that does not set the slider (all 58k goldens).
const a4PostEffects: readonly CharPostEffect[] = [
  {
    fromStat: "neuvillette_the_high_arbitrators_discipline",
    fromStatDivide: "hp", // pct = 100·slider/hp_total when slider > 100 (absolute-HP input)
    offset: 30, // exceed: only HP% above 30 counts
    ratio: 0.6, // A4HydroBonus
    capValue: 30, // A4HydroBonusCap (RAW percent ceiling; /100 at emit)
    toStat: "dmg_hydro",
    conditions: [
      { type: "boolean-value", setting: "neuvillette_the_high_arbitrators_discipline", cond: "gt", value: 0 },
    ],
  },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const neuvillette: DbObjectChar = {
  name: "neuvillette",
  gameId: 10000087,
  rarity: 5,
  element: "hydro",
  weapon: "catalyst",
  origin: "fontaine",
  statTable: NeuvilletteStatTable,
  talents,
  features,
  multipliers: [],
  conditions: [...constellationConditions, disciplineInput],
  postEffects: a4PostEffects,
};
