/**
 * Artifact-set registry — `setKey → DbObjectArtifactSet`.
 *
 * Each set's `goodId` is Aspirine's oracle `art.set` key — the same string the
 * `buildStats` `setBonuses` input and `build-configs.mjs equipSet` use. It equals
 * the GOOD-format key for most sets, but follows her key where they diverge:
 *   "CrimsonWitch"        (GOOD: "CrimsonWitchOfFlames")
 *   "HeartofDepth"        (GOOD: "HeartOfDepth")
 *   "EmblemofSeveredFate" (GOOD: "EmblemOfSeveredFate")
 *   "HuskofOpulentDreams" (GOOD: "HuskOfOpulentDreams")
 * The `set-*pc` golden manifests use the same oracle keys, so `goodId` is the
 * correct lookup key for the harness.
 *
 * 10 sets ported (P2.A0: Noblesse/CrimsonWitch/Deepwood; P2.A1: GoldenTroupe/
 * HeartofDepth/Marechaussee/Emblem + ShimenawasReminiscence/HuskofOpulentDreams/
 * ThunderingFury). The remaining ~42 sets follow; five with oracle fixtures
 * (ViridescentVenerer/GladiatorFinale/ObsidianCodex/BlizzardStrayer/GildedDreams)
 * need new leaf condition variants first — see wiki/tasks/harness-guide.md § P2.A1.
 *
 * NOTE: this barrel is HAND-MAINTAINED (controller-regenerated after each port wave).
 * The golden harness auto-discovers set files via `import.meta.glob` independently, so a
 * dropped-in set file is validated WITHOUT a barrel edit; this barrel is the RUNTIME
 * registry (`getArtifactSet`) for production. Keep the two in sync at each wave close.
 *
 * Source: raw/genshin_calc_pub/src/js/db/Artifacts/Sets.js (the set registry)
 */

import type { DbObjectArtifactSet } from "@genshin/types";
import { crimsonWitch } from "./crimson-witch.js";
import { deepwoodMemories } from "./deepwood-memories.js";
import { emblemOfSeveredFate } from "./emblem-of-severed-fate.js";
import { goldenTroupe } from "./golden-troupe.js";
import { heartOfDepth } from "./heart-of-depth.js";
import { huskOfOpulentDreams } from "./husk-of-opulent-dreams.js";
import { marechausseeHunter } from "./marechaussee-hunter.js";
import { noblesseOblige } from "./noblesse-oblige.js";
import { shimenawasReminiscence } from "./shimenawas-reminiscence.js";
import { thunderingFury } from "./thundering-fury.js";

export { crimsonWitch } from "./crimson-witch.js";
export { deepwoodMemories } from "./deepwood-memories.js";
export { emblemOfSeveredFate } from "./emblem-of-severed-fate.js";
export { goldenTroupe } from "./golden-troupe.js";
export { heartOfDepth } from "./heart-of-depth.js";
export { huskOfOpulentDreams } from "./husk-of-opulent-dreams.js";
export { marechausseeHunter } from "./marechaussee-hunter.js";
export { noblesseOblige } from "./noblesse-oblige.js";
export { shimenawasReminiscence } from "./shimenawas-reminiscence.js";
export { thunderingFury } from "./thundering-fury.js";

/** All ported sets, keyed by `goodId` (the registry / build-config key). */
export const ARTIFACT_SETS: Readonly<Record<string, DbObjectArtifactSet>> = {
  [noblesseOblige.goodId]: noblesseOblige,
  [crimsonWitch.goodId]: crimsonWitch,
  [deepwoodMemories.goodId]: deepwoodMemories,
  [goldenTroupe.goodId]: goldenTroupe,
  [heartOfDepth.goodId]: heartOfDepth,
  [marechausseeHunter.goodId]: marechausseeHunter,
  [emblemOfSeveredFate.goodId]: emblemOfSeveredFate,
  [huskOfOpulentDreams.goodId]: huskOfOpulentDreams,
  [shimenawasReminiscence.goodId]: shimenawasReminiscence,
  [thunderingFury.goodId]: thunderingFury,
};

/** Resolve a set by its registry key; `undefined` if not ported. */
export function getArtifactSet(setKey: string): DbObjectArtifactSet | undefined {
  return ARTIFACT_SETS[setKey];
}
