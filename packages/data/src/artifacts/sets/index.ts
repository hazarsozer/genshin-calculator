/**
 * Artifact-set registry — `setKey → DbObjectArtifactSet`.
 *
 * Each set's `goodId` is Aspirine's oracle `art.set` key — the same string the
 * `buildStats` `setBonuses` input and `build-configs.mjs equipSet` use. It equals
 * the GOOD-format key for most sets, but follows her key where they diverge:
 *   "CrimsonWitch"       (GOOD: "CrimsonWitchOfFlames")
 *   "HeartofDepth"       (GOOD: "HeartOfDepth")
 *   "EmblemofSeveredFate" (GOOD: "EmblemOfSeveredFate")
 * The `set-*pc` golden manifests use the same oracle keys, so `goodId` is the
 * correct lookup key for the harness.
 *
 * P2.A0 ships 7 ported sets; P2.A1+ fills the remaining ~45 sets.
 *
 * Source: raw/genshin_calc_pub/src/js/db/Artifacts/Sets.js (the set registry)
 */

import type { DbObjectArtifactSet } from "@genshin/types";
import { crimsonWitch } from "./crimson-witch.js";
import { deepwoodMemories } from "./deepwood-memories.js";
import { emblemOfSeveredFate } from "./emblem-of-severed-fate.js";
import { goldenTroupe } from "./golden-troupe.js";
import { heartOfDepth } from "./heart-of-depth.js";
import { marechausseeHunter } from "./marechaussee-hunter.js";
import { noblesseOblige } from "./noblesse-oblige.js";

export { crimsonWitch } from "./crimson-witch.js";
export { deepwoodMemories } from "./deepwood-memories.js";
export { emblemOfSeveredFate } from "./emblem-of-severed-fate.js";
export { goldenTroupe } from "./golden-troupe.js";
export { heartOfDepth } from "./heart-of-depth.js";
export { marechausseeHunter } from "./marechaussee-hunter.js";
export { noblesseOblige } from "./noblesse-oblige.js";

/** All ported sets, keyed by `goodId` (the registry / build-config key). */
export const ARTIFACT_SETS: Readonly<Record<string, DbObjectArtifactSet>> = {
  [noblesseOblige.goodId]: noblesseOblige,
  [crimsonWitch.goodId]: crimsonWitch,
  [deepwoodMemories.goodId]: deepwoodMemories,
  [goldenTroupe.goodId]: goldenTroupe,
  [heartOfDepth.goodId]: heartOfDepth,
  [marechausseeHunter.goodId]: marechausseeHunter,
  [emblemOfSeveredFate.goodId]: emblemOfSeveredFate,
};

/** Resolve a set by its registry key; `undefined` if not ported. */
export function getArtifactSet(setKey: string): DbObjectArtifactSet | undefined {
  return ARTIFACT_SETS[setKey];
}
