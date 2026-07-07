/**
 * Albedo — geo sword DEF+ATK scaler.
 *
 * 5-hit normal combo (physical sword). Charged 2-hit multihit
 * (charged_hit_total parent + isChild:true _1/_2). Plunge/low/high.
 *
 * Skill:
 *   skill_dmg — geo, ATK-scaled (char_skill_elemental, s2.p1)
 *   albedo_blossom — geo, DEF-scaled (scaling:'def', s2.p2),
 *     damageBonuses:['dmg_skill_albedo'] (A1 toggle, reads 0 in fixed build)
 *
 * Burst:
 *   burst_dmg — geo, ATK-scaled (char_skill_burst, s3.p1)
 *   albedo_fatal_blossom — geo, ATK-scaled (char_skill_burst, s3.p2)
 *
 * A1 "Calcite Might": ConditionBoolean dmg_skill_albedo:25 — toggle (off in the default
 * golden build; albedo_blossom's damageBonuses key reads 0 until toggled). Now modelled as
 * a SELF condition (was golden-blind SKIPPED — no party.* mirror; see constellationConditions).
 * A4 "Homuncular Nature": ConditionBoolean mastery:125 — toggle, damage-inert for his own kit;
 * modelled as a SELF condition for self/party parity.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Albedo.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Albedo)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Albedo)
 */

import type {
  CharMultiplier,
  Condition,
  DbObjectChar,
  Feature,
  TalentResolver,
} from "@genshin/types";
import { Albedo as AlbedoStatTable } from "../generated/charTables.js";
import { Albedo as AlbedoTalents } from "../generated/charTalentTables.js";

const TalentValues = {
  /** C2 "Opening of Phanerozoic": Transient Blossoms deal DEF%-based bonus DMG,
   *  stacking up to 4× (30/60/90/120%). Per-stack base is C2DefBonus. */
  C2DefBonus: 30,
} as const;

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1")  return AlbedoTalents.s1.p1;
      if (name === "normal_hit_2")  return AlbedoTalents.s1.p2;
      if (name === "normal_hit_3")  return AlbedoTalents.s1.p3;
      if (name === "normal_hit_4")  return AlbedoTalents.s1.p4;
      if (name === "normal_hit_5")  return AlbedoTalents.s1.p5;
      if (name === "charged_hit_1") return AlbedoTalents.s1.p6;
      if (name === "charged_hit_2") return AlbedoTalents.s1.p7;
      if (name === "plunge")        return AlbedoTalents.s1.p9;
      if (name === "plunge_low")    return AlbedoTalents.s1.p10;
      if (name === "plunge_high")   return AlbedoTalents.s1.p11;
    }
    if (talent === "skill") {
      if (name === "skill_dmg")       return AlbedoTalents.s2.p1;
      if (name === "albedo_blossom")  return AlbedoTalents.s2.p2;
    }
    if (talent === "burst") {
      if (name === "burst_dmg")              return AlbedoTalents.s3.p1;
      if (name === "albedo_fatal_blossom")   return AlbedoTalents.s3.p2;
    }
    throw new Error(`albedo talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (physical sword) ---
  // raw: FeatureDamageNormal normal_hit_1..5 (Albedo.js)
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
  // --- Charged attacks ---
  // raw: FeatureDamageMultihit charged_hit_total (2-hit: p6 + p7)
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
  // --- Skill: Solar Isotoma (geo) ---
  // raw: FeatureDamageSkill skill_dmg (geo, ATK-scaled, Albedo.js)
  {
    name: "skill_dmg",
    category: "skill",
    element: "geo",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.skill_dmg") }],
  },
  // raw: FeatureDamageSkill albedo_blossom (geo, DEF-scaled via scaling:'def*')
  // damageBonuses:['dmg_skill_albedo'] — A1 toggle, reads 0 in fixed build.
  // Albedo.js: new FeatureMultiplier({ scaling:'def*', leveling:'char_skill_elemental', values:p2 })
  {
    name: "albedo_blossom",
    category: "skill",
    element: "geo",
    damageBonuses: ["dmg_skill_albedo"],
    multipliers: [
      { scaling: "def", leveling: "char_skill_elemental", values: talents.get("skill.albedo_blossom") },
    ],
  },
  // --- Burst: Tectonic Tide (geo) ---
  // raw: FeatureDamageBurst burst_dmg (geo, ATK-scaled)
  {
    name: "burst_dmg",
    category: "burst",
    element: "geo",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") }],
  },
  // raw: FeatureDamageBurst albedo_fatal_blossom (geo, ATK-scaled)
  {
    name: "albedo_fatal_blossom",
    category: "burst",
    element: "geo",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.albedo_fatal_blossom") }],
  },
];

// ---------------------------------------------------------------------------
// Char-level targeted multipliers (P2.3)
// ---------------------------------------------------------------------------

/**
 * C2 "Opening of Phanerozoic" — Transient Blossoms (Albedo's burst hits) deal
 * `def*`-scaled bonus DMG, gated by constellation 2 AND the in-combat stack toggle.
 * Modelled as a char-level targeted multiplier on `burst`, summed into each burst
 * feature's base term when active — the same channel as Itto A4 (P2.3), but GATED:
 * under the canonical base build (constellation 0) the gate is false, so it
 * contributes nothing and Albedo's `base` oracle stays exact. This is precisely the
 * constellation-granted-multiplier shape P2.C will rely on.
 *
 * Per-stack base = C2DefBonus (30%); the value table mirrors her 4-stack
 * progression (30/60/90/120). `leveling:"albedo_opening_of_hanerozoic"` reads the
 * live stack count (1-4) from the settings bag (the SAME key as the gate), so at N
 * stacks the bonus is C2DefBonus×N — faithful to her ValueTable([30,60,90,120])
 * indexed by the ConditionStacks level. (Was `leveling:""`, which pinned the bonus
 * at stack 1 = 30% regardless of the actual stack count → undershot at >1 stack; a
 * diff-parity sweep with albedo_opening_of_hanerozoic:4 surfaced it.)
 *
 * Source: raw/genshin_calc_pub/src/js/db/Char/Albedo.js:325-345
 *   (FeatureMultiplier{ scaling:'def*', source:'constellation2',
 *    leveling:'albedo_opening_of_hanerozoic',
 *    values:ValueTable([C2,C2*2,C2*3,C2*4]),
 *    condition:ConditionAnd([ConditionConstellation(2), ConditionBoolean(...)]),
 *    target:{damageTypes:['burst']} })
 */
const C2_BURST_DEF_VALUES = [
  TalentValues.C2DefBonus,
  TalentValues.C2DefBonus * 2,
  TalentValues.C2DefBonus * 3,
  TalentValues.C2DefBonus * 4,
] as const;
const c2BurstDefMultiplier: CharMultiplier = {
  // raw leveling: 'albedo_opening_of_hanerozoic' → baseDamageTerm reads settings[leveling]
  // as the stack level (1-4) since it is not a talent slot (compileFeature.ts:366-368).
  leveling: "albedo_opening_of_hanerozoic",
  scaling: "def*",
  source: "constellation2",
  values: { getValue: (level: number) => C2_BURST_DEF_VALUES[Math.min(Math.max(level, 1), 4) - 1]! }, // stack level is 1-indexed [1-4]
  target: { damageTypes: ["burst"] },
  condition: {
    type: "and",
    items: [
      { type: "constellation", constellation: 2 },
      { type: "boolean", name: "albedo_opening_of_hanerozoic" },
    ],
  },
};

// ---------------------------------------------------------------------------
// Constellation conditions (P2.C)
// ---------------------------------------------------------------------------
// C1 "Flower of Eden": ConditionStatic with text_decimal_energy → display-only, SKIP.
// C2 "Opening of Phanerozoic": ConditionStacks toggle + char-level multiplier
//    (already ported above as c2BurstDefMultiplier). SKIP (toggle off).
// C4 "Descent of Divinity": ConditionBoolean dmg_plunge toggle → SKIP.
// C6 "Dust of Purification": ConditionBoolean dmg_all toggle → SKIP.
//
// Source: raw/genshin_calc_pub/src/js/db/Char/Albedo.js:345-415

const constellationConditions: readonly Condition[] = [
  // C3 "Grace of Helios": +3 levels to Rite of Progeniture: Tectonic Tide (Elemental Skill).
  // Raw cons[2]: Condition{ settings:{ char_skill_elemental_bonus: 3 } }.
  { type: "constellation", constellation: 3, settings: { char_skill_elemental_bonus: 3 } },
  // C5 "Tide of Hadean Form": +3 levels to Rite of Progeniture: Tectonic Tide (Elemental Burst).
  // Raw cons[4]: Condition{ settings:{ char_skill_burst_bonus: 3 } }.
  { type: "constellation", constellation: 5, settings: { char_skill_burst_bonus: 3 } },
  // SELF "Calcite Might" (A1) — Transient Blossoms (albedo_blossom) deal +25% DMG (A1SkillBonus=25)
  // when Albedo is above 50% HP. The dmg_skill_albedo stat is consumed by albedo_blossom's
  // damageBonuses:['dmg_skill_albedo']; with no condition emitting it the feature read 0 → undershot
  // when albedo_calcite_might:true. ConditionBoolean ascension passive (rep at A6 → modelled ungated,
  // the toggle is the gate). Self-only (no party.* mirror) → golden-blind SKIP.
  // Source: raw/genshin_calc_pub/src/js/db/Char/Albedo.js:297-310 (conditions[0], ConditionBoolean, info.ascension 1).
  { type: "boolean", name: "albedo_calcite_might", stats: { dmg_skill_albedo: 25 } },
  // SELF "Homuncular Nature" (A4) — +125 Elemental Mastery (A4Mastery=125). DAMAGE-INERT for Albedo's
  // OWN kit (his hits are DEF/ATK-scaled geo, no EM scaling and no self-reaction output), modelled for
  // self/party parity + faithfulness (SELF mirror of party.albedo_homuncular_nature). ConditionBoolean
  // ascension passive (rep at A6 → modelled ungated, the toggle is the gate).
  // Source: raw/genshin_calc_pub/src/js/db/Char/Albedo.js:311-323 (conditions[1], ConditionBoolean, info.ascension 4).
  { type: "boolean", name: "albedo_homuncular_nature", stats: { mastery: 125 } },
  // SELF "Descent of Divinity" (C4) — +30% Plunging Attack DMG (C4PlungeDmg=30), lifting Albedo's own
  // plunge/plunge_low/plunge_high. ConditionBoolean gated at C4 (lives in constellation[3] → THE
  // CONSTELLATION IS A GATE). SELF mirror of party.albedo_descent_of_divinity; the port modelled only
  // the party.* version → golden-blind SKIP.
  // Source: raw/genshin_calc_pub/src/js/db/Char/Albedo.js:380-392 (constellation[3], ConditionBoolean).
  {
    type: "boolean",
    name: "albedo_descent_of_divinity",
    stats: { dmg_plunge: 30 },
    condition: { type: "constellation", constellation: 4 },
  },
  // SELF "Dust of Purification" (C6) — +17% DMG (C6ShieldDmg=17, dmg_all) while shielded by Solar
  // Isotoma, lifting EVERY Albedo damage feature. ConditionBoolean gated at C6 (lives in
  // constellation[5] → THE CONSTELLATION IS A GATE). SELF mirror of party.albedo_dust_of_purification;
  // the port modelled only the party.* version → golden-blind SKIP.
  // Source: raw/genshin_calc_pub/src/js/db/Char/Albedo.js:402-413 (constellation[5], ConditionBoolean).
  {
    type: "boolean",
    name: "albedo_dust_of_purification",
    stats: { dmg_all: 17 },
    condition: { type: "constellation", constellation: 6 },
  },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const albedo: DbObjectChar = {
  name: "albedo",
  gameId: 10000038,
  rarity: 5,
  element: "geo",
  weapon: "sword",
  origin: "mondstadt",
  statTable: AlbedoStatTable,
  talents,
  features,
  multipliers: [c2BurstDefMultiplier],
  conditions: constellationConditions,
  // A4 "Homuncular Nature" — +125 EM to nearby party.
  // C4 "Descent of Divinity" — +30% Plunge DMG to party.
  // C6 "Dust of Purification" — +17% DMG to party (while protected by Solar Isotoma shield).
  // Source: raw/genshin_calc_pub/src/js/db/Char/Albedo.js (partyData conditions)
  partyData: {
    conditions: [
      {
        type: "static",
        stats: { mastery: 125 },
        condition: { type: "boolean", name: "party.albedo_homuncular_nature" },
      },
      {
        type: "static",
        stats: { dmg_plunge: 30 },
        condition: { type: "boolean", name: "party.albedo_descent_of_divinity" },
      },
      {
        type: "static",
        stats: { dmg_all: 17 },
        condition: { type: "boolean", name: "party.albedo_dust_of_purification" },
      },
    ],
  },
};
