/**
 * Kujou Sara — electro bow ATK scaler.
 *
 * 5-hit normal combo (physical bow), physical aimed shot, electro fully
 * charged aimed shot, plunge, electro skill (sara_ambush_dmg), electro burst
 * (sara_titanbreaker_dmg + sara_stormcluster_dmg).
 *
 * Non-damage features in fixture (skipped by golden harness — no damageType):
 *   skill.sara_atk_bonus   — Tengu Juurai self-ATK-buff readout (atk_base × skill atk_bonus);
 *     MODELLED below as a FeatureStatic (scaling:"atk_base") now the eval bag emits atk_base.
 *   skill.sara_decorum     — A4 ER recharge readout (PostEffectStatsRecharge, A4-gated);
 *     MODELLED below as a FeatureStatic (scaling:"recharge_total") — the recharge total now
 *     resolves via the eval bag. Raw Sara.js:240-249.
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
    isAimed: true,
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.aimed") }],
  },
  // charged_aimed: electro fully charged arrow.
  // raw/genshin_calc_pub/src/js/db/Char/Sara.js:181-189
  {
    name: "charged_aimed",
    isAimed: true,
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
  // --- skill.sara_atk_bonus: Tengu Juurai self-ATK-buff readout (FeaturePostEffectValue → static) ---
  // Raw Sara.js:107-118,235-239 — atkBuffPost = PostEffectStats{ from:'atk_base' (the wielder's
  // own white base ATK), percent:getMulti(skill.sara_atk_bonus, 0.01) }, exposed as a
  // FeaturePostEffectValue. The buff = atk_base × (SaraTalents.s2.p2 @L10 × 0.01) = atk_base ×
  // 0.77328 (the SAME ratio the partyData Tengu Juurai battery applies — reused below, not
  // hardcoded). The atk_base scaling now resolves via the eval-bag atk_base emit. The readout is
  // modelled WITHOUT the atkBuffPost's `sara_tengu_juurai` application gate → the canonical value
  // the oracle dumps. The engine divides values.getValue()/100, so getValue() returns the raw
  // skill atk_bonus table value (77.328; /100 → 0.77328). NEVER baked.
  {
    name: "sara_atk_bonus",
    category: "skill",
    output: { kind: "static" },
    multipliers: [
      // scaling atk_base × (SaraTalents.s2.p2@L10 / 100) = atk_base × 0.77328.
      { scaling: "atk_base", leveling: "", values: { getValue: () => SaraTalents.s2.p2.getValue(10) } },
    ],
  },
  // --- skill.sara_decorum: A4 "Decorum" ER recharge readout (FeaturePostEffectValue → static) ---
  // Raw Sara.js:240-249 — PostEffectStatsRecharge({ percent: StatTable('', [1.2]) }), format:'decimal'.
  // Her getTree: value(=1.2) × recharge_total_DECIMAL (makeStatTotalItem('recharge') → percent flag →
  // recharge/100), and isPercent('') is FALSE so value is NOT /100'd; format:'decimal' applies NO ×100.
  // In our engine the term is (getValue/100) × recharge_total, where recharge_total is the PERCENT form
  // (e.g. 200). So getValue/100 × recharge_percent = 1.2/100 × recharge_percent reproduces her
  // 1.2 × recharge_decimal exactly → getValue = the raw StatTable constant 1.2 (recharge absorbs the ×100).
  // Modelled WITHOUT the A4 application gate (canonical-active value the oracle dumps). NEVER baked.
  {
    name: "sara_decorum",
    category: "skill",
    output: { kind: "static" },
    multipliers: [
      { scaling: "recharge_total", leveling: "", values: { getValue: () => 1.2 } },
    ],
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
  // SELF Tengu Juurai ATK battery — the wielder buffs her OWN ATK (atk_base × skill atk_bonus)
  // while sara_tengu_juurai is toggled on. Raw atkBuffPost (Sara.js:107-118): PostEffectStats{
  //   levelSetting:'char_skill_elemental', from:'atk_base',
  //   percent: getMulti({ from:'skill.sara_atk_bonus', multi:0.01 }),
  //   conditions:[ ConditionBoolean('sara_tengu_juurai') ] }.
  // The port had ONLY the partyData mirror (party.sara_tengu_juurai battery) → golden-blind SKIP of
  // the SELF version, so Sara's own NA/skill/burst under her own buff under-reported (diff-parity:
  // every damage feature ~0.69× when sara_tengu_juurai ON). Reuses the SAME ratioFromTalent surface
  // as the party battery. Note: NO maxLevelSetting here (raw atkBuffPost sets none → the C5 skill +3
  // bonus pushes the effective level past 10, faithful to her getLevel). Gated OFF by default →
  // base-inert (58k goldens byte-unchanged).
  postEffects: [
    {
      fromStat: "atk_base",
      toStat: "atk",
      ratioFromTalent: {
        table: SaraTalents.s2.p2,
        levelSetting: "char_skill_elemental",
        multi: 0.01,
      },
      conditions: [{ type: "boolean", name: "sara_tengu_juurai" }],
    } satisfies CharPostEffect,
  ],
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
      // Tengu Juurai ATK battery: atk_base × skill atk_bonus (Sara.s2.p2), scaled with the
      // BUFFER'S skill talent and clamped at L10 (raw PostEffectStats.maxLevelSetting:10).
      // ratioFromTalent reads the buffer's skill setting (sara_char_skill_elemental, already
      // lifted into the bag by the ConditionNumber above) so the buff scales below L10 instead
      // of baking the L10 table value — the parity-audit found the baked-L10 form OVER-buffs
      // teammates when Sara's skill < 10. multi:0.01 reproduces her getMulti(multi:0.01).
      // Source: raw/genshin_calc_pub/src/js/db/Char/Sara.js:409-417
      {
        fromStat: "sara_atk_base",
        toStat: "atk",
        ratioFromTalent: {
          table: SaraTalents.s2.p2,
          levelSetting: "sara_char_skill_elemental",
          multi: 0.01,
          maxLevelSetting: 10,
        },
        conditions: [{ type: "boolean", name: "party.sara_tengu_juurai" }],
      } satisfies CharPostEffect,
    ],
  },
};
