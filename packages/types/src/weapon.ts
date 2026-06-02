/**
 * Weapon domain types.
 *
 * Sources:
 *   wiki/architecture/db-object-model.md
 *   raw/genshin_calc_pub/src/js/db/Weapon/Sword/AquilaFavonia.js
 *   raw/genshin_calc_pub/src/js/db/Weapon/Claymore/WolfsGravestone.js
 *   raw/genshin_calc_pub/src/js/db/Weapon/Polearm/Catch.js
 *   raw/genshin_calc_pub/src/js/db/Weapon/Catalyst/LostPrayer.js
 */

import type { WeaponType, Refinement, StatTableEntry, CharPostEffect } from "./character.js";
import type { Condition } from "./condition.js";
import type { Feature, CharMultiplier } from "./feature.js";

export type { WeaponType, Refinement };

/**
 * A weapon's base-stat table — the ordered list of per-stat providers.
 *
 * Mirrors CharStatTable; each entry has getName() for the stat key (e.g.
 * "atk_base", "crit_rate_base") and getValue(level, ascension) for the value.
 * These are the already-generated entries from weaponStatTables.ts — a
 * DbObjectWeapon references its table by key, never re-transcribes stat values.
 */
export type WeaponStatTable = readonly StatTableEntry[];

/**
 * Structural shape of a weapon entity as registered in DB.
 *
 * Fields drawn from DbObjectWeapon constructor usage across weapon files:
 *   name, gameId, rarity, weapon, statTable, conditions, features.
 *
 * `statTable` references an already-generated entry from weaponStatTables.ts.
 * `conditions` carries passive buffs (refine-scaled, boolean-toggle, or stack-based).
 * `features` is intentionally left as `unknown[]` — feature-granting weapons
 *   (e.g. Halberd's on-hit damage proc) are out of scope for P2.W0 and flagged
 *   for P2.W1 modelling. Scope here = passive STATS only.
 */
export interface DbObjectWeapon {
  readonly name: string;
  /** Game-internal numeric ID. */
  readonly gameId: number;
  /** Serialization ID for URL/save state. Mirrors raw DbObjectWeapon.serializeId. */
  readonly serializeId?: number;
  readonly rarity: 1 | 2 | 3 | 4 | 5;
  readonly weapon: WeaponType;
  /**
   * Base-stat table reference (from packages/data/src/generated/weaponStatTables.ts).
   * Never re-transcribe values here — reference by key from the generated export.
   */
  readonly statTable: WeaponStatTable;
  /** Weapon passive conditions (refinement-scaled buffs, boolean/stack passives). */
  readonly conditions?: readonly Condition[];
  /**
   * Weapon-level post-effects (HP→ATK / DEF→ATK / crit-from-HP derivations).
   *
   * Mirrors her `getPostEffects()`, which concats EVERY equipped object's
   * post-effects (artifact sets already carry `DbObjectArtifactSet.postEffects`;
   * weapons like Staff of Homa / Primordial Jade Cutter add HP→ATK folds). Routes
   * through the SAME post-effect path as char/set ones in `buildStats`. Base-inert:
   * no base-build weapon (the 5 P2 defaults) carries a post-effect → no-op for the
   * Phase-2 golden surface.
   *
   * Refine-scaled folds key their `ratioFromTalent` table off the `weapon_refine`
   * setting (`getValue(refine)`), mirroring her `PostEffectStats.getLevel` reading
   * `levelSetting: 'weapon_refine'`.
   *
   * Source: raw/genshin_calc_pub/src/js/classes/PostEffect/Stats/HP.js,
   *         raw/genshin_calc_pub/src/js/db/Weapon/Polearm/StaffofHoma.js,
   *         raw/genshin_calc_pub/src/js/db/Weapon/Sword/PrimordialJadeCutter.js
   */
  readonly postEffects?: readonly CharPostEffect[];
  /**
   * Weapon-sourced damage/heal features (on-hit damage instances the weapon itself
   * deals — Aquila Favonia's "Falcon's Defiance" ATK%-physical proc, the Skyward
   * series, etc.). These are the SAME declarative `Feature` shape char features use
   * (`FeatureDamage` → `cDamage`). The wielder's stats are already in the build, so a
   * weapon feature compiles through the SAME machinery as a char feature: the armory
   * harness concats `weapon.features` into `compileCharacter`'s `extraFeatures`, which
   * folds them into the compile loop. A weapon FeatureDamage with no `element` is
   * PHYSICAL (her `FeatureDamage` defaults `element = 'phys'`, Damage.js:26), so the
   * wrapper must set `element: "physical"` to match — `category: "weapon"` would
   * otherwise resolve to the wielder's innate element.
   *
   * Base-inert: no base-build weapon (the 5 P2 defaults) carries a feature → the
   * Phase-2 golden surface (goldenConfig 1773 / constellations 107) is untouched.
   *
   * Source: raw/genshin_calc_pub/src/js/db/Weapon/Sword/AquilaFavonia.js:34-53,
   *         raw/genshin_calc_pub/src/js/classes/Feature2/Damage.js (getTree, element default),
   *         raw/genshin_calc_pub/src/js/classes/CalcSet.js (getFeaturesHash concats all objects).
   */
  readonly features?: readonly Feature[];
  /**
   * Weapon-sourced CHAR-LEVEL ("targeted") multipliers — a `FeatureMultiplier` the
   * weapon contributes that modifies the WIELDER's existing hits rather than adding a
   * standalone feature (Redhorn Stonethresher's `def*` into normal/charged, Light of
   * Foliar Incision, etc.). Same shape as `DbObjectChar.multipliers` (a `CharMultiplier`
   * with a `target.damageTypes` + optional `condition`); the armory harness concats
   * `weapon.multipliers` into `compileCharacter`'s `extraMultipliers`, which merges them
   * into the active char-level multiplier list (`Feature2.getMultipliers`, Feature2.js:121).
   *
   * Base-inert: no base-build weapon carries one → the Phase-2 golden surface is untouched.
   *
   * Source: raw/genshin_calc_pub/src/js/db/Weapon/Claymore/RedhornStonethresher.js:28-38.
   */
  readonly multipliers?: readonly CharMultiplier[];
}
