/**
 * Skirk — cryo sword ATK scaler (C0 solo, Seven-Phase Flash OFF).
 *
 * The fixture is the un-stanced (normal-mode) build: every emitted attack hit
 * uses her base normal/charged/plunge talents (`char_skill_attack`, physical/
 * sword element) — the Seven-Phase-Flash stance features (cryo, skill-leveled,
 * FeatureMultiplierSkirkNormal) are gated by `skirk_seven_phase_flash` which is
 * OFF, so the oracle never emits them. Burst (Havoc: Ruin) is the two cryo hits
 * `skirk_slash_dmg` (5-hit multihit → her engine reports the per-slash value)
 * and `skirk_final_dmg`; the conditional `skirk_burst_bonus` multiplier is gated
 * by `skirk_serpents_subtlety` (OFF) and FeatureMultiplierSkirkBurst's scaling
 * multiplier resolves to 1 in solo C0 (its `skirk_return_to_oblivion` A4 stacks
 * are 0), so the burst is a plain ATK×talent hit.
 *
 * Multihit / child structure (mirrors raw FeatureDamageMultihit + isChild pair):
 *   - normal_hit_3 parent = 2× s1.p3; child normal_hit_3_1 = 1× s1.p3 (emitted
 *     standalone — the fixture asserts `attack.normal_hit_3_1`).
 *   - charged_hit_total parent = 2× s1.p7; child charged_hit = 1× s1.p7 (emitted
 *     standalone — the fixture asserts `attack.charged_hit`).
 *
 * No always-on passive stat bonuses fold here: A1 (skirk_reason_beyond_reason)
 * and A4 (skirk_return_to_oblivion) are ConditionStacks (0 stacks in solo); the
 * cryo-DMG ascension secondary is already in the generated stat table. C0 build —
 * constellations skipped.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Skirk.js
 *   raw/genshin_calc_pub/src/js/classes/Feature2/Multiplier/SkirkBurst.js (scaling → 1 at 0 stacks)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Skirk)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Skirk)
 */

import type { DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Skirk as SkirkStatTable } from "../generated/charTables.js";
import { Skirk as SkirkTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return SkirkTalents.s1.p1;
      if (name === "normal_hit_2") return SkirkTalents.s1.p2;
      if (name === "normal_hit_3") return SkirkTalents.s1.p3;
      if (name === "normal_hit_4") return SkirkTalents.s1.p5;
      if (name === "normal_hit_5") return SkirkTalents.s1.p6;
      if (name === "charged_hit") return SkirkTalents.s1.p7;
      if (name === "plunge") return SkirkTalents.s1.p9;
      if (name === "plunge_low") return SkirkTalents.s1.p10;
      if (name === "plunge_high") return SkirkTalents.s1.p11;
    }
    if (talent === "burst") {
      if (name === "skirk_slash_dmg") return SkirkTalents.s3.p1;
      if (name === "skirk_final_dmg") return SkirkTalents.s3.p2;
    }
    throw new Error(`skirk talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Features (un-stanced build — physical normals/charged/plunge + cryo burst)
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (physical sword, no element override) ---
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
  // normal_hit_3: 2-hit multihit (same multiplier × 2). Parent models the total.
  // raw: FeatureDamageMultihit({ items: [{ hits: 2, multipliers: [s1.p3] }] })
  {
    name: "normal_hit_3",
    category: "attack",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }] },
    ],
  },
  // Child hit: one of the 2 hits of normal_hit_3 (half the parent total).
  // raw FeatureDamageNormal({ isChild: true, ... }) — emitted standalone here.
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
  {
    name: "normal_hit_5",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_5") }],
  },
  // --- Charged attack (physical sword) ---
  // charged_hit_total: 2-hit multihit parent (same multiplier × 2).
  // raw: FeatureDamageMultihit({ name: 'charged_hit_total', items: [{ hits: 2, multipliers: [s1.p7] }] })
  {
    name: "charged_hit_total",
    category: "attack",
    damageType: "charged",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }] },
    ],
  },
  // Child hit: one of the 2 charged hits (half the total). Emitted standalone.
  {
    name: "charged_hit",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }],
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
  // --- Burst: Havoc: Ruin (cryo) ---
  // skirk_slash_dmg (per-slash; 5-hit multihit in-game, her engine reports the
  // single-slash value). Base ATK multiplier — the serpent's-subtlety bonus and
  // the FeatureMultiplierSkirkBurst scaling are both inert in solo C0.
  {
    name: "skirk_slash_dmg",
    category: "burst",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.skirk_slash_dmg") }],
  },
  {
    name: "skirk_final_dmg",
    category: "burst",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.skirk_final_dmg") }],
  },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const skirk: DbObjectChar = {
  name: "skirk",
  gameId: 10000114,
  rarity: 5,
  element: "cryo",
  weapon: "sword",
  origin: "foreign",
  statTable: SkirkStatTable,
  talents,
  features,
  multipliers: [],
};
