/**
 * P2.C Wave-1 — Constellation harness over the FULL roster.
 *
 * Runs our engine on every character at C6 and asserts each PRODUCED damage feature
 * matches the oracle's `constellations` fixture (her v5.8 engine at
 * `setCharLevels({constellation: 6})`, skills 10/10/10 — build-configs.mjs). The build
 * is otherwise the fixed canonical build (Lv90/A6, enemy Lv90 10% res, sampleStats);
 * the only delta from `base` is `char_constellation: 6`.
 *
 * GROUND TRUTH: each `constellations/<slug>.json` is HER engine's C6 output (dumped by
 * tools/oracle/dump-oracle.mjs). A character passes this suite iff our C6 numbers match
 * hers within TOLERANCE — there is NO skip, so a char whose constellations affect damage
 * but are not yet ported FAILS until ported correctly. The coverage gate additionally
 * requires every fixture damage feature to be produced (catches a constellation that adds
 * a NEW damage feature), and the mis-key guard rejects any produced key absent from the
 * fixture. This is the same strength as golden.test.ts (base C0), lifted to C6.
 *
 * THE TALENT-BUMP CHAIN (validated by the hu_tao calibration): C3/C5 "+3 to a talent"
 * are conditions contributing `settings:{char_skill_<slot>_bonus:3}`; `buildStats`
 * propagates condition `.settings` into the returned `settings`, which this harness
 * threads into the compile context, where `compileFeature` adds the `_bonus` to the
 * talent level (her Feature.getTalentLevel). C2-style always-on cons buffs are
 * constellation-gated `char.multipliers` / conditions (P2.2/P2.3).
 *
 * PORTING A CHARACTER (Wave-1 fan-out): edit ONLY `characters/<slug>.ts` — add the
 * constellation conditions/multipliers/features the fixture requires, reading the raw
 * `db/Char/<Name>.js` constellation array + `char.multipliers`/`char.conditions` for the
 * exact mechanism. Toggle constellations (ConditionBoolean) are OFF in this config →
 * deferred to Wave 2 (the toggles/cons-mid fixtures). The fixture is the per-char spec.
 *
 * Sources:
 *   tests/golden/fixtures/constellations/<slug>.json — oracle fixture (C6)
 *   tools/oracle/build-configs.mjs (constellations config)
 *   packages/data/src/__tests__/golden.test.ts (the base-C0 sibling harness)
 */

import { readFileSync, readdirSync } from "node:fs";
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
import type { DbObjectChar, StatTableEntry } from "@genshin/types";

// ---------------------------------------------------------------------------
// FIXED canonical build (verbatim from golden.test.ts) + the C6 dimension
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

/** Base talent levels — the `constellations` config leaves these at 10/10/10; the
 *  C3/C5 `_bonus` offsets are added by the engine from condition settings. */
const TALENTS = { attack: 10, elemental: 10, burst: 10 } as const;

/** The constellation dimension: C6 (every constellation ≤ 6 active). */
const CONSTELLATION = 6;

/** Absolute tolerance for the [normal, crit, avg] triple (matches golden.test.ts). */
const TOLERANCE = 0.1;

// ---------------------------------------------------------------------------
// Fixture types + loader
// ---------------------------------------------------------------------------

interface FixtureEntry {
  readonly category: string;
  readonly damageType: string | undefined;
  readonly normal: number;
  readonly crit: number;
  readonly average: number;
}

interface Fixture {
  readonly features: Record<string, FixtureEntry>;
}

const FIXTURES_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../tests/golden/fixtures/constellations"
);

function loadFixture(slug: string): Fixture {
  return JSON.parse(readFileSync(join(FIXTURES_DIR, `${slug}.json`), "utf-8")) as Fixture;
}

/** Damage-triple entries only (exclude stat readouts + display-only rows) — same
 *  predicate as golden.test.ts. */
function isDamageTripleEntry(entry: FixtureEntry): boolean {
  if (entry.category === "stats") return false;
  if (!entry.damageType) return false;
  return true;
}

// ---------------------------------------------------------------------------
// Auto-discovery of the full roster (identical machinery to golden.test.ts)
// ---------------------------------------------------------------------------

interface Rep {
  readonly char: DbObjectChar;
  readonly weaponStatTable: readonly StatTableEntry[];
  readonly slug: string;
}

const WEAPON_TABLE_BY_TYPE: Readonly<Record<string, readonly StatTableEntry[]>> = {
  sword: alleyFlashStatTable,
  claymore: theBellStatTable,
  polearm: blackcliffPoleStatTable,
  bow: alleyHunterStatTable,
  catalyst: solarPearlStatTable,
};

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

// Belt-and-suspenders: the glob must discover EVERY character file on disk.
describe("auto-discovery (constellations)", () => {
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
// Harness — every character at C6 vs her engine
// ---------------------------------------------------------------------------

for (const { char, weaponStatTable, slug } of REPS) {
  describe(`constellations C${CONSTELLATION}: ${slug}`, () => {
    const fixture = loadFixture(slug);

    // buildStats propagates condition `.settings` (C3/C5 `char_skill_*_bonus`) into the
    // returned `settings` — thread those into the compile context so the talent offsets
    // + constellation-gated multipliers resolve at compile time.
    const { context, settings } = buildStats({
      char,
      weaponStatTable,
      statBlock: STAT_BLOCK,
      levels: LEVELS,
      enemy: ENEMY,
      settings: { char_constellation: CONSTELLATION },
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
      expect(
        unmodelledKeys,
        `${slug}: unmodelled fixture damage features: ${unmodelledKeys.join(", ")}`
      ).toEqual([]);
    });
  });
}
