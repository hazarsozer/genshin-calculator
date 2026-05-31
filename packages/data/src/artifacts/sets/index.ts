/**
 * Artifact-set registry — `setKey → DbObjectArtifactSet`.
 *
 * The registry key is the set's GOOD-style `goodId` (e.g. "NoblesseOblige"),
 * the same key the `buildStats` `setBonuses` input and the oracle's `equipSet`
 * use (CalcObjectArtifacts keys `activeSets` by `art.set` = the registry key).
 *
 * P2.A0 ships 3 exemplars to define the shape; P2.A1 fills the remaining ~52 sets
 * into this same barrel + registry.
 *
 * Source: raw/genshin_calc_pub/src/js/db/Artifacts/Sets.js (the set registry)
 */

import type { DbObjectArtifactSet } from "@genshin/types";
import { crimsonWitch } from "./crimson-witch.js";
import { deepwoodMemories } from "./deepwood-memories.js";
import { noblesseOblige } from "./noblesse-oblige.js";

export { crimsonWitch } from "./crimson-witch.js";
export { deepwoodMemories } from "./deepwood-memories.js";
export { noblesseOblige } from "./noblesse-oblige.js";

/** All ported sets, keyed by `goodId` (the registry / build-config key). */
export const ARTIFACT_SETS: Readonly<Record<string, DbObjectArtifactSet>> = {
  [noblesseOblige.goodId]: noblesseOblige,
  [crimsonWitch.goodId]: crimsonWitch,
  [deepwoodMemories.goodId]: deepwoodMemories,
};

/** Resolve a set by its registry key; `undefined` if not ported. */
export function getArtifactSet(setKey: string): DbObjectArtifactSet | undefined {
  return ARTIFACT_SETS[setKey];
}
