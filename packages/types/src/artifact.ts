/**
 * Artifact domain types.
 *
 * Sources:
 *   wiki/tools/calculator/db-object-model.md
 *   raw/genshin_calc_pub/src/js/db/Artifacts/Set/<Name>.js (ArtifactSet pattern)
 *   raw/genshin_calc_pub/src/js/classes/ArtifactSet.js (bonus[pieces] keying, getConditions)
 */

import type { CharPostEffect } from "./character.js";
import type { Condition } from "./condition.js";
import type { Feature, CharMultiplier } from "./feature.js";
import type { GoodStatKey } from "./stats.js";

/** The five artifact slots. */
export type ArtifactSlot =
  | "flower"
  | "plume"
  | "sands"
  | "goblet"
  | "circlet";

/**
 * A single artifact piece: rarity + level + slot + main-stat KEY + sub-stat rolls.
 * Sub-stat values follow the GOOD convention (whole-number percents for % stats).
 *
 * The main-stat VALUE is NOT carried here: `assembleArtifactStats` DERIVES it from
 * the ported per-rarity/level Mainstats table by (`mainStatKey`, `rarity`, `level`)
 * — exactly her `Artifact.calcStats`
 * (`DB.Artifacts.Mainstats.get(mainStat).values[rarity-1].getValue(level)`,
 * raw/.../classes/Artifact.js:30-34). Each sub-stat's display roll is likewise
 * snapped to its precise value via the ported getPreciseValue dictionary. So a piece
 * is fully described by its raw GOOD fields — no caller-supplied resolved value.
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
 * gotcha in wiki/_meta/tasks/phase-2-A0-artifact-set-shape.md.
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
  /**
   * Set-sourced damage features (a damage instance the SET itself deals — Ocean-Hued
   * Clam's HP/heal-scaled "Sea-Dyed Foam" proc, etc.). Same declarative `Feature`
   * shape as char/weapon features; the armory harness concats an equipped set's
   * `features` into `compileCharacter`'s `extraFeatures`. Mirrors her `getFeaturesHash`,
   * which concats features from every equipped object (char + weapon + sets); each is
   * gated by its own condition + the piece-count tier (which is what makes the set's
   * conditions enter the settings in the first place).
   *
   * Base-inert: a set's features only enter the compile when that set is equipped at
   * sufficient pieces, so the Phase-2 golden surface (no feature-bearing set in the base
   * build) is untouched.
   *
   * Source: raw/genshin_calc_pub/src/js/db/Artifacts/Set/OceanHuedClam.js:54-68,
   *         raw/genshin_calc_pub/src/js/db/Artifacts/Set/EchoesofanOffering.js:58-83.
   */
  readonly features?: readonly Feature[];
  /**
   * Set-sourced CHAR-LEVEL ("targeted") multipliers — a `FeatureMultiplier` the set
   * contributes that modifies the wielder's existing hits (Echoes of an Offering's
   * normal-DMG variant, Song of Days Past, etc.). Same shape as `DbObjectChar.multipliers`
   * (a `CharMultiplier` with `target.damageTypes` + optional `condition`); the armory
   * harness concats an equipped set's `multipliers` into `compileCharacter`'s
   * `extraMultipliers`. Each entry is gated by its own `condition` (Echoes 4pc gates on
   * the on/avg toggle) AND by the piece-count tier.
   *
   * Base-inert: only enters the compile when the set is equipped at sufficient pieces.
   *
   * Source: raw/genshin_calc_pub/src/js/db/Artifacts/Set/EchoesofanOffering.js:58-83.
   */
  readonly multipliers?: readonly CharMultiplier[];
}
