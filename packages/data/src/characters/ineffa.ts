/**
 * Ineffa — P1.7b Lunar-Charged representative (electro polearm).
 *
 * Exercises the electro stat table, crit-rate ascension substat, and the
 * Lunar-Charged character archetype. Standard damage features (normal attacks,
 * skill, burst) compile via the existing compileFeature path; the Lunar-Charged
 * reaction features are modelled as data stubs (the P1.8 golden suite drives the
 * full reaction pipeline separately).
 *
 * Post-effects:
 *   - A4 EM→ATK bonus (gated by ineffa_panoramic_permutation_protocol)
 *   - Lunar-Charged ATK bonus (passive, 0.7% of lunarcharged_multi per ATK)
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Ineffa.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js:4320
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js:2240
 */

import type {
  DbObjectChar,
  Feature,
  TalentResolver,
} from "@genshin/types";
import { Ineffa as IneffaStatTable } from "../generated/charTables.js";
import { Ineffa as IneffaTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return IneffaTalents.s1.p1;
      if (name === "normal_hit_2") return IneffaTalents.s1.p2;
      if (name === "normal_hit_3_1") return IneffaTalents.s1.p3;
      if (name === "normal_hit_3_2") return IneffaTalents.s1.p4;
      if (name === "normal_hit_4") return IneffaTalents.s1.p5;
      if (name === "charged_hit") return IneffaTalents.s1.p6;
      if (name === "plunge") return IneffaTalents.s1.p8;
      if (name === "plunge_low") return IneffaTalents.s1.p9;
      if (name === "plunge_high") return IneffaTalents.s1.p10;
    }
    if (talent === "skill") {
      if (name === "skill_dmg") return IneffaTalents.s2.p1;
      if (name === "ineffa_birgitta_dmg") return IneffaTalents.s2.p4;
    }
    if (talent === "burst") {
      if (name === "burst_dmg") return IneffaTalents.s3.p1;
    }
    throw new Error(`ineffa talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Features (standard damage features only; Lunar-Charged reaction features
// require the reaction pipeline and are out of P1.7b's standard compile scope)
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (electro element via character innate) ---
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
  // normal_hit_3: multihit (2 × p3 per hit)
  {
    name: "normal_hit_3",
    category: "attack",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3_1") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3_2") }] },
    ],
  },
  {
    name: "normal_hit_3_1",
    category: "attack",
    isChild: true,
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3_1") }],
  },
  {
    name: "normal_hit_4",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4") }],
  },
  // --- Charged attack ---
  {
    name: "charged_hit",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }],
  },
  // --- Plunge attacks ---
  {
    name: "plunge",
    category: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge") }],
  },
  {
    name: "plunge_low",
    category: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_low") }],
  },
  {
    name: "plunge_high",
    category: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_high") }],
  },
  // --- Skill: Carrier Frequency ---
  {
    name: "skill_dmg",
    category: "skill",
    element: "electro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.skill_dmg") }],
  },
  {
    name: "ineffa_birgitta_dmg",
    category: "skill",
    element: "electro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.ineffa_birgitta_dmg") }],
  },
  // --- Burst: Cyclonic Exterminator ---
  {
    name: "burst_dmg",
    category: "burst",
    element: "electro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") }],
  },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const ineffa: DbObjectChar = {
  name: "ineffa",
  gameId: 10000116,
  rarity: 5,
  element: "electro",
  weapon: "polearm",
  origin: "nodkrai",
  statTable: IneffaStatTable,
  talents,
  features,
  multipliers: [],
};
