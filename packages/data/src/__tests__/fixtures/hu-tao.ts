/**
 * Minimal Hu Tao — hand-authored test scaffolding for the P1.7a end-to-end proof.
 *
 * This is NOT production character data (that is P1.7b's job, ported from her
 * generated CharTables/CharTalentTables). It is the smallest `DbObjectChar` +
 * weapon that exercises the full glue pipeline (buildStats → compileFeature)
 * against the fixed canonical build in tests/golden/fixtures/_manifest.json,
 * so the engine numbers can be checked against tests/golden/fixtures/hu_tao.json.
 *
 * SCAFFOLDING SHORTCUT (documented): the fixed build is ALWAYS level 90 /
 * ascension 6, so each base-stat scale table here is a single-entry
 * StatTable([scaleAt90]) — StatTable.getValue(90) clamps to the last entry, so
 * this reproduces her getValue(90, 6) exactly without transcribing the full
 * 100-entry per-level curve. P1.7b ports the real curves.
 *
 * All numbers cited from her raw data:
 *   raw/.../db/generated/CharTables.js          (Hutao base-stat entries)
 *   raw/.../db/generated/CharScale.js           (s5atk/s5hp scale @ L90 = 8.739)
 *   raw/.../db/generated/WeaponStatTables.js     (BlackcliffPole = n11 atk_base, n46 crit_dmg_base)
 *   raw/.../db/generated/WeaponScale.js          (atk_2_1 @ L90 = 8.349, crt_2_1 @ L90 = 4.594)
 *   raw/.../db/Char/Hutao.js                      (normal_hit_1 feature, HP→ATK post-effect, Paramita)
 *   raw/.../db/generated/CharTalentTables.js      (Hutao.s1.p1 normal_hit_1 table)
 */

import {
  StatTable,
  StatTableAscensionScale,
  type StatTableAscensionScaleParams,
} from "@genshin/core";
import type {
  CharPostEffect,
  Condition,
  DbObjectChar,
  Feature,
  StatTableEntry,
  TalentResolver,
  TalentTable,
} from "@genshin/types";

// --- char base-stat scale @ level 90 (CharScale s5atk = s5hp, index 89) ---
const S5_AT_90 = 8.739;
// --- weapon base-stat scales @ level 90 (WeaponScale) ---
const WPN_ATK_AT_90 = 8.349; // atk_2_1[89]
const WPN_CRT_AT_90 = 4.594; // crt_2_1[89]

/**
 * Wrap a core StatTableAscensionScale as a named StatTableEntry (her generated
 * entries carry a `stat`; the core port is key-agnostic, so we attach the key).
 */
function entry(
  stat: string,
  params: StatTableAscensionScaleParams
): StatTableEntry {
  const table = new StatTableAscensionScale(params);
  return {
    getName: () => stat,
    getValue: (level: number, ascension: number) =>
      table.getValue(level, ascension),
  };
}

// Single-entry scale tables: getValue(90) clamps to the entry (see header).
const s5 = new StatTable([S5_AT_90]);

/** Hu Tao's character base-stat table (CharTables.Hutao, subset needed here). */
const charStatTable: readonly StatTableEntry[] = [
  entry("atk_base", {
    base: 8.2859,
    ascension: new StatTable([7.1039, 12.1514, 18.8814, 23.9289, 28.9764, 34.0239]),
    scale: s5,
  }),
  entry("hp_base", {
    base: 1210.7164,
    ascension: new StatTable([1038.0798, 1775.6628, 2759.107, 3496.69, 4234.273, 4971.856]),
    scale: s5,
  }),
  entry("def_base", {
    base: 68.2062,
    ascension: new StatTable([58.482, 100.035, 155.439, 196.992, 238.545, 280.098]),
    scale: s5,
  }),
  entry("crit_dmg_base", {
    base: 50,
    ascension: new StatTable([0, 9.6, 19.2, 19.2, 28.8, 38.4]),
  }),
  entry("crit_rate_base", { base: 5 }),
  entry("recharge_base", { base: 100 }),
];

/**
 * Blackcliff Pole base-stat table (BlackcliffPole = enum n11 + n46), passive
 * OFF. n11 = atk_base (base 42.401, ascension n2, scale atk_2_1); n46 =
 * crit_dmg_base (base 12, scale crt_2_1).
 */
const weaponStatTable: readonly StatTableEntry[] = [
  entry("atk_base", {
    base: 42.401,
    ascension: new StatTable([25.9, 51.9, 77.8, 103.7, 129.7, 155.6]), // enumAscensionTables.n2
    scale: new StatTable([WPN_ATK_AT_90]),
  }),
  entry("crit_dmg_base", {
    base: 12,
    scale: new StatTable([WPN_CRT_AT_90]),
  }),
];

// --- talent table: normal_hit_1 (CharTalentTables.Hutao.s1.p1) ---
const NORMAL_HIT_1 = [
  46.8864, 50.0832, 53.28, 57.5424, 60.7392, 64.4688, 69.264, 74.0592, 78.8544,
  83.6496, 88.4448, 93.24, 98.0352, 102.8304, 107.6256,
] as const;

/** A talent table backed by a raw value array; getValue(level) is 1-indexed. */
function talentTable(values: readonly number[]): TalentTable {
  const table = new StatTable(values);
  return { getValue: (level: number) => table.getValue(level) };
}

const talents: TalentResolver = {
  get(path: string): TalentTable {
    if (path === "attack.normal_hit_1") return talentTable(NORMAL_HIT_1);
    throw new Error(`minimal Hu Tao fixture: unknown talent path '${path}'`);
  },
};

// --- normal_hit_1 feature (FeatureDamageNormal: normal attack, no infusion) ---
const normalHit1: Feature = {
  name: "normal_hit_1",
  category: "attack",
  multipliers: [
    {
      leveling: "char_skill_attack",
      values: talents.get("attack.normal_hit_1"),
    },
  ],
};

// --- HP→ATK post-effect, gated by Paramita Papilio (PostEffectStatsHP) ---
const paramita: Condition = {
  type: "boolean",
  name: "hutao_paramita_papilio",
};

/**
 * Hu Tao's skill HP→ATK conversion. Ratio = skill.hutao_atk_bonus @ L10 × 0.01
 * (her Talents.getMulti). At skill level 10 the bonus table value is 6.256, so
 * ratio = 0.06256; cap = 400% of atk_BASE (her `statCapPost` reads
 * `from: 'atk_base'` × atk_percent[400], Hutao.js:155-158 — `capUsesBase: true`
 * makes the adapter read atk_base × 4, not getTotal('atk') × 4). Active only when
 * Paramita is on.
 */
const hpToAtk: CharPostEffect = {
  priority: 1,
  fromStat: "hp",
  toStat: "atk",
  ratio: 6.256 * 0.01,
  cap: { capStat: "atk", capRatio: 4 },
  capUsesBase: true,
  conditions: [paramita],
};

/** The minimal Hu Tao character entity. */
export const minimalHuTao: DbObjectChar = {
  name: "hu_tao",
  gameId: 10000046,
  rarity: 5,
  element: "pyro",
  weapon: "polearm",
  origin: "liyue",
  statTable: charStatTable,
  talents,
  features: [normalHit1],
  multipliers: [],
  postEffects: [hpToAtk],
  conditions: [paramita],
};

/** Blackcliff Pole's base-stat providers (passive off). */
export const blackcliffPoleStatTable = weaponStatTable;
