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
 * Non-damage outputs modelled (P3.5.3):
 *   furina_fanfare_dmg_bonus / heal_bonus — scale on the SELF `furina_fanfare_stacks` stat
 *     (=0 in solo C0 → genuine 0; the raw s3.p5/s3.p6 ratio is inert here, never baked);
 *   furina_singers_of_the_streams_healing (skill heal, s2.p9 % + s2.p10 flat),
 *   furina_heal_dot (A1 "drain" heal = 2% Max HP, ValueTable[2], auto-active at A6). All HP-scaled.
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

import type { CharPostEffect, Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
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
      if (name === "furina_singers_healing_percent") return FurinaTalents.s2.p9;
      if (name === "furina_singers_healing_flat")    return FurinaTalents.s2.p10;
    }
    if (talent === "burst") {
      if (name === "burst_dmg") return FurinaTalents.s3.p1;
      if (name === "furina_fanfare_dmg_ratio")  return FurinaTalents.s3.p5;
      if (name === "furina_fanfare_heal_ratio")  return FurinaTalents.s3.p6;
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
  // Their HP multiplier gets an additive offset from furina_hp_offers (ConditionStacks,
  // max 4): +0.1 × min(4, stacks) — ports FeatureMultiplierFurinaSkill.getScalingMultiplier
  // (raw/genshin_calc_pub/src/js/classes/Feature2/Multiplier/FurinaSkill.js:12-13).
  // Base (offers absent / 0) → offset 0 → no change.
  // raw: FeatureDamageSkill furina_gentilhomme_usher_dmg / _surintendante_chevalmarin_dmg / _mademoiselle_crabaletta_dmg
  {
    name: "furina_gentilhomme_usher_dmg",
    category: "skill",
    element: "hydro",
    damageBonuses: ["dmg_skill_furina"],
    multipliers: [
      {
        scaling: "hp",
        leveling: "char_skill_elemental",
        values: talents.get("skill.furina_gentilhomme_usher_dmg"),
        scalingOffset: { setting: "furina_hp_offers", perStack: 0.1, maxStacks: 4 },
      },
    ],
  },
  {
    name: "furina_surintendante_chevalmarin_dmg",
    category: "skill",
    element: "hydro",
    damageBonuses: ["dmg_skill_furina"],
    multipliers: [
      {
        scaling: "hp",
        leveling: "char_skill_elemental",
        values: talents.get("skill.furina_surintendante_chevalmarin_dmg"),
        scalingOffset: { setting: "furina_hp_offers", perStack: 0.1, maxStacks: 4 },
      },
    ],
  },
  {
    name: "furina_mademoiselle_crabaletta_dmg",
    category: "skill",
    element: "hydro",
    damageBonuses: ["dmg_skill_furina"],
    multipliers: [
      {
        scaling: "hp",
        leveling: "char_skill_elemental",
        values: talents.get("skill.furina_mademoiselle_crabaletta_dmg"),
        scalingOffset: { setting: "furina_hp_offers", perStack: 0.1, maxStacks: 4 },
      },
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
  // --- Heals (FeatureHeal, HP-scaled) ---
  // skill.furina_singers_of_the_streams_healing: Salon Solitaire per-tick heal — getList = [s2.p9 (%), s2.p10 (flat)].
  // raw/genshin_calc_pub/src/js/db/Char/Furina.js:113-119,369-376. No healing-bonus passive (crit-rate ascension).
  {
    name: "furina_singers_of_the_streams_healing",
    category: "skill",
    output: { kind: "heal" },
    multipliers: [
      { scaling: "hp", leveling: "char_skill_elemental", values: talents.get("skill.furina_singers_healing_percent"), flatValues: talents.get("skill.furina_singers_healing_flat") },
    ],
  },
  // other.furina_heal_dot: A1 "Endless Waltz"-adjacent drain heal — fixed 2% Max HP (ValueTable[2]), source
  // ascension1, auto-active at A6. raw/genshin_calc_pub/src/js/db/Char/Furina.js:423-428.
  {
    name: "furina_heal_dot",
    category: "other",
    output: { kind: "heal" },
    multipliers: [
      { scaling: "hp", leveling: "ascension1", values: { getValue: () => 2 } },
    ],
  },
  // --- Fanfare static readouts (burst.furina_fanfare_dmg_bonus / heal_bonus) ---
  // fanfareDmgPost/HealingPost = PostEffectStats from:'furina_fanfare_stacks' (SELF fanfare count = 0 at solo),
  // percent=getMulti('burst.furina_fanfare_dmg_ratio'→dmg_all) / ('...heal_ratio'→healing_recv), maxBase cap.
  // Readout = ratio × furina_fanfare_stacks = 0 (the stat is 0 at C0 solo). Modelled as scaling on the 0-stat ×
  // the raw ratio table (s3.p5/s3.p6, inert here); the genuine 0 comes from the 0-stat, never baked. The teammate
  // version (party_furina_fanfare_stacks → dmg_all) is in partyData below. raw/.../Char/Furina.js:175-193,392-401.
  {
    name: "furina_fanfare_dmg_bonus",
    category: "burst",
    output: { kind: "static" },
    multipliers: [
      { scaling: "furina_fanfare_stacks", leveling: "char_skill_burst", values: talents.get("burst.furina_fanfare_dmg_ratio") },
    ],
  },
  {
    name: "furina_fanfare_heal_bonus",
    category: "burst",
    output: { kind: "static" },
    multipliers: [
      { scaling: "furina_fanfare_stacks", leveling: "char_skill_burst", values: talents.get("burst.furina_fanfare_heal_ratio") },
    ],
  },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Constellation conditions (P2.C Wave-1)
// ---------------------------------------------------------------------------
// C1 "Love Is a Rebellious Bird That None Can Tame": text-only (fanfare gain/limit)
//   → ConditionStatic, display-only → SKIP.
// C2 "A Woman Adapts Like Duckweed in Water": text-only (HP% bonus text_percent)
//   → ConditionStatic, display-only → SKIP.
// C4 "They Know Not Life, Who Dwelt in the Netherworld Not": display-only
//   → ConditionStatic, no real stats → SKIP.
// C6 "Hear Me, Let Us Raise the Chalice of Love": ConditionBoolean toggles
//   (furina_pneuma, furina_chalice_of_love) → OFF at baseline → SKIP.
//
// Always-on: C3 (+3 burst talent), C5 (+3 skill talent).
// Sources: raw/genshin_calc_pub/src/js/db/Char/Furina.js:514-577

const constellationConditions: readonly Condition[] = [
  // C3 "Rejoice, O Youth! Neath Flourishing Heavens" — +3 Elemental Burst.
  // Raw cons[2]: new Condition({ settings: { char_skill_burst_bonus: 3 } }).
  { type: "constellation", constellation: 3, settings: { char_skill_burst_bonus: 3 } },
  // C5 "The Water That Suits Me Best" — +3 Elemental Skill.
  // Raw cons[4]: new Condition({ settings: { char_skill_elemental_bonus: 3 } }).
  { type: "constellation", constellation: 5, settings: { char_skill_elemental_bonus: 3 } },
];

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
  conditions: constellationConditions,
  // partyData — teammate kit buffs (P3.5.2 Bucket B).
  // Source: raw/genshin_calc_pub/src/js/db/Char/Furina.js:589-632
  // Scope: dmg_all output only from "Let the People Rejoice" fanfare stacks.
  // Furina's partyData postEffect has:
  //   from:'party_furina_fanfare_stacks', maxBase:400, levelSetting:'furina_char_skill_burst',
  //   maxLevelSetting:10, percent:[getAlias('burst.furina_fanfare_dmg_ratio','dmg_all'), ...].
  // maxLevelSetting:10 means the ratio is PINNED at talent level 10 (same pattern as
  //   Bennett). Table s3.p5 at level 10 (index 9) = 0.25; isPercent('dmg_all')=true, so
  //   raw divides by 100 → 0.0025 per stack in the raw fraction bag. In our engine dmg_all
  //   is stored as raw percent (further /100 by buildStats emit), so ratio = 0.25 per stack.
  //   400 stacks × 0.25 = 100 raw percent → /100 = 1.0 = 100% dmg_all. ✓
  // Stacks gate: raw `condition: new ConditionBoolean({name:'party_furina_fanfare_stacks'})`
  //   → truthy when stacks > 0.
  // Defer: healing_recv output (heal-scope, damage-inert in P3.5.2 scope) and
  //   C3 +3 burst talent levels (moot: the ratio is already clamped at L10 by
  //   the baked maxLevelSetting, so +3 would still resolve to L10).
  partyData: {
    loadStats: {
      settings: ["char_skill_burst"],
    },
    conditions: [
      // ConditionNumberTalent: lifts the teammate's burst talent level into the bag.
      // (partySetting: 'char_skill_burst', raw Furina.js:594-599)
      { type: "number", name: "furina_char_skill_burst", max: 15 },
      // ConditionNumber: the fanfare stack count (0–400, countable), gating the postEffect.
      { type: "number", name: "party_furina_fanfare_stacks", max: 400 },
      // C3 "Rejoice…" +3 burst levels — deferred (moot under L10 cap; variant-rep pass).
    ],
    postEffects: [
      // "Let the People Rejoice" fanfare → dmg_all% per stack, pinned at burst L10.
      // Raw: from:'party_furina_fanfare_stacks', maxBase:400, levelSetting:'furina_char_skill_burst',
      //      maxLevelSetting:10, percent:getAlias('burst.furina_fanfare_dmg_ratio','dmg_all').
      // ratio = FurinaTalents.s3.p5.getValue(10) × 0.01 as raw percent = 0.25 × 0.01 = 0.0025?
      //   No: our engine stores dmg_all as raw percent (not fraction) in the bag, and buildStats
      //   emits /100 at output. The raw table value 0.25 IS the per-stack percent (already small);
      //   isPercent divides by 100 in the raw bag → 0.0025/stack fraction. Our bag is percent
      //   (not fraction), so ratio = 0.25 → bonus = stacks × 0.25 (percent units) → /100 = fraction.
      // Fanfare stacks gate: ConditionBoolean on name 'party_furina_fanfare_stacks' — truthy
      //   (Boolean(400)=true) when stacks are set.
      // healing_recv output DEFERRED (damage-inert, P3.5.2 scope).
      {
        fromStat: "party_furina_fanfare_stacks",
        toStat: "dmg_all",
        ratio: FurinaTalents.s3.p5.getValue(10),  // 0.25 at L10
        conditions: [{ type: "boolean", name: "party_furina_fanfare_stacks" }],
      },
    ],
  },
};
