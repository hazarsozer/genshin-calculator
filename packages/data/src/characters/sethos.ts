/**
 * Sethos — electro bow ATK+mastery scaler.
 *
 * 3-hit normal combo (n2: 2-hit multihit → children _2_1/_2_2), bow aimed shot,
 * fully-charged aimed shot (electro), Shadow Piercing Shot (ATK + mastery scaling),
 * plunge/low/high, electro skill.
 *
 * Twilight Meditation (ConditionBoolean toggle) transforms normals to electro
 * charged hits — this is a user toggle (OFF at C0 canonical build), so only the
 * non-meditation versions of normals are modelled.
 *
 * Shadow Piercing Shot (sethos_shadowpiercing_shot_dmg): uses two multipliers —
 *   1. ATK-based: s1.p7 at char_skill_attack
 *   2. mastery-based: s1.p8 at char_skill_attack (scaling:'mastery*')
 * A4 "The Sand King's Boon" adds +700 mastery as a 3rd multiplier, but it is
 * gated by ConditionBoolean (sethos_sand_king_boon) — OFF in the canonical build.
 * critRateBonuses: ['crit_rate_sethos'] — from C1 (inactive at C0, reads 0).
 *
 * No burst damage feature: burst.sethos_twilight_shadowpiercer only provides a
 * mastery bonus to charged hits inside burst mode (multipliers-level, conditional).
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Sethos.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Sethos)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Sethos)
 */

import type { DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Sethos as SethosStatTable } from "../generated/charTables.js";
import { Sethos as SethosTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return SethosTalents.s1.p1;
      if (name === "normal_hit_2_1") return SethosTalents.s1.p2;
      if (name === "normal_hit_2_2") return SethosTalents.s1.p3;
      if (name === "normal_hit_3") return SethosTalents.s1.p4;
      if (name === "aimed") return SethosTalents.s1.p5;
      if (name === "charged_aimed") return SethosTalents.s1.p6;
      if (name === "sethos_shadowpiercing_shot_dmg") return SethosTalents.s1.p7;
      if (name === "sethos_shadowpiercing_shot_mastery") return SethosTalents.s1.p8;
      if (name === "plunge") return SethosTalents.s1.p9;
      if (name === "plunge_low") return SethosTalents.s1.p10;
      if (name === "plunge_high") return SethosTalents.s1.p11;
    }
    if (talent === "skill") {
      if (name === "skill_dmg") return SethosTalents.s2.p1;
    }
    throw new Error(`sethos talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (physical, non-meditation mode) ---
  // raw: FeatureDamageNormal normal_hit_1 (Sethos.js:135-145, cond:ConditionNot[twilight])
  {
    name: "normal_hit_1",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1") }],
  },
  // raw: FeatureDamageMultihit normal_hit_2 (2 sub-hits). Sethos.js:146-172
  {
    name: "normal_hit_2",
    category: "attack",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2_1") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2_2") }] },
    ],
  },
  // raw: FeatureDamageNormal normal_hit_2_1 (isChild:true → emit as standalone). Sethos.js:173-184
  {
    name: "normal_hit_2_1",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2_1") }],
  },
  // raw: FeatureDamageNormal normal_hit_2_2 (isChild:true → emit as standalone). Sethos.js:185-196
  {
    name: "normal_hit_2_2",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2_2") }],
  },
  // raw: FeatureDamageNormal normal_hit_3 (Sethos.js:197-207, cond:ConditionNot[twilight])
  {
    name: "normal_hit_3",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }],
  },
  // --- Bow aimed shots ---
  // raw: FeatureDamageChargedAimed aimed (physical). Sethos.js:276-286
  {
    name: "aimed",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.aimed") }],
  },
  // raw: FeatureDamageChargedAimed charged_aimed (electro). Sethos.js:287-297
  {
    name: "charged_aimed",
    category: "attack",
    damageType: "charged",
    element: "electro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_aimed") }],
  },
  // --- Shadow Piercing Shot (electro) ---
  // raw: FeatureDamageCharged sethos_shadowpiercing_shot_dmg. Sethos.js:299-322
  // Two active multipliers: ATK% (p7) + mastery% (p8).
  // A4 mastery bonus (ConditionBoolean sethos_sand_king_boon) is OFF at canonical C0 build.
  // critRateBonuses: C1 'crit_rate_sethos' — inactive at C0, reads 0.
  {
    name: "sethos_shadowpiercing_shot_dmg",
    category: "attack",
    damageType: "charged",
    element: "electro",
    critRateBonuses: ["crit_rate_sethos"],
    multipliers: [
      { leveling: "char_skill_attack", values: talents.get("attack.sethos_shadowpiercing_shot_dmg") },
      { scaling: "mastery", leveling: "char_skill_attack", values: talents.get("attack.sethos_shadowpiercing_shot_mastery") },
    ],
  },
  // --- Plunge attacks ---
  // raw: FeatureDamagePlungeCollision plunge. Sethos.js:323-330
  {
    name: "plunge",
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge") }],
  },
  // raw: FeatureDamagePlungeShockWave plunge_low. Sethos.js:331-338
  {
    name: "plunge_low",
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_low") }],
  },
  // raw: FeatureDamagePlungeShockWave plunge_high. Sethos.js:339-346
  {
    name: "plunge_high",
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_high") }],
  },
  // --- Skill: The Thundering Sands (electro) ---
  // raw: FeatureDamageSkill skill_dmg (electro). Sethos.js:347-355
  {
    name: "skill_dmg",
    category: "skill",
    element: "electro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.skill_dmg") }],
  },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const sethos: DbObjectChar = {
  name: "sethos",
  gameId: 10000097,
  rarity: 4,
  element: "electro",
  weapon: "bow",
  origin: "sumeru",
  statTable: SethosStatTable,
  talents,
  features,
  multipliers: [],
};
