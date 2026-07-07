/**
 * Weapon stat range helper — derives level-1 to level-90 stat ranges from a
 * weapon's statTable (statTable[0] = ATK base, statTable[1] = secondary stat).
 *
 * These are display-only utilities; they never touch the engine math path.
 */

import type { DbObjectWeapon } from "@genshin/types";

interface SecStatMeta {
  label: string;
  isPercent: boolean;
}

/** Human-readable label + whether the VALUE gets a "%" suffix. */
const SEC_STAT_META: Record<string, SecStatMeta> = {
  crit_rate_base: { label: "CRIT Rate", isPercent: true },
  crit_dmg_base:  { label: "CRIT DMG",  isPercent: true },
  atk_percent:    { label: "ATK%",      isPercent: true },
  mastery_base:   { label: "EM",        isPercent: false },
  recharge_base:  { label: "ER%",       isPercent: true },
  hp_percent:     { label: "HP%",       isPercent: true },
  def_percent:    { label: "DEF%",      isPercent: true },
  dmg_phys_base:  { label: "Phys DMG%", isPercent: true },
};

export interface WeaponSecStat {
  key: string;
  label: string;
  /** Value at level 1, ascension 0. */
  lo: number;
  /** Value at level 90, ascension 6. */
  hi: number;
  isPercent: boolean;
}

export interface WeaponStatRange {
  /** [lo, hi] = ATK at lv1/asc0 and lv90/asc6. */
  atk: [lo: number, hi: number];
  sec?: WeaponSecStat;
}

/**
 * Returns lv1→lv90 ranges for a weapon's base ATK and optional secondary stat.
 *
 * Uses `statTable[0].getValue(1,0)` / `getValue(90,6)` for ATK and, if
 * `statTable[1]` exists, the same calls for the secondary stat with `getName()`
 * used to look up the human label.
 */
export function weaponStatRange(weapon: DbObjectWeapon): WeaponStatRange {
  const [atkEntry, secEntry] = weapon.statTable;

  const atk: [number, number] = [
    atkEntry.getValue(1, 0),
    atkEntry.getValue(90, 6),
  ];

  let sec: WeaponSecStat | undefined;
  if (secEntry !== undefined) {
    const key = secEntry.getName();
    const meta: SecStatMeta = SEC_STAT_META[key] ?? { label: key, isPercent: false };
    sec = {
      key,
      label: meta.label,
      lo: secEntry.getValue(1, 0),
      hi: secEntry.getValue(90, 6),
      isPercent: meta.isPercent,
    };
  }

  return { atk, sec };
}

/**
 * Format a weapon's stat ranges as a compact display string.
 * e.g. "ATK 48–608 · CRIT Rate 4.8%–9.6%"
 *
 * - ATK: rounded to integer.
 * - Percent secondary stats: 1 decimal place + "%".
 * - Non-percent (EM): 1 decimal place, no "%".
 */
export function formatWeaponMeta(weapon: DbObjectWeapon): string {
  const { atk, sec } = weaponStatRange(weapon);
  const atkStr = `ATK ${Math.round(atk[0])}–${Math.round(atk[1])}`;

  if (!sec) return atkStr;

  const fmt = (v: number): string =>
    sec.isPercent ? `${v.toFixed(1)}%` : v.toFixed(1);

  return `${atkStr} · ${sec.label} ${fmt(sec.lo)}–${fmt(sec.hi)}`;
}
