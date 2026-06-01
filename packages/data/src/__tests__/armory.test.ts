/**
 * P3.1b — Armory burndown harness (weapons + sets consumer gate).
 *
 * Consumes the four full-armory oracle fixture families produced by P3.1a:
 *
 *   weapons-r1 / weapons-r5 — EVERY non-beta weapon (202) at R1 / R5, passive ON,
 *                             on a scaling-relevant rep. Isolates each weapon's base
 *                             ATK + its OWN statTable + the refine-scaled passive.
 *   sets-2pc   / sets-4pc    — EVERY set (55) at 2pc / 4pc on a scaling-relevant rep,
 *                             default weapon (passive OFF) so the SET bonus is isolated.
 *
 * For each manifest item the harness either:
 *   - resolves the ported weapon/set and PROVES it matches the oracle (every produced
 *     damage feature's triple within abs 0.1, + the mis-key guard + the full-coverage
 *     gate), OR
 *   - fails with a precise "not yet ported — burndown" test (the ③ gate).
 *
 * THE SUITE IS INTENTIONALLY RED OVERALL. Most of the armory is unported (8 weapons +
 * 14 sets exist in TS), so every un-ported item emits exactly ONE failing burndown test.
 * That RED is the remaining-work signal — the content port (③) flips each test green
 * item-by-item, exactly as goldenConfig.test.ts drove Phase-2's Wave-2. The branch is
 * not merged until ③ reaches zero burndown.
 *
 * RED-NOT-ERROR (the one real deviation from artifactSets.test.ts, which *skips*
 * unported sets): an un-resolved item resolves to a FAILING `it`, never a thrown error
 * at glob/load time. A throw would abort the whole suite and make burndown impossible
 * (you cannot port 200 weapons before the test is allowed to load). Skipping would be a
 * silent cap — this harness must SURFACE the gap as RED.
 *
 * HONESTY RULES (verbatim from goldenConfig.test.ts):
 *   - NO it.skip, NO it.todo, NO loosened tolerance, NO hard-coded overrides.
 *   - A RED ported item means the engine doesn't yet match the oracle — that is a real
 *     signal worth investigating, not something to hide.
 *   - TEST-ONLY: no production code is touched.
 *
 * Manifest item shape (per item in `manifest.items`):
 *   { slug, kind: "weapon"|"set", repKey, repSlug,
 *     weapon: { name, type, refine, passiveToggles },
 *     artifactSets: { <goodId>: pieces }, setToggles, statBlock, enemy, featureCount }
 *   - WEAPON item: `slug` = weapon snake_case name (also the fixture filename);
 *     `weapon.name` = "weapon_name.<name>" (the DbObjectWeapon `name` is the bare suffix).
 *   - SET item: `slug` = set DISPLAY slug (the fixture filename, e.g. "CrimsonWitchOfFlames");
 *     the registry lookup key is `Object.keys(artifactSets)[0]` — Aspirine's oracle goodId
 *     (e.g. "CrimsonWitch"), which is exactly the DbObjectArtifactSet `goodId`.
 *
 * Sources:
 *   tests/golden/fixtures/{weapons-r1,weapons-r5,sets-2pc,sets-4pc}/_manifest.json
 *   tests/golden/fixtures/{weapons-r1,weapons-r5,sets-2pc,sets-4pc}/<slug>.json
 *   packages/data/src/__tests__/goldenConfig.test.ts    — weapon-path template
 *   packages/data/src/__tests__/artifactSets.test.ts     — set-registry + setBonuses template
 */

import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";
import { describe, it, expect } from "vitest";
import { buildStats } from "../buildStats.js";
import { compileCharacter } from "../loader.js";
import type {
  DbObjectArtifactSet,
  DbObjectChar,
  DbObjectWeapon,
  EvalContext,
} from "@genshin/types";

// ---------------------------------------------------------------------------
// Constants — mirror goldenConfig.test.ts / artifactSets.test.ts
// ---------------------------------------------------------------------------

const LEVELS = {
  charLevel: 90,
  ascension: 6,
  weaponLevel: 90,
  weaponAscension: 6,
} as const;

const ENEMY = { level: 90, resistance: 10 } as const;

const TALENTS = { attack: 10, elemental: 10, burst: 10 } as const;

const TOLERANCE = 0.1;

// ---------------------------------------------------------------------------
// Fixture types — verbatim from artifactSets.test.ts (carries isReacted/format)
// ---------------------------------------------------------------------------

interface FixtureEntry {
  readonly category: string;
  readonly damageType: string | undefined;
  readonly normal: number;
  readonly crit: number;
  readonly average: number;
  readonly isReacted: boolean;
  readonly format: string;
}

interface Fixture {
  readonly features: Record<string, FixtureEntry>;
}

/** Damage-triple predicate — verbatim from the templates. */
function isDamageTripleEntry(entry: FixtureEntry): boolean {
  if (entry.category === "stats") return false;
  if (!entry.damageType) return false;
  return true;
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
// Manifest types — the P3.1a item shape (array is `items`, not `characters`)
// ---------------------------------------------------------------------------

interface ManifestWeapon {
  /** "weapon_name.<name>" — the DbObjectWeapon `name` is the bare "<name>". */
  readonly name: string;
  readonly type: string;
  readonly refine: number;
  /** Passive toggle(s) ON (refine-scaled passives still apply via weapon.conditions). */
  readonly passiveToggles: EvalContext;
}

interface ManifestEnemy {
  readonly level: number;
  readonly res: number;
}

interface ManifestItem {
  readonly slug: string;
  readonly kind: "weapon" | "set";
  readonly repKey: string;
  readonly repSlug: string;
  readonly weapon: ManifestWeapon;
  /** Set items: { <goodId>: pieces }. Weapon items: {}. */
  readonly artifactSets: Record<string, number>;
  readonly setToggles: EvalContext;
  readonly statBlock: string;
  // `enemy` / `featureCount` mirror the JSON; the harness uses the shared ENEMY constant
  // (all families share 90/10) and derives coverage from the fixture, so they document
  // the full shape without being consumed.
  readonly enemy: ManifestEnemy;
  readonly featureCount: number;
}

interface Manifest {
  readonly config: { readonly id: string };
  readonly base: {
    readonly statBlock: Readonly<Record<string, number>>;
  };
  readonly items: readonly ManifestItem[];
}

function loadManifest(family: string): Manifest {
  return JSON.parse(
    readFileSync(join(FIXTURES_ROOT, family, "_manifest.json"), "utf-8")
  ) as Manifest;
}

// ---------------------------------------------------------------------------
// ImportMeta declaration for import.meta.glob — verbatim from the templates
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
// Slug + shape helpers — verbatim from the templates
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

function isDbObjectWeapon(value: unknown): value is DbObjectWeapon {
  return (
    typeof value === "object" &&
    value !== null &&
    "name" in value &&
    "weapon" in value &&
    "statTable" in value &&
    !("element" in value) // distinguish from DbObjectChar (also has `weapon`)
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
// Auto-discover characters — same glob as the templates (107 reps)
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
// Auto-discover ported weapons — glob over weapons/*.ts, key by the `name` field.
//
// A ported weapon validates against its OWN base ATK + statTable, so the registry
// resolves the weapon object (carrying `.statTable` and `.conditions`) — NOT a
// type-default table. Dropping a new weapons/<slug>.ts auto-includes it next run.
// ---------------------------------------------------------------------------

const WEAPON_MODULES = import.meta.glob("../weapons/*.ts", { eager: true });

const weaponByName: Readonly<Record<string, DbObjectWeapon>> = Object.fromEntries(
  Object.entries(WEAPON_MODULES)
    .filter(([path]) => !path.endsWith("/index.ts"))
    .flatMap(([, mod]) =>
      Object.values(mod)
        .filter(isDbObjectWeapon)
        .map((w) => [w.name, w] as [string, DbObjectWeapon])
    )
);

/** "weapon_name.the_bell" → "the_bell" (the DbObjectWeapon `name`). */
function weaponNameFromManifest(manifestName: string): string {
  return manifestName.startsWith("weapon_name.")
    ? manifestName.slice("weapon_name.".length)
    : manifestName;
}

// ---------------------------------------------------------------------------
// Auto-discover ported artifact sets — glob over artifacts/sets/*.ts, key by goodId.
// Same registry the artifactSets.test.ts harness builds + injects via the DI seam.
// ---------------------------------------------------------------------------

const SET_MODULES = import.meta.glob("../artifacts/sets/*.ts", { eager: true });

const setByGoodId: Readonly<Record<string, DbObjectArtifactSet>> = Object.fromEntries(
  Object.entries(SET_MODULES)
    .filter(([path]) => !path.endsWith("/index.ts"))
    .flatMap(([, mod]) =>
      Object.values(mod)
        .filter(isDbObjectArtifactSet)
        .map((s) => [s.goodId, s] as [string, DbObjectArtifactSet])
    )
);

// ---------------------------------------------------------------------------
// statBlock resolver — every armory family uses "sampleStats".
// The canonical sample block is carried verbatim in the manifest `base.statBlock`.
// ---------------------------------------------------------------------------

function resolveStatBlock(
  manifest: Manifest,
  key: string
): Readonly<Record<string, number>> {
  if (key === "sampleStats") return manifest.base.statBlock;
  throw new Error(
    `armory harness: unknown statBlock key "${key}" — only "sampleStats" is used by the armory families`
  );
}

// ---------------------------------------------------------------------------
// Shared assertion block — register the per-feature triple + mis-key + coverage
// tests for a built+compiled item against its fixture. Verbatim structure from
// goldenConfig.test.ts / artifactSets.test.ts.
// ---------------------------------------------------------------------------

function assertItemAgainstFixture(
  slug: string,
  fixture: Fixture,
  context: ReturnType<typeof buildStats>["context"],
  compiled: Readonly<Record<string, (ctx: typeof context) => { normal: number; crit: number; avg: number }>>
): void {
  const allDamageKeys = Object.entries(fixture.features)
    .filter(([, e]) => isDamageTripleEntry(e))
    .map(([k]) => k);

  const producedKeys = Object.keys(compiled).filter((k) => k in fixture.features);
  const unmodelledKeys = allDamageKeys.filter((k) => !(k in compiled));
  const orphanKeys = Object.keys(compiled).filter((k) => !(k in fixture.features));

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

  // Mis-key guard: no produced key absent from the fixture.
  it(`${slug}: no produced key is absent from the fixture (mis-key guard)`, () => {
    expect(
      orphanKeys,
      `produced but absent from fixture (mis-keyed?): ${orphanKeys.join(", ")}`
    ).toEqual([]);
  });

  // Full-coverage gate: no unmodelled fixture damage feature.
  it(`${slug}: full coverage — no unmodelled fixture damage feature`, () => {
    expect(
      unmodelledKeys,
      `${slug}: unmodelled fixture damage features: ${unmodelledKeys.join(", ")}`
    ).toEqual([]);
  });
}

// ---------------------------------------------------------------------------
// Burndown bookkeeping — counts reported once at the end (legible burndown).
// ---------------------------------------------------------------------------

const weaponPorted = new Set<string>();
const weaponUnported = new Set<string>();
const setPorted = new Set<string>();
const setUnported = new Set<string>();

// ===========================================================================
// WEAPON PATH — weapons-r1 / weapons-r5
// ===========================================================================

const WEAPON_FAMILIES = ["weapons-r1", "weapons-r5"] as const;

for (const family of WEAPON_FAMILIES) {
  const manifest = loadManifest(family);

  for (const item of manifest.items) {
    const { slug } = item;
    const weaponKey = weaponNameFromManifest(item.weapon.name);
    const weapon = weaponByName[weaponKey];

    // RED-NOT-ERROR: an un-ported weapon resolves to a FAILING burndown test, never a
    // thrown error at glob/load time (a throw would abort the whole suite and make the
    // burndown impossible). One clear RED per un-ported item == the remaining-work signal.
    if (weapon === undefined) {
      weaponUnported.add(weaponKey);
      describe(`${family}: ${slug}`, () => {
        it(`${slug}: not yet ported — burndown`, () => {
          expect.fail(
            `weapon "${weaponKey}" not yet ported (no packages/data/src/weapons/*.ts ` +
            `exports a DbObjectWeapon named "${weaponKey}"). Port it to flip this test green (③).`
          );
        });
      });
      continue;
    }
    weaponPorted.add(weaponKey);

    // The rep MUST be a ported character (all 107 reps exist) — a missing rep is a
    // manifest/data error, not a burndown item, so throw loudly.
    const rep = charBySlug[item.repSlug];
    if (!rep) {
      throw new Error(
        `armory harness: weapon "${slug}" rep slug "${item.repSlug}" not in auto-discovered chars`
      );
    }

    describe(`${family}: ${slug}`, () => {
      const fixture = loadFixture(family, slug);
      const statBlock = resolveStatBlock(manifest, item.statBlock);

      const { context, settings } = buildStats({
        char: rep,
        // A weapon validates against its OWN base ATK + statTable.
        weaponStatTable: weapon.statTable,
        statBlock,
        levels: LEVELS,
        enemy: ENEMY,
        // Weapon passive channel: conditions in via extraConditions; toggle(s) + refine
        // via settings. R1 vs R5 differ ONLY by weapon_refine (the refine-scaled passive).
        settings: {
          ...item.weapon.passiveToggles,
          weapon_refine: item.weapon.refine,
          char_constellation: 0,
        },
        extraConditions: weapon.conditions ?? [],
        talentLevels: TALENTS,
      });

      const compiled = compileCharacter(rep, {
        charElement: rep.element,
        talentLevels: TALENTS,
        settings,
        charLevel: LEVELS.charLevel,
      });

      assertItemAgainstFixture(slug, fixture, context, compiled);
    });
  }
}

// ===========================================================================
// SET PATH — sets-2pc / sets-4pc
// ===========================================================================

const SET_FAMILIES = ["sets-2pc", "sets-4pc"] as const;

for (const family of SET_FAMILIES) {
  const manifest = loadManifest(family);

  for (const item of manifest.items) {
    const { slug } = item;
    // Registry lookup key is the oracle goodId (the artifactSets KEY), NOT the slug.
    const goodId = Object.keys(item.artifactSets)[0]!;
    const pieces = item.artifactSets[goodId]!;
    const set = setByGoodId[goodId];

    // RED-NOT-ERROR (the one real deviation from artifactSets.test.ts, which SKIPS
    // unported sets): an un-ported set resolves to a FAILING burndown test, not a skip.
    // Skipping would be a silent cap; this harness must SURFACE the gap as RED so the
    // burndown count is the remaining-work signal.
    if (set === undefined) {
      setUnported.add(goodId);
      describe(`${family}: ${slug} (${goodId})`, () => {
        it(`${slug}: not yet ported — burndown`, () => {
          expect.fail(
            `set "${goodId}" not yet ported (no packages/data/src/artifacts/sets/*.ts ` +
            `exports a DbObjectArtifactSet with goodId "${goodId}"). Port it to flip this test green (③).`
          );
        });
      });
      continue;
    }
    setPorted.add(goodId);

    const rep = charBySlug[item.repSlug];
    if (!rep) {
      throw new Error(
        `armory harness: set "${slug}" rep slug "${item.repSlug}" not in auto-discovered chars`
      );
    }
    // The set families isolate the SET bonus: the rep keeps a DEFAULT weapon with its
    // passive OFF. The manifest names that exact weapon (one of the 5 P2 defaults), so
    // resolve its OWN statTable — deterministic and identical to the oracle's base ATK.
    // (Take ONLY .statTable; the weapon's conditions/toggles are deliberately omitted.)
    const defaultWeaponKey = weaponNameFromManifest(item.weapon.name);
    const defaultWeapon = weaponByName[defaultWeaponKey];
    if (!defaultWeapon) {
      throw new Error(
        `armory harness: set "${slug}" default weapon "${defaultWeaponKey}" not in ported weapons ` +
        `(set families require their default weapon ported for the base-ATK table)`
      );
    }
    const weaponStatTable = defaultWeapon.statTable;

    describe(`${family}: ${slug} (${goodId})`, () => {
      const fixture = loadFixture(family, slug);
      const statBlock = resolveStatBlock(manifest, item.statBlock);
      // Set families isolate the SET bonus: rep keeps its default weapon, passive OFF.
      const settings: EvalContext = { ...item.setToggles, char_constellation: 0 };

      const { context, settings: propagated } = buildStats({
        char: rep,
        weaponStatTable,
        statBlock,
        levels: LEVELS,
        enemy: ENEMY,
        settings,
        setBonuses: [{ setKey: goodId, pieces }],
        setRegistry: setByGoodId,
        talentLevels: TALENTS,
      });

      const compiled = compileCharacter(rep, {
        charElement: rep.element,
        talentLevels: TALENTS,
        settings: propagated,
        charLevel: LEVELS.charLevel,
      });

      assertItemAgainstFixture(slug, fixture, context, compiled);
    });
  }
}

// ===========================================================================
// Burndown summary — report once (the burndown is legible).
// ===========================================================================

describe("armory: burndown summary", () => {
  it("reports ported vs total counts (the ③ remaining-work signal)", () => {
    const weaponRegistry = readdirSync(
      join(dirname(fileURLToPath(import.meta.url)), "../weapons")
    ).filter((f) => f.endsWith(".ts") && f !== "index.ts").length;
    const setRegistry = readdirSync(
      join(dirname(fileURLToPath(import.meta.url)), "../artifacts/sets")
    ).filter((f) => f.endsWith(".ts") && f !== "index.ts").length;

    console.info(
      `[armory] weapons ${weaponPorted.size}/${weaponPorted.size + weaponUnported.size} ported ` +
      `(${weaponRegistry} TS files); sets ${setPorted.size}/${setPorted.size + setUnported.size} ported ` +
      `(${setRegistry} TS files)`
    );
    expect(weaponPorted.size + weaponUnported.size).toBeGreaterThan(0);
  });
});
