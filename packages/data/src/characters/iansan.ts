/**
 * Iansan — P1.9 electro polearm (Natlan, Nightsoul support).
 *
 * Pure ATK scaler for damage purposes. Her A6-ascension stat is `atk_percent`
 * (24% at A6, in the generated statTable → folded by buildStats automatically),
 * so no passive ATK% needs to be declared here. Covers normal/charged/plunge
 * attacks (the second charged hit `iansan_charged_hit` and the skill/burst are
 * electro), plus the generic electro transformative reactions (overloaded,
 * superconduct, hyperbloom, electrocharged, shatter) auto-emitted by the loader.
 *
 * NOT modelled (faithful to the canonical solo C0 build + the golden harness):
 *   - A1 `iansan_enhanced_resistance_training` (+20% ATK): a ConditionBoolean
 *     toggle (raw Iansan.js:269-283) → OFF at baseline → not folded. The fixture
 *     `stats.atk` (2325.40) confirms only the A6 atk% (24) + the build's atk% (18)
 *     are applied, not the A1 20%.
 *   - `burst.iansan_bonus_max` / `burst.atk_bonus` — FeaturePostEffectValue ATK
 *     readouts (display-only: empty damageType, not a damage triple). The golden
 *     harness filters these (isDamageTripleEntry); the engine's loader does not
 *     emit value/post-effect features. Skipped.
 *   - `other.iansan_heal` — A4 heal magnitude (display-only). Skipped.
 *   - Constellations C0 build → skipped.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Iansan.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Iansan: atk% asc stat)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Iansan s1/s2/s3)
 */

import type { DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Iansan as IansanStatTable } from "../generated/charTables.js";
import { Iansan as IansanTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return IansanTalents.s1.p1;
      if (name === "normal_hit_2") return IansanTalents.s1.p2;
      if (name === "normal_hit_3") return IansanTalents.s1.p3;
      if (name === "charged_hit") return IansanTalents.s1.p4;
      if (name === "iansan_charged_hit") return IansanTalents.s1.p5;
      if (name === "plunge") return IansanTalents.s1.p7;
      if (name === "plunge_low") return IansanTalents.s1.p8;
      if (name === "plunge_high") return IansanTalents.s1.p9;
    }
    if (talent === "skill") {
      if (name === "skill_dmg") return IansanTalents.s2.p1;
    }
    if (talent === "burst") {
      if (name === "burst_dmg") return IansanTalents.s3.p1;
    }
    throw new Error(`iansan talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Features (standard damage; reactions auto-emitted by the loader)
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (physical via character innate) ---
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
  // --- Charged attacks ---
  // First charged hit is physical (FeatureDamageCharged, no element).
  {
    name: "charged_hit",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }],
  },
  // Second charged hit is electro (raw: FeatureDamageCharged element:'electro').
  {
    name: "iansan_charged_hit",
    category: "attack",
    damageType: "charged",
    element: "electro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.iansan_charged_hit") }],
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
  // --- Skill: Thunderbolt Rush (electro) ---
  {
    name: "skill_dmg",
    category: "skill",
    element: "electro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.skill_dmg") }],
  },
  // --- Burst: The Three Principles of Power (electro) ---
  {
    name: "burst_dmg",
    category: "burst",
    element: "electro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") }],
  },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const iansan: DbObjectChar = {
  name: "iansan",
  gameId: 10000110,
  rarity: 4,
  element: "electro",
  weapon: "polearm",
  origin: "natlan",
  statTable: IansanStatTable,
  talents,
  features,
  multipliers: [],
};
