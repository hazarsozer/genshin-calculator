/**
 * Keqing — electro sword ATK scaler.
 *
 * 5-hit normal combo (physical sword, infusible). Normal hit 4 is a
 * 2-part multihit (normal_hit_4_1 + normal_hit_4_2); both are also
 * exposed as isChild:true individual features.
 *
 * Charged hit: 2-part multihit (charged_hit_1 + charged_hit_2) — parent
 * charged_hit_total + two isChild:true children.
 *
 * Plunge: plunge / plunge_low / plunge_high.
 *
 * Skill: keqing_skill_stiletto (electro), keqing_skill_slash (electro),
 * keqing_skill_clap_total_dmg (2-hit parent, both hits share same multiplier).
 * keqing_skill_clap_dmg is isChild:true (hits:2 — emitted by the multihit).
 *
 * Burst: burst_dmg, keqing_burst_slash, keqing_burst_last (all electro).
 *
 * A4 "Aristocratic Dignity": crit_rate+15, recharge+15 — ConditionBoolean
 * (toggle, off in fixed build). Omitted.
 * A1 "Thundering Penance": electro infusion toggle — off in fixed build.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Keqing.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Keqing)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Keqing)
 */

import type { Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Keqing as KeqingStatTable } from "../generated/charTables.js";
import { Keqing as KeqingTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1")  return KeqingTalents.s1.p1;
      if (name === "normal_hit_2")  return KeqingTalents.s1.p2;
      if (name === "normal_hit_3")  return KeqingTalents.s1.p3;
      if (name === "normal_hit_4_1") return KeqingTalents.s1.p4;
      if (name === "normal_hit_4_2") return KeqingTalents.s1.p5;
      if (name === "normal_hit_5")  return KeqingTalents.s1.p6;
      if (name === "charged_hit_1") return KeqingTalents.s1.p7;
      if (name === "charged_hit_2") return KeqingTalents.s1.p8;
      if (name === "plunge")        return KeqingTalents.s1.p10;
      if (name === "plunge_low")    return KeqingTalents.s1.p11;
      if (name === "plunge_high")   return KeqingTalents.s1.p12;
    }
    if (talent === "skill") {
      if (name === "keqing_skill_stiletto") return KeqingTalents.s2.p1;
      if (name === "keqing_skill_slash")    return KeqingTalents.s2.p2;
      if (name === "keqing_skill_clap_dmg") return KeqingTalents.s2.p3;
    }
    if (talent === "burst") {
      if (name === "burst_dmg")           return KeqingTalents.s3.p1;
      if (name === "keqing_burst_slash")  return KeqingTalents.s3.p2;
      if (name === "keqing_burst_last")   return KeqingTalents.s3.p3;
    }
    throw new Error(`keqing talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (physical sword, infusible) ---
  // raw: FeatureDamageNormal normal_hit_1 (Keqing.js)
  {
    name: "normal_hit_1",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1") }],
  },
  // raw: FeatureDamageNormal normal_hit_2
  {
    name: "normal_hit_2",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2") }],
  },
  // raw: FeatureDamageNormal normal_hit_3
  {
    name: "normal_hit_3",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }],
  },
  // raw: FeatureDamageMultihit normal_hit_4 (2-hit: _4_1 + _4_2)
  // Keqing.js: items:[{multipliers:[p4]},{multipliers:[p5]}]
  {
    name: "normal_hit_4",
    category: "attack",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4_1") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4_2") }] },
    ],
  },
  // raw: FeatureDamageNormal normal_hit_4_1 (isChild:true → drop to emit)
  {
    name: "normal_hit_4_1",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4_1") }],
  },
  // raw: FeatureDamageNormal normal_hit_4_2 (isChild:true → drop to emit)
  {
    name: "normal_hit_4_2",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4_2") }],
  },
  // raw: FeatureDamageNormal normal_hit_5
  {
    name: "normal_hit_5",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_5") }],
  },
  // --- Charged attacks ---
  // raw: FeatureDamageMultihit charged_hit_total (2-hit: _1 + _2)
  // Keqing.js: items:[{multipliers:[p7]},{multipliers:[p8]}]
  {
    name: "charged_hit_total",
    category: "attack",
    damageType: "charged",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit_1") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit_2") }] },
    ],
  },
  // raw: FeatureDamageCharged charged_hit_1 (isChild:true → drop to emit)
  {
    name: "charged_hit_1",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit_1") }],
  },
  // raw: FeatureDamageCharged charged_hit_2 (isChild:true → drop to emit)
  {
    name: "charged_hit_2",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit_2") }],
  },
  // --- Plunge attacks ---
  // raw: FeatureDamagePlungeCollision plunge
  {
    name: "plunge",
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge") }],
  },
  // raw: FeatureDamagePlungeShockWave plunge_low
  {
    name: "plunge_low",
    tags: ["plunge_shockwave"],
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_low") }],
  },
  // raw: FeatureDamagePlungeShockWave plunge_high
  {
    name: "plunge_high",
    tags: ["plunge_shockwave"],
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_high") }],
  },
  // --- Skill: Stellar Restoration (electro) ---
  // raw: FeatureDamageSkill keqing_skill_stiletto (electro, Keqing.js)
  {
    name: "keqing_skill_stiletto",
    category: "skill",
    element: "electro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.keqing_skill_stiletto") }],
  },
  // raw: FeatureDamageSkill keqing_skill_slash (electro)
  {
    name: "keqing_skill_slash",
    category: "skill",
    element: "electro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.keqing_skill_slash") }],
  },
  // raw: FeatureDamageMultihit keqing_skill_clap_total_dmg (electro, 2-hit: same table ×2)
  // Keqing.js: items:[{hits:2, multipliers:[p3]}] → two identical entries
  {
    name: "keqing_skill_clap_total_dmg",
    category: "skill",
    element: "electro",
    items: [
      { multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.keqing_skill_clap_dmg") }] },
      { multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.keqing_skill_clap_dmg") }] },
    ],
  },
  // raw: FeatureDamageSkill keqing_skill_clap_dmg (isChild:true → drop to emit)
  // hits:2 in raw — represents each individual clap hit
  {
    name: "keqing_skill_clap_dmg",
    category: "skill",
    element: "electro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.keqing_skill_clap_dmg") }],
  },
  // --- C1 "Thundering Might": cons-added electro hit on re-cast (fixed 50% ATK).
  // Raw: base FeatureDamage (NOT FeatureDamageSkill) → damageType:"" (no dmg_type bonus,
  // only dmg_all + dmg_electro). Fixed ValueTable([50]), no talent leveling.
  // Raw Keqing.js:341-352. TalentValues.C1Dmg = 50.
  {
    name: "keqing_thundering_might",
    category: "skill",
    element: "electro",
    damageType: "",
    condition: { type: "constellation", constellation: 1 },
    multipliers: [
      {
        leveling: "char_skill_attack",
        values: { getValue: (_level: number) => 50 },
        source: "constellation1",
      },
    ],
  },
  // --- Burst: Starward Sword (electro) ---
  // raw: FeatureDamageBurst burst_dmg (electro)
  {
    name: "burst_dmg",
    category: "burst",
    element: "electro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") }],
  },
  // raw: FeatureDamageBurst keqing_burst_slash (electro)
  {
    name: "keqing_burst_slash",
    category: "burst",
    element: "electro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.keqing_burst_slash") }],
  },
  // raw: FeatureDamageBurst keqing_burst_last (electro)
  {
    name: "keqing_burst_last",
    category: "burst",
    element: "electro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.keqing_burst_last") }],
  },
];

// ---------------------------------------------------------------------------
// Constellation conditions (P2.C)
// ---------------------------------------------------------------------------
// C1 "Thundering Might": cons-added feature keqing_thundering_might above.
// C2 "Keen Extraction": ConditionStatic display-only → SKIP.
// C3: +3 levels to Starward Sword (burst). Raw cons[2] settings char_skill_burst_bonus:3.
// C4 "Attunement": ConditionBoolean (atk_percent:25 toggle) → SKIP.
// C5: +3 levels to Stellar Restoration (skill). Raw cons[4] settings char_skill_elemental_bonus:3.
// C6 "Tenacious Star": ConditionStacks (dmg_electro per stack, toggle) → SKIP.
// Raw: Keqing.js:418-484 (constellation array).
const constellationConditions: readonly Condition[] = [
  // C3: +3 levels to Starward Sword (burst).
  { type: "constellation", constellation: 3, settings: { char_skill_burst_bonus: 3 } },
  // C5: +3 levels to Stellar Restoration (skill).
  { type: "constellation", constellation: 5, settings: { char_skill_elemental_bonus: 3 } },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const keqing: DbObjectChar = {
  name: "keqing",
  gameId: 10000042,
  rarity: 5,
  element: "electro",
  weapon: "sword",
  origin: "liyue",
  statTable: KeqingStatTable,
  talents,
  features,
  multipliers: [],
  conditions: constellationConditions,
};
