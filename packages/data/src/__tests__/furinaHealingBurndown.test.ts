/**
 * Furina healing_recv lock — the fanfare→healing_recv self-buff heal-output guard.
 *
 * furina_fanfare_stacks feeds BOTH dmg_all (damage, already locked by selfBuffsBurndown) AND
 * healing_recv (fanfareHealingPost, Furina.js:185-193). selfBuffsBurndown asserts damage triples
 * ONLY (isDamageTripleEntry), so the healing_recv path was structurally unlocked. This suite reuses
 * the SAME furina-self-buffs fixture (dumped from her engine at C1 / fanfare 350) and asserts every
 * NON-DAMAGE output (isNonDamageOutput) present + value: the healing_recv % readout
 * (burst.furina_fanfare_heal_bonus = 35) plus her actual heals (Salon Solitaire / drain DoT), which
 * SCALE with healing_recv. Removing furina.ts's fanfare→healing_recv postEffect drops these → RED.
 *
 * GUARD — HONESTY RULES: NO it.skip, NO it.todo, NO it.fails, NO loosened tolerance.
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";
import { describe, it, expect } from "vitest";
import { buildStats } from "../buildStats.js";
import { compileCharacter } from "../loader.js";
import { alleyFlashStatTable } from "../generated/weaponStatTables.js";
import type { DbObjectChar } from "@genshin/types";
import { furina } from "../characters/furina.js";
import { type FixtureEntry, isNonDamageOutput } from "./_fixtureEntry.js";

const STAT_BLOCK = {
  atk_base: 871, atk_percent: 18, crit_dmg_base: 50, crit_rate_base: 5, def_base: 876,
  dmg_burst: 64, dmg_charged: 16, dmg_electro: 2, dmg_normal: 8, dmg_phys: 4, dmg_skill: 32,
  hp_base: 13226, mastery_base: 55, recharge_base: 100,
} as const;
const LEVELS = { charLevel: 90, ascension: 6, weaponLevel: 90, weaponAscension: 6 } as const;
const ENEMY = { level: 90, resistance: 10 } as const;
const TALENTS = { attack: 10, elemental: 10, burst: 10 } as const;
const TOLERANCE = 0.1;

// The EXACT settings the furina-self-buffs oracle rep was dumped under (C1, fanfare 350, hp_offers 4).
const SETTINGS = { char_constellation: 1, furina_hp_offers: 4, furina_fanfare_stacks: 350 } as const;

interface Fixture { readonly slug: string; readonly features: Record<string, FixtureEntry>; }

const FIXTURE_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../tests/golden/fixtures/self-buffs/furina-self-buffs.json"
);
const char: DbObjectChar = furina;
const fixture: Fixture | undefined = existsSync(FIXTURE_PATH)
  ? (JSON.parse(readFileSync(FIXTURE_PATH, "utf-8")) as Fixture)
  : undefined;

describe("furina-healing-burndown", () => {
  it("the furina-self-buffs fixture exists", () => {
    expect(fixture, `missing fixture ${FIXTURE_PATH}`).toBeDefined();
  });
});

if (fixture) {
  const { context, settings: merged } = buildStats({
    char, weaponStatTable: alleyFlashStatTable, statBlock: STAT_BLOCK,
    levels: LEVELS, enemy: ENEMY, talentLevels: TALENTS, settings: SETTINGS,
  });
  const compiled = compileCharacter(char, {
    charElement: char.element, talentLevels: TALENTS, settings: merged, charLevel: LEVELS.charLevel,
  });

  describe("furina-healing-burndown: non-damage heal outputs", () => {
    const nonDamageKeys = Object.entries(fixture.features)
      .filter(([, e]) => isNonDamageOutput(e))
      .map(([k]) => k);

    for (const key of nonDamageKeys) {
      const oracle = fixture.features[key]!;
      it(`${key} present + value within ${TOLERANCE}`, () => {
        expect(
          key in compiled,
          `${key}: non-damage output ABSENT from our port; oracle=${oracle.average.toFixed(4)}`
        ).toBe(true);
        const result = compiled[key]!(context);
        expect(
          Math.abs(result.avg - oracle.average),
          `${key}: ours=${result.avg.toFixed(4)}, oracle=${oracle.average.toFixed(4)}`
        ).toBeLessThanOrEqual(TOLERANCE);
      });
    }
  });
}
