/**
 * Xiao — anemo polearm plunge DPS, ATK scaler.
 *
 * 6-hit normal combo: n1 and n4 are 2-hit multihits (parent = sum of the two
 * identical sub-hits; child rows normal_hit_1_1 / normal_hit_4_1 are a single
 * sub-hit each — raw flags them isChild, but the fixture asserts them as
 * standalone keys so we DROP isChild here to emit them). n2/n3/n5/n6 are single
 * hits. Physical charged hit, plunge / plunge_low / plunge_high. Anemo skill
 * (Lemniscatic Wind Cycling), single hit, carrying her `dmg_skill_xiao` bonus key
 * (A4 "Heaven Fall" is a stack condition, OFF in the fixed solo build → the key is
 * unset → reads 0).
 *
 * Element note: in the fixed golden build settings are empty, so her burst
 * infusion ("xiao_yaksha_mask", a ConditionBooleanLevels gated on char_skill_burst)
 * is OFF — normals/charged/plunge resolve PHYSICAL, and the burst dmg_normal/
 * dmg_charged/dmg_plunge bonuses are not applied. The fixture's physical normal
 * values confirm this. Only the skill carries its explicit anemo element.
 *
 * No always-on passive ATK/crit/DMG bonuses fold in: A1 "Tamer of Demons" and A4
 * "Heaven Fall" are both ConditionStacks (stack-gated, OFF solo). Xiao's ascension
 * crit-rate secondary is already folded into the generated stat table.
 *
 * Constellations are out of scope (C0 build).
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Xiao.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Xiao)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Xiao)
 */

import type { Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Xiao as XiaoStatTable } from "../generated/charTables.js";
import { Xiao as XiaoTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return XiaoTalents.s1.p1;
      if (name === "normal_hit_2") return XiaoTalents.s1.p3;
      if (name === "normal_hit_3") return XiaoTalents.s1.p4;
      if (name === "normal_hit_4") return XiaoTalents.s1.p5;
      if (name === "normal_hit_5") return XiaoTalents.s1.p7;
      if (name === "normal_hit_6") return XiaoTalents.s1.p8;
      if (name === "charged_hit") return XiaoTalents.s1.p9;
      if (name === "plunge") return XiaoTalents.s1.p11;
      if (name === "plunge_low") return XiaoTalents.s1.p12;
      if (name === "plunge_high") return XiaoTalents.s1.p13;
    }
    if (talent === "skill") {
      if (name === "skill_dmg") return XiaoTalents.s2.p1;
    }
    throw new Error(`xiao talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks ---
  // normal_hit_1: 2-hit multihit (same multiplier × 2). Parent = the 2-hit total.
  // raw: FeatureDamageMultihit({ items: [{ hits: 2, multipliers: [p1] }] })
  {
    name: "normal_hit_1",
    category: "attack",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1") }] },
    ],
  },
  // Child: one of the 2 hits of normal_hit_1 (half the parent total). raw flags
  // isChild; dropped here so the standalone fixture key emits.
  // raw/genshin_calc_pub/src/js/db/Char/Xiao.js:139-150
  {
    name: "normal_hit_1_1",
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
  // normal_hit_4: 2-hit multihit (same multiplier × 2). Parent = the 2-hit total.
  // raw: FeatureDamageMultihit({ items: [{ hits: 2, multipliers: [p5] }] })
  {
    name: "normal_hit_4",
    category: "attack",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4") }] },
    ],
  },
  // Child: one of the 2 hits of normal_hit_4 (half the parent total).
  // raw/genshin_calc_pub/src/js/db/Char/Xiao.js:178-189
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
  {
    name: "normal_hit_6",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_6") }],
  },
  // --- Charged attack (physical — no infusion in the fixed solo build) ---
  {
    name: "charged_hit",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }],
  },
  // --- Plunge attacks (physical in the fixed solo build) ---
  // `plunge` = FeatureDamagePlungeCollision (NOT a shockwave → no plunge_shockwave tag).
  // `plunge_low`/`plunge_high` = FeatureDamagePlungeShockWave → tags:["plunge_shockwave"]
  // (her ShockWave.js:8 constructor pushes it). The tag is the target of Xianyun's A4
  // teammate multiplier; inert without a tag-targeting multiplier in the roster.
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
    tags: ["plunge_shockwave"],
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_low") }],
  },
  {
    name: "plunge_high",
    category: "attack",
    damageType: "plunge",
    tags: ["plunge_shockwave"],
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_high") }],
  },
  // --- Skill: Lemniscatic Wind Cycling (anemo) ---
  // Carries her dmg_skill_xiao bonus key (A4 stack, OFF solo → reads 0).
  {
    name: "skill_dmg",
    category: "skill",
    element: "anemo",
    damageBonuses: ["dmg_skill_xiao"],
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.skill_dmg") }],
  },
];

// ---------------------------------------------------------------------------
// Constellations (P2.C Wave-1)
// ---------------------------------------------------------------------------
// Xiao's talent bumps live in the char-level conditions array in raw (using
// ConditionConstellation), not the constellation entry array (which has {} empty entries
// for C3/C5). All other constellation entries are toggles or ConditionStatic with no
// real stats.
//
// C1 "Destroyer of Worlds": ConditionStatic, no real stats — SKIP.
// C2 "Blossom of Kaleidos": ConditionBoolean toggle (recharge:25) — toggle, SKIP.
// C3 "Evil Conqueror's Transience": +3 skill talent (char_skill_elemental_bonus).
//   Source: raw/genshin_calc_pub/src/js/db/Char/Xiao.js conditions[0] (ConditionConstellation 3).
// C4 "Transcension: Extinction of Suffering": ConditionBoolean toggle (def_percent) — SKIP.
// C5 "Evil Conqueror's Grudge": +3 burst talent (char_skill_burst_bonus).
//   Source: raw/genshin_calc_pub/src/js/db/Char/Xiao.js conditions[1] (ConditionConstellation 5).
// C6 "Guardian Yaksha": ConditionStatic, no real stats — SKIP.
// Sources: raw/genshin_calc_pub/src/js/db/Char/Xiao.js:257-270 (char conditions),
//          raw/genshin_calc_pub/src/js/db/Char/Xiao.js:314-400 (constellation array).

// Yaksha Mask "xiao_burst_bonus" (burst.s3.p1): the per-burst-talent-level DMG% that the
// mask grants to Normal/Charged/Plunge. raw Xiao.js:88,279-283 (Talents.getAlias of
// burst.xiao_burst_bonus aliased to dmg_normal/dmg_charged/dmg_plunge). Indexed by burst
// talent level via the static-level (her ConditionBooleanLevels.getLevel adds char_skill_burst_bonus).
const YAKSHA_MASK_DMG: readonly number[] = [
  58.45, 61.95, 65.45, 70, 73.5, 77, 81.55, 86.1, 90.65, 95.2, 99.75, 104.3, 108.85, 113.4, 117.95,
];

const constellationConditions: readonly Condition[] = [
  // C3 — +3 Elemental Skill (Lemniscatic Wind Cycling).
  { type: "constellation", constellation: 3, settings: { char_skill_elemental_bonus: 3 } },
  // C5 — +3 Elemental Burst (Bane of All Evil).
  { type: "constellation", constellation: 5, settings: { char_skill_burst_bonus: 3 } },
  // Yaksha Mask (Bane of All Evil burst stance) — NOT a feature swap: while the mask is up
  // Xiao's SAME normals/charged/plunge gain (a) ANEMO infusion (attack_infusion:"anemo" → his
  // physical attacks resolve anemo) and (b) +DMG% to Normal/Charged/Plunge scaling with his OWN
  // burst talent level. The port had modelled only the OFF-stance physical attacks → golden-blind
  // SKIP (no fixture toggles xiao_yaksha_mask). raw Xiao.js:270-284 — a ConditionBooleanLevels with
  // settings{attack_infusion:'anemo'} + per-level stats getAlias(burst.xiao_burst_bonus → dmg_*).
  // Modelled as a boolean (publishing the infusion) + a static-level gated on it (the level-scaled
  // dmg bonus, all three keys share the one xiao_burst_bonus table). Base-inert when untoggled.
  { type: "boolean", name: "xiao_yaksha_mask", settings: { attack_infusion: "anemo" } },
  {
    type: "static-level",
    levelSetting: "char_skill_burst",
    levelStats: { dmg_normal: YAKSHA_MASK_DMG, dmg_charged: YAKSHA_MASK_DMG, dmg_plunge: YAKSHA_MASK_DMG },
    condition: { type: "boolean", name: "xiao_yaksha_mask" },
  },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const xiao: DbObjectChar = {
  name: "xiao",
  gameId: 10000026,
  rarity: 5,
  element: "anemo",
  weapon: "polearm",
  origin: "liyue",
  statTable: XiaoStatTable,
  talents,
  features,
  multipliers: [],
  conditions: constellationConditions,
};
