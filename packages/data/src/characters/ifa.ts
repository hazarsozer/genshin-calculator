/**
 * Ifa — anemo catalyst (Natlan, 4★, Nightsoul).
 *
 * 3-hit normal combo (anemo), charged hit (anemo), plunge/low/high (anemo).
 * Anemo skill Tonic Shot: ifa_tonicshot_dmg. In raw this is a FeatureDamageNormal
 * with category:'skill' — so category="skill" (leveling char_skill_elemental) BUT
 * damageType="normal" (constructor forces it). The fixture confirms
 * skill.ifa_tonicshot_dmg has damageType="normal": it picks up dmg_normal (8%), not
 * dmg_skill (32%). Hand-check: 2.40048 × 1839.6429 × 1.08 × 0.9 × 0.5 = 2146.1887 =
 * fixture.normal. (Using dmg_skill would give 2623 → wrong.)
 *
 * Anemo burst Compound Sedation Field: burst_dmg (anemo). The Sedation Mark detonates
 * per absorbed element — fixture asserts 4 variants ifa_sedation_mark_{pyro,hydro,
 * cryo,electro}_dmg, each sharing the same burst talent table (s3.p2), differing only
 * in element (Venti burst-absorb pattern). Pyro/Hydro/Cryo share the same triple
 * (no relevant dmg_<elem> bonus); Electro differs (STAT_BLOCK dmg_electro=2).
 *
 * NON-DAMAGE OUTPUTS modelled (P3.5.3):
 *   - skill.ifa_tonicshot_heal (FeatureHeal mastery*, getList s2.p2 % + s2.p3 flat) — EM-scaled.
 *   - other.ifa_reaction_bonus / _2 (FeaturePostEffectValue) — A1 "Field Medic's Vision"
 *     swirl/EC/lunar-charged reaction-DMG% from the `ifa_field_medics_vision` stat (a Nightsoul
 *     value, =0 at solo settings={}) → readout 0. Modelled as scaling:"ifa_field_medics_vision"
 *     (=0) × the raw A1 ratio (1.5 / 0.2, inert here); the genuine 0 comes from the 0-stat, never baked.
 *   - NOT modelled: C6 ifa_tonicshot_add_dmg (constellation 6) — C0 build, omitted.
 *   - A4 ifa_mutual_aid_agreement (+80 EM) is a ConditionBoolean toggle, OFF by
 *     default → no baseStats fold. Mastery secondary (A6 +96) is already in the
 *     stat table (fixture stats.mastery=151=96+55).
 *   - reaction.* — auto-emitted by the engine, reported as coverage gaps, not from
 *     this file.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Ifa.js
 *   raw/genshin_calc_pub/src/js/classes/Feature2/Damage/Normal.js (category/damageType)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Ifa)
 */

import type { Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Ifa as IfaStatTable } from "../generated/charTables.js";
import { Ifa as IfaTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return IfaTalents.s1.p1;
      if (name === "normal_hit_2") return IfaTalents.s1.p2;
      if (name === "normal_hit_3") return IfaTalents.s1.p3;
      if (name === "charged_hit")  return IfaTalents.s1.p4;
      if (name === "plunge")       return IfaTalents.s1.p6;
      if (name === "plunge_low")   return IfaTalents.s1.p7;
      if (name === "plunge_high")  return IfaTalents.s1.p8;
    }
    if (talent === "skill") {
      if (name === "ifa_tonicshot_dmg") return IfaTalents.s2.p1;
      if (name === "ifa_tonicshot_heal_percent") return IfaTalents.s2.p2;
      if (name === "ifa_tonicshot_heal_flat")    return IfaTalents.s2.p3;
    }
    if (talent === "burst") {
      if (name === "burst_dmg")            return IfaTalents.s3.p1;
      if (name === "ifa_sedation_mark_dmg") return IfaTalents.s3.p2;
    }
    throw new Error(`ifa talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (anemo catalyst, always anemo) ---
  {
    name: "normal_hit_1",
    category: "attack",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1") }],
  },
  {
    name: "normal_hit_2",
    category: "attack",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2") }],
  },
  {
    name: "normal_hit_3",
    category: "attack",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }],
  },
  // --- Charged attack ---
  {
    name: "charged_hit",
    category: "attack",
    damageType: "charged",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }],
  },
  // --- Plunge attacks ---
  {
    name: "plunge",
    category: "attack",
    damageType: "plunge",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge") }],
  },
  {
    name: "plunge_low",
    tags: ["plunge_shockwave"],
    category: "attack",
    damageType: "plunge",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_low") }],
  },
  {
    name: "plunge_high",
    tags: ["plunge_shockwave"],
    category: "attack",
    damageType: "plunge",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_high") }],
  },
  // --- Skill: Airborne Disease Prevention (Tonic Shot) ---
  // raw: FeatureDamageNormal({ element:'anemo', category:'skill' }) → category="skill"
  // (leveling char_skill_elemental) AND damageType="normal" (dmg_normal bonus).
  {
    name: "ifa_tonicshot_dmg",
    category: "skill",
    damageType: "normal",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.ifa_tonicshot_dmg") }],
  },
  // --- C6 "Oath on a Feathered Knot": extra Tonic Shot hit (120% ATK anemo).
  // Raw: FeatureDamageNormal with category:'skill', element:'anemo', ValueTable([120]),
  // ConditionConstellation(6). Ifa.js:229-240
  // FeatureDamageNormal → damageType:"normal".
  {
    name: "ifa_tonicshot_add_dmg",
    category: "skill",
    damageType: "normal",
    element: "anemo",
    condition: { type: "constellation", constellation: 6 },
    multipliers: [
      {
        leveling: "char_skill_elemental",
        values: { getValue: (_level: number) => 120 },
        source: "constellation6",
      },
    ],
  },
  // --- Burst: Compound Sedation Field ---
  {
    name: "burst_dmg",
    category: "burst",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") }],
  },
  // Sedation Mark absorbed-element variants: pyro/hydro/cryo/electro, each sharing s3.p2.
  // raw: ['pyro','hydro','cryo','electro'].map(elem => FeatureDamageBurst({
  //   name:'ifa_sedation_mark_'+elem+'_dmg', element:elem, values: burst.ifa_sedation_mark_dmg }))
  {
    name: "ifa_sedation_mark_pyro_dmg",
    category: "burst",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.ifa_sedation_mark_dmg") }],
  },
  {
    name: "ifa_sedation_mark_hydro_dmg",
    category: "burst",
    element: "hydro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.ifa_sedation_mark_dmg") }],
  },
  {
    name: "ifa_sedation_mark_cryo_dmg",
    category: "burst",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.ifa_sedation_mark_dmg") }],
  },
  {
    name: "ifa_sedation_mark_electro_dmg",
    category: "burst",
    element: "electro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.ifa_sedation_mark_dmg") }],
  },
  // --- Skill heal: skill.ifa_tonicshot_heal = Tonic Shot heal (FeatureHeal, EM-scaled list) ---
  // FeatureMultiplierList scaling:'mastery*', getList('skill.ifa_tonicshot_heal') = [s2.p2 (%), s2.p3 (flat)].
  // base = (s2.p2/100)×mastery_total + s2.p3. raw/genshin_calc_pub/src/js/db/Char/Ifa.js:68-74,241-248.
  {
    name: "ifa_tonicshot_heal",
    category: "skill",
    output: { kind: "heal" },
    multipliers: [
      { scaling: "mastery", leveling: "char_skill_elemental", values: talents.get("skill.ifa_tonicshot_heal_percent"), flatValues: talents.get("skill.ifa_tonicshot_heal_flat") },
    ],
  },
  // --- A1 "Field Medic's Vision" reaction-DMG% readouts (other.ifa_reaction_bonus / _2) ---
  // reactionDmgPost/Post2 = PostEffectStats from:'ifa_field_medics_vision' (a Nightsoul stat = 0 at solo),
  // percent=StatTable('dmg_reaction_swirl/_electrocharged',[A1ReactionDmg=1.5]) / ('dmg_reaction_lunarcharged',
  // [A1MoonReactionDmg=0.2]), format:'percent'. Readout = ratio × field_medics_vision = 0 (the stat is 0); modelled
  // as scaling on the 0-stat × the raw ratio×100 (1.5→150 / 0.2→20, inert here). raw/.../Char/Ifa.js:111-141,273-285.
  {
    name: "ifa_reaction_bonus",
    category: "other",
    output: { kind: "static" },
    multipliers: [
      { scaling: "ifa_field_medics_vision", leveling: "", values: { getValue: () => 150 } },
    ],
  },
  {
    name: "ifa_reaction_bonus_2",
    category: "other",
    output: { kind: "static" },
    multipliers: [
      { scaling: "ifa_field_medics_vision", leveling: "", values: { getValue: () => 20 } },
    ],
  },
];

// ---------------------------------------------------------------------------
// Constellation conditions (P2.C)
// ---------------------------------------------------------------------------
// C1 "Vitiferous Elixirs Concoction": ConditionStatic (display-only) → SKIP.
// C2 "Guiding Spirit of Ballistic Prayer": ConditionStatic (display-only) → SKIP.
// C3 "Vivification Voyage": +3 levels to Airborne Disease Prevention (skill).
//    Raw cons[2] settings char_skill_elemental_bonus:3. Ifa.js:336-342
// C4 "Decayed Vessels Permutation": ConditionBoolean toggle (mastery +100) → SKIP (toggle OFF).
// C5 "Elemental Elixirs Emporium": +3 levels to Compound Sedation Field (burst).
//    Raw cons[4] settings char_skill_burst_bonus:3. Ifa.js:357-363
// C6 "Oath on a Feathered Knot": ConditionStatic (display-only text_percent_dmg) → SKIP;
//    the actual damage comes from ifa_tonicshot_add_dmg feature above.
// Raw: db/Char/Ifa.js constellation array (Ifa.js:317-376).
const constellationConditions: readonly Condition[] = [
  // C3: +3 levels to Airborne Disease Prevention (skill). Raw cons[2] settings char_skill_elemental_bonus:3.
  { type: "constellation", constellation: 3, settings: { char_skill_elemental_bonus: 3 } },
  // C5: +3 levels to Compound Sedation Field (burst). Raw cons[4] settings char_skill_burst_bonus:3.
  { type: "constellation", constellation: 5, settings: { char_skill_burst_bonus: 3 } },
  // SELF A4 "Mutual Aid Agreement" (raw conditions, Ifa.js:301-307) — +80 EM (A4Mastery), a
  // ConditionBoolean gated only by ConditionAscensionChar({ascension:4}) (auto-true at A6 → the toggle
  // is the gate). Plain mastery stat (proven mirror) — lifts her swirl/EC reaction outputs. Was
  // golden-blind SKIPPED.
  { type: "boolean", name: "ifa_mutual_aid_agreement", stats: { mastery: 80 } },
  // SELF C4 "Decayed Vessels Permutation" (raw cons[3], Ifa.js:344-351) — +100 EM (C4Mastery), a
  // ConditionBoolean gated on constellation 4. Same plain-mastery lift of her reaction outputs.
  {
    type: "boolean",
    name: "ifa_decayed_vessels_permutation",
    stats: { mastery: 100 },
    condition: { type: "constellation", constellation: 4 },
  },
  // A1 "Field Medic's Vision" reaction-DMG% self-buff (raw Ifa.js:110-129,291-300).
  // ifa_field_medics_vision = ConditionNumberIfa slider, max 150 (A1Stacks). reactionDmgPost
  // (Ifa.js:118-129) emits dmg_reaction_swirl/_electrocharged += value × 1.5 (A1ReactionDmg),
  // gated and[common.nightsoul_blessing_state, ifa_field_medics_vision(>0), ascension 1].
  // Ported via bonusPerValue (clamped value × 1.5 per key, ÷100 at emit — Citlali C6 pattern):
  //   - the `>0` half of the gate is implicit in bonusPerValue (fires only when clamped > 0);
  //   - ascension 1 auto-true at level 90 → dropped, exactly as the A4 boolean above drops its
  //     ascension-4 gate (level-90 convention);
  //   - the name-keyed value emit (ifa_field_medics_vision: clamped) feeds the ifa_reaction_bonus
  //     readouts above (they scale on this stat × 1.5/0.2 → 225% / 30% at value 150).
  // lunarcharged (reactionDmgPost2, Ifa.js:131-141, dmg_reaction_lunarcharged × 0.2) is OUT of
  // scope: Ifa is anemo → she produces no self lunarcharged reaction output to lift (party-buffs
  // only). Deferred to the party-buffs channel.
  {
    type: "number",
    name: "ifa_field_medics_vision",
    max: 150,
    bonusPerValue: { dmg_reaction_swirl: 1.5, dmg_reaction_electrocharged: 1.5 },
    condition: { type: "boolean", name: "common.nightsoul_blessing_state" },
  },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const ifa: DbObjectChar = {
  name: "ifa",
  gameId: 10000113,
  rarity: 4,
  element: "anemo",
  weapon: "catalyst",
  origin: "natlan",
  statTable: IfaStatTable,
  talents,
  features,
  multipliers: [],
  conditions: constellationConditions,
};
