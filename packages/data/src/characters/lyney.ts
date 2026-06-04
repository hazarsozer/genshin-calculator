/**
 * Lyney — pyro bow ATK scaler.
 *
 * 4-hit normal combo (physical bow; n3 is a 2-hit multihit → child _3_1 modelled
 * as its own row at 1× the n3 multiplier). Charged attacks: physical `aimed`,
 * pyro `lyney_charged_dmg` (full-charge aimed), and the Grin-Malkin-hat / Prop
 * Surplus charged instances `lyney_prop_arrow_dmg`, `lyney_pyrotechnic_strike_dmg`,
 * and `spiritbreath_thorn_dmg` (all pyro, damageType "charged"). Plunge collision +
 * low/high shockwaves (physical). Pyro skill (`skill_dmg`) and pyro burst
 * (`burst_dmg` + `lyney_explosive_firework_dmg`).
 *
 * Reactions (overloaded/burning/burgeon/electrocharged/shatter) are auto-emitted
 * by `compileCharacter` from the pyro element — not declared here.
 *
 * SKIPPED (display-only / out of scope):
 *   - `lyney_hat_hp` (FeaturePostEffectValue / PostEffectStatsHP — HP-magnitude
 *     readout; fixture damageType "", not a damage triple).
 *   - `lyney_hp_regeneration` (FeatureHeal; fixture all-zero, damageType "").
 *
 * CONDITIONAL BONUSES — ALL OFF in the fixed C0 / settings:{} build, so none folded:
 *   - skill_dmg's second multiplier `lyney_skill_dmg_bonus` is `stacksLeveling:
 *     'lyney_surplus_stacks'` → 0 at 0 stacks. Modelled with the base multiplier
 *     (s2.p1) only; the stack term contributes 0. (Lyney.js:334-338)
 *   - A1 "Perilous Performance" +80% charged (ConditionBoolean toggle, off) — the
 *     second multiplier on `lyney_pyrotechnic_strike_dmg` is gated by it. (Lyney.js:292-299)
 *   - A4 "Conclusive Ovation" pyro DMG% (ConditionStaticLevel gated by all-pyro party
 *     + pyro-statused enemy) — off; nothing in baseStats/damageBonuses. (Lyney.js:400-416)
 *   - All constellations (C0 build): C6 `lyney_pyrotechnic_strike_reprised_dmg`,
 *     C2 crit_dmg, C4 res shred — omitted.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Lyney.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Lyney)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Lyney)
 */

import type { Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Lyney as LyneyStatTable } from "../generated/charTables.js";
import { Lyney as LyneyTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1")                 return LyneyTalents.s1.p1;
      if (name === "normal_hit_2")                 return LyneyTalents.s1.p2;
      if (name === "normal_hit_3")                 return LyneyTalents.s1.p3;
      if (name === "normal_hit_4")                 return LyneyTalents.s1.p5;
      if (name === "plunge")                       return LyneyTalents.s1.p6;
      if (name === "plunge_low")                   return LyneyTalents.s1.p7;
      if (name === "plunge_high")                  return LyneyTalents.s1.p8;
      if (name === "aimed")                        return LyneyTalents.s1.p9;
      if (name === "lyney_charged_dmg")            return LyneyTalents.s1.p10;
      if (name === "lyney_prop_arrow_dmg")         return LyneyTalents.s1.p11;
      if (name === "lyney_pyrotechnic_strike_dmg")          return LyneyTalents.s1.p15;
      if (name === "lyney_pyrotechnic_strike_reprised_dmg") return LyneyTalents.s1.p15;
      if (name === "spiritbreath_thorn_dmg")                return LyneyTalents.s1.p16;
    }
    if (talent === "skill") {
      if (name === "skill_dmg") return LyneyTalents.s2.p1;
    }
    if (talent === "burst") {
      if (name === "burst_dmg")                    return LyneyTalents.s3.p1;
      if (name === "lyney_explosive_firework_dmg") return LyneyTalents.s3.p2;
    }
    throw new Error(`lyney talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (physical bow) ---
  // raw: FeatureDamageNormal normal_hit_1 / normal_hit_2
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
  // normal_hit_3: 2-hit multihit (same p3 multiplier × 2). Parent models the total.
  // raw: FeatureDamageMultihit({ items: [{ hits: 2, multipliers: [p3] }] }) — Lyney.js:179-195
  {
    name: "normal_hit_3",
    category: "attack",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }] },
    ],
  },
  // normal_hit_3_1: one of the 2 hits of normal_hit_3 (half the parent total).
  // raw marks this isChild:true (Lyney.js:196-206); we drop the flag so it emits
  // and matches the fixture's standalone `attack.normal_hit_3_1` row (= 1× p3).
  {
    name: "normal_hit_3_1",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }],
  },
  // normal_hit_4: single FeatureDamageNormal (maps to s1.p5, NOT p4). Lyney.js:207-215
  {
    name: "normal_hit_4",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4") }],
  },
  // --- Charged attacks (bow) ---
  // raw: FeatureDamageChargedAimed aimed (physical, no element) — Lyney.js:243-251
  {
    name: "aimed",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.aimed") }],
  },
  // raw: FeatureDamageChargedAimed lyney_charged_dmg (pyro full-charge) — Lyney.js:252-261
  {
    name: "lyney_charged_dmg",
    category: "attack",
    damageType: "charged",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.lyney_charged_dmg") }],
  },
  // raw: FeatureDamageCharged lyney_prop_arrow_dmg (pyro) — Lyney.js:262-271
  {
    name: "lyney_prop_arrow_dmg",
    category: "attack",
    damageType: "charged",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.lyney_prop_arrow_dmg") }],
  },
  // raw: FeatureDamageCharged lyney_pyrotechnic_strike_dmg (pyro). The A1 +80% second
  // multiplier is ConditionBoolean-gated (off in fixed build) → base term only. Lyney.js:284-301
  {
    name: "lyney_pyrotechnic_strike_dmg",
    category: "attack",
    damageType: "charged",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.lyney_pyrotechnic_strike_dmg") }],
  },
  // raw: FeatureDamageCharged spiritbreath_thorn_dmg (pyro, cannotReact — irrelevant for
  // the non-reacted triple). Lyney.js:315-325
  {
    name: "spiritbreath_thorn_dmg",
    category: "attack",
    damageType: "charged",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.spiritbreath_thorn_dmg") }],
  },
  // --- C6 "Guarded Smile": reprised pyrotechnic strike, 80% of lyney_pyrotechnic_strike_dmg.
  // Raw: FeatureDamageCharged with scalingMultiplier: C6Dmg/100 (= 0.80) and
  // condition: new ConditionConstellation({constellation:6}). Lyney.js:303-314
  {
    name: "lyney_pyrotechnic_strike_reprised_dmg",
    category: "attack",
    damageType: "charged",
    element: "pyro",
    condition: { type: "constellation", constellation: 6 },
    multipliers: [
      {
        leveling: "char_skill_attack",
        values: talents.get("attack.lyney_pyrotechnic_strike_reprised_dmg"),
        scalingMultiplier: 0.8,
        source: "constellation6",
      },
    ],
  },
  // --- Plunge attacks (physical bow) ---
  // raw: FeatureDamagePlungeCollision plunge — Lyney.js:216-224
  {
    name: "plunge",
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge") }],
  },
  // raw: FeatureDamagePlungeShockWave plunge_low — Lyney.js:225-233
  {
    name: "plunge_low",
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_low") }],
  },
  // raw: FeatureDamagePlungeShockWave plunge_high — Lyney.js:234-242
  {
    name: "plunge_high",
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_high") }],
  },
  // --- Skill: Bewildering Lights (pyro) ---
  // raw: FeatureDamageSkill skill_dmg. Second multiplier (lyney_skill_dmg_bonus) is
  // stacksLeveling:'lyney_surplus_stacks' → 0 at 0 stacks; base term only. Lyney.js:326-340
  {
    name: "skill_dmg",
    category: "skill",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.skill_dmg") }],
  },
  // --- Burst: Wondrous Trickery / Miracle Parade (pyro) ---
  // raw: FeatureDamageBurst burst_dmg — Lyney.js:353-362
  {
    name: "burst_dmg",
    category: "burst",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") }],
  },
  // raw: FeatureDamageBurst lyney_explosive_firework_dmg — Lyney.js:363-372
  {
    name: "lyney_explosive_firework_dmg",
    category: "burst",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.lyney_explosive_firework_dmg") }],
  },
];

// ---------------------------------------------------------------------------
// Constellation conditions (P2.C)
// ---------------------------------------------------------------------------
// C1 "Whimsical Wonders": ConditionStatic (display-only) → SKIP.
// C2 "Loquacious Cajoling": ConditionStacks with crit_dmg — stacks toggle → SKIP.
// C3 "Opportunistic Impresario": +3 levels to Normal Attack. Raw cons[2] settings char_skill_attack_bonus:3.
// C4 "Well-Versed, Well-Rehearsed": ConditionBoolean toggle (enemy_res_pyro) → SKIP.
// C5 "Beguiling Shadowstep": +3 levels to Miracle Parade (burst). Raw cons[4] settings char_skill_burst_bonus:3.
// C6 "Guarded Smile": cons-added lyney_pyrotechnic_strike_reprised_dmg feature (above) — no stat here.
// Raw: db/Char/Lyney.js constellation array (Lyney.js:418-483).
const constellationConditions: readonly Condition[] = [
  // C3: +3 levels to Normal Attack (attack). Raw cons[2] settings char_skill_attack_bonus:3.
  { type: "constellation", constellation: 3, settings: { char_skill_attack_bonus: 3 } },
  // C5: +3 levels to Miracle Parade (burst). Raw cons[4] settings char_skill_burst_bonus:3.
  { type: "constellation", constellation: 5, settings: { char_skill_burst_bonus: 3 } },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const lyney: DbObjectChar = {
  name: "lyney",
  gameId: 10000084,
  rarity: 5,
  element: "pyro",
  weapon: "bow",
  origin: "fontaine",
  statTable: LyneyStatTable,
  talents,
  features,
  multipliers: [],
  conditions: constellationConditions,
  // C4 "Well-Versed, Well-Rehearsed" — enemy Pyro RES -20%.
  // Source: raw/genshin_calc_pub/src/js/db/Char/Lyney.js (partyData conditions)
  partyData: {
    conditions: [
      {
        type: "static",
        stats: { enemy_res_pyro: -20 },
        condition: { type: "boolean", name: "party.lyney_well_versed_well_rehearsed" },
      },
    ],
  },
};
