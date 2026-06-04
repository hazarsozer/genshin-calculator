/**
 * Skirk — cryo sword ATK scaler.
 *
 * Two mutually exclusive feature sets conditioned on `skirk_seven_phase_flash`:
 *
 * PHYSICAL (stance OFF, stanceCondRev = NOT skirk_seven_phase_flash):
 *   Normal hit 1/2/3/4/5, charged_hit_total, charged_hit, plunge/low/high.
 *   All physical ATK-scaled (`char_skill_attack`, phys element implied).
 *   Multihit / child structure:
 *     - normal_hit_3 parent = 2× s1.p3; child normal_hit_3_1 = 1× s1.p3.
 *     - charged_hit_total = 2× s1.p7; child charged_hit = 1× s1.p7.
 *   Solo fixture: stance OFF → only this set fires.
 *
 * STANCE (stance ON, stanceCond = skirk_seven_phase_flash):
 *   Same named features but cryo, `char_skill_elemental` leveled, damageBonuses
 *   ['dmg_normal_skirk'] (reads 0 at C0 / without a stance stacks). Multihit changes:
 *     - normal_hit_3 parent = 2× s2.p3; child normal_hit_3_1 = 1× s2.p3.
 *     - normal_hit_4 parent = 2× s2.p5; child normal_hit_4_1 = 1× s2.p5. ← NEW (s2 only)
 *     - charged_hit_total = 3× s2.p8; child charged_hit = 1× s2.p8. ← 3-hit in stance
 *   Gate-skirk party fixture: stance ON → only this set fires.
 *
 * Burst (Havoc: Ruin, cryo, always emitted):
 *   skirk_slash_dmg (5-hit per raw, engine reports per-slash), skirk_final_dmg.
 *   FeatureMultiplierSkirkBurst scaling → 1 at 0 skirk_return_to_oblivion stacks.
 *
 * A1 "skirk_mutual_weapons_mentorship": gated by party-elements(cryo+hydro).
 *   Contributes char_skill_elemental_bonus_2:+1 (skill talent level +1 for stance
 *   normals) + char_skill_elemental_bonus_party:+1 (party buff).
 *   Raw Skirk.js:597-607: ConditionBoolean(skirk_mutual_weapons_mentorship) gated
 *   by ConditionBooleanSkirkParty (cryo+hydro-ONLY).
 *
 * No other always-on passive stat bonuses: A1 (skirk_reason_beyond_reason) and
 * A4 (skirk_return_to_oblivion) are ConditionStacks (0 stacks). Cryo-DMG ascension
 * secondary and crit_dmg ascension secondary already in statTable. C0 build.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Skirk.js
 *   raw/genshin_calc_pub/src/js/classes/Feature2/Multiplier/SkirkBurst.js (scaling → 1 at 0 stacks)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Skirk)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Skirk)
 */

import type { Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
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
    // Skill (Seven-Phase Flash stance) talent table — s2.
    // Raw Skirk.js talent items: normal_hit_1→p1, 2→p2, 3→p3 (2-hit multihit),
    // 4→p5 (2-hit multihit, p4 is child copy), 5→p7, charged→p8 (3-hit), plunges→p10/11/12.
    if (talent === "skill") {
      if (name === "normal_hit_1") return SkirkTalents.s2.p1;
      if (name === "normal_hit_2") return SkirkTalents.s2.p2;
      if (name === "normal_hit_3") return SkirkTalents.s2.p3;
      if (name === "normal_hit_4") return SkirkTalents.s2.p5;
      if (name === "normal_hit_5") return SkirkTalents.s2.p7;
      if (name === "charged_hit") return SkirkTalents.s2.p8;
      if (name === "plunge") return SkirkTalents.s2.p10;
      if (name === "plunge_low") return SkirkTalents.s2.p11;
      if (name === "plunge_high") return SkirkTalents.s2.p12;
    }
    if (talent === "burst") {
      if (name === "skirk_slash_dmg") return SkirkTalents.s3.p1;
      if (name === "skirk_final_dmg") return SkirkTalents.s3.p2;
    }
    throw new Error(`skirk talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Shared condition shorthands
// ---------------------------------------------------------------------------

/** Gate: stanceCond — features active ONLY when Seven-Phase Flash is ON. */
const stanceCond: Condition = { type: "boolean", name: "skirk_seven_phase_flash" };

/** Gate: stanceCondRev — features active ONLY when Seven-Phase Flash is OFF. */
const stanceCondRev: Condition = { type: "not", items: [stanceCond] };

// ---------------------------------------------------------------------------
// Features (physical + stance + burst + constellation)
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // =========================================================================
  // PHYSICAL (stance OFF, stanceCondRev)
  // Raw: FeatureDamageNormal/Multihit/Charged/Plunge, condition: stanceCondRev.
  // Skirk.js:193-316.
  // =========================================================================

  // --- Normal attacks (physical sword, no element override) ---
  {
    name: "normal_hit_1",
    category: "attack",
    condition: stanceCondRev,
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1") }],
  },
  {
    name: "normal_hit_2",
    category: "attack",
    condition: stanceCondRev,
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2") }],
  },
  // normal_hit_3: 2-hit multihit parent; child normal_hit_3_1.
  {
    name: "normal_hit_3",
    category: "attack",
    condition: stanceCondRev,
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }] },
    ],
  },
  {
    name: "normal_hit_3_1",
    category: "attack",
    condition: stanceCondRev,
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }],
  },
  {
    name: "normal_hit_4",
    category: "attack",
    condition: stanceCondRev,
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4") }],
  },
  {
    name: "normal_hit_5",
    category: "attack",
    condition: stanceCondRev,
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_5") }],
  },
  // --- Charged attack (physical, 2-hit multihit) ---
  {
    name: "charged_hit_total",
    category: "attack",
    damageType: "charged",
    condition: stanceCondRev,
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }] },
    ],
  },
  {
    name: "charged_hit",
    category: "attack",
    damageType: "charged",
    condition: stanceCondRev,
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }],
  },
  // --- Plunge attacks (physical) ---
  {
    name: "plunge",
    category: "attack",
    damageType: "plunge",
    condition: stanceCondRev,
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge") }],
  },
  {
    name: "plunge_low",
    category: "attack",
    damageType: "plunge",
    condition: stanceCondRev,
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_low") }],
  },
  {
    name: "plunge_high",
    category: "attack",
    damageType: "plunge",
    condition: stanceCondRev,
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_high") }],
  },

  // =========================================================================
  // STANCE (Seven-Phase Flash ON, stanceCond)
  // Raw: FeatureDamageNormal/Multihit/Charged/Plunge with element:'cryo',
  // leveling:'char_skill_elemental', damageBonuses:['dmg_normal_skirk'],
  // condition: stanceCond. Skirk.js:318-475.
  // FeatureMultiplierSkirkNormal wraps the multiplier but at 0 skirk_return_to_oblivion
  // stacks it resolves to scalingMultiplier=1 → plain ATK×talent computation.
  // =========================================================================

  // --- Stance normals (cryo, skill-leveled) ---
  {
    name: "normal_hit_1",
    category: "attack",
    element: "cryo",
    damageBonuses: ["dmg_normal_skirk"],
    condition: stanceCond,
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.normal_hit_1") }],
  },
  {
    name: "normal_hit_2",
    category: "attack",
    element: "cryo",
    damageBonuses: ["dmg_normal_skirk"],
    condition: stanceCond,
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.normal_hit_2") }],
  },
  // normal_hit_3: 2-hit multihit + child. Raw Skirk.js:340-370.
  {
    name: "normal_hit_3",
    category: "attack",
    element: "cryo",
    damageBonuses: ["dmg_normal_skirk"],
    condition: stanceCond,
    items: [
      { multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.normal_hit_3") }] },
      { multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.normal_hit_3") }] },
    ],
  },
  {
    name: "normal_hit_3_1",
    category: "attack",
    element: "cryo",
    damageBonuses: ["dmg_normal_skirk"],
    condition: stanceCond,
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.normal_hit_3") }],
  },
  // normal_hit_4: 2-hit multihit + child normal_hit_4_1. Only in stance (no s1 equiv).
  // Raw Skirk.js:372-403; s2.p5 (p4 is a child duplicate, skipped; p5 = the 2-hit parent entry).
  {
    name: "normal_hit_4",
    category: "attack",
    element: "cryo",
    damageBonuses: ["dmg_normal_skirk"],
    condition: stanceCond,
    items: [
      { multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.normal_hit_4") }] },
      { multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.normal_hit_4") }] },
    ],
  },
  {
    name: "normal_hit_4_1",
    category: "attack",
    element: "cryo",
    damageBonuses: ["dmg_normal_skirk"],
    condition: stanceCond,
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.normal_hit_4") }],
  },
  {
    name: "normal_hit_5",
    category: "attack",
    element: "cryo",
    damageBonuses: ["dmg_normal_skirk"],
    condition: stanceCond,
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.normal_hit_5") }],
  },
  // --- Stance charged (cryo, 3-hit multihit). Raw Skirk.js:415-444; s2.p8.
  {
    name: "charged_hit_total",
    category: "attack",
    element: "cryo",
    damageType: "charged",
    condition: stanceCond,
    items: [
      { multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.charged_hit") }] },
      { multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.charged_hit") }] },
      { multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.charged_hit") }] },
    ],
  },
  {
    name: "charged_hit",
    category: "attack",
    element: "cryo",
    damageType: "charged",
    condition: stanceCond,
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.charged_hit") }],
  },
  // --- Stance plunges (cryo, skill-leveled). Raw Skirk.js:446-474; s2.p10/11/12.
  {
    name: "plunge",
    category: "attack",
    element: "cryo",
    damageType: "plunge",
    condition: stanceCond,
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.plunge") }],
  },
  {
    name: "plunge_low",
    category: "attack",
    element: "cryo",
    damageType: "plunge",
    condition: stanceCond,
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.plunge_low") }],
  },
  {
    name: "plunge_high",
    category: "attack",
    element: "cryo",
    damageType: "plunge",
    condition: stanceCond,
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.plunge_high") }],
  },

  // =========================================================================
  // BURST: Havoc: Ruin (cryo, always emitted — no stanceCond)
  // =========================================================================

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

  // =========================================================================
  // CONSTELLATION features
  // =========================================================================

  // --- C1 "Far to Fall": Crystal Blade coordinated attack (cryo charged DMG) ---
  // FeatureDamageCharged, category:'other', fixed 500% ATK. Raw Skirk.js:506-517.
  {
    name: "skirk_crystal_blade_dmg",
    damageType: "charged",
    element: "cryo",
    condition: { type: "constellation", constellation: 1 },
    multipliers: [
      {
        leveling: "",
        values: { getValue: (_level: number) => 500 },
        source: "constellation1",
      },
    ],
  },
  // --- C6 "To the Source": burst coordinated attack (cryo burst DMG) ---
  // FeatureDamageBurst, category:'other', 750% ATK. Raw Skirk.js:518-529.
  {
    name: "skirk_burst_coordinated_attack_dmg",
    damageType: "burst",
    element: "cryo",
    condition: { type: "constellation", constellation: 6 },
    multipliers: [
      {
        leveling: "",
        values: { getValue: (_level: number) => 750 },
        source: "constellation6",
      },
    ],
  },
  // --- C6 "To the Source": normal coordinated attack (cryo normal DMG) ---
  // FeatureDamageNormal, category:'other', 180% ATK. Raw Skirk.js:530-542.
  {
    name: "skirk_normal_coordinated_attack_dmg",
    damageType: "normal",
    element: "cryo",
    damageBonuses: ["dmg_normal_skirk"],
    condition: { type: "constellation", constellation: 6 },
    multipliers: [
      {
        leveling: "",
        values: { getValue: (_level: number) => 180 },
        source: "constellation6",
      },
    ],
  },
  // --- C6 "To the Source": charged coordinated attack (cryo charged DMG) ---
  // FeatureDamageCharged, category:'other', 180% ATK. Raw Skirk.js:543-554.
  {
    name: "skirk_charged_coordinated_attack_dmg",
    damageType: "charged",
    element: "cryo",
    condition: { type: "constellation", constellation: 6 },
    multipliers: [
      {
        leveling: "",
        values: { getValue: (_level: number) => 180 },
        source: "constellation6",
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Conditions (party-gated passive + constellation conditions)
// ---------------------------------------------------------------------------
// A1 "skirk_mutual_weapons_mentorship": gated by party-elements(cryo+hydro).
//    Settings: char_skill_elemental_bonus_2:+1 (stance normals talent level +1)
//    + char_skill_elemental_bonus_party:+1 (party buff for other members).
//    Inert solo: no partner element → party-elements gate false.
//    Raw Skirk.js:597-607: ConditionBoolean(skirk_mutual_weapons_mentorship)
//    condition: ConditionBooleanSkirkParty() — cryo+hydro-ONLY party gate.
//
// C1: skirk_crystal_blade_dmg feature (cons-added, gated above).
// C2: ConditionBoolean toggle (atk_percent:70, gated by stanceCond) → SKIP (toggle OFF).
// C3: +3 levels to Burst (Havoc: Ruin). Raw cons[2] settings char_skill_burst_bonus:3.
// C4: ConditionBoolean+ConditionLevels (atk stacks) → SKIP (toggle OFF).
// C5: +3 levels to Skill (Warp). Raw cons[4] settings char_skill_elemental_bonus:3.
// C6: skirk_burst/normal/charged_coordinated_attack_dmg features (cons-added, gated above).
//     Raw cons[5] ConditionStatic with text_percent_dmg_1/2 → display-only, SKIP.
// Raw: raw/genshin_calc_pub/src/js/db/Char/Skirk.js constellation array (Skirk.js:649-714).
const constellationConditions: readonly Condition[] = [
  // A1 party passive: char_skill_elemental_bonus_2:+1, char_skill_elemental_bonus_party:+1.
  // Active iff the party is cryo+hydro-ONLY (gate-skirk fixture satisfies this).
  {
    type: "boolean",
    name: "skirk_mutual_weapons_mentorship",
    settings: { char_skill_elemental_bonus_2: 1, char_skill_elemental_bonus_party: 1 },
    condition: { type: "party-elements", elements: ["cryo", "hydro"] },
  },
  // C3: +3 levels to Havoc: Ruin (elemental burst). Raw cons[2].
  { type: "constellation", constellation: 3, settings: { char_skill_burst_bonus: 3 } },
  // C5: +3 levels to Warp (elemental skill). Raw cons[4].
  { type: "constellation", constellation: 5, settings: { char_skill_elemental_bonus: 3 } },
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
  conditions: constellationConditions,
  // partyData — teammate kit buffs (P3.5.2 Bucket A)
  // A4 "Mutual Weapons Mentorship": ConditionBoolean(party.skirk_mutual_weapons_mentorship)
  //   → settings: { char_skill_elemental_bonus_2: 1, char_skill_elemental_bonus_party: 1 }
  //   gated by ConditionBooleanSkirkParty (party must be ONLY cryo+hydro).
  //   Maps to {type:"party-elements", elements:["cryo","hydro"]} as the .condition gate.
  //   Source: raw/genshin_calc_pub/src/js/db/Char/Skirk.js partyData.conditions[0]
  partyData: {
    conditions: [
      {
        type: "boolean",
        name: "party.skirk_mutual_weapons_mentorship",
        settings: { char_skill_elemental_bonus_2: 1, char_skill_elemental_bonus_party: 1 },
        condition: { type: "party-elements", elements: ["cryo", "hydro"] },
      },
    ],
  },
};
