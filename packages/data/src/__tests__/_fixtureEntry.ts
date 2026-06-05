/**
 * Shared fixture-entry type + output-kind predicates for the oracle test suites.
 *
 * Every golden/burndown suite loads oracle fixtures (tests/golden/fixtures/**) whose
 * `features` map string keys to these entries. Before P3.5.0 each suite carried its own
 * byte-identical `FixtureEntry` + `isDamageTripleEntry`; this is the single source so the
 * gate's output-kind logic lives in one place (P3.5.0 — the structurally-blind gate fix).
 *
 * Output kinds (from her engine's dump, tools/oracle/engine.mjs computeFeatures):
 *  - DAMAGE      damageType non-empty ("normal"|"charged"|…|"reaction"); can crit (normal ≠ crit).
 *  - NON-DAMAGE  damageType "" and category ≠ "stats": heal / shield / crystallize / static
 *                readouts. her engine emits normal == crit == average (noCritValues).
 *  - STATS       category "stats": raw stat-bag readouts (atk/hp/…). Not asserted here
 *                (buildStats.test.ts / characters.test.ts cover stat aggregation).
 */
export interface FixtureEntry {
  readonly category: string;
  readonly damageType: string | undefined;
  readonly normal: number;
  readonly crit: number;
  readonly average: number;
  readonly isReacted: boolean;
  readonly format: string;
}

/** A damage hit her engine emits with a non-empty damageType (excludes stats + non-damage). */
export function isDamageTripleEntry(entry: FixtureEntry): boolean {
  if (entry.category === "stats") return false;
  if (!entry.damageType) return false;
  return true;
}

/** Any OUTPUT we assert metric-for-metric: damage + heal/shield/crystallize/static. Excludes only "stats". */
export function isAssertableOutput(entry: FixtureEntry): boolean {
  return entry.category !== "stats";
}

/** A non-damage output (heal/shield/crystallize/static): a single value, normal == crit == average. */
export function isNonDamageOutput(entry: FixtureEntry): boolean {
  return isAssertableOutput(entry) && !isDamageTripleEntry(entry);
}
