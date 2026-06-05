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

import type { Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
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
      if (name === "ningguang_jade_screen_hp") return NingguangTalents.s2.p3;
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
    tags: ["plunge_shockwave"],
    category: "attack",
    damageType: "plunge",
    element: "geo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_low") }],
  },
  {
    name: "plunge_high",
    tags: ["plunge_shockwave"],
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
  // --- Skill static readout: skill.ningguang_jade_screen_hp = Jade Screen HP (talent% of Max HP) ---
  // FeaturePostEffectValue(PostEffectStatsHP, percent=talent×0.01), char_skill_elemental, format="".
  // raw/genshin_calc_pub/src/js/db/Char/Ningguang.js:174-187
  {
    name: "ningguang_jade_screen_hp",
    category: "skill",
    output: { kind: "static" },
    multipliers: [
      { scaling: "hp", leveling: "char_skill_elemental", values: talents.get("skill.ningguang_jade_screen_hp") },
    ],
  },
];

// ---------------------------------------------------------------------------
// Constellation conditions (P2.C Wave-1)
// ---------------------------------------------------------------------------
// C1 "Piercing Fragments": ConditionStatic with no real stats (description only) → SKIP.
// C2 "Shock Effect": ConditionStatic with no real stats (description only) → SKIP.
// C3 "Majesty Be the Array of Stars": +3 Elemental Burst talent levels.
//    Raw cons[2]: Condition{ settings:{ char_skill_burst_bonus:3 } }
// C4 "Exquisite be the Jade, Outshining All Beneath": ConditionBoolean toggle
//    (all element RES) → SKIP.
// C5 "Invincible be the Jade Screen": +3 Elemental Skill talent levels.
//    Raw cons[4]: Condition{ settings:{ char_skill_elemental_bonus:3 } }
// C6 "Grandeur be the Seven Stars": ConditionStatic with no real stats → SKIP.
//
// Sources: raw/genshin_calc_pub/src/js/db/Char/Ningguang.js:220-282

const constellationConditions: readonly Condition[] = [
  // C3: +3 Elemental Burst (Starshatter).
  // Raw cons[2]: new Condition({ settings: { char_skill_burst_bonus: 3 } }).
  { type: "constellation", constellation: 3, settings: { char_skill_burst_bonus: 3 } },
  // C5: +3 Elemental Skill (Jade Screen).
  // Raw cons[4]: new Condition({ settings: { char_skill_elemental_bonus: 3 } }).
  { type: "constellation", constellation: 5, settings: { char_skill_elemental_bonus: 3 } },
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
  conditions: constellationConditions,
  // A4 "Strategic Reserve" — +12% Geo DMG to party.
  // C4 "Exquisite Be the Jade..." — +10% to all self-RES (res_* keys; damage-inert).
  // Source: raw/genshin_calc_pub/src/js/db/Char/Ningguang.js (partyData conditions)
  partyData: {
    conditions: [
      {
        type: "static",
        stats: { dmg_geo: 12 },
        condition: { type: "boolean", name: "party.ningguang_strategic_reserve" },
      },
      {
        type: "static",
        stats: {
          res_anemo: 10,
          res_pyro: 10,
          res_hydro: 10,
          res_cryo: 10,
          res_electro: 10,
          res_dendro: 10,
          res_geo: 10,
        },
        condition: {
          type: "boolean",
          name: "party.ningguang_exquisite_be_the_jade_outshining_all_beneath",
        },
      },
    ],
  },
};
