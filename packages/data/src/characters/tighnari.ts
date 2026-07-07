/**
 * Tighnari — dendro bow ATK scaler.
 *
 * 4-hit normal combo (hit 3: 2-hit multihit, child normal_hit_3_1 isChild:true),
 * aimed/charged shots (physical aimed, dendro tighnari_charged_dmg, dendro wreath
 * arrow tighnari_wreath_arrow_dmg), dendro clusterbloom arrow, plunge/low/high,
 * dendro skill, dendro burst (primary + secondary).
 *
 * A4 "Scholarly Blade": PostEffectStatsMastery → dmg_charged_tighnari (and
 * dmg_burst_tighnari) = min(0.06 × mastery, 60%). Always-active at A6.
 *
 * SELF buffs modelled as toggle/cons-gated conditions (were golden-blind SKIPPED — the port
 * modelled only the party.* withering mirrors): A1 "Keen Sight" (mastery:50), C2 "Origins Known
 * from the Stem" (dmg_dendro:20), C4 "Withering Glimpsed in the Leaves" (mastery:60 ×2). A diff-
 * parity sweep with these toggles also exposed the A4 output cap (60%, not the 3.6% mastery-cap misread).
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Tighnari.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Tighnari)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Tighnari)
 */

import type { Condition, DbObjectChar, Feature, TalentResolver, CharPostEffect } from "@genshin/types";
import { Tighnari as TighnariStatTable } from "../generated/charTables.js";
import { Tighnari as TighnariTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return TighnariTalents.s1.p1;
      if (name === "normal_hit_2") return TighnariTalents.s1.p2;
      if (name === "normal_hit_3") return TighnariTalents.s1.p3;
      if (name === "normal_hit_4") return TighnariTalents.s1.p4;
      if (name === "aimed") return TighnariTalents.s1.p5;
      if (name === "tighnari_charged_dmg") return TighnariTalents.s1.p6;
      if (name === "tighnari_wreath_arrow_dmg") return TighnariTalents.s1.p7;
      if (name === "tighnari_clusterbloom_arrow_dmg") return TighnariTalents.s1.p8;
      if (name === "plunge") return TighnariTalents.s1.p9;
      if (name === "plunge_low") return TighnariTalents.s1.p10;
      if (name === "plunge_high") return TighnariTalents.s1.p11;
    }
    if (talent === "skill") {
      if (name === "skill_dmg") return TighnariTalents.s2.p1;
    }
    if (talent === "burst") {
      if (name === "tighnari_primary_dmg") return TighnariTalents.s3.p1;
      if (name === "tighnari_secondary_dmg") return TighnariTalents.s3.p2;
    }
    throw new Error(`tighnari talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks ---
  // raw: FeatureDamageNormal normal_hit_1 (Tighnari.js:137-144)
  {
    name: "normal_hit_1",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1") }],
  },
  // raw: FeatureDamageNormal normal_hit_2 (Tighnari.js:145-152)
  {
    name: "normal_hit_2",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2") }],
  },
  // raw: FeatureDamageMultihit normal_hit_3 (Tighnari.js:153-169) — parent, 2 hits total
  {
    name: "normal_hit_3",
    category: "attack",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }] },
    ],
  },
  // raw: FeatureDamageNormal normal_hit_3_1 (Tighnari.js:170-180) — sub-hit
  {
    name: "normal_hit_3_1",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }],
  },
  // raw: FeatureDamageNormal normal_hit_4 (Tighnari.js:181-188)
  {
    name: "normal_hit_4",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4") }],
  },
  // --- Charged attacks ---
  // raw: FeatureDamageChargedAimed aimed — physical aimed shot (Tighnari.js:189-197)
  {
    name: "aimed",
    isAimed: true,
    category: "attack",
    damageType: "charged",
    damageBonuses: ["dmg_charged_tighnari"],
    // C1 "Beginnings Determined at the Roots": +15% Charged crit rate (ConditionStatic,
    // auto-active, NOT display-only). The engine folds crit_rate_<type> generically now,
    // so every charged hit picks up crit_rate_charged from the bag — no declaration needed.
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.aimed") }],
  },
  // raw: FeatureDamageChargedAimed tighnari_charged_dmg — dendro charged (Tighnari.js:198-207)
  {
    name: "tighnari_charged_dmg",
    isAimed: true,
    category: "attack",
    damageType: "charged",
    element: "dendro",
    damageBonuses: ["dmg_charged_tighnari"],
    // C1 "Beginnings Determined at the Roots": +15% Charged crit rate (ConditionStatic,
    // auto-active, NOT display-only). The engine folds crit_rate_<type> generically now,
    // so every charged hit picks up crit_rate_charged from the bag — no declaration needed.
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.tighnari_charged_dmg") }],
  },
  // raw: FeatureDamageChargedAimed tighnari_wreath_arrow_dmg — dendro wreath arrow (Tighnari.js:208-217)
  {
    name: "tighnari_wreath_arrow_dmg",
    isAimed: true,
    category: "attack",
    damageType: "charged",
    element: "dendro",
    damageBonuses: ["dmg_charged_tighnari"],
    // C1 "Beginnings Determined at the Roots": +15% Charged crit rate (ConditionStatic,
    // auto-active, NOT display-only). The engine folds crit_rate_<type> generically now,
    // so every charged hit picks up crit_rate_charged from the bag — no declaration needed.
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.tighnari_wreath_arrow_dmg") }],
  },
  // raw: FeatureDamageCharged tighnari_clusterbloom_arrow_dmg — dendro charged (Tighnari.js:218-227)
  {
    name: "tighnari_clusterbloom_arrow_dmg",
    category: "attack",
    damageType: "charged",
    element: "dendro",
    damageBonuses: ["dmg_charged_tighnari"],
    // C1 "Beginnings Determined at the Roots": +15% Charged crit rate (ConditionStatic,
    // auto-active, NOT display-only). The engine folds crit_rate_<type> generically now,
    // so every charged hit picks up crit_rate_charged from the bag — no declaration needed.
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.tighnari_clusterbloom_arrow_dmg") }],
  },
  // --- C6 "Karma Adjudged from the Leaden Fruit": extra clusterbloom arrow, fixed 150% ATK.
  // Raw FeatureDamageCharged tighnari_clusterbloom_arrow_c6_dmg with ValueTable([150])
  // and ConditionConstellation({constellation:6}). Tighnari.js:228-239.
  {
    name: "tighnari_clusterbloom_arrow_c6_dmg",
    category: "attack",
    damageType: "charged",
    element: "dendro",
    damageBonuses: ["dmg_charged_tighnari"],
    // crit_rate_charged (C1) is folded generically by the engine — no declaration needed.
    condition: { type: "constellation", constellation: 6 },
    multipliers: [
      {
        leveling: "char_skill_attack",
        values: { getValue: (_level: number) => 150 },
      },
    ],
  },
  // --- Plunge attacks ---
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
  // --- Skill: Vijnana-Phala Mine (dendro) ---
  // raw: FeatureDamageSkill skill_dmg (Tighnari.js:264-271)
  {
    name: "skill_dmg",
    category: "skill",
    element: "dendro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.skill_dmg") }],
  },
  // --- Burst: Fashioner's Tanglevine Shaft (dendro) ---
  // raw: FeatureDamageBurst tighnari_primary_dmg (Tighnari.js:273-281)
  {
    name: "tighnari_primary_dmg",
    category: "burst",
    element: "dendro",
    damageBonuses: ["dmg_burst_tighnari"],
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.tighnari_primary_dmg") }],
  },
  // raw: FeatureDamageBurst tighnari_secondary_dmg (Tighnari.js:282-290)
  {
    name: "tighnari_secondary_dmg",
    category: "burst",
    element: "dendro",
    damageBonuses: ["dmg_burst_tighnari"],
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.tighnari_secondary_dmg") }],
  },
  // --- A4 "Scholarly Blade" static readout: other.tighnari_charged_bonus (EM → charged/burst DMG%) ---
  // FeaturePostEffectValue(chargedBuffPost = PostEffectStatsMastery, percent=StatTable('dmg_charged_tighnari',[0.06]),
  // statCap=StatTable('',[60])), format:'percent'. Pattern 3: the readout = 0.06 × mastery_total, displayed as a
  // percent; (values/100)×mastery = 0.06×EM matches the displayed % directly. values = 0.06×100 = 6.
  // Cap: her statCap[60] → isPercent('dmg_charged_tighnari')→/100 internally → 0.6 = displayed +60% (binds only at
  // EM≈1000); inert at the canonical EM=55 (0.06×55=3.3 ≪ 60). Same A4 the a4PostEffects block adds to the bag.
  // raw/genshin_calc_pub/src/js/db/Char/Tighnari.js:113-123,293-300; PostEffect/Stats.js:58-107 (statCap path).
  {
    name: "tighnari_charged_bonus",
    category: "other",
    output: { kind: "static" },
    multipliers: [
      { scaling: "mastery", leveling: "", values: { getValue: () => 6 }, capValue: 60 },
    ],
  },
];

// ---------------------------------------------------------------------------
// Constellation conditions (P2.C)
// ---------------------------------------------------------------------------
// SELF buffs (were golden-blind SKIPPED — the port modelled only the party.* mirrors of withering_
// glimpsed and omitted A1 keen_sight, C2 origins_known + the SELF withering versions; a diff-parity
// sweep surfaced them):
//   A1 "Keen Sight" (mastery:50, ungated → lifts every EM consumer: the A4 dmg_charged/burst_tighnari
//     postEffect AND every dendro reaction), C2 "Origins Known from the Stem" (dmg_dendro:20, gated C2),
//     C4 "Withering Glimpsed in the Leaves" (mastery:60 + a second mastery:60 needing the first toggle,
//     gated C4). Modelled below.
// C1: ConditionStatic stats:{crit_rate_charged:15} — auto-active; folded generically via the engine's crit_rate_<type> fold (see condition below).
// C3: +3 levels to Fashioner's Tanglevine Shaft (burst). Raw cons[2] settings char_skill_burst_bonus:3.
// C5: +3 levels to Vijnana-Phala Mine (skill). Raw cons[4] settings char_skill_elemental_bonus:3.
// C6: cons-ADDED feature tighnari_clusterbloom_arrow_c6_dmg handled above in features array.
//     Raw cons[5] has ConditionStatic({stats:{text_percent_dmg:150}}) — display only, SKIP.
// Raw: db/Char/Tighnari.js conditions[] + constellation array (Tighnari.js:301-408).
const constellationConditions: readonly Condition[] = [
  // C1 "Beginnings Determined at the Roots": +15% Charged Attack crit rate.
  // ConditionStatic (auto-active, NOT display-only). Consumed by every charged hit via
  // the engine's generic crit_rate_<type> fold. Raw Tighnari.js C1 crit_rate_charged:15.
  { type: "constellation", constellation: 1, stats: { crit_rate_charged: 15 } },
  // C3: +3 levels to burst talent.
  { type: "constellation", constellation: 3, settings: { char_skill_burst_bonus: 3 } },
  // C5: +3 levels to elemental skill talent.
  { type: "constellation", constellation: 5, settings: { char_skill_elemental_bonus: 3 } },
  // SELF "Keen Sight" (A1) — +50 Elemental Mastery (raw mastery:50), lifting every EM consumer: the
  // A4 dmg_charged_tighnari/dmg_burst_tighnari postEffect (0.06×EM → charged + burst hits) and every
  // dendro transformative reaction (burning/electrocharged/rupture/shatter). ConditionBoolean ascension
  // passive (rep at A6 → modelled ungated, the toggle is the gate). Self-only → golden-blind SKIP.
  // Source: raw/genshin_calc_pub/src/js/db/Char/Tighnari.js:302-313 (conditions[0]).
  { type: "boolean", name: "tighnari_keen_sight", stats: { mastery: 50 } },
  // SELF "Origins Known from the Stem" (C2) — +20% Dendro DMG (raw dmg_dendro:20), lifting every dendro
  // hit (e.g. skill_dmg). ConditionBoolean gated at C2 (constellation[1] → THE CONSTELLATION IS A GATE).
  // Self-only → golden-blind SKIP. Source: raw/genshin_calc_pub/src/js/db/Char/Tighnari.js:341-348 (constellation[1]).
  {
    type: "boolean",
    name: "tighnari_origins_known_from_the_stem",
    stats: { dmg_dendro: 20 },
    condition: { type: "constellation", constellation: 2 },
  },
  // SELF "Withering Glimpsed in the Leaves" (C4) — +60 EM (raw mastery:60). ConditionBoolean gated at C4
  // (constellation[3] → THE CONSTELLATION IS A GATE). SELF mirror of party.tighnari_withering_glimpsed_
  // in_the_leaves_1. Source: raw/genshin_calc_pub/src/js/db/Char/Tighnari.js:363-370 (constellation[3]).
  {
    type: "boolean",
    name: "tighnari_withering_glimpsed_in_the_leaves_1",
    stats: { mastery: 60 },
    condition: { type: "constellation", constellation: 4 },
  },
  // SELF "Withering Glimpsed in the Leaves" (C4, second stack) — another +60 EM, requiring the FIRST
  // toggle also ON (her _2 carries subConditions:[ConditionBoolean(..._1)], raw Tighnari.js:380-383).
  // Gated C4 AND withering_1. SELF mirror of party.tighnari_withering_glimpsed_in_the_leaves_2.
  // Source: raw/genshin_calc_pub/src/js/db/Char/Tighnari.js:372-385 (constellation[3]).
  {
    type: "boolean",
    name: "tighnari_withering_glimpsed_in_the_leaves_2",
    stats: { mastery: 60 },
    condition: {
      type: "and",
      items: [
        { type: "constellation", constellation: 4 },
        { type: "boolean", name: "tighnari_withering_glimpsed_in_the_leaves_1" },
      ],
    },
  },
];

// ---------------------------------------------------------------------------
// Post-effects
// ---------------------------------------------------------------------------

// A4 "Scholarly Blade" (Tighnari.js:113-123): PostEffectStatsMastery
// dmg_charged_tighnari = dmg_burst_tighnari = min(0.06 × mastery, 60).
// Auto-active at ascension 4+; no toggle needed at A6 canonical build.
// The OUTPUT (not mastery) is capped at 60% — raw statCap StatTable('', [60]) compared against
// the 0.0006×mastery FRACTION as CValueCap(items, 0.6) (Stats.js:103-104 / :63-66, isPercent→/100).
// capValue = 60 (the output cap, in the same displayed-percent units as `bonus = mastery × 0.06`);
// binds only at EM≈1000. (Was 3.6 — a mastery-cap misread; base-inert vs the goldens since the cap
// never binds at the canonical EM≈55 where 0.06×55=3.3 < 3.6 < 60, but 3.6 wrongly clamped once
// keen_sight/withering raised EM — a diff-parity sweep with those self toggles surfaced it.)
const a4PostEffects: readonly CharPostEffect[] = [
  {
    fromStat: "mastery",
    toStat: "dmg_charged_tighnari",
    ratio: 0.06,
    capValue: 60,
  },
  {
    fromStat: "mastery",
    toStat: "dmg_burst_tighnari",
    ratio: 0.06,
    capValue: 60,
  },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const tighnari: DbObjectChar = {
  name: "tighnari",
  gameId: 10000069,
  rarity: 5,
  element: "dendro",
  weapon: "bow",
  origin: "sumeru",
  statTable: TighnariStatTable,
  talents,
  features,
  multipliers: [],
  conditions: constellationConditions,
  postEffects: a4PostEffects,
  // C4 "Withering Glimpsed in the Leaves" — +60 EM on trigger; second stack (subCondition
  // requires first toggle active) adds another +60 EM.
  // Source: raw/genshin_calc_pub/src/js/db/Char/Tighnari.js (partyData conditions)
  partyData: {
    conditions: [
      {
        type: "static",
        stats: { mastery: 60 },
        condition: { type: "boolean", name: "party.tighnari_withering_glimpsed_in_the_leaves_1" },
      },
      {
        type: "static",
        stats: { mastery: 60 },
        // Second stack requires the FIRST toggle also ON — her `_2` carries
        // subConditions: [ConditionBoolean(..._1)] (raw Tighnari.js:432-434).
        condition: {
          type: "and",
          items: [
            { type: "boolean", name: "party.tighnari_withering_glimpsed_in_the_leaves_2" },
            { type: "boolean", name: "party.tighnari_withering_glimpsed_in_the_leaves_1" },
          ],
        },
      },
    ],
  },
};
