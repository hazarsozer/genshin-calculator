/**
 * Jean — anemo sword ATK scaler.
 *
 * 5-hit normal combo (physical sword), charged hit, plunge/low/high (physical),
 * anemo skill (skill_dmg), anemo burst (burst_dmg + field_dmg).
 * Heals (attack.party_heal_on_hit, burst.heal, burst.heal_dot) modelled as
 * output:{kind:"heal"} (ATK-scaled, P3.5.3).
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Jean.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Jean)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Jean)
 */

import type { Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Jean as JeanStatTable } from "../generated/charTables.js";
import { Jean as JeanTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return JeanTalents.s1.p1;
      if (name === "normal_hit_2") return JeanTalents.s1.p2;
      if (name === "normal_hit_3") return JeanTalents.s1.p3;
      if (name === "normal_hit_4") return JeanTalents.s1.p4;
      if (name === "normal_hit_5") return JeanTalents.s1.p5;
      if (name === "charged_hit")  return JeanTalents.s1.p6;
      if (name === "plunge")       return JeanTalents.s1.p8;
      if (name === "plunge_low")   return JeanTalents.s1.p9;
      if (name === "plunge_high")  return JeanTalents.s1.p10;
    }
    if (talent === "skill") {
      if (name === "skill_dmg") return JeanTalents.s2.p1;
    }
    if (talent === "burst") {
      if (name === "burst_dmg") return JeanTalents.s3.p1;
      if (name === "field_dmg") return JeanTalents.s3.p2;
      if (name === "heal_percent")     return JeanTalents.s3.p3;
      if (name === "heal_flat")        return JeanTalents.s3.p4;
      if (name === "heal_dot_percent") return JeanTalents.s3.p5;
      if (name === "heal_dot_flat")    return JeanTalents.s3.p6;
    }
    throw new Error(`jean talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (sword — physical) ---
  // raw/genshin_calc_pub/src/js/db/Char/Jean.js
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
  // --- Charged attack (sword — physical) ---
  {
    name: "charged_hit",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }],
  },
  // --- Plunge attacks (sword — physical) ---
  {
    name: "plunge",
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge") }],
  },
  {
    name: "plunge_low",
    tags: ["plunge_shockwave"],
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_low") }],
  },
  {
    name: "plunge_high",
    tags: ["plunge_shockwave"],
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_high") }],
  },
  // --- Skill: Gale Blade (anemo) ---
  // raw/genshin_calc_pub/src/js/db/Char/Jean.js:237-247 — FeatureDamageSkill skill_dmg, which
  // declares damageBonuses:['dmg_skill_jean'] → the C1 "Spiraling Tempest" +40% skill DMG (the
  // `jean` self toggle below) reaches it. Base-inert until C1+toggle (absent key reads 0).
  {
    name: "skill_dmg",
    category: "skill",
    element: "anemo",
    damageBonuses: ["dmg_skill_jean"],
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.skill_dmg") }],
  },
  // --- Burst: Dandelion Breeze (anemo) ---
  // raw/genshin_calc_pub/src/js/db/Char/Jean.js — FeatureDamageBurst burst_dmg + field_dmg
  {
    name: "burst_dmg",
    category: "burst",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") }],
  },
  {
    name: "field_dmg",
    category: "burst",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.field_dmg") }],
  },
  // --- Heals (FeatureHeal) — ATK-scaled (her default scaling), output:{kind:"heal"} ---
  // attack.party_heal_on_hit: A1 "Wind Companion" — flat A1Heal=15% ATK, auto-active at A6.
  // raw/genshin_calc_pub/src/js/db/Char/Jean.js:189-200,123 (source:'ascension1', ValueTable([15]), partyHeal)
  {
    name: "party_heal_on_hit",
    category: "attack",
    output: { kind: "heal", partyHeal: true },
    multipliers: [
      { leveling: "ascension1", values: { getValue: () => 15 } },
    ],
  },
  // burst.heal: Dandelion Breeze cast heal — ATK% (s3.p3) + flat (s3.p4).
  // raw/genshin_calc_pub/src/js/db/Char/Jean.js:268-277 (FeatureMultiplierList, char_skill_burst, partyHeal)
  {
    name: "heal",
    category: "burst",
    output: { kind: "heal", partyHeal: true },
    multipliers: [
      { leveling: "char_skill_burst", values: talents.get("burst.heal_percent"), flatValues: talents.get("burst.heal_flat") },
    ],
  },
  // burst.heal_dot: Dandelion Field per-tick heal — ATK% (s3.p5) + flat (s3.p6).
  // raw/genshin_calc_pub/src/js/db/Char/Jean.js:279-288 (FeatureMultiplierList, char_skill_burst)
  {
    name: "heal_dot",
    category: "burst",
    output: { kind: "heal" },
    multipliers: [
      { leveling: "char_skill_burst", values: talents.get("burst.heal_dot_percent"), flatValues: talents.get("burst.heal_dot_flat") },
    ],
  },
];

// ---------------------------------------------------------------------------
// Constellation conditions (P2.C Wave-1)
// ---------------------------------------------------------------------------
// C1 "Spiraling Tempest": SELF ConditionBoolean (dmg_skill_jean:40) → +40% Gale Blade DMG.
//   Ported below (golden-blind SKIP — no party.* mirror; the port also lacked the skill_dmg
//   damageBonuses). raw Jean.js:316-326 (constellation[0], ConditionBoolean name:'jean').
// C2 "People's Aegis": ConditionBoolean toggle (atk_speed_normal, move_speed) → damage-inert (no
//   atk-speed scaling in this engine) → SKIP.
// C4 "Land's of Dandelion": SELF ConditionBoolean (enemy_res_anemo:-40). Ported below as the SELF
//   mirror of party.jean_lands_of_dandelion (golden-blind SKIP). raw Jean.js:351-362 (constellation[3]).
// C6 "Lion's Fang, Fair Protector of Mondstadt": ConditionStatic with
//   dmg_reduction=35 — dmg_reduction is a damage-mitigation display stat, NOT a
//   damage-bonus key (doesn't appear in any feature's damageBonuses) → SKIP.
//
// Always-on: C3 (+3 burst talent), C5 (+3 skill talent).
// Sources: raw/genshin_calc_pub/src/js/db/Char/Jean.js:314-382

const constellationConditions: readonly Condition[] = [
  // C3 "When the West Wind Arises" — +3 Elemental Burst (Dandelion Breeze).
  // Raw cons[2]: new Condition({ settings: { char_skill_burst_bonus: 3 } }).
  { type: "constellation", constellation: 3, settings: { char_skill_burst_bonus: 3 } },
  // C5 "Outbursting Gust" — +3 Elemental Skill (Gale Blade).
  // Raw cons[4]: new Condition({ settings: { char_skill_elemental_bonus: 3 } }).
  { type: "constellation", constellation: 5, settings: { char_skill_elemental_bonus: 3 } },
  // SELF "Spiraling Tempest" (C1) — +40% Gale Blade (skill) DMG via dmg_skill_jean (skill_dmg declares
  // damageBonuses:['dmg_skill_jean']). ConditionBoolean gated at C1 (constellation[0] → THE CONSTELLATION
  // IS A GATE; base-inert below C1 / when untoggled). Self-only (no party.* mirror) → golden-blind SKIP.
  // raw Jean.js:316-326 (the toggle name is literally 'jean').
  {
    type: "boolean",
    name: "jean",
    stats: { dmg_skill_jean: 40 },
    condition: { type: "constellation", constellation: 1 },
  },
  // SELF "Land's of Dandelion" (C4) — −40% enemy Anemo RES (enemy_res_anemo), lifting every Jean anemo
  // hit (skill_dmg + burst_dmg + field_dmg). ConditionBoolean gated at C4 (constellation[3] → THE
  // CONSTELLATION IS A GATE; base-inert below C4 / when untoggled). SELF mirror of
  // party.jean_lands_of_dandelion; the port modelled only the party.* version → golden-blind SKIP.
  // raw Jean.js:351-362.
  {
    type: "boolean",
    name: "jean_lands_of_dandelion",
    stats: { enemy_res_anemo: -40 },
    condition: { type: "constellation", constellation: 4 },
  },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const jean: DbObjectChar = {
  name: "jean",
  gameId: 10000003,
  rarity: 5,
  element: "anemo",
  weapon: "sword",
  origin: "mondstadt",
  statTable: JeanStatTable,
  talents,
  features,
  multipliers: [],
  conditions: constellationConditions,
  // C2 "People's Aegis" — +15% ATK speed + +15% movement speed (both damage-inert).
  // C4 "Land's of Dandelion" — enemy Anemo RES -40%.
  // Source: raw/genshin_calc_pub/src/js/db/Char/Jean.js:122,126-128,334-360,393-408
  partyData: {
    conditions: [
      {
        type: "static",
        stats: { atk_speed_normal: 15, move_speed: 15 },
        condition: { type: "boolean", name: "party.jean_peoples_aegis" },
      },
      {
        type: "static",
        stats: { enemy_res_anemo: -40 },
        condition: { type: "boolean", name: "party.jean_lands_of_dandelion" },
      },
    ],
  },
};
