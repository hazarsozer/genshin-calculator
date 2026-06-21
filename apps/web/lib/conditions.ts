/**
 * collectConditions — build the flat list of UI controls from a character's
 * declared condition data.
 *
 * Sources:
 *   packages/types/src/condition.ts   — Condition discriminated union
 *   packages/data/src/characterConditions.ts — CHARACTER_CONDITIONS / ENEMY_CONDITIONS
 *   wiki/game/mechanics/buff-condition-system.md
 *
 * Only Condition types that require user interaction become controls:
 *   boolean / boolean-refine  → kind: "boolean"  (checkbox, writes conditions.toggles[name])
 *   stacks / number           → kind: "number"   (slider/number, writes conditions.stacks[name])
 *
 * All other types (static, constellation, refine, pieces-count, weapon-type,
 * enemy-status, boolean-value, dropdown, not, lithic, boolean-char, nightsoul,
 * enemy-type, resonance, party-elements, and, or, static-level, char-element,
 * dropdown-element, custom-buffs) are gate-only or always-on — no user control needed.
 *
 * Deduplication is by `name` (first occurrence wins).
 */

import {
  ARTIFACT_SETS,
  CHARACTER_CONDITIONS,
  ENEMY_CONDITIONS,
} from "@genshin/data";
import type { DbObjectChar, DbObjectWeapon, Condition } from "@genshin/types";
import type { EquippedSet } from "@genshin/data";
import { humanizeSlug } from "./utils.js";

/** A single renderable UI control derived from a Condition. */
export interface ConditionControl {
  /** The condition's settings key, e.g. "hutao_paramita_papilio". */
  name: string;
  /** boolean → checkbox; number → slider/number-input */
  kind: "boolean" | "number";
  /** Humanized label for display, e.g. "Hutao Paramita Papilio". */
  label: string;
  /** For kind:"number", the maximum value (from ConditionStacks.maxStacks or ConditionNumber.max). */
  max?: number;
}

/**
 * Map a single Condition to a ConditionControl, or null if it has no UI representation.
 *
 * Returns null for:
 *   - conditions without a `name` field (cannot write to settings by name)
 *   - static / gate-only types (no user interaction)
 */
function conditionToControl(cond: Condition): ConditionControl | null {
  switch (cond.type) {
    case "boolean":
    case "boolean-refine": {
      const name = cond.name;
      if (!name) return null;
      return { name, kind: "boolean", label: humanizeSlug(name) };
    }
    case "stacks": {
      const name = cond.name;
      if (!name) return null;
      return { name, kind: "number", label: humanizeSlug(name), max: cond.maxStacks };
    }
    case "number": {
      const name = cond.name;
      if (!name) return null;
      return {
        name,
        kind: "number",
        label: humanizeSlug(name),
        ...(cond.max !== undefined ? { max: cond.max } : {}),
      };
    }
    case "dropdown": {
      // Dropdown is a multi-state selector — render as a number control (option index).
      const name = cond.name;
      if (!name) return null;
      return {
        name,
        kind: "number",
        label: humanizeSlug(name),
        max: cond.options.length,
      };
    }
    default:
      // All other types are gate-only, always-on, or cannot be expressed as a simple
      // checkbox/slider: static, constellation, refine, pieces-count, weapon-type,
      // enemy-status, boolean-value, not, lithic, boolean-char, nightsoul, enemy-type,
      // resonance, party-elements, and, or, static-level, char-element, dropdown-element,
      // custom-buffs.
      return null;
  }
}

/**
 * Collect all UI-renderable condition controls for a given character + weapon + sets.
 *
 * Flattening order (mirrors her `CalcObjectCharacter.getConditions()` concat):
 *   1. char.conditions
 *   2. weapon.conditions
 *   3. each equipped set's bonus[2] and bonus[4] conditions (piece-count-gated externally)
 *   4. CHARACTER_CONDITIONS (global resonance / imaginarium buffs)
 *   5. ENEMY_CONDITIONS (superconduct)
 *
 * Deduplication: first occurrence of each `name` wins.
 */
export function collectConditions(
  char: DbObjectChar,
  weapon: DbObjectWeapon,
  sets: readonly EquippedSet[]
): ConditionControl[] {
  const seen = new Set<string>();
  const controls: ConditionControl[] = [];

  function push(cond: Condition): void {
    const ctrl = conditionToControl(cond);
    if (!ctrl) return;
    if (seen.has(ctrl.name)) return;
    seen.add(ctrl.name);
    controls.push(ctrl);
  }

  // 1. Character conditions
  for (const c of char.conditions ?? []) push(c);

  // 2. Weapon conditions
  for (const c of weapon.conditions ?? []) push(c);

  // 3. Equipped artifact set conditions (bonus tiers unlocked by piece count)
  for (const { setKey, pieces } of sets) {
    const set = ARTIFACT_SETS[setKey];
    if (!set) continue;
    for (const tier of [2, 4] as const) {
      if (pieces < tier) continue;
      for (const c of set.bonus[tier]?.conditions ?? []) push(c);
    }
  }

  // 4 & 5. Global conditions (elemental resonance, imaginarium theatre, superconduct)
  for (const c of CHARACTER_CONDITIONS) push(c);
  for (const c of ENEMY_CONDITIONS) push(c);

  return controls;
}
