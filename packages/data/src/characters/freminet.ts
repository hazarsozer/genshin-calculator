/**
 * Freminet — cryo claymore ATK scaler.
 *
 * 4-hit normal combo, spin/final charged, plunge/low/high, cryo skill
 * (Pressurized Floe: upward thrust + frost + Pressurized Floe stages 0-4 with
 * per-stage cryo/phys hits + spiritbreath thorn), cryo burst.
 *
 * SKILL ELEMENT NOTES (from raw):
 *   - upward_thrust, frost, pressure_0, pressure_{1,2,3}_cryo: cryo.
 *   - pressure_{1,2,3}_phys and pressure_4: physical (no element override).
 *   - spiritbreath_thorn: cryo (cannotReact — irrelevant on the non-reacted path).
 *
 * PRESSURE-STAGE BONUSES — BOTH OMITTED (verified against the oracle):
 *   In raw, pressure_0..pressure_4 carry `damageBonuses: ['dmg_skill_freminet']`
 *   (A4 "Parallel Condensers", +40% skill DMG) and `critRateBonuses:
 *   ['crit_rate_freminet']` (C1, +15% crit rate). NEITHER is active in the fixed
 *   fixture build:
 *     - A4 `freminet_parallel_condensers` is a ConditionBoolean (a manual TOGGLE),
 *       NOT a ConditionStatic — so it is OFF by default even at A6. (Contrast
 *       Amber's A1 crit, which IS a ConditionStatic and so folds in.) Modelling the
 *       +40% over-shot every pressure hit (cryo ×1.303, phys via the cryo mult).
 *     - C1 `crit_rate_freminet` is a C0-excluded constellation.
 *   Both are therefore left off entirely; the pressure hits are plain skill hits.
 *
 * FROST DMG: raw gives frost a conditional ×2 multiplier gated by the burst stance
 * (`freminet_stalking_mode`, a ConditionBoolean). That stance is OFF in the fixed
 * fixture build, so frost is the plain base cryo skill hit (talent s2.p3).
 *
 * Feature-name vs talent-table mapping is deliberate: the cryo pressure hits are
 * NAMED `..._cryo_dmg` (→ fixture key) but read the raw `..._dmg` talent table
 * (p5/p7/p9); the phys hits read p6/p8/p10.
 *
 * Reactions (electrocharged / shatter / superconduct) are emitted generically by
 * the loader from element:'cryo'. The fixture's `weapon.bell_shield` is a weapon
 * (The Bell) feature, not a character feature — out of scope here.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Freminet.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Freminet)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Freminet)
 */

import type { Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Freminet as FreminetStatTable } from "../generated/charTables.js";
import { Freminet as FreminetTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return FreminetTalents.s1.p1;
      if (name === "normal_hit_2") return FreminetTalents.s1.p2;
      if (name === "normal_hit_3") return FreminetTalents.s1.p3;
      if (name === "normal_hit_4") return FreminetTalents.s1.p4;
      if (name === "charged_spin") return FreminetTalents.s1.p5;
      if (name === "charged_final") return FreminetTalents.s1.p6;
      if (name === "plunge") return FreminetTalents.s1.p9;
      if (name === "plunge_low") return FreminetTalents.s1.p10;
      if (name === "plunge_high") return FreminetTalents.s1.p11;
    }
    if (talent === "skill") {
      if (name === "freminet_upward_thrust_dmg") return FreminetTalents.s2.p1;
      if (name === "freminet_frost_dmg") return FreminetTalents.s2.p3;
      if (name === "freminet_pressure_0_dmg") return FreminetTalents.s2.p4;
      if (name === "freminet_pressure_1_cryo_dmg") return FreminetTalents.s2.p5;
      if (name === "freminet_pressure_1_phys_dmg") return FreminetTalents.s2.p6;
      if (name === "freminet_pressure_2_cryo_dmg") return FreminetTalents.s2.p7;
      if (name === "freminet_pressure_2_phys_dmg") return FreminetTalents.s2.p8;
      if (name === "freminet_pressure_3_cryo_dmg") return FreminetTalents.s2.p9;
      if (name === "freminet_pressure_3_phys_dmg") return FreminetTalents.s2.p10;
      if (name === "freminet_pressure_4_dmg") return FreminetTalents.s2.p11;
      if (name === "spiritbreath_thorn_dmg") return FreminetTalents.s2.p2;
    }
    if (talent === "burst") {
      if (name === "burst_dmg") return FreminetTalents.s3.p1;
    }
    throw new Error(`freminet talents: unknown path '${path}'`);
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
  // --- Skill: Pressurized Floe (cryo) ---
  {
    name: "freminet_upward_thrust_dmg",
    category: "skill",
    element: "cryo",
    multipliers: [
      { leveling: "char_skill_elemental", values: talents.get("skill.freminet_upward_thrust_dmg") },
    ],
  },
  // Frost: stalking-mode ×2 is OFF in this build → plain base cryo hit.
  {
    name: "freminet_frost_dmg",
    category: "skill",
    element: "cryo",
    multipliers: [
      { leveling: "char_skill_elemental", values: talents.get("skill.freminet_frost_dmg") },
    ],
  },
  // Pressurized Floe stages. Cryo hits carry element:'cryo'; phys hits carry
  // element:'physical' — her FeatureDamage defaults element to 'phys' (Damage.js:26
  // `params.element || 'phys'`) when none is given, so the raw phys hits (no element
  // override) are physical, NOT the char's cryo. Set explicitly here since this
  // port defaults an element-less skill to the char element instead.
  {
    name: "freminet_pressure_0_dmg",
    category: "skill",
    element: "cryo",
    multipliers: [
      { leveling: "char_skill_elemental", values: talents.get("skill.freminet_pressure_0_dmg") },
    ],
  },
  {
    name: "freminet_pressure_1_cryo_dmg",
    category: "skill",
    element: "cryo",
    multipliers: [
      { leveling: "char_skill_elemental", values: talents.get("skill.freminet_pressure_1_cryo_dmg") },
    ],
  },
  {
    name: "freminet_pressure_1_phys_dmg",
    category: "skill",
    element: "physical",
    multipliers: [
      { leveling: "char_skill_elemental", values: talents.get("skill.freminet_pressure_1_phys_dmg") },
    ],
  },
  {
    name: "freminet_pressure_2_cryo_dmg",
    category: "skill",
    element: "cryo",
    multipliers: [
      { leveling: "char_skill_elemental", values: talents.get("skill.freminet_pressure_2_cryo_dmg") },
    ],
  },
  {
    name: "freminet_pressure_2_phys_dmg",
    category: "skill",
    element: "physical",
    multipliers: [
      { leveling: "char_skill_elemental", values: talents.get("skill.freminet_pressure_2_phys_dmg") },
    ],
  },
  {
    name: "freminet_pressure_3_cryo_dmg",
    category: "skill",
    element: "cryo",
    multipliers: [
      { leveling: "char_skill_elemental", values: talents.get("skill.freminet_pressure_3_cryo_dmg") },
    ],
  },
  {
    name: "freminet_pressure_3_phys_dmg",
    category: "skill",
    element: "physical",
    multipliers: [
      { leveling: "char_skill_elemental", values: talents.get("skill.freminet_pressure_3_phys_dmg") },
    ],
  },
  // pressure_4: no element override in raw → physical (her 'phys' default).
  {
    name: "freminet_pressure_4_dmg",
    category: "skill",
    element: "physical",
    multipliers: [
      { leveling: "char_skill_elemental", values: talents.get("skill.freminet_pressure_4_dmg") },
    ],
  },
  // Spiritbreath thorn (cryo). cannotReact only affects the reacted path.
  {
    name: "spiritbreath_thorn_dmg",
    category: "skill",
    element: "cryo",
    multipliers: [
      { leveling: "char_skill_elemental", values: talents.get("skill.spiritbreath_thorn_dmg") },
    ],
  },
  // --- Burst: Shadowhunter's Ambush (cryo) ---
  {
    name: "burst_dmg",
    category: "burst",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") }],
  },
];

// ---------------------------------------------------------------------------
// Constellations (P2.C)
// ---------------------------------------------------------------------------
// C1 "Dreams of the Foamy Deep": crit_rate_freminet +15. ConditionStatic (always-on
//   at C1). crit_rate_freminet is a critRateBonuses key used by pressure-stage features.
// C2 "Penguins and the Land of Plenty": ConditionStatic with no real stats → SKIP (inert).
// C3 "Song of the Eddies": +3 Normal Attack talent levels.
//    Raw cons[2]: Condition{ settings:{ char_skill_attack_bonus:3 } }
// C4 "Dance of the Snowy Moon and Flute": ConditionStacks toggle (atk_percent) → SKIP.
// C5 "Nights of Nightmares": +3 Elemental Skill talent levels.
//    Raw cons[4]: Condition{ settings:{ char_skill_elemental_bonus:3 } }
// C6 "Moment of Waking and Resolve": ConditionStacks toggle (crit_dmg per stack) → SKIP.
//
// Sources: raw/genshin_calc_pub/src/js/db/Char/Freminet.js:423-490

const constellationConditions: readonly Condition[] = [
  // C1: crit_rate_freminet +15. ConditionStatic{ stats:{ crit_rate_freminet:15 } }
  // This is a char-specific critRateBonuses key applied to Pressurized Floe features.
  // Raw cons[0]: ConditionStatic{ stats:{ crit_rate_freminet: TalentValues.C1CritRateSkill=15 } }
  { type: "constellation", constellation: 1, stats: { crit_rate_freminet: 15 } },
  // C3: +3 Normal Attack talent levels.
  // Raw cons[2]: Condition{ settings:{ char_skill_attack_bonus:3 } }
  { type: "constellation", constellation: 3, settings: { char_skill_attack_bonus: 3 } },
  // C5: +3 Elemental Skill talent levels.
  // Raw cons[4]: Condition{ settings:{ char_skill_elemental_bonus:3 } }
  { type: "constellation", constellation: 5, settings: { char_skill_elemental_bonus: 3 } },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const freminet: DbObjectChar = {
  name: "freminet",
  gameId: 10000085,
  rarity: 4,
  element: "cryo",
  weapon: "claymore",
  origin: "fontaine",
  statTable: FreminetStatTable,
  talents,
  features,
  multipliers: [],
  conditions: constellationConditions,
};
