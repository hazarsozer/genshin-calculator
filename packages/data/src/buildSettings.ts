/**
 * buildSettings — turn typed build input into an immutable EvalContext.
 *
 * This is the single place raw user input becomes settings. It is pure:
 * it reads the input, builds a new frozen object, and returns it.
 * It never mutates the input or any intermediate object.
 *
 * The keys emitted MUST match exactly what the condition evaluator reads:
 *
 *   `char_constellation` — read by ConditionConstellation:
 *     `settings.char_constellation >= this.params.constellation`
 *     Source: raw/genshin_calc_pub/src/js/classes/Condition/Constellation.js
 *
 *   `weapon_refine` — read by ConditionStaticRefine for refinement-indexed stats:
 *     `stat.getValue(settings.weapon_refine)`
 *     Source: raw/genshin_calc_pub/src/js/classes/Condition/Static/Refine.js
 *
 *   `attack_infusion` — consumed by the engine's infusion resolver (reserved key).
 *     Source: raw/genshin_calc_pub/src/js/classes/CalcSet.js (settings bag shape)
 *
 *   toggle/stack keys — each condition's own `name` key:
 *     ConditionBoolean: `settings[this.params.name] ? true : false`
 *     ConditionStacks:  `settings[this.params.name] > 0`
 *     ConditionNumber:  `settings[this.params.name] > 0`
 *     Source: raw/genshin_calc_pub/src/js/classes/Condition/Boolean.js,
 *             raw/genshin_calc_pub/src/js/classes/Condition/Stacks.js,
 *             raw/genshin_calc_pub/src/js/classes/Condition/Number.js
 */

import type { EvalContext } from "@genshin/types";

/**
 * Typed input for building an EvalContext from user-facing build parameters.
 *
 * All fields are optional; absent fields are omitted from the resulting context
 * so the base / C0 evaluation path is byte-unchanged (no stray keys).
 */
export interface BuildSettingsInput {
  /** Constellation level (0–6). Emitted as `char_constellation`. */
  readonly constellation?: number;
  /** Weapon refinement rank (1–5). Emitted as `weapon_refine`. */
  readonly weaponRefine?: number;
  /**
   * Boolean toggles keyed by the condition's `name`.
   * Each key is spread into the context as-is.
   * Example: `{ hutao_paramita_papilio: true }`
   */
  readonly toggles?: Readonly<Record<string, boolean>>;
  /**
   * Stack counts keyed by the condition's `name`.
   * Each key is spread into the context as-is. Values of 0 are included
   * (they produce an inactive stacks condition).
   * Also serves ConditionNumber (numeric sliders): `ctx[name] > 0` is
   * the active check for both, so slider values go here with the same
   * `> 0` active semantics as stacks.
   * Example: `{ shenhe_icy_quill: 3 }`
   */
  readonly stacks?: Readonly<Record<string, number>>;
  /**
   * Infusion element override (e.g. `"pyro"`, `"cryo"`).
   * Emitted as `attack_infusion`.
   */
  readonly infusion?: string;
}

/**
 * Build an immutable EvalContext from typed build input.
 *
 * - Absent optional fields are omitted from the returned object (no stray keys).
 * - The returned object is frozen (Object.freeze) — callers must not mutate it.
 * - The input is never mutated.
 * - Empty input returns `{}` so the base / C0 evaluation path is unchanged.
 *
 * @param input - Optional typed build parameters. Defaults to `{}`.
 * @returns A frozen EvalContext ready to pass to `evaluate()` / `getStackCount()`.
 */
export function buildSettings(input: BuildSettingsInput = {}): EvalContext {
  const bag: Record<string, unknown> = {};

  if (input.constellation !== undefined) {
    bag["char_constellation"] = input.constellation;
  }

  if (input.weaponRefine !== undefined) {
    bag["weapon_refine"] = input.weaponRefine;
  }

  if (input.toggles !== undefined) {
    for (const [key, value] of Object.entries(input.toggles)) {
      bag[key] = value;
    }
  }

  if (input.stacks !== undefined) {
    for (const [key, value] of Object.entries(input.stacks)) {
      bag[key] = value;
    }
  }

  if (input.infusion !== undefined) {
    bag["attack_infusion"] = input.infusion;
  }

  return Object.freeze(bag);
}
