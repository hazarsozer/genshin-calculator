/**
 * Wanderer (Scaramouche) — anemo catalyst ATK scaler.
 *
 * 3-hit normal combo (n3 is a 2-hit multihit → child _3_1), anemo charged hit,
 * plunge/low/high, anemo skill (Song of the Wind), A4 wind-arrow proc, anemo
 * burst (Five Ceremonial Plays). All normals/charged/plunge carry `element:'anemo'`
 * in her data (the Windfavored stance infuses them; the element is set explicitly
 * regardless of the toggle).
 *
 * WINDFAVORED IS OFF AT BASELINE. Her FeatureMultiplierWanderer adds the
 * Fushoudan/Toufukai scaling bonus ONLY when `settings.wanderer_windfavored` is
 * truthy (Multiplier/Wanderer.js:getTreeBonusMultiplier). The fixed canonical
 * build has `settings: {}`, so that bonus is NOT applied and every normal/charged
 * multiplier collapses to the plain base (`talent% × ATK`). Modelled here as a
 * plain FeatureMultiplier — the `scalingValues` (skill.wanderer_fushoudan /
 * wanderer_toufukai) are deliberately dropped because they contribute nothing
 * with the toggle off, which is exactly what the oracle fixture reflects.
 *
 * A4 "Gales of Reverie" wind arrow (`wanderer_wind_arrow_dmg`): leveling
 * `wanderer_passive_level` is NOT a talent slot, so the engine reads talent
 * level 1 → ValueTable([35, 60]).getValue(1) = 35% ATK. Active at A6 (its
 * ConditionAscensionChar(4) is auto-satisfied). raw: Wanderer.js:288-300.
 *
 * burst_dmg carries `damageBonuses: ['dmg_burst_wanderer']` faithfully; that key
 * is set only by C2 (ConditionNumber, OFF at C0) so it reads 0 here.
 *
 * SKIPPED (constellation-gated, off in the C0 solo build): the C6 duplicate
 * normal hits `wanderer_normal_hit_1/2/3(/3_1)` (gated by c6cond = windfavored
 * AND constellation 6). Conditions/constellation entries are not damage features.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Wanderer.js
 *   raw/genshin_calc_pub/src/js/classes/Feature2/Multiplier/Wanderer.js (windfavored-gated scaling)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Wanderer)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Wanderer)
 */

import type { Condition, DbObjectChar, Feature, TalentResolver, TalentTable } from "@genshin/types";
import { Wanderer as WandererStatTable } from "../generated/charTables.js";
import { Wanderer as WandererTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return WandererTalents.s1.p1;
      if (name === "normal_hit_2") return WandererTalents.s1.p2;
      if (name === "normal_hit_3") return WandererTalents.s1.p3;
      if (name === "charged_hit") return WandererTalents.s1.p5;
      if (name === "plunge") return WandererTalents.s1.p7;
      if (name === "plunge_low") return WandererTalents.s1.p8;
      if (name === "plunge_high") return WandererTalents.s1.p9;
    }
    if (talent === "skill") {
      if (name === "skill_dmg") return WandererTalents.s2.p1;
    }
    if (talent === "burst") {
      if (name === "burst_dmg") return WandererTalents.s3.p1;
    }
    throw new Error(`wanderer talents: unknown path '${path}'`);
  },
};

// A4 wind arrow: ValueTable([35, 60]) read at the engine's level-1 default for the
// non-talent leveling key `wanderer_passive_level`. Replicates her ValueTable.getValue.
const windArrowValues: TalentTable = {
  getValue: (level: number) => {
    const v = [35, 60];
    if (level > 0) return v[Math.min(level, v.length) - 1]!;
    return 0;
  },
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (anemo — Windfavored infuses; element set explicitly) ---
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
  // normal_hit_3: 2-hit multihit (same p3 multiplier × 2). Parent models the total.
  // raw: FeatureDamageMultihit({ items: [{ hits: 2, multipliers: [p3] }] }) (Wanderer.js:140-159)
  {
    name: "normal_hit_3",
    category: "attack",
    element: "anemo",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }] },
    ],
  },
  // normal_hit_3_1: one of the 2 sub-hits of normal_hit_3 (half the parent total).
  // raw declares it isChild; de-childed here so it emits as its own fixture row.
  // raw/genshin_calc_pub/src/js/db/Char/Wanderer.js:160-174
  {
    name: "normal_hit_3_1",
    category: "attack",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }],
  },
  // --- Charged attack (anemo) ---
  {
    name: "charged_hit",
    category: "attack",
    damageType: "charged",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }],
  },
  // --- Plunge attacks (anemo) ---
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
  // --- Skill: Hanega: Song of the Wind (anemo) ---
  {
    name: "skill_dmg",
    category: "skill",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.skill_dmg") }],
  },
  // --- A4 wind arrow: 35% ATK anemo proc (level-1 default of the passive table) ---
  // raw/genshin_calc_pub/src/js/db/Char/Wanderer.js:288-300
  // It is a bare FeatureDamage (NOT FeatureDamageSkill), so its damageType is
  // "none": it picks up `dmg_all` + `dmg_anemo` only — NOT `dmg_skill`. The
  // fixture confirms `damageType: "none"`. Setting it explicitly keeps the 32%
  // `dmg_skill` bonus out of this hit.
  {
    name: "wanderer_wind_arrow_dmg",
    category: "skill",
    damageType: "none",
    element: "anemo",
    multipliers: [{ leveling: "wanderer_passive_level", values: windArrowValues }],
  },
  // --- Burst: Kyougen: Five Ceremonial Plays (anemo) ---
  // dmg_burst_wanderer is a C2 ConditionNumber key (OFF at C0 → reads 0).
  {
    name: "burst_dmg",
    category: "burst",
    element: "anemo",
    damageBonuses: ["dmg_burst_wanderer"],
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") }],
  },
];

// ---------------------------------------------------------------------------
// Constellations (P2.C Wave-1)
// ---------------------------------------------------------------------------
// C1 "Ostentatious Plumage": ConditionStatic with atk_speed_normal + text_percent_dmg,
//   subCondition on ConditionBoolean(windfavored) — speed stat + display, SKIP.
// C2 "Isle Amidst White Waves": ConditionNumber toggle (dmg_burst_wanderer) — SKIP.
// C3 "Wending Gales": +3 burst talent (char_skill_burst_bonus).
// C4 "Set Adrift into Spring": ConditionStatic, no real stats — SKIP.
// C5 "Stirring for Hope": +3 skill talent (char_skill_elemental_bonus).
// C6 "Curtains' Melancholic Sway": ConditionStatic with text_percent_dmg — display, SKIP.
// Sources: raw/genshin_calc_pub/src/js/db/Char/Wanderer.js:375-440

const constellationConditions: readonly Condition[] = [
  // C3 — +3 Elemental Burst (Kyougen: Five Ceremonial Plays).
  { type: "constellation", constellation: 3, settings: { char_skill_burst_bonus: 3 } },
  // C5 — +3 Elemental Skill (Hanega: Song of the Wind).
  { type: "constellation", constellation: 5, settings: { char_skill_elemental_bonus: 3 } },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const wanderer: DbObjectChar = {
  name: "wanderer",
  gameId: 10000075,
  rarity: 5,
  element: "anemo",
  weapon: "catalyst",
  origin: "inazuma",
  statTable: WandererStatTable,
  talents,
  features,
  multipliers: [],
  conditions: constellationConditions,
  // Source: raw/genshin_calc_pub/src/js/db/Char/Wanderer.js (partyData: empty conditions)
  partyData: {},
};
