/**
 * P2.A1 — artifact-set golden auto-discovery harness.
 *
 * Three layers:
 *
 * 1. AUTO-DISCOVERY fixture harness — driven by two manifests:
 *      tests/golden/fixtures/set-4pc/_manifest.json   (15 entries)
 *      tests/golden/fixtures/set-2pc/_manifest.json    (5 entries)
 *    For each entry the harness:
 *      (a) looks up the set by oracleKey in a glob-built SET_REGISTRY
 *          (goodId → DbObjectArtifactSet; each goodId is Aspirine's oracle art.set
 *          key per Deliverable 1 of P2.A1);
 *      (b) if the set is NOT in SET_REGISTRY → skip and report (allows future
 *          parallel-agent drops to auto-activate without editing this file);
 *      (c) if the slug is in FEATURE_VALIDATION_SKIP → skip the feature-level
 *          assert (Raiden/Emblem is covered by the dedicated stat-bag block below);
 *      (d) otherwise: builds + compiles and asserts every produced damage feature
 *          vs the fixture within abs tol 0.1, with mis-key guard + coverage gate —
 *          verbatim structure from golden.test.ts.
 *    The SET_REGISTRY is injected via the `setRegistry` DI seam (BuildInput field
 *    added in P2.A1 Deliverable 2) so a set validates without a barrel edit.
 *
 * 2. PRESERVED GATE UNIT TESTS — piece-count gating through buildStats:
 *      piece-count gate (CrimsonWitch dmg_pyro)
 *      piece-count gate (Noblesse 4pc ATK)
 *    These exercise the barrel path + gating edge cases (not covered by auto-discovery).
 *
 * 3. PRESERVED STAT-BAG BLOCK — RaidenShogun set-2pc/4pc (EmblemofSeveredFate):
 *    Validates Emblem at the stat-bag level (recharge + dmg_burst) rather than
 *    asserting Raiden's burst damage against the fixture. Raiden's A4 passive folds
 *    dmg_electro: 52.8 as a CONSTANT calibrated at base ER=232 (no Emblem). When
 *    Emblem 2pc adds +20 ER → 252, the A4 electro contribution should update, but
 *    the current raiden_shogun.ts carries it as a fixed constant — a separate tracked
 *    defect in the Raiden character file, NOT an Emblem defect. The stat-bag assertions
 *    prove the SET is correct (recharge and dmg_burst accumulate as expected) without
 *    the Raiden A4 confound. raiden_shogun is therefore in FEATURE_VALIDATION_SKIP.
 *
 * 4. NO-SET NO-OP — the set path is inert without sets.
 *
 * AUTO-DISCOVERY CONTRACT:
 *   Dropping a new `packages/data/src/artifacts/sets/<slug>.ts` whose `goodId`
 *   matches an unported manifest key will cause it to be automatically validated
 *   the next time the suite runs — no edit to this file or index.ts required.
 *   The readdirSync guard (describe "artifact-sets: auto-discovery") catches any
 *   glob under-matching.
 *
 * Sources:
 *   tests/golden/fixtures/set-{2pc,4pc}/_manifest.json  — oracle manifests
 *   tests/golden/fixtures/set-{2pc,4pc}/<slug>.json      — oracle fixtures
 *   tools/oracle/build-configs.mjs (equipSet / settings each fixture uses)
 *   packages/data/src/__tests__/golden.test.ts            — primary template (mirrored)
 *   packages/data/src/__tests__/weaponPassive.test.ts     — secondary template (manifest read)
 */

import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";
import { describe, it, expect } from "vitest";
import { buildStats, type EquippedSet } from "../buildStats.js";
import { compileCharacter } from "../loader.js";
import { bennett } from "../characters/bennett.js";
import { diluc } from "../characters/diluc.js";
import { raidenShogun } from "../characters/raiden_shogun.js";
import {
  alleyFlashStatTable,
  alleyHunterStatTable,
  blackcliffPoleStatTable,
  theBellStatTable,
  solarPearlStatTable,
} from "../generated/weaponStatTables.js";
import type { DbObjectArtifactSet, DbObjectChar, EvalContext, StatTableEntry } from "@genshin/types";

// ---------------------------------------------------------------------------
// FIXED canonical build (verbatim from golden.test.ts / _manifest.json)
// ---------------------------------------------------------------------------

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

const LEVELS = { charLevel: 90, ascension: 6, weaponLevel: 90, weaponAscension: 6 } as const;
const ENEMY = { level: 90, resistance: 10 } as const;
const TALENTS = { attack: 10, elemental: 10, burst: 10 } as const;

/**
 * Absolute tolerance: abs(ours - oracle) <= TOLERANCE for each triple value.
 * Matches golden.test.ts (tightened to 0.1 in P1.9-complete).
 */
const TOLERANCE = 0.1;

// ---------------------------------------------------------------------------
// Fixture types (verbatim from golden.test.ts)
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

// ---------------------------------------------------------------------------
// Fixture loader
// ---------------------------------------------------------------------------

const FIXTURES_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../tests/golden/fixtures"
);

function loadFixture(subDir: string, slug: string): Fixture {
  const raw = readFileSync(join(FIXTURES_DIR, subDir, `${slug}.json`), "utf-8");
  return JSON.parse(raw) as Fixture;
}

// ---------------------------------------------------------------------------
// Damage-triple filter (verbatim from golden.test.ts)
// ---------------------------------------------------------------------------

/**
 * Returns true if a fixture entry should be asserted as a damage triple.
 * Filters out category "stats" and display-only entries with no damageType.
 */
function isDamageTripleEntry(entry: FixtureEntry): boolean {
  if (entry.category === "stats") return false;
  if (!entry.damageType) return false;
  return true;
}

// ---------------------------------------------------------------------------
// Minimal ImportMeta declaration for import.meta.glob (verbatim from golden.test.ts)
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
// Slug helpers (verbatim from golden.test.ts)
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
// Weapon stat table by weapon type (verbatim from golden.test.ts)
// ---------------------------------------------------------------------------

const WEAPON_TABLE_BY_TYPE: Readonly<Record<string, readonly StatTableEntry[]>> = {
  sword:    alleyFlashStatTable,
  claymore: theBellStatTable,
  polearm:  blackcliffPoleStatTable,
  bow:      alleyHunterStatTable,
  catalyst: solarPearlStatTable,
};

// ---------------------------------------------------------------------------
// Auto-discover all ported artifact sets via import.meta.glob
//
// Each set file exports exactly one DbObjectArtifactSet (detected by shape:
// has `goodId` + `bonus`). We build SET_REGISTRY keyed by `goodId` (which
// equals the oracle manifest's `artifactSets` key after Deliverable 1's
// goodId standardization).
//
// This registry is injected into buildStats via the `setRegistry` DI seam
// (Deliverable 2) so a set validates without a barrel edit. The glob
// auto-discovers every file in the directory — parallel agents drop a new
// file and it is automatically included in the next test run.
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
// Auto-discover all character modules (verbatim from golden.test.ts)
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
// Auto-discovery guard (mirrors golden.test.ts)
//
// Belt-and-suspenders: the glob must match EVERY *.ts file in artifacts/sets/
// (excluding index.ts). If import.meta.glob ever under-matches, this fails
// loudly rather than silently leaving a set untested.
// ---------------------------------------------------------------------------

describe("artifact-sets: auto-discovery", () => {
  it("glob discovers every set file in artifacts/sets/ (excluding index.ts)", () => {
    const setsDir = join(dirname(fileURLToPath(import.meta.url)), "../artifacts/sets");
    const fileCount = readdirSync(setsDir).filter(
      (f) => f.endsWith(".ts") && f !== "index.ts"
    ).length;
    expect(Object.keys(SET_REGISTRY).length).toBe(fileCount);
    expect(Object.keys(SET_REGISTRY).length).toBeGreaterThan(0);
  });

  it("all 7 currently-ported sets are present in SET_REGISTRY", () => {
    // Hard gate: a regression that drops a port (e.g. via goodId rename) fails here.
    // DATA-DRIVEN: the expected keys are the 7 oracle goodIds that have ported files.
    const expectedKeys = [
      "CrimsonWitch",
      "DeepwoodMemories",
      "EmblemofSeveredFate",
      "GoldenTroupe",
      "HeartofDepth",
      "MarechausseeHunter",
      "NoblesseOblige",
    ] as const;
    for (const key of expectedKeys) {
      expect(SET_REGISTRY[key], `SET_REGISTRY is missing ported set: ${key}`).toBeDefined();
    }
  });
});

// ---------------------------------------------------------------------------
// Manifest types
// ---------------------------------------------------------------------------

interface ManifestCharEntry {
  readonly slug: string;
  /** One oracle key → piece count (e.g. { "NoblesseOblige": 4 }). */
  readonly artifactSets: Record<string, number>;
  readonly setToggles: EvalContext;
  readonly charToggles: EvalContext;
}

interface Manifest {
  readonly config: { readonly id: string };
  readonly characters: readonly ManifestCharEntry[];
}

// ---------------------------------------------------------------------------
// Slugs whose fixture-level feature assertions are deferred to the dedicated
// stat-bag block below. These characters are NOT skipped entirely — their set
// is still proven correct, just via stat-bag assertions instead of per-feature
// oracle comparisons.
//
// raiden_shogun: Emblem's ER→Burst-DMG postEffect is proven correct by the
//   RaidenShogun stat-bag block. Raiden's A4 folds dmg_electro:52.8 as a
//   constant calibrated at base ER=232 (no Emblem); adding 20 ER from the 2pc
//   desynchronises the oracle feature triple — a tracked Raiden defect, NOT an
//   Emblem defect. Asserting features here would produce false FAIL signals.
// ---------------------------------------------------------------------------

const FEATURE_VALIDATION_SKIP = new Set(["raiden_shogun"]);

// ---------------------------------------------------------------------------
// Auto-discovery harness: iterate both manifests, skip unported + skipped slugs
// ---------------------------------------------------------------------------

const MANIFEST_IDS = ["set-4pc", "set-2pc"] as const;

/** Load + parse a config's oracle manifest once; shared by the harness + coverage report. */
function loadManifest(configId: string): Manifest {
  return JSON.parse(
    readFileSync(join(FIXTURES_DIR, configId, "_manifest.json"), "utf-8")
  ) as Manifest;
}

const MANIFESTS: ReadonlyArray<{ readonly configId: string; readonly manifest: Manifest }> =
  MANIFEST_IDS.map((configId) => ({ configId, manifest: loadManifest(configId) }));

const unported: Array<{ configId: string; slug: string; oracleKey: string }> = [];

for (const { configId, manifest } of MANIFESTS) {
  for (const entry of manifest.characters) {
    const { slug } = entry;
    const oracleKey = Object.keys(entry.artifactSets)[0]!;
    const pieces = entry.artifactSets[oracleKey]!;
    const settings: EvalContext = { ...entry.charToggles, ...entry.setToggles };

    const set = SET_REGISTRY[oracleKey];
    if (set === undefined) {
      // Not yet ported — record and skip. When a new set file whose goodId matches
      // oracleKey is dropped in artifacts/sets/, this branch disappears automatically.
      unported.push({ configId, slug, oracleKey });
      continue;
    }

    if (FEATURE_VALIDATION_SKIP.has(slug)) {
      // Stat-bag validation only (dedicated block below). Skip feature-level assert.
      continue;
    }

    const char = charBySlug[slug];
    if (!char) {
      throw new Error(`artifact-sets harness: character slug "${slug}" not found in auto-discovered chars`);
    }
    const weaponStatTable = WEAPON_TABLE_BY_TYPE[char.weapon];
    if (!weaponStatTable) {
      throw new Error(`artifact-sets harness: no weapon table for type "${char.weapon}" (char: ${slug})`);
    }

    // The loop's `const` bindings are per-iteration (a fresh binding each pass), so
    // the describe callback closes over them directly — same pattern as golden.test.ts.
    describe(`${configId}/${slug} (${oracleKey})`, () => {
      const fixture = loadFixture(configId, slug);

      const { context } = buildStats({
        char,
        weaponStatTable,
        statBlock: STAT_BLOCK,
        levels: LEVELS,
        enemy: ENEMY,
        settings,
        // setKey === oracleKey: SET_REGISTRY is keyed by goodId, standardized to the manifest key.
        setBonuses: [{ setKey: oracleKey, pieces }],
        setRegistry: SET_REGISTRY,
      });

      const compiled = compileCharacter(char, {
        charElement: char.element,
        talentLevels: TALENTS,
        settings,
        charLevel: LEVELS.charLevel,
      });

      const allDamageKeys = Object.entries(fixture.features)
        .filter(([, e]) => isDamageTripleEntry(e))
        .map(([key]) => key);

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

      // --- Mis-key guard ---
      it(`${slug}: no produced key is absent from the fixture (mis-key guard)`, () => {
        expect(
          orphanKeys,
          `produced but absent from fixture (mis-keyed?): ${orphanKeys.join(", ")}`
        ).toEqual([]);
      });

      // --- Full-coverage gate ---
      it(`${slug}: full coverage — no unmodelled fixture damage feature`, () => {
        const total = allDamageKeys.length;
        const modelled = producedKeys.filter((k) => {
          const oracle = fixture.features[k];
          return oracle !== undefined && isDamageTripleEntry(oracle);
        }).length;
        console.info(
          `[artifact-sets] ${configId}/${slug} (${oracleKey}): ` +
          `${modelled}/${total} fixture damage features modelled`
        );
        expect(
          unmodelledKeys,
          `${slug}: unmodelled fixture damage features: ${unmodelledKeys.join(", ")}`
        ).toEqual([]);
      });
    });
  }
}

// Coverage report (fires once after all describe blocks are registered)
describe("artifact-sets: coverage report", () => {
  it("reports ported vs unported manifest entries", () => {
    const totalManifestEntries = MANIFESTS.reduce(
      (acc, { manifest }) => acc + manifest.characters.length,
      0
    );
    const portedCount = totalManifestEntries - unported.length;
    const unportedKeys = [...new Set(unported.map((u) => u.oracleKey))];
    console.info(
      `[artifact-sets] ${portedCount}/${totalManifestEntries} manifest entries covered; ` +
      `unported set keys (${unportedKeys.length}): ${unportedKeys.sort().join(", ")}`
    );
    // This it() always passes — it is a reporting vehicle, not a gate.
    expect(portedCount).toBeGreaterThanOrEqual(0);
  });
});

// ---------------------------------------------------------------------------
// 1. Piece-count gate — unit behaviour through buildStats (preserved from P2.A0)
// ---------------------------------------------------------------------------

describe("piece-count gate (CrimsonWitch dmg_pyro)", () => {
  // Diluc's skill is pyro; the emitted `dmg_pyro` fraction shows exactly the set's
  // pyro DMG contribution (base build supplies NO dmg_pyro), so the bag reads cleanly.
  function pyroBonus(setBonuses: readonly EquippedSet[], settings: EvalContext): number {
    const { stats } = buildStats({
      char: diluc,
      weaponStatTable: theBellStatTable,
      statBlock: STAT_BLOCK,
      levels: LEVELS,
      enemy: ENEMY,
      settings,
      setBonuses,
    });
    return stats["dmg_pyro"] ?? 0;
  }

  it("< 2 pieces → no bonus tier applies (set is a no-op)", () => {
    expect(pyroBonus([{ setKey: "CrimsonWitch", pieces: 1 }], {})).toBe(0);
  });

  it("2 pieces → only the 2pc tier (+15% pyro)", () => {
    // 2pc dmg_pyro:15 → emitted fraction 0.15. The 4pc tier (stacks + reaction) is gated OUT.
    expect(pyroBonus([{ setKey: "CrimsonWitch", pieces: 2 }], {})).toBeCloseTo(0.15, 10);
  });

  it("4 pieces, stacks toggle OFF → 2pc only (4pc stacks need their own gate)", () => {
    // Piece-count gate lets the 4pc tier IN, but the stacks condition's own gate
    // (set.crimson_witch_of_flames_4 > 0) is false → contributes nothing. Proves the
    // two gates are distinct: pieces>=4 alone does not fire the conditional 4pc stacks.
    expect(pyroBonus([{ setKey: "CrimsonWitch", pieces: 4 }], {})).toBeCloseTo(0.15, 10);
  });

  it("4 pieces, 3 stacks → 2pc + 3×7.5% (+37.5% pyro) — stacks scale via getStackCount", () => {
    expect(
      pyroBonus([{ setKey: "CrimsonWitch", pieces: 4 }], { "set.crimson_witch_of_flames_4": 3 })
    ).toBeCloseTo(0.375, 10);
  });

  it("4 pieces, 1 stack → 2pc + 1×7.5% (+22.5% pyro) — partial stack count", () => {
    expect(
      pyroBonus([{ setKey: "CrimsonWitch", pieces: 4 }], { "set.crimson_witch_of_flames_4": 1 })
    ).toBeCloseTo(0.225, 10);
  });

  it("stacks clamp at maxStacks (5 requested → 3 applied → +37.5%)", () => {
    expect(
      pyroBonus([{ setKey: "CrimsonWitch", pieces: 4 }], { "set.crimson_witch_of_flames_4": 5 })
    ).toBeCloseTo(0.375, 10);
  });

  it("unknown set key → no-op (set not yet ported)", () => {
    expect(pyroBonus([{ setKey: "NotAPortedSet", pieces: 4 }], {})).toBe(0);
  });
});

describe("piece-count gate (Noblesse 4pc ATK needs pieces>=4 AND toggle)", () => {
  function atkTotal(setBonuses: readonly EquippedSet[], settings: EvalContext): number {
    const { stats } = buildStats({
      char: bennett,
      weaponStatTable: alleyFlashStatTable,
      statBlock: STAT_BLOCK,
      levels: LEVELS,
      enemy: ENEMY,
      settings,
      setBonuses,
    });
    return stats["atk_total"]!;
  }

  const baseAtk = atkTotal([], {});

  it("2 pieces + toggle ON → no ATK buff (pieces-count gate fails at 2)", () => {
    expect(atkTotal([{ setKey: "NoblesseOblige", pieces: 2 }], { "set.noblesse_oblige_4": true })).toBeCloseTo(baseAtk, 6);
  });

  it("4 pieces, toggle OFF → no ATK buff (condition gate fails)", () => {
    expect(atkTotal([{ setKey: "NoblesseOblige", pieces: 4 }], {})).toBeCloseTo(baseAtk, 6);
  });

  it("4 pieces + toggle ON → +20% ATK (additive in the percent bucket: 1.38/1.18 over base)", () => {
    const buffed = atkTotal([{ setKey: "NoblesseOblige", pieces: 4 }], { "set.noblesse_oblige_4": true });
    expect(buffed / baseAtk).toBeCloseTo(1.38 / 1.18, 6);
  });

  // NOTE: the `set_other.noblesse_oblige_4` TEAMMATE path (a buff a teammate's
  // Noblesse grants when YOU wear no pieces) is intentionally OUT OF SCOPE for P2.A0.
  // `setBonuses` models the character's OWN equipped sets, so the buff condition only
  // enters the loop when the wearer has the 4pc. The teammate branch of the OR gate is
  // modelled (so the data is faithful) but only fires through self-equipment here; a
  // future party/buffs input (her global DbObjectBuff channel) would surface it
  // independent of self-equipment. No P2.0 fixture exercises the teammate path.
});

// ---------------------------------------------------------------------------
// 2. RaidenShogun set-2pc/4pc (EmblemofSeveredFate) — stat-bag validation
//    (preserved from P2.A0; governs the skip in FEATURE_VALIDATION_SKIP above)
// ---------------------------------------------------------------------------

describe("RaidenShogun set-2pc/4pc (EmblemofSeveredFate) — stat-bag validation", () => {
  // NOTE: We validate Emblem at the stat-bag level rather than asserting Raiden's burst
  // damage feature against the oracle fixture. Raiden's A4 passive folds
  // `dmg_electro: 52.8` as a CONSTANT calibrated at base ER=232 (no Emblem). When
  // Emblem 2pc adds +20 ER → 252, the A4 electro contribution should update, but the
  // current raiden_shogun.ts carries it as a fixed constant — that is a separate tracked
  // bug in the Raiden character file, NOT an Emblem bug. The stat-bag assertions below
  // prove the SET is correct (recharge and dmg_burst accumulate as expected) without the
  // Raiden A4 confound. A future fix to raiden_shogun.ts (making A4 ER-dynamic) should
  // upgrade this describe block to a full feature-level assertion against the fixture.

  function raidenStats(pieces: number): ReturnType<typeof buildStats>["stats"] {
    return buildStats({
      char: raidenShogun,
      weaponStatTable: blackcliffPoleStatTable,
      statBlock: STAT_BLOCK,
      levels: LEVELS,
      enemy: ENEMY,
      settings: {},
      setBonuses: [{ setKey: "EmblemofSeveredFate", pieces }],
    }).stats;
  }

  it("pieces=2: recharge_total reflects +20 ER vs base (252 vs 232)", () => {
    const stats2pc = raidenStats(2);
    const statsBase = buildStats({
      char: raidenShogun,
      weaponStatTable: blackcliffPoleStatTable,
      statBlock: STAT_BLOCK,
      levels: LEVELS,
      enemy: ENEMY,
      settings: {},
    }).stats;
    expect(stats2pc["recharge_total"]! - statsBase["recharge_total"]!).toBeCloseTo(20, 6);
  });

  it("pieces=2: dmg_burst has NO postEffect contribution (just STAT_BLOCK 64/100=0.64)", () => {
    const stats2pc = raidenStats(2);
    // STAT_BLOCK dmg_burst:64 → emitted as 0.64. The 4pc postEffect is gated out.
    expect(stats2pc["dmg_burst"]).toBeCloseTo(0.64, 6);
  });

  it("pieces=4: dmg_burst gains the ER→Burst-DMG postEffect (ER=252 → +63 raw → +0.63 fraction)", () => {
    const stats4pc = raidenStats(4);
    // min(0.25 × 252, 75) = 63 → 0.63 added on top of 0.64 → 1.27
    expect(stats4pc["dmg_burst"]).toBeCloseTo(1.27, 6);
  });

  it("pieces=4 minus pieces=2 dmg_burst ≈ min(0.25×recharge_total, 75)/100 within 1e-6", () => {
    const stats2pc = raidenStats(2);
    const stats4pc = raidenStats(4);
    const rechargeTotal = stats2pc["recharge_total"]!; // 252 at 2pc
    const expectedDelta = Math.min(0.25 * rechargeTotal, 75) / 100;
    const actualDelta = stats4pc["dmg_burst"]! - stats2pc["dmg_burst"]!;
    expect(Math.abs(actualDelta - expectedDelta)).toBeLessThanOrEqual(1e-6);
  });
});

// ---------------------------------------------------------------------------
// 3. No-set no-op — the set path is inert without sets (preserved from P2.A0)
// ---------------------------------------------------------------------------

describe("no-set no-op", () => {
  function dilucStats(setBonuses?: readonly EquippedSet[]) {
    return buildStats({
      char: diluc,
      weaponStatTable: theBellStatTable,
      statBlock: STAT_BLOCK,
      levels: LEVELS,
      enemy: ENEMY,
      settings: {},
      ...(setBonuses ? { setBonuses } : {}),
    }).stats;
  }

  it("omitting setBonuses == passing an empty array (byte-identical bag)", () => {
    expect(dilucStats(undefined)).toEqual(dilucStats([]));
  });

  it("no set contributes no dmg_pyro / no set_pieces leakage / unchanged ATK", () => {
    const stats = dilucStats(undefined);
    expect(stats["dmg_pyro"]).toBeUndefined();
    // no set_pieces.* key leaks into the engine-facing bag
    expect(Object.keys(stats).some((k) => k.startsWith("set_pieces."))).toBe(false);
  });

  it("Diluc base skill matches the un-set oracle base (no set drift)", () => {
    const setBonuses: EquippedSet[] = [];
    const settings: EvalContext = {};
    const { context } = buildStats({
      char: diluc,
      weaponStatTable: theBellStatTable,
      statBlock: STAT_BLOCK,
      levels: LEVELS,
      enemy: ENEMY,
      settings,
      setBonuses,
    });
    const compiled = compileCharacter(diluc, {
      charElement: diluc.element,
      talentLevels: TALENTS,
      settings,
      charLevel: LEVELS.charLevel,
    });
    const oracle = { normal: 2043.1133391384083, crit: 4086.2266782768165, average: 2639.702434166823 };
    const fn = compiled["skill.skill_hit_1"];
    expect(fn, "skill.skill_hit_1 not produced").toBeDefined();
    const r = fn!(context);
    expect(Math.abs(r.normal - oracle.normal)).toBeLessThanOrEqual(TOLERANCE);
    expect(Math.abs(r.crit - oracle.crit)).toBeLessThanOrEqual(TOLERANCE);
    expect(Math.abs(r.avg - oracle.average)).toBeLessThanOrEqual(TOLERANCE);
  });
});
