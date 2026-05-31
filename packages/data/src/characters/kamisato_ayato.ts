/**
 * Kamisato Ayato — hydro sword ATK scaler.
 *
 * The fixed solo-C0 build runs with skill-stance OFF (`ayato_takimeguri_kanka`
 * is a boolean condition, default false under settings:{}), so the oracle emits
 * the FIVE PHYSICAL normal hits + physical charged + physical plunges — NOT the
 * stance-gated hydro Shunsuiken hits. Verified against the fixture: every produced
 * damage feature matches to <0.5.
 *
 * Features in the fixture (all modelled here):
 *   normal_hit_1..5 — physical normals (FeatureDamageNormal, leveling char_skill_attack)
 *   charged_hit     — physical charged (FeatureDamageCharged, damageType "charged")
 *   plunge / plunge_low / plunge_high — physical plunge (collision + shockwave)
 *   ayato_water_illusion_dmg          — hydro skill (Water Illusion thorn)
 *   ayato_bloomwater_blade_dmg        — hydro burst
 *   reaction.{electrocharged,rupture,shatter} — auto-emitted from the hydro element
 *
 * SKIPPED (off / gated in the fixed solo-C0 build, so absent from the fixture):
 *   - ayato_shunsuiken_1..3 (hydro skill-state normals): condStance OFF.
 *   - Namisen HP→Shunsuiken multiplier (`scaling:'hp*'`, gated on ayato_namisen ≥ 1): OFF.
 *   - Bloomwater Blades normal-attack `dmg_normal` bonus (ConditionBooleanLevels): OFF.
 *   - All constellations (C1 dmg_normal_ayato, C2 HP, C4 atk-speed, C6 attack): C0 build.
 *   - A1 (Namisen stack gain) / A4 (energy regen): no unconditional damage stat.
 *   Ayato's ascension-secondary Hydro DMG bonus is NOT in charTables.Ayato (matching
 *   her generated table); the hydro skill/burst match the oracle without it, so no
 *   baseStats fold is needed.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Ayato.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Ayato)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Ayato)
 */

import type { Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Ayato as AyatoStatTable } from "../generated/charTables.js";
import { Ayato as AyatoTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return AyatoTalents.s1.p1;
      if (name === "normal_hit_2") return AyatoTalents.s1.p2;
      if (name === "normal_hit_3") return AyatoTalents.s1.p3;
      if (name === "normal_hit_4") return AyatoTalents.s1.p4;
      if (name === "normal_hit_5") return AyatoTalents.s1.p5;
      if (name === "charged_hit")  return AyatoTalents.s1.p6;
      if (name === "plunge")       return AyatoTalents.s1.p8;
      if (name === "plunge_low")   return AyatoTalents.s1.p9;
      if (name === "plunge_high")  return AyatoTalents.s1.p10;
    }
    if (talent === "skill") {
      if (name === "ayato_water_illusion_dmg") return AyatoTalents.s2.p6;
    }
    if (talent === "burst") {
      if (name === "ayato_bloomwater_blade_dmg") return AyatoTalents.s3.p1;
    }
    throw new Error(`kamisato_ayato talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (physical sword; condNotStance → emitted in solo build) ---
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
  // --- Charged attack (physical; FeatureDamageCharged) ---
  {
    name: "charged_hit",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }],
  },
  // --- Plunge attacks (physical) ---
  // raw: FeatureDamagePlungeCollision plunge
  {
    name: "plunge",
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge") }],
  },
  // raw: FeatureDamagePlungeShockWave plunge_low
  {
    name: "plunge_low",
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_low") }],
  },
  // raw: FeatureDamagePlungeShockWave plunge_high
  {
    name: "plunge_high",
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_high") }],
  },
  // --- Skill: Kamisato Art - Kyouka (Water Illusion thorn, hydro) ---
  // raw: FeatureDamageSkill (leveling char_skill_elemental, s2.p6)
  {
    name: "ayato_water_illusion_dmg",
    category: "skill",
    element: "hydro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.ayato_water_illusion_dmg") }],
  },
  // --- Burst: Kamisato Art - Suiyuu (Bloomwater Blade, hydro) ---
  // raw: FeatureDamageBurst (leveling char_skill_burst, s3.p1)
  {
    name: "ayato_bloomwater_blade_dmg",
    category: "burst",
    element: "hydro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.ayato_bloomwater_blade_dmg") }],
  },
];

// ---------------------------------------------------------------------------
// Constellations (P2.C Wave-1)
// ---------------------------------------------------------------------------
// C1 "Kyouka Fuushi" (ConditionBoolean dmg_normal_ayato toggle) → SKIP (off).
// C2 "World Source" (ConditionStatic + ConditionBooleanValue namisen≥3 sub) → SKIP (toggle sub).
// C3 "Famed Throughout the Land" → +3 Elemental Skill levels.
//   raw: Condition{ settings:{char_skill_elemental_bonus:3}, subConditions:[ConditionConstellation(3)] }
// C4 "Endless Flow" (ConditionBoolean atk_speed_normal toggle) → SKIP (off).
// C5 "Bansui Ichiro" → +3 Elemental Burst levels.
//   raw: Condition{ settings:{char_skill_burst_bonus:3}, subConditions:[ConditionConstellation(5)] }
// C6 "Boundless Origin" — adds new feature `ayato_boundless_origin_dmg` gated by
//   ConditionAnd(condStance, ConditionConstellation(6)). ConditionStatic text-only.
//   ⚠️ FLAG: C6 is a cons-ADDED feature (new damage entry). Not ported here;
//   requires Feature.condition support for cons-gated new features (P2.C cons-feature wave).
//
// Sources: raw/genshin_calc_pub/src/js/db/Char/Ayato.js:339-358, 446-458

const constellationConditions: readonly Condition[] = [
  // C3: +3 Elemental Skill (Kyouka) levels.
  { type: "constellation", constellation: 3, settings: { char_skill_elemental_bonus: 3 } },
  // C5: +3 Elemental Burst (Suiyuu) levels.
  { type: "constellation", constellation: 5, settings: { char_skill_burst_bonus: 3 } },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const kamisatoAyato: DbObjectChar = {
  name: "kamisato_ayato",
  gameId: 10000066,
  rarity: 5,
  element: "hydro",
  weapon: "sword",
  origin: "inazuma",
  statTable: AyatoStatTable,
  talents,
  features,
  multipliers: [],
  conditions: constellationConditions,
};
