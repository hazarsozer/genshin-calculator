/**
 * Kujou Sara — electro bow ATK scaler.
 *
 * 5-hit normal combo (physical bow), physical aimed shot, electro fully
 * charged aimed shot, plunge, electro skill (sara_ambush_dmg), electro burst
 * (sara_titanbreaker_dmg + sara_stormcluster_dmg).
 *
 * Non-damage features in fixture (skipped by golden harness — no damageType):
 *   skill.sara_atk_bonus   — ATK% flat buff display (PostEffectStats / conditional toggle)
 *   skill.sara_decorum     — A4 ER recharge readout (PostEffectStatsRecharge, A4-gated)
 * Both are conditional-off in the fixed solo C0 build; no feature modelling needed.
 *
 * C2 sara_dark_wings_dmg is constellation-gated (C2); not modelled at C0.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Sara.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Sara)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Sara)
 */

import type { CharPostEffect, Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Sara as SaraStatTable } from "../generated/charTables.js";
import { Sara as SaraTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return SaraTalents.s1.p1;
      if (name === "normal_hit_2") return SaraTalents.s1.p2;
      if (name === "normal_hit_3") return SaraTalents.s1.p3;
      if (name === "normal_hit_4") return SaraTalents.s1.p4;
      if (name === "normal_hit_5") return SaraTalents.s1.p5;
      if (name === "aimed") return SaraTalents.s1.p6;
      if (name === "charged_aimed") return SaraTalents.s1.p7;
      if (name === "plunge") return SaraTalents.s1.p8;
      if (name === "plunge_low") return SaraTalents.s1.p9;
      if (name === "plunge_high") return SaraTalents.s1.p10;
    }
    if (talent === "skill") {
      if (name === "sara_ambush_dmg") return SaraTalents.s2.p1;
    }
    if (talent === "burst") {
      if (name === "sara_titanbreaker_dmg") return SaraTalents.s3.p1;
      if (name === "sara_stormcluster_dmg") return SaraTalents.s3.p2;
    }
    throw new Error(`kujou_sara talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (physical bow) ---
  // raw/genshin_calc_pub/src/js/db/Char/Sara.js:132-171
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
  // --- Charged attacks (bow aimed shots) ---
  // aimed: physical charged shot.
  // raw/genshin_calc_pub/src/js/db/Char/Sara.js:172-180
  {
    name: "aimed",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.aimed") }],
  },
  // charged_aimed: electro fully charged arrow.
  // raw/genshin_calc_pub/src/js/db/Char/Sara.js:181-189
  {
    name: "charged_aimed",
    category: "attack",
    damageType: "charged",
    element: "electro",
    // C6 "Sin of Pride": crit_dmg_electro:60 applies to every electro hit (her engine
    // folds crit_dmg_<element> by element); our per-feature model needs it declared.
    critDamageBonuses: ["crit_dmg_electro"],
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_aimed") }],
  },
  // --- Plunge attacks (physical) ---
  // raw/genshin_calc_pub/src/js/db/Char/Sara.js:189-211
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
  // --- Skill: Tengu Stormcall ---
  // sara_ambush_dmg: electro skill ambush hit.
  // C6 "Sin of Pride" contributes crit_dmg_electro:60 (auto-active ConditionStatic
  // at C6); this feature picks it up via critDamageBonuses. Raw Sara.js:213-221.
  {
    name: "sara_ambush_dmg",
    category: "skill",
    element: "electro",
    // C6: +60% crit DMG to electro features. Raw Sara.js:344-351 crit_dmg_electro:60.
    critDamageBonuses: ["crit_dmg_electro"],
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.sara_ambush_dmg") }],
  },
  // --- C2 "Dark Wings": cons-added electro skill hit = 30% of sara_ambush_dmg.
  // Raw: FeatureDamageSkill sara_dark_wings_dmg, scalingMultiplier:0.3,
  // leveling:'char_skill_elemental', same talent values. Raw Sara.js:222-234.
  // ConditionConstellation(2).
  {
    name: "sara_dark_wings_dmg",
    category: "skill",
    element: "electro",
    // C6: also picks up crit_dmg_electro:60 (electro feature).
    critDamageBonuses: ["crit_dmg_electro"],
    condition: { type: "constellation", constellation: 2 },
    multipliers: [
      {
        leveling: "char_skill_elemental",
        values: talents.get("skill.sara_ambush_dmg"),
        scalingMultiplier: 0.3,
        source: "constellation2",
      },
    ],
  },
  // --- Burst: Koukou Sendou ---
  // sara_titanbreaker_dmg: main electro burst hit.
  // C6: +60% crit DMG to electro features. Raw Sara.js:250-258.
  {
    name: "sara_titanbreaker_dmg",
    category: "burst",
    element: "electro",
    critDamageBonuses: ["crit_dmg_electro"],
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.sara_titanbreaker_dmg") }],
  },
  // sara_stormcluster_dmg: secondary electro cluster hits.
  // C6: +60% crit DMG to electro features. Raw Sara.js:259-267.
  {
    name: "sara_stormcluster_dmg",
    category: "burst",
    element: "electro",
    critDamageBonuses: ["crit_dmg_electro"],
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.sara_stormcluster_dmg") }],
  },
];

// ---------------------------------------------------------------------------
// Constellation conditions (P2.C)
// ---------------------------------------------------------------------------
// C1 "Crow's Eye": ConditionStatic, no damage stats → display-only, SKIP.
// C2 "Dark Wings": ConditionStatic text_percent_dmg:30 → display-only;
//   actual damage from sara_dark_wings_dmg feature above. Raw Sara.js:308-317.
// C3: +3 levels to Koukou Sendou (burst). Raw cons[2] settings char_skill_burst_bonus:3.
// C4 "Conclusive Proof": ConditionStatic, no damage stats → display-only, SKIP.
// C5: +3 levels to Tengu Stormcall (skill). Raw cons[4] settings char_skill_elemental_bonus:3.
//   NOTE: C3=burst, C5=skill (reversed from the typical pattern). Raw Sara.js:318-345.
// C6 "Sin of Pride": ConditionStatic (auto-active), crit_dmg_electro:60.
//   Consumed by electro features via critDamageBonuses:['crit_dmg_electro']. Raw Sara.js:344-351.
const constellationConditions: readonly Condition[] = [
  // C3: +3 levels to Koukou Sendou (elemental burst). Raw cons[2] settings.
  { type: "constellation", constellation: 3, settings: { char_skill_burst_bonus: 3 } },
  // C5: +3 levels to Tengu Stormcall (elemental skill). Raw cons[4] settings.
  { type: "constellation", constellation: 5, settings: { char_skill_elemental_bonus: 3 } },
  // C6: +60% crit DMG to electro features (ConditionStatic, auto-active).
  // Consumed by sara_ambush_dmg / sara_dark_wings_dmg / sara_titanbreaker_dmg / sara_stormcluster_dmg
  // via critDamageBonuses:['crit_dmg_electro']. Raw Sara.js:344-351.
  { type: "constellation", constellation: 6, stats: { crit_dmg_electro: 60 } },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const kujouSara: DbObjectChar = {
  name: "kujou_sara",
  gameId: 10000056,
  rarity: 4,
  element: "electro",
  weapon: "bow",
  origin: "inazuma",
  statTable: SaraStatTable,
  talents,
  features,
  multipliers: [],
  conditions: constellationConditions,
  // partyData — teammate kit buffs (P3.5.2 Bucket B).
  // Source: raw/genshin_calc_pub/src/js/db/Char/Sara.js:357-422
  // Scope: oracle-gated core only — the base Tengu Juurai ATK battery.
  // Deferred to the P3.5.2 variant-rep pass:
  //   C5 "Spellsinger": sara_char_skill_elemental_bonus:3 — bonus skill levels (moot; clamped to L10).
  //   C6 "Sin of Pride": gated on kujou_sara_spellsinger + kujou_sara_sin_of_pride toggles; handled
  //     by the constellation condition's crit_dmg_electro:60 already on constellationConditions.
  partyData: {
    loadStats: {
      stats: ["atk_base"],
    },
    conditions: [
      // ConditionNumber: lifts the teammate's atk_base into the recipient's stat bag.
      { type: "number", name: "sara_atk_base", max: 10000 },
      // ConditionNumberTalent: mirrors 'sara_char_skill_elemental' (the skill level setting).
      { type: "number", name: "sara_char_skill_elemental", max: 15 },
      // Tengu Juurai master toggle (gates the ATK battery postEffect below).
      { type: "boolean", name: "party.sara_tengu_juurai" },
    ],
    postEffects: [
      // Tengu Juurai ATK battery: atk_base × skill atk_bonus (Sara.s2.p2), clamped at L10
      // (raw PostEffectStats.maxLevelSetting:10). Baked ratio = L10 table value × 0.01.
      // Sara.s2.p2 at L10 = 77.328 → ratio = 0.77328. Matches the maxLevelSetting idiom
      // of Bennett party ATK battery (capped at burst L10 = 1.008).
      // Source: raw/genshin_calc_pub/src/js/db/Char/Sara.js:408-421
      {
        fromStat: "sara_atk_base",
        toStat: "atk",
        ratio: SaraTalents.s2.p2.getValue(10) * 0.01,
        conditions: [{ type: "boolean", name: "party.sara_tengu_juurai" }],
      } satisfies CharPostEffect,
    ],
  },
};
