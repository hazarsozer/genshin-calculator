/**
 * Kaveh — dendro claymore ATK scaler.
 *
 * 4-hit normal combo (physical), 2 charged attacks (spin/final), plunge/low/high.
 * Dendro skill: skill_dmg. Dendro burst: burst_dmg.
 *
 * In the fixed solo build with `settings = {}`:
 *   - kaveh_painted_dome (burst toggle) is inactive → no dendro infusion on attacks.
 *   - kaveh_bloom_heal (A1, damageType:"") → not tested by golden harness.
 *   - A4 stacks condition (kaveh_a_craftsmans_curious_conceptions) is toggle-gated → inactive.
 *   - C6 adds kaveh_pairidaezas_light_dmg (FeatureDamage, fixed 61.8% ATK, dendro).
 *   - C3/C5 talent bumps (+3 burst/skill). C4 always-on dmg_reaction_rupture:60.
 *   - C1/C2 are toggle/subgated → SKIP.
 *
 * Reactions (4 auto-generated from dendro element):
 *   burning, rupture, electrocharged, shatter
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Kaveh.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Kaveh)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js:3118 (Kaveh)
 */

import type { Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Kaveh as KavehStatTable } from "../generated/charTables.js";
import { Kaveh as KavehTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return KavehTalents.s1.p1;
      if (name === "normal_hit_2") return KavehTalents.s1.p2;
      if (name === "normal_hit_3") return KavehTalents.s1.p3;
      if (name === "normal_hit_4") return KavehTalents.s1.p4;
      if (name === "charged_spin") return KavehTalents.s1.p5;
      if (name === "charged_final") return KavehTalents.s1.p6;
      if (name === "plunge")        return KavehTalents.s1.p9;
      if (name === "plunge_low")    return KavehTalents.s1.p10;
      if (name === "plunge_high")   return KavehTalents.s1.p11;
    }
    if (talent === "skill") {
      if (name === "skill_dmg") return KavehTalents.s2.p1;
    }
    if (talent === "burst") {
      if (name === "burst_dmg") return KavehTalents.s3.p1;
    }
    throw new Error(`kaveh talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (physical claymore, infusion inactive in fixed build) ---
  // raw: FeatureDamageNormal normal_hit_1 (s1.p1)
  {
    name: "normal_hit_1",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1") }],
  },
  // raw: FeatureDamageNormal normal_hit_2 (s1.p2)
  {
    name: "normal_hit_2",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2") }],
  },
  // raw: FeatureDamageNormal normal_hit_3 (s1.p3)
  {
    name: "normal_hit_3",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }],
  },
  // raw: FeatureDamageNormal normal_hit_4 (s1.p4)
  {
    name: "normal_hit_4",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4") }],
  },
  // --- Charged attacks ---
  // raw: FeatureDamageCharged charged_spin (s1.p5)
  {
    name: "charged_spin",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_spin") }],
  },
  // raw: FeatureDamageCharged charged_final (s1.p6)
  {
    name: "charged_final",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_final") }],
  },
  // --- Plunge attacks ---
  // raw: FeatureDamagePlungeCollision plunge (s1.p9)
  {
    name: "plunge",
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge") }],
  },
  // raw: FeatureDamagePlungeShockWave plunge_low (s1.p10)
  {
    name: "plunge_low",
    tags: ["plunge_shockwave"],
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_low") }],
  },
  // raw: FeatureDamagePlungeShockWave plunge_high (s1.p11)
  {
    name: "plunge_high",
    tags: ["plunge_shockwave"],
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_high") }],
  },
  // --- Skill: Artistic Ingenuity (dendro ATK-scaled) ---
  // raw: FeatureDamageSkill skill_dmg, element:'dendro' (s2.p1)
  {
    name: "skill_dmg",
    category: "skill",
    element: "dendro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.skill_dmg") }],
  },
  // --- Burst: Painted Dome (dendro ATK-scaled) ---
  // raw: FeatureDamageBurst burst_dmg, element:'dendro' (s3.p1)
  {
    name: "burst_dmg",
    category: "burst",
    element: "dendro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") }],
  },
  // --- C6 "Pairidaeza's Dreams": cons-added dendro ATK hit (61.8% fixed).
  // Raw FeatureDamage (base class, NOT FeatureDamageNormal) → damageType:"" (no dmg_<type>).
  // Fixed value, not talent-leveled (ValueTable([61.8])). Raw Kaveh.js:234-245.
  {
    name: "kaveh_pairidaezas_light_dmg",
    category: "attack",
    element: "dendro",
    damageType: "",
    condition: { type: "constellation", constellation: 6 },
    multipliers: [
      {
        leveling: "char_skill_attack",
        values: { getValue: (_level: number) => 61.8 },
        source: "constellation6",
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Constellation conditions (P2.C)
// ---------------------------------------------------------------------------
// C1 "Sublime Salutations": ConditionBoolean toggle (res_dendro/healing_recv) — SKIP (toggle OFF).
// C2 "Grace of Royal Roads": ConditionStatic subgated by kaveh_painted_dome boolean →
//   atk_speed_normal:15 (non-damage, toggle-gated) — SKIP.
// C3: +3 levels to Painted Dome (burst). Raw cons[2] char_skill_burst_bonus:3.
// C4 "Feast of Apadana": ConditionStatic (always-on at C≥4) dmg_reaction_rupture:60.
//   Raw: no toggle, auto-active at constellation≥4. Kaveh.js:341-349.
// C5: +3 levels to Artistic Ingenuity (skill). Raw cons[4] char_skill_elemental_bonus:3.
// C6 "Pairidaeza's Dreams": ConditionStatic display-only; actual damage is the feature above.
// Raw: db/Char/Kaveh.js constellation array (Kaveh.js:301-367).
const constellationConditions: readonly Condition[] = [
  // C3: +3 levels to Painted Dome (burst).
  { type: "constellation", constellation: 3, settings: { char_skill_burst_bonus: 3 } },
  // C4: +60% Bloom (rupture) reaction DMG. Always-on ConditionStatic at C≥4. Raw Kaveh.js:341-349.
  { type: "constellation", constellation: 4, stats: { dmg_reaction_rupture: 60 } },
  // C5: +3 levels to Artistic Ingenuity (skill).
  { type: "constellation", constellation: 5, settings: { char_skill_elemental_bonus: 3 } },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const kaveh: DbObjectChar = {
  name: "kaveh",
  gameId: 10000081,
  rarity: 4,
  element: "dendro",
  weapon: "claymore",
  origin: "sumeru",
  statTable: KavehStatTable,
  talents,
  features,
  multipliers: [],
  conditions: constellationConditions,
  // partyData — teammate kit buffs (P3.5.2 Bucket A)
  // C3 "Profferings of Dur Untash" toggle: ConditionBoolean → settings burst talent +3.
  // Burst "Painted Dome" (BooleanLevels): ConditionBooleanLevels(party.kaveh_painted_dome)
  //   → dmg_reaction_rupture per burst talent level.
  //   Level from kaveh_char_skill_burst (baked via sourceSettings).
  //   Values hardcoded in raw: [27.49,29.55,31.61,34.36,36.42,38.48,41.23,43.98,46.73,49.48,
  //                             52.23,54.98,58.41,61.85,65.28]
  //   Source: raw/genshin_calc_pub/src/js/db/Char/Kaveh.js partyData
  partyData: {
    conditions: [
      // C3 toggle: +3 burst talent levels.
      {
        type: "boolean",
        name: "party.kaveh_profferings_of_dur_untash",
        settings: { kaveh_char_skill_burst_bonus: 3 },
      },
      // Burst "Painted Dome": bloom dmg_reaction_rupture per burst talent level.
      {
        type: "static-level",
        levelSetting: "kaveh_char_skill_burst",
        levelStats: {
          dmg_reaction_rupture: [
            27.49, 29.55, 31.61, 34.36, 36.42, 38.48, 41.23,
            43.98, 46.73, 49.48, 52.23, 54.98, 58.41, 61.85, 65.28,
          ],
        },
        condition: { type: "boolean", name: "party.kaveh_painted_dome" },
      },
    ],
  },
};
