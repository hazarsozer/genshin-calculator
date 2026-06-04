/**
 * Chongyun — cryo claymore ATK scaler.
 *
 * Standard 4-hit normal combo, charged spin/final, plunge, cryo skill,
 * cryo burst (3 swords). No post-effects at C0.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Chongyun.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Chongyun)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Chongyun)
 */

import type { Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Chongyun as ChongyunStatTable } from "../generated/charTables.js";
import { Chongyun as ChongyunTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return ChongyunTalents.s1.p1;
      if (name === "normal_hit_2") return ChongyunTalents.s1.p2;
      if (name === "normal_hit_3") return ChongyunTalents.s1.p3;
      if (name === "normal_hit_4") return ChongyunTalents.s1.p4;
      if (name === "charged_spin") return ChongyunTalents.s1.p5;
      if (name === "charged_final") return ChongyunTalents.s1.p6;
      if (name === "plunge") return ChongyunTalents.s1.p9;
      if (name === "plunge_low") return ChongyunTalents.s1.p10;
      if (name === "plunge_high") return ChongyunTalents.s1.p11;
    }
    if (talent === "skill") {
      if (name === "skill_dmg") return ChongyunTalents.s2.p1;
    }
    if (talent === "burst") {
      if (name === "burst_dmg") return ChongyunTalents.s3.p1;
    }
    throw new Error(`chongyun talents: unknown path '${path}'`);
  },
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
  // --- Charged attacks ---
  {
    name: "charged_spin",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_spin") }],
  },
  {
    name: "charged_final",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_final") }],
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
  // --- C1 "Ice Unleashed": cons-added cryo ATK hit at 50% ATK.
  // Raw is base FeatureDamage (NOT FeatureDamageNormal) with category:'attack' →
  // damageType:"" suppresses dmg_normal; gets dmg_all+dmg_cryo only.
  // Fixed ValueTable([50]); source:'constellation1'. Raw Chongyun.js:165-176.
  {
    name: "chongyun_ice_unleashed",
    category: "attack",
    element: "cryo",
    damageType: "",
    condition: { type: "constellation", constellation: 1 },
    multipliers: [
      { leveling: "char_skill_attack", values: { getValue: (_level: number) => 50 }, source: "constellation1" },
    ],
  },
  // --- Skill: Chonghua's Layered Frost (cryo) ---
  {
    name: "skill_dmg",
    category: "skill",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.skill_dmg") }],
  },
  // --- Burst: Cloud-Parting Star (cryo) ---
  {
    name: "burst_dmg",
    category: "burst",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") }],
  },
];

// ---------------------------------------------------------------------------
// Constellation conditions (P2.C)
// ---------------------------------------------------------------------------
// C1 "Ice Unleashed": cons-added feature chongyun_ice_unleashed above.
//   ConditionStatic in cons array (display-only text_percent_dmg:50) → SKIP.
// C2 "Atmospheric Revolution": ConditionStatic (display) + Condition(recovery)
//   behind ConditionBoolean(chongyun_frost_field) toggle → SKIP (toggle-gated).
// C3: +3 levels to Cloud-Parting Star (burst). Raw cons[2] settings char_skill_burst_bonus:3.
// C4 "Frozen Skies": ConditionStatic display-only → SKIP.
// C5: +3 levels to Chonghua's Layered Frost (skill). Raw cons[4] settings char_skill_elemental_bonus:3.
// C6 "Rally of Four Blades": ConditionBoolean toggle (dmg_burst_chongyun:15) → SKIP.
// Raw: db/Char/Chongyun.js constellation array (Chongyun.js:309-379).
const constellationConditions: readonly Condition[] = [
  // C3: +3 levels to Cloud-Parting Star (burst). Raw Chongyun.js:340-346.
  { type: "constellation", constellation: 3, settings: { char_skill_burst_bonus: 3 } },
  // C5: +3 levels to Chonghua's Layered Frost (skill). Raw Chongyun.js:356-362.
  { type: "constellation", constellation: 5, settings: { char_skill_elemental_bonus: 3 } },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const chongyun: DbObjectChar = {
  name: "chongyun",
  gameId: 10000036,
  rarity: 4,
  element: "cryo",
  weapon: "claymore",
  origin: "liyue",
  statTable: ChongyunStatTable,
  talents,
  features,
  multipliers: [],
  conditions: constellationConditions,
  // A4 "Rimechaser Blade" — enemy Cryo RES -10% (the only damage-affecting partyData stat).
  // Intentionally omitted (no oracle rep; all damage-inert in the canonical v5.8 build):
  //   - C2 "Atmospheric Revolution": recovery/text_percent_cd (display-only).
  //   - Frost Field: atk_speed_normal (display-only).
  // Out of current scope — teammate cryo INFUSION via condition `.settings` (tracked follow-up,
  //   see spec §6): allowed_infusion_cryo (weapon-type gated) + attack_infusion_cryo (layered_frost).
  // Source: raw/genshin_calc_pub/src/js/db/Char/Chongyun.js (partyData conditions)
  partyData: {
    conditions: [
      {
        type: "static",
        stats: { enemy_res_cryo: -10 },
        condition: { type: "boolean", name: "party.chongyun_rimechaser_blade" },
      },
    ],
  },
};
