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
  DbObjectChar,
} from "./character.js";

export type {
  DbObjectWeapon,
} from "./weapon.js";

export type {
  ArtifactSlot,
  Artifact,
  ArtifactSubStat,
  DbObjectArtifactSet,
} from "./artifact.js";

export type {
  DamageTriple,
  DamageResult,
  AnyStatKey,
  BuildStats,
  EnemyParams,
  DamageContext,
} from "./damage.js";

export type {
  FeatureCategory,
  FeatureMultiplierEntry,
  Feature,
  CompiledFeature,
} from "./feature.js";

export type {
  ConditionStats,
  ConditionSettings,
  ConditionBase,
  ConditionBoolean,
  ConditionStatic,
  ConditionConstellation,
  ConditionStaticRefine,
  Condition,
  ConditionLike,
} from "./condition.js";
