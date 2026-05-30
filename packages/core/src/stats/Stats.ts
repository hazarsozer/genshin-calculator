/**
 * Stats accumulator — faithful port of Aspirine's Stats.js.
 *
 * Source: raw/genshin_calc_pub/src/js/classes/Stats.js
 *
 * Key behaviour:
 *   - `add(key, value)`  accumulates (or initialises from 0)
 *   - `set(key, value)`  overwrites
 *   - `get(key)`         returns 0 if absent
 *   - `concat(obj)`      merges a plain object by accumulating each key
 *   - `getTotal(stat)`   = base + (base * percent/100) + flat
 *
 * `Stats` is intentionally an open bag (string→number) to match her engine's
 * dynamic key vocabulary. The type parameter is a convenience constraint for
 * callers that know their key set; runtime behaviour is unchanged.
 */
export class Stats<K extends string = string> {
  private readonly _data: Record<string, number> = {};

  constructor(data?: Readonly<Partial<Record<K, number>>> | Readonly<Record<string, number>>) {
    if (data) {
      for (const key of Object.keys(data)) {
        const v = (data as Record<string, number>)[key];
        if (v !== undefined) {
          this._data[key] = v;
        }
      }
    }
  }

  add(key: string, value: number): void {
    this._data[key] = (this._data[key] ?? 0) + value;
  }

  set(key: string, value: number): void {
    this._data[key] = value;
  }

  get(key: string): number {
    return this._data[key] ?? 0;
  }

  del(key: string): void {
    delete this._data[key];
  }

  isSet(key: string): boolean {
    return Object.prototype.hasOwnProperty.call(this._data, key);
  }

  isEmpty(): boolean {
    return Object.keys(this._data).length === 0;
  }

  /**
   * Merge all keys from a plain object, accumulating into existing values.
   * Faithfully ports Stats.concat() from her source.
   */
  concat(data: Readonly<Record<string, number>>): void {
    for (const key of Object.keys(data)) {
      const v = data[key];
      if (v !== undefined) {
        this._data[key] = (this._data[key] ?? 0) + v;
      }
    }
  }

  /**
   * Total for a combat stat.
   *
   * Ports Stats.getTotal(stat):
   *   base    = get(stat + '_base')
   *   bonus   = get(stat)
   *   percent = get(stat + '_percent')
   *   if (percent && base) bonus += base * (percent / 100)
   *   return base + bonus
   *
   * Examples:
   *   getTotal('atk') = atk_base + atk_base * (atk_percent/100) + atk
   *   getTotal('hp')  = hp_base  + hp_base  * (hp_percent/100)  + hp
   */
  getTotal(stat: string): number {
    const base = this.get(stat + "_base");
    let bonus = this.get(stat);
    const percent = this.get(stat + "_percent");

    if (percent && base) {
      bonus += base * (percent / 100);
    }

    return base + bonus;
  }

  /** Snapshot of internal data (for serialisation / debugging). */
  toRecord(): Readonly<Record<string, number>> {
    return { ...this._data };
  }
}
