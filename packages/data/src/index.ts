/**
 * @genshin/data — the integration layer.
 *
 * Turns Aspirine's declarative typed data (characters, weapons, builds) into
 * executable damage closures by composing the pure `@genshin/core` engine. The
 * bridge P1.5 deferred: feature→tree resolution needs character data, and `core`
 * may not import `data` (engine-purity invariant). Everything reaction- and
 * formula-related lives in `core`; this package only wires data into it.
 */

export type { DamageTriple } from "@genshin/types";

export const DATA_VERSION = "0.0.0";

export { buildStats } from "./buildStats.js";
export type {
  BuildInput,
  BuildLevels,
  BuildEnemy,
  BuildResult,
} from "./buildStats.js";

export { compileFeature } from "./compileFeature.js";
export type { CompileContext, TalentLevels } from "./compileFeature.js";

export { compileCharacter, featureKey } from "./loader.js";
