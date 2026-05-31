/**
 * Furina — hydro sword, HP scaler.
 *
 * 4-hit normal combo (physical sword), charged hit, plunge/low/high (physical).
 * Two extra hydro normal-attack pings — spiritbreath_thorn / surging_blade —
 * with explicit element 'hydro' and damageType 'normal' (so they pick up
 * dmg_normal, not dmg_phys; no dmg_hydro in the fixed block).
 *
 * Skill — Salon Solitaire: four hydro HP-scaling hits.
 *   furina_ousia_bubble_dmg            — plain HP-scaling (no extra dmg bonus).
 *   furina_gentilhomme_usher_dmg       \
 *   furina_surintendante_chevalmarin_dmg } HP-scaling + dmg_skill_furina (A4).
 *   furina_mademoiselle_crabaletta_dmg /
 * Raw uses FeatureMultiplierFurinaSkill (adds 0.1·min(4, furina_hp_offers) to the
 * scaling); furina_hp_offers is 0 in the fixed solo-C0 build → ×1, so it is a
 * plain HP multiplier here.
 *
 * Burst — Let the People Rejoice: furina_burst_dmg, hydro HP-scaling.
 *
 * A4 "Unheard Confession" (auto-active at A6) grants dmg_skill_furina =
 * min(0.0007 · hp_total, 28%). Her engine models this as PostEffectStatsHP
 * writing the percent stat `dmg_skill_furina` (Furina.js:503-509). We port it as
 * a plain HP→% post-effect: the adapter derives min(0.0007 · getTotal('hp'), 28),
 * landing dmg_skill_furina in the bag as a RAW PERCENT; buildStats'
 * `collectFeatureBonusKeys` emit loop then divides it by 100 to produce the
 * FRACTION the engine reads. This is numerically identical to the
 * `toStatIsDamageBonus` channel (the absolute 28% cap commutes through /100), and
 * matches the plain pattern that every other dmg_* post-effect uses (e.g. kirara).
 * Recomputes per build — the previous code hardcoded the fixed build's
 * min(0.0007·28533.38835, 28) = 19.973371845, correct ONLY at that build.
 *
 * Display-only fixture rows skipped by the harness (empty damageType):
 *   furina_fanfare_dmg_bonus / heal_bonus (0 at 0 fanfare stacks in solo C0),
 *   furina_singers_of_the_streams_healing (skill heal), furina_heal_dot (A1 heal).
 * Reactions (rupture / electrocharged / shatter) are auto-injected by the loader
 * from the hydro element.
 *
 * SKIP constellations (C0 build): C2 max-HP bonus, C6 chalice/pneuma attack
 * multipliers + infusion, fanfare-stack scaling — all OFF at baseline.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Furina.js
 *   raw/genshin_calc_pub/src/js/classes/Feature2/Multiplier/FurinaSkill.js
 *   raw/genshin_calc_pub/src/js/classes/PostEffect/Stats/HP.js (A4 dmg_skill_furina)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Furina)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Furina)
 */

import type { CharPostEffect, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Furina as FurinaStatTable } from "../generated/charTables.js";
import { Furina as FurinaTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return FurinaTalents.s1.p1;
      if (name === "normal_hit_2") return FurinaTalents.s1.p2;
      if (name === "normal_hit_3") return FurinaTalents.s1.p3;
      if (name === "normal_hit_4") return FurinaTalents.s1.p4;
      if (name === "charged_hit") return FurinaTalents.s1.p5;
      if (name === "plunge") return FurinaTalents.s1.p7;
      if (name === "plunge_low") return FurinaTalents.s1.p8;
      if (name === "plunge_high") return FurinaTalents.s1.p9;
      // spiritbreath_thorn + surging_blade share s1.p10 (hydro ping DMG).
      if (name === "spiritbreath_thorn_dmg") return FurinaTalents.s1.p10;
      if (name === "surging_blade_dmg") return FurinaTalents.s1.p10;
    }
    if (talent === "skill") {
      if (name === "furina_ousia_bubble_dmg") return FurinaTalents.s2.p1;
      if (name === "furina_gentilhomme_usher_dmg") return FurinaTalents.s2.p3;
      if (name === "furina_surintendante_chevalmarin_dmg") return FurinaTalents.s2.p4;
      if (name === "furina_mademoiselle_crabaletta_dmg") return FurinaTalents.s2.p5;
    }
    if (talent === "burst") {
      if (name === "burst_dmg") return FurinaTalents.s3.p1;
    }
    throw new Error(`furina talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (sword — physical) ---
  // raw: FeatureDamageNormal normal_hit_1..4
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
  // --- Charged attack (sword — physical) ---
  {
    name: "charged_hit",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }],
  },
  // --- Plunge attacks (sword — physical) ---
  {
    name: "plunge",
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge") }],
  },
  {
    name: "plunge_low",
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_low") }],
  },
  {
    name: "plunge_high",
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_high") }],
  },
  // --- Hydro normal-attack pings (A1-gated thorns; element hydro, damageType normal) ---
  // raw: FeatureDamageNormal spiritbreath_thorn_dmg / surging_blade_dmg
  // element 'hydro' → no dmg_phys; damageType 'normal' → picks up dmg_normal.
  {
    name: "spiritbreath_thorn_dmg",
    category: "attack",
    element: "hydro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.spiritbreath_thorn_dmg") }],
  },
  {
    name: "surging_blade_dmg",
    category: "attack",
    element: "hydro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.surging_blade_dmg") }],
  },
  // --- Skill: Salon Solitaire (hydro, HP-scaling) ---
  // raw: FeatureDamageSkill furina_ousia_bubble_dmg (plain HP-scaling, no dmg bonus)
  {
    name: "furina_ousia_bubble_dmg",
    category: "skill",
    element: "hydro",
    multipliers: [
      { scaling: "hp", leveling: "char_skill_elemental", values: talents.get("skill.furina_ousia_bubble_dmg") },
    ],
  },
  // The three salon-member hits carry damageBonuses: ['dmg_skill_furina'] (A4).
  // raw: FeatureDamageSkill furina_gentilhomme_usher_dmg / _surintendante_chevalmarin_dmg / _mademoiselle_crabaletta_dmg
  {
    name: "furina_gentilhomme_usher_dmg",
    category: "skill",
    element: "hydro",
    damageBonuses: ["dmg_skill_furina"],
    multipliers: [
      { scaling: "hp", leveling: "char_skill_elemental", values: talents.get("skill.furina_gentilhomme_usher_dmg") },
    ],
  },
  {
    name: "furina_surintendante_chevalmarin_dmg",
    category: "skill",
    element: "hydro",
    damageBonuses: ["dmg_skill_furina"],
    multipliers: [
      { scaling: "hp", leveling: "char_skill_elemental", values: talents.get("skill.furina_surintendante_chevalmarin_dmg") },
    ],
  },
  {
    name: "furina_mademoiselle_crabaletta_dmg",
    category: "skill",
    element: "hydro",
    damageBonuses: ["dmg_skill_furina"],
    multipliers: [
      { scaling: "hp", leveling: "char_skill_elemental", values: talents.get("skill.furina_mademoiselle_crabaletta_dmg") },
    ],
  },
  // --- Burst: Let the People Rejoice (hydro, HP-scaling) ---
  // raw: FeatureDamageBurst burst_dmg
  {
    name: "burst_dmg",
    category: "burst",
    element: "hydro",
    multipliers: [
      { scaling: "hp", leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") },
    ],
  },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

// A4 "Unheard Confession": dmg_skill_furina = min(0.0007 · hp_total, 28%) (her
// raw percent + 28% statCap; Furina.js:503-509). Plain post-effect: lands in the
// bag as a RAW PERCENT; buildStats' collectFeatureBonusKeys emit /100 produces
// the FRACTION the engine reads. Auto-active at the A6 canonical build (her
// ConditionAscensionChar asc4 is satisfied; ascension gate not threaded into
// settings, matching Yae Miko / Alhaitham's A4 post-effects), so no `conditions`.
//   base hp_total 28533.38835 → min(19.973, 28) = 19.973% → /100 → 0.19973371845
//   high-HP hp_total 66420.63 → min(46.49, 28) = 28%      → /100 → 0.28 (cap)
const a4PostEffects: readonly CharPostEffect[] = [
  {
    fromStat: "hp",
    toStat: "dmg_skill_furina",
    ratio: 0.0007,
    capValue: 28,
  },
];

export const furina: DbObjectChar = {
  name: "furina",
  gameId: 10000089,
  rarity: 5,
  element: "hydro",
  weapon: "sword",
  origin: "fontaine",
  statTable: FurinaStatTable,
  talents,
  features,
  multipliers: [],
  postEffects: a4PostEffects,
};
