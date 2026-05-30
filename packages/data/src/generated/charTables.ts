/**
 * Character base-stat tables for the P1.7b representative set.
 *
 * Ported from raw/genshin_calc_pub/src/js/db/generated/CharTables.js (immutable).
 * Each character entry is an array of StatTableEntry objects, faithful to her
 * StatTableAscensionScale shape: getName() → stat key, getValue(level, asc) → value.
 *
 * Port approach: extracted per-character slices from CharTables.js and
 * transcribed only the 4 representative entries (Hutao, Diluc, Itto, Ineffa).
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js:265   (Diluc)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js:1342  (Hutao)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js:1809  (Itto)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js:4320  (Ineffa)
 *   raw/genshin_calc_pub/src/js/db/generated/CharScale.js:4-8    (s5atk, s5hp)
 */

import { StatTable, StatTableAscensionScale } from "@genshin/core";
import type { StatTableEntry } from "@genshin/types";
import { s5atk, s5hp } from "./charScales.js";

/**
 * Wrap a StatTableAscensionScale into a named StatTableEntry.
 * Her generated entries carry `stat` as the key; the core port is key-agnostic
 * so we attach it here.
 */
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

/** Constant-value entry (no level/ascension scaling). */
function constEntry(stat: string, value: number): StatTableEntry {
  return {
    getName: () => stat,
    getValue: () => value,
  };
}

// ---------------------------------------------------------------------------
// Hu Tao — CharTables.js:1342
// ---------------------------------------------------------------------------

export const Hutao: readonly StatTableEntry[] = [
  entry(
    "atk_base",
    8.2859,
    s5atk,
    new StatTable([7.1039, 12.1514, 18.8814, 23.9289, 28.9764, 34.0239])
  ),
  constEntry("burst_energy_cost", 60),
  constEntry("charged_stamina_cost", 25),
  entry(
    "crit_dmg_base",
    50,
    undefined,
    new StatTable([0, 9.6, 19.2, 19.2, 28.8, 38.4])
  ),
  constEntry("crit_rate_base", 5),
  entry(
    "def_base",
    68.2062,
    s5hp,
    new StatTable([58.482, 100.035, 155.439, 196.992, 238.545, 280.098])
  ),
  entry(
    "hp_base",
    1210.7164,
    s5hp,
    new StatTable([1038.0798, 1775.6628, 2759.107, 3496.69, 4234.273, 4971.856])
  ),
  constEntry("recharge_base", 100),
];

// ---------------------------------------------------------------------------
// Diluc — CharTables.js:265
// ---------------------------------------------------------------------------

export const Diluc: readonly StatTableEntry[] = [
  entry(
    "atk_base",
    26.068,
    s5atk,
    new StatTable([22.3493, 38.2291, 59.4021, 75.2819, 91.1617, 107.0415])
  ),
  constEntry("burst_energy_cost", 40),
  constEntry("charged_stamina_cost", 40),
  constEntry("crit_dmg_base", 50),
  entry(
    "crit_rate_base",
    5,
    undefined,
    new StatTable([0, 4.8, 9.6, 9.6, 14.4, 19.2])
  ),
  entry(
    "def_base",
    61.0266,
    s5hp,
    new StatTable([52.326, 89.505, 139.077, 176.256, 213.435, 250.614])
  ),
  entry(
    "hp_base",
    1010.5192,
    s5hp,
    new StatTable([866.4288, 1482.0493, 2302.8767, 2918.497, 3534.1177, 4149.7383])
  ),
  constEntry("recharge_base", 100),
];

// ---------------------------------------------------------------------------
// Itto — CharTables.js:1809
// ---------------------------------------------------------------------------

export const Itto: readonly StatTableEntry[] = [
  entry(
    "atk_base",
    17.689,
    s5atk,
    new StatTable([15.1656, 25.9412, 40.3086, 51.0842, 61.8597, 72.6353])
  ),
  constEntry("burst_energy_cost", 70),
  constEntry("charged_stamina_cost", 20),
  constEntry("crit_dmg_base", 50),
  entry(
    "crit_rate_base",
    5,
    undefined,
    new StatTable([0, 4.8, 9.6, 9.6, 14.4, 19.2])
  ),
  entry(
    "def_base",
    74.6678,
    s5hp,
    new StatTable([64.0224, 109.512, 170.1648, 215.6544, 261.144, 306.6336])
  ),
  entry(
    "hp_base",
    1000.986,
    s5hp,
    new StatTable([858.255, 1468.0677, 2281.1514, 2890.964, 3500.7769, 4110.59])
  ),
  constEntry("recharge_base", 100),
];

// ---------------------------------------------------------------------------
// Ineffa — CharTables.js:4320
// ---------------------------------------------------------------------------

export const Ineffa: readonly StatTableEntry[] = [
  entry(
    "atk_base",
    25.6956,
    s5atk,
    new StatTable([22.03, 37.683, 58.5535, 74.2065, 89.8594, 105.5123])
  ),
  constEntry("burst_energy_cost", 60),
  constEntry("charged_stamina_cost", 25),
  constEntry("crit_dmg_base", 50),
  entry(
    "crit_rate_base",
    5,
    undefined,
    new StatTable([0, 4.8, 9.6, 9.6, 14.4, 19.2])
  ),
  entry(
    "def_base",
    64.4369,
    s5hp,
    new StatTable([55.2501, 94.5067, 146.849, 186.1056, 225.3622, 264.6189])
  ),
  entry(
    "hp_base",
    981.9196,
    s5hp,
    new StatTable([841.9073, 1440.1045, 2237.701, 2835.8982, 3434.0955, 4032.2927])
  ),
  constEntry("recharge_base", 100),
];

export const charTables = { Hutao, Diluc, Itto, Ineffa };
