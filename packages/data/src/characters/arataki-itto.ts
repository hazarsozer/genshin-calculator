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
  // --- Skill: Akaushi Burst (geo) ---
  {
    name: "skill_dmg",
    category: "skill",
    element: "geo",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.skill_dmg") }],
  },
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
  conditions: [royalDescent],
};
