/**
 * Mika — cryo polearm ATK scaler.
 *
 * 5-hit normal combo (physical polearm), n4 is a 2-hit multihit with child
 * normal_hit_4_1. Physical charged hit, plunge. Cryo skill (flowfrost arrow +
 * rimestar flare + rimestar shard). Burst is heals only (no burst damage).
 *
 * Heals (burst.heal, burst.mika_heal_dot) have no damageType; skipped by the
 * golden harness. No always-on passive stat bonuses at C0:
 *   A1 mika_suppressive_barrage is ConditionStacks (toggle) → off in fixed build.
 *   A4 mika_topographical_mapping is ConditionStatic text_only (description only).
 *
 * Note: talent table s1.p5 is the same multiplier as p4 (both model the
 * per-hit percent of the n4 2-hit; only p4 is referenced here).
 * normal_hit_5 uses s1.p6 (skips p5 in talent items list per raw).
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Mika.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Mika)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Mika)
 */

import type { Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Mika as MikaStatTable } from "../generated/charTables.js";
import { Mika as MikaTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return MikaTalents.s1.p1;
      if (name === "normal_hit_2") return MikaTalents.s1.p2;
      if (name === "normal_hit_3") return MikaTalents.s1.p3;
      if (name === "normal_hit_4") return MikaTalents.s1.p4;
      if (name === "normal_hit_5") return MikaTalents.s1.p6;
      if (name === "charged_hit") return MikaTalents.s1.p7;
      if (name === "plunge") return MikaTalents.s1.p9;
      if (name === "plunge_low") return MikaTalents.s1.p10;
      if (name === "plunge_high") return MikaTalents.s1.p11;
    }
    if (talent === "skill") {
      if (name === "mika_flowfrost_arrow_dmg") return MikaTalents.s2.p1;
      if (name === "mika_rimestar_flare_dmg") return MikaTalents.s2.p2;
      if (name === "mika_rimestar_shard_dmg") return MikaTalents.s2.p3;
    }
    throw new Error(`mika talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (physical polearm, no element override) ---
  // raw/genshin_calc_pub/src/js/db/Char/Mika.js:151-169
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
  // normal_hit_4: 2-hit multihit parent (items × 2 of p4).
  // raw/genshin_calc_pub/src/js/db/Char/Mika.js:178-195
  {
    name: "normal_hit_4",
    category: "attack",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4") }] },
    ],
  },
  // Child: individual hit of normal_hit_4.
  // raw/genshin_calc_pub/src/js/db/Char/Mika.js:196-206
  {
    name: "normal_hit_4_1",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4") }],
  },
  {
    name: "normal_hit_5",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_5") }],
  },
  // --- Charged attack (physical polearm) ---
  // raw/genshin_calc_pub/src/js/db/Char/Mika.js:215-224
  {
    name: "charged_hit",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }],
  },
  // --- Plunge attacks (physical) ---
  // raw/genshin_calc_pub/src/js/db/Char/Mika.js:225-251
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
  // --- Skill: Starfrost Swirl ---
  // mika_flowfrost_arrow_dmg: cryo flowfrost arrow hit (tap/hold).
  // raw/genshin_calc_pub/src/js/db/Char/Mika.js:251-260
  {
    name: "mika_flowfrost_arrow_dmg",
    category: "skill",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.mika_flowfrost_arrow_dmg") }],
  },
  // mika_rimestar_flare_dmg: cryo rimestar flare (AoE on arrow hit).
  // raw/genshin_calc_pub/src/js/db/Char/Mika.js:261-270
  {
    name: "mika_rimestar_flare_dmg",
    category: "skill",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.mika_rimestar_flare_dmg") }],
  },
  // mika_rimestar_shard_dmg: cryo shard hits from rimestar.
  // raw/genshin_calc_pub/src/js/db/Char/Mika.js:271-280
  {
    name: "mika_rimestar_shard_dmg",
    category: "skill",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.mika_rimestar_shard_dmg") }],
  },
];

// ---------------------------------------------------------------------------
// Constellations (P2.C Wave-1)
// ---------------------------------------------------------------------------
// C1 "Factor Confluence" (ConditionStatic description-only) → SKIP.
// C2 "Companion's Ingress" (ConditionStatic description-only) → SKIP.
// C3 "Reconnaissance Report" → +3 Elemental Burst (Skyfeather Song) levels.
//   raw: constellation[2]: Condition{ settings:{char_skill_burst_bonus:3} }
// C4 "Sunfrost Encomium" (ConditionStatic description-only) → SKIP.
// C5 "Signal Arrow": +3 Elemental Skill (Starfrost Swirl) levels.
//   raw: top-level conditions array (not in constellation array which is {}):
//   Condition{ settings:{char_skill_elemental_bonus:3}, subConditions:[ConditionConstellation(5)] }
//   The constellation array entry [4] is empty {}; the talent bump lives in the char's
//   conditions array as a sub-conditioned entry. Modelled identically here.
// C6 "Companion's Counsel" (ConditionBoolean crit_dmg_phys toggle) → SKIP (off).
//
// Sources: raw/genshin_calc_pub/src/js/db/Char/Mika.js:305-316, 373-425

const constellationConditions: readonly Condition[] = [
  // C3: +3 Elemental Burst (Skyfeather Song) levels.
  { type: "constellation", constellation: 3, settings: { char_skill_burst_bonus: 3 } },
  // C5: +3 Elemental Skill (Starfrost Swirl) levels.
  { type: "constellation", constellation: 5, settings: { char_skill_elemental_bonus: 3 } },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const mika: DbObjectChar = {
  name: "mika",
  gameId: 10000080,
  rarity: 4,
  element: "cryo",
  weapon: "polearm",
  origin: "mondstadt",
  statTable: MikaStatTable,
  talents,
  features,
  multipliers: [],
  conditions: constellationConditions,
};
