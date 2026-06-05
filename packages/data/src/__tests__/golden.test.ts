/**
 * P1.8 — Golden-test harness over the representative character set.
 *
 * Loads the oracle fixture for each P1.7b representative character, runs our
 * engine on the IDENTICAL fixed canonical build (Lv90/A6, talents 10/10/10,
 * enemy Lv90 10% resistance, the sampleStats bonus block), and asserts every
 * feature we PRODUCE matches the fixture triple within tolerance.
 *
 * COVERAGE PHILOSOPHY (as of P1.8)
 * Our engine produces a subset of each fixture's features — only what is modelled
 * in P1.7b. For every feature we produce:
 *   abs(ours - oracle) <= TOLERANCE  ← hard assertion (gate)
 * For fixture features we do NOT yet produce, a visible gap report is printed to
 * console.info and the test does NOT fail. P1.9 will expand the character list and
 * tighten the gap-report into a hard assertion.
 *
 * TOLERANCE CHOICE
 * We use an absolute tolerance of 0.5 (i.e., |ours − oracle| ≤ 0.5).
 * Rationale: Aspirine's engine accumulates floating-point rounding in JS; our port
 * replicates the same formula in TypeScript. The oracle values are stored at JS
 * double precision. Both engines operate in the same float64 domain, so divergence
 * is sub-unit on damage values that range from ~300 to ~50 000. An absolute bound
 * of 0.5 is tight enough to catch formula differences while immune to sub-unit
 * rounding. This matches the per-rep oracle tests' `toBeCloseTo(value, 0)` = ±0.5.
 *
 * FIXTURE CATEGORIES FILTERED
 * `category: "stats"` entries are stat readouts, not damage triples. The per-rep
 * `buildStats.test.ts` / `characters.test.ts` already cover stat aggregation.
 * They are excluded from damage-triple assertions.
 *
 * Fixture features with an empty or absent `damageType` and zero `normal` value
 * are display-only entries (e.g. heal-magnitude, ATK-bonus display, shield amount).
 * We skip damage-triple assertions for those as well (the oracle does not fill a
 * meaningful triple for them).
 *
 * SCALE-OUT CONTRACT (P1.9)
 * To expand to all 107 characters:
 * 1. Add their `DbObjectChar` + weapon stat table to the `REPS` array below.
 * 2. The harness logic is unchanged — produced features are asserted, gaps reported.
 * 3. When P1.9 wants ALL fixture features to pass, convert the gap-report console.info
 *    into a failing assertion (or flip `allowGaps = false` per character entry).
 *
 * Sources:
 *   tests/golden/fixtures/<slug>.json   — oracle fixture
 *   packages/data/src/__tests__/characters.test.ts — STAT_BLOCK / LEVELS / ENEMY / TALENTS
 */

import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";
import { describe, it, expect } from "vitest";
import { buildStats } from "../buildStats.js";
import { compileCharacter } from "../loader.js";
// Characters are AUTO-DISCOVERED from ../characters/*.ts (import.meta.glob, below) —
// no per-character import is listed here. Adding a character = dropping its file in
// that directory; it is picked up automatically. This keeps this shared gate file
// untouched by character ports (so parallel ports merge without conflict) and makes
// it structurally impossible to add a character file that is silently never tested.
import {
  blackcliffPoleStatTable,
  theBellStatTable,
  alleyFlashStatTable,
  alleyHunterStatTable,
  solarPearlStatTable,
} from "../generated/weaponStatTables.js";
import type { DbObjectChar } from "@genshin/types";
import type { StatTableEntry } from "@genshin/types";
import { type FixtureEntry, isDamageTripleEntry } from "./_fixtureEntry.js";

// ---------------------------------------------------------------------------
// FIXED canonical build (verbatim from _manifest.json / characters.test.ts)
// ---------------------------------------------------------------------------

/**
 * The fixed canonical stat block from _manifest.json / sampleStats.js.
 * Raw (un-percent-processed) values, uniform for every character.
 */
const STAT_BLOCK = {
  atk_base: 871,
  atk_percent: 18,
  crit_dmg_base: 50,
  crit_rate_base: 5,
  def_base: 876,
  dmg_burst: 64,
  dmg_charged: 16,
  dmg_electro: 2,
  dmg_normal: 8,
  dmg_phys: 4,
  dmg_skill: 32,
  hp_base: 13226,
  mastery_base: 55,
  recharge_base: 100,
} as const;

/** Canonical levels from _manifest.json. */
const LEVELS = {
  charLevel: 90,
  ascension: 6,
  weaponLevel: 90,
  weaponAscension: 6,
} as const;

/** Canonical enemy from _manifest.json. */
const ENEMY = { level: 90, resistance: 10 } as const;

/** Canonical talent levels from _manifest.json. */
const TALENTS = { attack: 10, elemental: 10, burst: 10 } as const;

/**
 * Absolute tolerance for [normal, crit, avg] triple comparison.
 * abs(ours - oracle) <= TOLERANCE  for each value in the triple.
 * P1.9-complete: tightened 0.5 → 0.1. Empirically every one of the 107 chars'
 * features matches the oracle within ~0.08 (her engine's display-rounding level on
 * damage values of 100s–10000s); 0.1 is a clean bound above that max with margin,
 * 5× tighter than the original 0.5, catching any systematic formula drift.
 */
const TOLERANCE = 0.1;

// ---------------------------------------------------------------------------
// Fixture types
// ---------------------------------------------------------------------------

interface Fixture {
  readonly features: Record<string, FixtureEntry>;
}

// ---------------------------------------------------------------------------
// Fixture loader
// ---------------------------------------------------------------------------

const FIXTURES_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../tests/golden/fixtures"
);

function loadFixture(slug: string): Fixture {
  const raw = readFileSync(join(FIXTURES_DIR, `${slug}.json`), "utf-8");
  return JSON.parse(raw) as Fixture;
}

// ---------------------------------------------------------------------------
// Representative set
// Each entry: the DbObjectChar, its weapon stat table, its fixture slug, and
// whether it needs a charLevel on the compile context (reaction features).
// ---------------------------------------------------------------------------

interface Rep {
  readonly char: DbObjectChar;
  readonly weaponStatTable: readonly StatTableEntry[];
  /** The fixture JSON slug, e.g. "hu_tao" for hu_tao.json. */
  readonly slug: string;
}

/**
 * Default weapon stat table by weapon type — the canonical fixed-build weapon for
 * each weapon class. Verbatim from the original hand-listed REPS: every character of
 * a given type used its type's default table, so the table is fully determined by
 * `char.weapon`. Deriving it here removes the last per-character datum from this file.
 */
const WEAPON_TABLE_BY_TYPE: Readonly<Record<string, readonly StatTableEntry[]>> = {
  sword: alleyFlashStatTable,
  claymore: theBellStatTable,
  polearm: blackcliffPoleStatTable,
  bow: alleyHunterStatTable,
  catalyst: solarPearlStatTable,
};

// Minimal local type for Vite's `import.meta.glob` so the typecheck gate passes
// without a vite/client dependency. Vitest supplies the real implementation (it
// transforms the call into eager static imports) at runtime.
declare global {
  interface ImportMeta {
    glob(
      pattern: string,
      options: { eager: true }
    ): Record<string, Record<string, unknown>>;
  }
}

/** Fixture slug from a module path: `../characters/arataki-itto.ts` → `arataki_itto`. */
function slugFromPath(path: string): string {
  const base = path.slice(path.lastIndexOf("/") + 1).replace(/\.ts$/, "");
  return base.replace(/-/g, "_");
}

/** A character module's single data export is the DbObjectChar (has weapon/element/features). */
function isDbObjectChar(value: unknown): value is DbObjectChar {
  return (
    typeof value === "object" &&
    value !== null &&
    "weapon" in value &&
    "element" in value &&
    "features" in value
  );
}

// Eager-glob every character module. Each file has exactly one DbObjectChar export;
// the slug comes from the filename and the weapon table from the character's type.
const CHAR_MODULES = import.meta.glob("../characters/*.ts", { eager: true });

const REPS: readonly Rep[] = Object.entries(CHAR_MODULES)
  .filter(([path]) => !path.endsWith("/index.ts"))
  .map(([path, mod]): Rep => {
    const slug = slugFromPath(path);
    const chars = Object.values(mod).filter(isDbObjectChar);
    if (chars.length !== 1) {
      throw new Error(
        `characters/${slug}: expected exactly 1 DbObjectChar export, found ${chars.length}`
      );
    }
    const char = chars[0]!;
    const weaponStatTable = WEAPON_TABLE_BY_TYPE[char.weapon];
    if (!weaponStatTable) {
      throw new Error(
        `characters/${slug}: no default weapon table for weapon type "${char.weapon}"`
      );
    }
    return { char, weaponStatTable, slug };
  })
  .sort((a, b) => a.slug.localeCompare(b.slug));

// ---------------------------------------------------------------------------
// Golden harness
// ---------------------------------------------------------------------------

// Belt-and-suspenders guard: the glob must discover EVERY character file on disk.
// If import.meta.glob ever under-matches, this fails loudly rather than silently
// leaving a character untested — the precise failure mode auto-discovery prevents.
describe("auto-discovery", () => {
  it("every character file is represented in REPS", () => {
    const charDir = join(dirname(fileURLToPath(import.meta.url)), "../characters");
    const fileCount = readdirSync(charDir).filter(
      (f) => f.endsWith(".ts") && f !== "index.ts"
    ).length;
    expect(REPS.length).toBe(fileCount);
    expect(REPS.length).toBeGreaterThan(0);
  });
});

for (const { char, weaponStatTable, slug } of REPS) {
  describe(`golden: ${slug}`, () => {
    const fixture = loadFixture(slug);

    // Build the engine context for this character.
    const { context } = buildStats({
      char,
      weaponStatTable,
      statBlock: STAT_BLOCK,
      levels: LEVELS,
      enemy: ENEMY,
      settings: {},
    });

    // Compile all (non-child) features the engine currently models.
    const compiled = compileCharacter(char, {
      charElement: char.element,
      talentLevels: TALENTS,
      settings: {},
      charLevel: LEVELS.charLevel,
    });

    // Fixture feature keys that are damage triples (exclude stats + display entries).
    const allDamageKeys = Object.entries(fixture.features)
      .filter(([, entry]) => isDamageTripleEntry(entry))
      .map(([key]) => key);

    // Keys our engine produces — intersection with fixture damage keys.
    const producedKeys = Object.keys(compiled).filter((k) => k in fixture.features);
    const unmodelledKeys = allDamageKeys.filter((k) => !(k in compiled));

    // Mis-key guard: keys our engine PRODUCES that are absent from the fixture.
    // A feature computed under the wrong key (e.g. `plunge.plunge` vs `attack.plunge`)
    // would otherwise silently vanish from the produced-key assertions AND inflate the
    // gap list. Must be empty — a produced key absent from the fixture is a key bug,
    // not a coverage gap. (P1.9 relies on this guard across 103 hand-ported characters.)
    const orphanKeys = Object.keys(compiled).filter((k) => !(k in fixture.features));

    // --- Assertions: every produced key must match within TOLERANCE ---
    for (const key of producedKeys) {
      const oracle = fixture.features[key]!;
      // Only assert on entries that are damage triples (skip non-damage fixture entries).
      if (!isDamageTripleEntry(oracle)) continue;

      it(`${key} normal within ${TOLERANCE}`, () => {
        const result = compiled[key]!(context);
        expect(
          Math.abs(result.normal - oracle.normal),
          `${slug}/${key} normal: ours=${result.normal.toFixed(4)}, oracle=${oracle.normal.toFixed(4)}`
        ).toBeLessThanOrEqual(TOLERANCE);
      });

      it(`${key} crit within ${TOLERANCE}`, () => {
        const result = compiled[key]!(context);
        expect(
          Math.abs(result.crit - oracle.crit),
          `${slug}/${key} crit: ours=${result.crit.toFixed(4)}, oracle=${oracle.crit.toFixed(4)}`
        ).toBeLessThanOrEqual(TOLERANCE);
      });

      it(`${key} avg within ${TOLERANCE}`, () => {
        const result = compiled[key]!(context);
        expect(
          Math.abs(result.avg - oracle.average),
          `${slug}/${key} avg: ours=${result.avg.toFixed(4)}, oracle=${oracle.average.toFixed(4)}`
        ).toBeLessThanOrEqual(TOLERANCE);
      });
    }

    // --- Mis-key guard (hard gate): every produced key must exist in the fixture ---
    it(`${slug}: no produced key is absent from the fixture (mis-key guard)`, () => {
      expect(
        orphanKeys,
        `produced but absent from fixture (mis-keyed?): ${orphanKeys.join(", ")}`
      ).toEqual([]);
    });

    // --- Coverage GATE (P1.9 complete): every fixture damage feature must be modelled ---
    it(`${slug}: full coverage — no unmodelled fixture damage feature`, () => {
      const total = allDamageKeys.length;
      const modelled = producedKeys.filter((k) => {
        const oracle = fixture.features[k];
        return oracle !== undefined && isDamageTripleEntry(oracle);
      }).length;
      console.info(`[golden] ${slug}: ${modelled}/${total} fixture damage features modelled — full coverage`);
      // Hard gate (locks in 107/107): no fixture damage feature may be left unmodelled.
      // A regression that drops a feature, or a new fixture feature, fails here.
      expect(
        unmodelledKeys,
        `${slug}: unmodelled fixture damage features: ${unmodelledKeys.join(", ")}`
      ).toEqual([]);
    });
  });
}
