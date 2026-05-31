/**
 * Ningguang — geo catalyst ATK scaler.
 *
 * 1-hit normal (geo), charged hit (geo), star jade charged hit (geo),
 * plunge/low/high (geo), geo skill, geo burst (gem hits).
 *
 * A4 "Strategic Reserve": +12% Geo DMG on passing through Jade Screen — gated by
 * ConditionBoolean (requires a toggle), so it is OFF in the canonical solo build
 * and is NOT included here.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Ningguang.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Ningguang)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Ningguang)
 */

import type { DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Ningguang as NingguangStatTable } from "../generated/charTables.js";
import { Ningguang as NingguangTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit") return NingguangTalents.s1.p1;
      if (name === "charged_hit") return NingguangTalents.s1.p2;
      if (name === "ningguang_star_jade") return NingguangTalents.s1.p3;
      if (name === "plunge") return NingguangTalents.s1.p5;
      if (name === "plunge_low") return NingguangTalents.s1.p6;
      if (name === "plunge_high") return NingguangTalents.s1.p7;
    }
    if (talent === "skill") {
      if (name === "skill_dmg") return NingguangTalents.s2.p2;
    }
    if (talent === "burst") {
      if (name === "ningguang_gem_dmg") return NingguangTalents.s3.p1;
    }
    throw new Error(`ningguang talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attack (geo catalyst, single hit) ---
  {
    name: "normal_hit",
    category: "attack",
    element: "geo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit") }],
  },
  // --- Charged attacks (geo) ---
  {
    name: "charged_hit",
    category: "attack",
    damageType: "charged",
    element: "geo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }],
  },
  // Star Jade: passive gem fired alongside charged attack (geo, charged type)
  {
    name: "ningguang_star_jade",
    category: "attack",
    damageType: "charged",
    element: "geo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.ningguang_star_jade") }],
  },
  // --- Plunge attacks (geo catalyst) ---
  {
    name: "plunge",
    category: "attack",
    damageType: "plunge",
    element: "geo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge") }],
  },
  {
    name: "plunge_low",
    category: "attack",
    damageType: "plunge",
    element: "geo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_low") }],
  },
  {
    name: "plunge_high",
    category: "attack",
    damageType: "plunge",
    element: "geo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_high") }],
  },
  // --- Skill: Jade Screen (geo) ---
  {
    name: "skill_dmg",
    category: "skill",
    element: "geo",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.skill_dmg") }],
  },
  // --- Burst: Starshatter (geo) ---
  // Each gem hit uses the same table; multiple gems are fired but each counts as one feature entry.
  {
    name: "ningguang_gem_dmg",
    category: "burst",
    element: "geo",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.ningguang_gem_dmg") }],
  },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const ningguang: DbObjectChar = {
  name: "ningguang",
  gameId: 10000027,
  rarity: 4,
  element: "geo",
  weapon: "catalyst",
  origin: "liyue",
  statTable: NingguangStatTable,
  talents,
  features,
  multipliers: [],
};
