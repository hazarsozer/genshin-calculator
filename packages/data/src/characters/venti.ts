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

import type { DbObjectChar, Feature, TalentResolver } from "@genshin/types";
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
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.aimed") }],
  },
  {
    name: "charged_aimed",
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
};
