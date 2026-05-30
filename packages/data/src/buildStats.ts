/**
 * buildStats — the stats-bag assembly glue.
 *
 * Turns a typed character + weapon base-stat tables + a raw (un-percent-
 * processed) bonus stat block into the executable BuildStats bag + DamageContext
 * the `@genshin/core` engine reads. This is the data-layer mirror of her
 * CalcSet.getBuildData (tools/oracle/engine.mjs is the reference sequence):
 *
 *   1. AGGREGATE base stats — add each char + weapon StatTableEntry's
 *      getValue(level, ascension) under its stat key (atk_base, hp_base, …).
 *   2. CONCAT the bonus stat block (artifacts/sample stats) — RAW percents.
 *   3. DERIVE — run condition-gated post-effects (HP→ATK) via applyPostEffects,
 *      threading the EvalContext.
 *   4. READ — emit the bag the engine consumes:
 *        - `<stat>_total` for atk/hp/def (= base×(1+%/100)+flat via Stats.getTotal)
 *          and the flat-summed stats (crit_rate, crit_dmg, mastery, recharge).
 *        - percent stats as FRACTIONS at execution time: crit_rate/crit_dmg
 *          totals ÷100, DMG% bonuses ÷100, enemy_res_<element> ÷100.
 *        - DEF-ignore / DEF-reduce keys (default 0).
 *
 * BOUNDARY (load-bearing): `Stats.getTotal` expects RAW percents (its `/100`),
 * so the bag fed to it keeps `atk_percent` as 18 — NOT 0.18. The engine, by
 * contrast, reads fractions; so the fraction keys are divided by 100 once here,
 * at emit time. Get this wrong and every downstream number is off.
 *
 * Sources:
 *   tools/oracle/engine.mjs (FIXED_BUILD + getBuildData sequence)
 *   raw/genshin_calc_pub/src/js/classes/Stats.js (getTotal, getTotalPercent, isPercent)
 *   raw/genshin_calc_pub/src/js/classes/CalcSet.js (getBuildData → getBaseStats → processPercent)
 *   wiki/concepts/stat-keys-and-good-format.md
 */

import { Stats, applyPostEffects, type PostEffect } from "@genshin/core";
import type {
  BuildStats,
  CharPostEffect,
  Condition,
  DamageContext,
  DbObjectChar,
  Element,
  EvalContext,
  StatTableEntry,
} from "@genshin/types";
import { evaluate } from "@genshin/core";

/** The seven elements + physical, in the order the engine keys resistance. */
const ELEMENTS: readonly Element[] = [
  "physical",
  "pyro",
  "hydro",
  "electro",
  "cryo",
  "anemo",
  "geo",
  "dendro",
];

/** Stats whose total is `base×(1+%/100)+flat` (her REAL_TOTAL). */
const SCALING_TOTAL_STATS = ["atk", "hp", "def"] as const;
/** Flat-summed stats whose total is `base+flat` and that the engine reads as a number. */
const FLAT_TOTAL_STATS = ["mastery", "recharge"] as const;
/** Flat-summed PERCENT stats whose total is `base+flat` but emitted as a FRACTION. */
const FRACTION_TOTAL_STATS = ["crit_rate", "crit_dmg"] as const;
/** DMG% bonus keys carried in the bonus block; emitted as fractions. */
const DMG_BONUS_KEYS = [
  "dmg_all",
  "dmg_normal",
  "dmg_charged",
  "dmg_plunge",
  "dmg_skill",
  "dmg_burst",
  "dmg_phys",
  "dmg_pyro",
  "dmg_hydro",
  "dmg_electro",
  "dmg_cryo",
  "dmg_anemo",
  "dmg_geo",
  "dmg_dendro",
] as const;

/**
 * Level/ascension parameters for base-stat assembly. (Talent levels are a
 * compileFeature concern — they pick the talent-table row, not a base stat — so
 * they live on CompileContext, not here.)
 */
export interface BuildLevels {
  readonly charLevel: number;
  readonly ascension: number;
  readonly weaponLevel: number;
  readonly weaponAscension: number;
}

/** Enemy parameters: level + resistance as a percent (uniform number) or per-element map. */
export interface BuildEnemy {
  readonly level: number;
  /** Either one percent applied to all elements, or a per-element percent map. */
  readonly resistance: number | Readonly<Partial<Record<Element, number>>>;
}

/** Everything `buildStats` needs to assemble the bag. */
export interface BuildInput {
  readonly char: DbObjectChar;
  /** Weapon base-stat providers (passive handling is the caller's concern). */
  readonly weaponStatTable: readonly StatTableEntry[];
  /** RAW (un-percent-processed) bonus stat block (artifacts + sample stats). */
  readonly statBlock: Readonly<Record<string, number>>;
  readonly levels: BuildLevels;
  readonly enemy: BuildEnemy;
  /** The immutable EvalContext for condition-gated post-effects/buffs. */
  readonly settings?: EvalContext;
}

/** The assembled bag + the context the engine evaluates against. */
export interface BuildResult {
  readonly stats: BuildStats;
  readonly context: DamageContext;
}

/**
 * Adapt a declarative CharPostEffect into an executable core PostEffect.
 *
 * Mirrors her PostEffectStatsHP: derive `ratio × getTotal(fromStat)`, optionally
 * capped at `capRatio × getTotal(capStat)`, gated by ALL `conditions` evaluating
 * true against the settings. Reads the PRE-GROUP snapshot (never mutates).
 */
function toPostEffect(effect: CharPostEffect): PostEffect {
  const conditions: readonly Condition[] = effect.conditions ?? [];
  return {
    priority: effect.priority ?? 1,
    contribute(readStats: Stats, settings: EvalContext): Record<string, number> {
      if (!conditions.every((c) => evaluate(c, settings))) return {};
      let bonus = readStats.getTotal(effect.fromStat) * effect.ratio;
      if (effect.cap !== undefined) {
        const capValue = readStats.getTotal(effect.cap.capStat) * effect.cap.capRatio;
        bonus = Math.min(bonus, capValue);
      }
      return { [effect.toStat]: bonus };
    },
  };
}

/** Resolve the enemy resistance input into a per-element fraction lookup. */
function resistanceFraction(
  resistance: BuildEnemy["resistance"],
  element: Element
): number {
  if (typeof resistance === "number") return resistance / 100;
  return (resistance[element] ?? 0) / 100;
}

/**
 * Assemble the BuildStats bag + DamageContext for a character under a build.
 */
export function buildStats(input: BuildInput): BuildResult {
  const settings = input.settings ?? {};

  // 1-2. Aggregate base stats (char then weapon), then concat the bonus block.
  const raw = new Stats();
  const addEntries = (entries: readonly StatTableEntry[], level: number, ascension: number): void => {
    for (const e of entries) {
      raw.add(e.getName(), e.getValue(level, ascension));
    }
  };
  addEntries(input.char.statTable, input.levels.charLevel, input.levels.ascension);
  addEntries(input.weaponStatTable, input.levels.weaponLevel, input.levels.weaponAscension);
  raw.concat(input.statBlock);

  // 3. Derive — condition-gated post-effects (reads RAW percents via getTotal).
  const effects = (input.char.postEffects ?? []).map(toPostEffect);
  applyPostEffects(raw, effects, settings);

  // 4. Read — emit the engine-facing bag.
  const out: Record<string, number> = {};

  // Scaling totals (atk/hp/def): base×(1+%/100)+flat — raw value, read directly.
  for (const stat of SCALING_TOTAL_STATS) {
    out[`${stat}_total`] = raw.getTotal(stat);
  }
  // Flat totals read as numbers (mastery, recharge).
  for (const stat of FLAT_TOTAL_STATS) {
    out[`${stat}_total`] = raw.getTotal(stat);
  }
  // Flat percent totals → fractions for the engine (crit_rate, crit_dmg).
  for (const stat of FRACTION_TOTAL_STATS) {
    out[`${stat}_total`] = raw.getTotal(stat) / 100;
  }

  // DMG% bonuses → fractions (additive among themselves inside cMultiplierBonus).
  for (const key of DMG_BONUS_KEYS) {
    if (raw.isSet(key)) out[key] = raw.get(key) / 100;
  }

  // Enemy resistance (percent) → enemy_res_<element> fractions. Fold any
  // pre-existing shred (negative res) the same way; the engine reads only these.
  for (const el of ELEMENTS) {
    out[`enemy_res_${el}`] = resistanceFraction(input.enemy.resistance, el);
  }

  // DEF-ignore / DEF-reduce (source-local + team-wide), default 0, as fractions.
  out["enemy_def_ignore"] = raw.get("enemy_def_ignore") / 100;
  out["enemy_def_reduce"] = raw.get("enemy_def_reduce") / 100;

  const stats = out as BuildStats;
  const context: DamageContext = {
    stats,
    enemy: { level: input.enemy.level, resistance: {} },
    characterLevel: input.levels.charLevel,
  };

  return { stats, context };
}
