/**
 * Weapon base-stat tables for the P1.7b representative weapon set.
 *
 * Ported from raw/genshin_calc_pub/src/js/db/generated/WeaponStatTables.js (immutable).
 * Default weapons assigned by the oracle engine (auto-assigns first-weapon-of-type):
 *   - Blackcliff Pole (polearm): Hu Tao, Ineffa → n11 (atk_base) + n46 (crit_dmg_base)
 *   - The Bell (claymore): Diluc, Itto → n11 (atk_base) + n26 (hp_percent)
 *
 * Scale values from WeaponStatTables.js / WeaponScale.js:
 *   n11 atk_base:  base=42.401, ascension=n2([25.9,51.9,77.8,103.7,129.7,155.6]),
 *                  scale=atk_2_1 (= s4atk, same 100-entry table)
 *   n46 crit_dmg_base: base=12, scale=crt_2_1 (100-entry; index 89 = 4.594)
 *   n26 hp_percent: base=9, scale=crt_2_1
 *
 * Source: raw/genshin_calc_pub/src/js/db/generated/WeaponStatTables.js:62-70,146-150,249-253
 *         raw/genshin_calc_pub/src/js/db/generated/WeaponScale.js:10,21
 */

import { StatTable, StatTableAscensionScale } from "@genshin/core";
import type { StatTableEntry } from "@genshin/types";

/** atk_2_1 weapon level scale (same values as s4atk).
 * Source: WeaponScale.js:10 */
const atk_2_1 = new StatTable([
  1.0, 1.083, 1.165, 1.248, 1.33, 1.413, 1.495, 1.578, 1.661, 1.743, 1.826,
  1.908, 1.991, 2.073, 2.156, 2.239, 2.321, 2.404, 2.486, 2.569, 2.651, 2.734,
  2.817, 2.899, 2.982, 3.064, 3.147, 3.229, 3.312, 3.394, 3.477, 3.56, 3.642,
  3.725, 3.807, 3.89, 3.972, 4.055, 4.138, 4.22, 4.303, 4.385, 4.468, 4.55,
  4.633, 4.716, 4.798, 4.881, 4.963, 5.046, 5.128, 5.211, 5.294, 5.376, 5.459,
  5.541, 5.624, 5.706, 5.789, 5.872, 5.954, 6.037, 6.119, 6.202, 6.284, 6.367,
  6.45, 6.532, 6.615, 6.697, 6.78, 6.862, 6.945, 7.028, 7.11, 7.193, 7.275,
  7.358, 7.44, 7.523, 7.606, 7.688, 7.771, 7.853, 7.936, 8.018, 8.101, 8.183,
  8.266, 8.349, 8.431, 8.514, 8.596, 8.679, 8.761, 8.844, 8.927, 9.009, 9.092,
  9.174,
]);

/** crt_2_1 weapon sub-stat scale (step-wise; 100 entries, index 89 = 4.594).
 * Source: WeaponScale.js:21 */
const crt_2_1 = new StatTable([
  1.0, 1.0, 1.0, 1.0, 1.162, 1.162, 1.162, 1.162, 1.162, 1.363, 1.363, 1.363,
  1.363, 1.363, 1.565, 1.565, 1.565, 1.565, 1.565, 1.767, 1.767, 1.767, 1.767,
  1.767, 1.969, 1.969, 1.969, 1.969, 1.969, 2.171, 2.171, 2.171, 2.171, 2.171,
  2.373, 2.373, 2.373, 2.373, 2.373, 2.575, 2.575, 2.575, 2.575, 2.575, 2.777,
  2.777, 2.777, 2.777, 2.777, 2.979, 2.979, 2.979, 2.979, 2.979, 3.181, 3.181,
  3.181, 3.181, 3.181, 3.383, 3.383, 3.383, 3.383, 3.383, 3.585, 3.585, 3.585,
  3.585, 3.585, 3.786, 3.786, 3.786, 3.786, 3.786, 3.988, 3.988, 3.988, 3.988,
  3.988, 4.19, 4.19, 4.19, 4.19, 4.19, 4.392, 4.392, 4.392, 4.392, 4.392,
  4.594, 4.594, 4.594, 4.594, 4.594, 4.796, 4.796, 4.796, 4.796, 4.796, 4.998,
]);

/** n2 ascension table — shared by n11 (atk_base polearm/claymore).
 * Source: WeaponStatTables.js:8 */
const n2_ascension = new StatTable([25.9, 51.9, 77.8, 103.7, 129.7, 155.6]);

function entry(
  stat: string,
  base: number,
  scale?: StatTable,
  ascension?: StatTable
): StatTableEntry {
  const params = scale !== undefined && ascension !== undefined
    ? { base, scale, ascension }
    : scale !== undefined
      ? { base, scale }
      : ascension !== undefined
        ? { base, ascension }
        : { base };
  const table = new StatTableAscensionScale(params);
  return {
    getName: () => stat,
    getValue: (level: number, asc: number) => table.getValue(level, asc),
  };
}

// ---------------------------------------------------------------------------
// Blackcliff Pole (polearm) — default for Hu Tao and Ineffa
// n11 (atk_base) + n46 (crit_dmg_base); passive OFF
// Source: WeaponStatTables.js:414-417 (BlackcliffPole → n11+n46)
// ---------------------------------------------------------------------------

export const blackcliffPoleStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 42.401, atk_2_1, n2_ascension),
  entry("crit_dmg_base", 12, crt_2_1),
];

// ---------------------------------------------------------------------------
// The Bell (claymore) — default for Diluc and Itto
// n11 (atk_base) + n26 (hp_percent); passive OFF
// Source: WeaponStatTables.js:596-599 (Bell → n11+n26)
// ---------------------------------------------------------------------------

export const theBellStatTable: readonly StatTableEntry[] = [
  entry("atk_base", 42.401, atk_2_1, n2_ascension),
  entry("hp_percent", 9, crt_2_1),
];

export const weaponStatTables = {
  BlackcliffPole: blackcliffPoleStatTable,
  Bell: theBellStatTable,
};
