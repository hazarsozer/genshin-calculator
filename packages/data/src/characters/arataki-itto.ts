/**
 * Arataki Itto — P1.7b DEF-scaling representative.
 *
 * DEF scaler: during Royal Descent Behold Itto the Evil (burst), DEF is
 * converted to ATK at ratio = itto_atk_bonus@level10 × 0.01 = 103.68 × 0.01.
 * The condition is `itto_royal_descent` (a boolean toggle).
 *
 * Features: normal attacks, charged attacks (Kesagiri + Saichimonji), plunge,
 * geo skill (skill_dmg).
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Itto.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js:1809
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js:2291
 */

import type {
  CharMultiplier,
  CharPostEffect,
  Condition,
  DbObjectChar,
  Feature,
  TalentResolver,
} from "@genshin/types";
import { Itto as IttoStatTable } from "../generated/charTables.js";
import { Itto as IttoTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return IttoTalents.s1.p1;
      if (name === "normal_hit_2") return IttoTalents.s1.p2;
      if (name === "normal_hit_3") return IttoTalents.s1.p3;
      if (name === "normal_hit_4") return IttoTalents.s1.p4;
      if (name === "itto_kesagiri_combo_slash_dmg") return IttoTalents.s1.p6;
      if (name === "itto_kesagiri_final_slash_dmg") return IttoTalents.s1.p7;
      if (name === "itto_saichimonji_slash_dmg") return IttoTalents.s1.p5;
      if (name === "plunge") return IttoTalents.s1.p9;
      if (name === "plunge_low") return IttoTalents.s1.p10;
      if (name === "plunge_high") return IttoTalents.s1.p11;
    }
    if (talent === "skill") {
      if (name === "skill_dmg") return IttoTalents.s2.p1;
      if (name === "itto_hurls_ushi_hp") return IttoTalents.s2.p2;
    }
    if (talent === "burst") {
      if (name === "itto_atk_bonus") return IttoTalents.s3.p2;
    }
    throw new Error(`arataki-itto talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Conditions
// ---------------------------------------------------------------------------

const royalDescent: Condition = {
  type: "boolean",
  name: "itto_royal_descent",
};

// ---------------------------------------------------------------------------
// Post-effects
// ---------------------------------------------------------------------------

/**
 * DEF→ATK conversion during Royal Descent (burst).
 * ratio = itto_atk_bonus @ burst level 10 × 0.01 = 103.68 × 0.01 = 1.0368
 * No cap (her raw PostEffectStatsDef has no statCapPost).
 *
 * Source: Itto.js:130-140
 */
const defToAtk: CharPostEffect = {
  priority: 1,
  fromStat: "def",
  toStat: "atk",
  ratio: IttoTalents.s3.p2.getValue(10) * 0.01,
  conditions: [royalDescent],
};

// ---------------------------------------------------------------------------
// A4 "Bloodline of the Crimson Oni" — charged-attack DEF base term
// ---------------------------------------------------------------------------

/**
 * A4 adds `0.35 × DEF` to charged-attack base damage. Her data models it as a
 * char-level targeted multiplier (P2.3 generalized this from the former per-feature
 * hack): `{ scaling:'def*', source:'ascension4', values:[35],
 * target:{damageTypes:['charged']} }`. `compileFeature` sums it into the base term
 * (cBaseDamage) of EVERY charged feature as `0.35 × def_total` — identical to her
 * `getMultipliers` merging `char.multipliers` into each feature (Feature2.js:121).
 *
 * Always-on (no `condition`): A4 is unlocked at ascension 4 and the canonical build
 * is ascension 6, so it is unconditionally active — matching her `defToAtk`
 * post-effect, which likewise does not re-gate on ascension. (Her raw entry gates on
 * `ConditionAscensionChar({ascension:4})`; we have no ascension condition variant and
 * the baseline is always ≥ A4, so the gate is vacuously true and omitted.)
 *
 * Source: raw/genshin_calc_pub/src/js/db/Char/Itto.js:124 (A4ChargedDefBonus: 35),
 *         :320-330 (the def* charged-targeted char-level multiplier).
 */
const A4_CHARGED_DEF_BONUS = 35;
const a4ChargedDefMultiplier: CharMultiplier = {
  leveling: "",
  scaling: "def*",
  source: "ascension4",
  values: { getValue: () => A4_CHARGED_DEF_BONUS },
  target: { damageTypes: ["charged"] },
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks ---
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
  // --- Charged attacks (Kesagiri) ---
  // C6 "Arataki Itto, Present!" adds +70% Crit DMG to Kesagiri and Saichimonji hits.
  // The C6 condition contributes crit_dmg_charged:70 to the stats bag; the engine now
  // folds crit_dmg_<type> GENERICALLY (critBonusTypeKeys), so every charged hit picks it
  // up without a per-feature critDamageBonuses declaration. Absent at C0-C5 → 0.
  {
    name: "itto_kesagiri_combo_slash_dmg",
    category: "attack",
    damageType: "charged",
    multipliers: [
      { leveling: "char_skill_attack", values: talents.get("attack.itto_kesagiri_combo_slash_dmg") },
    ],
  },
  {
    name: "itto_kesagiri_final_slash_dmg",
    category: "attack",
    damageType: "charged",
    multipliers: [
      { leveling: "char_skill_attack", values: talents.get("attack.itto_kesagiri_final_slash_dmg") },
    ],
  },
  {
    name: "itto_saichimonji_slash_dmg",
    category: "attack",
    damageType: "charged",
    multipliers: [
      { leveling: "char_skill_attack", values: talents.get("attack.itto_saichimonji_slash_dmg") },
    ],
  },
  // --- Plunge attacks (her FeatureDamagePlunge: category="attack", damageType="plunge") ---
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
  // --- Skill: Akaushi Burst (geo) ---
  {
    name: "skill_dmg",
    category: "skill",
    element: "geo",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.skill_dmg") }],
  },
  // --- Skill static readout: skill.itto_hurls_ushi_hp = Ushi HP (talent% of Max HP) ---
  // FeaturePostEffectValue(PostEffectStatsHP, percent=talent×0.01), char_skill_elemental, format="".
  // raw/genshin_calc_pub/src/js/db/Char/Itto.js:254-265
  {
    name: "itto_hurls_ushi_hp",
    category: "skill",
    output: { kind: "static" },
    multipliers: [
      { scaling: "hp", leveling: "char_skill_elemental", values: talents.get("skill.itto_hurls_ushi_hp") },
    ],
  },
  // --- Burst static readout: burst.atk_bonus = Royal Descent DEF→ATK conversion value (talent% of DEF) ---
  // FeaturePostEffectValue(PostEffectStatsDef, percent=talent×0.01), char_skill_burst, format="".
  // The itto_royal_descent toggle gates the post-effect's APPLICATION; the readout shows the ungated value
  // (oracle nonzero at solo) → modelled without the condition. raw/.../Itto.js:130-142,266-270
  {
    name: "atk_bonus",
    category: "burst",
    output: { kind: "static" },
    multipliers: [
      { scaling: "def", leveling: "char_skill_burst", values: talents.get("burst.itto_atk_bonus") },
    ],
  },
];

// ---------------------------------------------------------------------------
// Constellation conditions (P2.C)
// ---------------------------------------------------------------------------
// C1 "Stay a While and Listen Up": ConditionStatic no real stats → SKIP.
// C2 "Gather 'Round, It's a Brawl!": ConditionStatic no real stats → SKIP.
// C4 "Jailhouse Bread and Butter": SELF ConditionBoolean (def_percent:20 + atk_percent:20),
//   gated C4. Now ported (the port had only party.itto_jailhouse_bread_and_butter → golden-blind
//   SKIP of the SELF). Note: DEF% matters here — Itto's charged hits scale on DEF (A4 multiplier).
//
// Source: raw/genshin_calc_pub/src/js/db/Char/Itto.js:334-394

const constellationConditions: readonly Condition[] = [
  // C4 "Jailhouse Bread and Butter": SELF toggle granting +20% DEF and +20% ATK, gated C4.
  // Raw cons[3]: ConditionBoolean{ name:'itto_jailhouse_bread_and_butter',
  //   stats:{ def_percent:20, atk_percent:20 } }. Modelled as a boolean toggle with a
  //   constellation-4 sub-gate (the party.* mirror lives in partyData below).
  {
    type: "boolean",
    name: "itto_jailhouse_bread_and_butter",
    stats: { def_percent: 20, atk_percent: 20 },
    condition: { type: "constellation", constellation: 4 },
  },
  // C3 "Horns Lowered, Coming Through": +3 levels to Masatsu Zetsugi: Akaushi Burst (Elemental Skill).
  // Raw cons[2]: Condition{ settings:{ char_skill_elemental_bonus: 3 } }.
  { type: "constellation", constellation: 3, settings: { char_skill_elemental_bonus: 3 } },
  // C5 "10 Years of Hanamizaka Fame": +3 levels to Royal Descent: Behold, Itto the Evil! (Elemental Burst).
  // Raw cons[4]: Condition{ settings:{ char_skill_burst_bonus: 3 } }.
  { type: "constellation", constellation: 5, settings: { char_skill_burst_bonus: 3 } },
  // C6 "Arataki Itto, Present!": ConditionStatic crit_dmg_charged:70 — ALWAYS-ON at C6
  // (no toggle — a plain ConditionStatic with a real stat). Provides +70% Crit DMG on
  // Arataki Kesagiri and Saichimonji Slash hits.
  // Raw cons[5]: ConditionStatic{ stats:{ crit_dmg_charged: 70 } }.
  { type: "constellation", constellation: 6, stats: { crit_dmg_charged: 70 } },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const aratakiItto: DbObjectChar = {
  name: "arataki_itto",
  gameId: 10000057,
  rarity: 5,
  element: "geo",
  weapon: "claymore",
  origin: "inazuma",
  statTable: IttoStatTable,
  talents,
  features,
  multipliers: [a4ChargedDefMultiplier],
  postEffects: [defToAtk],
  conditions: [royalDescent, ...constellationConditions],
  // C4 "Jailhouse Bread and Butter" — +20% DEF and +20% ATK to party.
  // Source: raw/genshin_calc_pub/src/js/db/Char/Itto.js:125-126,366-369,402-406
  partyData: {
    conditions: [
      {
        type: "static",
        stats: { def_percent: 20, atk_percent: 20 },
        condition: { type: "boolean", name: "party.itto_jailhouse_bread_and_butter" },
      },
    ],
  },
};
