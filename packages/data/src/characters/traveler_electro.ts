/**
 * Traveler (Electro) — electro sword ATK scaler.
 *
 * 5-hit normal combo, 2-sub-hit charged (charged_hit_total multihit parent +
 * charged_hit_1 / charged_hit_2 sub-hits), plunge/low/high, electro skill
 * (Lightning Blade), electro burst (Bellowing Thunder: burst_dmg + the periodic
 * Falling Thunder hits). Normals/charged/plunge are physical (sword, no innate
 * infusion); skill + burst are electro.
 *
 * SKIPPED (not C0-unconditional damage triples, so excluded by the golden
 * harness which only asserts non-empty-damageType fixture entries):
 *   - skill.traveler_electro_recharge_bonus — a FeaturePostEffectValue percent
 *     display (format:"percent", empty damageType), gated on the
 *     `traveler_abundance_amulet` boolean toggle. Not a damage hit and not
 *     expressible by the Feature model (no static-value field). The fixture
 *     entry is display-only → filtered out.
 *   - traveler_falling_thunder_bonus_dmg — C6-gated (ConditionConstellation 6),
 *     OFF at C0.
 *
 * No always-on passive ATK/crit/DMG bonuses fold in: A1 (Thunderflash) is a
 * ConditionStatic text marker, A4 (Resounding Roar) is a recharge→burst-DMG
 * conversion gated on the amulet toggle (OFF in the fixed solo build). The
 * reaction features (electrocharged / overloaded / superconduct / hyperbloom /
 * shatter) are emitted generically from the electro element by the loader.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/TravelerElectro.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Traveler)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (TravelerElectro)
 */

import type { Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Traveler as TravelerStatTable } from "../generated/charTables.js";
import { TravelerElectro as TravelerElectroTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return TravelerElectroTalents.s1.p1;
      if (name === "normal_hit_2") return TravelerElectroTalents.s1.p2;
      if (name === "normal_hit_3") return TravelerElectroTalents.s1.p3;
      if (name === "normal_hit_4") return TravelerElectroTalents.s1.p4;
      if (name === "normal_hit_5") return TravelerElectroTalents.s1.p5;
      if (name === "charged_hit_1") return TravelerElectroTalents.s1.p6;
      if (name === "charged_hit_2") return TravelerElectroTalents.s1.p7;
      if (name === "plunge") return TravelerElectroTalents.s1.p9;
      if (name === "plunge_low") return TravelerElectroTalents.s1.p10;
      if (name === "plunge_high") return TravelerElectroTalents.s1.p11;
    }
    if (talent === "skill") {
      if (name === "skill_dmg") return TravelerElectroTalents.s2.p1;
    }
    if (talent === "burst") {
      if (name === "burst_dmg") return TravelerElectroTalents.s3.p1;
      if (name === "traveler_falling_thunder_dmg") return TravelerElectroTalents.s3.p2;
    }
    throw new Error(`traveler_electro talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (physical sword) ---
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
  // --- Charged attack: 2-sub-hit multihit total + the two sub-hits ---
  // raw: FeatureDamageMultihit({ name:'charged_hit_total', items:[p6, p7] })
  //      + two FeatureDamageCharged({isChild}) → modelled as named children (drop isChild).
  {
    name: "charged_hit_total",
    category: "attack",
    damageType: "charged",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit_1") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit_2") }] },
    ],
  },
  {
    name: "charged_hit_1",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit_1") }],
  },
  {
    name: "charged_hit_2",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit_2") }],
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
  // --- Skill: Lightning Blade (electro) ---
  {
    name: "skill_dmg",
    category: "skill",
    element: "electro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.skill_dmg") }],
  },
  // --- Burst: Bellowing Thunder (electro) ---
  {
    name: "burst_dmg",
    category: "burst",
    element: "electro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") }],
  },
  {
    name: "traveler_falling_thunder_dmg",
    category: "burst",
    element: "electro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.traveler_falling_thunder_dmg") }],
  },
  // --- C6 "World Shaker": extra Falling Thunder hit at 200% of the base hit.
  // Raw FeatureDamageBurst traveler_falling_thunder_bonus_dmg, scalingMultiplier:2 on
  // traveler_falling_thunder_dmg talent, ConditionConstellation({constellation:6}).
  // TravelerElectro.js:307-319.
  {
    name: "traveler_falling_thunder_bonus_dmg",
    category: "burst",
    element: "electro",
    condition: { type: "constellation", constellation: 6 },
    multipliers: [
      {
        leveling: "char_skill_burst",
        values: talents.get("burst.traveler_falling_thunder_dmg"),
        scalingMultiplier: 2,
        source: "constellation6",
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Constellation conditions (P2.C)
// ---------------------------------------------------------------------------
// C1: ConditionStatic — display-only, SKIP.
// C2: ConditionBoolean toggle stats:{enemy_res_electro:-15} — toggle OFF, SKIP.
// C3: +3 levels to Bellowing Thunder (burst). Raw cons[2] settings char_skill_burst_bonus:3.
// C4: ConditionStatic (text_percent1/text_percent2) — display-only, SKIP.
// C5: +3 levels to Lightning Blade (skill). Raw cons[4] settings char_skill_elemental_bonus:3.
// C6: cons-ADDED feature traveler_falling_thunder_bonus_dmg handled above in features array.
//     Raw cons[5] has ConditionStatic({stats:{text_percent_dmg:100}}) — display only, SKIP.
// Raw: db/Char/TravelerElectro.js constellation array (TravelerElectro.js:388-451).
const constellationConditions: readonly Condition[] = [
  // C3: +3 levels to burst talent.
  { type: "constellation", constellation: 3, settings: { char_skill_burst_bonus: 3 } },
  // C5: +3 levels to elemental skill talent.
  { type: "constellation", constellation: 5, settings: { char_skill_elemental_bonus: 3 } },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const travelerElectro: DbObjectChar = {
  name: "traveler_electro",
  gameId: 10000005,
  rarity: 5,
  element: "electro",
  weapon: "sword",
  origin: "foreign",
  statTable: TravelerStatTable,
  talents,
  features,
  multipliers: [],
  conditions: constellationConditions,
};
