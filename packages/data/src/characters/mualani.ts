/**
 * Mualani — hydro catalyst HP scaler (Nightsoul surfboard shark-rider).
 *
 * Normal attacks (Cooling Treatment): 3-hit hydro combo + charged hit, plunge /
 * plunge_low / plunge_high — all ATK-scaled, char_skill_attack. Mualani's plunge
 * tables live at s1.p6/p7/p8 (NOT p7/p8/p9 like most chars — she has no separate
 * p9/p10 entries; p5 is the charged stamina cost).
 *
 * Skill (Surfshark Wavebreaker): the shark bite, raw class
 * FeatureDamageNormalMualani — `category:'skill'` but `damageType:'normal'`
 * (extends FeatureDamageNormal, which forces damageType='normal'). So it groups
 * under the `skill.` key yet picks up the NORMAL DMG-bonus (dmg_normal), NOT
 * dmg_skill. HP-scaled off s2.p1 (mualani_shark_base_dmg). Tagged `shark_byte`
 * (the char-level Wave-Momentum / Sharks-Add / C1 multipliers target it).
 *   raw/genshin_calc_pub/src/js/classes/Feature2/Damage/Normal/Mualani.js
 *
 * WAVE MOMENTUM (`mualani_wave_momentum`, ConditionStacks 0-3) — a char-level
 * HP-scaled multiplier (s2.p2) over the `shark_byte` tag, multiplied by the stack
 * count (her `stacksLeveling` → our `stacksFactor`, 0 at 0 stacks). At >=3 stacks a
 * SECOND flat HP term (s2.p3, `mualani_shark_add_dmg`) also fires (her
 * ConditionBooleanValue `mualani_wave_momentum >= 3`). Both OFF (0 stacks) in the
 * fixed build → inert.
 *
 * A4 "Natlan's Greatest Guide" (`mualani_natlans_greatest_guide`, 0-3): the burst's
 * SECOND HP-scaled multiplier (ValueTable[15,30,45] indexed by the setting as level),
 * gated on the boolean toggle. OFF (0) in the fixed build → the burst is a plain HP hit.
 * The ascension-4 gate is dropped (always true at ascension 6).
 *
 * Burst (Boomsharka-laka): burst_dmg, hydro, HP-scaled off s3.p1.
 *   damageBonuses:['dmg_burst_mualani'] — set by C4 (mualani_sharky_eats_puffies, 75%),
 *   inactive at C0 → reads 0.
 *
 * Constellations: C1 "The Leisurely Meztli" (`mualani_the_leisurely_meztli`, +66% HP
 *   shark_byte multiplier, gated C1) + C4 "Sharky Eats Puffies" (dmg_burst_mualani +75,
 *   gated C4). C3/C5 talent-level bumps. C2/C6 no real stats.
 *
 * BYTE TARGETS (`mualani_byte_targets`, ConditionDropdown 1-3): her
 *   `FeatureDamageNormalMualani.getReactionMultipliers` pushes a settings-keyed whole-hit
 *   `CMultiplierCustom` (byte_targets 2 → 0.86, 3 → 0.72) scaling BOTH the shark bite AND the
 *   shark-missile feature it gates (>=2). Ported via the `wholeHitMultiplierFromTable` field
 *   (table [1, 0.86, 0.72] by mualani_byte_targets) on both the bite and the (now-added)
 *   missile. At byte_targets=1 (default) the ratio is 1.0 (no push) and the missile is OFF →
 *   the base build is byte-identical. Source: raw/.../Feature2/Damage/Normal/Mualani.js:11-31
 *   + Mualani.js:212-229.
 *
 * Reaction features (electrocharged / rupture / shatter) are emitted generically
 * by the engine from element=hydro — not declared here (cf. neuvillette.ts).
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Mualani.js
 *   raw/genshin_calc_pub/src/js/classes/Feature2/Damage/Normal/Mualani.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Mualani)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Mualani)
 */

import type { Condition, DbObjectChar, Feature, FeatureMultiplierEntry, TalentResolver, TalentTable } from "@genshin/types";
import { Mualani as MualaniStatTable } from "../generated/charTables.js";
import { Mualani as MualaniTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return MualaniTalents.s1.p1;
      if (name === "normal_hit_2") return MualaniTalents.s1.p2;
      if (name === "normal_hit_3") return MualaniTalents.s1.p3;
      if (name === "charged_hit")  return MualaniTalents.s1.p4;
      if (name === "plunge")       return MualaniTalents.s1.p6;
      if (name === "plunge_low")   return MualaniTalents.s1.p7;
      if (name === "plunge_high")  return MualaniTalents.s1.p8;
    }
    if (talent === "skill") {
      if (name === "mualani_shark_base_dmg") return MualaniTalents.s2.p1;
      if (name === "mualani_wave_monentum_dmg") return MualaniTalents.s2.p2;
      if (name === "mualani_shark_add_dmg") return MualaniTalents.s2.p3;
    }
    if (talent === "burst") {
      if (name === "burst_dmg") return MualaniTalents.s3.p1;
    }
    throw new Error(`mualani talents: unknown path '${path}'`);
  },
};

// A4 "Natlan's Greatest Guide" ValueTable([15,30,45]) — indexed by the setting value as level.
// Replicates her ValueTable.getValue: level <= 0 → 0; level > length → last; else values[level-1].
const A4_GUIDE_VALUES = [15, 30, 45] as const;
const a4GuideTable: TalentTable = {
  getValue: (level: number): number =>
    level > 0 ? A4_GUIDE_VALUES[Math.min(level, A4_GUIDE_VALUES.length) - 1]! : 0,
};

// Byte-ratio whole-hit multiplier — her FeatureDamageNormalMualani.getReactionMultipliers pushes a
// CMultiplierCustom scaling the WHOLE shark hit by 0.86 at mualani_byte_targets>=2 and 0.72 at >=3
// (bytesCnt>1 branch), i.e. the table [1, 0.86, 0.72] indexed 1-based by mualani_byte_targets
// (index 1 → ratio 1, exact — no push). raw/.../Feature2/Damage/Normal/Mualani.js:11-31.
const MUALANI_BYTE_RATIO = [1, 0.86, 0.72] as const;

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (hydro infusion implied; raw declares element:'hydro') ---
  // raw: FeatureDamageNormal normal_hit_1 (ATK-scaled, hydro)
  {
    name: "normal_hit_1",
    category: "attack",
    element: "hydro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1") }],
  },
  {
    name: "normal_hit_2",
    category: "attack",
    element: "hydro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2") }],
  },
  {
    name: "normal_hit_3",
    category: "attack",
    element: "hydro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }],
  },
  // --- Charged attack ---
  // raw: FeatureDamageCharged charged_hit (ATK-scaled, hydro)
  {
    name: "charged_hit",
    category: "attack",
    damageType: "charged",
    element: "hydro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }],
  },
  // --- Plunge attacks ---
  // raw: FeatureDamagePlungeCollision plunge
  {
    name: "plunge",
    category: "attack",
    damageType: "plunge",
    element: "hydro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge") }],
  },
  // raw: FeatureDamagePlungeShockWave plunge_low
  {
    name: "plunge_low",
    tags: ["plunge_shockwave"],
    category: "attack",
    damageType: "plunge",
    element: "hydro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_low") }],
  },
  // raw: FeatureDamagePlungeShockWave plunge_high
  {
    name: "plunge_high",
    tags: ["plunge_shockwave"],
    category: "attack",
    damageType: "plunge",
    element: "hydro",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_high") }],
  },
  // --- Skill: Surfshark Wavebreaker (the shark bite + missile) ---
  // raw: FeatureDamageNormalMualani mualani_shark_bite_dmg —
  //   category:'skill', damageType:'normal' (forced by FeatureDamageNormal),
  //   HP-scaled off s2.p1, tags:['shark_byte'] (the char-level multipliers target it).
  //   The byte-ratio whole-hit multiplier (byte_targets>=2 → 0.86, >=3 → 0.72) rides the
  //   wholeHitMultiplierFromTable field (her getReactionMultipliers CMultiplierCustom).
  {
    name: "mualani_shark_bite_dmg",
    category: "skill",
    damageType: "normal",
    element: "hydro",
    tags: ["shark_byte"],
    wholeHitMultiplierFromTable: { table: MUALANI_BYTE_RATIO, levelSetting: "mualani_byte_targets" },
    multipliers: [
      { scaling: "hp", leveling: "char_skill_elemental", values: talents.get("skill.mualani_shark_base_dmg") },
    ],
  },
  // raw: FeatureDamageNormalMualani mualani_shark_missile_dmg — the same shark hit fired at EXTRA
  //   targets, produced ONLY when mualani_byte_targets>=2 (her ConditionBooleanValue produce-gate,
  //   Mualani.js:212-229). Same base (s2.p1) + tags:['shark_byte'] + the same byte-ratio whole-hit
  //   multiplier as the bite, so at byte_targets=2 it equals the bite (base × 0.86). Absent at
  //   byte_targets<2 (default 1) → base build unaffected.
  {
    name: "mualani_shark_missile_dmg",
    category: "skill",
    damageType: "normal",
    element: "hydro",
    tags: ["shark_byte"],
    condition: { type: "boolean-value", setting: "mualani_byte_targets", cond: "ge", value: 2 },
    wholeHitMultiplierFromTable: { table: MUALANI_BYTE_RATIO, levelSetting: "mualani_byte_targets" },
    multipliers: [
      { scaling: "hp", leveling: "char_skill_elemental", values: talents.get("skill.mualani_shark_base_dmg") },
    ],
  },
  // --- Burst: Boomsharka-laka ---
  // raw: FeatureDamageBurst burst_dmg (HP-scaled, hydro)
  //   damageBonuses:['dmg_burst_mualani'] — C4-only, reads 0 at C0.
  //   Second multiplier = A4 "Natlan's Greatest Guide" HP term (s2.p1-scale ValueTable[15,30,45]
  //   indexed by mualani_natlans_greatest_guide), gated on the boolean toggle. OFF (0) → inert.
  {
    name: "burst_dmg",
    category: "burst",
    element: "hydro",
    damageBonuses: ["dmg_burst_mualani"],
    multipliers: [
      { scaling: "hp", leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") },
      {
        scaling: "hp",
        source: "ascension1",
        leveling: "mualani_natlans_greatest_guide",
        values: a4GuideTable,
        condition: { type: "boolean", name: "mualani_natlans_greatest_guide" },
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Char-level (targeted) multipliers — Wave-Momentum / Sharks-Add / C1, all HP-scaled
// over the `shark_byte` tag (the shark bite). raw Mualani.js:250-284.
// ---------------------------------------------------------------------------
const SHARK_BYTE_TARGET = { damageTypes: [] as string[], tags: ["shark_byte"] };

const multipliers: readonly FeatureMultiplierEntry[] = [
  // Wave Momentum (`mualani_wave_momentum`, 0-3) — HP-scaled term (s2.p2) × stack count
  // (her stacksLeveling → stacksFactor; 0 at 0 stacks → inert). No condition (the stacks factor gates it).
  {
    scaling: "hp",
    leveling: "char_skill_elemental",
    values: talents.get("skill.mualani_wave_monentum_dmg"),
    stacksFactor: { setting: "mualani_wave_momentum", maxStacks: 3 },
    target: SHARK_BYTE_TARGET,
  },
  // Sharks Add (s2.p3) — flat HP term, active when mualani_wave_momentum >= 3 (her ConditionBooleanValue).
  {
    scaling: "hp",
    leveling: "char_skill_elemental",
    values: talents.get("skill.mualani_shark_add_dmg"),
    target: SHARK_BYTE_TARGET,
    condition: { type: "boolean-value", setting: "mualani_wave_momentum", cond: "ge", value: 3 },
  },
  // C1 "The Leisurely Meztli" — +66% HP flat term, gated C1 + the boolean toggle.
  {
    scaling: "hp",
    source: "constellation1",
    leveling: "",
    values: { getValue: (): number => 66 },
    target: SHARK_BYTE_TARGET,
    condition: {
      type: "and",
      items: [
        { type: "constellation", constellation: 1 },
        { type: "boolean", name: "mualani_the_leisurely_meztli" },
      ],
    },
  },
];

// ---------------------------------------------------------------------------
// Constellation conditions (P2.C Wave-1)
// ---------------------------------------------------------------------------
// C1 "The Leisurely Meztli": +66% HP shark_byte multiplier (above) — no bag stat here.
// C2 "Mualani, Going All Out!": ConditionStatic with no real stats → SKIP.
// C3 "Surfing Atop Jaws": +3 Elemental Skill talent levels.
// C4 "Sharky Eats Puffies": dmg_burst_mualani +75 (boolean, gated C4) → below.
// C5 "Same Day Returns": +3 Elemental Burst talent levels.
// C6 "Spirit of the Spring's People": ConditionStatic with no real stats → SKIP.
//
// Sources: raw/genshin_calc_pub/src/js/db/Char/Mualani.js:332-393

const constellationConditions: readonly Condition[] = [
  // C3: +3 Elemental Skill (Surfshark Wavebreaker).
  { type: "constellation", constellation: 3, settings: { char_skill_elemental_bonus: 3 } },
  // C4 "Sharky Eats Puffies" — dmg_burst_mualani +75, gated C4 + the boolean toggle. Lifts the burst
  // via the restored damageBonuses key. raw Mualani.js cons[3] (mualani_sharky_eats_puffies).
  {
    type: "boolean",
    name: "mualani_sharky_eats_puffies",
    stats: { dmg_burst_mualani: 75 },
    condition: { type: "constellation", constellation: 4 },
  },
  // C5: +3 Elemental Burst (Boomsharka-laka).
  { type: "constellation", constellation: 5, settings: { char_skill_burst_bonus: 3 } },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const mualani: DbObjectChar = {
  name: "mualani",
  gameId: 10000102,
  rarity: 5,
  element: "hydro",
  weapon: "catalyst",
  origin: "natlan",
  statTable: MualaniStatTable,
  talents,
  features,
  multipliers,
  conditions: constellationConditions,
};
