/**
 * Traveler (Dendro) — dendro sword ATK scaler.
 *
 * 5-hit normal combo (physical), 2-sub-hit charged (charged_hit_total multihit
 * parent + the two sub-hits charged_hit_1/_2 emitted as standalone rows — her raw
 * marks them isChild, but the fixture asserts them independently, so they are
 * declared without isChild here), plunge/low/high (physical), dendro skill
 * "Razorgrass Blade" (skill_dmg), dendro burst "Surgent Manifestation" (the Lea
 * Lotus Lamp periodic attack + the explosion).
 *
 * EM AND THE A4 DMG BONUSES (folded via baseStats, faithful to the C0/A6 build):
 *   The dendro Traveler contributes 55.128 EM intrinsically to `mastery_base`
 *   (verified by running her engine headless on the empty bonus block). With the
 *   uniform stat block's `mastery_base: 55`, total EM = 110.128 — matching the
 *   fixture's stats.mastery and driving both the A4 passive bonuses and the
 *   EM-scaled transformative reactions below.
 *
 *   A4 "Verdant Luxury" (auto-active at ascension 6, ConditionAscensionChar(4)) is
 *   her PostEffectStatsMastery: skill DMG +15% × EM, burst DMG +10% × EM. At the
 *   fixed build these resolve to the constants
 *     dmg_skill_traveler_dendro = 0.15 × 110.128 = 16.5192   (other.…_skill_bonus)
 *     dmg_burst_traveler_dendro = 0.10 × 110.128 = 11.0128   (other.…_burst_bonus)
 *   folded into baseStats and picked up via the skill/burst features' damageBonuses
 *   (the same mechanism gaming.ts uses for its unconditional A4 dmg_skill_gaming).
 *   Her PostEffectStatsMastery never writes these into the stats bag, so the
 *   `other.*` display rows are not produced here; both carry damageType="" and are
 *   not asserted by the golden harness regardless.
 *
 * A1 "Verdant Overgrowth" (stacks) and the special-training / swordfighting
 * conditions are toggle/stack-gated → OFF at the C0 settings={} baseline.
 *
 * REACTIONS: the dendro transformative set (burning, rupture, electrocharged,
 * shatter) is appended generically by the loader and reads the same 110.128 EM —
 * matching the fixture's four reaction rows.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/TravelerDendro.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (TravelerDendro)
 *   raw/genshin_calc_pub/src/js/classes/PostEffect/Stats/Mastery.js (A4 EM→DMG%)
 */

import type { CharPostEffect, Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Traveler as TravelerStatTable } from "../generated/charTables.js";
import { TravelerDendro as TravelerDendroTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return TravelerDendroTalents.s1.p1;
      if (name === "normal_hit_2") return TravelerDendroTalents.s1.p2;
      if (name === "normal_hit_3") return TravelerDendroTalents.s1.p3;
      if (name === "normal_hit_4") return TravelerDendroTalents.s1.p4;
      if (name === "normal_hit_5") return TravelerDendroTalents.s1.p5;
      if (name === "charged_hit_1") return TravelerDendroTalents.s1.p6;
      if (name === "charged_hit_2") return TravelerDendroTalents.s1.p7;
      if (name === "plunge") return TravelerDendroTalents.s1.p9;
      if (name === "plunge_low") return TravelerDendroTalents.s1.p10;
      if (name === "plunge_high") return TravelerDendroTalents.s1.p11;
    }
    if (talent === "skill") {
      if (name === "skill_dmg") return TravelerDendroTalents.s2.p1;
    }
    if (talent === "burst") {
      if (name === "traveler_lea_lotus_lamp_attack_dmg") return TravelerDendroTalents.s3.p1;
      if (name === "traveler_explosion_dmg") return TravelerDendroTalents.s3.p2;
    }
    throw new Error(`traveler_dendro talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (physical sword) ---
  // raw: FeatureDamageNormal normal_hit_1..5 (char_skill_attack leveling)
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
  {
    name: "normal_hit_5",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_5") }],
  },
  // --- Charged attack: 2-sub-hit multihit (charged_hit_1 + charged_hit_2) ---
  // raw: FeatureDamageMultihit charged_hit_total { items: [p6, p7] } (physical).
  {
    name: "charged_hit_total",
    category: "attack",
    damageType: "charged",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit_1") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit_2") }] },
    ],
  },
  // The two sub-hits, emitted independently (raw marks these isChild; the fixture
  // asserts them as standalone rows, so isChild is dropped here).
  // raw/genshin_calc_pub/src/js/db/Char/TravelerDendro.js: FeatureDamageCharged isChild charged_hit_1/_2
  {
    name: "charged_hit_1",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit_1") }],
  },
  {
    name: "charged_hit_2",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit_2") }],
  },
  // --- Plunge attacks (physical) ---
  // raw: FeatureDamagePlungeCollision plunge; FeatureDamagePlungeShockWave plunge_low/high
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
  // --- Skill: Razorgrass Blade (dendro) ---
  // raw: FeatureDamageSkill skill_dmg, element='dendro', damageBonuses=['dmg_skill_traveler_dendro']
  {
    name: "skill_dmg",
    category: "skill",
    element: "dendro",
    damageBonuses: ["dmg_skill_traveler_dendro"],
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.skill_dmg") }],
  },
  // --- Burst: Surgent Manifestation (dendro) ---
  // raw: FeatureDamageBurst traveler_lea_lotus_lamp_attack_dmg + traveler_explosion_dmg,
  // element='dendro', damageBonuses=['dmg_burst_traveler_dendro']
  {
    name: "traveler_lea_lotus_lamp_attack_dmg",
    category: "burst",
    element: "dendro",
    damageBonuses: ["dmg_burst_traveler_dendro"],
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.traveler_lea_lotus_lamp_attack_dmg") }],
  },
  {
    name: "traveler_explosion_dmg",
    category: "burst",
    element: "dendro",
    damageBonuses: ["dmg_burst_traveler_dendro"],
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.traveler_explosion_dmg") }],
  },
  // --- A1/A4 EM static readouts (other.traveler_dendro_skill_bonus / _burst_bonus) ---
  // FeaturePostEffectValue(skillDmgPost/burstDmgPost = PostEffectStatsMastery,
  // percent=StatTable('dmg_skill_traveler_dendro',[0.15]) / ('dmg_burst_traveler_dendro',[0.1])), format:'percent'.
  // Pattern 3 (dynamic, faithful to her PostEffectStatsMastery): (values/100)×mastery_total = the displayed %.
  // values = coeff×100 = 15 / 10 → 0.15×110.128 = 16.5192, 0.10×110.128 = 11.0128 at the canonical EM. (The
  // damage HITS read the same A4 via the baked BASE_STATS constants below; these readouts re-derive it from EM.)
  // raw/genshin_calc_pub/src/js/db/Char/TravelerDendro.js:110-127,285-296.
  {
    name: "traveler_dendro_skill_bonus",
    category: "other",
    output: { kind: "static" },
    multipliers: [
      { scaling: "mastery", leveling: "", values: { getValue: () => 15 } },
    ],
  },
  {
    name: "traveler_dendro_burst_bonus",
    category: "other",
    output: { kind: "static" },
    multipliers: [
      { scaling: "mastery", leveling: "", values: { getValue: () => 10 } },
    ],
  },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

// A4 "Verdant Luxury" — DYNAMIC EM→DMG% (her PostEffectStatsMastery, raw TravelerDendro.js:110-124):
//   dmg_skill_traveler_dendro = 0.15 × EM_total ; dmg_burst_traveler_dendro = 0.10 × EM_total.
// Modelled as postEffects (the proven alhaitham mirror: fromStat "mastery" → named dmg key read by
// each skill/burst feature's damageBonuses), NOT a baked baseStats constant. The previous baked
// 16.5192/11.0128 (= 0.15/0.10 × the canonical 110.128 EM) only held while EM was fixed; the SELF
// A1 "Verdant Overgrowth" + "Special Training" EM buffs (+75 EM) made it diverge — a diff-parity
// sweep surfaced it. The postEffect re-derives the bonus from live EM, matching her engine at the
// base build (0.15 × 110.128 = 16.5192, unchanged golden output) AND at any buffed EM. Auto-active
// at A6 (her ConditionAscensionChar(4)), so ungated (like alhaitham). global:true → applies to her
// own features. The output:{kind:"static"} readouts below (scaling:"mastery", 15/10) already derive
// the same value dynamically; this aligns the DAMAGE hits with them.
const a4PostEffects: readonly CharPostEffect[] = [
  { fromStat: "mastery", toStat: "dmg_skill_traveler_dendro", ratio: 0.15 },
  { fromStat: "mastery", toStat: "dmg_burst_traveler_dendro", ratio: 0.1 },
];

// ---------------------------------------------------------------------------
// Constellations (P2.C Wave-1)
// ---------------------------------------------------------------------------
// C1 "Symbiotic Creeper": ConditionStatic no real stats → SKIP.
// C2 "Green Resilience": ConditionStatic no real stats → SKIP.
// C3 "Whirling Weeds": +3 Elemental Skill talent levels.
//   Raw cons[2]: Condition{ settings:{ char_skill_elemental_bonus:3 } }
// C4 "Treacle Grass": ConditionStatic no real stats → SKIP.
// C5 "Quad Beasts Unleashed": +3 Elemental Burst talent levels.
//   Raw cons[4]: Condition{ settings:{ char_skill_burst_bonus:3 } }
// C6 "Withering Aggregation": ConditionBoolean (dmg_dendro toggle) +
//   ConditionDropdownElement (party element-specific DMG%) → SKIP (toggles).
// Sources: raw/genshin_calc_pub/src/js/db/Char/TravelerDendro.js:346-440

const constellationConditions: readonly Condition[] = [
  // C3 "Whirling Weeds" — +3 Elemental Skill talent levels (Razorgrass Blade).
  // Raw cons[2]: Condition{ settings:{ char_skill_elemental_bonus:3 } }
  { type: "constellation", constellation: 3, settings: { char_skill_elemental_bonus: 3 } },
  // C5 "Quad Beasts Unleashed" — +3 Elemental Burst talent levels.
  // Raw cons[4]: Condition{ settings:{ char_skill_burst_bonus:3 } }
  { type: "constellation", constellation: 5, settings: { char_skill_burst_bonus: 3 } },
  // SELF buffs (golden-blind SKIPPED — the port modelled only the party.* mirrors + skipped the two
  // shared passive toggles; all OFF in the fixed solo build, so the 58k DAMAGE goldens never
  // exercised them — a diff-parity sweep surfaced every Dendro hit + reaction diverging):
  //   A1 "Verdant Overgrowth" (traveler_verdant_overgrowth): +6 EM per stack, max 10 (= +60 EM →
  //     lifts EM-scaled reactions + the A4 dynamic EM→DMG below). The raw ConditionStacks carries a
  //     vacuous ascension-1 subcondition (auto-true at A6) → dropped, like the party mirror. raw
  //     TravelerDendro.js:298-312.
  //   "Swordfighting Techniques" (+3 base ATK) + "Special Training" (+7 base ATK / +15 EM / +50 base
  //     HP). Ungated ConditionBooleans. raw TravelerDendro.js:321-340.
  //   C6 "Withering Aggregation" (traveler_withering_aggregation_1): +12% Dendro DMG, gated C6 (THE
  //     CONSTELLATION IS A GATE). The SELF mirror of party.traveler_withering_aggregation_1. (The
  //     paired party.traveler_withering_aggregation_2 element-shred dropdown stays party-prefixed in
  //     raw and is unset in the sweep → inert → omitted.) raw TravelerDendro.js:391-399.
  { type: "stacks", name: "traveler_verdant_overgrowth", maxStacks: 10, stats: { mastery: 6 } },
  { type: "boolean", name: "traveler_swordfighting_techniques", stats: { atk_base: 3 } },
  { type: "boolean", name: "traveler_special_training", stats: { atk_base: 7, mastery: 15, hp_base: 50 } },
  {
    type: "boolean",
    name: "traveler_withering_aggregation_1",
    stats: { dmg_dendro: 12 },
    condition: { type: "constellation", constellation: 6 },
  },
];

export const travelerDendro: DbObjectChar = {
  name: "traveler_dendro",
  gameId: 10000005,
  rarity: 5,
  element: "dendro",
  weapon: "sword",
  origin: "foreign",
  statTable: TravelerStatTable,
  talents,
  features,
  multipliers: [],
  postEffects: a4PostEffects,
  conditions: constellationConditions,
  // partyData — teammate kit buffs (P3.5.2 Bucket A, A-straggler)
  // A1 "Verdant Overgrowth": +6 EM per stack (max 10 → +60). Her ConditionStacks carries
  //   subConditions:[ConditionAscensionChar(1)] — auto-true at A6, so the gate is DROPPED
  //   (modeled always-on, like the other A6-fixed passives).
  // C6 "Withering Aggregation" part 1: party.traveler_withering_aggregation_1 (boolean) →
  //   dmg_dendro:+12.
  //   part 2: a dropdown-element adding dmg_<el>:+12 for the chosen pyro/electro/hydro, gated
  //   on part 1. NOTE: the raw setting name is literally the double-prefixed
  //   "party.party.traveler_withering_aggregation_2" (a typo in her source) — ported VERBATIM.
  //   Source: raw/genshin_calc_pub/src/js/db/Char/TravelerDendro.js:449-532
  partyData: {
    conditions: [
      // A1 "Verdant Overgrowth": +6 EM per stack (max 10).
      // raw stats: new StatTable('mastery', [6]); subConditions ConditionAscensionChar(1) dropped.
      {
        type: "stacks",
        name: "party.traveler_verdant_overgrowth",
        maxStacks: 10,
        stats: { mastery: 6 },
      },
      // C6 part 1: +12% dendro DMG.
      {
        type: "boolean",
        name: "party.traveler_withering_aggregation_1",
        stats: { dmg_dendro: 12 },
      },
      // C6 part 2: per-element +12% DMG — the (double-prefixed, verbatim) dropdown selection,
      // gated on part 1. Modeled with the dropdown-element consumer pattern.
      {
        type: "static",
        stats: { dmg_pyro: 12 },
        condition: { type: "and", items: [
          { type: "dropdown-element", name: "party.party.traveler_withering_aggregation_2", element: "pyro" },
          { type: "boolean", name: "party.traveler_withering_aggregation_1" },
        ] },
      },
      {
        type: "static",
        stats: { dmg_electro: 12 },
        condition: { type: "and", items: [
          { type: "dropdown-element", name: "party.party.traveler_withering_aggregation_2", element: "electro" },
          { type: "boolean", name: "party.traveler_withering_aggregation_1" },
        ] },
      },
      {
        type: "static",
        stats: { dmg_hydro: 12 },
        condition: { type: "and", items: [
          { type: "dropdown-element", name: "party.party.traveler_withering_aggregation_2", element: "hydro" },
          { type: "boolean", name: "party.traveler_withering_aggregation_1" },
        ] },
      },
    ],
  },
};
