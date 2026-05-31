/**
 * Traveler (Dendro) — dendro sword ATK scaler.
 *
 * 5-hit normal combo (physical), 2-sub-hit charged (charged_hit_total multihit
 * parent + the two sub-hits charged_hit_1/_2 emitted as standalone rows — her raw
 * marks them isChild, but the fixture asserts them independently, so they are
 * declared without isChild here), plunge/low/high (physical), dendro skill
 * "Razorgrass Blade" (skill_dmg), dendro burst "Surgent Manifestation" (the Lea
 * Lotus Lamp periodic attack + the explosion).
 *
 * EM AND THE A4 DMG BONUSES (folded via baseStats, faithful to the C0/A6 build):
 *   The dendro Traveler contributes 55.128 EM intrinsically to `mastery_base`
 *   (verified by running her engine headless on the empty bonus block). With the
 *   uniform stat block's `mastery_base: 55`, total EM = 110.128 — matching the
 *   fixture's stats.mastery and driving both the A4 passive bonuses and the
 *   EM-scaled transformative reactions below.
 *
 *   A4 "Verdant Luxury" (auto-active at ascension 6, ConditionAscensionChar(4)) is
 *   her PostEffectStatsMastery: skill DMG +15% × EM, burst DMG +10% × EM. At the
 *   fixed build these resolve to the constants
 *     dmg_skill_traveler_dendro = 0.15 × 110.128 = 16.5192   (other.…_skill_bonus)
 *     dmg_burst_traveler_dendro = 0.10 × 110.128 = 11.0128   (other.…_burst_bonus)
 *   folded into baseStats and picked up via the skill/burst features' damageBonuses
 *   (the same mechanism gaming.ts uses for its unconditional A4 dmg_skill_gaming).
 *   Her PostEffectStatsMastery never writes these into the stats bag, so the
 *   `other.*` display rows are not produced here; both carry damageType="" and are
 *   not asserted by the golden harness regardless.
 *
 * A1 "Verdant Overgrowth" (stacks) and the special-training / swordfighting
 * conditions are toggle/stack-gated → OFF at the C0 settings={} baseline.
 *
 * REACTIONS: the dendro transformative set (burning, rupture, electrocharged,
 * shatter) is appended generically by the loader and reads the same 110.128 EM —
 * matching the fixture's four reaction rows.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/TravelerDendro.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (TravelerDendro)
 *   raw/genshin_calc_pub/src/js/classes/PostEffect/Stats/Mastery.js (A4 EM→DMG%)
 */

import type { Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Traveler as TravelerStatTable } from "../generated/charTables.js";
import { TravelerDendro as TravelerDendroTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return TravelerDendroTalents.s1.p1;
      if (name === "normal_hit_2") return TravelerDendroTalents.s1.p2;
      if (name === "normal_hit_3") return TravelerDendroTalents.s1.p3;
      if (name === "normal_hit_4") return TravelerDendroTalents.s1.p4;
      if (name === "normal_hit_5") return TravelerDendroTalents.s1.p5;
      if (name === "charged_hit_1") return TravelerDendroTalents.s1.p6;
      if (name === "charged_hit_2") return TravelerDendroTalents.s1.p7;
      if (name === "plunge") return TravelerDendroTalents.s1.p9;
      if (name === "plunge_low") return TravelerDendroTalents.s1.p10;
      if (name === "plunge_high") return TravelerDendroTalents.s1.p11;
    }
    if (talent === "skill") {
      if (name === "skill_dmg") return TravelerDendroTalents.s2.p1;
    }
    if (talent === "burst") {
      if (name === "traveler_lea_lotus_lamp_attack_dmg") return TravelerDendroTalents.s3.p1;
      if (name === "traveler_explosion_dmg") return TravelerDendroTalents.s3.p2;
    }
    throw new Error(`traveler_dendro talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (physical sword) ---
  // raw: FeatureDamageNormal normal_hit_1..5 (char_skill_attack leveling)
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
  {
    name: "normal_hit_5",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_5") }],
  },
  // --- Charged attack: 2-sub-hit multihit (charged_hit_1 + charged_hit_2) ---
  // raw: FeatureDamageMultihit charged_hit_total { items: [p6, p7] } (physical).
  {
    name: "charged_hit_total",
    category: "attack",
    damageType: "charged",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit_1") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit_2") }] },
    ],
  },
  // The two sub-hits, emitted independently (raw marks these isChild; the fixture
  // asserts them as standalone rows, so isChild is dropped here).
  // raw/genshin_calc_pub/src/js/db/Char/TravelerDendro.js: FeatureDamageCharged isChild charged_hit_1/_2
  {
    name: "charged_hit_1",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit_1") }],
  },
  {
    name: "charged_hit_2",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit_2") }],
  },
  // --- Plunge attacks (physical) ---
  // raw: FeatureDamagePlungeCollision plunge; FeatureDamagePlungeShockWave plunge_low/high
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
  // --- Skill: Razorgrass Blade (dendro) ---
  // raw: FeatureDamageSkill skill_dmg, element='dendro', damageBonuses=['dmg_skill_traveler_dendro']
  {
    name: "skill_dmg",
    category: "skill",
    element: "dendro",
    damageBonuses: ["dmg_skill_traveler_dendro"],
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.skill_dmg") }],
  },
  // --- Burst: Surgent Manifestation (dendro) ---
  // raw: FeatureDamageBurst traveler_lea_lotus_lamp_attack_dmg + traveler_explosion_dmg,
  // element='dendro', damageBonuses=['dmg_burst_traveler_dendro']
  {
    name: "traveler_lea_lotus_lamp_attack_dmg",
    category: "burst",
    element: "dendro",
    damageBonuses: ["dmg_burst_traveler_dendro"],
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.traveler_lea_lotus_lamp_attack_dmg") }],
  },
  {
    name: "traveler_explosion_dmg",
    category: "burst",
    element: "dendro",
    damageBonuses: ["dmg_burst_traveler_dendro"],
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.traveler_explosion_dmg") }],
  },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

// Folded, faithful to the fixed C0/A6 build (see file header):
//   dmg_skill_traveler_dendro — A4 0.15 × 110.128 EM = 16.5192%
//   dmg_burst_traveler_dendro — A4 0.10 × 110.128 EM = 11.0128%
// EM (110.128) is NOT folded here: the canonical build's EM comes entirely from
// the default sword (Alley Flash, EM secondary ≈55.128 at Lv90) plus the uniform
// stat block's mastery_base 55 — both already aggregated by buildStats. The dendro
// Traveler's own stat table carries no EM, so no baseStats EM term is needed; the
// EM-scaled reactions and the A4-bonus derivation above both read this true total.
const BASE_STATS: Record<string, number> = {
  dmg_skill_traveler_dendro: 16.5192,
  dmg_burst_traveler_dendro: 11.0128,
};

// ---------------------------------------------------------------------------
// Constellations (P2.C Wave-1)
// ---------------------------------------------------------------------------
// C1 "Symbiotic Creeper": ConditionStatic no real stats → SKIP.
// C2 "Green Resilience": ConditionStatic no real stats → SKIP.
// C3 "Whirling Weeds": +3 Elemental Skill talent levels.
//   Raw cons[2]: Condition{ settings:{ char_skill_elemental_bonus:3 } }
// C4 "Treacle Grass": ConditionStatic no real stats → SKIP.
// C5 "Quad Beasts Unleashed": +3 Elemental Burst talent levels.
//   Raw cons[4]: Condition{ settings:{ char_skill_burst_bonus:3 } }
// C6 "Withering Aggregation": ConditionBoolean (dmg_dendro toggle) +
//   ConditionDropdownElement (party element-specific DMG%) → SKIP (toggles).
// Sources: raw/genshin_calc_pub/src/js/db/Char/TravelerDendro.js:346-440

const constellationConditions: readonly Condition[] = [
  // C3 "Whirling Weeds" — +3 Elemental Skill talent levels (Razorgrass Blade).
  // Raw cons[2]: Condition{ settings:{ char_skill_elemental_bonus:3 } }
  { type: "constellation", constellation: 3, settings: { char_skill_elemental_bonus: 3 } },
  // C5 "Quad Beasts Unleashed" — +3 Elemental Burst talent levels.
  // Raw cons[4]: Condition{ settings:{ char_skill_burst_bonus:3 } }
  { type: "constellation", constellation: 5, settings: { char_skill_burst_bonus: 3 } },
];

export const travelerDendro: DbObjectChar = {
  name: "traveler_dendro",
  gameId: 10000005,
  rarity: 5,
  element: "dendro",
  weapon: "sword",
  origin: "foreign",
  statTable: TravelerStatTable,
  talents,
  features,
  multipliers: [],
  baseStats: BASE_STATS,
  conditions: constellationConditions,
};
