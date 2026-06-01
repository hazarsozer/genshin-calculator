/**
 * Core condition evaluator.
 *
 * Conditions are pure, immutable data objects (defined in @genshin/types).
 * This module provides pure functions that evaluate them against an EvalContext.
 *
 * No global state, no class instances, no side effects.
 * The predicate tree is fully serialisable because the data objects are plain JSON.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/classes/Condition.js        (base + checkSubconditions)
 *   raw/genshin_calc_pub/src/js/classes/Condition/Boolean.js
 *   raw/genshin_calc_pub/src/js/classes/Condition/Static.js
 *   raw/genshin_calc_pub/src/js/classes/Condition/Static/Refine.js
 *   raw/genshin_calc_pub/src/js/classes/Condition/Constellation.js
 *   raw/genshin_calc_pub/src/js/classes/Condition/Number.js
 *   raw/genshin_calc_pub/src/js/classes/Condition/Stacks.js
 *   raw/genshin_calc_pub/src/js/classes/Condition/And.js
 *   raw/genshin_calc_pub/src/js/classes/Condition/Or.js
 *   raw/genshin_calc_pub/src/js/classes/Condition/Boolean/WeaponType.js
 */

import type {
  Condition,
  ConditionBoolean,
  ConditionBooleanRefine,
  ConditionStatic,
  ConditionStaticRefine,
  ConditionConstellation,
  ConditionNumber,
  ConditionStacks,
  ConditionBooleanPiecesCount,
  ConditionBooleanWeaponType,
  ConditionEnemyStatus,
  ConditionStats,
  EvalContext,
} from "@genshin/types";

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Evaluate a condition against an immutable context.
 *
 * Returns `true` when the condition is satisfied (the buff it guards applies).
 *
 * Faithful to her `isActive(settings)` evaluation semantics, modernised:
 *   - no global/singleton reads
 *   - no mutation of the context
 *   - explicit recursive dispatch over the discriminated union
 */
export function evaluate(condition: Condition, ctx: EvalContext): boolean {
  switch (condition.type) {
    case "boolean":
      return evaluateBoolean(condition, ctx);
    case "boolean-refine":
      return evaluateBooleanRefine(condition, ctx);
    case "static":
      return evaluateStatic(condition, ctx);
    case "refine":
      return evaluateStatic(condition, ctx); // StaticRefine inherits Static semantics
    case "constellation":
      return evaluateConstellation(condition, ctx);
    case "number":
      return evaluateNumber(condition, ctx);
    case "stacks":
      return evaluateStacks(condition, ctx);
    case "pieces-count":
      return evaluatePiecesCount(condition, ctx);
    case "weapon-type":
      return evaluateWeaponType(condition, ctx);
    case "enemy-status":
      return evaluateEnemyStatus(condition, ctx);
    case "and":
      return condition.items.every((item) => evaluate(item, ctx));
    case "or":
      return condition.items.some((item) => evaluate(item, ctx));
    default: {
      // Exhaustiveness tripwire: a new Condition variant without a case is a compile error.
      const _exhaustive: never = condition;
      return _exhaustive;
    }
  }
}

/**
 * For a `stacks` condition: return the current stack count (0 when inactive),
 * clamped to [0, maxStacks].
 *
 * Faithful port of ConditionStacks.getStacksCnt(settings).
 */
export function getStackCount(condition: ConditionStacks, ctx: EvalContext): number {
  if (!evaluateStacks(condition, ctx)) return 0;

  // name absent → raw is 0; the typeof guard below narrows the unknown ctx[name] path.
  const raw = condition.name !== undefined ? ctx[condition.name] : 0;
  const value = typeof raw === "number" ? raw : 0;
  return Math.min(value, condition.maxStacks);
}

/**
 * Resolve the RAW stat bag a condition contributes when active under `ctx`.
 *
 * The per-condition half of the loop her `CalcSet.getBaseStats` runs
 * (`cond.getData(settings).stats`), pure and modernised. Returns `{}` when the
 * condition is inactive (so the caller can `concat` unconditionally).
 *
 * Resolution by variant:
 *   - inactive (`evaluate` → false)                    → `{}`
 *   - `stacks`   → `getStackCount × per-stack bag`, where the per-stack bag is
 *     `refinementStats[weapon_refine - 1]` when present (her `levelSetting:
 *     "weapon_refine"` path) else `cond.stats`. Mirrors `ConditionStacks.getStats`
 *     (`stat.getValue(level) * stacksCnt`).
 *   - `refine`/`boolean-refine` → `refinementStats[weapon_refine - 1]` folded with
 *     any non-refine `cond.stats`. Refine is **1-indexed**; an absent or ≤0
 *     `weapon_refine` resolves the refine bag to nothing (her
 *     `StatTable.getValue(level)` returns 0 for `level <= 0`).
 *   - every other active variant → `cond.stats` (`{}` if absent).
 *
 * Percent stats stay RAW (e.g. `atk_percent: 20`) — `buildStats`'s emit-time
 * `/100` converts them; this resolver never pre-divides.
 *
 * Reads only `Condition` + `EvalContext` (+ types) — no `@genshin/data` import
 * (engine purity).
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/classes/CalcSet.js (getBaseStats loop)
 *   raw/genshin_calc_pub/src/js/classes/Condition/Static/Refine.js (getStats via getValue(weapon_refine))
 *   raw/genshin_calc_pub/src/js/classes/Condition/Stacks.js (getStats × stacksCnt)
 *   raw/genshin_calc_pub/src/js/classes/StatTable.js (getValue(level<=0) === 0)
 */
export function conditionStats(condition: Condition, ctx: EvalContext): Record<string, number> {
  if (!evaluate(condition, ctx)) return {};

  switch (condition.type) {
    case "stacks": {
      const count = getStackCount(condition, ctx);
      if (count === 0) return {};
      const perStack = refineBag(condition.refinementStats, ctx) ?? condition.stats ?? {};
      return scaleBag(perStack, count);
    }
    case "refine":
    case "boolean-refine":
      return { ...toNumberBag(condition.stats), ...(refineBag(condition.refinementStats, ctx) ?? {}) };
    case "and":
    case "or":
    case "pieces-count":
    case "weapon-type":
    case "enemy-status":
      // Pure gates / logical containers carry no stats of their own.
      return {};
    case "boolean":
    case "static":
    case "constellation":
      // Plain stat-bearing variants — `cond.stats` as-is.
      return toNumberBag(condition.stats);
    case "number": {
      // Plain stat-bearing variants — `cond.stats` as-is, PLUS the dynamic
      // clamped value injected as a stat keyed by the condition's name.
      //
      // Her ConditionNumber.getStats() (Condition/Number.js:58-70) calls
      // `super.getStats()` (i.e. `cond.stats`), then ALSO does:
      //   `stats.add(this.params.stat || this.params.name, this.getValue(settings))`
      // where `getValue` clamps the raw settings value to [min, max]. This is how
      // `party_max_mastery: 1000` becomes a stat named `party_max_mastery` with
      // value `min(settings.party_max_mastery, max=1000)` = 1000.
      // The PostEffectStatsNahida then reads it via `makeStatItem('party_max_mastery')`.
      //
      // Source: raw/genshin_calc_pub/src/js/classes/Condition/Number.js:58-70
      const base = toNumberBag(condition.stats);
      if (condition.name === undefined) return base;
      // getValue semantics: clamp(ctx[name], min=0, max) → the dynamic stat value.
      const raw = ctx[condition.name];
      const rawNum = typeof raw === "number" ? raw : 0;
      const min = condition.min ?? 0;
      const max = condition.max;
      const clamped = max !== undefined
        ? Math.min(max, Math.max(min, rawNum))
        : Math.max(min, rawNum);
      return { ...base, [condition.name]: clamped };
    }
    default: {
      // Exhaustiveness tripwire: a new Condition variant must be handled above,
      // not silently fall through to `cond.stats`.
      const _exhaustive: never = condition;
      return _exhaustive;
    }
  }
}

/**
 * Resolve the SETTINGS a condition contributes when active under `ctx`.
 *
 * The settings half of her `CalcSet.getBaseStats` loop: each condition's
 * `getData(settings)` returns `{ stats, settings }`, and the running settings are
 * extended with the active condition's `params.settings`
 * (`result.settings.concat(result.settings, condData.settings)`,
 * raw CalcSet.js:360-363; `getData` returns `params.settings` only when active,
 * Condition.js:118-125). `conditionStats` is the `stats` half; this is the `settings`
 * half — kept a separate pure function so callers can thread the merged settings.
 *
 * Returns `{}` when the condition is inactive, when it carries no `.settings`, or for
 * the logical containers (`and`/`or`) — whose operands contribute their own settings
 * where they are declared, exactly like `conditionStats`.
 *
 * The propagated keys feed downstream resolution as her settings object does:
 *   - talent-level bumps `char_skill_<slot>_bonus` (Hu Tao C3/C5) read by the
 *     talent-level resolver (compileFeature `baseDamageTerm`, her Feature.getTalentLevel),
 *   - infusions `attack_infusion` (Paramita), level/enemy selectors, etc.
 *
 * Reads only `Condition` + `EvalContext` — no `@genshin/data` import (engine purity).
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/classes/Condition.js (getData)
 *   raw/genshin_calc_pub/src/js/classes/CalcSet.js (getBaseStats settings merge)
 */
export function conditionSettings(
  condition: Condition,
  ctx: EvalContext
): Record<string, unknown> {
  if (!evaluate(condition, ctx)) return {};
  // Logical containers carry no settings of their own (their operands do).
  if (condition.type === "and" || condition.type === "or") return {};
  // Every other variant extends ConditionBase, which may carry `.settings`.
  return condition.settings ? { ...condition.settings } : {};
}

// ---------------------------------------------------------------------------
// Stat-resolution helpers (internal)
// ---------------------------------------------------------------------------

/** Coerce a possibly-undefined ConditionStats bag into a plain number record. */
function toNumberBag(stats: ConditionStats | undefined): Record<string, number> {
  if (stats === undefined) return {};
  const out: Record<string, number> = {};
  for (const key of Object.keys(stats)) {
    const v = stats[key];
    if (v !== undefined) out[key] = v;
  }
  return out;
}

/** Multiply every stat in a bag by a scalar (per-stack → total). */
function scaleBag(stats: ConditionStats, factor: number): Record<string, number> {
  const out: Record<string, number> = {};
  for (const key of Object.keys(stats)) {
    const v = stats[key];
    if (v !== undefined) out[key] = v * factor;
  }
  return out;
}

/**
 * Resolve the `weapon_refine`-indexed per-rank bag (1-indexed, R1..R5).
 *
 * Returns `undefined` when there is no refinement table, OR when `weapon_refine`
 * is absent / ≤ 0 — faithful to her `StatTable.getValue(level)` returning 0 for
 * `level <= 0` (no refine → no refine-scaled contribution). Out-of-range ranks
 * clamp to the last entry, matching `getValue`'s `level > length` clamp.
 */
function refineBag(
  refinementStats: readonly ConditionStats[] | undefined,
  ctx: EvalContext
): Record<string, number> | undefined {
  if (refinementStats === undefined || refinementStats.length === 0) return undefined;
  const refineRaw = ctx["weapon_refine"];
  const refine = typeof refineRaw === "number" ? refineRaw : 0;
  if (refine <= 0) return undefined;
  const index = Math.min(refine, refinementStats.length) - 1;
  return toNumberBag(refinementStats[index]);
}

// ---------------------------------------------------------------------------
// Per-type evaluators (internal)
// ---------------------------------------------------------------------------

/** Ports ConditionBoolean.isActive */
function evaluateBoolean(condition: ConditionBoolean, ctx: EvalContext): boolean {
  const base = checkGate(condition, ctx);
  if (!base) return false;

  const settingValue = condition.name !== undefined ? ctx[condition.name] : undefined;
  const active = Boolean(settingValue);
  return condition.invert ? !active : active;
}

/**
 * Ports ConditionBooleanRefine.isActive — same activation logic as ConditionBoolean.
 * Active when ctx[name] is truthy; stat resolution (using weapon_refine) is P2.2's domain.
 * Source: raw/genshin_calc_pub/src/js/classes/Condition/Boolean/Refine.js
 */
function evaluateBooleanRefine(condition: ConditionBooleanRefine, ctx: EvalContext): boolean {
  const base = checkGate(condition, ctx);
  if (!base) return false;

  const settingValue = ctx[condition.name];
  const active = Boolean(settingValue);
  return condition.invert ? !active : active;
}

/** Ports ConditionStatic.isActive — always true unless gated/inverted */
function evaluateStatic(
  condition: ConditionStatic | ConditionStaticRefine,
  ctx: EvalContext
): boolean {
  const base = checkGate(condition, ctx);
  return condition.invert ? !base : base;
}

/** Ports ConditionConstellation.isActive */
function evaluateConstellation(condition: ConditionConstellation, ctx: EvalContext): boolean {
  const constellationInCtx = ctx["char_constellation"];
  const level = typeof constellationInCtx === "number" ? constellationInCtx : 0;
  const active = level >= condition.constellation;
  return condition.invert ? !active : active;
}

/** Ports ConditionNumber.isActive */
function evaluateNumber(
  condition: ConditionNumber,
  ctx: EvalContext
): boolean {
  const base = checkGate(condition, ctx);
  if (!base) return false;

  const raw = condition.name !== undefined ? ctx[condition.name] : undefined;
  return typeof raw === "number" ? raw > 0 : false;
}

/** Ports ConditionStacks.isActive */
function evaluateStacks(
  condition: ConditionStacks,
  ctx: EvalContext
): boolean {
  const base = checkGate(condition, ctx);
  if (!base) return false;

  const raw = condition.name !== undefined ? ctx[condition.name] : undefined;
  return typeof raw === "number" ? raw > 0 : false;
}

/**
 * Ports ConditionBooleanPiecesCount.isActive — active when the equipped count of
 * the named set (read from `ctx['set_pieces.' + setName.toLowerCase()]`) is at
 * least `count`, AND the optional `.condition` gate passes. Mirrors raw
 * `settings[Artifact.settingName(setName)] >= count` then `super.isActive`.
 */
function evaluatePiecesCount(
  condition: ConditionBooleanPiecesCount,
  ctx: EvalContext
): boolean {
  const settingKey = `set_pieces.${condition.setName.toLowerCase()}`;
  const equipped = ctx[settingKey];
  const enough = typeof equipped === "number" && equipped >= condition.count;
  if (!enough) return false;
  const base = checkGate(condition, ctx);
  return condition.invert ? !base : base;
}

/**
 * Ports ConditionBooleanWeaponType.isActive — active when ctx["weapon_type"] is
 * in `types`, AND the optional `.condition` gate passes. Mirrors raw:
 *   `checkSubconditions(settings) && types.includes(settings.weapon_type)`.
 */
function evaluateWeaponType(
  condition: ConditionBooleanWeaponType,
  ctx: EvalContext
): boolean {
  if (!checkGate(condition, ctx)) return false;
  const wt = ctx["weapon_type"];
  const active = typeof wt === "string" && condition.types.includes(wt);
  return condition.invert ? !active : active;
}

/**
 * Ports ConditionEnemyStatus.isActive — active when ctx["common.enemy_status"] is a
 * non-empty string in `statuses`, AND the optional `.condition` gate passes. Mirrors raw:
 *   `checkSubconditions(settings) && status && statuses.includes(status)` (EnemyStatus.js:9-19),
 * where a falsy `common.enemy_status` yields `false` (the `result = false` branch). An absent
 * context key → inactive. `invert` flips the result (her `ConditionNot` wrapper).
 */
function evaluateEnemyStatus(
  condition: ConditionEnemyStatus,
  ctx: EvalContext
): boolean {
  if (!checkGate(condition, ctx)) return false;
  const status = ctx["common.enemy_status"];
  const active =
    typeof status === "string" && status !== "" && condition.statuses.includes(status);
  return condition.invert ? !active : active;
}

// ---------------------------------------------------------------------------
// Gate helper (replaces her checkSubconditions / params.condition)
// ---------------------------------------------------------------------------

/**
 * Check the optional `.condition` gate on a condition variant.
 *
 * Ports Condition.checkSubconditions():
 *   if (params.condition) return params.condition.isActive(settings)
 *   // (deprecated subConditions path omitted — not needed for new eval layer)
 *   return true
 */
function checkGate(
  condition: { condition?: Condition },
  ctx: EvalContext
): boolean {
  if (condition.condition !== undefined) {
    return evaluate(condition.condition, ctx);
  }
  return true;
}
