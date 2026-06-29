/**
 * Ororon — electro bow ATK scaler (Nightsoul, 4★ Natlan).
 *
 * 3-hit normal combo (physical), physical aimed shot, electro fully-charged
 * aimed shot, plunge (physical) + low/high shockwaves, electro skill
 * (Night's Sling spirit orb), electro burst (activation + soundwave collision),
 * and the A1 "Hypersense" flat electro hit ("other" category).
 *
 * BASELINE (solo C0) MODELLING NOTES
 *   - Normals/aimed/plunge are PHYSICAL: her FeatureDamageNormal /
 *     FeatureDamagePlunge* carry no element. Ororon's normals become electro only
 *     in the Nightsoul state, which is OFF in the fixed solo build — so they stay
 *     physical (matches the fixture: no element, damageType normal/plunge).
 *   - `charged_aimed` is the fully-charged arrow → electro (her explicit element).
 *   - A1 "Nightshade Synesthesia / Hypersense": flat 160% ATK electro hit,
 *     category "other", damageType "none". It carries `damageBonuses:
 *     ['dmg_skill_ororon']` (a C1 bonus, base-inert at C0); the multiplier is a
 *     constant ValueTable([160]); talent level is irrelevant.
 *   - Constellations C1 (dmg_skill_ororon:50 → the hypersense hits), C2 (dmg_electro
 *     +8/stack, max 4) and C6 (atk_percent +10/stack, max 3) are SELF buffs modelled
 *     as constellation-gated conditions (were golden-blind SKIPPED). A4 (Aspect
 *     Catalyst, energy/Nightsoul) is conditional → omitted.
 *   - Standard electro transformative reactions (overloaded, superconduct,
 *     hyperbloom, electrocharged, shatter) are auto-emitted by the loader from
 *     `element: "electro"`; not declared here.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Ororon.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Ororon)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Ororon)
 */

import type { Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Ororon as OroronStatTable } from "../generated/charTables.js";
import { Ororon as OroronTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return OroronTalents.s1.p1;
      if (name === "normal_hit_2") return OroronTalents.s1.p2;
      if (name === "normal_hit_3") return OroronTalents.s1.p3;
      if (name === "aimed") return OroronTalents.s1.p4;
      if (name === "charged_aimed") return OroronTalents.s1.p5;
      if (name === "plunge") return OroronTalents.s1.p6;
      if (name === "plunge_low") return OroronTalents.s1.p7;
      if (name === "plunge_high") return OroronTalents.s1.p8;
    }
    if (talent === "skill") {
      if (name === "ororon_spirit_orb_dmg") return OroronTalents.s2.p1;
    }
    if (talent === "burst") {
      if (name === "ororon_activation_dmg") return OroronTalents.s3.p1;
      if (name === "ororon_soundwave_collision_dmg") return OroronTalents.s3.p2;
    }
    throw new Error(`ororon talents: unknown path '${path}'`);
  },
};

// A1 "Hypersense": flat 160% ATK electro hit. raw: new StatTable(..., [A1Dmg])
// where A1Dmg = 160 → a 1-entry constant table; talent level is irrelevant.
const hypersenseValues = { getValue: (_level: number) => 160 };

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (physical) ---
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
  // --- Charged attacks (bow aimed shots) ---
  // aimed: physical charged shot (FeatureDamageChargedAimed → damageType="charged")
  {
    name: "aimed",
    isAimed: true,
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.aimed") }],
  },
  // charged_aimed: fully charged electro arrow
  {
    name: "charged_aimed",
    isAimed: true,
    category: "attack",
    damageType: "charged",
    element: "electro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_aimed") }],
  },
  // --- Plunge attacks (physical) ---
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
  // --- Skill: Night's Sling — spirit orb (electro) ---
  {
    name: "ororon_spirit_orb_dmg",
    category: "skill",
    element: "electro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.ororon_spirit_orb_dmg") }],
  },
  // --- Burst: Dark Voices Echo (electro) ---
  {
    name: "ororon_activation_dmg",
    category: "burst",
    element: "electro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.ororon_activation_dmg") }],
  },
  {
    name: "ororon_soundwave_collision_dmg",
    category: "burst",
    element: "electro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.ororon_soundwave_collision_dmg") }],
  },
  // --- A1 "Hypersense" (category omitted → "other", damageType "none", electro) ---
  // Flat 160% ATK electro hit. category is intentionally omitted — `featureKey`
  // maps undefined → "other", producing the fixture key "other.ororon_hypersense_dmg".
  // damageType is omitted → "" (no dmg_<type> bonus), matching the fixture's "none".
  // damageBonuses:['dmg_skill_ororon'] — C1 "Trails Amidst the Forest Fog" key (base-inert,
  // reads 0 until the C1 self toggle fires; raw declares it on this feature → the port must
  // too so the C1 dmg_skill_ororon:50 reaches it). raw Ororon.js:207-218 (FeatureDamage, A1Dmg=160).
  {
    name: "ororon_hypersense_dmg",
    element: "electro",
    damageBonuses: ["dmg_skill_ororon"],
    multipliers: [{ leveling: "ascension1", values: hypersenseValues }],
  },
  // --- C6 "Ode to Deep Springs": cons-added "Hypersense" variant that hits for
  // 200% × base Hypersense (scalingMultiplier: 2.0). Raw FeatureDamage with
  // scalingMultiplier: C6Dmg/100 = 200/100 = 2 on the same A1Dmg=160% table.
  // damageBonuses includes dmg_skill_ororon (C1 key; 0 unless C1 toggle active —
  // toggle is OFF → 0 here, but we mirror raw faithfully). Raw Ororon.js:219-232.
  {
    name: "ororon_hypersense_c6_dmg",
    element: "electro",
    damageBonuses: ["dmg_skill_ororon"],
    condition: { type: "constellation", constellation: 6 },
    multipliers: [
      {
        leveling: "ascension1",
        values: hypersenseValues,
        scalingMultiplier: 2.0,
        source: "constellation6",
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Constellation conditions (P2.C)
// ---------------------------------------------------------------------------
// C1 "Trails Amidst the Forest Fog": ConditionBoolean (dmg_skill_ororon:50) — SELF buff, modelled
//   below (was golden-blind SKIPPED; lifts the two hypersense electro hits via their
//   damageBonuses:['dmg_skill_ororon']).
// C2 "King Bee of the Hidden Honeyed Wine": ConditionStacks (dmg_electro:8 per stack, max 4) — SELF
//   buff, modelled below (lifts every ELECTRO feature: charged_aimed, skill, burst, hypersense).
// C3: +3 levels to burst. Raw cons[2] settings char_skill_burst_bonus:3. Raw Ororon.js:297-303.
// C5: +3 levels to skill. Raw cons[4] settings char_skill_elemental_bonus:3. Raw Ororon.js:313-317.
// C6 "Ode to Deep Springs": ConditionStacks (atk_percent:10 per stack, max 3) — SELF buff, modelled
//   below (lifts EVERY ATK-scaled Ororon hit); the C6 damage feature ororon_hypersense_c6_dmg is the
//   separate hit above (ConditionConstellation gate on the feature itself).
// All three self conditions were golden-blind SKIPPED — the port modelled only the party.* mirror of
// ode_to_deep_springs and skipped C1/C2 + the SELF ode_to_deep_springs; a diff-parity sweep surfaced them.
const constellationConditions: readonly Condition[] = [
  // C3: +3 levels to Dark Voices Echo (burst).
  { type: "constellation", constellation: 3, settings: { char_skill_burst_bonus: 3 } },
  // C5: +3 levels to Night's Sling (elemental skill).
  { type: "constellation", constellation: 5, settings: { char_skill_elemental_bonus: 3 } },
  // SELF "Trails Amidst the Forest Fog" (C1) — +50% dmg_skill_ororon (C1SkillDmg=50), consumed by the
  // two hypersense electro hits (each declares damageBonuses:['dmg_skill_ororon']). ConditionBoolean
  // gated at C1 (lives in constellation[0] → THE CONSTELLATION IS A GATE). SELF-only (party mirrors only
  // ode_to_deep_springs) → golden-blind SKIP. Source: raw Ororon.js:264-275 (constellation[0]).
  {
    type: "boolean",
    name: "ororon_trails_amidst_the_forest_fog",
    stats: { dmg_skill_ororon: 50 },
    condition: { type: "constellation", constellation: 1 },
  },
  // SELF "King Bee of the Hidden Honeyed Wine" (C2) — +8% Electro DMG per stack (C2ElectroDmg=8), max 4
  // (= +32% at 4 stacks), lifting every electro Ororon hit. ConditionStacks gated at C2 (constellation[1]
  // → THE CONSTELLATION IS A GATE; the co-located ConditionStatic master carries no stats → omitted).
  // SELF-only → golden-blind SKIP. Source: raw Ororon.js:284-294 (constellation[1], ConditionStacks).
  {
    type: "stacks",
    name: "ororon_king_bee_of_the_hidden_honeyed_wine",
    maxStacks: 4,
    stats: { dmg_electro: 8 },
    condition: { type: "constellation", constellation: 2 },
  },
  // SELF "Ode to Deep Springs" (C6) — +10% ATK per stack (C6AtkBonus=10), max 3 (= +30% at 3 stacks),
  // lifting EVERY ATK-scaled Ororon hit. ConditionStacks gated at C6 (constellation[5] → THE
  // CONSTELLATION IS A GATE; the co-located ConditionStatic text_percent_dmg display row → omitted).
  // SELF mirror of party.ororon_ode_to_deep_springs (modelled in partyData below) → the port modelled
  // only the party.* version → golden-blind SKIP. Source: raw Ororon.js:321-330 (constellation[5], ConditionStacks).
  {
    type: "stacks",
    name: "ororon_ode_to_deep_springs",
    maxStacks: 3,
    stats: { atk_percent: 10 },
    condition: { type: "constellation", constellation: 6 },
  },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const ororon: DbObjectChar = {
  name: "ororon",
  gameId: 10000105,
  rarity: 4,
  element: "electro",
  weapon: "bow",
  origin: "natlan",
  statTable: OroronStatTable,
  talents,
  features,
  multipliers: [],
  conditions: constellationConditions,
  // partyData — teammate kit buffs (P3.5.2 Bucket A)
  // C6 "Ode to Deep Springs": ConditionStacks(ororon_ode_to_deep_springs) maxStacks:3
  //   → atk_percent:10 per stack.
  //   C6AtkBonus=10, C6AtkBonusStacks=3.
  //   Source: raw/genshin_calc_pub/src/js/db/Char/Ororon.js partyData.conditions[0]
  partyData: {
    conditions: [
      {
        type: "stacks",
        name: "ororon_ode_to_deep_springs",
        maxStacks: 3,
        stats: { atk_percent: 10 },
      },
    ],
  },
};
