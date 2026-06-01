/**
 * assembleBuild — artifact input path from a real 5-piece build.
 *
 * Two functions bridge user-facing GOOD-format artifacts into the raw Aspirine
 * stat bag `buildStats` consumes:
 *
 *   assembleArtifactStats(artifacts) → statBlock
 *     Sums each artifact's main stat + all sub-stats, mapping GOOD keys →
 *     Aspirine keys via the bijective `goodToAspirine` map. The result is a
 *     plain `Record<string, number>` in the same RAW (un-percent-processed)
 *     convention as every `statBlock` fed to `buildStats` — whole-number
 *     percents stay whole (46.6 = 46.6%), never divided by 100.
 *
 *   detectSets(artifacts) → EquippedSet[]
 *     Counts pieces per `setKey` across the 5 artifacts and returns the shape
 *     `buildStats`'s `setBonuses` channel consumes, where `setKey` matches the
 *     ported sets' `goodId` (the registry key).
 *
 * Main-stat value decision: the `Artifact.mainStatValue` field carries the
 * caller-provided value (see artifact.ts). This avoids porting Aspirine's
 * per-rarity level-dependent main-stat tables into this package; GOOD-format
 * exporters always include the resolved value alongside the key.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/classes/Artifact.js (calcStats — the reference)
 *   packages/types/src/stats.ts (GOOD_STAT_KEYS, goodToAspirine)
 *   packages/data/src/buildStats.ts (BuildInput.statBlock, EquippedSet shape)
 */

import type { Artifact } from "@genshin/types";
import { goodToAspirine } from "@genshin/types";
import type { EquippedSet } from "./buildStats.js";

/**
 * Assemble a raw Aspirine stat bag from 5 artifacts.
 *
 * Each artifact contributes:
 *   - Its main stat under its Aspirine key (`mainStatKey` → `goodToAspirine`).
 *   - Each sub-stat value under its Aspirine key.
 *
 * Values stay RAW: whole-number percents are NOT pre-divided by 100.
 * `buildStats`'s emit loop applies the /100 at emit time.
 *
 * Throws immediately if any stat key falls outside the 19-key bijective map
 * (artifact substats only use those keys; a violation signals either a data
 * bug or an unsupported future stat key).
 */
export function assembleArtifactStats(
  artifacts: readonly Artifact[]
): Record<string, number> {
  const bag: Record<string, number> = {};

  for (const artifact of artifacts) {
    // Main stat
    const mainAspKey = goodToAspirine[artifact.mainStatKey];
    /* v8 ignore next 5 -- defensive: GoodStatKey is exhaustive; only reachable via bad data */
    if (mainAspKey === undefined) {
      throw new Error(
        `assembleBuild: unknown main-stat key "${artifact.mainStatKey}" — not in the 19-key bijective GOOD→Aspirine map`
      );
    }
    bag[mainAspKey] = (bag[mainAspKey] ?? 0) + artifact.mainStatValue;

    // Sub-stats
    for (const sub of artifact.subStats) {
      const aspKey = goodToAspirine[sub.key];
      if (aspKey === undefined) {
        throw new Error(
          `assembleBuild: unknown sub-stat key "${sub.key}" — not in the 19-key bijective GOOD→Aspirine map`
        );
      }
      bag[aspKey] = (bag[aspKey] ?? 0) + sub.value;
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
