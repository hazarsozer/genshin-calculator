/**
 * Weapon domain types.
 *
 * Sources:
 *   wiki/architecture/db-object-model.md
 *   raw/genshin_calc_pub/src/js/db/Weapon/Sword/AquilaFavonia.js
 */

import type { WeaponType, Refinement } from "./character.js";

export type { WeaponType, Refinement };

/**
 * Structural shape of a weapon entity as registered in DB.
 *
 * Fields drawn from DbObjectWeapon constructor usage in AquilaFavonia.js:
 *   name, gameId, rarity, weapon, statTable, conditions, features.
 */
export interface DbObjectWeapon {
  readonly name: string;
  /** Game-internal numeric ID. */
  readonly gameId: number;
  readonly rarity: 1 | 2 | 3 | 4 | 5;
  readonly weapon: WeaponType;
  /** Stat-table data for base stats at each level/refinement. */
  readonly statTable: unknown;
  /** Weapon passive conditions (refinement-scaled buffs). */
  readonly conditions?: readonly unknown[];
  /** Weapon proc features (on-hit damage, heals, etc.). */
  readonly features?: readonly unknown[];
}
