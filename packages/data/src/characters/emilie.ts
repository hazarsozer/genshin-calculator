/**
 * Emilie — dendro polearm ATK scaler.
 *
 * 4-hit normal combo, charged hit, plunge/low/high, dendro skill (skill_dmg,
 * lumidouce_case_1_dmg, lumidouce_case_2_dmg, spiritbreath_thorn_dmg,
 * cleardew_cologne_dmg A1), dendro burst (lumidouce_case_3_dmg).
 *
 * A1 "Lingering Fragrance": emilie_cleardew_cologne_dmg — fixed 600% ATK dendro
 * skill hit, damageType "none", auto-active at A6 (ConditionAscensionChar asc1).
 * A4 "Rectification": atkBuffPost converts ATK → dmg_all (conditional on
 * enemy_burning toggle — OFF at canonical build, so no postEffects needed here).
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Emilie.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Emilie)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Emilie)
 */

import type { Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Emilie as EmilieStatTable } from "../generated/charTables.js";
import { Emilie as EmilieTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return EmilieTalents.s1.p1;
      if (name === "normal_hit_2") return EmilieTalents.s1.p2;
      if (name === "normal_hit_3") return EmilieTalents.s1.p3;
      if (name === "normal_hit_4") return EmilieTalents.s1.p4;
      if (name === "charged_hit") return EmilieTalents.s1.p5;
      if (name === "plunge") return EmilieTalents.s1.p7;
      if (name === "plunge_low") return EmilieTalents.s1.p8;
      if (name === "plunge_high") return EmilieTalents.s1.p9;
    }
    if (talent === "skill") {
      if (name === "skill_dmg") return EmilieTalents.s2.p1;
      if (name === "emilie_lumidouce_case_1_dmg") return EmilieTalents.s2.p2;
      if (name === "emilie_lumidouce_case_2_dmg") return EmilieTalents.s2.p3;
      if (name === "spiritbreath_thorn_dmg") return EmilieTalents.s2.p5;
    }
    if (talent === "burst") {
      if (name === "emilie_lumidouce_case_3_dmg") return EmilieTalents.s3.p1;
    }
    throw new Error(`emilie talents: unknown path '${path}'`);
  },
};

// A1 "Lingering Fragrance": constant 600% ATK dendro skill hit.
// raw: new ValueTable([600]) → always 600 regardless of talent level.
// leveling is not in LEVELING_TO_SLOT → talentLevel=1, getValue(1)=600.
const cleardewValues = { getValue: (_level: number) => 600 };

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks ---
  // raw: FeatureDamageNormal normal_hit_1 (Emilie.js:151-158)
  {
    name: "normal_hit_1",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1") }],
  },
  // raw: FeatureDamageNormal normal_hit_2 (Emilie.js:160-167)
  {
    name: "normal_hit_2",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2") }],
  },
  // raw: FeatureDamageNormal normal_hit_3 (Emilie.js:169-176)
  {
    name: "normal_hit_3",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }],
  },
  // raw: FeatureDamageNormal normal_hit_4 (Emilie.js:178-185)
  {
    name: "normal_hit_4",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4") }],
  },
  // --- Charged attack ---
  // raw: FeatureDamageCharged charged_hit (Emilie.js:187-194)
  {
    name: "charged_hit",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }],
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
  // --- Skill: Fragrance Extraction (dendro) ---
  // raw: FeatureDamageSkill skill_dmg (Emilie.js:223-233)
  {
    name: "skill_dmg",
    category: "skill",
    element: "dendro",
    damageBonuses: ["dmg_skill_emilie"],
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.skill_dmg") }],
  },
  // raw: FeatureDamageSkill emilie_lumidouce_case_1_dmg (Emilie.js:234-243)
  {
    name: "emilie_lumidouce_case_1_dmg",
    category: "skill",
    element: "dendro",
    damageBonuses: ["dmg_skill_emilie"],
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.emilie_lumidouce_case_1_dmg") }],
  },
  // raw: FeatureDamageSkill emilie_lumidouce_case_2_dmg (Emilie.js:245-254)
  // Fixture tests single-hit value (1818); model as one multiplier entry.
  {
    name: "emilie_lumidouce_case_2_dmg",
    category: "skill",
    element: "dendro",
    damageBonuses: ["dmg_skill_emilie"],
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.emilie_lumidouce_case_2_dmg") }],
  },
  // raw: FeatureDamageSkill spiritbreath_thorn_dmg (Emilie.js:256-266)
  {
    name: "spiritbreath_thorn_dmg",
    category: "skill",
    element: "dendro",
    damageBonuses: ["dmg_skill_emilie"],
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.spiritbreath_thorn_dmg") }],
  },
  // A1 "Lingering Fragrance": emilie_cleardew_cologne_dmg (Emilie.js:268-280)
  // FeatureDamage category='skill', element='dendro', damageType='none'.
  // ValueTable([600]) with source='ascension1' → talentLevel=1, constant 600% ATK.
  // Auto-active at A6 (ConditionAscensionChar asc1 always satisfied at asc6).
  {
    name: "emilie_cleardew_cologne_dmg",
    category: "skill",
    element: "dendro",
    damageType: "none",
    damageBonuses: ["dmg_skill_emilie"],
    multipliers: [{ leveling: "ascension1", values: cleardewValues }],
  },
  // --- Burst: Aromatic Explication (dendro) ---
  // raw: FeatureDamageBurst emilie_lumidouce_case_3_dmg (Emilie.js:281-290)
  {
    name: "emilie_lumidouce_case_3_dmg",
    category: "burst",
    element: "dendro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.emilie_lumidouce_case_3_dmg") }],
  },
];

// ---------------------------------------------------------------------------
// Constellations (P2.C)
// ---------------------------------------------------------------------------
// C1 "Light Fragrance Leaching": dmg_skill_emilie +20. ConditionStatic (always-on at C1).
// C2 "Lakelight Top Note": enemy_res_dendro toggle → SKIP.
// C3 "Exquisite Sillage": +3 Elemental Burst talent levels.
// C4 "Lumidouce Heart Note": ConditionStatic with no real stats (display text) → SKIP.
// C5 "Pique-Nique pour Deux": +3 Elemental Skill talent levels.
// C6 "Marcotte Sillage": ConditionBoolean toggle (attack_infusion:'dendro') → SKIP.
//
// Sources: raw/genshin_calc_pub/src/js/db/Char/Emilie.js:347-428

const constellationConditions: readonly Condition[] = [
  // C1: dmg_skill_emilie +20. ConditionStatic{ stats:{ dmg_skill_emilie:20 } }
  // Raw cons[0]: ConditionStatic{ stats:{ dmg_skill_emilie: TalentValues.C1SkillBonus=20 } }
  { type: "constellation", constellation: 1, stats: { dmg_skill_emilie: 20 } },
  // C3: +3 Elemental Burst talent levels.
  // Raw cons[2]: Condition{ settings:{ char_skill_burst_bonus:3 } }
  { type: "constellation", constellation: 3, settings: { char_skill_burst_bonus: 3 } },
  // C5: +3 Elemental Skill talent levels.
  // Raw cons[4]: Condition{ settings:{ char_skill_elemental_bonus:3 } }
  { type: "constellation", constellation: 5, settings: { char_skill_elemental_bonus: 3 } },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const emilie: DbObjectChar = {
  name: "emilie",
  gameId: 10000099,
  rarity: 5,
  element: "dendro",
  weapon: "polearm",
  origin: "fontaine",
  statTable: EmilieStatTable,
  talents,
  features,
  multipliers: [],
  conditions: constellationConditions,
};
