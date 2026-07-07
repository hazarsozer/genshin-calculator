/**
 * @genshin/data — the integration layer.
 *
 * Turns Aspirine's declarative typed data (characters, weapons, builds) into
 * executable damage closures by composing the pure `@genshin/core` engine. The
 * bridge P1.5 deferred: feature→tree resolution needs character data, and `core`
 * may not import `data` (engine-purity invariant). Everything reaction- and
 * formula-related lives in `core`; this package only wires data into it.
 */

export const DATA_VERSION = "0.0.0";

export { buildStats } from "./buildStats.js";
export type {
  BuildInput,
  BuildLevels,
  BuildEnemy,
  BuildResult,
  EquippedSet,
} from "./buildStats.js";

// P2.A0 — artifact-set registry (shape + 3 exemplars; P2.A1 fills the rest)
export {
  ARTIFACT_SETS,
  getArtifactSet,
  noblesseOblige,
  crimsonWitch,
  deepwoodMemories,
} from "./artifacts/sets/index.js";

export { buildSettings } from "./buildSettings.js";
export type { BuildSettingsInput } from "./buildSettings.js";

export { compileFeature } from "./compileFeature.js";
export type { CompileContext, TalentLevels } from "./compileFeature.js";

export { compileCharacter, featureKey } from "./loader.js";

// P1.9 — full character roster (all 107)
export * from "./characters/index.js";

// P1.7b — weapon stat tables for the representative set
export {
  blackcliffPoleStatTable,
  theBellStatTable,
} from "./generated/weaponStatTables.js";

// P2.W1 — weapon barrel (5 default weapons + P2.W0 exemplars)
export * from "./weapons/index.js";

// P2.B0 — artifact build assembly (GOOD artifacts → raw stat bag + set detection)
export { assembleArtifactStats, detectSets } from "./assembleBuild.js";

// Phase 3 ② — party composition input model
export { buildPartyContext } from "./partyContext.js";
export type { PartyInput, PartyMember, ActiveCharFacts } from "./partyContext.js";

export { ALL_CHARACTERS, ALL_WEAPONS } from "./roster.js";
export {
  CHARACTER_CONDITIONS,
  ENEMY_CONDITIONS,
} from "./characterConditions.js";
export {
  reconstructPort,
  reconstructSettings,
  LEVELS,
  TALENTS,
  TOLERANCE,
} from "./reconstruct.js";
export type {
  ReconstructInput,
  ReconstructResult,
  ReconstructToggles,
  ReconstructEnemy,
} from "./reconstruct.js";

// Art/icon id tables — generated from Enka characters, ambr weapons, and raw artifact set files
export { CHAR_ICON, WEAPON_ICON, SET_ICON } from "./generated/artIds.js";

// Enemy icon id table — generated from ambr monsters, normalized-name matched to ENEMY_CATALOG
export { ENEMY_ICON } from "./generated/enemyIcons.js";

// Enemy preset catalog — generated from raw/genshin_calc_pub/src/js/db/Enemies/
export { ENEMY_CATALOG } from "./generated/enemyCatalog.js";
export type { EnemyPreset } from "./generated/enemyCatalog.js";

// Condition/passive strings — generated from raw CSV string tables
export { CONDITION_STRINGS } from "./generated/conditionStrings.js";

// Artifact-set effect strings — generated from artifact_set_bonuses.csv
export { SET_EFFECTS } from "./generated/setEffectStrings.js";

// Food (cooking-buff) flat-stat tables — generated from raw/.../db/Food/*.js
export { foodTables, getFoodStats } from "./generated/foodTables.js";
export type { FoodItem } from "./generated/foodTables.js";
