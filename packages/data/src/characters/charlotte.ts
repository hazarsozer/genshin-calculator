/**
 * Charlotte — cryo catalyst ATK scaler.
 *
 * 3-hit normal combo (all cryo), cryo charged hit, cryo plunge, cryo
 * spiritbreath thorn (from normals, also damageType=charged), cryo skill
 * (press / hold / snappy-silhouette mark / focused-impression mark), cryo burst
 * (burst_dmg + kamera_dmg). Heals (heal, charlotte_kamera_heal) have no
 * damageType and are skipped by the golden harness.
 *
 * A4 "Diversified Investigation" stat bonuses are conditional
 * (ConditionStaticLevel gated on party_origin_same / party_origin_different);
 * not active in the fixed solo C0 build — omitted.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Charlotte.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Charlotte)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Charlotte)
 */

import type { DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Charlotte as CharlotteStatTable } from "../generated/charTables.js";
import { Charlotte as CharlotteTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return CharlotteTalents.s1.p1;
      if (name === "normal_hit_2") return CharlotteTalents.s1.p2;
      if (name === "normal_hit_3") return CharlotteTalents.s1.p3;
      if (name === "charged_hit") return CharlotteTalents.s1.p4;
      if (name === "plunge") return CharlotteTalents.s1.p6;
      if (name === "plunge_low") return CharlotteTalents.s1.p7;
      if (name === "plunge_high") return CharlotteTalents.s1.p8;
      if (name === "spiritbreath_thorn_dmg") return CharlotteTalents.s1.p9;
    }
    if (talent === "skill") {
      if (name === "charlotte_photo_press_dmg") return CharlotteTalents.s2.p1;
      if (name === "charlotte_photo_hold_dmg") return CharlotteTalents.s2.p2;
      if (name === "charlotte_snappy_silhouette_mark_dmg") return CharlotteTalents.s2.p3;
      if (name === "charlotte_focused_impression_mark_dmg") return CharlotteTalents.s2.p6;
    }
    if (talent === "burst") {
      if (name === "burst_dmg") return CharlotteTalents.s3.p3;
      if (name === "charlotte_kamera_dmg") return CharlotteTalents.s3.p6;
    }
    throw new Error(`charlotte talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (cryo catalyst, always cryo) ---
  // raw/genshin_calc_pub/src/js/db/Char/Charlotte.js:172-181
  {
    name: "normal_hit_1",
    category: "attack",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1") }],
  },
  {
    name: "normal_hit_2",
    category: "attack",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2") }],
  },
  {
    name: "normal_hit_3",
    category: "attack",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }],
  },
  // --- Charged attack ---
  // raw/genshin_calc_pub/src/js/db/Char/Charlotte.js:202-211
  {
    name: "charged_hit",
    category: "attack",
    damageType: "charged",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }],
  },
  // --- Plunge attacks ---
  // raw/genshin_calc_pub/src/js/db/Char/Charlotte.js:212-241
  {
    name: "plunge",
    category: "attack",
    damageType: "plunge",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge") }],
  },
  {
    name: "plunge_low",
    category: "attack",
    damageType: "plunge",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_low") }],
  },
  {
    name: "plunge_high",
    category: "attack",
    damageType: "plunge",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_high") }],
  },
  // --- Spiritbreath Thorn (FeatureDamageCharged, cryo, cannotReact) ---
  // Shoots out on charged attack; uses attack talent p9.
  // raw/genshin_calc_pub/src/js/db/Char/Charlotte.js:242-252
  {
    name: "spiritbreath_thorn_dmg",
    category: "attack",
    damageType: "charged",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.spiritbreath_thorn_dmg") }],
  },
  // --- Skill: Freezing Point Composition ---
  // raw/genshin_calc_pub/src/js/db/Char/Charlotte.js:253-292
  {
    name: "charlotte_photo_press_dmg",
    category: "skill",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.charlotte_photo_press_dmg") }],
  },
  {
    name: "charlotte_photo_hold_dmg",
    category: "skill",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.charlotte_photo_hold_dmg") }],
  },
  {
    name: "charlotte_snappy_silhouette_mark_dmg",
    category: "skill",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.charlotte_snappy_silhouette_mark_dmg") }],
  },
  {
    name: "charlotte_focused_impression_mark_dmg",
    category: "skill",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.charlotte_focused_impression_mark_dmg") }],
  },
  // --- Burst: Comprehensive Confirmation ---
  // burst_dmg: cryo burst hit. raw/genshin_calc_pub/src/js/db/Char/Charlotte.js:303-318
  {
    name: "burst_dmg",
    category: "burst",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") }],
  },
  // charlotte_kamera_dmg: periodic kamera hits during burst.
  // raw/genshin_calc_pub/src/js/db/Char/Charlotte.js:329-344
  {
    name: "charlotte_kamera_dmg",
    category: "burst",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.charlotte_kamera_dmg") }],
  },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const charlotte: DbObjectChar = {
  name: "charlotte",
  gameId: 10000088,
  rarity: 4,
  element: "cryo",
  weapon: "catalyst",
  origin: "fontaine",
  statTable: CharlotteStatTable,
  talents,
  features,
  multipliers: [],
};
