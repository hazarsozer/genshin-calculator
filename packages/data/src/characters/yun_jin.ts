/**
 * Yun Jin — geo polearm, ATK-based normals, DEF-based skill.
 *
 * 5-hit normal combo (n3: 2-hit multihit → children _3_1/_3_2;
 * n4: 2-hit multihit → children _4_1/_4_2), charged, plunge/low/high.
 * Skill: Opening Flourish (press + 2 charge levels), DEF-based geo.
 * Burst: Cliffbreaker's Banner (ATK-based geo, burst_dmg).
 *
 * Yun Jin's party buff (Flying Cloud Flag Formation): adds a DEF-based flat
 * additive to teammate normal hits when the yunjin_flag toggle is ON. Modelled as
 * `partyData` (the burst-leveled ratio + a per-stacks bonusValues term; see below).
 * Off at the canonical C0 solo build (no party / flag off) → her own direct damage
 * features are unaffected.
 *
 * Non-damage outputs (output: { kind: "shield" }):
 *   - skill.shield — HP-scaled skill shield (s2.p1 % + s2.p2 flat)
 *
 * Non-damage outputs also modelled (P3.5.3):
 *   - burst.yunjin_dmg_bonus (PostEffectStatsDef): Flying Cloud NA-DMG bonus = (s3.p2×0.01 +
 *     traditionalist-stacks bonusValues)×DEF (her own def_total), via bonusLeveling/bonusValues.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/YunJin.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (YunJin)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (YunJin)
 */

import type { CharMultiplier, Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { YunJin as YunJinStatTable } from "../generated/charTables.js";
import { YunJin as YunJinTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return YunJinTalents.s1.p1;
      if (name === "normal_hit_2") return YunJinTalents.s1.p2;
      if (name === "normal_hit_3_1") return YunJinTalents.s1.p3;
      if (name === "normal_hit_3_2") return YunJinTalents.s1.p4;
      if (name === "normal_hit_4_1") return YunJinTalents.s1.p5;
      if (name === "normal_hit_4_2") return YunJinTalents.s1.p6;
      if (name === "normal_hit_5") return YunJinTalents.s1.p7;
      if (name === "charged_hit") return YunJinTalents.s1.p8;
      if (name === "plunge") return YunJinTalents.s1.p10;
      if (name === "plunge_low") return YunJinTalents.s1.p11;
      if (name === "plunge_high") return YunJinTalents.s1.p12;
    }
    if (talent === "skill") {
      if (name === "press_dmg") return YunJinTalents.s2.p3;
      if (name === "yunjin_charge_1_dmg") return YunJinTalents.s2.p4;
      if (name === "yunjin_charge_2_dmg") return YunJinTalents.s2.p5;
      if (name === "shield_percent") return YunJinTalents.s2.p1;
      if (name === "shield_flat")    return YunJinTalents.s2.p2;
    }
    if (talent === "burst") {
      if (name === "burst_dmg") return YunJinTalents.s3.p1;
      // DMG Bonus % of DEF per Normal hit (Flying Cloud Flag Formation), burst-leveled.
      // raw/genshin_calc_pub/src/js/db/Char/YunJin.js:124-126 (StatTable s3.p2, unit:'def').
      if (name === "yunjin_dmg_bonus") return YunJinTalents.s3.p2;
    }
    throw new Error(`yun_jin talents: unknown path '${path}'`);
  },
};

// bonusValues — her `new ValueTable([2.5, 5, 7.5, 11.5])` (the Traditionalist stacks bonus,
// 1-indexed by `yunjin_traditionalist_stacks`). Replicates ValueTable.getValue exactly
// (raw/.../classes/ValueTable.js): level <= 0 → 0; level > length → last; else values[level-1].
// Used by BOTH the teammate NA-DMG multiplier (partyData) AND the self burst.yunjin_dmg_bonus readout.
const YUNJIN_TRAD_BONUS_VALUES = [2.5, 5, 7.5, 11.5] as const;
const yunjinTradBonus = {
  getValue: (level: number): number =>
    level > 0 ? YUNJIN_TRAD_BONUS_VALUES[Math.min(level, YUNJIN_TRAD_BONUS_VALUES.length) - 1]! : 0,
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (ATK-based, physical) ---
  // raw: FeatureDamageNormal normal_hit_1. YunJin.js:158-165
  {
    name: "normal_hit_1",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1") }],
  },
  // raw: FeatureDamageNormal normal_hit_2. YunJin.js:166-173
  {
    name: "normal_hit_2",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2") }],
  },
  // raw: FeatureDamageMultihit normal_hit_3 (2 hits: _3_1 + _3_2). YunJin.js:174-197
  {
    name: "normal_hit_3",
    category: "attack",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3_1") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3_2") }] },
    ],
  },
  // raw: FeatureDamageNormal normal_hit_3_1 (isChild:true → emit as standalone). YunJin.js:198-206
  {
    name: "normal_hit_3_1",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3_1") }],
  },
  // raw: FeatureDamageNormal normal_hit_3_2 (isChild:true → emit as standalone). YunJin.js:207-215
  {
    name: "normal_hit_3_2",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3_2") }],
  },
  // raw: FeatureDamageMultihit normal_hit_4 (2 hits: _4_1 + _4_2). YunJin.js:216-239
  {
    name: "normal_hit_4",
    category: "attack",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4_1") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4_2") }] },
    ],
  },
  // raw: FeatureDamageNormal normal_hit_4_1 (isChild:true → emit as standalone). YunJin.js:240-249
  {
    name: "normal_hit_4_1",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4_1") }],
  },
  // raw: FeatureDamageNormal normal_hit_4_2 (isChild:true → emit as standalone). YunJin.js:250-259
  {
    name: "normal_hit_4_2",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4_2") }],
  },
  // raw: FeatureDamageNormal normal_hit_5. YunJin.js:260-267
  {
    name: "normal_hit_5",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_5") }],
  },
  // --- Charged attack ---
  // raw: FeatureDamageCharged charged_hit. YunJin.js:268-276
  {
    name: "charged_hit",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }],
  },
  // --- Plunge attacks ---
  // raw: FeatureDamagePlungeCollision plunge. YunJin.js:277-285
  {
    name: "plunge",
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge") }],
  },
  // raw: FeatureDamagePlungeShockWave plunge_low. YunJin.js:286-293
  {
    name: "plunge_low",
    tags: ["plunge_shockwave"],
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_low") }],
  },
  // raw: FeatureDamagePlungeShockWave plunge_high. YunJin.js:294-301
  {
    name: "plunge_high",
    tags: ["plunge_shockwave"],
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_high") }],
  },
  // --- Skill: Opening Flourish (geo, DEF-based) ---
  // raw: FeatureDamageSkill press_dmg (scaling:'def*'). YunJin.js:304-313
  {
    name: "press_dmg",
    category: "skill",
    element: "geo",
    multipliers: [{ scaling: "def", leveling: "char_skill_elemental", values: talents.get("skill.press_dmg") }],
  },
  // raw: FeatureDamageSkill yunjin_charge_1_dmg (scaling:'def*'). YunJin.js:314-323
  {
    name: "yunjin_charge_1_dmg",
    category: "skill",
    element: "geo",
    multipliers: [{ scaling: "def", leveling: "char_skill_elemental", values: talents.get("skill.yunjin_charge_1_dmg") }],
  },
  // raw: FeatureDamageSkill yunjin_charge_2_dmg (scaling:'def*'). YunJin.js:324-333
  {
    name: "yunjin_charge_2_dmg",
    category: "skill",
    element: "geo",
    multipliers: [{ scaling: "def", leveling: "char_skill_elemental", values: talents.get("skill.yunjin_charge_2_dmg") }],
  },
  // --- Burst: Cliffbreaker's Banner (geo, ATK-based) ---
  // raw: FeatureDamageBurst burst_dmg. YunJin.js:345-353
  {
    name: "burst_dmg",
    category: "burst",
    element: "geo",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") }],
  },
  // --- Shield (FeatureShield): skill.shield ---
  // FeatureMultiplierList: (percent/100 × hp_total) + flat, then × (1 + shield).
  // Source: raw/genshin_calc_pub/src/js/db/Char/YunJin.js:334-344 (FeatureShield)
  // skill.shield: s2.p1 (% HP) + s2.p2 (flat)
  {
    name: "shield",
    category: "skill",
    output: { kind: "shield" },
    multipliers: [
      { scaling: "hp", leveling: "char_skill_elemental", values: talents.get("skill.shield_percent"), flatValues: talents.get("skill.shield_flat") },
    ],
  },
  // --- Burst static readout: burst.yunjin_dmg_bonus = Flying Cloud NA-DMG bonus (DEF×% + element-count) ---
  // FeaturePostEffectValue(PostEffectStatsDef, percent=getMulti('burst.yunjin_dmg_bonus' multi:0.01),
  // percentBonus=StatTable('',[0.025,0.05,0.075,0.115]) keyed by yunjin_traditionalist_stacks). '' name not isPercent
  // + fmt="" → displayed = (s3.p2×0.01 + bonusValues[stacks])×def_total. Same DEF×%+stacks form as the teammate
  // multiplier → reuses bonusLeveling/bonusValues. At solo traditionalist_stacks=0→bonusLevel 1→2.5 (1-element tier):
  // (57.888/100 + 2.5/100)×def_total(1610.39) = 972.48. Scales on Yun Jin's OWN def (scaling "def" → def_total).
  // raw/genshin_calc_pub/src/js/db/Char/YunJin.js:354-368.
  {
    name: "yunjin_dmg_bonus",
    category: "burst",
    output: { kind: "static" },
    multipliers: [
      {
        scaling: "def",
        leveling: "char_skill_burst",
        values: talents.get("burst.yunjin_dmg_bonus"),
        bonusLeveling: "yunjin_traditionalist_stacks",
        bonusValues: yunjinTradBonus,
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Constellations (P2.C Wave-1)
// ---------------------------------------------------------------------------
// C1: ConditionStatic display-only → SKIP.
// C2: ConditionBoolean toggle (dmg_normal:15) → SKIP.
// C3 "Seafaring General" — +3 Burst talent levels (NOTE: C3 is burst, C5 is skill here).
//   raw/genshin_calc_pub/src/js/db/Char/YunJin.js:430-438 (constellation[2]).
// C4: ConditionBoolean toggle (def_percent:20) → SKIP.
// C5 "War God" — +3 Elemental Skill talent levels (NOTE: reversed C3↔C5 vs typical).
//   raw/genshin_calc_pub/src/js/db/Char/YunJin.js:452-459 (constellation[4]).
// C6: ConditionStatic{atk_speed_normal:12} gated by ConditionBoolean(yunjin_flag) → SKIP.

const constellationConditions: readonly Condition[] = [
  // C3 — char_skill_burst_bonus +3 (burst talent level up — Yun Jin reverses C3/C5).
  { type: "constellation", constellation: 3, settings: { char_skill_burst_bonus: 3 } },
  // C5 — char_skill_elemental_bonus +3 (skill talent level up).
  { type: "constellation", constellation: 5, settings: { char_skill_elemental_bonus: 3 } },
];

// ---------------------------------------------------------------------------
// partyData — teammate kit buff (P3.5.2 engine-extension pass).
// Source: raw/genshin_calc_pub/src/js/db/Char/YunJin.js:477-582
// Flying Cloud Flag Formation: a DEF-scaled flat additive to each NORMAL hit of the
// recipient, summed into the base term. The ratio is the burst-leveled `yunjin_dmg_bonus`
// table (s3.p2) PLUS an additive `bonusValues` term keyed off the SEPARATE Traditionalist
// stacks level (`yunjin_traditionalist_stacks`, the party-element-diversity count →
// [2.5,5,7.5,11.5]%). Both halves are her FeatureMultiplier.getValue (Multiplier.js:184-186);
// the bonus half rides the new FeatureMultiplierEntry.bonusLeveling/bonusValues field.
// Conditions ported = ONLY the two lifts the multiplier reads + the gate it AND-checks;
// constellation/passive booleans (myriad/decorous/traditionalist stat effects) are deferred
// to the P3.5.2 variant-rep pass.
// ---------------------------------------------------------------------------

// Flying Cloud Flag Formation: DEF-scaled flat normal DMG bonus.
// raw/genshin_calc_pub/src/js/db/Char/YunJin.js:565-581 (the FeatureMultiplier).
//   scaling: 'yunjin_def_total'  (the lifted teammate DEF, read VERBATIM via cStat)
//   leveling: 'yunjin_char_skill_burst'  (burst talent level → values.getValue)
//   values: Talents.get('burst.yunjin_dmg_bonus')  (s3.p2)
//   bonusLeveling: 'yunjin_traditionalist_stacks' + bonusValues: ValueTable([2.5,5,7.5,11.5])
//   target: { damageTypes: ['normal'] }  (load-bearing — skill/burst hits stay unbuffed)
//   condition: ConditionAnd([ ConditionBoolean('yunjin_def_total'), ConditionBoolean('party.yunjin_flag') ])
const yunjinPartyMultipliers: readonly CharMultiplier[] = [
  {
    source: "yun_jin",
    scaling: "yunjin_def_total",
    leveling: "yunjin_char_skill_burst",
    values: talents.get("burst.yunjin_dmg_bonus"),
    bonusLeveling: "yunjin_traditionalist_stacks",
    bonusValues: yunjinTradBonus,
    target: { damageTypes: ["normal"] },
    condition: {
      type: "and",
      items: [
        // Both are ConditionBoolean gates (truthy checks): the lifted DEF must be present
        // (its bare key, ~2500 → truthy) AND the master flag must be ON. Mirrors her
        // ConditionAnd exactly (YunJin.js:577-580).
        { type: "boolean", name: "yunjin_def_total" },
        { type: "boolean", name: "party.yunjin_flag" },
      ],
    },
  } satisfies CharMultiplier,
];

export const yunJin: DbObjectChar = {
  name: "yun_jin",
  gameId: 10000064,
  rarity: 4,
  element: "geo",
  weapon: "polearm",
  origin: "liyue",
  statTable: YunJinStatTable,
  talents,
  features,
  multipliers: [],
  conditions: constellationConditions,
  partyData: {
    // loadStats: raw YunJin.js:478-482 lists settings:['char_skill_elemental'], but that's a
    // raw-side slip — the multiplier's leveling is yunjin_char_skill_burst, so we record
    // char_skill_burst here. Descriptive metadata only; the engine consumes the baked
    // teammate settings directly.
    loadStats: {
      stats: ["def_total"],
      settings: ["char_skill_burst"],
    },
    conditions: [
      // Lift Yun Jin's def_total into the recipient bag as `yunjin_def_total` (a RAW_BAG_SCALING
      // key) so the multiplier's `scaling: "yunjin_def_total"` reads it verbatim via cStat.
      // raw: ConditionNumber({name:'yunjin_def_total', partyStat:'def_total', max:10000}).
      { type: "number", name: "yunjin_def_total", max: 10000 },
      // Lift Yun Jin's burst talent level → `yunjin_char_skill_burst`. baseDamageTerm reads it
      // from ctx.settings as the multiplier's `leveling` key (its bag injection is inert — not a
      // RAW_BAG key). raw: ConditionNumberTalent({name:'yunjin_char_skill_burst',
      // partySetting:'char_skill_burst'}) → min 1, max 10.
      { type: "number", name: "yunjin_char_skill_burst", min: 1, max: 10 },
      // Master toggle the multiplier's gate AND-checks. Carries no stats/settings of its own
      // (the flag value is a baked teammate setting). raw: ConditionBoolean({name:'party.yunjin_flag'}).
      { type: "boolean", name: "party.yunjin_flag" },
    ],
    multipliers: yunjinPartyMultipliers,
  },
};
