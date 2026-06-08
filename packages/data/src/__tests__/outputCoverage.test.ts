/**
 * P3.5.0 — Non-damage OUTPUT coverage burndown (the structurally-blind-gate fix).
 *
 * golden.test.ts asserts only DAMAGE triples (isDamageTripleEntry). Her engine ALSO emits
 * heal / shield / crystallize / static outputs (damageType "", normal == crit == average),
 * which slipped past every gate. This suite requires each base fixture's non-damage outputs
 * to be MODELLED by our engine. Our engine produces none yet → this suite is RED until
 * P3.5.3 ports FeatureHeal / FeatureShield / FeatureReactionCrystallize / FeatureStatic.
 *
 * BURNDOWN — HONESTY RULES (verbatim from armory.test.ts): the suite is intentionally RED.
 * NO it.skip, NO it.todo, NO it.fails, NO loosened tolerance, NO hard-coded overrides.
 * Each unmodelled-output character emits exactly ONE failing it; P3.5.3 flips them green.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";
import { describe, it, expect } from "vitest";
import { buildStats } from "../buildStats.js";
import { compileCharacter } from "../loader.js";
import {
  blackcliffPoleStatTable,
  theBellStatTable,
  alleyFlashStatTable,
  alleyHunterStatTable,
  solarPearlStatTable,
} from "../generated/weaponStatTables.js";
import type { DbObjectChar, Feature, StatTableEntry } from "@genshin/types";
import { theBell } from "../weapons/the-bell.js";
import { type FixtureEntry, isNonDamageOutput } from "./_fixtureEntry.js";

// ---------------------------------------------------------------------------
// FIXED canonical build (verbatim from golden.test.ts)
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
// Fixture types + loader
// ---------------------------------------------------------------------------

interface Fixture {
  readonly features: Record<string, FixtureEntry>;
}

const FIXTURES_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../tests/golden/fixtures"
);

function loadFixture(slug: string): Fixture {
  return JSON.parse(readFileSync(join(FIXTURES_DIR, `${slug}.json`), "utf-8")) as Fixture;
}

// ---------------------------------------------------------------------------
// Representative set (auto-discovered, same pattern as golden.test.ts)
// ---------------------------------------------------------------------------

const WEAPON_TABLE_BY_TYPE: Readonly<Record<string, readonly StatTableEntry[]>> = {
  sword: alleyFlashStatTable,
  claymore: theBellStatTable,
  polearm: blackcliffPoleStatTable,
  bow: alleyHunterStatTable,
  catalyst: solarPearlStatTable,
};

// The oracle equips the canonical weapon per type and dumps ITS features too, so a
// claymore char's fixture carries `weapon.bell_shield` (The Bell's shield output). The
// ONLY canonical weapon with a non-damage feature is The Bell; compile its features as
// `extraFeatures` so those outputs are reproduced. (Other canonical weapons carry no
// non-damage feature → any future one would surface here as a fresh RED.)
const CANONICAL_WEAPON_FEATURES_BY_TYPE: Readonly<Record<string, readonly Feature[]>> = {
  claymore: theBell.features ?? [],
};

// Minimal local type for Vite's `import.meta.glob` so the typecheck gate passes
// without a vite/client dependency. Vitest supplies the real implementation at runtime.
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

const CHAR_MODULES = import.meta.glob("../characters/*.ts", { eager: true });

const REPS = Object.entries(CHAR_MODULES)
  .filter(([path]) => !path.endsWith("/index.ts"))
  .map(([path, mod]) => {
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
// Burndown harness
// ---------------------------------------------------------------------------

// Module-level counters (armory.test.ts pattern)
let totalNonDamage = 0;
let totalUnmodelled = 0;

for (const { char, weaponStatTable, slug } of REPS) {
  const fixture = loadFixture(slug);
  const nonDamageKeys = Object.entries(fixture.features)
    .filter(([, e]) => isNonDamageOutput(e))
    .map(([k]) => k);

  // Chars with no non-damage outputs need no suite — creating an empty `describe` makes vitest
  // report "No test found in suite" (a file-level failure with 0 assertion failures). Skip them
  // so the suite runs cleanly green.
  if (nonDamageKeys.length === 0) continue;

  describe(`output-coverage: ${slug}`, () => {
    const { context } = buildStats({
      char,
      weaponStatTable,
      statBlock: STAT_BLOCK,
      levels: LEVELS,
      enemy: ENEMY,
      settings: {},
    });

    const compiled = compileCharacter(char, {
      charElement: char.element,
      talentLevels: TALENTS,
      settings: {},
      charLevel: LEVELS.charLevel,
      extraFeatures: CANONICAL_WEAPON_FEATURES_BY_TYPE[char.weapon] ?? [],
    });

    const unmodelled = nonDamageKeys.filter((k) => !(k in compiled));
    totalNonDamage += nonDamageKeys.length;
    totalUnmodelled += unmodelled.length;

    // VALUE check for any non-damage output we DO produce (none until P3.5.3; ready for it).
    for (const key of nonDamageKeys.filter((k) => k in compiled)) {
      const oracle = fixture.features[key]!;
      it(`${slug}/${key} non-damage value within ${TOLERANCE}`, () => {
        const result = compiled[key]!(context); // DamageResult; non-damage → normal == crit == avg
        expect(
          Math.abs(result.avg - oracle.average),
          `${slug}/${key}: ours=${result.avg}, oracle=${oracle.average}`
        ).toBeLessThanOrEqual(TOLERANCE);
      });
    }

    // COVERAGE burndown (RED until P3.5.3): every non-damage output must be modelled.
    it(`${slug}: all non-damage outputs modelled — burndown`, () => {
      expect(
        unmodelled,
        `${slug}: unmodelled non-damage outputs (P3.5.3): ${unmodelled.join(", ")}`
      ).toEqual([]);
    });
  });
}

describe("output-coverage: burndown summary", () => {
  it("reports the non-damage-output work-list (always-green structural check)", () => {
    console.info(
      `[output-coverage] ${totalUnmodelled}/${totalNonDamage} non-damage outputs UNMODELLED across ${REPS.length} chars (RED → P3.5.3)`
    );
    expect(totalNonDamage).toBeGreaterThan(0); // sanity: the gate now SEES non-damage outputs
  });
});
