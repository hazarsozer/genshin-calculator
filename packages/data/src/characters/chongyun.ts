/**
 * Chongyun — cryo claymore ATK scaler.
 *
 * Standard 4-hit normal combo, charged spin/final, plunge, cryo skill,
 * cryo burst (3 swords). No post-effects at C0.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Chongyun.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Chongyun)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Chongyun)
 */

import type { Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Chongyun as ChongyunStatTable } from "../generated/charTables.js";
import { Chongyun as ChongyunTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return ChongyunTalents.s1.p1;
      if (name === "normal_hit_2") return ChongyunTalents.s1.p2;
      if (name === "normal_hit_3") return ChongyunTalents.s1.p3;
      if (name === "normal_hit_4") return ChongyunTalents.s1.p4;
      if (name === "charged_spin") return ChongyunTalents.s1.p5;
      if (name === "charged_final") return ChongyunTalents.s1.p6;
      if (name === "plunge") return ChongyunTalents.s1.p9;
      if (name === "plunge_low") return ChongyunTalents.s1.p10;
      if (name === "plunge_high") return ChongyunTalents.s1.p11;
    }
    if (talent === "skill") {
      if (name === "skill_dmg") return ChongyunTalents.s2.p1;
    }
    if (talent === "burst") {
      if (name === "burst_dmg") return ChongyunTalents.s3.p1;
    }
    throw new Error(`chongyun talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks ---
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
  // --- Charged attacks ---
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
  // --- Plunge attacks ---
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
  // --- C1 "Ice Unleashed": cons-added cryo ATK hit at 50% ATK.
  // Raw is base FeatureDamage (NOT FeatureDamageNormal) with category:'attack' →
  // damageType:"" suppresses dmg_normal; gets dmg_all+dmg_cryo only.
  // Fixed ValueTable([50]); source:'constellation1'. Raw Chongyun.js:165-176.
  {
    name: "chongyun_ice_unleashed",
    category: "attack",
    element: "cryo",
    damageType: "",
    condition: { type: "constellation", constellation: 1 },
    multipliers: [
      { leveling: "char_skill_attack", values: { getValue: (_level: number) => 50 }, source: "constellation1" },
    ],
  },
  // --- Skill: Chonghua's Layered Frost (cryo) ---
  {
    name: "skill_dmg",
    category: "skill",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.skill_dmg") }],
  },
  // --- Burst: Cloud-Parting Star (cryo) ---
  // damageBonuses: ['dmg_burst_chongyun'] — raw Chongyun.js:235. The C6 "Rally of Four Blades"
  // toggle (chongyun_rally_of_four_blades, below) feeds it; base-inert until C6+toggle (absent key
  // reads 0). Was missing in the port → the C6 self burst buff couldn't reach it.
  {
    name: "burst_dmg",
    category: "burst",
    element: "cryo",
    damageBonuses: ["dmg_burst_chongyun"],
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") }],
  },
];

// ---------------------------------------------------------------------------
// Constellation conditions (P2.C)
// ---------------------------------------------------------------------------
// C1 "Ice Unleashed": cons-added feature chongyun_ice_unleashed above.
//   ConditionStatic in cons array (display-only text_percent_dmg:50) → SKIP.
// C2 "Atmospheric Revolution": ConditionStatic (display) + Condition(recovery)
//   behind ConditionBoolean(chongyun_frost_field) toggle → SKIP (toggle-gated).
// C3: +3 levels to Cloud-Parting Star (burst). Raw cons[2] settings char_skill_burst_bonus:3.
// C4 "Frozen Skies": ConditionStatic display-only → SKIP.
// C5: +3 levels to Chonghua's Layered Frost (skill). Raw cons[4] settings char_skill_elemental_bonus:3.
// C6 "Rally of Four Blades": SELF dmg_burst_chongyun +15 toggle (modelled below).
// Raw: db/Char/Chongyun.js constellation array (Chongyun.js:309-379).
//
// SELF buffs (were golden-blind SKIPPED — the port modelled only the party.* teammate mirrors, and
// the self toggles are OFF in the fixed canonical build, so the 58k DAMAGE goldens never exercised
// them; a diff-parity sweep surfaced her own normals/charged/plunge + burst + reactions diverging):
//   - Chonghua Frost Field "Layered Frost": SELF cryo infusion (attack_infusion:"cryo") on her own
//     physical normals/charged/plunge, gated by the chongyun_frost_field toggle. The SELF mirror of
//     party.chongyun_layered_frost (partyData). raw Chongyun.js:270-282 (ConditionStatic settings
//     {attack_infusion_cryo:1}, subConditions:[ConditionBoolean(chongyun_frost_field)]) — collapsed
//     to attack_infusion:"cryo" gated by the toggle (the Diluc-dawn/Dori-sprinkling infusion pattern).
//   - A4 "Rimechaser Blade": SELF enemy_res_cryo −10 (A4ResCryo), gated by the chongyun_rimechaser_
//     blade toggle (her A4 ConditionBoolean, asc-4 auto-true at the rep — like the party mirror
//     enemy_res_cryo −10, no ascension gate needed). raw Chongyun.js:295-307.
const constellationConditions: readonly Condition[] = [
  // C3: +3 levels to Cloud-Parting Star (burst). Raw Chongyun.js:340-346.
  { type: "constellation", constellation: 3, settings: { char_skill_burst_bonus: 3 } },
  // C5: +3 levels to Chonghua's Layered Frost (skill). Raw Chongyun.js:356-362.
  { type: "constellation", constellation: 5, settings: { char_skill_elemental_bonus: 3 } },
  // SELF "Layered Frost" cryo infusion — her own physical normals/charged/plunge become cryo while
  // her Frost Field is active. Gated by the chongyun_frost_field toggle (the SELF mirror of the
  // party.chongyun_layered_frost infusion). Base-inert when untoggled. raw Chongyun.js:270-282.
  {
    type: "boolean",
    name: "chongyun_frost_field",
    settings: { attack_infusion: "cryo" },
  },
  // SELF A4 "Rimechaser Blade" — enemy Cryo RES −10, lifting her own cryo hits + cryo reactions.
  // Gated by the chongyun_rimechaser_blade toggle (asc-4 auto-true at rep asc 6). The SELF mirror of
  // the party.chongyun_rimechaser_blade res-shred. raw Chongyun.js:295-307 (A4ResCryo = −10).
  {
    type: "boolean",
    name: "chongyun_rimechaser_blade",
    stats: { enemy_res_cryo: -10 },
  },
  // SELF C6 "Rally of Four Blades" — +15% Burst DMG (dmg_burst_chongyun → burst_dmg, which declares
  // it in damageBonuses). ConditionBoolean toggle gated at C6 (constellation[5] → THE CONSTELLATION
  // IS A GATE; base-inert below C6 / when untoggled). raw Chongyun.js:366-378 (C6BurstDamage = 15).
  {
    type: "boolean",
    name: "chongyun_rally_of_four_blades",
    stats: { dmg_burst_chongyun: 15 },
    condition: { type: "constellation", constellation: 6 },
  },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const chongyun: DbObjectChar = {
  name: "chongyun",
  gameId: 10000036,
  rarity: 4,
  element: "cryo",
  weapon: "claymore",
  origin: "liyue",
  statTable: ChongyunStatTable,
  talents,
  features,
  multipliers: [],
  conditions: constellationConditions,
  // Teammate buffs (Chonghua's Frost Field):
  //
  //  - CRYO MELEE-INFUSION (Layered Frost): her field infuses melee teammates'
  //    normal/charged/plunge with cryo. Raw splits this into ALLOWED-infusion
  //    (Condition{ settings:{allowed_infusion_cryo:1} } gated by a melee weapon-type
  //    sub-condition) + APPLIED-infusion (ConditionBoolean party.chongyun_layered_frost
  //    { settings:{attack_infusion_cryo:1} }, the field toggle). Raw Chongyun.js partyData
  //    conditions[0]+[1].
  //    Bridge: our infusion model is a SINGLE `attack_infusion` STRING — resolveElement
  //    (compileFeature.ts:178) returns it for an un-elemented attack/plunge feature, else
  //    "physical". Her per-element flags (allowed_infusion_cryo + attack_infusion_cryo)
  //    have no analogue. So we collapse ALLOWED+APPLIED into one condition that sets
  //    attack_infusion:"cryo", gated by the RECIPIENT's weapon type (buildStats injects
  //    weapon_type:input.char.weapon → the weapon-type condition gates on it). Faithful
  //    for a single-teammate rep: the gate IS her allowed(melee) check; the field toggle
  //    is assumed on (the buff only exists when her field is active).
  //  - A4 "Rimechaser Blade": enemy Cryo RES -10% (the second damage-affecting stat).
  //
  // Damage-inert (no fixture delta; ported as-is or omitted with reason):
  //   - Frost Field A1: atk_speed_normal (Steady Breathing) — display-only, SKIP.
  //   - C2 "Atmospheric Revolution": recovery/text_percent_cd — display-only, SKIP.
  // Source: raw/genshin_calc_pub/src/js/db/Char/Chongyun.js (partyData conditions)
  partyData: {
    conditions: [
      {
        type: "boolean",
        name: "party.chongyun_layered_frost",
        settings: { attack_infusion: "cryo" },
        condition: { type: "weapon-type", types: ["sword", "claymore", "polearm"] },
      },
      {
        type: "static",
        stats: { enemy_res_cryo: -10 },
        condition: { type: "boolean", name: "party.chongyun_rimechaser_blade" },
      },
    ],
  },
};
