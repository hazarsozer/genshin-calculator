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
 */

import type {
  Condition,
  ConditionBoolean,
  ConditionStacks,
  ConditionConstellation,
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
    case "and":
      return condition.items.every((item) => evaluate(item, ctx));
    case "or":
      return condition.items.some((item) => evaluate(item, ctx));
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

  const raw = condition.name !== undefined ? (ctx[condition.name] as number | undefined) : 0;
  const value = typeof raw === "number" ? raw : 0;
  return Math.min(value, condition.maxStacks);
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

/** Ports ConditionStatic.isActive — always true unless gated/inverted */
function evaluateStatic(
  condition: { condition?: Condition; invert?: boolean },
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
  condition: { name?: string; condition?: Condition; invert?: boolean },
  ctx: EvalContext
): boolean {
  const base = checkGate(condition, ctx);
  if (!base) return false;

  const raw = condition.name !== undefined ? ctx[condition.name] : undefined;
  return typeof raw === "number" ? raw > 0 : false;
}

/** Ports ConditionStacks.isActive */
function evaluateStacks(
  condition: { name?: string; condition?: Condition; invert?: boolean },
  ctx: EvalContext
): boolean {
  const base = checkGate(condition, ctx);
  if (!base) return false;

  const raw = condition.name !== undefined ? ctx[condition.name] : undefined;
  return typeof raw === "number" ? raw > 0 : false;
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
