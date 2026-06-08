/**
 * Shared port-side build reconstruction (extracted from goldenConfig.test.ts).
 *
 * `goldenConfig.test.ts` reconstructs a port build from a manifest entry: it merges the
 * toggle channels into one settings bag (`reconstructSettings`), then assembles the
 * `buildStats(...)` inputs and runs `compileCharacter(...)` (`reconstructPort`). The
 * differential parity harness (tools/oracle/diff-parity.mjs) needs the IDENTICAL
 * reconstruction so its port side can never silently drift from the suite the existing
 * goldens already prove green. This is the single source of truth for both:
 *   - goldenConfig.test.ts imports both functions (so the gate proves this is faithful).
 *   - the harness's esbuild-bundled port entry (tools/oracle/_port-entry.ts) imports them
 *     too, applied to a build SPEC instead of a manifest entry.
 *
 * The two load-bearing conventions captured here (and previously inlined in the test):
 *   1. SETTINGS MERGE: charToggles + setToggles + weapon.passiveToggles + char_constellation
 *      + weapon_refine, in that precedence (later spreads win). Booleans pass as `true`,
 *      numeric stacks as the number — EvalContext is Record<string, unknown>.
 *   2. buildStats ASSEMBLY: weapon passive → `extraConditions` (weapon.conditions) ONLY when
 *      passiveToggles is non-empty; artifactSets → `setBonuses` [{setKey,pieces}]; the shared
 *      enemy/levels/talents; the glob-built setRegistry.
 *
 * Nothing here resolves objects (char / weapon stat table / set registry) — the CALLER owns
 * discovery (the test via import.meta.glob; the harness via barrel introspection). This keeps
 * the module a pure function of already-resolved inputs, importable from both a vitest run and
 * a plain esbuild bundle (where import.meta.glob is unavailable).
 *
 * Source: packages/data/src/__tests__/goldenConfig.test.ts (the original inline reconstruction).
 */

import { buildStats } from "../buildStats.js";
import { compileCharacter } from "../loader.js";
import type {
  CharMultiplier,
  CharPostEffect,
  CompiledFeature,
  Condition,
  DamageContext,
  DbObjectArtifactSet,
  DbObjectChar,
  DbObjectWeapon,
  EvalContext,
  Feature,
  StatTableEntry,
} from "@genshin/types";

/** Canonical fixed-build levels (Lv90 / A6 weapon Lv90 / A6) — verbatim from the golden suites. */
export const LEVELS = {
  charLevel: 90,
  ascension: 6,
  weaponLevel: 90,
  weaponAscension: 6,
} as const;

/** Canonical talent levels (10/10/10) — verbatim from the golden suites. */
export const TALENTS = { attack: 10, elemental: 10, burst: 10 } as const;

/** Absolute tolerance for the [normal, crit, avg] triple — verbatim (golden.test.ts:117). */
export const TOLERANCE = 0.1;

/**
 * The toggle channels that fold into a build's settings bag. A manifest entry and a build
 * spec both supply exactly these; `reconstructSettings` merges them identically.
 */
export interface ReconstructToggles {
  /** The active character's own conditional toggles. */
  readonly charToggles: EvalContext;
  /** Equipped-set conditional toggles (named 4pc/2pc conditionals enabled to max). */
  readonly setToggles: EvalContext;
  /** Equipped-weapon passive toggles (empty ⇒ passive OFF ⇒ no extraConditions). */
  readonly passiveToggles: EvalContext;
  /** Constellation 0..6. */
  readonly constellation: number;
  /** Weapon refine 1..5. */
  readonly refine: number;
}

/**
 * Merge the toggle channels into one EvalContext, exactly as goldenConfig's
 * `buildEntrySettings`: charToggles + setToggles + passiveToggles + char_constellation +
 * weapon_refine. Later spreads win (the canonical constellation/refine override any toggle
 * key collision — there is none in practice). Booleans go in as `true`; numeric stacks as
 * the number — both pass through cleanly for the condition evaluator.
 */
export function reconstructSettings(toggles: ReconstructToggles): EvalContext {
  const { charToggles, setToggles, passiveToggles, constellation, refine } = toggles;
  return {
    ...charToggles,
    ...setToggles,
    ...passiveToggles,
    char_constellation: constellation,
    weapon_refine: refine,
  };
}

/** Enemy parameters for the reconstruction (level + a uniform percent or per-element map). */
export interface ReconstructEnemy {
  readonly level: number;
  readonly resistance: number | Readonly<Record<string, number>>;
}

/** Everything the shared reconstruction needs once the caller has resolved the objects. */
export interface ReconstructInput {
  readonly char: DbObjectChar;
  readonly weapon: DbObjectWeapon;
  readonly weaponStatTable: readonly StatTableEntry[];
  readonly statBlock: Readonly<Record<string, number>>;
  /** Already-merged settings bag (from `reconstructSettings`). */
  readonly settings: EvalContext;
  /** Whether the weapon passive is ON (⇒ feed weapon.conditions as extraConditions). */
  readonly passiveOn: boolean;
  /** Equipped artifact sets: registry key (goodId) → piece count. */
  readonly artifactSets: Readonly<Record<string, number>>;
  /** Glob/barrel-built set registry (DI seam for buildStats). */
  readonly setRegistry: Readonly<Record<string, DbObjectArtifactSet>>;
  readonly levels: typeof LEVELS;
  /** Base talent levels (attack/elemental/burst) — usually `TALENTS`; the talent-sweep axis overrides them. */
  readonly talents: { readonly attack: number; readonly elemental: number; readonly burst: number };
  readonly enemy: ReconstructEnemy;
}

/** The compiled port build: the named feature closures + the eval context to run them against. */
export interface ReconstructResult {
  readonly compiled: Readonly<Record<string, CompiledFeature>>;
  readonly context: DamageContext;
}

/**
 * Reconstruct the port build (buildStats → compileCharacter) from already-resolved inputs.
 *
 * This MUST wire every equipped-object effect channel exactly as the armory consumer gate
 * (`packages/data/src/__tests__/armory.test.ts`, which gates all 202 weapons + 55 sets green)
 * does — otherwise the harness's port side silently drops weapon/set damage contributions and
 * reports them as the PORT's divergence when the gap is in the reconstruction. The channels:
 *
 *   WEAPON (armory.test.ts:422,426,439-441 — weapons-r1/r5 path):
 *     - weapon.conditions  → buildStats `extraConditions`  (UNCONDITIONAL — armory passes
 *       `weapon.conditions ?? []` regardless of any toggle; always-on `ConditionStaticRefine`
 *       HP%/DEF% passives — Homa/JadeCutter/KhajNisut — apply whenever the weapon is equipped,
 *       exactly as her engine treats a static/nameless condition: always-on, no toggle to set).
 *     - weapon.postEffects → buildStats `weaponPostEffects` (HP→ATK / crit-from-HP folds).
 *     - weapon.features    → compileCharacter `extraFeatures`   (weapon damage procs).
 *     - weapon.multipliers → compileCharacter `extraMultipliers` (Redhorn def→normal/charged).
 *
 *   SET (armory.test.ts:515,530-531 — sets-2pc/4pc path):
 *     - set conditions resolve INTERNALLY in buildStats via `setBonuses` + `setRegistry`
 *       (the piece-count gate + each condition's own gate) — NOT via extraConditions.
 *     - set.features    → compileCharacter `extraFeatures`    (Ocean-Hued Clam's Foam).
 *     - set.multipliers → compileCharacter `extraMultipliers` (Echoes' ValleyRite normal-DMG
 *       variant). Each equipped set's slice is harvested from the registry and concatenated.
 *
 * Then propagate buildStats' returned `settings` into compileCharacter (talent _bonus offsets).
 *
 * `input.passiveOn` is retained on the interface for caller-signature stability but is no longer
 * consulted: weapon.conditions are wired unconditionally to mirror armory (conditional passives
 * still only fire when their own gate — a toggle in `settings` — holds, so OFF passives stay off).
 */
export function reconstructPort(input: ReconstructInput): ReconstructResult {
  const setBonuses = Object.entries(input.artifactSets).map(([setKey, pieces]) => ({
    setKey,
    pieces,
  }));

  // Harvest each EQUIPPED set's char-level effect slices from the registry (same objects
  // buildStats resolves for conditions). Sets contribute features (Clam Foam) + multipliers
  // (Echoes ValleyRite) into the SAME compileCharacter channels as the weapon's, exactly as
  // armory's set path. A set absent from the registry contributes nothing (treated unported).
  const equippedSets: readonly DbObjectArtifactSet[] = Object.keys(input.artifactSets)
    .map((setKey) => input.setRegistry[setKey])
    .filter((s): s is DbObjectArtifactSet => s !== undefined);

  // WEAPON conditions are wired unconditionally (armory.test.ts:422), NOT gated on passiveOn.
  const extraConditions: readonly Condition[] = input.weapon.conditions ?? [];

  const weaponPostEffects: readonly CharPostEffect[] = input.weapon.postEffects ?? [];

  // compileCharacter's char-level slices: the equipped weapon's + every equipped set's.
  const extraFeatures: readonly Feature[] = [
    ...(input.weapon.features ?? []),
    ...equippedSets.flatMap((s) => s.features ?? []),
  ];
  const extraMultipliers: readonly CharMultiplier[] = [
    ...(input.weapon.multipliers ?? []),
    ...equippedSets.flatMap((s) => s.multipliers ?? []),
  ];

  const { context, settings } = buildStats({
    char: input.char,
    weaponStatTable: input.weaponStatTable,
    statBlock: input.statBlock,
    levels: input.levels,
    enemy: { level: input.enemy.level, resistance: input.enemy.resistance },
    settings: input.settings,
    extraConditions,
    weaponPostEffects,
    setBonuses,
    setRegistry: input.setRegistry,
    talentLevels: input.talents,
  });

  const compiled = compileCharacter(input.char, {
    charElement: input.char.element,
    talentLevels: input.talents,
    settings,
    charLevel: input.levels.charLevel,
    extraFeatures,
    extraMultipliers,
  });

  return { compiled, context };
}
