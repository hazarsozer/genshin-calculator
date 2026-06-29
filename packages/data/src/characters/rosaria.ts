/**
 * Rosaria — cryo polearm ATK scaler.
 *
 * 5-hit normal combo (n3: 2-hit multihit → child _3_1; n5: 2-sub-hit multihit
 * → children _5_1/_5_2), cryo charged hit, plunge/low/high, cryo skill
 * (stab + slash, both as children with skill_dmg as multihit parent),
 * cryo burst (swing + lance_dmg children + ice lance periodoic, burst_dmg parent),
 * burst rosaria_crit_dmg_buff readout (A4 crit-rate share) — MODELLED below as a
 * FeatureStatic (scaling:"crit_rate_total"); the harness asserts it (non-damage output).
 *
 * No always-on passive ATK/crit bonuses: A1 is ConditionBoolean (toggle), A4 is
 * ConditionStatic text_only. The cryo stat bonus from the ascension passive is
 * already folded into the stat table via the generated charTables.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Rosaria.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Rosaria)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Rosaria)
 */

import type { CharPostEffect, Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Rosaria as RosariaStatTable } from "../generated/charTables.js";
import { Rosaria as RosariaTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return RosariaTalents.s1.p1;
      if (name === "normal_hit_2") return RosariaTalents.s1.p2;
      if (name === "normal_hit_3") return RosariaTalents.s1.p3;
      if (name === "normal_hit_4") return RosariaTalents.s1.p4;
      if (name === "normal_hit_5_1") return RosariaTalents.s1.p5;
      if (name === "normal_hit_5_2") return RosariaTalents.s1.p6;
      if (name === "charged_hit") return RosariaTalents.s1.p7;
      if (name === "plunge") return RosariaTalents.s1.p9;
      if (name === "plunge_low") return RosariaTalents.s1.p10;
      if (name === "plunge_high") return RosariaTalents.s1.p11;
    }
    if (talent === "skill") {
      if (name === "rosaria_stab_dmg") return RosariaTalents.s2.p1;
      if (name === "rosaria_slash_dmg") return RosariaTalents.s2.p2;
    }
    if (talent === "burst") {
      if (name === "rosaria_swing_dmg") return RosariaTalents.s3.p1;
      if (name === "rosaria_burst_lance_dmg") return RosariaTalents.s3.p2;
      if (name === "rosaria_ice_lance") return RosariaTalents.s3.p3;
    }
    throw new Error(`rosaria talents: unknown path '${path}'`);
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
  // normal_hit_3: 2-hit multihit (same multiplier × 2). Parent models the total.
  // raw: FeatureDamageMultihit({ items: [{ hits: 2, multipliers: [p3] }] })
  {
    name: "normal_hit_3",
    category: "attack",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }] },
    ],
  },
  // Child hit: one of the 2 hits of normal_hit_3 (half the parent total).
  // raw/genshin_calc_pub/src/js/db/Char/Rosaria.js:168-179
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
  // normal_hit_5: 2-sub-hit multihit with two different tables (_5_1 and _5_2).
  // raw: FeatureDamageMultihit({ items: [{ multipliers: [p5] }, { multipliers: [p6] }] })
  {
    name: "normal_hit_5",
    category: "attack",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_5_1") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_5_2") }] },
    ],
  },
  // Sub-hits of normal_hit_5 (individual components of the 2-part combo).
  // raw/genshin_calc_pub/src/js/db/Char/Rosaria.js:211-231
  {
    name: "normal_hit_5_1",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_5_1") }],
  },
  {
    name: "normal_hit_5_2",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_5_2") }],
  },
  // --- Charged attack (cryo polearm — physical by default, no element override) ---
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
  // --- Skill: Ravaging Confession (cryo) ---
  // skill_dmg: 2-hit multihit parent (stab + slash).
  // raw/genshin_calc_pub/src/js/db/Char/Rosaria.js:268-291
  {
    name: "skill_dmg",
    category: "skill",
    element: "cryo",
    items: [
      { multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.rosaria_stab_dmg") }] },
      { multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.rosaria_slash_dmg") }] },
    ],
  },
  // Individual skill hits (sub-components of skill_dmg, shown separately in fixture).
  // raw/genshin_calc_pub/src/js/db/Char/Rosaria.js:292-313
  {
    name: "rosaria_stab_dmg",
    category: "skill",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.rosaria_stab_dmg") }],
  },
  {
    name: "rosaria_slash_dmg",
    category: "skill",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.rosaria_slash_dmg") }],
  },
  // --- Burst: Rites of Termination (cryo) ---
  // burst_dmg: 2-hit multihit parent (swing + lance).
  // raw/genshin_calc_pub/src/js/db/Char/Rosaria.js:314-337
  {
    name: "burst_dmg",
    category: "burst",
    element: "cryo",
    items: [
      { multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.rosaria_swing_dmg") }] },
      { multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.rosaria_burst_lance_dmg") }] },
    ],
  },
  // Individual burst hits (sub-components of burst_dmg, shown separately in fixture).
  // raw/genshin_calc_pub/src/js/db/Char/Rosaria.js:338-360
  {
    name: "rosaria_swing_dmg",
    category: "burst",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.rosaria_swing_dmg") }],
  },
  {
    name: "rosaria_burst_lance_dmg",
    category: "burst",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.rosaria_burst_lance_dmg") }],
  },
  // rosaria_ice_lance: periodic cryo lance during burst.
  // raw/genshin_calc_pub/src/js/db/Char/Rosaria.js:360-369
  {
    name: "rosaria_ice_lance",
    category: "burst",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.rosaria_ice_lance") }],
  },
  // --- burst.rosaria_crit_dmg_buff: A4 "Shadow Samaritan" crit-rate-share readout (static) ---
  // Raw Rosaria.js:371-379 — PostEffectStats({ from:'crit_rate*', percent: StatTable('crit_rate', [15]),
  // statCap: ValueTable([15]) }), format:'percent'. (Despite the "crit_dmg" name, it scales off crit_rate —
  // it shows 15% of Rosaria's crit rate; this StatTable's [15] is distinct from the partyData A4's [0.15].)
  //
  // UNITS TRAP — getValue = 15 × 100 = 1500:
  //   Her getTree: value(=15)/100 (isPercent('crit_rate')) × crit_rate_DECIMAL (makeStatTotalItem('crit_rate*')
  //   → percent flag → crit_rate/100, a FRACTION e.g. 0.10) × 100 (format:'percent') = 15 × 0.10 = 1.5.
  //   In our engine crit_rate_total is ALREADY a FRACTION (buildStats /100's it, e.g. 0.10) and our path does
  //   NOT apply the percent-format ×100. So (getValue/100) × crit_rate_total = (1500/100) × 0.10 = 15 × 0.10 = 1.5
  //   ⇒ getValue = raw StatTable constant 15 × 100 = 1500 (the ×100 folds in the absent percent-format multiply;
  //   the 15 is NOT a bare baked number — it is the raw [15] × the percent fold). capValue = raw statCap 15 in
  //   display units (the 1.5 term is well below → inert). Modelled WITHOUT the samaritan gate. NEVER baked.
  //   (Do NOT emit a percent-form crit-rate stat — rejected as net-new surface for one readout.)
  {
    name: "rosaria_crit_dmg_buff",
    category: "burst",
    output: { kind: "static" },
    multipliers: [
      { scaling: "crit_rate_total", leveling: "", values: { getValue: () => 15 * 100 }, capValue: 15 },
    ],
  },
];

// ---------------------------------------------------------------------------
// Constellation conditions (P2.C Wave-1)
// ---------------------------------------------------------------------------
// SELF buffs (golden-blind SKIPPED — the port modelled only the party.* / no self mirror):
//   A1 "Regina Probationum": +12% CRIT Rate (ConditionBoolean, ascension passive). Ported below.
//   C1 "Unholy Revelation": +10% Normal-attack DMG (ConditionBoolean; atk_speed_normal is
//      display-only). Ported below, gated at C1.
//   C6 "Divine Retribution": enemy Physical RES -20% (ConditionBoolean). Ported below, gated at C6
//      (the SELF mirror of party.rosaria_divine_retribution).
// C2 "Land Without Promise": ConditionStatic with no real stats (description only) → SKIP.
// C3 "The Wages of Sin": +3 Elemental Skill talent levels.
//    Raw cons[2]: Condition{ settings:{ char_skill_elemental_bonus:3 } }
// C4 "Painful Grace": ConditionStatic with no real stats (description only) → SKIP.
// C5 "Last Rites": +3 Elemental Burst talent levels.
//    Raw cons[4]: Condition{ settings:{ char_skill_burst_bonus:3 } }
//
// Sources: raw/genshin_calc_pub/src/js/db/Char/Rosaria.js:381-469

const constellationConditions: readonly Condition[] = [
  // SELF "Regina Probationum" (A1) — +12% CRIT Rate, lifting the avg of every Rosaria damage
  // feature. ConditionBoolean ascension passive (rep at A6 → modelled ungated, the toggle is the
  // gate). Her engine gates it ONLY on ascension (no enemy-status subcondition), so a plain toggle
  // is faithful. Was golden-blind SKIPPED (no party.* mirror existed either).
  // Source: raw/genshin_calc_pub/src/js/db/Char/Rosaria.js:382-394 (conditions[0], info.ascension 1).
  { type: "boolean", name: "rosaria_regina_probationum", stats: { crit_rate: 12 } },
  // SELF "Unholy Revelation" (C1) — +10% Normal-attack DMG (atk_speed_normal:10 is display-only,
  // dropped). ConditionBoolean gated at C1 (lives in constellation[0] → THE CONSTELLATION IS A GATE).
  // Source: raw/genshin_calc_pub/src/js/db/Char/Rosaria.js:410-419 (constellation[0], ConditionBoolean).
  {
    type: "boolean",
    name: "rosaria_unholy_revelation",
    stats: { dmg_normal: 10 },
    condition: { type: "constellation", constellation: 1 },
  },
  // SELF "Divine Retribution" (C6) — enemy Physical RES -20%, buffing every Rosaria physical hit
  // (reaction.shatter too). ConditionBoolean gated at C6. SELF mirror of party.rosaria_divine_retribution.
  // Raw key `enemy_res_phys` → engine bag key `enemy_res_physical`.
  // Source: raw/genshin_calc_pub/src/js/db/Char/Rosaria.js:457-467 (constellation[5], ConditionBoolean).
  {
    type: "boolean",
    name: "rosaria_divine_retribution",
    stats: { enemy_res_physical: -20 },
    condition: { type: "constellation", constellation: 6 },
  },
  // C3: +3 Elemental Skill (Ravaging Confession).
  // Raw cons[2]: new Condition({ settings: { char_skill_elemental_bonus: 3 } }).
  { type: "constellation", constellation: 3, settings: { char_skill_elemental_bonus: 3 } },
  // C5: +3 Elemental Burst (Rites of Termination).
  // Raw cons[4]: new Condition({ settings: { char_skill_burst_bonus: 3 } }).
  { type: "constellation", constellation: 5, settings: { char_skill_burst_bonus: 3 } },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const rosaria: DbObjectChar = {
  name: "rosaria",
  gameId: 10000045,
  rarity: 4,
  element: "cryo",
  weapon: "polearm",
  origin: "mondstadt",
  statTable: RosariaStatTable,
  talents,
  features,
  multipliers: [],
  conditions: constellationConditions,
  // partyData — teammate kit buffs (P3.5.2 Bucket B).
  // Source: raw/genshin_calc_pub/src/js/db/Char/Rosaria.js:470-535
  // Scope: oracle-gated core only — A4 "Shadow Samaritan" crit-rate share.
  // Deferred to the P3.5.2 variant-rep pass:
  //   C6 "Divine Retribution": enemy_res_phys:-20 (static shred, separate oracle rep needed).
  partyData: {
    loadStats: {
      stats: ["crit_rate_total"],
    },
    conditions: [
      // ConditionNumber: lifts the teammate's crit_rate_total into the recipient's stat bag.
      { type: "number", name: "rosaria_crit_rate_total", max: 100 },
      // Shadow Samaritan master toggle (A4 passive; gates the crit-rate postEffect below).
      { type: "boolean", name: "party.rosaria_shadow_samaritan" },
    ],
    postEffects: [
      // A4 "Shadow Samaritan": shares 15% of Rosaria's crit rate, hard-capped at 15%.
      // Raw: percent: StatTable('crit_rate', [0.15]), statCap: ValueTable([15])
      // Source: raw/genshin_calc_pub/src/js/db/Char/Rosaria.js:523-532
      {
        fromStat: "rosaria_crit_rate_total",
        toStat: "crit_rate",
        ratio: 0.15,
        capValue: 15,
        conditions: [{ type: "boolean", name: "party.rosaria_shadow_samaritan" }],
      } satisfies CharPostEffect,
    ],
  },
};
