/**
 * Razor — electro claymore ATK scaler.
 *
 * 4-hit normal combo, spin/final charged, plunge, electro press/hold skill,
 * electro burst. Burst-state normals (FeatureMultiplierRazorBurst) are C0
 * conditioned — not in fixture damage keys, skipped. No post-effects at C0.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Razor.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Razor)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Razor)
 */

import type { DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Razor as RazorStatTable } from "../generated/charTables.js";
import { Razor as RazorTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return RazorTalents.s1.p1;
      if (name === "normal_hit_2") return RazorTalents.s1.p2;
      if (name === "normal_hit_3") return RazorTalents.s1.p3;
      if (name === "normal_hit_4") return RazorTalents.s1.p4;
      if (name === "charged_spin") return RazorTalents.s1.p5;
      if (name === "charged_final") return RazorTalents.s1.p6;
      if (name === "plunge") return RazorTalents.s1.p9;
      if (name === "plunge_low") return RazorTalents.s1.p10;
      if (name === "plunge_high") return RazorTalents.s1.p11;
    }
    if (talent === "skill") {
      if (name === "press_dmg") return RazorTalents.s2.p1;
      if (name === "hold_dmg") return RazorTalents.s2.p2;
    }
    if (talent === "burst") {
      if (name === "burst_dmg") return RazorTalents.s3.p1;
    }
    throw new Error(`razor talents: unknown path '${path}'`);
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
  // --- Skill: Claw and Thunder (electro) ---
  {
    name: "press_dmg",
    category: "skill",
    element: "electro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.press_dmg") }],
  },
  {
    name: "hold_dmg",
    category: "skill",
    element: "electro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.hold_dmg") }],
  },
  // --- Burst: Lightning Fang (electro) ---
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

export const razor: DbObjectChar = {
  name: "razor",
  gameId: 10000020,
  rarity: 4,
  element: "electro",
  weapon: "claymore",
  origin: "mondstadt",
  statTable: RazorStatTable,
  talents,
  features,
  multipliers: [],
};
