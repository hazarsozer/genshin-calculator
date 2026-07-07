/**
 * Nilou — hydro sword HP scaler.
 *
 * 3-hit normal combo, charged 2-hit multihit (children _1/_2 emitted standalone
 * + parent total), plunge/low/high. All normals/charged/plunge are ATK-based
 * physical (char_skill_attack), matching her FeatureDamageNormal/Charged/Plunge.
 *
 * Skill "Dance of Haftkarsvar" (Sword Dance / Whirling Steps stances) — all HP-
 * scaling hydro (scaling:'hp*', char_skill_elemental):
 *   skill_dmg, nilou_sword_dance_1_dmg, nilou_sword_dance_2_dmg,
 *   nilou_watery_moon_dmg, nilou_whirling_steps_1_dmg, nilou_whirling_steps_2_dmg,
 *   nilou_water_wheel_dmg.
 *   nilou_watery_moon_dmg carries damageBonuses:['dmg_skill_nilou'] (C1 bonus,
 *   inactive at C0 → reads 0). Faithful to Nilou.js:nilou_watery_moon_dmg.
 *
 * Burst "Distant Dreams, Listening Spring" — HP-scaling hydro:
 *   burst_dmg, nilou_lingering_aeon (scaling:'hp*', char_skill_burst).
 *
 * A4 "Dreamy Dance of Aeons" — bloomDmgPost: HP → dmg_reaction_rupture (per-100
 *   raw percent, cap 400). Gated by party-elements(hydro+dendro) AND stance_bonus.
 *   Raw: Nilou.js:153-163 (PostEffectStatsHP: exceed=30000, percent=[0.009],
 *   statCap=[400], conditions=[AscensionChar(4), NilouParty(), Boolean(stance_bonus)]).
 *   Active only in the party fixture (hydro+dendro, stance_bonus ON); inert solo.
 *   The FeaturePostEffectValue "other.nilou_bloom_bonus" readout IS modelled as
 *   output:{kind:"static"} (P3.5.3): 0.009×max(hp_total−30000,0) capped 400. Its
 *   party/stance conditions gate APPLICATION (the real dmg_reaction_rupture add),
 *   not the readout, so the readout is computed unconditionally (nonzero even solo).
 *
 * NOT MODELLED (intentional):
 *   - reaction.rupture / electrocharged / shatter — emitted GENERICALLY by the
 *     loader from element="hydro" (transformativeReactionFeatures), not per-char.
 *
 * STATS: no Nilou-specific baseStats. Her A1 EM (+100) is a conditional toggle
 * (nilou_stance_attacked, gated by NilouParty + nilou_stance_bonus) → OFF in the
 * fixed solo C0 build. The fixture's mastery=110.128 is the weapon (Alley Flash)
 * EM, supplied by buildStats — identical to Layla/Xingqiu (same sword). Constellations
 * skipped (C0). atk/hp/def/crit/recharge all derive from statTable + weapon + STAT_BLOCK.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Nilou.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Nilou)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Nilou)
 */

import type { Condition, DbObjectChar, Feature, TalentResolver, CharPostEffect } from "@genshin/types";
import { Nilou as NilouStatTable } from "../generated/charTables.js";
import { Nilou as NilouTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return NilouTalents.s1.p1;
      if (name === "normal_hit_2") return NilouTalents.s1.p2;
      if (name === "normal_hit_3") return NilouTalents.s1.p3;
      if (name === "charged_hit_1") return NilouTalents.s1.p4;
      if (name === "charged_hit_2") return NilouTalents.s1.p5;
      if (name === "plunge") return NilouTalents.s1.p7;
      if (name === "plunge_low") return NilouTalents.s1.p8;
      if (name === "plunge_high") return NilouTalents.s1.p9;
    }
    if (talent === "skill") {
      if (name === "skill_dmg") return NilouTalents.s2.p1;
      if (name === "nilou_sword_dance_1_dmg") return NilouTalents.s2.p6;
      if (name === "nilou_sword_dance_2_dmg") return NilouTalents.s2.p7;
      if (name === "nilou_watery_moon_dmg") return NilouTalents.s2.p4;
      if (name === "nilou_whirling_steps_1_dmg") return NilouTalents.s2.p2;
      if (name === "nilou_whirling_steps_2_dmg") return NilouTalents.s2.p3;
      if (name === "nilou_water_wheel_dmg") return NilouTalents.s2.p5;
    }
    if (talent === "burst") {
      if (name === "burst_dmg") return NilouTalents.s3.p1;
      if (name === "nilou_lingering_aeon") return NilouTalents.s3.p2;
    }
    throw new Error(`nilou talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (physical sword, ATK) ---
  // raw: FeatureDamageNormal normal_hit_1/2/3
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
  // --- Charged attacks (2-hit multihit + standalone children) ---
  // raw: FeatureDamageMultihit charged_hit_total (parent = _1 + _2)
  {
    name: "charged_hit_total",
    category: "attack",
    damageType: "charged",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit_1") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit_2") }] },
    ],
  },
  // raw: FeatureDamageCharged charged_hit_1 (isChild:true → drop isChild so it emits)
  {
    name: "charged_hit_1",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit_1") }],
  },
  // raw: FeatureDamageCharged charged_hit_2 (isChild:true → drop isChild so it emits)
  {
    name: "charged_hit_2",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit_2") }],
  },
  // --- Plunge attacks (physical sword) ---
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
    tags: ["plunge_shockwave"],
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_low") }],
  },
  // raw: FeatureDamagePlungeShockWave plunge_high
  {
    name: "plunge_high",
    tags: ["plunge_shockwave"],
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_high") }],
  },
  // --- Skill: Dance of Haftkarsvar (hydro, HP-scaled) ---
  // raw: FeatureDamageSkill skill_dmg (scaling:'hp*', char_skill_elemental, s2.p1)
  {
    name: "skill_dmg",
    category: "skill",
    element: "hydro",
    multipliers: [{ scaling: "hp", leveling: "char_skill_elemental", values: talents.get("skill.skill_dmg") }],
  },
  // raw: FeatureDamageSkill nilou_sword_dance_1_dmg (s2.p6)
  {
    name: "nilou_sword_dance_1_dmg",
    category: "skill",
    element: "hydro",
    multipliers: [{ scaling: "hp", leveling: "char_skill_elemental", values: talents.get("skill.nilou_sword_dance_1_dmg") }],
  },
  // raw: FeatureDamageSkill nilou_sword_dance_2_dmg (s2.p7)
  {
    name: "nilou_sword_dance_2_dmg",
    category: "skill",
    element: "hydro",
    multipliers: [{ scaling: "hp", leveling: "char_skill_elemental", values: talents.get("skill.nilou_sword_dance_2_dmg") }],
  },
  // raw: FeatureDamageSkill nilou_watery_moon_dmg (s2.p4, damageBonuses dmg_skill_nilou — C1, reads 0 at C0)
  {
    name: "nilou_watery_moon_dmg",
    category: "skill",
    element: "hydro",
    damageBonuses: ["dmg_skill_nilou"],
    multipliers: [{ scaling: "hp", leveling: "char_skill_elemental", values: talents.get("skill.nilou_watery_moon_dmg") }],
  },
  // raw: FeatureDamageSkill nilou_whirling_steps_1_dmg (s2.p2)
  {
    name: "nilou_whirling_steps_1_dmg",
    category: "skill",
    element: "hydro",
    multipliers: [{ scaling: "hp", leveling: "char_skill_elemental", values: talents.get("skill.nilou_whirling_steps_1_dmg") }],
  },
  // raw: FeatureDamageSkill nilou_whirling_steps_2_dmg (s2.p3)
  {
    name: "nilou_whirling_steps_2_dmg",
    category: "skill",
    element: "hydro",
    multipliers: [{ scaling: "hp", leveling: "char_skill_elemental", values: talents.get("skill.nilou_whirling_steps_2_dmg") }],
  },
  // raw: FeatureDamageSkill nilou_water_wheel_dmg (s2.p5)
  {
    name: "nilou_water_wheel_dmg",
    category: "skill",
    element: "hydro",
    multipliers: [{ scaling: "hp", leveling: "char_skill_elemental", values: talents.get("skill.nilou_water_wheel_dmg") }],
  },
  // --- Burst: Distant Dreams, Listening Spring (hydro, HP-scaled) ---
  // raw: FeatureDamageBurst burst_dmg (scaling:'hp*', char_skill_burst, s3.p1)
  {
    name: "burst_dmg",
    category: "burst",
    element: "hydro",
    multipliers: [{ scaling: "hp", leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") }],
  },
  // raw: FeatureDamageBurst nilou_lingering_aeon (s3.p2)
  {
    name: "nilou_lingering_aeon",
    category: "burst",
    element: "hydro",
    multipliers: [{ scaling: "hp", leveling: "char_skill_burst", values: talents.get("burst.nilou_lingering_aeon") }],
  },
  // --- A4 "Dreamy Dance" static readout: other.nilou_bloom_bonus = HP-above-30000 → Bloom DMG% (capped) ---
  // FeaturePostEffectValue(bloomDmgPost = PostEffectStatsHP, exceed=30000,
  // percent=StatTable('dmg_reaction_rupture',[A4BloomBonus/1000=0.009]), statCap=StatTable('',[A4BloomBonusMax=400])),
  // format:'percent'. 'dmg_reaction_rupture' is isPercent → her /100 and the format ×100 CANCEL → displayed =
  // 0.009×max(hp_total−30000,0) capped at 400. values = 0.009×100 = 0.9; exceedStatValue = 30000 (her exceed →
  // max(hp−30000,0)); capValue = 400 (raw statCap, inert at the canonical HP, ≈59.34). The party(hydro+dendro)+
  // stance conditions gate APPLICATION not the readout → modelled without them (cf. itto/ineffa; nonzero even solo).
  // raw/genshin_calc_pub/src/js/db/Char/Nilou.js:142-143,153-163,440-448; PostEffect/Stats.js:58-107.
  {
    name: "nilou_bloom_bonus",
    category: "other",
    output: { kind: "static" },
    multipliers: [
      { scaling: "hp", leveling: "", values: { getValue: () => 0.9 }, exceedStatValue: 30000, capValue: 400 },
    ],
  },
];

// ---------------------------------------------------------------------------
// Constellation conditions (P2.C Wave-1)
// ---------------------------------------------------------------------------
// C1 "Dance of the Waning Moon": ConditionStatic — dmg_skill_nilou +65 (always-on).
//    Raw cons[0]: ConditionStatic{ stats:{ dmg_skill_nilou: C1SkillDmg=65 } }
//    nilou_watery_moon_dmg feature already carries damageBonuses:['dmg_skill_nilou'].
// C2 "The Starry Skies Their Flowers Rain": TWO ConditionBooleans —
//    nilou_the_starry_skies_2 (enemy_res_dendro −35, gated ONLY by ascension4 → activatable solo,
//      lifts her bloom/rupture reaction) is PORTED below.
//    nilou_the_starry_skies_1 (enemy_res_hydro −35) is gated by NilouParty (needs a Dendro
//      teammate) + stance_bonus → PORTED below via the `party-elements`{hydro,dendro} gate
//      (party-axis; locked by the `nilou-c2*` party-config reps).
// C3 "Orchestrated Pearls of Slaughter": +3 Elemental Burst talent levels.
//    Raw cons[2]: Condition{ settings:{ char_skill_burst_bonus:3 } }
// C4 "Fricative Pulse": ConditionBoolean dmg_burst +50 (no party gate) → PORTED below.
// C5 "Twirling Lotus": +3 Elemental Skill talent levels.
//    Raw cons[4]: Condition{ settings:{ char_skill_elemental_bonus:3 } }
// C6 "Frostbreaker's Melody": ConditionStatic with ONLY text_percent display keys → SKIP.
//    (text_percent_rate/max, text_percent_dmg/max are display-only, not real stat keys.)
//
// C2 nilou_the_starry_skies_1 (enemy_res_hydro −35, NilouParty + stance_bonus) is now PORTED
// (see constellationConditions). It fires only in a Hydro+Dendro party and lifts her hydro
// skill/burst hits — a compared damage output; locked by the `nilou-c2*` party-config reps.
//
// STILL OUT OF SCOPE (faithful but output-inert for this harness):
//    A1 "Court of Dancing Petals" nilou_stance_attacked mastery +100 (gated NilouParty + stance_bonus).
//    EM is damage-inert for her HP-scaling direct hits; the party-burndown harness does not compile
//    transformative reactions (reaction.* is loader-generated, not a compiled DbObjectChar feature), so
//    +100 EM changes no COMPARED output → un-lockable here (a rep would be a gamed gate). Left unported.
//    (The bloom HP→dmg_reaction_rupture postEffect is already modelled with the same party gate.)
//
// Sources: raw/genshin_calc_pub/src/js/db/Char/Nilou.js:459-546

const constellationConditions: readonly Condition[] = [
  // C1: dmg_skill_nilou +65 (always-on ConditionStatic, no subConditions).
  // nilou_watery_moon_dmg already has damageBonuses:['dmg_skill_nilou'] → picks this up.
  { type: "constellation", constellation: 1, stats: { dmg_skill_nilou: 65 } },
  // C3: +3 Elemental Burst (Distant Dreams, Listening Spring).
  // Raw cons[2]: new Condition({ settings: { char_skill_burst_bonus: 3 } }).
  { type: "constellation", constellation: 3, settings: { char_skill_burst_bonus: 3 } },
  // C5: +3 Elemental Skill (Dance of Haftkarsvar).
  // Raw cons[4]: new Condition({ settings: { char_skill_elemental_bonus: 3 } }).
  { type: "constellation", constellation: 5, settings: { char_skill_elemental_bonus: 3 } },
  // SELF C2 "The Starry Skies..." (nilou_the_starry_skies_2) — enemy_res_dendro −35, gated C2 (asc4
  // always-on, NO party gate), lifting her bloom/rupture reaction. raw constellation[1] ConditionBoolean.
  {
    type: "boolean",
    name: "nilou_the_starry_skies_2",
    stats: { enemy_res_dendro: -35 },
    condition: { type: "constellation", constellation: 2 },
  },
  // SELF C4 "Fricative Pulse" (nilou_fricative_pulse) — dmg_burst +50, gated C4, lifting her bursts
  // (burst_dmg + nilou_lingering_aeon). raw constellation[3] ConditionBoolean.
  {
    type: "boolean",
    name: "nilou_fricative_pulse",
    stats: { dmg_burst: 50 },
    condition: { type: "constellation", constellation: 4 },
  },
  // SELF C2 "The Starry Skies..." (nilou_the_starry_skies_1) — enemy_res_hydro −35, lifting her
  // hydro skill/burst hits. PARTY-COMPOSITION gated: raw constellation[1] ConditionBoolean
  // subConditions = [NilouParty(), Boolean('nilou_stance_bonus'), AscensionChar(4)] → fires only
  // in a Hydro+Dendro-EXCLUSIVE party with the stance toggle ON (asc4 is always true at L90).
  // NilouParty == the `party-elements` {hydro,dendro} exclusivity gate (same one bloomPostEffect
  // uses). Distinct from nilou_the_starry_skies_2 (enemy_res_dendro, NO party gate — ported above).
  // Inert solo (party-elements false with only char_element) → root goldens byte-identical.
  // raw Nilou.js:487-498 (ConditionBooleanNilouParty → classes/Condition/Boolean/NilouParty.js).
  {
    type: "boolean",
    name: "nilou_the_starry_skies_1",
    stats: { enemy_res_hydro: -35 },
    condition: {
      type: "and",
      items: [
        { type: "constellation", constellation: 2 },
        { type: "party-elements", elements: ["hydro", "dendro"] },
        { type: "boolean", name: "nilou_stance_bonus" },
      ],
    },
  },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

// A4 "Dreamy Dance of Aeons" — bloom HP post-effect: adds dmg_reaction_rupture
// = max(0, HP − 30000) × 0.009 (raw percent), capped at 400 raw (≙ 4 fraction
// after /100 emit). Gated by party-elements(hydro+dendro) AND stance_bonus.
// Raw Nilou.js:153-163: PostEffectStatsHP{ exceed:30000, percent:StatTable('dmg_reaction_rupture',[0.009]),
// statCap:StatTable('',[400]), conditions:[AscensionChar(4), NilouParty(), Boolean(stance_bonus)] }.
// NOTE: Our ratio=0.009 stores the raw-percent form so REACTION_BONUS_PERCENT_KEYS
// emits it /100 at build time — matching the isPercent fold PostEffectStats.getTree applies.
const bloomPostEffect: readonly CharPostEffect[] = [
  {
    fromStat: "hp",
    toStat: "dmg_reaction_rupture",
    ratio: 0.009,
    offset: 30000,
    capValue: 400,
    conditions: [
      { type: "party-elements", elements: ["hydro", "dendro"] },
      { type: "boolean", name: "nilou_stance_bonus" },
    ],
  },
];

// C6 "Frostfall Storm": HP → crit_rate (ratio 0.0006, abs cap 30) + crit_dmg
// (ratio 0.0012, abs cap 60), gated by C6. Faithful PostEffectStatsHP with a
// ConditionConstellation(6) gate + absolute cap; at the fixed build HP=36593 →
// +21.96 crit_rate / +43.91 crit_dmg (neither cap binds). Generic crit → folds
// into crit_rate/dmg_total for every feature. Raw Nilou.js:165-179.
const c6CritPostEffects: readonly CharPostEffect[] = [
  { fromStat: "hp", toStat: "crit_rate", ratio: 0.0006, capValue: 30, conditions: [{ type: "constellation", constellation: 6 }] },
  { fromStat: "hp", toStat: "crit_dmg", ratio: 0.0012, capValue: 60, conditions: [{ type: "constellation", constellation: 6 }] },
];

export const nilou: DbObjectChar = {
  name: "nilou",
  gameId: 10000070,
  rarity: 5,
  element: "hydro",
  weapon: "sword",
  origin: "sumeru",
  statTable: NilouStatTable,
  talents,
  features,
  multipliers: [],
  conditions: constellationConditions,
  postEffects: [...bloomPostEffect, ...c6CritPostEffects],
};
