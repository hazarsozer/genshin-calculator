/**
 * P2.W1 — Weapon-passive + weapon-refine golden harness.
 *
 * Two sub-suites:
 *
 * 1. weapon-passive  (107 chars × R1 + passive-on)
 *    Each character is built with its type's default weapon passive toggled ON
 *    (max stacks for stack weapons) at R1. The oracle is
 *    tests/golden/fixtures/weapon-passive/<slug>.json.
 *
 * 2. weapon-refine  (10 reps × R5 + passive-on)
 *    A representative subset (one per weapon type × two) built at R5 to validate
 *    refine-scaling. Oracle: tests/golden/fixtures/weapon-refine/<slug>.json.
 *
 * TOLERANCE: 0.1 (abs) — mirrors golden.test.ts.
 *
 * HARNESS STRUCTURE mirrors golden.test.ts:
 * - Auto-discovers all 107 chars via import.meta.glob (parallel-merge-safe).
 * - Derives each char's weapon from `WEAPON_BY_TYPE[char.weapon]`.
 * - Asserts every PRODUCED damage feature vs fixture within tol 0.1.
 * - Mis-key guard: no produced key absent from the fixture.
 * - Coverage gate: no fixture damage feature left unmodelled.
 * - Auto-discovery cross-check (readdirSync) guards against glob under-matching.
 *
 * Sources:
 *   tests/golden/fixtures/weapon-passive/_manifest.json  — passive toggle values
 *   tests/golden/fixtures/weapon-refine/_manifest.json   — refine reps
 *   packages/data/src/weapons/*.ts                        — weapon module sources
 */

import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";
import { describe, it, expect } from "vitest";
import { buildStats } from "../buildStats.js";
import { compileCharacter } from "../loader.js";
import {
  theAlleyFlash,
  solarPearl,
  blackcliffPole,
  alleyHunter,
  theBell,
} from "../weapons/index.js";
import type { DbObjectChar, DbObjectWeapon } from "@genshin/types";
import type { StatTableEntry } from "@genshin/types";
import type { EvalContext } from "@genshin/types";
import { type FixtureEntry, isDamageTripleEntry } from "./_fixtureEntry.js";

// ---------------------------------------------------------------------------
// Fixed canonical build (verbatim from _manifest.json / characters.test.ts)
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
// Weapon-by-type map: default weapon + passive toggle settings
//
// Toggle values from weapon-passive/_manifest.json:
//   sword:    weapon_alley_flash = true   (AlleyFlash.js — boolean toggle)
//   catalyst: weapon_solar_pearl_1 = true, weapon_solar_pearl_2 = true (SolarPearl.js)
//   polearm:  weapon_blackcliff_pole = 3  (BlackcliffPole.js — max stacks 3)
//   bow:      weapon_alley_hunter = 10    (AlleyHunter.js — max stacks 10)
//   claymore: weapon_bell = true          (Bell.js — boolean toggle)
// ---------------------------------------------------------------------------

interface WeaponEntry {
  readonly weapon: DbObjectWeapon;
  readonly passive: EvalContext;
}

const WEAPON_BY_TYPE: Readonly<Record<string, WeaponEntry>> = {
  sword:    { weapon: theAlleyFlash,  passive: { weapon_alley_flash: true } },
  catalyst: { weapon: solarPearl,     passive: { weapon_solar_pearl_1: true, weapon_solar_pearl_2: true } },
  polearm:  { weapon: blackcliffPole, passive: { weapon_blackcliff_pole: 3 } },
  bow:      { weapon: alleyHunter,    passive: { weapon_alley_hunter: 10 } },
  claymore: { weapon: theBell,        passive: { weapon_bell: true } },
};

// ---------------------------------------------------------------------------
// Fixture types (mirrors golden.test.ts)
// ---------------------------------------------------------------------------

interface Fixture {
  readonly features: Record<string, FixtureEntry>;
}

// ---------------------------------------------------------------------------
// Fixture loader
// ---------------------------------------------------------------------------

const FIXTURES_BASE = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../tests/golden/fixtures"
);

function loadFixture(subDir: string, slug: string): Fixture {
  const raw = readFileSync(
    join(FIXTURES_BASE, subDir, `${slug}.json`),
    "utf-8"
  );
  return JSON.parse(raw) as Fixture;
}

// ---------------------------------------------------------------------------
// Minimal ImportMeta declaration for import.meta.glob (mirrors golden.test.ts)
// ---------------------------------------------------------------------------

declare global {
  interface ImportMeta {
    glob(
      pattern: string,
      options: { eager: true }
    ): Record<string, Record<string, unknown>>;
  }
}

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

// ---------------------------------------------------------------------------
// Auto-discover all 107 character modules (same glob as golden.test.ts)
// ---------------------------------------------------------------------------

interface Rep {
  readonly char: DbObjectChar;
  readonly weaponStatTable: readonly StatTableEntry[];
  readonly slug: string;
}

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
    const entry = WEAPON_BY_TYPE[char.weapon];
    if (!entry) {
      throw new Error(
        `characters/${slug}: no default weapon entry for weapon type "${char.weapon}"`
      );
    }
    return { char, weaponStatTable: entry.weapon.statTable, slug };
  })
  .sort((a, b) => a.slug.localeCompare(b.slug));

// Belt-and-suspenders guard (mirrors golden.test.ts)
describe("weapon-passive: auto-discovery", () => {
  it("every character file is represented in REPS", () => {
    const charDir = join(dirname(fileURLToPath(import.meta.url)), "../characters");
    const fileCount = readdirSync(charDir).filter(
      (f) => f.endsWith(".ts") && f !== "index.ts"
    ).length;
    expect(REPS.length).toBe(fileCount);
    expect(REPS.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Sub-suite 1: weapon-passive (107 chars × R1, passive ON)
// ---------------------------------------------------------------------------

for (const { char, weaponStatTable, slug } of REPS) {
  describe(`weapon-passive: ${slug}`, () => {
    const fixture = loadFixture("weapon-passive", slug);
    const weaponEntry = WEAPON_BY_TYPE[char.weapon]!;

    const settings: EvalContext = {
      ...weaponEntry.passive,
      weapon_refine: 1,
    };

    const { context } = buildStats({
      char,
      weaponStatTable,
      statBlock: STAT_BLOCK,
      levels: LEVELS,
      enemy: ENEMY,
      settings,
      extraConditions: weaponEntry.weapon.conditions ?? [],
    });

    const compiled = compileCharacter(char, {
      charElement: char.element,
      talentLevels: TALENTS,
      settings,
      charLevel: LEVELS.charLevel,
    });

    const allDamageKeys = Object.entries(fixture.features)
      .filter(([, entry]) => isDamageTripleEntry(entry))
      .map(([key]) => key);

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

    it(`${slug}: no produced key is absent from the fixture (mis-key guard)`, () => {
      expect(
        orphanKeys,
        `produced but absent from fixture (mis-keyed?): ${orphanKeys.join(", ")}`
      ).toEqual([]);
    });

    it(`${slug}: full coverage — no unmodelled fixture damage feature`, () => {
      const total = allDamageKeys.length;
      const modelled = producedKeys.filter((k) => {
        const oracle = fixture.features[k];
        return oracle !== undefined && isDamageTripleEntry(oracle);
      }).length;
      console.info(
        `[weapon-passive] ${slug}: ${modelled}/${total} fixture damage features modelled`
      );
      expect(
        unmodelledKeys,
        `${slug}: unmodelled fixture damage features: ${unmodelledKeys.join(", ")}`
      ).toEqual([]);
    });
  });
}

// ---------------------------------------------------------------------------
// Sub-suite 2: weapon-refine (10 reps × R5, passive ON)
//
// Reps from weapon-refine/_manifest.json:
//   ganyu, hu_tao, keqing, eula, yoimiya, raiden_shogun,
//   arataki_itto, nahida, neuvillette, furina
// Validates R5 refine-scaling across all 5 weapon types.
// ---------------------------------------------------------------------------

const REFINE_SLUGS = new Set([
  "ganyu", "hu_tao", "keqing", "eula", "yoimiya",
  "raiden_shogun", "arataki_itto", "nahida", "neuvillette", "furina",
]);

const REFINE_REPS = REPS.filter(({ slug }) => REFINE_SLUGS.has(slug));

describe("weapon-refine: rep set coverage", () => {
  it("all 10 refine reps discovered", () => {
    const found = REFINE_REPS.map((r) => r.slug).sort();
    const expected = Array.from(REFINE_SLUGS).sort();
    expect(found).toEqual(expected);
  });
});

for (const { char, weaponStatTable, slug } of REFINE_REPS) {
  describe(`weapon-refine: ${slug}`, () => {
    const fixture = loadFixture("weapon-refine", slug);
    const weaponEntry = WEAPON_BY_TYPE[char.weapon]!;

    const settings: EvalContext = {
      ...weaponEntry.passive,
      weapon_refine: 5,
    };

    const { context } = buildStats({
      char,
      weaponStatTable,
      statBlock: STAT_BLOCK,
      levels: LEVELS,
      enemy: ENEMY,
      settings,
      extraConditions: weaponEntry.weapon.conditions ?? [],
    });

    const compiled = compileCharacter(char, {
      charElement: char.element,
      talentLevels: TALENTS,
      settings,
      charLevel: LEVELS.charLevel,
    });

    const allDamageKeys = Object.entries(fixture.features)
      .filter(([, entry]) => isDamageTripleEntry(entry))
      .map(([key]) => key);

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

    it(`${slug}: no produced key is absent from the fixture (mis-key guard)`, () => {
      expect(
        orphanKeys,
        `produced but absent from fixture (mis-keyed?): ${orphanKeys.join(", ")}`
      ).toEqual([]);
    });

    it(`${slug}: full coverage — no unmodelled fixture damage feature`, () => {
      const total = allDamageKeys.length;
      const modelled = producedKeys.filter((k) => {
        const oracle = fixture.features[k];
        return oracle !== undefined && isDamageTripleEntry(oracle);
      }).length;
      console.info(
        `[weapon-refine] ${slug}: ${modelled}/${total} fixture damage features modelled (R5)`
      );
      expect(
        unmodelledKeys,
        `${slug}: unmodelled fixture damage features: ${unmodelledKeys.join(", ")}`
      ).toEqual([]);
    });
  });
}
