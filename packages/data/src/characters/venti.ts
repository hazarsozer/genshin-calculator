/**
 * Venti — anemo bow.
 *
 * 6-hit normal combo (n1 and n4 are 2-hit multihits with children _1_1 and _4_1),
 * aimed and charged aimed (anemo), plunge/low/high, anemo skill (press=skill_dmg,
 * hold=hold_dmg), anemo burst (dot_dmg + absorbed-element variants).
 *
 * Burst absorb: the fixture asserts 4 element variants of anemoskill_dmg
 * (pyro/hydro/cryo/electro), each sharing the same talent table (s3.p2).
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Venti.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Venti)
 */

import type { Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Venti as VentiStatTable } from "../generated/charTables.js";
import { Venti as VentiTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return VentiTalents.s1.p1;
      if (name === "normal_hit_2") return VentiTalents.s1.p2;
      if (name === "normal_hit_3") return VentiTalents.s1.p3;
      if (name === "normal_hit_4") return VentiTalents.s1.p4;
      if (name === "normal_hit_5") return VentiTalents.s1.p5;
      if (name === "normal_hit_6") return VentiTalents.s1.p6;
      if (name === "aimed")        return VentiTalents.s1.p7;
      if (name === "charged_aimed") return VentiTalents.s1.p8;
      if (name === "plunge")       return VentiTalents.s1.p9;
      if (name === "plunge_low")   return VentiTalents.s1.p10;
      if (name === "plunge_high")  return VentiTalents.s1.p11;
    }
    if (talent === "skill") {
      if (name === "press_dmg")  return VentiTalents.s2.p1;
      if (name === "hold_dmg")   return VentiTalents.s2.p3;
    }
    if (talent === "burst") {
      if (name === "dot_dmg")       return VentiTalents.s3.p1;
      if (name === "anemoskill_dmg") return VentiTalents.s3.p2;
    }
    throw new Error(`venti talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks ---
  // normal_hit_1: 2-hit multihit parent (same multiplier × 2).
  // raw: FeatureDamageMultihit({ name:'normal_hit_1', items:[{ hits:2, multipliers:[p1] }] })
  {
    name: "normal_hit_1",
    category: "attack",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1") }] },
    ],
  },
  // normal_hit_1_1: one of the 2 sub-hits of normal_hit_1 (half the parent total).
  // raw: FeatureDamageNormal({ name:'normal_hit_1_1', hits:2, isChild:true, ... })
  // DO NOT set isChild:true — the loader skips isChild features; emit as regular.
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
  // normal_hit_4: 2-hit multihit parent.
  // raw: FeatureDamageMultihit({ name:'normal_hit_4', items:[{ hits:2, multipliers:[p4] }] })
  {
    name: "normal_hit_4",
    category: "attack",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4") }] },
    ],
  },
  // normal_hit_4_1: one of the 2 sub-hits of normal_hit_4.
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
  // --- Charged attacks (bow: aimed = tap, charged_aimed = full charge) ---
  // raw: FeatureDamageChargedAimed (category='attack', damageType='charged')
  {
    name: "aimed",
    isAimed: true,
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.aimed") }],
  },
  {
    name: "charged_aimed",
    isAimed: true,
    category: "attack",
    damageType: "charged",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_aimed") }],
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
  // --- C1 "Splitting Gales": two extra aimed shots, each dealing 33% of a normal
  // aimed shot. Cons-added features gated by ConditionConstellation(1).
  // Raw Venti.js:223-256 — FeatureDamageChargedAimed with scalingMultiplier:0.33,
  // scalingSource:'constellation1', condition:ConditionConstellation({constellation:1}).
  {
    name: "second_aimed",
    isAimed: true,
    category: "attack",
    damageType: "charged",
    condition: { type: "constellation", constellation: 1 },
    multipliers: [
      {
        leveling: "char_skill_attack",
        values: talents.get("attack.aimed"),
        scalingMultiplier: 0.33,
        source: "constellation1",
      },
    ],
  },
  {
    name: "second_charged_aimed",
    isAimed: true,
    category: "attack",
    damageType: "charged",
    element: "anemo",
    condition: { type: "constellation", constellation: 1 },
    multipliers: [
      {
        leveling: "char_skill_attack",
        values: talents.get("attack.charged_aimed"),
        scalingMultiplier: 0.33,
        source: "constellation1",
      },
    ],
  },
  // --- Skill: Skyward Sonnet ---
  // raw: name:'skill_dmg' → fixture key "skill.skill_dmg"
  {
    name: "skill_dmg",
    category: "skill",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.press_dmg") }],
  },
  {
    name: "hold_dmg",
    category: "skill",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.hold_dmg") }],
  },
  // --- Burst: Wind's Grand Ode ---
  // dot_dmg: anemo periodic damage; raw: FeatureDamageBurst, element:'anemo'
  {
    name: "dot_dmg",
    category: "burst",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.dot_dmg") }],
  },
  // Burst absorbed-element variants: pyro/hydro/cryo/electro, each sharing s3.p2.
  // raw: map over elements → FeatureDamageBurst({ name:'anemoskill_'+elem+'_dmg', element:elem, ... })
  {
    name: "anemoskill_pyro_dmg",
    category: "burst",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.anemoskill_dmg") }],
  },
  {
    name: "anemoskill_hydro_dmg",
    category: "burst",
    element: "hydro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.anemoskill_dmg") }],
  },
  {
    name: "anemoskill_cryo_dmg",
    category: "burst",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.anemoskill_dmg") }],
  },
  {
    name: "anemoskill_electro_dmg",
    category: "burst",
    element: "electro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.anemoskill_dmg") }],
  },
];

// ---------------------------------------------------------------------------
// Constellation conditions (P2.C)
// ---------------------------------------------------------------------------
// C1: cons-added features second_aimed/second_charged_aimed (above, gated in features array).
// C2 "Breeze of Reminiscence": two SELF ConditionBoolean toggles (enemy_res_anemo/phys -12 each).
//   Ported below as the SELF mirror of party.venti_breeze / party.venti_breeze_2 (golden-blind SKIP).
// C3: +3 levels to Winds Grand Ode (burst). Raw Venti.js:383-386 cons[2] settings
//     char_skill_burst_bonus:3.
// C4 "Hurricane of Freedom": SELF ConditionBoolean toggle (dmg_anemo:25). Ported below (golden-blind SKIP).
// C5: +3 levels to Skyward Sonnet (skill). Raw Venti.js:398-401 cons[4] settings
//     char_skill_elemental_bonus:3.
// C6 "Storm of Defiance": SELF ConditionBoolean (enemy_res_anemo -20) + ConditionDropdownElement
//   (enemy_res_<element> -20). Ported below as the SELF mirror of party.venti_storm /
//   party.venti_storm_element (golden-blind SKIP).
const constellationConditions: readonly Condition[] = [
  // C3: +3 levels to Wind's Grand Ode (burst). Raw Venti.js cons[2].
  { type: "constellation", constellation: 3, settings: { char_skill_burst_bonus: 3 } },
  // C5: +3 levels to Skyward Sonnet (skill). Raw Venti.js cons[4].
  { type: "constellation", constellation: 5, settings: { char_skill_elemental_bonus: 3 } },
  // SELF "Breeze of Reminiscence" (C2) — TWO independent stacks, each -12% Anemo RES + -12% Physical
  // RES, lifting every Venti hit (anemo skill/burst + physical bow normals/aimed + reaction.shatter).
  // Two ConditionBoolean toggles gated at C2 (live in constellation[1] → THE CONSTELLATION IS A GATE).
  // SELF mirror of party.venti_breeze / party.venti_breeze_2; the port modelled only the party.* versions
  // → golden-blind SKIP. Note: unlike the party.venti_breeze_2 (which subConditions on party.venti_breeze),
  // her SELF venti_breeze_2 carries NO breeze sub-gate (Venti.js:364-376) — modelled as an independent
  // C2 toggle, faithful to raw. Raw key `enemy_res_phys` → engine bag key `enemy_res_physical`.
  // Source: raw/genshin_calc_pub/src/js/db/Char/Venti.js:350-377 (constellation[1], two ConditionBoolean).
  {
    type: "boolean",
    name: "venti_breeze",
    stats: { enemy_res_anemo: -12, enemy_res_physical: -12 },
    condition: { type: "constellation", constellation: 2 },
  },
  {
    type: "boolean",
    name: "venti_breeze_2",
    stats: { enemy_res_anemo: -12, enemy_res_physical: -12 },
    condition: { type: "constellation", constellation: 2 },
  },
  // SELF "Hurricane of Freedom" (C4) — +25% Anemo DMG, lifting every Venti anemo hit. ConditionBoolean
  // gated at C4 (lives in constellation[3] → THE CONSTELLATION IS A GATE). No party.* mirror exists for
  // this self-only buff → golden-blind SKIP.
  // Source: raw/genshin_calc_pub/src/js/db/Char/Venti.js:386-399 (constellation[3], ConditionBoolean).
  {
    type: "boolean",
    name: "venti_hurricane",
    stats: { dmg_anemo: 25 },
    condition: { type: "constellation", constellation: 4 },
  },
  // SELF "Storm of Defiance" part 1 (C6) — -20% Anemo RES, lifting every Venti anemo hit. ConditionBoolean
  // gated at C6 (lives in constellation[5] → THE CONSTELLATION IS A GATE). SELF mirror of party.venti_storm.
  // Source: raw/genshin_calc_pub/src/js/db/Char/Venti.js:409-422 (constellation[5], ConditionBoolean).
  {
    type: "boolean",
    name: "venti_storm",
    stats: { enemy_res_anemo: -20 },
    condition: { type: "constellation", constellation: 6 },
  },
  // SELF "Storm of Defiance" part 2 (C6) — the absorbed element selected in the `venti_storm_element`
  // single-select dropdown ALSO gets -20% RES (lifts Venti's matching-element absorb burst variants +
  // swirl/burning/overloaded reactions). ConditionDropdownElement gated on (venti_storm toggle) AND
  // constellation 6 (raw subConditions:[venti_storm], inside constellation[5]). SELF mirror of
  // party.venti_storm_element; modelled with the dropdown-element consumer pattern (cf. the existing
  // party.venti_storm_element below). Raw dropdown options: cryo/electro/hydro/pyro.
  // Source: raw/genshin_calc_pub/src/js/db/Char/Venti.js:418-457 (constellation[5], ConditionDropdownElement).
  {
    type: "static",
    stats: { enemy_res_cryo: -20 },
    condition: { type: "and", items: [
      { type: "dropdown-element", name: "venti_storm_element", element: "cryo" },
      { type: "boolean", name: "venti_storm" },
      { type: "constellation", constellation: 6 },
    ] },
  },
  {
    type: "static",
    stats: { enemy_res_electro: -20 },
    condition: { type: "and", items: [
      { type: "dropdown-element", name: "venti_storm_element", element: "electro" },
      { type: "boolean", name: "venti_storm" },
      { type: "constellation", constellation: 6 },
    ] },
  },
  {
    type: "static",
    stats: { enemy_res_hydro: -20 },
    condition: { type: "and", items: [
      { type: "dropdown-element", name: "venti_storm_element", element: "hydro" },
      { type: "boolean", name: "venti_storm" },
      { type: "constellation", constellation: 6 },
    ] },
  },
  {
    type: "static",
    stats: { enemy_res_pyro: -20 },
    condition: { type: "and", items: [
      { type: "dropdown-element", name: "venti_storm_element", element: "pyro" },
      { type: "boolean", name: "venti_storm" },
      { type: "constellation", constellation: 6 },
    ] },
  },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const venti: DbObjectChar = {
  name: "venti",
  gameId: 10000022,
  rarity: 5,
  element: "anemo",
  weapon: "bow",
  origin: "mondstadt",
  statTable: VentiStatTable,
  talents,
  features,
  multipliers: [],
  conditions: constellationConditions,
  // partyData — teammate kit buffs (P3.5.2 Bucket A, partial)
  // C2 "Breeze of Reminiscence" (2 booleans): anemo -12% + phys -12% RES for the group.
  //   cond[0]: venti_breeze (first stack).
  //   cond[1]: venti_breeze_2, gated on venti_breeze (second stack, same stats).
  // C6 "Storm of Defiance" part 1: venti_storm → enemy_res_anemo:-20.
  //   Part 2: venti_storm_element single-select dropdown → enemy_res_<el>:-20 (gated on
  //   venti_storm), modeled via the dropdown-element consumer pattern below.
  //   Source: raw/genshin_calc_pub/src/js/db/Char/Venti.js partyData
  partyData: {
    conditions: [
      // C2 breeze stack 1: -12% anemo res, -12% phys res.
      {
        type: "boolean",
        name: "party.venti_breeze",
        stats: { enemy_res_anemo: -12, enemy_res_physical: -12 },
      },
      // C2 breeze stack 2: additional -12% anemo res, -12% phys res (gated on stack 1).
      {
        type: "boolean",
        name: "party.venti_breeze_2",
        stats: { enemy_res_anemo: -12, enemy_res_physical: -12 },
        condition: { type: "boolean", name: "party.venti_breeze" },
      },
      // C6 part 1: -20% anemo res.
      {
        type: "boolean",
        name: "party.venti_storm",
        stats: { enemy_res_anemo: -20 },
      },
      // C6 part 2: per-element RES shred — the venti_storm_element single-select dropdown →
      // enemy_res_<el>:-20, gated on venti_storm. Modeled with the dropdown-element consumer
      // pattern (cf. ViridescentVenerer 4pc in characterConditions.ts). Raw Venti.js:500-544.
      {
        type: "static",
        stats: { enemy_res_cryo: -20 },
        condition: { type: "and", items: [
          { type: "dropdown-element", name: "party.venti_storm_element", element: "cryo" },
          { type: "boolean", name: "party.venti_storm" },
        ] },
      },
      {
        type: "static",
        stats: { enemy_res_electro: -20 },
        condition: { type: "and", items: [
          { type: "dropdown-element", name: "party.venti_storm_element", element: "electro" },
          { type: "boolean", name: "party.venti_storm" },
        ] },
      },
      {
        type: "static",
        stats: { enemy_res_hydro: -20 },
        condition: { type: "and", items: [
          { type: "dropdown-element", name: "party.venti_storm_element", element: "hydro" },
          { type: "boolean", name: "party.venti_storm" },
        ] },
      },
      {
        type: "static",
        stats: { enemy_res_pyro: -20 },
        condition: { type: "and", items: [
          { type: "dropdown-element", name: "party.venti_storm_element", element: "pyro" },
          { type: "boolean", name: "party.venti_storm" },
        ] },
      },
    ],
  },
};
