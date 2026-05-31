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
} from "./buildStats.js";

export { compileFeature } from "./compileFeature.js";
export type { CompileContext, TalentLevels } from "./compileFeature.js";

export { compileCharacter, featureKey } from "./loader.js";

// P1.7b — representative character set
export { huTao, diluc, aratakiItto, ineffa } from "./characters/index.js";

// P1.7b — weapon stat tables for the representative set
export {
  blackcliffPoleStatTable,
  theBellStatTable,
} from "./generated/weaponStatTables.js";
