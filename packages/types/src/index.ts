/**
 * @genshin/types — shared contract layer
 *
 * `packages/core` and `packages/data` depend only on these interfaces.
 * They never import each other (engine-purity invariant).
 *
 * This package is intentionally logic-free except for the GOOD stat-key
 * runtime maps in stats.ts.
 */

export type {
  GoodStatKey,
  AspirineStatKey,
  EngineStatKey,
} from "./stats.js";

export {
  GOOD_STAT_KEYS,
  ASPIRINE_STAT_KEYS,
  aspirineToGood,
  goodToAspirine,
} from "./stats.js";

export type {
  CharacterLevel,
  TalentLevel,
  AscensionLevel,
  Refinement,
  ConstellationLevel,
  Element,
  WeaponType,
  StatTableEntry,
  CharStatTable,
  TalentTable,
  TalentResolver,
  CharPostEffect,
  CharConstellation,
  DbObjectChar,
} from "./character.js";

export {
  asCharacterLevel,
  asTalentLevel,
  asAscensionLevel,
  asRefinement,
  asConstellationLevel,
} from "./character.js";

export type {
  DbObjectWeapon,
} from "./weapon.js";

export type {
  ArtifactSlot,
  Artifact,
  ArtifactSubStat,
  ArtifactSetBonusTier,
  DbObjectArtifactSet,
} from "./artifact.js";

export type {
  DamageResult,
  AnyStatKey,
  BuildStats,
  EnemyParams,
  DamageContext,
} from "./damage.js";

export type {
  FeatureCategory,
  FeatureMultiplierEntry,
  FeatureMultiplierTarget,
  CharMultiplier,
  Feature,
  FeatureReaction,
  CompiledFeature,
} from "./feature.js";

export type {
  EvalContext,
  ConditionStats,
  ConditionSettings,
  ConditionBase,
  ConditionBoolean,
  ConditionBooleanRefine,
  ConditionStatic,
  ConditionConstellation,
  ConditionStaticRefine,
  ConditionNumber,
  ConditionStacks,
  ConditionBooleanPiecesCount,
  ConditionBooleanWeaponType,
  ConditionEnemyStatus,
  ConditionBooleanValue,
  ConditionDropdown,
  ConditionAnd,
  ConditionOr,
  Condition,
} from "./condition.js";
