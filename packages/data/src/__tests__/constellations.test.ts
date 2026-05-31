/**
 * P2.C Wave-1 — Constellation calibration harness.
 *
 * Validates a character built at C6 against the oracle's `constellations` fixture
 * family (her v5.8 engine at `setCharLevels({constellation: 6})`, skills left at
 * 10/10/10 — build-configs.mjs `constellations`). The build is otherwise the fixed
 * canonical build (Lv90/A6, enemy Lv90 10% res, sampleStats bonus block); the only
 * difference from `base` is `char_constellation: 6`.
 *
 * WHY this exists (the calibration): the `constellations` config leaves the skill
 * levels at 10 — so any C3/C5 "+3 to a talent" must be applied by the engine, not the
 * config. Her engine does it via condition-contributed settings: C3/C5 conditions carry
 * `settings:{char_skill_<slot>_bonus:3}`, and the talent-level resolver adds that
 * `_bonus` (raw Feature.js:235-244 / Multiplier.getLevel). This harness is the
 * end-to-end proof of that chain: `buildStats` propagates condition `.settings` (its
 * returned `settings`), `compileCharacter` reads the merged settings, and
 * `compileFeature.baseDamageTerm` adds the `_bonus` offset to the talent row.
 *
 * CALIBRATION SCOPE: hu_tao only. Hu Tao spans two of the three constellation shapes
 * in one character — multiplier-mod (C2: +10% Max HP → Blood Blossom, a P2.3 targeted
 * multiplier gated by ConditionConstellation) and talent-bump (C3 skill +3, C5 burst
 * +3). The third shape — a flat-stat ConditionConstellation — is already covered by the
 * P2.2 stats-concat path. The Wave-1 fan-out generalizes this harness to all 107 chars
 * (data-driven "cons ported" skip, like artifactSets.test.ts).
 *
 * Sources:
 *   tests/golden/fixtures/constellations/<slug>.json — oracle fixture (C6)
 *   tools/oracle/build-configs.mjs (constellations config)
 *   raw/genshin_calc_pub/src/js/db/Char/Hutao.js (C2/C3/C5)
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";
import { describe, it, expect } from "vitest";
import { buildStats } from "../buildStats.js";
import { compileCharacter } from "../loader.js";
import { huTao } from "../characters/hu-tao.js";
import { blackcliffPoleStatTable } from "../generated/weaponStatTables.js";
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
// Calibration reps (Wave-1 fan-out will generalize this to all 107)
// ---------------------------------------------------------------------------

interface Rep {
  readonly char: DbObjectChar;
  readonly weaponStatTable: readonly StatTableEntry[];
  readonly slug: string;
}

const REPS: readonly Rep[] = [
  { char: huTao, weaponStatTable: blackcliffPoleStatTable, slug: "hu_tao" },
];

// ---------------------------------------------------------------------------
// Harness
// ---------------------------------------------------------------------------

for (const { char, weaponStatTable, slug } of REPS) {
  describe(`constellations C${CONSTELLATION}: ${slug}`, () => {
    const fixture = loadFixture(slug);

    // buildStats propagates condition `.settings` (C3/C5 `char_skill_*_bonus`) into
    // the returned `settings` — thread those into the compile context so the talent
    // offsets + the constellation-gated C2 multiplier resolve at compile time.
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
      console.info(
        `[constellations] ${slug}: ${producedKeys.length}/${allDamageKeys.length} fixture damage features modelled`
      );
      expect(
        unmodelledKeys,
        `${slug}: unmodelled fixture damage features: ${unmodelledKeys.join(", ")}`
      ).toEqual([]);
    });
  });
}
