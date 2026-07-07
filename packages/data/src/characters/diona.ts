/**
 * Diona — cryo bow ATK scaler.
 *
 * 5-hit normal combo (physical), physical aimed shot, cryo fully charged aimed
 * shot, plunge/low/high (physical), cryo skill (diona_claw_dmg), cryo burst
 * (burst_dmg + field_dmg).
 * Shields (output:{kind:"shield"}):
 *   - skill.shield_press: HP-scaled (s2.p2 % HP + s2.p3 flat), C0 path.
 *   - skill.shield_hold: HP-scaled × 1.75 (s2.p2*1.75 % HP + s2.p3*1.75 flat), C0 path.
 *     raw TalentValues.ShieldHoldRatio = 1.75.
 * Burst heal (output:{kind:"heal"}): burst.heal_dot — HP-scaled (s3.p3 % HP + s3.p4 flat).
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Diona.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Diona)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Diona)
 */

import type { Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Diona as DionaStatTable } from "../generated/charTables.js";
import { Diona as DionaTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1")   return DionaTalents.s1.p1;
      if (name === "normal_hit_2")   return DionaTalents.s1.p2;
      if (name === "normal_hit_3")   return DionaTalents.s1.p3;
      if (name === "normal_hit_4")   return DionaTalents.s1.p4;
      if (name === "normal_hit_5")   return DionaTalents.s1.p5;
      if (name === "aimed")          return DionaTalents.s1.p7;
      if (name === "charged_aimed")  return DionaTalents.s1.p8;
      if (name === "plunge")         return DionaTalents.s1.p9;
      if (name === "plunge_low")     return DionaTalents.s1.p10;
      if (name === "plunge_high")    return DionaTalents.s1.p11;
    }
    if (talent === "skill") {
      if (name === "diona_claw_dmg")    return DionaTalents.s2.p1;
      if (name === "shield_percent")    return DionaTalents.s2.p2;
      if (name === "shield_flat")       return DionaTalents.s2.p3;
    }
    if (talent === "burst") {
      if (name === "burst_dmg") return DionaTalents.s3.p1;
      if (name === "field_dmg") return DionaTalents.s3.p2;
      if (name === "heal_dot_percent") return DionaTalents.s3.p3;
      if (name === "heal_dot_flat")    return DionaTalents.s3.p4;
    }
    throw new Error(`diona talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (bow — physical) ---
  // raw/genshin_calc_pub/src/js/db/Char/Diona.js
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
  // --- Charged attacks (bow aimed shots) ---
  // aimed: physical uncharged aimed shot (FeatureDamageChargedAimed → damageType="charged")
  {
    name: "aimed",
    isAimed: true,
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.aimed") }],
  },
  // charged_aimed: fully charged cryo aimed shot
  {
    name: "charged_aimed",
    isAimed: true,
    category: "attack",
    damageType: "charged",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_aimed") }],
  },
  // --- Plunge attacks (bow — physical) ---
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
  // --- Skill: Icy Paws (cryo) ---
  // diona_claw_dmg: each claw paw hit; damageBonuses carries dmg_skill_diona (C2 bonus, 0 at C0)
  // raw/genshin_calc_pub/src/js/db/Char/Diona.js — FeatureDamageSkill diona_claw_dmg
  {
    name: "diona_claw_dmg",
    category: "skill",
    element: "cryo",
    damageBonuses: ["dmg_skill_diona"],
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.diona_claw_dmg") }],
  },
  // --- Shields (FeatureShield): skill.shield_press, skill.shield_hold ---
  // FeatureMultiplierList: (percent/100 × hp_total) + flat, then × (1 + shield).
  // Both scale from the same base table (s2.p2 % + s2.p3 flat); hold = 1.75× both.
  // C0 (settings:{}) → ConditionNot[C2] branch active → use base tables.
  // raw: FeatureShield{name:'shield_press', category:'skill', element:'cryo',
  //   multipliers:[FeatureMultiplierList{scaling:'hp*', leveling:'char_skill_elemental',
  //     values:Talents.getList('skill.diona_base_shield_dmg_absorption'), condition:ConditionNot([C2])},...]}
  // raw: FeatureShield{name:'shield_hold', category:'skill', element:'cryo',
  //   multipliers:[FeatureMultiplierList{scaling:'hp*', leveling:'char_skill_elemental',
  //     values:Talents.getMulti({from:'skill.diona_base_shield_dmg_absorption',multi:1.75}),
  //     condition:ConditionNot([C2])},...]}
  // ShieldHoldRatio = 1.75 (raw/genshin_calc_pub/src/js/db/Char/Diona.js:129)
  {
    name: "shield_press",
    category: "skill",
    output: { kind: "shield" },
    multipliers: [
      { scaling: "hp", leveling: "char_skill_elemental", values: talents.get("skill.shield_percent"), flatValues: talents.get("skill.shield_flat") },
    ],
  },
  {
    name: "shield_hold",
    category: "skill",
    output: { kind: "shield" },
    multipliers: [
      {
        scaling: "hp",
        leveling: "char_skill_elemental",
        values: { getValue: (level: number) => 1.75 * DionaTalents.s2.p2.getValue(level) },
        flatValues: { getValue: (level: number) => 1.75 * DionaTalents.s2.p3.getValue(level) },
      },
    ],
  },
  // --- Burst: Signature Mix (cryo) ---
  // raw/genshin_calc_pub/src/js/db/Char/Diona.js — FeatureDamageBurst burst_dmg + field_dmg
  {
    name: "burst_dmg",
    category: "burst",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") }],
  },
  {
    name: "field_dmg",
    category: "burst",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.field_dmg") }],
  },
  // --- Burst heal (FeatureHeal): burst.heal_dot — HP-scaled (s3.p3 % HP + s3.p4 flat) ---
  // raw/genshin_calc_pub/src/js/db/Char/Diona.js:356-366 (FeatureMultiplierList scaling:'hp*', char_skill_burst)
  {
    name: "heal_dot",
    category: "burst",
    output: { kind: "heal" },
    multipliers: [
      { scaling: "hp", leveling: "char_skill_burst", values: talents.get("burst.heal_dot_percent"), flatValues: talents.get("burst.heal_dot_flat") },
    ],
  },
];

// ---------------------------------------------------------------------------
// Constellations (P2.C)
// ---------------------------------------------------------------------------
// C1 "A Lingering Flavor": ConditionStatic with no real stats → SKIP (inert).
// C2 "Shaken, Not Purred": dmg_skill_diona +50% (real); diona_shield (shield absorb
//   bonus, display/calc-internal in her engine) + text_percent (display-only) → only
//   dmg_skill_diona is an engine stat; diona_shield is char-specific, not in the
//   damage-feature damageBonuses path. Given the fixture already has dmg_skill_diona
//   in diona_claw_dmg.damageBonuses, portng as a constellation stat is correct.
// C3 "A-Another Round?": +3 Elemental Burst talent levels.
// C4 "Wine Industry Slayer": text_percent:60 (display-only) → SKIP.
// C5 "Like Father, Like Daughter": +3 Elemental Skill talent levels.
// C6 "Cat's Tail Closing Time": +200 EM gated by NOT(diona_cats_tail) (the cats_tail toggle
//   swaps the EM for a healing_recv buff). The healing_recv side is non-damage → SKIP; the EM
//   side IS modelled with its NOT-gate (below).
//
// Sources: raw/genshin_calc_pub/src/js/db/Char/Diona.js:395-470

const constellationConditions: readonly Condition[] = [
  // C2: dmg_skill_diona +15 (C2SkillDmg=15 — NOT the C2PartyShield=50 sibling value).
  // ConditionStatic; consumed by diona_claw_dmg (raw Diona.js:245 damageBonuses).
  // diona_shield / text_percent are shield-absorb / display-only. Raw cons[1].
  { type: "constellation", constellation: 2, stats: { dmg_skill_diona: 15 } },
  // C3: +3 Elemental Burst talent levels.
  // Raw cons[2]: Condition{ settings:{ char_skill_burst_bonus:3 } }
  { type: "constellation", constellation: 3, settings: { char_skill_burst_bonus: 3 } },
  // C5: +3 Elemental Skill talent levels.
  // Raw cons[4]: Condition{ settings:{ char_skill_elemental_bonus:3 } }
  { type: "constellation", constellation: 5, settings: { char_skill_elemental_bonus: 3 } },
  // C6 "Cat's Tail Closing Time": +200 EM, gated by NOT(diona_cats_tail). The diona_cats_tail
  // boolean toggles a healing_recv buff INSTEAD of the EM, so the EM applies only when cats_tail
  // is OFF (the default). Lifts reaction EM (emBonus). The prior model was always-on (correct at
  // default, since cats_tail is off), but a diff-parity check at diona_cats_tail:true (a non-damage
  // healing toggle the skip-class sweep doesn't set) surfaced the missing NOT-gate: our EM stayed on
  // → reactions ~2× her base. Raw Diona.js constellation[5] ConditionStatic{ mastery:C6Mastery=200,
  // subConditions:[ConditionNot([ConditionBoolean(diona_cats_tail)])] }. The cats_tail healing_recv
  // buff is non-damage → skipped. Base-inert: cats_tail off → NOT passes → EM on (goldens unchanged).
  // Modelled as a `static` gated by AND(constellation>=6, NOT(diona_cats_tail)) because the
  // `constellation` condition type does not honor a `.condition` gate (evaluateConstellation checks
  // only the level), whereas `static` does (checkGate) — so the NOT(cats_tail) gate must wrap an
  // explicit constellation item inside an `and`.
  {
    type: "static",
    stats: { mastery: 200 },
    condition: {
      type: "and",
      items: [
        { type: "constellation", constellation: 6 },
        { type: "not", items: [{ type: "boolean", name: "diona_cats_tail" }] },
      ],
    },
  },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const diona: DbObjectChar = {
  name: "diona",
  gameId: 10000039,
  rarity: 4,
  element: "cryo",
  weapon: "bow",
  origin: "mondstadt",
  statTable: DionaStatTable,
  talents,
  features,
  multipliers: [],
  conditions: constellationConditions,
  // A1 "Cat's Tail Secret Menu" — move_speed/stamina_consume (display-only, damage-inert).
  // C6 "Cat's Tail Closing Time" — two toggles:
  //   _1: +200 EM (damage-affecting); _2: +30% Healing Received (damage-inert), gated by NOT _1.
  //   healing_recv from _2 has no oracle rep; mastery from _1 does.
  // Source: raw/genshin_calc_pub/src/js/db/Char/Diona.js (partyData conditions)
  partyData: {
    conditions: [
      {
        type: "static",
        stats: { mastery: 200 },
        condition: { type: "boolean", name: "party.diona_cats_tail_1" },
      },
      {
        type: "static",
        stats: { healing_recv: 30 },
        // Gated: active only when _1 (EM buff) is NOT active.
        // Source: raw ConditionNot([ConditionBoolean('party.diona_cats_tail_1')])
        condition: {
          type: "and",
          items: [
            { type: "boolean", name: "party.diona_cats_tail_2" },
            { type: "not", items: [{ type: "boolean", name: "party.diona_cats_tail_1" }] },
          ],
        },
      },
    ],
  },
};
