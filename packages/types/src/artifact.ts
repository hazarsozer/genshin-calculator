/**
 * Artifact domain types.
 *
 * Sources:
 *   wiki/architecture/db-object-model.md
 *   raw/genshin_calc_pub/src/js/db/Artifacts/Set/<Name>.js (ArtifactSet pattern)
 *   raw/genshin_calc_pub/src/js/classes/ArtifactSet.js (bonus[pieces] keying, getConditions)
 */

import type { CharPostEffect } from "./character.js";
import type { Condition } from "./condition.js";
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
 * One piece-count tier's bonus declaration (her `setBonus[count]` entry).
 *
 * `conditions` are fed through the engine's condition resolver when this tier is
 * unlocked (`pieces >= count`); each is then independently subject to its OWN gate
 * (`conditionStats`'s `evaluate`). The piece-count gate (which tiers enter) and the
 * condition gate (whether an entered condition fires) are DISTINCT — see the
 * gotcha in wiki/tasks/phase-2-A0-artifact-set-shape.md.
 *
 * Ports the object her `ArtifactSet` stores at `this.bonus[count]` (ArtifactSet.js:23-29);
 * `getConditions(pieces)` concats `bonus[i].conditions` for every tier `i <= pieces`,
 * and `getPostEffects()` returns the set-level `postEffects` (ArtifactSet.js:83-102).
 */
export interface ArtifactSetBonusTier {
  /** Conditions whose stats apply once this tier is unlocked (subject to their own gate). */
  readonly conditions?: readonly Condition[];
}

/**
 * Structural shape of an artifact set registration.
 *
 * The `bonus` record maps piece-count → conditional stat contributions, keyed
 * exactly as her `ArtifactSet` keys `this.bonus` (1-indexed piece thresholds; only
 * 2 and 4 carry effects in the live data). Aspirine writes a 0-indexed `setBonus`
 * array `[{}, {2pc}, {}, {4pc}]`; the constructor re-keys it to `{ 2: {2pc}, 4: {4pc} }`.
 *
 * `postEffects` are SET-LEVEL stat derivations (a few sets do HP→ATK-style folds via
 * her `getPostEffects()`); they route through the same post-effect path as char ones.
 */
export interface DbObjectArtifactSet {
  /** Namespaced slug: "artifact_set.<slug>", e.g. "artifact_set.crimson_witch_of_flames". */
  readonly name: string;
  /**
   * Registry key — Aspirine's oracle `art.set` key (matches the `set-*pc` manifests /
   * `build-configs.mjs equipSet`). Equals the GOOD key for most sets but follows
   * her key where they differ: "CrimsonWitch" (GOOD: "CrimsonWitchOfFlames"),
   * "HeartofDepth" (GOOD: "HeartOfDepth"), "EmblemofSeveredFate"
   * (GOOD: "EmblemOfSeveredFate"). The `setBonuses` input and the oracle's `equipSet`
   * both use this key for lookups, so `goodId` is the set registry key here.
   */
  readonly goodId: string;
  /** Piece-threshold → tier bonus declaration. */
  readonly bonus: Readonly<Partial<Record<2 | 4, ArtifactSetBonusTier>>>;
  /** Set-level post-effects (HP→ATK-style derivations); empty for most sets. */
  readonly postEffects?: readonly CharPostEffect[];
}
