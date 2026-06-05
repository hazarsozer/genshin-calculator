/**
 * Yumemizuki Mizuki — anemo catalyst (Dreamdrifter stance swirl support).
 *
 * 3-hit normal combo (anemo), anemo charged hit, plunge/low/high (anemo).
 * Skill "Aisa Utamakura Pilgrimage" (anemo):
 *   skill_dmg                     — char_skill_elemental, s2.p4
 *   mizuki_continuous_attack_dmg  — char_skill_elemental, s2.p1
 * Burst "Anraku Secret Spring Therapy" (anemo):
 *   burst_dmg                     — char_skill_burst, s3.p1
 *   mizuki_munen_shockwave_dmg    — char_skill_burst, s3.p2
 *
 * All anemo transformative reactions (swirl×4, burning, superconduct, overloaded,
 * rupture, burgeon, hyperbloom, + universal electrocharged/shatter) are emitted
 * generically from element:'anemo' by the loader — not declared here.
 *
 * OMITTED (damageType:"" → display-only, filtered by the golden harness):
 *   - mizuki_snack_other_heal / mizuki_snack_self_heal: FeatureHeal (mastery*),
 *     fixture damageType:"" → skipped.
 *   - mizuki_swirl_bonus: FeaturePostEffectValue (the Dreamdrifter swirl-EM% buff),
 *     fixture format:"percent", damageType:"" → skipped. Gated on the
 *     `mizuki_dreamdrifter` ConditionBoolean (OFF at the solo settings={} baseline).
 *   - mizuki_elemental_bonus: C2 display row (constellation-gated, C0 build).
 *
 * STANCE / PASSIVES (all conditional → OFF in the fixed solo C0 build):
 *   - "Dreamdrifter" (ConditionBoolean) toggles the swirl-EM buff + C1/C2/C6 riders.
 *   - A4 "Thoughts by Day, Bring Dreams by Night" (+100 EM) is a ConditionBoolean
 *     gated by ConditionAscensionChar(4) — OFF at settings={}. Confirmed by the
 *     fixture EM: stats.mastery=170.2 = mastery ascension @A6 (115.2) + sample
 *     block mastery_base (55); the +100 A4 is NOT folded in. So no baseStats.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Mizuki.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Mizuki)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Mizuki)
 */

import type { Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Mizuki as MizukiStatTable } from "../generated/charTables.js";
import { Mizuki as MizukiTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return MizukiTalents.s1.p1;
      if (name === "normal_hit_2") return MizukiTalents.s1.p2;
      if (name === "normal_hit_3") return MizukiTalents.s1.p3;
      if (name === "charged_hit")  return MizukiTalents.s1.p4;
      if (name === "plunge")       return MizukiTalents.s1.p6;
      if (name === "plunge_low")   return MizukiTalents.s1.p7;
      if (name === "plunge_high")  return MizukiTalents.s1.p8;
    }
    if (talent === "skill") {
      if (name === "skill_dmg")                     return MizukiTalents.s2.p4;
      if (name === "mizuki_continuous_attack_dmg")  return MizukiTalents.s2.p1;
    }
    if (talent === "burst") {
      if (name === "burst_dmg")                  return MizukiTalents.s3.p1;
      if (name === "mizuki_munen_shockwave_dmg") return MizukiTalents.s3.p2;
    }
    throw new Error(`yumemizuki_mizuki talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (anemo catalyst — all anemo) ---
  // raw: FeatureDamageNormal × 3 (element:'anemo', Mizuki.js)
  {
    name: "normal_hit_1",
    category: "attack",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1") }],
  },
  {
    name: "normal_hit_2",
    category: "attack",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2") }],
  },
  {
    name: "normal_hit_3",
    category: "attack",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }],
  },
  // --- Charged attack (anemo catalyst) ---
  // raw: FeatureDamageCharged charged_hit (element:'anemo')
  {
    name: "charged_hit",
    category: "attack",
    damageType: "charged",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }],
  },
  // --- Plunge attacks (anemo catalyst) ---
  // raw: FeatureDamagePlungeCollision plunge; FeatureDamagePlungeShockWave low/high
  {
    name: "plunge",
    category: "attack",
    damageType: "plunge",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge") }],
  },
  {
    name: "plunge_low",
    tags: ["plunge_shockwave"],
    category: "attack",
    damageType: "plunge",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_low") }],
  },
  {
    name: "plunge_high",
    tags: ["plunge_shockwave"],
    category: "attack",
    damageType: "plunge",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_high") }],
  },
  // --- Skill: Aisa Utamakura Pilgrimage (anemo) ---
  // raw: FeatureDamageSkill skill_dmg (s2.p4) + mizuki_continuous_attack_dmg (s2.p1)
  {
    name: "skill_dmg",
    category: "skill",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.skill_dmg") }],
  },
  {
    name: "mizuki_continuous_attack_dmg",
    category: "skill",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.mizuki_continuous_attack_dmg") }],
  },
  // --- Burst: Anraku Secret Spring Therapy (anemo) ---
  // raw: FeatureDamageBurst burst_dmg (s3.p1) + mizuki_munen_shockwave_dmg (s3.p2)
  {
    name: "burst_dmg",
    category: "burst",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") }],
  },
  {
    name: "mizuki_munen_shockwave_dmg",
    category: "burst",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.mizuki_munen_shockwave_dmg") }],
  },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Constellations (P2.C Wave-1)
// ---------------------------------------------------------------------------
// C1: ConditionBoolean toggle ("mizuki_in_mist_like_waters", Swirl DMG bonus gated
//   by dreamdrifter toggle) → SKIP.
// C2: ConditionStatic with text_percent_dmg only (display-only, no real stat) → SKIP.
//   Raw: (C2ElemBonus/100 = 0.04 is a fractional dmg multiplier but text_percent_dmg only)
// C3 "Boundless Blossoming" — +3 Elemental Skill talent levels.
//   raw/genshin_calc_pub/src/js/db/Char/Mizuki.js:376-383 (constellation[2]).
// C4: ConditionStatic display-only → SKIP.
// C5 "Sleep Awaits" — +3 Burst talent levels.
//   raw/genshin_calc_pub/src/js/db/Char/Mizuki.js:393-400 (constellation[4]).
// C6: ConditionStatic{crit_rate_swirl, crit_dmg_swirl} gated by ConditionBoolean
//   (dreamdrifter) subCondition — toggle OFF in fixed build → SKIP.

const constellationConditions: readonly Condition[] = [
  // C3 — char_skill_elemental_bonus +3 (skill talent level up).
  { type: "constellation", constellation: 3, settings: { char_skill_elemental_bonus: 3 } },
  // C5 — char_skill_burst_bonus +3 (burst talent level up).
  { type: "constellation", constellation: 5, settings: { char_skill_burst_bonus: 3 } },
];

// partyData (Bucket C) DEFERRED — out of P3.5.2 DAMAGE scope (not an engine-
// extension case): her teammate buff is a swirl-reaction bonus, its multiplier
// targeting tags:['swirl'] options:['reaction_flat'] and emitting dmg_reaction_swirl
// (raw Mizuki.js partyData), plus party_burst_energy_cost (energy). Transformative-
// reaction outputs aren't a compared damage output here (cf. Baizhu/Nilou/Ifa), and
// energy is its own sub-project → transformative-reaction sub-project, not this arc.
export const yumemizukiMizuki: DbObjectChar = {
  name: "yumemizuki_mizuki",
  gameId: 10000109,
  rarity: 5,
  element: "anemo",
  weapon: "catalyst",
  origin: "inazuma",
  statTable: MizukiStatTable,
  talents,
  features,
  multipliers: [],
  conditions: constellationConditions,
};
