/**
 * Wave 0 — Parameterized golden harness for toggles / cons-mid / full-build.
 *
 * Three oracle fixture families, 10 reps each, 30 total:
 *
 *   toggles    — C0, one char toggle ON, sampleStats, R1 no passive.
 *   cons-mid   — mid constellation (C1..C5), all toggles OFF, sampleStats, R1 no passive.
 *   full-build — C0..C6 + R5 weapon passive ON + 4pc set + high-ATK/HP block + char toggle.
 *
 * For each rep the harness:
 *   1. Reads the family manifest (_manifest.json) for build parameters.
 *   2. Assembles the build context (char, weaponStatTable, statBlock, settings, setBonuses,
 *      extraConditions for weapon passive when passiveToggles is non-empty).
 *   3. Runs buildStats → compileCharacter.
 *   4. Asserts every PRODUCED damage feature matches the oracle fixture within abs 0.1.
 *   5. Applies the mis-key guard (no produced key absent from fixture).
 *   6. Applies the full-coverage gate (no unmodelled fixture damage feature).
 *
 * HONESTY RULES:
 *   - NO skip, NO loosened tolerance, NO hard-coded overrides.
 *   - A RED rep means the engine doesn't yet match the oracle — that is the signal.
 *   - TEST-ONLY: no production code was touched.
 *
 * Sources:
 *   tests/golden/fixtures/{toggles,cons-mid,full-build}/_manifest.json
 *   tests/golden/fixtures/{toggles,cons-mid,full-build}/<slug>.json
 *   packages/data/src/__tests__/constellations.test.ts    — primary template
 *   packages/data/src/__tests__/carriedFixes.test.ts      — _statBlocks origin
 *   packages/data/src/__tests__/weaponPassive.test.ts     — weapon passive pattern
 *   packages/data/src/__tests__/artifactSets.test.ts      — set registry + setBonuses pattern
 *   tools/oracle/build-configs.mjs                         — config definitions
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";
import { describe, it, expect } from "vitest";
import {
  theAlleyFlash,
  solarPearl,
  blackcliffPole,
  alleyHunter,
  theBell,
} from "../weapons/index.js";
import {
  alleyFlashStatTable,
  alleyHunterStatTable,
  blackcliffPoleStatTable,
  solarPearlStatTable,
  theBellStatTable,
} from "../generated/weaponStatTables.js";
import { SAMPLE_BLOCK, HIGH_ATK_HP_BLOCK } from "./_statBlocks.js";
import type { DbObjectArtifactSet, DbObjectChar, DbObjectWeapon, EvalContext, StatTableEntry } from "@genshin/types";
import { type FixtureEntry, isDamageTripleEntry } from "./_fixtureEntry.js";
// Shared port-side reconstruction (the load-bearing settings-merge + buildStats/compileCharacter
// assembly). Extracted so the differential parity harness (tools/oracle/diff-parity.mjs) drives
// the IDENTICAL reconstruction; this suite's continued green is the proof the extraction is faithful.
import {
  LEVELS,
  TALENTS,
  TOLERANCE,
  reconstructSettings,
  reconstructPort,
} from "../reconstruct.js";

// ---------------------------------------------------------------------------
// Constants — LEVELS / TALENTS / TOLERANCE now come from _reconstruct.ts (shared
// with the parity harness). ENEMY is the canonical 90/10 the three families share.
// ---------------------------------------------------------------------------

const ENEMY = { level: 90, resistance: 10 } as const;

// ---------------------------------------------------------------------------
// Fixture types — verbatim from constellations.test.ts
// ---------------------------------------------------------------------------

interface Fixture {
  readonly features: Record<string, FixtureEntry>;
}

// ---------------------------------------------------------------------------
// Fixture and manifest paths
// ---------------------------------------------------------------------------

const FIXTURES_ROOT = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../tests/golden/fixtures"
);

function loadFixture(family: string, slug: string): Fixture {
  return JSON.parse(
    readFileSync(join(FIXTURES_ROOT, family, `${slug}.json`), "utf-8")
  ) as Fixture;
}

// ---------------------------------------------------------------------------
// Manifest types
// ---------------------------------------------------------------------------

interface ManifestWeapon {
  readonly name: string;
  readonly level: number;
  readonly refine: number;
  /** Non-empty only for full-build reps with passive ON. */
  readonly passiveToggles: EvalContext;
}

interface ManifestChar {
  readonly ascension: number;
  readonly constellation: number;
  readonly level: number;
}

interface ManifestEnemy {
  readonly level: number;
  readonly res: number;
}

interface ManifestSkills {
  readonly attack: number;
  readonly burst: number;
  readonly elemental: number;
}

interface ManifestEntry {
  readonly slug: string;
  readonly key: string;
  readonly id: number;
  readonly char: ManifestChar;
  // `enemy` and `skills` mirror the JSON but are NOT consumed — all three families
  // share the canonical enemy (90/10) and talents (10/10/10), so the harness uses the
  // shared ENEMY/TALENTS constants. Typed here to document the full manifest shape.
  readonly enemy: ManifestEnemy;
  readonly skills: ManifestSkills;
  readonly weapon: ManifestWeapon;
  readonly artifactSets: Record<string, number>;
  readonly setToggles: EvalContext;
  readonly charToggles: EvalContext;
  readonly statBlock: string;
}

interface Manifest {
  readonly config: { readonly id: string };
  readonly characters: readonly ManifestEntry[];
}

function loadManifest(family: string): Manifest {
  return JSON.parse(
    readFileSync(join(FIXTURES_ROOT, family, "_manifest.json"), "utf-8")
  ) as Manifest;
}

// ---------------------------------------------------------------------------
// ImportMeta declaration for import.meta.glob — verbatim from constellations.test.ts
// ---------------------------------------------------------------------------

declare global {
  interface ImportMeta {
    glob(
      pattern: string,
      options: { eager: true }
    ): Record<string, Record<string, unknown>>;
  }
}

// ---------------------------------------------------------------------------
// Slug helpers — verbatim from constellations.test.ts
// ---------------------------------------------------------------------------

function slugFromPath(path: string): string {
  const base = path.slice(path.lastIndexOf("/") + 1).replace(/\.ts$/, "");
  return base.replace(/-/g, "_");
}

function isDbObjectChar(value: unknown): value is DbObjectChar {
  return (
    typeof value === "object" &&
    value !== null &&
    "weapon" in value &&
    "element" in value &&
    "features" in value
  );
}

function isDbObjectArtifactSet(value: unknown): value is DbObjectArtifactSet {
  return (
    typeof value === "object" &&
    value !== null &&
    "goodId" in value &&
    "bonus" in value
  );
}

// ---------------------------------------------------------------------------
// Auto-discover characters — same glob as constellations.test.ts
// ---------------------------------------------------------------------------

const CHAR_MODULES = import.meta.glob("../characters/*.ts", { eager: true });

const charBySlug: Readonly<Record<string, DbObjectChar>> = Object.fromEntries(
  Object.entries(CHAR_MODULES)
    .filter(([path]) => !path.endsWith("/index.ts"))
    .flatMap(([path, mod]) => {
      const slug = slugFromPath(path);
      const chars = Object.values(mod).filter(isDbObjectChar);
      if (chars.length !== 1) {
        throw new Error(
          `characters/${slug}: expected exactly 1 DbObjectChar export, found ${chars.length}`
        );
      }
      return [[slug, chars[0]!] as [string, DbObjectChar]];
    })
);

// ---------------------------------------------------------------------------
// Weapon stat table by weapon type — verbatim from constellations.test.ts
// ---------------------------------------------------------------------------

const WEAPON_TABLE_BY_TYPE: Readonly<Record<string, readonly StatTableEntry[]>> = {
  sword: alleyFlashStatTable,
  claymore: theBellStatTable,
  polearm: blackcliffPoleStatTable,
  bow: alleyHunterStatTable,
  catalyst: solarPearlStatTable,
};

// ---------------------------------------------------------------------------
// Weapon registry — keyed by the weapon's `name` field (strips "weapon_name." prefix)
//
// The manifests carry weapon names as "weapon_name.<name>"; the DbObjectWeapon
// `name` field is exactly "<name>". Strip the prefix to resolve the object.
// Only the 5 default weapons appear across all three manifests.
// ---------------------------------------------------------------------------

const WEAPON_BY_NAME: Readonly<Record<string, DbObjectWeapon>> = {
  the_alley_flash: theAlleyFlash,
  solar_pearl: solarPearl,
  blackcliff_pole: blackcliffPole,
  alley_hunter: alleyHunter,
  the_bell: theBell,
};

function weaponNameFromManifest(manifestName: string): string {
  // "weapon_name.the_alley_flash" → "the_alley_flash"
  return manifestName.startsWith("weapon_name.")
    ? manifestName.slice("weapon_name.".length)
    : manifestName;
}

// ---------------------------------------------------------------------------
// Auto-discover artifact sets — same glob as artifactSets.test.ts
// ---------------------------------------------------------------------------

const SET_MODULES = import.meta.glob("../artifacts/sets/*.ts", { eager: true });

const SET_REGISTRY: Readonly<Record<string, DbObjectArtifactSet>> = Object.fromEntries(
  Object.entries(SET_MODULES)
    .filter(([path]) => !path.endsWith("/index.ts"))
    .flatMap(([, mod]) =>
      Object.values(mod)
        .filter(isDbObjectArtifactSet)
        .map((s) => [s.goodId, s] as [string, DbObjectArtifactSet])
    )
);

// ---------------------------------------------------------------------------
// statBlock resolver — "sampleStats" → SAMPLE_BLOCK, "high-atk-hp" → HIGH_ATK_HP_BLOCK
// ---------------------------------------------------------------------------

function resolveStatBlock(key: string): Readonly<Record<string, number>> {
  if (key === "sampleStats") return SAMPLE_BLOCK;
  if (key === "high-atk-hp") return HIGH_ATK_HP_BLOCK;
  throw new Error(`Unknown statBlock key "${key}" — only "sampleStats" and "high-atk-hp" are valid`);
}

// ---------------------------------------------------------------------------
// Settings builder for a manifest entry
//
// Merges: charToggles + setToggles + passiveToggles + char_constellation + weapon_refine.
// Booleans go in as `true`; numeric stacks go in as the number — EvalContext is
// Record<string, unknown>, so both pass through cleanly for the condition evaluator.
// ---------------------------------------------------------------------------

function buildEntrySettings(entry: ManifestEntry): EvalContext {
  return reconstructSettings({
    charToggles: entry.charToggles,
    setToggles: entry.setToggles,
    passiveToggles: entry.weapon.passiveToggles,
    constellation: entry.char.constellation,
    refine: entry.weapon.refine,
  });
}

// ---------------------------------------------------------------------------
// Families
// ---------------------------------------------------------------------------

const FAMILIES = ["toggles", "cons-mid", "full-build"] as const;
type Family = typeof FAMILIES[number];

// ---------------------------------------------------------------------------
// Harness — for each family, for each manifest entry, run the full assertion suite
// ---------------------------------------------------------------------------

for (const family of FAMILIES) {
  const manifest = loadManifest(family);

  for (const entry of manifest.characters) {
    const { slug } = entry;

    describe(`${family}: ${slug}`, () => {
      const fixture = loadFixture(family, slug);

      // --- Resolve char ---
      const char = charBySlug[slug];
      if (!char) {
        throw new Error(`goldenConfig harness: character slug "${slug}" not in auto-discovered chars`);
      }

      // --- Resolve weapon ---
      const weaponKey = weaponNameFromManifest(entry.weapon.name);
      const weapon = WEAPON_BY_NAME[weaponKey];
      if (!weapon) {
        throw new Error(
          `goldenConfig harness: weapon "${weaponKey}" (from "${entry.weapon.name}") not in WEAPON_BY_NAME`
        );
      }
      const weaponStatTable = WEAPON_TABLE_BY_TYPE[char.weapon];
      if (!weaponStatTable) {
        throw new Error(
          `goldenConfig harness: no weapon stat table for type "${char.weapon}" (char: ${slug})`
        );
      }

      // --- Stat block ---
      const statBlock = resolveStatBlock(entry.statBlock);

      // --- Settings: merge all toggles + constellation + refine ---
      const inputSettings = buildEntrySettings(entry);

      // --- Weapon passive: ON when passiveToggles is non-empty ---
      const passiveOn = Object.keys(entry.weapon.passiveToggles).length > 0;

      // --- Reconstruct the port build via the shared helper (buildStats → compileCharacter).
      // Propagates condition .settings (C3/C5 talent bumps, infusions) + threads talent _bonus.
      const { context, compiled } = reconstructPort({
        char,
        weapon,
        weaponStatTable,
        statBlock,
        settings: inputSettings,
        passiveOn,
        artifactSets: entry.artifactSets,
        setRegistry: SET_REGISTRY,
        levels: LEVELS,
        talents: TALENTS,
        enemy: ENEMY,
      });

      // --- Key sets ---
      const allDamageKeys = Object.entries(fixture.features)
        .filter(([, e]) => isDamageTripleEntry(e))
        .map(([k]) => k);

      const producedKeys = Object.keys(compiled).filter((k) => k in fixture.features);
      const unmodelledKeys = allDamageKeys.filter((k) => !(k in compiled));
      const orphanKeys = Object.keys(compiled).filter((k) => !(k in fixture.features));

      // --- Per-feature triple assertions ---
      for (const key of producedKeys) {
        const oracle = fixture.features[key]!;
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

      // --- Mis-key guard: no produced key absent from fixture ---
      it(`${slug}: no produced key is absent from the fixture (mis-key guard)`, () => {
        expect(
          orphanKeys,
          `produced but absent from fixture (mis-keyed?): ${orphanKeys.join(", ")}`
        ).toEqual([]);
      });

      // --- Coverage gate: no unmodelled fixture damage feature ---
      it(`${slug}: full coverage — no unmodelled fixture damage feature`, () => {
        expect(
          unmodelledKeys,
          `${slug}: unmodelled fixture damage features: ${unmodelledKeys.join(", ")}`
        ).toEqual([]);
      });
    });
  }
}
