/**
 * Catalog helpers — resolve build-form keys into the engine's data objects.
 *
 * Thin lookups over the `@genshin/data` barrels (`ALL_CHARACTERS`, `ALL_WEAPONS`,
 * `ARTIFACT_SETS`). `computeBuild` (lib/calc.ts) uses these to turn a `BuildForm`'s
 * string keys into the `DbObject*` shapes `reconstructPort` consumes.
 */

import { ALL_CHARACTERS, ALL_WEAPONS, ARTIFACT_SETS } from "@genshin/data";
import type {
  DbObjectArtifactSet,
  DbObjectChar,
  DbObjectWeapon,
  StatTableEntry,
} from "@genshin/types";

export const findCharacter = (key: string): DbObjectChar | undefined =>
  ALL_CHARACTERS.find((c) => c.name === key);

export const findWeapon = (key: string): DbObjectWeapon | undefined =>
  ALL_WEAPONS.find((w) => w.name === key);

/**
 * The weapon's base-stat table.
 *
 * Confirmed against `DbObjectWeapon` (packages/types/src/weapon.ts:52 —
 * `readonly statTable: WeaponStatTable`). This is the SAME generated table object
 * the golden harness (goldenConfig.test.ts via `WEAPON_TABLE_BY_TYPE`) resolves for
 * a weapon of that type, so the reconstructed build matches the oracle byte-for-byte.
 */
export function resolveWeaponStatTable(
  weapon: DbObjectWeapon
): readonly StatTableEntry[] {
  return weapon.statTable;
}

/**
 * The full `{ setKey (goodId) → DbObjectArtifactSet }` registry — the DI seam
 * `reconstructPort`/`buildStats` resolve equipped sets against.
 *
 * Confirmed shape: `ARTIFACT_SETS` is `Record<string, DbObjectArtifactSet>` keyed by
 * each set's `goodId` (packages/data/src/artifacts/sets/index.ts).
 */
export function buildSetRegistry(): Readonly<Record<string, DbObjectArtifactSet>> {
  return ARTIFACT_SETS;
}
