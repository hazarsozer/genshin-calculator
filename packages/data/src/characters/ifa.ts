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
 * NOT modelled (display-only / out of C0 solo baseline):
 *   - skill.ifa_tonicshot_heal (FeatureHeal, damageType="") — harness skips empty
 *     damageType entries; display-only, not asserted.
 *   - other.ifa_reaction_bonus / _2 (FeaturePostEffectValue, damageType="") — the A1
 *     "Field Medic's Vision" swirl/EC/lunar-charged reaction-DMG bonuses are gated
 *     behind common.nightsoul_blessing_state + ifa_field_medics_vision + A1, all OFF
 *     at settings={} → 0 in fixture, display-only, not asserted.
 *   - C6 ifa_tonicshot_add_dmg (constellation 6) — C0 build, omitted.
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
    category: "attack",
    damageType: "plunge",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_low") }],
  },
  {
    name: "plunge_high",
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
