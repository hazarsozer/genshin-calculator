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
// C5: +3 levels to Stellar Restoration (skill). Raw cons[4] settings char_skill_elemental_bonus:3.
// Raw: Keqing.js:418-484 (constellation array).
//
// SELF buffs (were golden-blind SKIPPED — Keqing is a pure solo DPS with NO party.* mirror;
// the port dropped her four conditional self-buffs because they default OFF in the fixed canonical
// build, so the 58k DAMAGE goldens never exercised them; a diff-parity sweep surfaced every one of
// her own hits diverging when the toggles are on):
//   - A1 "Thundering Penance": SELF electro infusion (attack_infusion:"electro") on her own physical
//     normals/charged/plunge, gated by keqing_penance. raw Keqing.js:390-402 (settings
//     attack_infusion_electro:1; the unconditional allowed_infusion_electro permission flag is
//     implicit in our model — resolveElement infuses any un-elemented attack/plunge). The Diluc-dawn
//     infusion pattern. Ascension-1 auto-true at the rep → the toggle IS the gate.
//   - A4 "Aristocratic Dignity": SELF crit_rate +15 (+ recharge +15, damage-inert), gated by
//     keqing_dignity. raw Keqing.js:403-416. Ascension-4 auto-true at the rep → toggle is the gate.
//   - C4 "Attunement": SELF atk_percent +25, gated by keqing_attunement. raw Keqing.js:447-460
//     (constellation[3] → THE CONSTELLATION IS A GATE).
//   - C6 "Tenacious Star": SELF dmg_electro +6 per stack (max 4 = +24%), gated by
//     keqing_tenacious_star stacks. raw Keqing.js:470-483 (constellation[5] → cons-gated).
const constellationConditions: readonly Condition[] = [
  // C3: +3 levels to Starward Sword (burst).
  { type: "constellation", constellation: 3, settings: { char_skill_burst_bonus: 3 } },
  // C5: +3 levels to Stellar Restoration (skill).
  { type: "constellation", constellation: 5, settings: { char_skill_elemental_bonus: 3 } },
  // SELF A1 "Thundering Penance" electro infusion — her own physical normals/charged/plunge become
  // electro while the toggle is on. Base-inert when untoggled. raw Keqing.js:390-402.
  { type: "boolean", name: "keqing_penance", settings: { attack_infusion: "electro" } },
  // SELF A4 "Aristocratic Dignity" — crit_rate +15 (recharge +15 damage-inert), lifting every hit's
  // expected/crit damage. raw Keqing.js:403-416.
  { type: "boolean", name: "keqing_dignity", stats: { crit_rate: 15, recharge: 15 } },
  // SELF C4 "Attunement" — atk_percent +25, lifting every (ATK-scaled) hit. Gated at C6-display C4.
  // raw Keqing.js:447-460.
  {
    type: "boolean",
    name: "keqing_attunement",
    stats: { atk_percent: 25 },
    condition: { type: "constellation", constellation: 4 },
  },
  // SELF C6 "Tenacious Star" — dmg_electro +6 per stack (max 4 = +24%), lifting her electro hits
  // (skill/burst always; normals/charged/plunge once penance infuses them electro). raw Keqing.js:470-483.
  {
    type: "stacks",
    name: "keqing_tenacious_star",
    maxStacks: 4,
    stats: { dmg_electro: 6 },
    condition: { type: "constellation", constellation: 6 },
  },
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
