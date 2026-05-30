/**
 * StatTable and StatTableAscensionScale — faithful port of Aspirine's StatTable classes.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/classes/StatTable.js
 *   raw/genshin_calc_pub/src/js/classes/StatTable/Ascension/Scale.js
 *
 * CURVE-EXACTNESS IS CRITICAL: StatTableAscensionScale.getValue must reproduce her
 * numbers byte-for-byte for P1.9's golden suite. Do not "improve" the arithmetic.
 */

/**
 * Simple 1-indexed table of values.
 *
 * Ports StatTable from her source:
 *   getValue(level): values[level-1], clamped to last entry; 0 for level≤0
 */
export class StatTable {
  private readonly values: readonly number[];

  constructor(values: readonly number[]) {
    this.values = values;
  }

  /**
   * Returns the table value for the given 1-indexed level.
   *
   * - level ≤ 0      → 0
   * - level > length → last entry (clamp)
   */
  getValue(level: number): number {
    if (level <= 0) return 0;
    const idx = Math.min(level, this.values.length) - 1;
    return this.values[idx] ?? 0;
  }

  getValues(): readonly number[] {
    return this.values;
  }
}

// ---------------------------------------------------------------------------
// StatTableAscensionScale
// ---------------------------------------------------------------------------

export interface StatTableAscensionScaleParams {
  /** Level-1 base value. */
  readonly base: number;
  /** Per-level growth curve (100 entries for character; 90 for weapon). */
  readonly scale?: StatTable;
  /** Per-ascension-phase bonus values (6 entries for chars; 0-indexed by ascension-1). */
  readonly ascension?: StatTable;
}

/**
 * Ascension-aware stat table for character/weapon base stats.
 *
 * Ports StatTableAscensionScale from her source:
 *   getValue(level, ascension):
 *     value = base * levelScaling.getValue(level)   (if scale provided)
 *     value += ascensionTable.getValue(ascension)   (if ascension provided)
 *
 * IMPORTANT: ascension=0 returns 0 bonus (StatTable.getValue(0) = 0 by contract).
 */
export class StatTableAscensionScale {
  private readonly base: number;
  private readonly scale?: StatTable;
  private readonly ascension?: StatTable;

  constructor(params: StatTableAscensionScaleParams) {
    this.base = params.base;
    if (params.scale !== undefined) {
      this.scale = params.scale;
    }
    if (params.ascension !== undefined) {
      this.ascension = params.ascension;
    }
  }

  /**
   * Returns the stat value at the given character level and ascension phase.
   *
   * Exact port of StatTableAscensionScale.getValue():
   *   value  = base
   *   level ||= 1
   *   if (levelScaling) value *= levelScaling.getValue(level)
   *   value += ascensionTable.getValue(ascensionLevel)   // 0 if no table
   */
  getValue(level: number, ascensionLevel: number): number {
    let value = this.base;
    const effectiveLevel = level || 1;

    if (this.scale !== undefined) {
      value *= this.scale.getValue(effectiveLevel);
    }

    if (this.ascension !== undefined) {
      value += this.ascension.getValue(ascensionLevel);
    }

    return value;
  }
}
