/**
 * assembleBuild — artifact input path from a real 5-piece build.
 *
 * Two functions bridge user-facing GOOD-format artifacts into the raw Aspirine
 * stat bag `buildStats` consumes:
 *
 *   assembleArtifactStats(artifacts) → statBlock
 *     DERIVES each artifact's main stat from the per-rarity/level Mainstats table
 *     and SNAPS each sub-stat via the exact getPreciseValue dictionary (both
 *     ported in generated/artifactTables.ts), mapping GOOD keys → Aspirine keys
 *     via the bijective `goodToAspirine` map. The result is a plain
 *     `Record<string, number>` in the same RAW (un-percent-processed) convention
 *     as every `statBlock` fed to `buildStats` — whole-number percents stay whole
 *     (46.6 = 46.6%), never divided by 100. This mirrors her Artifact.calcStats
 *     (Artifact.js:27-46): main `Mainstats.get(key).values[rarity-1].getValue(level)`
 *     (0-indexed) + each substat `Substats.get(key).getPreciseValue(value, rarity)`.
 *
 *   detectSets(artifacts) → EquippedSet[]
 *     Counts pieces per `setKey` across the 5 artifacts and returns the shape
 *     `buildStats`'s `setBonuses` channel consumes, where `setKey` matches the
 *     ported sets' `goodId` (the registry key).
 *
 * Main-stat derivation: each piece's main value is looked up from the ported
 * Mainstats table by (GOOD key, rarity, level) — exactly her `calcStats`, NOT a
 * caller-supplied value. Callers feed RAW pieces (rarity/level/slot/main-KEY/
 * substat display rolls); the table + snap do the rest.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/classes/Artifact.js (calcStats — the reference)
 *   packages/data/src/generated/artifactTables.ts (getMainStatValue, getPreciseSubValue)
 *   packages/types/src/stats.ts (GOOD_STAT_KEYS, goodToAspirine)
 *   packages/data/src/buildStats.ts (BuildInput.statBlock, EquippedSet shape)
 */

import type { Artifact } from "@genshin/types";
import { goodToAspirine } from "@genshin/types";
import type { EquippedSet } from "./buildStats.js";
import { getMainStatValue, getPreciseSubValue } from "./generated/artifactTables.js";

/**
 * Assemble a raw Aspirine stat bag from 5 artifacts — DERIVING from the ported tables.
 *
 * Each artifact contributes:
 *   - Its main stat, DERIVED from the Mainstats per-rarity/level table
 *     (`getMainStatValue`, 0-indexed by level), under its Aspirine key.
 *   - Each sub-stat value, SNAPPED via the exact getPreciseValue dictionary
 *     (`getPreciseSubValue` — an EXACT key lookup, NOT rounding; passthrough on a
 *     miss), under its Aspirine key.
 *
 * Mirrors her Artifact.calcStats (raw/.../classes/Artifact.js:27-46). Values stay
 * RAW: whole-number percents are NOT pre-divided by 100; `buildStats`'s emit loop
 * applies the /100 at emit time. (The display-only `crit_value` FeatureStat,
 * Artifact.js:43, is OUT of scope — damage never reads it.)
 *
 * Throws immediately if any stat key falls outside the bijective GOOD→Aspirine map
 * (artifact main/substats only use those keys; a violation signals either a data
 * bug or an unsupported future stat key).
 */
export function assembleArtifactStats(
  artifacts: readonly Artifact[]
): Record<string, number> {
  const bag: Record<string, number> = {};

  for (const artifact of artifacts) {
    // Main stat — DERIVED from the per-rarity/level Mainstats table (0-indexed).
    const mainAspKey = goodToAspirine[artifact.mainStatKey];
    /* v8 ignore next 5 -- defensive: GoodStatKey is exhaustive; only reachable via bad data */
    if (mainAspKey === undefined) {
      throw new Error(
        `assembleBuild: unknown main-stat key "${artifact.mainStatKey}" — not in the bijective GOOD→Aspirine map`
      );
    }
    const mainValue = getMainStatValue(artifact.mainStatKey, artifact.rarity, artifact.level);
    bag[mainAspKey] = (bag[mainAspKey] ?? 0) + mainValue;

    // Sub-stats — SNAPPED via the exact getPreciseValue dictionary (passthrough on a miss).
    for (const sub of artifact.subStats) {
      const aspKey = goodToAspirine[sub.key];
      if (aspKey === undefined) {
        throw new Error(
          `assembleBuild: unknown sub-stat key "${sub.key}" — not in the bijective GOOD→Aspirine map`
        );
      }
      const snapped = getPreciseSubValue(sub.key, sub.value, artifact.rarity);
      bag[aspKey] = (bag[aspKey] ?? 0) + snapped;
    }
  }

  return bag;
}

/**
 * Count artifact pieces per set and return the `EquippedSet[]` shape that
 * `buildStats`'s `setBonuses` channel consumes.
 *
 * The `setKey` values are passed through as-is — callers must use the set's
 * `goodId` (the registry key), which equals the GOOD key for most sets but
 * follows Aspirine's key where they differ (see `DbObjectArtifactSet.goodId`).
 *
 * Sets present with 0 pieces (should not happen with real data) are excluded.
 */
export function detectSets(artifacts: readonly Artifact[]): EquippedSet[] {
  const counts = new Map<string, number>();
  for (const artifact of artifacts) {
    counts.set(artifact.setKey, (counts.get(artifact.setKey) ?? 0) + 1);
  }

  const result: EquippedSet[] = [];
  for (const [setKey, pieces] of counts) {
    if (pieces > 0) result.push({ setKey, pieces });
  }
  return result;
}
