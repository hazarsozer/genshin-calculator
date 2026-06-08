/**
 * P3.5 enemy-level — Enemy level ≠ 90 DEF-formula branch (COVERAGE; GREEN on arrival).
 *
 * The `enemy-level` oracle config (build-configs.mjs §enemy-level) dumps Eula's triples with the
 * enemy at level 80 instead of the universal 90, to exercise the DEF-multiplier's enemy-level term.
 * The DEF multiplier (raw/.../classes/Feature2/Damage.js:160-189, getDefenceLevelMultiplier) is
 *   def = src / (target·k + src),  src = 100 + char_level,  target = 100 + enemy_level
 * so enemy level moves EVERY damage hit. It is GLOBAL (one enemy per build), default 90, set via
 * CalcSet.setEnemyLevels (CalcSet.js:91). No other config overrides it → the level term was never
 * exercised ≠90. At char 90 (src=190): level 90 → def=190/380=0.5; level 80 → def=190/370≈0.5135
 * (~+2.7% damage) — a measurable, isolable shift on Eula's physical hits (no infusion/reaction noise).
 *
 * Unlike the other burndowns this is NOT a TDD RED→GREEN: the port already plumbs ctx.enemy.level
 * correctly (blocks.ts:294 ← buildStats.ts ← EnemyParams.level), so it PASSES ON ARRIVAL. The value is
 * locking in coverage of an otherwise-untested branch. The load-bearing proof (that the fixture
 * exercises the level term, not a vacuous 0==0) is recorded in the commit: hardcoding the port's enemy
 * level back to 90 turns this suite RED.
 *
 * GOTCHA (the one real deviation): the dumped manifest's enemy.level metadata is hardcoded 90
 * (engine.mjs records FIXED_BUILD.enemy.level, NOT the apply() override). So this suite HARDCODES
 * ENEMY.level=80 on the port side — it does NOT read the level from the fixture manifest (consistent
 * with how enemyStateBurndown / foodBurndown hardcode ENEMY per-suite). The 80 here is the level the
 * oracle config actually computed.
 *
 * GUARD — HONESTY RULES (verbatim from armory.test.ts / enemyStateBurndown.test.ts): NO it.skip,
 * NO it.todo, NO it.fails, NO loosened tolerance, NO hard-coded overrides.
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";
import { describe, it, expect } from "vitest";
import { buildStats } from "../buildStats.js";
import { compileCharacter } from "../loader.js";
import { theBellStatTable } from "../generated/weaponStatTables.js";
import { eula } from "../characters/eula.js";
import { type FixtureEntry, isDamageTripleEntry } from "./_fixtureEntry.js";

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

// The level the `enemy-level` oracle config actually computed (80). HARDCODED — the dumped manifest
// records a stale enemy.level=90 (engine.mjs metadata bug, documented in the header), so the level
// is NOT read from the fixture. Resistance stays at the universal 10.
const ENEMY = { level: 80, resistance: 10 } as const;

const TALENTS = { attack: 10, elemental: 10, burst: 10 } as const;

const TOLERANCE = 0.1;

interface Fixture {
  readonly slug: string;
  readonly features: Record<string, FixtureEntry>;
}

const ENEMY_LEVEL_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../tests/golden/fixtures/enemy-level"
);

// The `enemy-level` config is a CHAR config (one rep, Eula), so the fixture is keyed by the char slug.
// Single-rep assumption: if reps are added to the config, refactor to the manifest-glob loop pattern
// (cf. enemyStateBurndown) instead of this direct slug import.
const FIXTURE_SLUG = "eula";

const fixture: Fixture | undefined = existsSync(join(ENEMY_LEVEL_DIR, `${FIXTURE_SLUG}.json`))
  ? (JSON.parse(
      readFileSync(join(ENEMY_LEVEL_DIR, `${FIXTURE_SLUG}.json`), "utf-8")
    ) as Fixture)
  : undefined;

describe("enemy-level-burndown", () => {
  it("the enemy-level Eula fixture exists", () => {
    expect(fixture).toBeDefined();
  });
});

describe("enemy-level-burndown: eula (enemy level 80)", () => {
  if (!fixture) {
    it("eula fixture present", () =>
      expect.fail(`missing fixture '${FIXTURE_SLUG}.json'`));
  } else {
    // Compile Eula vs an enemy at level 80 — the DEF-multiplier level term lifts every damage hit
    // ~+2.7% vs the universal level-90 baseline. The port reads ctx.enemy.level (← ENEMY.level here).
    const { context } = buildStats({
      char: eula,
      weaponStatTable: theBellStatTable, // Eula is a claymore user (default the_bell, passive OFF)
      statBlock: STAT_BLOCK,
      levels: LEVELS,
      enemy: ENEMY,
    });

    const compiled = compileCharacter(eula, {
      charElement: eula.element,
      talentLevels: TALENTS,
      settings: {},
      charLevel: LEVELS.charLevel,
    });

    // Assert every damage triple the oracle emitted (a crit-spread triple). Non-damage outputs
    // (stats/reaction readouts) are excluded — this gate is about the enemy-level term lifting DAMAGE.
    const damageKeys = Object.entries(fixture.features)
      .filter(([, e]) => isDamageTripleEntry(e))
      .map(([k]) => k);

    for (const key of damageKeys.filter((k) => k in compiled)) {
      const oracle = fixture.features[key]!;
      it(`eula/${key} avg within ${TOLERANCE}`, () => {
        const result = compiled[key]!(context);
        expect(
          Math.abs(result.avg - oracle.average),
          `eula/${key}: ours=${result.avg.toFixed(2)}, oracle=${oracle.average.toFixed(2)}`
        ).toBeLessThanOrEqual(TOLERANCE);
      });
    }
  }
});
