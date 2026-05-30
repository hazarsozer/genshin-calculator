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

// ---------------------------------------------------------------------------
// StatTableAscension (interpolating) + StatTableAscensionWeapon
// ---------------------------------------------------------------------------

/**
 * Interpolating ascension-aware base-stat table.
 *
 * DISTINCT from StatTableAscensionScale above: that variant multiplies a base by
 * a per-level scale curve. THIS variant stores values at a sparse set of KNOT
 * levels (`getKnotLevels()`) and interpolates between them with a TRUNCATING
 * (Math.floor) linear interpolation, then adds the ascension-phase bonus.
 *
 * Exact port of StatTableAscension.getValue (raw/.../StatTable/Ascension.js):
 *   value = values[0]
 *   for i = size-1 .. 0:
 *     if (level == knot[i])           value = values[i]; break
 *     else if (level > knot[i] && values has i+1):
 *       value = values[i] + floor((level - knot[i]) * (values[i+1]-values[i])
 *                                 / (knot[i+1] - knot[i]))
 *       break
 *   value += ascensionValue(ascensionLevel)
 *
 * NOTE: there is NO `level <= 0 → 0` short-circuit here (unlike the simple
 * StatTable). For level ≤ first-knot the loop matches nothing and `value` stays
 * `values[0]`. Faithful to her code.
 *
 * Source: raw/genshin_calc_pub/src/js/classes/StatTable/Ascension.js
 */
export class StatTableAscension {
  protected readonly stat: string;
  protected readonly values: readonly number[];
  private readonly ascensionValues: readonly number[];

  constructor(
    stat: string,
    values: readonly number[],
    ascensionValues: readonly number[] = []
  ) {
    this.stat = stat;
    this.values = values;
    this.ascensionValues = ascensionValues;
  }

  getName(): string {
    return this.stat;
  }

  /** Knot levels the values are sampled at. Subclasses override. */
  protected getKnotLevels(): readonly number[] {
    return [];
  }

  getValue(level: number, ascensionLevel: number): number {
    const knots = this.getKnotLevels();
    let value = this.values[0] ?? 0;
    const size = Math.min(knots.length, this.values.length);

    for (let i = size - 1; i >= 0; --i) {
      const curLevel = knots[i]!;
      if (level === curLevel) {
        value = this.values[i]!;
        break;
      } else if (level > curLevel && this.values.length > i + 1) {
        const nextKnot = knots[i + 1]!;
        value =
          this.values[i]! +
          Math.floor(
            ((level - curLevel) * (this.values[i + 1]! - this.values[i]!)) /
              (nextKnot - curLevel)
          );
        break;
      }
    }

    value += this.getAscensionValue(ascensionLevel);
    return value;
  }

  /**
   * Ports StatTableAscension.getAsensionValue (her spelling kept in raw):
   *   1-indexed; 0 when ascensionLevel ≤ 0 or beyond the table.
   */
  protected getAscensionValue(ascensionLevel: number): number {
    if (ascensionLevel > 0 && ascensionLevel <= this.ascensionValues.length) {
      return this.ascensionValues[ascensionLevel - 1]!;
    }
    return 0;
  }
}

/**
 * Weapon base-stat interpolating table — knot levels [1,20,40,50,60,70,80,90].
 *
 * Source: raw/genshin_calc_pub/src/js/classes/StatTable/Ascension/Weapon.js
 */
export class StatTableAscensionWeapon extends StatTableAscension {
  protected override getKnotLevels(): readonly number[] {
    return [1, 20, 40, 50, 60, 70, 80, 90];
  }
}
