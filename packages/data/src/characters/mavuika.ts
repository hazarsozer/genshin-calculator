/**
 * Mavuika — pyro claymore ATK scaler (Natlan, nightsoul/bike kit).
 *
 * Models the solo-C0 baseline set the fixture asserts: the on-foot normal/charged/
 * plunge physical combo plus her pyro skill (Flames Weave Life skill_dmg + the
 * Rings of Searing Radiance ring) and pyro burst (Hour of Burning Skies). All her
 * Flamestrider ("ride the bike") features are gated behind the `mavuika_stance`
 * ConditionBoolean toggle (OFF in the fixed solo build) — so the on-foot normals
 * carry `ConditionNot(mavuika_stance)` (TRUE at baseline, hence included) and the
 * stance features are OMITTED. C0 build → all constellation features omitted.
 *
 * Multihit shape (mirrors shenhe / baizhu):
 *   - normal_hit_2: raw FeatureDamageMultihit items:[{hits:2, p2}] → 2 items here;
 *     child normal_hit_2_1 (raw isChild, hits:2) = one hit → single multiplier.
 *   - normal_hit_3: raw FeatureDamageMultihit items:[{hits:3, p3}] → 3 items here;
 *     child normal_hit_3_1 (raw isChild, hits:3) = one hit → single multiplier.
 *   Children drop `isChild` so the loader emits them (fixture asserts them as
 *   independent features). Fixture ratios confirm: n2=2×n2_1, n3=3×n3_1.
 *
 * No always-on passive stat bonuses fold in at baseline:
 *   - A1 "Gift of Flaming Flowers" (+30% ATK) is a ConditionBoolean toggle (info
 *     ascension:1) → user-toggled, OFF in the fixed build. Omitted.
 *   - A4 "Kiongozi" (dmg_all up to 40%, nightsoul-point-scaled) is a ConditionNumber
 *     slider → OFF at baseline. Omitted.
 *   The fixture's stats.atk (2052.46) carries no passive ATK%, confirming this.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Mavuika.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Mavuika)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js:3188 (Mavuika)
 */

import type { DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Mavuika as MavuikaStatTable } from "../generated/charTables.js";
import { Mavuika as MavuikaTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return MavuikaTalents.s1.p1;
      if (name === "normal_hit_2") return MavuikaTalents.s1.p2;
      if (name === "normal_hit_3") return MavuikaTalents.s1.p3;
      if (name === "normal_hit_4") return MavuikaTalents.s1.p4;
      if (name === "charged_hit") return MavuikaTalents.s1.p5;
      if (name === "plunge") return MavuikaTalents.s1.p7;
      if (name === "plunge_low") return MavuikaTalents.s1.p8;
      if (name === "plunge_high") return MavuikaTalents.s1.p9;
    }
    if (talent === "skill") {
      if (name === "skill_dmg") return MavuikaTalents.s2.p1;
      if (name === "mavuika_rings_of_searing_radiance_dmg") return MavuikaTalents.s2.p2;
    }
    if (talent === "burst") {
      if (name === "burst_dmg") return MavuikaTalents.s3.p1;
    }
    throw new Error(`mavuika talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- On-foot normal attacks (physical claymore; ConditionNot(mavuika_stance)
  //     is TRUE at baseline → included) ---
  // raw: FeatureDamageNormal normal_hit_1
  {
    name: "normal_hit_1",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1") }],
  },
  // raw: FeatureDamageMultihit normal_hit_2, items:[{ hits: 2, multipliers:[p2] }] → 2 items
  {
    name: "normal_hit_2",
    category: "attack",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2") }] },
    ],
  },
  // raw: FeatureDamageNormal normal_hit_2_1 (isChild:true, hits:2 → drop isChild to emit; one hit)
  {
    name: "normal_hit_2_1",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2") }],
  },
  // raw: FeatureDamageMultihit normal_hit_3, items:[{ hits: 3, multipliers:[p3] }] → 3 items
  {
    name: "normal_hit_3",
    category: "attack",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }] },
    ],
  },
  // raw: FeatureDamageNormal normal_hit_3_1 (isChild:true, hits:3 → drop isChild to emit; one hit)
  {
    name: "normal_hit_3_1",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }],
  },
  // raw: FeatureDamageNormal normal_hit_4
  {
    name: "normal_hit_4",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4") }],
  },
  // --- Charged attack (physical, damageType charged) ---
  // raw: FeatureDamageCharged (s1.p5)
  {
    name: "charged_hit",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }],
  },
  // --- Plunge attacks (physical, damageType plunge) ---
  // raw: FeatureDamagePlungeCollision (s1.p7)
  {
    name: "plunge",
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge") }],
  },
  // raw: FeatureDamagePlungeShockWave (s1.p8)
  {
    name: "plunge_low",
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_low") }],
  },
  // raw: FeatureDamagePlungeShockWave (s1.p9)
  {
    name: "plunge_high",
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_high") }],
  },
  // --- Skill: The Named Moment (pyro) ---
  // raw: FeatureDamageSkill skill_dmg (s2.p1)
  {
    name: "skill_dmg",
    category: "skill",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.skill_dmg") }],
  },
  // raw: FeatureDamageSkill mavuika_rings_of_searing_radiance_dmg (s2.p2)
  {
    name: "mavuika_rings_of_searing_radiance_dmg",
    category: "skill",
    element: "pyro",
    multipliers: [
      {
        leveling: "char_skill_elemental",
        values: talents.get("skill.mavuika_rings_of_searing_radiance_dmg"),
      },
    ],
  },
  // --- Burst: Hour of Burning Skies (pyro) ---
  // raw: FeatureDamageBurst burst_dmg (s3.p1)
  {
    name: "burst_dmg",
    category: "burst",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") }],
  },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const mavuika: DbObjectChar = {
  name: "mavuika",
  gameId: 10000106,
  rarity: 5,
  element: "pyro",
  weapon: "claymore",
  origin: "natlan",
  statTable: MavuikaStatTable,
  talents,
  features,
  multipliers: [],
};
