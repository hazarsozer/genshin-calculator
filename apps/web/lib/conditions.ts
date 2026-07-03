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
  CONDITION_STRINGS,
  ENEMY_CONDITIONS,
} from "@genshin/data";
import type { DbObjectChar, DbObjectWeapon, Condition } from "@genshin/types";
import type { EquippedSet } from "@genshin/data";
import { humanizeSlug } from "./utils";

/**
 * Engine bag-emit-only globals: their INPUT sliders are owned per-entity
 * (Character/Weapon/Artifacts) and render via harvesting. Never surface them
 * from the global CHARACTER_CONDITIONS dump — that is exactly the leak
 * (Bond of Life / Neuvillette discipline / Song-of-Days-Past team input).
 */
const GLOBAL_EMIT_ONLY: ReadonlySet<string> = new Set([
  "common.bond_of_life",
  "neuvillette_the_high_arbitrators_discipline",
  "party_days_past_healing_recorded",
]);

/**
 * Harvest every candidate Condition from all buff channels on a character:
 *   - char.conditions (top-level toggles)
 *   - char.postEffects[].conditions (gating conditions on each post-effect)
 *   - char.multipliers[].condition  (singular gate on each char-level multiplier)
 *   - char.constellation?.entries[].conditions (constellation-injected settings)
 *   - char.partyData?.conditions (conditions this character contributes as a teammate,
 *     EXCLUDING number/stacks scaling-stat inputs like xilonen_def_total — see
 *     ACTIVE_CHAR_EXCLUDED_PARTY_INPUT below)
 *
 * Note: Feature.condition (singular, on char.features[]) is a production-gate that
 * determines whether the feature is emitted at all — it is NOT a buff condition and
 * is intentionally excluded here.
 *
 * The caller feeds the result through conditionToControl + dedup, so harmless
 * gate-only types (constellation, static, …) are naturally filtered out.
 */
/**
 * partyData scaling-stat inputs (e.g. xilonen_def_total) exist for the
 * TEAMMATE lane, where the buffer's sheet isn't computed. For the ACTIVE
 * character the engine reads the computed sheet — a manual field here is a
 * footgun. Audited 2026-07-03 (Task 4, Finding 3): every partyData number/
 * stacks condition matching this suffix shape is read ONLY inside its own
 * char's `partyData.multipliers`/`partyData.postEffects` (never the char's
 * own top-level `multipliers`/`postEffects`) — full ledger in
 * .superpowers/sdd/task-4-report.md. Teammate lane: collectPartyConditions
 * (unchanged) still surfaces these via `char.partyData.conditions` directly.
 */
const ACTIVE_CHAR_EXCLUDED_PARTY_INPUT = /_(total|base|max_hp|mastery_total)$/;

function harvestCharConditions(char: DbObjectChar): readonly Condition[] {
  const out: Condition[] = [];
  const pushAll = (cs?: readonly Condition[]) => {
    if (cs) out.push(...cs);
  };

  pushAll(char.conditions);
  for (const p of char.postEffects ?? []) pushAll(p.conditions);
  for (const m of char.multipliers) if (m.condition) out.push(m.condition);
  for (const e of char.constellation?.entries ?? []) pushAll(e.conditions);

  for (const c of char.partyData?.conditions ?? []) {
    const name = (c as { name?: string }).name;
    if (
      name !== undefined &&
      (c.type === "number" || c.type === "stacks") &&
      ACTIVE_CHAR_EXCLUDED_PARTY_INPUT.test(name)
    )
      continue;
    out.push(c);
  }

  return out;
}

/**
 * Nested-gate extraction (2026-07-03 harvester extension).
 *
 * The Tier-B self-buff sweep ported ~100 chars' stances/toggles as `static`
 * conditions gated on NESTED booleans and as `Feature.condition` production
 * gates — none of which conditionToControl surfaces. This walker extracts
 * those user-facing gates as boolean controls. Gate names that are PUBLISHED
 * by another condition (settings:{} / settings-copy.to) or carry derived
 * prefixes are engine-internal, never user choices.
 *
 * Drift guard: lib/__tests__/nestedGates.test.ts locks the exact extracted
 * set per character against an audited literal.
 */
const DERIVED_GATE_PREFIX =
  /^(char_|party_|resonance_|weapon_|enemy_|attack_infusion)/;

/** Labels for gates whose CSV lookup (after the common.-prefix strip) has no entry. */
const NESTED_GATE_LABELS: ReadonlyMap<string, string> = new Map([
  ["common.nightsoul_blessing_state", "Nightsoul's Blessing"],
]);

/**
 * Nested gates that are stack COUNTS in the engine (consumed as table indices),
 * audited vs raw 2026-07-03 — surface as number controls, not booleans.
 * name → max stacks (= consuming table length in packages/data, cross-checked
 * vs raw maxStacks).
 */
const NESTED_GATE_STACKS: ReadonlyMap<string, number> = new Map([
  ["albedo_opening_of_hanerozoic", 4],
  ["skirk_return_to_oblivion", 3],
  ["yanfei_scarlet_seal", 4],
]);

function walkGateNames(node: unknown, out: Set<string>): void {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (const n of node) walkGateNames(n, out);
    return;
  }
  const o = node as Record<string, unknown>;
  if (o.type === "boolean" && typeof o.name === "string") out.add(o.name);
  if (o.condition) walkGateNames(o.condition, out);
  if (o.items) walkGateNames(o.items, out);
}

function walkPublishedKeys(node: unknown, out: Set<string>): void {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (const n of node) walkPublishedKeys(n, out);
    return;
  }
  const o = node as Record<string, unknown>;
  if (o.settings && typeof o.settings === "object")
    for (const k of Object.keys(o.settings as object)) out.add(k);
  if (o.type === "settings-copy" && typeof o.to === "string") out.add(o.to);
  if (o.items) walkPublishedKeys(o.items, out);
}

export function extractNestedGateControls(char: DbObjectChar): ConditionControl[] {
  const conditionSources: readonly Condition[] = [
    ...(char.conditions ?? []),
    ...(char.constellation?.entries ?? []).flatMap((e) => e.conditions ?? []),
    ...(char.postEffects ?? []).flatMap((p) => p.conditions ?? []),
  ];

  const gates = new Set<string>();
  const published = new Set<string>();
  for (const c of conditionSources) {
    walkGateNames(c, gates);
    walkPublishedKeys(c, published);
  }
  for (const m of char.multipliers ?? [])
    if (m.condition) {
      walkGateNames(m.condition, gates);
      walkPublishedKeys(m.condition, published);
    }
  for (const f of char.features ?? [])
    if (f.condition) {
      walkGateNames(f.condition, gates);
      walkPublishedKeys(f.condition, published);
    }

  const surfaced = new Set<string>();
  for (const c of harvestCharConditions(char)) {
    const ctrl = conditionToControl(c);
    if (ctrl) surfaced.add(ctrl.name);
  }

  const controls: ConditionControl[] = [];
  for (const name of gates) {
    if (surfaced.has(name) || published.has(name) || DERIVED_GATE_PREFIX.test(name)) continue;
    const { label, description } = resolveLabel({ type: "boolean", name } as Condition);
    const stacksMax = NESTED_GATE_STACKS.get(name);
    if (stacksMax !== undefined) {
      controls.push({
        name,
        kind: "number",
        label: NESTED_GATE_LABELS.get(name) ?? label,
        max: stacksMax,
        ...(description ? { description } : {}),
      });
      continue;
    }
    controls.push({
      name,
      kind: "boolean",
      label: NESTED_GATE_LABELS.get(name) ?? label,
      ...(description ? { description } : {}),
    });
  }
  // Deterministic order for stable UI + snapshot.
  return controls.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Conditions that share a combined pool cap (same + different ≤ cap).
 *
 * Audit (2026-06-28) — only USER-SURFACED stacks conditions were checked:
 *
 *   ATFD (a_thousand_floating_dreams): the only weapon with explicit `stacks`-type
 *     party_elements_same + party_elements_different conditions surfaced as sliders.
 *     Game constraint: same + different ≤ 3 (party size cap).
 *
 *   All other entities that mention party_elements use either:
 *     - `boolean-value` gate conditions (not user-surfaced) — Gilded Dreams, First Great Magic
 *     - `static-level` (not user-surfaced) — Ballad of the Fjords
 *
 * Map is keyed by condition name → { siblings, cap }.
 */
const SHARED_POOL_GROUPS: ReadonlyMap<string, { siblings: readonly string[]; cap: number }> =
  new Map([
    ["party_elements_same", { siblings: ["party_elements_different"], cap: 3 }],
    ["party_elements_different", { siblings: ["party_elements_same"], cap: 3 }],
  ]);

/**
 * Mutually-exclusive boolean groups: when one is turned on, its siblings are
 * cleared (only one in the group can be active at a time).
 *
 * Audit (2026-06-28): no user-surfaced exclusive-boolean pairs were found in
 * the existing packages/data weapon/set/character corpus. Conditions that look
 * mutually exclusive (e.g. "HP above/below threshold") are implemented as
 * gate-only boolean-value conditions (not user-toggleable booleans), so they
 * don't surface as UI controls. This map is kept for future additions.
 */
const EXCLUSIVE_GROUPS: ReadonlyMap<string, readonly string[]> = new Map([
  // (empty — no user-surfaced exclusive-boolean pairs found in audit)
]);

/** A single renderable UI control derived from a Condition. */
export interface ConditionControl {
  /** The condition's settings key, e.g. "hutao_paramita_papilio". */
  name: string;
  /** boolean → checkbox; number → slider/number-input */
  kind: "boolean" | "number";
  /** Humanized label for display, e.g. "Paramita Papilio" (from CSV title, or slug-humanized). */
  label: string;
  /** Plain-text in-game description from the raw CSV strings, if found. */
  description?: string;
  /** For kind:"number", the maximum value (from ConditionStacks.maxStacks or ConditionNumber.max). */
  max?: number;
  /**
   * For mutually-constrained conditions (e.g. ATFD same+different ≤ 3):
   * siblings whose current sum reduces this slider's available room.
   */
  sharedPool?: { siblings: readonly string[]; cap: number };
  /**
   * For mutually-exclusive boolean groups (e.g. day/night, before/after skill):
   * activating this control clears all siblings.
   */
  exclusiveGroup?: readonly string[];
}

/**
 * Strip known scope prefixes from a condition name so it can be looked up in
 * CONDITION_STRINGS, which indexes by the raw CSV name column.
 *
 * Examples:
 *   "party.bennet_fantastic_voyage"  → "bennet_fantastic_voyage"
 *   "buffs.resonance_cryo"           → "resonance_cryo"
 *   "set.noblesse_oblige_4"          → "noblesse_oblige_4"
 *   "hutao_paramita_papilio"         → "hutao_paramita_papilio"  (no-op)
 */
function normalizeConditionName(name: string): string {
  return name.replace(
    /^(?:party|buffs|set|set_other|set_bonus|common)\./,
    ""
  );
}

/**
 * Resolve a human-readable label and optional description for a Condition,
 * looking up CONDITION_STRINGS with the following priority:
 *
 *   1. Weapon conditions carry explicit i18n KEYS on .title / .description
 *      (e.g. "talent_name.aqua_simulacra" / "talent_descr.aqua_simulacra_2").
 *      Split on "." to get the name part and look it up.
 *
 *   2. Character/global conditions: look up CONDITION_STRINGS[normalizeConditionName(name)]
 *      directly (the condition name IS the CSV name column value).
 *
 *   3. Fall back to humanizeSlug(name) for the label if nothing found.
 */
function resolveLabel(cond: Condition): { label: string; description?: string } {
  // Access base fields (all Condition members extend ConditionBase).
  const base = cond as { title?: string; description?: string; name?: string };
  const condName = base.name;

  let label: string | undefined;
  let description: string | undefined;

  // Strategy 1: explicit i18n keys on weapon conditions.
  if (base.title) {
    const keyName = base.title.split(".").slice(1).join(".");
    label = CONDITION_STRINGS[keyName]?.title;
  }
  if (base.description) {
    const keyName = base.description.split(".").slice(1).join(".");
    description = CONDITION_STRINGS[keyName]?.description;
  }

  // Strategy 2: look up by condition name (char / global conditions).
  if (condName && (!label || !description)) {
    const normalized = normalizeConditionName(condName);
    const entry = CONDITION_STRINGS[normalized];
    if (!label) label = entry?.title;
    if (!description) description = entry?.description;
  }

  return {
    label: label ?? humanizeSlug(condName ?? ""),
    ...(description ? { description } : {}),
  };
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
      const { label, description } = resolveLabel(cond);
      const exclusiveEntry = EXCLUSIVE_GROUPS.get(name);
      return {
        name,
        kind: "boolean",
        label,
        ...(description ? { description } : {}),
        ...(exclusiveEntry ? { exclusiveGroup: exclusiveEntry } : {}),
      };
    }
    case "stacks": {
      const name = cond.name;
      if (!name) return null;
      const { label, description } = resolveLabel(cond);
      const poolEntry = SHARED_POOL_GROUPS.get(name);
      return {
        name,
        kind: "number",
        label,
        ...(description ? { description } : {}),
        max: cond.maxStacks,
        ...(poolEntry ? { sharedPool: poolEntry } : {}),
      };
    }
    case "number": {
      const name = cond.name;
      if (!name) return null;
      const { label, description } = resolveLabel(cond);
      return {
        name,
        kind: "number",
        label,
        ...(description ? { description } : {}),
        ...(cond.max !== undefined ? { max: cond.max } : {}),
      };
    }
    case "dropdown": {
      // Dropdown is a multi-state selector — render as a number control (option index).
      const name = cond.name;
      if (!name) return null;
      const { label, description } = resolveLabel(cond);
      return {
        name,
        kind: "number",
        label,
        ...(description ? { description } : {}),
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

  // Nested-gate toggles (sweep-ported stances etc.) — see extractNestedGateControls.
  for (const ctrl of extractNestedGateControls(char)) {
    if (!seen.has(ctrl.name)) {
      seen.add(ctrl.name);
      controls.push(ctrl);
    }
  }

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
  for (const c of CHARACTER_CONDITIONS) {
    const name = (c as { name?: string }).name;
    if (name !== undefined && GLOBAL_EMIT_ONLY.has(name)) continue;
    push(c);
  }
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
  return { push, controls: out, seen };
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
  // Nested-gate toggles (sweep-ported stances etc.) — see extractNestedGateControls.
  for (const ctrl of extractNestedGateControls(char)) {
    if (!selfG.seen.has(ctrl.name)) {
      selfG.seen.add(ctrl.name);
      selfG.controls.push(ctrl);
    }
  }
  for (const c of weapon.conditions ?? []) weaponG.push(c);

  for (const { setKey, pieces } of sets) {
    const set = ARTIFACT_SETS[setKey];
    if (!set) continue;
    for (const tier of [2, 4] as const) {
      if (pieces < tier) continue;
      for (const c of set.bonus[tier]?.conditions ?? []) setG.push(c);
    }
  }

  for (const c of CHARACTER_CONDITIONS) {
    const name = (c as { name?: string }).name;
    if (name !== undefined && GLOBAL_EMIT_ONLY.has(name)) continue;
    globalG.push(c);
  }
  for (const c of ENEMY_CONDITIONS) enemyG.push(c);

  return {
    self: selfG.controls,
    weapon: weaponG.controls,
    set: setG.controls,
    global: globalG.controls,
    enemy: enemyG.controls,
  };
}

/**
 * Collect the UI controls a TEAMMATE contributes — only `char.partyData.conditions`
 * (the buffs they grant the active character), deduped by name. Distinct from
 * harvestCharConditions, which mixes a character's own kit conditions with their
 * party conditions for the ACTIVE character.
 */
export function collectPartyConditions(char: DbObjectChar): ConditionControl[] {
  const seen = new Set<string>();
  const out: ConditionControl[] = [];
  for (const cond of char.partyData?.conditions ?? []) {
    const ctrl = conditionToControl(cond);
    if (!ctrl) continue;
    if (seen.has(ctrl.name)) continue;
    seen.add(ctrl.name);
    out.push(ctrl);
  }
  return out;
}
