/**
 * Emilie — dendro polearm ATK scaler.
 *
 * 4-hit normal combo, charged hit, plunge/low/high, dendro skill (skill_dmg,
 * lumidouce_case_1_dmg, lumidouce_case_2_dmg, spiritbreath_thorn_dmg,
 * cleardew_cologne_dmg A1), dendro burst (lumidouce_case_3_dmg).
 *
 * A1 "Lingering Fragrance": emilie_cleardew_cologne_dmg — fixed 600% ATK dendro
 * skill hit, damageType "none", auto-active at A6 (ConditionAscensionChar asc1).
 * A4 "Rectification": atkBuffPost converts ATK → dmg_all (0.015 × total ATK,
 * capped at 36), gated on the enemy_burning toggle (+ ascension 4, satisfied at
 * the canonical A6 build). Ported as a `dmg_all` postEffect below (P3.5 enemy-state):
 * base-inert because enemy_burning is unset in every v5.8 golden.
 * Its readout other.emilie_dmg_bonus is ALSO emitted (the post-effect CONDITION
 * gates APPLICATION, not the display) → modelled as output:{kind:"static"} (P3.5.3).
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Emilie.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Emilie)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Emilie)
 */

import type { CharMultiplier, Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
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
  // --- A4 "Rectification" static readout: other.emilie_dmg_bonus = ATK → DMG% (capped) ---
  // FeaturePostEffectValue(atkBuffPost = PostEffectStatsAtk, percent=StatTable('dmg_all',[A4DamageBonus/1000=0.015]),
  // statCap=ValueTable([A4DamageBonusMax=36])), format:'percent'. The percent stat 'dmg_all' is isPercent → her /100
  // and the format ×100 CANCEL, so the displayed value = 0.015×atk_total capped at 36. Pattern: values = raw×100 =
  // 1.5 → (1.5/100)×atk_total = 0.015×atk_total; capValue = raw statCap = 36 (inert at the canonical ATK, ≈30.36).
  // The enemy_burning + asc4 conditions gate APPLICATION not the readout → modelled without them (cf. itto/ineffa).
  // raw/genshin_calc_pub/src/js/db/Char/Emilie.js:121-122,129-135,290-298; PostEffect/Stats.js:58-107.
  {
    name: "emilie_dmg_bonus",
    category: "other",
    output: { kind: "static" },
    multipliers: [
      { scaling: "atk", leveling: "", values: { getValue: () => 1.5 }, capValue: 36 },
    ],
  },
];

// ---------------------------------------------------------------------------
// Constellations (P2.C)
// ---------------------------------------------------------------------------
// C1 "Light Fragrance Leaching": dmg_skill_emilie +20. ConditionStatic (always-on at C1).
// C2 "Lakelight Top Note": SELF enemy_res_dendro −30 toggle — modelled below (was golden-blind
//   SKIPPED: the port modelled only party.emilie_lakelight_top_note; a diff-parity sweep surfaced
//   her dendro hits + dendro reactions diverging from cons 2 when the self toggle is on). raw
//   Emilie.js:359-371 (constellation[1] ConditionBoolean, enemy_res_dendro:C2DendroRes=−30).
// C3 "Exquisite Sillage": +3 Elemental Burst talent levels.
// C4 "Lumidouce Heart Note": ConditionStatic with no real stats (display text) → SKIP.
// C5 "Pique-Nique pour Deux": +3 Elemental Skill talent levels.
// C6 "Marcotte Sillage": SELF dendro infusion (attack_infusion:'dendro' on her physical normals/
//   charged/plunge) PLUS a +300%-ATK damage-instance bonus on her normal/charged hits — both
//   modelled below (was golden-blind SKIPPED: the port modelled neither; a diff-parity sweep
//   surfaced her normals/charged/plunge diverging at cons 6 when emilie_marcotte_sillage is on).
//   raw Emilie.js:332-344 (the atk* normal/charged FeatureMultiplier, ValueTable[C6DamageBonus=300],
//   ConditionAnd[marcotte_sillage, cons 6]) + :398-413 (constellation[5] ConditionBoolean,
//   settings attack_infusion:'dendro').
//
// Sources: raw/genshin_calc_pub/src/js/db/Char/Emilie.js:332-428

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
  // SELF C2 "Lakelight Top Note" — enemy Dendro RES −30%, lifting her dendro hits + dendro reactions.
  // ConditionBoolean gated at C2 (constellation[1] → THE CONSTELLATION IS A GATE; base-inert below
  // C2 / when untoggled). The SELF mirror of party.emilie_lakelight_top_note. raw Emilie.js:359-371.
  {
    type: "boolean",
    name: "emilie_lakelight_top_note",
    stats: { enemy_res_dendro: -30 },
    condition: { type: "constellation", constellation: 2 },
  },
  // SELF C6 "Marcotte Sillage" — dendro infusion on her physical normals/charged/plunge. ConditionBoolean
  // settings-publisher gated at C6 (constellation[5] → THE CONSTELLATION IS A GATE; base-inert below C6 /
  // when untoggled). The atk*-300% damage bonus on normal/charged is the c6MarcotteMultiplier below. raw
  // Emilie.js:398-413 (settings attack_infusion:'dendro'). (The c6MarcotteMultiplier carries the AND gate.)
  {
    type: "boolean",
    name: "emilie_marcotte_sillage",
    settings: { attack_infusion: "dendro" },
    condition: { type: "constellation", constellation: 6 },
  },
];

// SELF C6 "Marcotte Sillage" — +300% of ATK added to each normal/charged hit (a damage-instance
// multiplier, the SELF Dehya-C1/Itto-A4-class CharMultiplier). Gated by ConditionAnd[marcotte_sillage,
// cons 6] (THE CONSTELLATION IS A GATE; base-inert below C6 / when untoggled). raw Emilie.js:332-344
// (FeatureMultiplier scaling:'atk*', source:'constellation6', ValueTable[C6DamageBonus=300],
// target:normal/charged).
const C6_DAMAGE_BONUS = 300;
const c6MarcotteMultiplier: CharMultiplier = {
  leveling: "",
  scaling: "atk*",
  source: "constellation6",
  values: { getValue: () => C6_DAMAGE_BONUS },
  target: { damageTypes: ["normal", "charged"] },
  condition: {
    type: "and",
    items: [
      { type: "boolean", name: "emilie_marcotte_sillage" },
      { type: "constellation", constellation: 6 },
    ],
  },
};

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
  multipliers: [c6MarcotteMultiplier],
  conditions: constellationConditions,
  // A4 "Rectification": dmg_all += total ATK × (A4DamageBonus/1000 = 15/1000 = 0.015),
  // capped at A4DamageBonusMax = 36 (in dmg_all percent units). Gated by the enemy_burning
  // toggle; the raw ConditionAscensionChar({ascension:4}) is satisfied at the canonical A6
  // build (our engine has no ascension axis), so only the load-bearing boolean is kept.
  // PostEffectStatsAtk.getBase reads total ATK (base + flat + base×percent) = getTotal('atk').
  // Base-inert: enemy_burning is unset in every v5.8 golden. At the burning-emilie fixture the
  // bonus is ≈30.36 (atk_total ≈ 2024 × 0.015), BELOW the 36 cap → the cap is faithful but does
  // NOT bind here.
  // raw/genshin_calc_pub/src/js/db/Char/Emilie.js:119-137 (TalentValues + atkBuffPost);
  // raw/genshin_calc_pub/src/js/classes/PostEffect/Stats/Atk.js:5-15 (getBase/getBaseValueTree).
  postEffects: [
    {
      fromStat: "atk",
      toStat: "dmg_all",
      ratio: 0.015,
      capValue: 36,
      conditions: [{ type: "boolean", name: "enemy_burning" }],
    },
  ],
  // C2 "Lakelight Top Note" — enemy Dendro RES -30%.
  // Source: raw/genshin_calc_pub/src/js/db/Char/Emilie.js (partyData conditions)
  partyData: {
    conditions: [
      {
        type: "static",
        stats: { enemy_res_dendro: -30 },
        condition: { type: "boolean", name: "party.emilie_lakelight_top_note" },
      },
    ],
  },
};
