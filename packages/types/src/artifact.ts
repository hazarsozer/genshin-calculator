/**
 * Artifact domain types.
 *
 * Sources:
 *   wiki/architecture/db-object-model.md
 *   raw/genshin_calc_pub/src/js/db/Artifacts/Set/<Name>.js (ArtifactSet pattern)
 */

import type { GoodStatKey } from "./stats.js";

/** The five artifact slots. */
export type ArtifactSlot =
  | "flower"
  | "plume"
  | "sands"
  | "goblet"
  | "circlet";

/**
 * A single artifact with its main stat and sub-stats.
 * Sub-stat values follow the GOOD convention (whole-number percents for % stats).
 */
export interface Artifact {
  readonly slot: ArtifactSlot;
  readonly setKey: string;
  readonly rarity: 1 | 2 | 3 | 4 | 5;
  readonly level: number;
  readonly mainStatKey: GoodStatKey;
  readonly subStats: readonly ArtifactSubStat[];
}

/** One sub-stat roll on an artifact. */
export interface ArtifactSubStat {
  readonly key: GoodStatKey;
  /** Raw value in GOOD convention (whole-number percents for % stats). */
  readonly value: number;
}

/**
 * Structural shape of an artifact set registration.
 *
 * The `bonus` record maps piece-count → conditional stat contributions.
 * Aspirine uses `new ArtifactSet({ name, bonus: { 2: …, 4: … } })`.
 */
export interface DbObjectArtifactSet {
  /** Namespaced slug: "artifact_set.<slug>", e.g. "artifact_set.crimson_witch". */
  readonly name: string;
  /** Piece-threshold → condition/stat declarations. */
  readonly bonus: Readonly<Partial<Record<2 | 4, unknown>>>;
}
