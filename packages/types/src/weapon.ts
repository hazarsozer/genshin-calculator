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

import type { WeaponType, Refinement, StatTableEntry } from "./character.js";
import type { Condition } from "./condition.js";

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
   * Weapon proc features (on-hit damage instances, heals, shields, etc.).
   * Left as unknown[] for this task — feature-granting weapons are flagged
   * for P2.W1 and must not be forced into the stat-only shape.
   */
  readonly features?: readonly unknown[];
}
