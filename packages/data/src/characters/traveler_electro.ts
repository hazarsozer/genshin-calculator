/**
 * Traveler (Electro) — electro sword ATK scaler.
 *
 * 5-hit normal combo, 2-sub-hit charged (charged_hit_total multihit parent +
 * charged_hit_1 / charged_hit_2 sub-hits), plunge/low/high, electro skill
 * (Lightning Blade), electro burst (Bellowing Thunder: burst_dmg + the periodic
 * Falling Thunder hits). Normals/charged/plunge are physical (sword, no innate
 * infusion); skill + burst are electro.
 *
 * skill.traveler_electro_recharge_bonus — A4 "Resounding Roar" ER→Burst-DMG readout;
 * MODELLED below as a FeatureStatic (scaling:"recharge_total" + flat bonus). The
 * harness asserts it (non-damage output); modelled WITHOUT the amulet gate (the
 * oracle dumps the A4-active value, 40).
 *
 * SKIPPED (not C0-unconditional damage triples, so excluded by the golden
 * harness which only asserts non-empty-damageType fixture entries):
 *   - traveler_falling_thunder_bonus_dmg — C6-gated (ConditionConstellation 6),
 *     OFF at C0.
 *
 * No always-on passive ATK/crit/DMG bonuses fold in: A1 (Thunderflash) is a
 * ConditionStatic text marker, A4 (Resounding Roar) is a recharge→burst-DMG
 * conversion gated on the amulet toggle (OFF in the fixed solo build). The
 * reaction features (electrocharged / overloaded / superconduct / hyperbloom /
 * shatter) are emitted generically from the electro element by the loader.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/TravelerElectro.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Traveler)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (TravelerElectro)
 */

import type { Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Traveler as TravelerStatTable } from "../generated/charTables.js";
import { TravelerElectro as TravelerElectroTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return TravelerElectroTalents.s1.p1;
      if (name === "normal_hit_2") return TravelerElectroTalents.s1.p2;
      if (name === "normal_hit_3") return TravelerElectroTalents.s1.p3;
      if (name === "normal_hit_4") return TravelerElectroTalents.s1.p4;
      if (name === "normal_hit_5") return TravelerElectroTalents.s1.p5;
      if (name === "charged_hit_1") return TravelerElectroTalents.s1.p6;
      if (name === "charged_hit_2") return TravelerElectroTalents.s1.p7;
      if (name === "plunge") return TravelerElectroTalents.s1.p9;
      if (name === "plunge_low") return TravelerElectroTalents.s1.p10;
      if (name === "plunge_high") return TravelerElectroTalents.s1.p11;
    }
    if (talent === "skill") {
      if (name === "skill_dmg") return TravelerElectroTalents.s2.p1;
    }
    if (talent === "burst") {
      if (name === "burst_dmg") return TravelerElectroTalents.s3.p1;
      if (name === "traveler_falling_thunder_dmg") return TravelerElectroTalents.s3.p2;
    }
    throw new Error(`traveler_electro talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (physical sword) ---
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
  // --- Charged attack: 2-sub-hit multihit total + the two sub-hits ---
  // raw: FeatureDamageMultihit({ name:'charged_hit_total', items:[p6, p7] })
  //      + two FeatureDamageCharged({isChild}) → modelled as named children (drop isChild).
  {
    name: "charged_hit_total",
    category: "attack",
    damageType: "charged",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit_1") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit_2") }] },
    ],
  },
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
  // --- Skill: Lightning Blade (electro) ---
  {
    name: "skill_dmg",
    category: "skill",
    element: "electro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.skill_dmg") }],
  },
  // --- Burst: Bellowing Thunder (electro) ---
  {
    name: "burst_dmg",
    category: "burst",
    element: "electro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") }],
  },
  {
    name: "traveler_falling_thunder_dmg",
    category: "burst",
    element: "electro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.traveler_falling_thunder_dmg") }],
  },
  // --- C6 "World Shaker": extra Falling Thunder hit at 200% of the base hit.
  // Raw FeatureDamageBurst traveler_falling_thunder_bonus_dmg, scalingMultiplier:2 on
  // traveler_falling_thunder_dmg talent, ConditionConstellation({constellation:6}).
  // TravelerElectro.js:307-319.
  {
    name: "traveler_falling_thunder_bonus_dmg",
    category: "burst",
    element: "electro",
    condition: { type: "constellation", constellation: 6 },
    multipliers: [
      {
        leveling: "char_skill_burst",
        values: talents.get("burst.traveler_falling_thunder_dmg"),
        scalingMultiplier: 2,
        source: "constellation6",
      },
    ],
  },
  // --- skill.traveler_electro_recharge_bonus: A4 "Resounding Roar" ER→Burst-DMG readout (static) ---
  // Raw TravelerElectro.js:143-150,329-334 — rechargePostA4Post = PostEffectStatsRecharge({
  // percent: StatTable('recharge', [10]), flatBonus: ValueTable([0.2]) }), format:'percent'.
  // Her getTree: percent value(=10)/100 (isPercent('recharge')) × recharge_DECIMAL, PLUS flatBonus(=0.2)
  // added raw, then ×100 (format:'percent') = 10 × recharge_decimal + 0.2×100.
  // In our engine (getValue/100) × recharge_total(PERCENT) + flatValues = getValue × recharge_decimal + flatValues,
  // so getValue = raw percent constant 10 (recharge absorbs the ×100) and flatValues = raw flatBonus 0.2 × 100 = 20
  // (the flatBonus is NOT a stat scale → its ×100 percent-format fold IS expressed here). Modelled WITHOUT the
  // amulet gate (A4-active value the oracle dumps). NEVER baked.
  {
    name: "traveler_electro_recharge_bonus",
    category: "skill",
    output: { kind: "static" },
    multipliers: [
      { scaling: "recharge_total", leveling: "", values: { getValue: () => 10 }, flatValues: { getValue: () => 0.2 * 100 } },
    ],
  },
];

// ---------------------------------------------------------------------------
// Constellation conditions (P2.C) + SELF passive toggles
// ---------------------------------------------------------------------------
// SELF buffs (golden-blind SKIPPED — the port modelled only the party.* C2 mirror + skipped the
// two shared passive toggles entirely; all OFF in the fixed solo build, so the 58k DAMAGE goldens
// never exercised them — a diff-parity sweep surfaced every Electro hit diverging):
//   "Swordfighting Techniques" (traveler_swordfighting_techniques): +3 base ATK. Ungated. raw
//     TravelerElectro.js:363-371.
//   "Special Training" (traveler_special_training): +7 base ATK, +15 EM, +50 base HP. Ungated. raw
//     TravelerElectro.js:372-382.
//   C2 "Violet Vehemence" (traveler_violet_vehemence): enemy Electro RES −15 (lifts her electro
//     hits + electro reactions). ConditionBoolean gated at C2 (constellation[1] → THE CONSTELLATION
//     IS A GATE). The SELF mirror of party.traveler_violet_vehemence. raw TravelerElectro.js:399-407.
//   NOT modelled (damage-inert): "Abundance Amulet" (traveler_abundance_amulet) is a pure toggle
//     whose ONLY effect is energy-recharge post-effects (rechargePreA4Post/rechargePostA4Post,
//     TravelerElectro.js:133-150) — recharge never reaches a damage number, so it is faithfully
//     omitted (the diff-parity sweep sets it but it causes no damage divergence).
// C4: ConditionStatic (text_percent1/text_percent2) — display-only, SKIP.
// C6: cons-ADDED feature traveler_falling_thunder_bonus_dmg handled above in features array.
//     Raw cons[5] has ConditionStatic({stats:{text_percent_dmg:100}}) — display only, SKIP.
// Raw: db/Char/TravelerElectro.js constellation array (TravelerElectro.js:363-451).
const constellationConditions: readonly Condition[] = [
  // C3: +3 levels to burst talent.
  { type: "constellation", constellation: 3, settings: { char_skill_burst_bonus: 3 } },
  // C5: +3 levels to elemental skill talent.
  { type: "constellation", constellation: 5, settings: { char_skill_elemental_bonus: 3 } },
  // SELF shared passives — +base ATK (every hit) + EM (reactions) + base HP (damage-inert here).
  // Ungated ConditionBooleans. raw TravelerElectro.js:363-382.
  { type: "boolean", name: "traveler_swordfighting_techniques", stats: { atk_base: 3 } },
  { type: "boolean", name: "traveler_special_training", stats: { atk_base: 7, mastery: 15, hp_base: 50 } },
  // SELF C2 "Violet Vehemence" — enemy Electro RES −15% (lifts her electro hits + reactions).
  // ConditionBoolean gated at C2 (THE CONSTELLATION IS A GATE; base-inert below C2 / when untoggled).
  // raw TravelerElectro.js:399-407.
  {
    type: "boolean",
    name: "traveler_violet_vehemence",
    stats: { enemy_res_electro: -15 },
    condition: { type: "constellation", constellation: 2 },
  },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const travelerElectro: DbObjectChar = {
  name: "traveler_electro",
  gameId: 10000005,
  rarity: 5,
  element: "electro",
  weapon: "sword",
  origin: "foreign",
  statTable: TravelerStatTable,
  talents,
  features,
  multipliers: [],
  conditions: constellationConditions,
};
