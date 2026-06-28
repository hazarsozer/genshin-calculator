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
  ConditionBooleanValue,
  ConditionDropdown,
  ConditionNot,
  ConditionBooleanChar,
  ConditionBooleanNightSoul,
  ConditionBooleanEnemyType,
  ConditionResonance,
  ConditionPartyElements,
  ConditionStaticLevel,
  ConditionBooleanCharElement,
  ConditionDropdownElement,
  ConditionCustomBuffs,
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
    case "boolean-value":
      return evaluateBooleanValue(condition, ctx);
    case "dropdown":
      return evaluateDropdown(condition, ctx);
    case "not":
      return !condition.items.every((item) => evaluate(item, ctx));
    case "lithic":
      return true; // always active; publishes weapon_lithic_stacks via conditionSettings
    case "custom-buffs":
      return true; // her ConditionCustomBuffs has no isActive gate (inherits base → checkSubconditions → true)
    case "boolean-char":
      return evaluateBooleanChar(condition, ctx);
    case "nightsoul":
      return evaluateNightSoul(condition, ctx);
    case "enemy-type":
      return evaluateEnemyType(condition, ctx);
    case "resonance":
      return evaluateResonance(condition, ctx);
    case "party-elements":
      return evaluatePartyElements(condition, ctx);
    case "and":
      return condition.items.every((item) => evaluate(item, ctx));
    case "or":
      return condition.items.some((item) => evaluate(item, ctx));
    case "static-level":
      return evaluateStaticLevel(condition, ctx);
    case "char-element":
      return evaluateCharElement(condition, ctx);
    case "dropdown-element":
      return evaluateDropdownElement(condition, ctx);
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
    case "boolean-value":
      // Stat-bearing; refine-scaled when refinementStats is present (her getStats via
      // getLevel('weapon_refine')), else the plain flat `stats` bag.
      return condition.refinementStats !== undefined
        ? { ...toNumberBag(condition.stats), ...(refineBag(condition.refinementStats, ctx) ?? {}) }
        : toNumberBag(condition.stats);
    case "dropdown": {
      // The selected option's refine-scaled bag: options[ctx[name] - 1][weapon_refine - 1].
      // `evaluate` already guaranteed active (selected > 0) above.
      const raw = ctx[condition.name];
      const selected = typeof raw === "number" ? raw : 0;
      const optionBag = selected > 0 ? condition.options[selected - 1] : undefined;
      return optionBag !== undefined ? (refineBag(optionBag, ctx) ?? {}) : {};
    }
    case "and":
    case "or":
    case "not":
    case "pieces-count":
    case "weapon-type":
    case "enemy-status":
    case "lithic":
    case "boolean-char":
    case "nightsoul":
    case "enemy-type":
    case "resonance":
    case "party-elements":
    case "char-element":
    case "dropdown-element":
      // Pure gates / logical containers / settings-publishers carry no stats of their own.
      return {};
    case "boolean":
    case "static":
    case "constellation":
      // Plain stat-bearing variants — `cond.stats` as-is.
      return toNumberBag(condition.stats);
    case "static-level":
      // Level-indexed stat tables; grouped with the plain stat-bearing variants for readability.
      return resolveStaticLevel(condition, ctx);
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
      // Key the clamped value by `stat || name` (her `params.stat || params.name`).
      // `noStat` (her params.noStat) suppresses the emit entirely — the slider still
      // gates + writes its setting, but contributes no bag stat.
      if (condition.noStat) return base;
      return { ...base, [condition.stat ?? condition.name]: clamped };
    }
    case "custom-buffs":
      // The universal manual-buff escape-hatch: strip the `custom_buffs.` prefix from each
      // truthy numeric setting and inject the suffix as a RAW stat (percent /100 happens at
      // emit, not here). Her ConditionCustomBuffs is the ONLY condition reading settings
      // generically — every other reads a fixed `params.stats`.
      return customBuffsBag(condition, ctx);
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
  if (condition.type === "and" || condition.type === "or" || condition.type === "not") return {};
  // Lithic publishes a DYNAMIC settings value computed from the wielder's origin:
  // weapon_lithic_stacks = (Liyue ? 1 : 0) + Liyue party (party=0 in the solo model).
  // A downstream ConditionStacks keyed `weapon_lithic_stacks` reads it.
  // Source: raw/genshin_calc_pub/src/js/classes/Condition/Lithic.js:4-32
  if (condition.type === "lithic") {
    return { weapon_lithic_stacks: ctx["char_origin"] === "liyue" ? 1 : 0 };
  }
  // Every other variant extends ConditionBase, which may carry `.settings`.
  return condition.settings ? { ...condition.settings } : {};
}

// ---------------------------------------------------------------------------
// Stat-resolution helpers (internal)
// ---------------------------------------------------------------------------

/**
 * Port of `ConditionCustomBuffs.getData` — the universal manual-buff escape-hatch. Loops the
 * settings, regex-strips the `custom_buffs.` prefix from each truthy numeric key, and injects the
 * suffix as a RAW stat (her `result.stats.add(m[1], settings[key])`). Returns `{}` when no
 * `custom_buffs.*` key is present → inert for every build that doesn't set one. The percent fold
 * (`/100` for `isPercent` keys) happens once downstream at emit, NOT here (mirroring her single
 * `processPercent` over the whole bag, Stats.js:119-125), so values are emitted RAW.
 *
 * `condition` is unused (her `getData` ignores `this`) but kept in the signature to mirror her
 * instance method and to discriminate the variant. The regex is anchored (`^custom_buffs\.(.+)$`)
 * — her `/custom_buffs.(.*)+/` is unanchored with an unescaped `.`, but the only real keys are
 * literally `custom_buffs.<key>`, so anchoring is a faithful modernisation. Skips 0/non-number
 * values, matching her `if (m && settings[key])` (0 is falsy).
 *
 * Source: raw/genshin_calc_pub/src/js/classes/Condition/CustomBuffs.js:9-23
 */
function customBuffsBag(
  condition: ConditionCustomBuffs,
  ctx: EvalContext
): Record<string, number> {
  void condition;
  const out: Record<string, number> = {};
  for (const key of Object.keys(ctx)) {
    const m = key.match(/^custom_buffs\.(.+)$/);
    if (m === null) continue;
    const v = ctx[key];
    if (typeof v === "number" && v !== 0) out[m[1]!] = v;
  }
  return out;
}

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

/**
 * Ports ConditionBooleanValue.checkSubconditions — active when `ctx[setting] <cond> value`,
 * AND the optional `.condition` gate passes. The compare value reads `ctx[setting]` (a number;
 * absent → 0, her `settings[setting] || 0`); the threshold defaults to 0. `invert` flips it.
 *
 * Source: raw/genshin_calc_pub/src/js/classes/Condition/Boolean/Value.js:13-43
 */
const VALUE_OPS: Readonly<
  Record<ConditionBooleanValue["cond"], (a: number, b: number) => boolean>
> = {
  gt: (a, b) => a > b,
  ge: (a, b) => a >= b,
  eq: (a, b) => a === b,
  le: (a, b) => a <= b,
  lt: (a, b) => a < b,
};

function evaluateBooleanValue(
  condition: ConditionBooleanValue,
  ctx: EvalContext
): boolean {
  if (!checkGate(condition, ctx)) return false;
  const raw = ctx[condition.setting];
  const value2 = typeof raw === "number" ? raw : 0;
  const value1 = condition.value ?? 0;
  const active = VALUE_OPS[condition.cond](value2, value1);
  return condition.invert ? !active : active;
}

/**
 * Ports ConditionDropdown.isActive — active when `ctx[name]` is a positive number (a selected
 * option), AND the optional `.condition` gate passes. The stat bag is resolved in
 * `conditionStats` (the selected option's refine-scaled bag). `invert` flips activeness.
 *
 * Source: raw/genshin_calc_pub/src/js/classes/Condition/Dropdown.js:42-65
 */
function evaluateDropdown(condition: ConditionDropdown, ctx: EvalContext): boolean {
  if (!checkGate(condition, ctx)) return false;
  const raw = ctx[condition.name];
  const active = typeof raw === "number" && raw > 0;
  return condition.invert ? !active : active;
}

/**
 * Ports ConditionBooleanDropdownValue.isActive — active when `ctx[name]` (a `;`-delimited
 * element string) split-includes `element`, AND the optional `.condition` gate passes.
 * Mirrors raw exactly: `(settings[name] || '').split(';').includes(this.params.value)`
 * after the super (boolean) gate. An absent/empty selection → `[''].includes(element)` →
 * false (no element matches the empty token). `invert` flips the result.
 * Source: raw/genshin_calc_pub/src/js/classes/Condition/Boolean/DropdownValue.js:4-12
 */
function evaluateDropdownElement(condition: ConditionDropdownElement, ctx: EvalContext): boolean {
  if (!checkGate(condition, ctx)) return false;
  const raw = ctx[condition.name];
  const selection = typeof raw === "string" ? raw : "";
  const active = selection.split(";").includes(condition.element);
  return condition.invert ? !active : active;
}

/** Ports ConditionBooleanChar.isActive — active when ctx["char_name"] is in `chars`. */
function evaluateBooleanChar(condition: ConditionBooleanChar, ctx: EvalContext): boolean {
  if (!checkGate(condition, ctx)) return false;
  const name = ctx["char_name"];
  const active = typeof name === "string" && condition.chars.includes(name);
  return condition.invert ? !active : active;
}

/**
 * Ports ConditionBooleanCharElement.isActive — active when ctx["char_element"] is in
 * `elements`, AND the optional `.condition` gate passes. Mirrors raw:
 *   `checkSubconditions && this.params.element.includes(settings.char_element)`
 * (a non-array/absent element → false). `invert` flips the result.
 * Source: raw/genshin_calc_pub/src/js/classes/Condition/Boolean/CharElement.js
 */
function evaluateCharElement(condition: ConditionBooleanCharElement, ctx: EvalContext): boolean {
  if (!checkGate(condition, ctx)) return false;
  const el = ctx["char_element"];
  const active = typeof el === "string" && condition.elements.includes(el);
  return condition.invert ? !active : active;
}

/**
 * Ports ConditionBooleanNightSoul.isActive — active for NightSoul-capable wielders:
 * `ctx["char_origin"] === "natlan"` (or `char_id === 100` for TravelerPyro, deferred until
 * char_id is injected). Source: raw/.../Condition/Boolean/NightSoul.js.
 */
function evaluateNightSoul(condition: ConditionBooleanNightSoul, ctx: EvalContext): boolean {
  if (!checkGate(condition, ctx)) return false;
  const active = ctx["char_origin"] === "natlan" || ctx["char_id"] === 100;
  return condition.invert ? !active : active;
}

/**
 * Ports ConditionResonance.isActive (Resonance.js:8-38) — its getType() is 'static', so it
 * first runs `super.isActive` (our checkGate), then counts each element across the four
 * resonance slots (`char_element`, `resonance_element_1/2/3`), tracking whether any element
 * appears twice (`isDuo`). With a target `element`, active iff that element's count >= 2;
 * with no target (the none-case), active iff `!isDuo`. `invert` flips the result.
 *
 * Faithful detail: a falsy slot value (`!element`) is skipped, exactly her `if (!element) continue`.
 */
const RESONANCE_SLOTS = [
  "char_element",
  "resonance_element_1",
  "resonance_element_2",
  "resonance_element_3",
] as const;

function evaluateResonance(condition: ConditionResonance, ctx: EvalContext): boolean {
  if (!checkGate(condition, ctx)) return false;

  const counts: Record<string, number> = {};
  let isDuo = false;
  for (const slot of RESONANCE_SLOTS) {
    const element = ctx[slot];
    if (typeof element !== "string" || element === "") continue;
    if (counts[element] === undefined) {
      counts[element] = 1;
    } else {
      counts[element] += 1;
      isDuo = true;
    }
  }

  const target = condition.element;
  let active = false;
  if (target !== undefined && target !== "") {
    active = (counts[target] ?? 0) >= 2;
  } else if (!isDuo) {
    active = true;
  }
  return condition.invert ? !active : active;
}

/**
 * Ports the shared Chevreuse/Nilou/SkirkParty.isActive logic — scans the four resonance
 * slots (`char_element`, `resonance_element_1/2/3`) and returns `hasA && hasB && !hasOther`
 * after the super (subcondition) gate: the party must contain BOTH `elements` and ONLY those.
 *
 * Faithful detail: a falsy slot value is skipped (her `if (!element) continue`); any element
 * outside the pair sets `hasOther` (her `else` branch). `invert` flips the result.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/classes/Condition/Boolean/ChevreuseParty.js (pyro + electro)
 *   raw/genshin_calc_pub/src/js/classes/Condition/Boolean/NilouParty.js     (hydro + dendro)
 *   raw/genshin_calc_pub/src/js/classes/Condition/Boolean/SkirkParty.js     (cryo + hydro)
 */
function evaluatePartyElements(condition: ConditionPartyElements, ctx: EvalContext): boolean {
  if (!checkGate(condition, ctx)) return false;

  const [elementA, elementB] = condition.elements;
  let hasA = false;
  let hasB = false;
  let hasOther = false;
  for (const slot of RESONANCE_SLOTS) {
    const element = ctx[slot];
    if (typeof element !== "string" || element === "") continue;
    if (element === elementA) hasA = true;
    else if (element === elementB) hasB = true;
    else hasOther = true;
  }

  const active = hasA && hasB && !hasOther;
  return condition.invert ? !active : active;
}

/** Ports ConditionBooleanEnemyType.isActive — active when ctx["enemy_type"] is in `types`. */
function evaluateEnemyType(condition: ConditionBooleanEnemyType, ctx: EvalContext): boolean {
  if (!checkGate(condition, ctx)) return false;
  const typ = ctx["enemy_type"];
  const active = typeof typ === "string" && condition.types.includes(typ);
  return condition.invert ? !active : active;
}

/**
 * Ports ConditionStaticLevel.isActive — inherits ConditionStatic semantics:
 * active iff the optional `.condition` gate passes (always-active-if-gated).
 *
 * Source: raw/genshin_calc_pub/src/js/classes/Condition/Static/Level.js
 *   ConditionStaticLevel extends ConditionStatic (which extends ConditionBase);
 *   isActive = checkSubconditions (inherited) → our checkGate.
 */
function evaluateStaticLevel(condition: ConditionStaticLevel, ctx: EvalContext): boolean {
  const base = checkGate(condition, ctx);
  return condition.invert ? !base : base;
}

/**
 * Resolves the level-indexed stat bag for an active ConditionStaticLevel.
 *
 * Replicates StatTable.getValue(level) exactly:
 *   level <= 0  → 0
 *   level > arr.length → arr[arr.length - 1]   (clamp to last)
 *   else        → arr[level - 1]               (1-indexed)
 *
 * getLevel semantics (Level.js:5-16):
 *   raw = ctx[levelSetting] || 0
 *   raw += ctx[levelSetting + "_bonus"] || 0
 *   raw += ctx[levelSetting + "_bonus_2"] || 0
 *   if fromZero: level = raw + 1
 *   else:        level = raw || 1              (fallthrough to 1 when 0; not used by GildedDreams)
 *
 * The _bonus accumulation mirrors buildStats.ts toPostEffect (lines ~330-332).
 * Stats whose resolved value is 0 are omitted from the result bag.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/classes/Condition/Static/Level.js (getLevel, getStats)
 *   raw/genshin_calc_pub/src/js/classes/StatTable.js (getValue)
 */
function resolveStaticLevel(
  condition: ConditionStaticLevel,
  ctx: EvalContext
): Record<string, number> {
  const rawVal = ctx[condition.levelSetting];
  let raw = typeof rawVal === "number" ? rawVal : 0;
  raw += (ctx[`${condition.levelSetting}_bonus`] as number | undefined) ?? 0;
  raw += (ctx[`${condition.levelSetting}_bonus_2`] as number | undefined) ?? 0;
  const level = condition.fromZero ? raw + 1 : raw || 1;

  const out: Record<string, number> = {};
  for (const key of Object.keys(condition.levelStats)) {
    const arr = condition.levelStats[key]!;
    const value = staticLevelGetValue(arr, level);
    if (value !== 0) out[key] = value;
  }
  return out;
}

/**
 * StatTable.getValue replication (StatTable.js:11-19):
 *   if level > 0:
 *     if level > length: level = length
 *     return values[level - 1]
 *   return 0
 */
function staticLevelGetValue(arr: readonly number[], level: number): number {
  if (level > 0) {
    const idx = Math.min(level, arr.length);
    return arr[idx - 1] ?? 0;
  }
  return 0;
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
