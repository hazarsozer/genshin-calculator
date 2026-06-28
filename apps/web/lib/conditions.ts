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
import { humanizeSlug } from "./utils";

/**
 * Harvest every candidate Condition from all buff channels on a character:
 *   - char.conditions (top-level toggles)
 *   - char.postEffects[].conditions (gating conditions on each post-effect)
 *   - char.multipliers[].condition  (singular gate on each char-level multiplier)
 *   - char.constellation?.entries[].conditions (constellation-injected settings)
 *   - char.partyData?.conditions (conditions this character contributes as a teammate)
 *
 * Note: Feature.condition (singular, on char.features[]) is a production-gate that
 * determines whether the feature is emitted at all — it is NOT a buff condition and
 * is intentionally excluded here.
 *
 * The caller feeds the result through conditionToControl + dedup, so harmless
 * gate-only types (constellation, static, …) are naturally filtered out.
 */
function harvestCharConditions(char: DbObjectChar): readonly Condition[] {
  const out: Condition[] = [];
  const pushAll = (cs?: readonly Condition[]) => {
    if (cs) out.push(...cs);
  };

  pushAll(char.conditions);
  for (const p of char.postEffects ?? []) pushAll(p.conditions);
  for (const m of char.multipliers) if (m.condition) out.push(m.condition);
  for (const e of char.constellation?.entries ?? []) pushAll(e.conditions);
  pushAll(char.partyData?.conditions);

  return out;
}

/**
 * Conditions that share a combined pool cap (same + different ≤ cap).
 * ATFD: party_elements_same + party_elements_different ≤ 3.
 * Only `stacks` conditions surfaced as user sliders need this; others use static-level/boolean-value.
 */
const SHARED_POOL_GROUPS: ReadonlyMap<string, { siblings: readonly string[]; cap: number }> =
  new Map([
    ["party_elements_same", { siblings: ["party_elements_different"], cap: 3 }],
    ["party_elements_different", { siblings: ["party_elements_same"], cap: 3 }],
  ]);

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
  /**
   * For mutually-constrained conditions (e.g. ATFD same+different ≤ 3):
   * siblings whose current sum reduces this slider's available room.
   */
  sharedPool?: { siblings: readonly string[]; cap: number };
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
      const poolEntry = SHARED_POOL_GROUPS.get(name);
      return {
        name,
        kind: "number",
        label: humanizeSlug(name),
        max: cond.maxStacks,
        ...(poolEntry ? { sharedPool: poolEntry } : {}),
      };
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

  // 1. Character conditions (all buff channels — see harvestCharConditions)
  for (const c of harvestCharConditions(char)) push(c);

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

/**
 * Grouped version of collectConditions — maps conditions into their destination
 * drawer rather than a flat list. Each group is independently deduplicated.
 *
 * Groups:
 *   self   → Character drawer   (char's own buff channels)
 *   weapon → Weapon drawer
 *   set    → Artifacts drawer
 *   global → Buffs & Team drawer (CHARACTER_CONDITIONS)
 *   enemy  → Enemy drawer        (ENEMY_CONDITIONS)
 */
export interface GroupedConditions {
  self: ConditionControl[];
  weapon: ConditionControl[];
  set: ConditionControl[];
  global: ConditionControl[];
  enemy: ConditionControl[];
}

function makeGroupCollector() {
  const seen = new Set<string>();
  const out: ConditionControl[] = [];
  function push(cond: Condition): void {
    const ctrl = conditionToControl(cond);
    if (!ctrl) return;
    if (seen.has(ctrl.name)) return;
    seen.add(ctrl.name);
    out.push(ctrl);
  }
  return { push, controls: out };
}

export function collectGroupedConditions(
  char: DbObjectChar,
  weapon: DbObjectWeapon,
  sets: readonly EquippedSet[]
): GroupedConditions {
  const selfG = makeGroupCollector();
  const weaponG = makeGroupCollector();
  const setG = makeGroupCollector();
  const globalG = makeGroupCollector();
  const enemyG = makeGroupCollector();

  for (const c of harvestCharConditions(char)) selfG.push(c);
  for (const c of weapon.conditions ?? []) weaponG.push(c);

  for (const { setKey, pieces } of sets) {
    const set = ARTIFACT_SETS[setKey];
    if (!set) continue;
    for (const tier of [2, 4] as const) {
      if (pieces < tier) continue;
      for (const c of set.bonus[tier]?.conditions ?? []) setG.push(c);
    }
  }

  for (const c of CHARACTER_CONDITIONS) globalG.push(c);
  for (const c of ENEMY_CONDITIONS) enemyG.push(c);

  return {
    self: selfG.controls,
    weapon: weaponG.controls,
    set: setG.controls,
    global: globalG.controls,
    enemy: enemyG.controls,
  };
}
