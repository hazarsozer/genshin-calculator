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

import { Stats, applyPostEffects, conditionStats, evaluate, type PostEffect } from "@genshin/core";
import type {
  BuildStats,
  CharPostEffect,
  Condition,
  DamageContext,
  DbObjectArtifactSet,
  DbObjectChar,
  Element,
  EvalContext,
  Feature,
  StatTableEntry,
} from "@genshin/types";
import { getArtifactSet } from "./artifacts/sets/index.js";

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
/**
 * DMG% bonus keys carried in the bonus block; emitted as fractions.
 *
 * Split by her aggregation rule in getStatsDmgBonus (Damage.js:51-66):
 *   - ELEMENT keys are read as `dmg_<element>*` (the `*` → makeStatTotalItem →
 *     `dmg_<elem>_base + dmg_<elem>`, since dmg_* is not a REAL_TOTAL stat). The
 *     `_base` carries a char/weapon ASCENDARY-SECONDARY elemental DMG bonus
 *     (e.g. Razor's A6 Physical DMG +30 lands as `dmg_phys_base`).
 *   - TYPE keys (`dmg_normal`, `dmg_skill`, …) and `dmg_all` are read WITHOUT the
 *     `*`, so only their flat bonus value counts (no `_base` fold).
 */
const DMG_BONUS_ELEMENT_KEYS = [
  "dmg_phys",
  "dmg_pyro",
  "dmg_hydro",
  "dmg_electro",
  "dmg_cryo",
  "dmg_anemo",
  "dmg_geo",
  "dmg_dendro",
] as const;
const DMG_BONUS_TYPE_KEYS = [
  "dmg_all",
  "dmg_normal",
  "dmg_charged",
  "dmg_plunge",
  "dmg_skill",
  "dmg_burst",
] as const;

/**
 * Reaction scaling / bonus keys derived by post-effects (Ineffa's Lunar-Charged
 * passives today; extended in P1.9 as more reaction-driving post-effects land).
 * Already fraction-valued in `raw` (the post-effect folded the isPercent /100),
 * so emitted as-is. Read by the reaction factories' `(1 + Σ)` terms.
 */
const REACTION_DERIVED_KEYS = [
  "lunarcharged_multi",
  "dmg_reaction_lunarcharged",
] as const;

/**
 * Per-reaction DMG bonus keys CONDITIONS contribute (e.g. CrimsonWitch 4pc's
 * `dmg_reaction_overloaded`/`_burgeon`/…). The reaction factories read each via
 * `cStat(key)` inside `(1 + emBonus + Σ dmg_reaction_*)` (core's
 * cTransformativeDamage / cAmplifyingDamage). Unlike `dmg_reaction_lunarcharged`
 * (a post-effect output that ALREADY folded its isPercent /100 — see
 * REACTION_DERIVED_KEYS), these arrive as RAW percents from `conditionStats`, so
 * they are emitted as FRACTIONS (÷100) at emit time, exactly like every dmg_* key.
 * `dmg_reaction_lunarcharged` is deliberately NOT in this list (it stays in the
 * pre-divided REACTION_DERIVED_KEYS path). Absent keys are left unset → engine reads 0.
 *
 * Source: packages/data/src/reactions.ts (reactionBonusKeys per reaction);
 *         raw/.../db/Artifacts/Set/CrimsonWitch.js (the 4pc reaction bonuses).
 */
const REACTION_BONUS_PERCENT_KEYS = [
  "dmg_reaction_overloaded",
  "dmg_reaction_superconduct",
  "dmg_reaction_electrocharged",
  "dmg_reaction_shatter",
  "dmg_reaction_swirl",
  "dmg_reaction_bloom",
  "dmg_reaction_hyperbloom",
  "dmg_reaction_burgeon",
  "dmg_reaction_rupture",
  "dmg_reaction_aggravate",
  "dmg_reaction_vaporize",
  "dmg_reaction_melt",
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
  /**
   * Generic condition channel for equipped-object (weapon / artifact-set)
   * conditions. Applied identically to `char.conditions` in the condition loop —
   * later tasks (weapon passives, set shapes) pass the equipped objects'
   * conditions in here. Her CalcSet.getBaseStats iterates every equipped object's
   * `getConditions()`; this is that same set, minus the character's own.
   */
  readonly extraConditions?: readonly Condition[];
  /**
   * Equipped artifact sets + their piece counts (e.g. `[{ setKey: "NoblesseOblige",
   * pieces: 4 }]`). Each is resolved against the set registry; conditions from every
   * bonus tier `t <= pieces` enter the condition loop (the PIECE-COUNT gate), each
   * then independently subject to its own gate (the CONDITION gate). Mirrors her
   * `CalcObjectArtifacts`: `activeSets()` counts pieces per set, `getConditions(pieces)`
   * collects the unlocked tiers' conditions, and `getSettings()` injects
   * `set_pieces.<setKey-lowercased> = pieces` (read by `ConditionBooleanPiecesCount`).
   * Absent / empty → the whole set path is a no-op (the base golden suite is untouched).
   */
  readonly setBonuses?: readonly EquippedSet[];
  /**
   * Optional set-registry override (DI seam). When provided, set lookups resolve
   * against this map instead of the module barrel `getArtifactSet`. Production callers
   * omit it (→ barrel); the golden harness injects a glob-built registry so a set file
   * validates without a barrel edit. The override is complete: if `setRegistry` is
   * present and a key is absent from it, that set is treated as unported (no-op).
   */
  readonly setRegistry?: Readonly<Record<string, DbObjectArtifactSet>>;
}

/** One equipped artifact set: its registry key + how many pieces are worn. */
export interface EquippedSet {
  /** Registry key (GOOD `goodId`), e.g. "NoblesseOblige". */
  readonly setKey: string;
  /** Equipped piece count (1–5; bonus tiers exist at 2 and 4). */
  readonly pieces: number;
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
 *
 * `capUsesBase`: the stat-relative `cap` reads the BASE stat (`capStat_base`)
 * × capRatio, not `getTotal(capStat)` — her `statCapPost` whose base is a
 * `from: '<stat>_base'` term (Hu Tao's `atk_base × 4`, Hutao.js:155-158).
 *
 * Percent-stat post-effects (e.g. Furina's A4 `dmg_skill_furina`) land in the
 * bag as RAW PERCENTS; `buildStats`'s `collectFeatureBonusKeys` emit loop applies
 * the /100 at emit time — exactly as every other dmg_* feature-bonus key.
 */
function toPostEffect(effect: CharPostEffect): PostEffect {
  const conditions: readonly Condition[] = effect.conditions ?? [];
  return {
    priority: effect.priority ?? 1,
    contribute(readStats: Stats, settings: EvalContext): Record<string, number> {
      if (!conditions.every((c) => evaluate(c, settings))) return {};
      let bonus = readStats.getTotal(effect.fromStat) * effect.ratio;
      if (effect.cap !== undefined) {
        const capBase = effect.capUsesBase
          ? readStats.get(`${effect.cap.capStat}_base`)
          : readStats.getTotal(effect.cap.capStat);
        bonus = Math.min(bonus, capBase * effect.cap.capRatio);
      }
      if (effect.capValue !== undefined) {
        bonus = Math.min(bonus, effect.capValue);
      }
      return { [effect.toStat]: bonus };
    },
  };
}

/**
 * The set of feature-declared bonus stat keys referenced across a character's
 * features (`critRateBonuses` ∪ `critDamageBonuses` ∪ `damageBonuses`). These are
 * the char-specific percent keys `compileFeature` reads; buildStats must emit each
 * present one as a fraction. (De-duped — keys are shared across hits.)
 */
function collectFeatureBonusKeys(features: readonly Feature[]): readonly string[] {
  const keys = new Set<string>();
  for (const f of features) {
    for (const k of f.critRateBonuses ?? []) keys.add(k);
    for (const k of f.critDamageBonuses ?? []) keys.add(k);
    for (const k of f.damageBonuses ?? []) keys.add(k);
  }
  return [...keys];
}

/** What an equipped-set's `setBonuses` resolve to: gated conditions + piece-count settings + post-effects. */
interface ResolvedSetBonuses {
  /** Piece-count-gated conditions (tiers `t <= pieces`), still subject to their own gate. */
  readonly conditions: readonly Condition[];
  /** `set_pieces.<setKey-lowercased> → pieces`, the settings ConditionBooleanPiecesCount reads. */
  readonly pieceSettings: Readonly<Record<string, number>>;
  /** Set-level post-effects (HP→ATK-style folds), in equip order. */
  readonly postEffects: readonly CharPostEffect[];
}

/**
 * Resolve equipped sets into their piece-count-gated conditions, the
 * `set_pieces.*` settings, and any set-level post-effects.
 *
 * The PIECE-COUNT gate lives here (which tiers enter): a set's tier-`t` conditions
 * are included only when `pieces >= t`. The CONDITION gate stays in `conditionStats`
 * (whether an entered condition fires). Mirrors her `ArtifactSet.getConditions(pieces)`
 * (concats `bonus[i].conditions` for `i <= pieces`) + `CalcObjectArtifacts.getSettings`
 * (injects `set_pieces.<name> = count`). Unknown set keys are skipped (a set not yet
 * ported contributes nothing) — P2.A1 fills the registry.
 *
 * When `setRegistry` is provided it replaces the barrel lookup entirely (DI seam):
 * the golden harness injects a glob-built registry so a set file validates without
 * a barrel edit.
 */
function resolveSetBonuses(
  setBonuses: readonly EquippedSet[],
  setRegistry?: Readonly<Record<string, DbObjectArtifactSet>>
): ResolvedSetBonuses {
  const conditions: Condition[] = [];
  const pieceSettings: Record<string, number> = {};
  const postEffects: CharPostEffect[] = [];

  for (const { setKey, pieces } of setBonuses) {
    const set = setRegistry ? setRegistry[setKey] : getArtifactSet(setKey);
    if (set === undefined) continue;
    pieceSettings[`set_pieces.${setKey.toLowerCase()}`] = pieces;
    // Piece-count gate: include each bonus tier unlocked at this piece count.
    for (const tier of [2, 4] as const) {
      if (pieces < tier) continue;
      const bonus = set.bonus[tier];
      if (bonus?.conditions) conditions.push(...bonus.conditions);
    }
    if (set.postEffects) postEffects.push(...set.postEffects);
  }

  return { conditions, pieceSettings, postEffects };
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
  // Resolve equipped sets up front: their piece-count settings (`set_pieces.*`)
  // must be visible to every condition's evaluate() — the global set buffs gate on
  // them via ConditionBooleanPiecesCount. Merge them into the build settings (they
  // add only `set_pieces.*` keys, which char/weapon conditions never read, so this
  // is inert for the no-set path → the base golden suite is untouched).
  const sets = resolveSetBonuses(input.setBonuses ?? [], input.setRegistry);

  // Inject the character's weapon type as `weapon_type` so ConditionBooleanWeaponType
  // conditions (e.g. GladiatorFinale 4pc) can read it from the EvalContext. This key
  // is always present; no existing condition reads it, so this is inert for every
  // current build — the base-107 golden suite and all existing set suites are untouched.
  // An explicit `input.settings.weapon_type` (none today) would be shadowed by the
  // char-derived value unless we spread settings last; we spread it first so the char
  // value always wins (the canonical source of truth).
  // NOTE (P2.C): char-feature weapon-type conditions would also need `weapon_type` in
  // the COMPILE settings (CompileContext). Out of scope here — set conditions are
  // resolved entirely within buildStats, so this injection suffices for set 4pc gates.
  const baseSettings: EvalContext = { weapon_type: input.char.weapon };

  const settings: EvalContext =
    input.setBonuses && input.setBonuses.length > 0
      ? { ...baseSettings, ...(input.settings ?? {}), ...sets.pieceSettings }
      : { ...baseSettings, ...(input.settings ?? {}) };

  // 1-2. Aggregate base stats (char then weapon), then concat the bonus block.
  const raw = new Stats();
  const addEntries = (entries: readonly StatTableEntry[], level: number, ascension: number): void => {
    for (const e of entries) {
      raw.add(e.getName(), e.getValue(level, ascension));
    }
  };
  addEntries(input.char.statTable, input.levels.charLevel, input.levels.ascension);
  addEntries(input.weaponStatTable, input.levels.weaponLevel, input.levels.weaponAscension);
  // Always-active passive stat bonuses (auto-active ascension/passive conditions
  // under the canonical build) — RAW, concatenated like the bonus block. Her
  // getBuildData applies these via the baseline-active conditions.
  if (input.char.baseStats) raw.concat(input.char.baseStats);
  raw.concat(input.statBlock);

  // 2b. Apply the conditional layer — every active condition's contributed stats,
  // RAW, concatenated like the bonus block. Mirrors her CalcSet.getBaseStats loop
  // (`cond.getData(settings).stats` over each equipped object's conditions). This
  // is ADDITIVE on top of `baseStats` (always-on passives): each condition here is
  // gated/toggleable, so at the base C0 build with no toggles `conditionStats`
  // returns {} and the loop is a no-op (the 107/107 base golden suite is untouched).
  // Runs BEFORE applyPostEffects so post-effects (HP→ATK) read condition-contributed
  // stats — exactly her order. Stacks scale by getStackCount, refine resolves by
  // weapon_refine: all handled inside the pure `conditionStats` resolver.
  for (const cond of input.char.conditions ?? []) raw.concat(conditionStats(cond, settings));
  for (const cond of input.extraConditions ?? []) raw.concat(conditionStats(cond, settings));
  // Equipped artifact-set conditions (piece-count gated in resolveSetBonuses, then
  // each subject to its own gate here) — the same loop as char/weapon conditions.
  // Mirrors her CalcSet.getBaseStats iterating the artifacts' (+ buffs') getConditions.
  for (const cond of sets.conditions) raw.concat(conditionStats(cond, settings));

  // 3. Derive — condition-gated post-effects (reads RAW percents via getTotal).
  // Char post-effects then any set-level post-effects (HP→ATK-style folds), both
  // through the same path — her getPostEffects concats every equipped object's.
  const effects = [...(input.char.postEffects ?? []), ...sets.postEffects].map(toPostEffect);
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
  // Reaction EM key: the reaction factories (`@genshin/core`'s cLunarChargedDamage,
  // the transformative EM bonuses, compileFeature's lunarEmBonusTerm) read the bare
  // `mastery` key for the EM-watershed term. Her engine's `makeStatTotalItem('mastery')`
  // sums `mastery_base + mastery` (flat) — exactly getTotal('mastery'), since mastery
  // is not a REAL_TOTAL stat. Emit it so every EM-scaling reaction reads the true total
  // EM with no per-feature aliasing. (Raw: Feature2/Multiplier/Reaction/LunarCharged.js,
  // Feature2/Compile/Helpers.js makeStatTotalItem, db/Constants.js REAL_TOTAL.)
  out["mastery"] = raw.getTotal("mastery");
  // Flat percent totals → fractions for the engine (crit_rate, crit_dmg).
  for (const stat of FRACTION_TOTAL_STATS) {
    out[`${stat}_total`] = raw.getTotal(stat) / 100;
  }

  // Element DMG% bonuses → fractions, folding the `_base` ascension/passive
  // secondary into the total (her `dmg_<element>*`). Emit when either the flat
  // bonus OR its `_base` is present so the +30% phys DMG (`dmg_phys_base`) lands.
  for (const key of DMG_BONUS_ELEMENT_KEYS) {
    const baseKey = `${key}_base`;
    if (raw.isSet(key) || raw.isSet(baseKey)) {
      out[key] = (raw.get(key) + raw.get(baseKey)) / 100;
    }
  }
  // Type DMG% bonuses + dmg_all → fractions, flat only (no `*` in her getStatsDmgBonus).
  for (const key of DMG_BONUS_TYPE_KEYS) {
    if (raw.isSet(key)) out[key] = raw.get(key) / 100;
  }

  // Feature-declared bonus keys (her FeatureDamage critRateBonuses /
  // critDamageBonuses / damageBonuses) — char-specific percent stats like Amber's
  // `crit_rate_amber` or C2's `dmg_skill_amber`. compileFeature sums each into the
  // matching term, so emit every referenced key present in the bag as a FRACTION
  // (all are percent stats). Absent → unset (engine reads 0). This stays in the
  // explicit-emit spirit: only keys the character's features actually reference.
  for (const key of collectFeatureBonusKeys(input.char.features)) {
    if (!raw.isSet(key)) continue;
    out[key] = raw.get(key) / 100;
  }

  // Reaction scaling / bonus keys the reaction factories read inside their
  // `(1 + Σ scaling)` / `(1 + emBonus + Σ reactionBonus)` terms — e.g. Ineffa's
  // `lunarcharged_multi` and `dmg_reaction_lunarcharged`. In her engine these are
  // ONLY ever produced by post-effects (PostEffectStatsAtk on a percent stat),
  // which already fold the isPercent /100 — so they land in the bag as FRACTIONS
  // and are read out as-is (no further /100). Absent keys are left unset so the
  // engine reads them as 0 (cStat default). (Raw: db/Char/Ineffa.js lunarPost /
  // lunarPost2, PostEffect/Stats.js getTree isPercent fold.)
  for (const key of REACTION_DERIVED_KEYS) {
    if (raw.isSet(key)) out[key] = raw.get(key);
  }

  // Condition-contributed per-reaction DMG bonuses (e.g. CrimsonWitch 4pc) → fractions.
  // These arrive RAW (percent) from the condition loop, so divide by 100 here (unlike the
  // pre-divided REACTION_DERIVED_KEYS above). Absent → unset (engine reads 0). No-op for
  // every build that contributes no `dmg_reaction_*` (the base suite is untouched).
  for (const key of REACTION_BONUS_PERCENT_KEYS) {
    if (raw.isSet(key)) out[key] = raw.get(key) / 100;
  }

  // Enemy resistance (percent) → enemy_res_<element> fractions. Fold any
  // char-contributed shred from the stats bag into the base enemy resistance
  // (the shred is a RAW negative percent, e.g. Escoffier's A4 `enemy_res_cryo`/
  // `enemy_res_hydro` = -5 at solo → -0.05 each; her `getBuildData` adds the
  // shredding condition's stats into the same bag the resistance is read from).
  // `raw.get` is 0 for any element no char shreds, so this is a no-op for every
  // non-shredder. The engine reads ONLY these emitted fractions; the negative
  // shred lowers `r` and `cMultiplierResistance` reads it directly.
  for (const el of ELEMENTS) {
    const base = resistanceFraction(input.enemy.resistance, el);
    out[`enemy_res_${el}`] = base + raw.get(`enemy_res_${el}`) / 100;
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
