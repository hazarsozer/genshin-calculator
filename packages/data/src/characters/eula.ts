/**
 * Eula — cryo claymore physical-DPS scaler (ATK).
 *
 * 5-hit normal combo with two 2-hit multihits (n3 → child _3_1; n5 → child _5_1),
 * spin/final charged, plunge/low/high — all PHYSICAL. Cryo skill (press/hold +
 * the Icewhirl Brand follow-up). Burst Glacial Illumination: a cryo nuke
 * (`burst_dmg`) plus the signature PHYSICAL Lightfall Sword explosion
 * (`eula_lightfall_dmg`) and the A1 physical follow-up (`eula_roiling_rime`).
 *
 * ELEMENT NUANCE (verified against the oracle tree, not assumed):
 *   - `burst_dmg` is CRYO (dmg_cryo / enemy_res_cryo).
 *   - `eula_lightfall_dmg` and `eula_roiling_rime` are PHYSICAL (dmg_phys /
 *     enemy_res_phys) — the Lightfall Sword deals physical damage. Both carry her
 *     `damageBonuses: ['dmg_burst_eula']` (a C4 burst-DMG key, 0 at C0; kept for
 *     fidelity, reads 0).
 *
 * LIGHTFALL STACKS: her `eula_lightfall_dmg` has a base term + a per-stack term
 * gated by `settings.eula_lightfall_stacks`. In the fixed solo build that setting
 * is unset → stacks = 0 → the stack term contributes 0, so the modelled feature
 * is the BASE table alone. (raw Multiplier.getStackMultiplier: `stacks =
 * settings[stacksLeveling] || 0`.) The stack term is therefore omitted, not a gap.
 *
 * A1 "Roiling Rime" (`eula_roiling_rime`): base Lightfall table × 0.5
 * (her `scalingSource:'ascension1', scalingMultiplier:0.5`). A1 is unconditional
 * at the A6 build, so it is always emitted. The ×0.5 is folded into a wrapped
 * TalentTable (the engine has no `scalingMultiplier` field; this is exact).
 *
 * SKIPPED (not in the solo-C0 fixture / unsupported, all benign):
 *   - Grimheart DEF shred + the Icewhirl Brand PHYS/CRYO res shred are
 *     ConditionStacks/ConditionBooleanLevels toggles, OFF by default — no res-shred
 *     applied (the fixture uses 10% base res, confirmed by the oracle tree).
 *   - Skill DEF-bonus, A4 (energy, text-only), all constellations (C0 build).
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Eula.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Eula)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Eula)
 *   raw/genshin_calc_pub/src/js/classes/Feature2/Multiplier.js (getStackMultiplier, scalingMultiplier)
 */

import type { Condition, DbObjectChar, Feature, TalentResolver, TalentTable } from "@genshin/types";
import { Eula as EulaStatTable } from "../generated/charTables.js";
import { Eula as EulaTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return EulaTalents.s1.p1;
      if (name === "normal_hit_2") return EulaTalents.s1.p2;
      if (name === "normal_hit_3") return EulaTalents.s1.p3;
      if (name === "normal_hit_4") return EulaTalents.s1.p4;
      if (name === "normal_hit_5") return EulaTalents.s1.p5;
      if (name === "charged_spin") return EulaTalents.s1.p6;
      if (name === "charged_final") return EulaTalents.s1.p7;
      if (name === "plunge") return EulaTalents.s1.p10;
      if (name === "plunge_low") return EulaTalents.s1.p11;
      if (name === "plunge_high") return EulaTalents.s1.p12;
    }
    if (talent === "skill") {
      if (name === "press_dmg") return EulaTalents.s2.p1;
      if (name === "hold_dmg") return EulaTalents.s2.p2;
      if (name === "eula_icewhirl_brand") return EulaTalents.s2.p3;
    }
    if (talent === "burst") {
      if (name === "burst_dmg") return EulaTalents.s3.p1;
      if (name === "eula_lightfall_base_dmg") return EulaTalents.s3.p2;
    }
    throw new Error(`eula talents: unknown path '${path}'`);
  },
};

/**
 * A1 Roiling Rime: the Lightfall base table scaled by 0.5 (her A1 scalingMultiplier).
 * Wrapping the base TalentTable reproduces `scalingMultiplier:0.5` exactly without
 * an engine change. raw: db/Char/Eula.js:353-365.
 */
const roilingRimeTable: TalentTable = {
  getValue: (level: number) => EulaTalents.s3.p2.getValue(level) * 0.5,
};

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
  // normal_hit_3: 2-hit multihit (same table ×2). Parent = total of both hits.
  // raw: FeatureDamageMultihit({ items: [{ hits: 2, multipliers: [p3] }] })
  {
    name: "normal_hit_3",
    category: "attack",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }] },
    ],
  },
  // Child hit: one of the 2 hits of normal_hit_3 (half the parent). Her isChild
  // row dropped → modelled as its own feature so it emits. raw: Eula.js:189-200.
  {
    name: "normal_hit_3_1",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }],
  },
  {
    name: "normal_hit_4",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4") }],
  },
  // normal_hit_5: 2-hit multihit (same table ×2). raw: Eula.js:212-227.
  {
    name: "normal_hit_5",
    category: "attack",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_5") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_5") }] },
    ],
  },
  // Child hit: one of the 2 hits of normal_hit_5. raw: Eula.js:228-239.
  {
    name: "normal_hit_5_1",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_5") }],
  },
  // --- Charged attacks (physical) ---
  {
    name: "charged_spin",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_spin") }],
  },
  {
    name: "charged_final",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_final") }],
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
  // --- Skill: Icetide Vortex (cryo) ---
  {
    name: "press_dmg",
    category: "skill",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.press_dmg") }],
  },
  {
    name: "hold_dmg",
    category: "skill",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.hold_dmg") }],
  },
  {
    name: "eula_icewhirl_brand",
    category: "skill",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.eula_icewhirl_brand") }],
  },
  // --- Burst: Glacial Illumination ---
  // burst_dmg: the cryo nuke.
  {
    name: "burst_dmg",
    category: "burst",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") }],
  },
  // eula_lightfall_dmg: the PHYSICAL Lightfall Sword explosion. Base table only
  // (stacks=0 in the solo build). dmg_burst_eula = C4 key, 0 at C0. raw: Eula.js:330-352.
  {
    name: "eula_lightfall_dmg",
    category: "burst",
    element: "physical",
    damageBonuses: ["dmg_burst_eula"],
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.eula_lightfall_base_dmg") }],
  },
  // eula_roiling_rime: A1 PHYSICAL follow-up = Lightfall base × 0.5. raw: Eula.js:353-365.
  {
    name: "eula_roiling_rime",
    category: "burst",
    element: "physical",
    damageBonuses: ["dmg_burst_eula"],
    multipliers: [{ leveling: "char_skill_burst", values: roilingRimeTable }],
  },
];

// ---------------------------------------------------------------------------
// Constellations (P2.C)
// ---------------------------------------------------------------------------
// C1 "Tidal Illusion": dmg_phys toggle → SKIP (ConditionBoolean).
// C2 "Lady of Seafoam": ConditionStatic with no real stats → SKIP (inert).
// C3 "Lawrence Pedigree": +3 Elemental Burst talent levels.
//    Raw cons[2]: Condition{ settings:{ char_skill_burst_bonus:3 } }
// C4 "The Obstinacy of One's Inferiors": dmg_burst_eula toggle → SKIP.
// C5 "Chivalric Quality": +3 Elemental Skill talent levels.
//    In her raw, C5 lives in char-level conditions (not the constellation array),
//    gated by ConditionConstellation(5) via subConditions. Modelled as the same
//    ConditionConstellation shape the engine already evaluates.
//    Raw Eula.js:369-372: Condition{ settings:{ char_skill_elemental_bonus:3 },
//      subConditions:[ConditionConstellation({constellation:5})] }
// C6 "Noble Obligation": ConditionStatic with no real stats → SKIP (inert).
//    The partyData C5 bonus (eula_char_skill_elemental_bonus) is party-only → ignored here.
//
// Sources: raw/genshin_calc_pub/src/js/db/Char/Eula.js:431-541

const constellationConditions: readonly Condition[] = [
  // C3: +3 Elemental Burst talent levels.
  { type: "constellation", constellation: 3, settings: { char_skill_burst_bonus: 3 } },
  // C5: +3 Elemental Skill talent levels.
  { type: "constellation", constellation: 5, settings: { char_skill_elemental_bonus: 3 } },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const eula: DbObjectChar = {
  name: "eula",
  gameId: 10000051,
  rarity: 5,
  element: "cryo",
  weapon: "claymore",
  origin: "mondstadt",
  statTable: EulaStatTable,
  talents,
  features,
  multipliers: [],
  conditions: constellationConditions,
};
