/**
 * Xilonen — geo sword DEF scaler (Natlan, Nightsoul).
 *
 * In the fixed solo C0 build with `settings = {}`, the Nightsoul Blessing state
 * (`common.nightsoul_blessing_state`) is OFF. Her feature set is gated on that:
 *   - Normal/charged hits are gated by `ConditionNot(nightsoul)` → ACTIVE here,
 *     so they emit (ATK-scaled, physical/normal, no infusion at settings = {}).
 *   - The Source-Sample roller hits (`xilonen_roller_*`) are gated by
 *     `ConditionBoolean(nightsoul)` → INACTIVE → NOT emitted (and absent from the
 *     oracle fixture). They are NOT modelled.
 *
 * Plunge, skill (xilonen_rush_dmg), and burst (burst_dmg + xilonen_beat_dmg) are
 * DEF-scaled (`scaling: "def"`, her `scaling: 'def*'`). Skill/burst are geo.
 * `xilonen_beat_dmg` shares burst_dmg's table (s3.p5 == s3.p1).
 *
 * normal_hit_2 is a 2-hit multihit parent (sum of normal_hit_2_1 + normal_hit_2_2);
 * the two sub-hits are emitted as their own rows (her FeatureDamageNormal isChild,
 * dropped so each emits independently — both present in the fixture).
 *
 * Passives OFF at solo C0 (NOT folded):
 *   - A1 (`xilonen_netotiliztlis_echoes`): +30% dmg_normal/dmg_plunge gated by
 *     nightsoul + damage-mode boolean toggles → OFF. (Xilonen.js:451-464)
 *   - A4 (`xilonen_portable_armored_sheath`): +20% def_percent is a user boolean
 *     toggle (serializeId 3), OFF at baseline. (Xilonen.js:465-477)
 *   - Skill geo-RES shred: a ConditionLevels gated by sampler booleans → OFF.
 *
 * Skipped (display-only, empty damageType → not asserted by the golden harness):
 *   - burst.heal_dot, the C6 party heal (FeatureHeal, out of the TS feature model).
 *   - reaction.crystalize (geo shield/crystallize, damageType "").
 * Geo universals (reaction.electrocharged, reaction.shatter) are auto-emitted by
 * the engine from the element; they are not declared here.
 *
 * Constellations are NOT modelled (C0 build).
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Xilonen.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Xilonen)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Xilonen)
 */

import type { Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Xilonen as XilonenStatTable } from "../generated/charTables.js";
import { Xilonen as XilonenTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return XilonenTalents.s1.p1;
      // normal_hit_2 is two sub-hits (s1.p2, s1.p3)
      if (name === "normal_hit_2_1") return XilonenTalents.s1.p2;
      if (name === "normal_hit_2_2") return XilonenTalents.s1.p3;
      if (name === "normal_hit_3") return XilonenTalents.s1.p4;
      if (name === "charged_hit") return XilonenTalents.s1.p5;
      if (name === "plunge") return XilonenTalents.s1.p7;
      if (name === "plunge_low") return XilonenTalents.s1.p8;
      if (name === "plunge_high") return XilonenTalents.s1.p9;
    }
    if (talent === "skill") {
      if (name === "xilonen_rush_dmg") return XilonenTalents.s2.p1;
    }
    if (talent === "burst") {
      if (name === "burst_dmg") return XilonenTalents.s3.p1;
      if (name === "xilonen_beat_dmg") return XilonenTalents.s3.p5;
    }
    throw new Error(`xilonen talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (ATK-scaled, gated ON by ConditionNot(nightsoul)) ---
  // raw/genshin_calc_pub/src/js/db/Char/Xilonen.js:178-188
  {
    name: "normal_hit_1",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1") }],
  },
  // normal_hit_2: FeatureDamageMultihit (2-hit parent = sub_1 + sub_2)
  // raw/genshin_calc_pub/src/js/db/Char/Xilonen.js:189-215
  {
    name: "normal_hit_2",
    category: "attack",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2_1") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2_2") }] },
    ],
  },
  // normal_hit_2_1 / normal_hit_2_2: individual sub-hits (her isChild rows, dropped to emit)
  // raw/genshin_calc_pub/src/js/db/Char/Xilonen.js:216-239
  {
    name: "normal_hit_2_1",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2_1") }],
  },
  {
    name: "normal_hit_2_2",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2_2") }],
  },
  // raw/genshin_calc_pub/src/js/db/Char/Xilonen.js:240-250
  {
    name: "normal_hit_3",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }],
  },
  // --- Charged attack (ATK-scaled, gated ON by ConditionNot(nightsoul)) ---
  // raw/genshin_calc_pub/src/js/db/Char/Xilonen.js:291-301
  {
    name: "charged_hit",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }],
  },
  // --- Plunge attacks (DEF-scaled) ---
  // raw/genshin_calc_pub/src/js/db/Char/Xilonen.js:302-328
  {
    name: "plunge",
    category: "attack",
    damageType: "plunge",
    multipliers: [{ scaling: "def", leveling: "char_skill_attack", values: talents.get("attack.plunge") }],
  },
  {
    name: "plunge_low",
    category: "attack",
    damageType: "plunge",
    multipliers: [{ scaling: "def", leveling: "char_skill_attack", values: talents.get("attack.plunge_low") }],
  },
  {
    name: "plunge_high",
    category: "attack",
    damageType: "plunge",
    multipliers: [{ scaling: "def", leveling: "char_skill_attack", values: talents.get("attack.plunge_high") }],
  },
  // --- Skill: Yohual's Scratch (geo, DEF-scaled) ---
  // raw/genshin_calc_pub/src/js/db/Char/Xilonen.js:329-338
  {
    name: "xilonen_rush_dmg",
    category: "skill",
    element: "geo",
    multipliers: [{ scaling: "def", leveling: "char_skill_elemental", values: talents.get("skill.xilonen_rush_dmg") }],
  },
  // --- Burst: Ocelotlicue Point! (geo, DEF-scaled) ---
  // raw/genshin_calc_pub/src/js/db/Char/Xilonen.js:339-358
  {
    name: "burst_dmg",
    category: "burst",
    element: "geo",
    multipliers: [{ scaling: "def", leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") }],
  },
  {
    name: "xilonen_beat_dmg",
    category: "burst",
    element: "geo",
    multipliers: [{ scaling: "def", leveling: "char_skill_burst", values: talents.get("burst.xilonen_beat_dmg") }],
  },
];

// ---------------------------------------------------------------------------
// Constellations (P2.C Wave-1)
// ---------------------------------------------------------------------------
// C1: ConditionStatic, no real stats → SKIP.
// C2: Condition{stats:{dmg_all:50}} gated by ConditionAnd[2×ConditionBoolean] (toggles) → SKIP.
// C3 "Tonalpohuallis Loop" — +3 Elemental Skill talent levels.
//   raw/genshin_calc_pub/src/js/db/Char/Xilonen.js:417-424 (char-level conditions).
// C4: ConditionBoolean toggle (normal_base_def_percent/plunge_base_def_percent) → SKIP.
// C5 "Ocelotlicue Points (Improved)" — +3 Burst talent levels.
//   raw/genshin_calc_pub/src/js/db/Char/Xilonen.js:598-605 (constellation[4]).
// C6: ConditionStatic gated by ConditionBoolean(nightsoul_blessing_state) subCondition (OFF) → SKIP.

const constellationConditions: readonly Condition[] = [
  // C3 — char_skill_elemental_bonus +3 (skill talent level up).
  { type: "constellation", constellation: 3, settings: { char_skill_elemental_bonus: 3 } },
  // C5 — char_skill_burst_bonus +3 (burst talent level up).
  { type: "constellation", constellation: 5, settings: { char_skill_burst_bonus: 3 } },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const xilonen: DbObjectChar = {
  name: "xilonen",
  gameId: 10000103,
  rarity: 5,
  element: "geo",
  weapon: "sword",
  origin: "natlan",
  statTable: XilonenStatTable,
  talents,
  features,
  multipliers: [],
  conditions: constellationConditions,
};
