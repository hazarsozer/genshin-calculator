/**
 * Faruzan — anemo bow ATK scaler.
 *
 * 4-hit normal combo (physical), physical aimed shot, anemo fully charged aimed
 * shot, plunge/low/high (physical), anemo skill (skill_dmg +
 * faruzan_pressurized_collapse_vortex_dmg), anemo burst (burst_dmg).
 *
 * A4 "Lost Wisdom of the Seven Caverns" adds ATK-based damage to anemo hits
 * when faruzan_wind_benefit (burst buff) is active — this is a conditional toggle
 * that is OFF at C0 baseline, not folded into multipliers here.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Faruzan.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Faruzan)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Faruzan)
 */

import type { DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Faruzan as FaruzanStatTable } from "../generated/charTables.js";
import { Faruzan as FaruzanTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1")  return FaruzanTalents.s1.p1;
      if (name === "normal_hit_2")  return FaruzanTalents.s1.p2;
      if (name === "normal_hit_3")  return FaruzanTalents.s1.p3;
      if (name === "normal_hit_4")  return FaruzanTalents.s1.p4;
      if (name === "aimed")         return FaruzanTalents.s1.p5;
      if (name === "charged_aimed") return FaruzanTalents.s1.p6;
      if (name === "plunge")        return FaruzanTalents.s1.p7;
      if (name === "plunge_low")    return FaruzanTalents.s1.p8;
      if (name === "plunge_high")   return FaruzanTalents.s1.p9;
    }
    if (talent === "skill") {
      if (name === "skill_dmg")                                    return FaruzanTalents.s2.p1;
      if (name === "faruzan_pressurized_collapse_vortex_dmg")      return FaruzanTalents.s2.p2;
    }
    if (talent === "burst") {
      if (name === "burst_dmg") return FaruzanTalents.s3.p1;
    }
    throw new Error(`faruzan talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (bow — physical) ---
  // raw/genshin_calc_pub/src/js/db/Char/Faruzan.js
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
  // --- Charged attacks (bow aimed shots) ---
  // aimed: physical uncharged aimed shot (FeatureDamageChargedAimed → damageType="charged")
  {
    name: "aimed",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.aimed") }],
  },
  // charged_aimed: fully charged anemo aimed shot
  {
    name: "charged_aimed",
    category: "attack",
    damageType: "charged",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_aimed") }],
  },
  // --- Plunge attacks (bow — physical) ---
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
  // --- Skill: Wind Realm of Nasamjnin (anemo) ---
  // skill_dmg: initial skill hit
  // raw/genshin_calc_pub/src/js/db/Char/Faruzan.js — FeatureDamageSkill skill_dmg
  {
    name: "skill_dmg",
    category: "skill",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.skill_dmg") }],
  },
  // faruzan_pressurized_collapse_vortex_dmg: Pressurized Collapse vortex hit
  // raw/genshin_calc_pub/src/js/db/Char/Faruzan.js — FeatureDamageSkill
  {
    name: "faruzan_pressurized_collapse_vortex_dmg",
    category: "skill",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.faruzan_pressurized_collapse_vortex_dmg") }],
  },
  // --- Burst: The Wind's Secret Ways (anemo) ---
  // raw/genshin_calc_pub/src/js/db/Char/Faruzan.js — FeatureDamageBurst burst_dmg
  {
    name: "burst_dmg",
    category: "burst",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") }],
  },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const faruzan: DbObjectChar = {
  name: "faruzan",
  gameId: 10000076,
  rarity: 4,
  element: "anemo",
  weapon: "bow",
  origin: "sumeru",
  statTable: FaruzanStatTable,
  talents,
  features,
  multipliers: [],
};
