/**
 * P3.5 lyney-surplus — Lyney Prop-Surplus-stacks burndown (RED by design, pending the GREEN edit).
 *
 * The `lyney-surplus` oracle config (build-configs.mjs §lyneySurplusItems) bakes
 * `lyney_surplus_stacks:5` (the max) on Lyney via mergeCharSettings — a SELF char toggle (the
 * Furina/Yelan stacks-rep channel), NOT setBuffsSettings. Her engine scales TWO Lyney outputs by
 * that stack count through her pure-×stacks `getStackMultiplier`
 * (raw/.../classes/Feature2/Multiplier.js:196-211: `getTree` pushes
 * `CConst(min(settings[stacksLeveling] ?? 0, maxStacks))` into the term's `CMulti` iff
 * `stacksLeveling` is set — a pure `×stacks`, 0 at 0 stacks, NOT `1 + perStack×stacks`). Both are
 * DEFERRED in our port today (no pure-×stacks `FeatureMultiplierEntry` field exists):
 *
 *   - skill.lyney_hp_regeneration (FeatureHeal, `hp*` heal): ONE mult `{leveling
 *     char_skill_elemental, stacksLeveling lyney_surplus_stacks, values s2.p3=[20]}` →
 *     `0.20 × hp_total × min(stacks,5) × (1 + healing + healing_base + healing_recv)`
 *     (raw/.../db/Char/Lyney.js:341-352). This heal feature is entirely ABSENT from our port
 *     (characters/lyney.ts L243 DEFERRED) → RED-by-absence. It is the ONE live `outputCoverage`
 *     residual RED (at the BASE stacks=0 fixture it is 0; here at stacks=5 it is non-zero).
 *   - skill.skill_dmg's 2nd mult (lyney_skill_dmg_bonus, ATK-default): `{leveling
 *     char_skill_elemental, stacksLeveling lyney_surplus_stacks, values s2.p2 (level-scaled,
 *     95.76% @talent10)}` → an ADDITIVE base-damage term `+s2.p2% × atk_total × min(stacks,5)` on
 *     the pyro skill hit (raw/.../db/Char/Lyney.js:334-338). Our port models skill_dmg with the
 *     BASE multiplier (s2.p1) ONLY → the skill_dmg triple UNDERSHOOTS by the missing 2nd-mult×5.
 *
 * ONE new base-inert engine field (`FeatureMultiplierEntry.stacksFactor`) closes BOTH (shared by
 * the DAMAGE base-term path AND the HEAL base-term path — `compileOutput` reuses `baseDamageTerm`).
 * This suite threads `{ lyney_surplus_stacks: 5 }` into both buildStats and compileCharacter and
 * asserts the heal (present + value) AND the skill_dmg triple. It goes GREEN under that edit with
 * NO edits here.
 *
 * THE SKILL_DMG TRIPLE IS THE STRONGER GUARD: baking stacks=5 makes BOTH the heal AND skill_dmg
 * non-zero in the oracle; asserting the full skill_dmg triple (normal/crit/avg) proves the ×stacks
 * FACTOR (its arithmetic), not just heal PRESENCE. The non-stacks damage (normal/charged/burst/
 * plunge) does NOT read lyney_surplus_stacks → already matches → asserted as a NO-DELTA GUARD that
 * isolates the RED to skill_dmg + the heal.
 *
 * GUARD — HONESTY RULES (verbatim from armory.test.ts / bolMultiplierBurndown.test.ts): NO it.skip,
 * NO it.todo, NO it.fails, NO loosened tolerance, NO hard-coded overrides. The RED is by design
 * pending the GREEN edit; this suite goes GREEN once the engine field + the lyney.ts un-defers land
 * with NO edits here.
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";
import { describe, it, expect } from "vitest";
import { buildStats } from "../buildStats.js";
import { compileCharacter } from "../loader.js";
import { alleyHunterStatTable } from "../generated/weaponStatTables.js";
import type { DbObjectChar } from "@genshin/types";
import { lyney } from "../characters/lyney.js";
import {
  type FixtureEntry,
  isDamageTripleEntry,
  isNonDamageOutput,
} from "./_fixtureEntry.js";

// FIXED canonical build — verbatim from golden.test.ts / outputCoverage.test.ts (the sampleStats
// mirror the oracle's FIXED_BUILD uses), so ours and the oracle dump compute on the same point.
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

// The exact setting the oracle config baked (mergeCharSettings lyney_surplus_stacks:5), threaded
// verbatim into both buildStats and compileCharacter so the stacks drive both sides identically.
const SETTINGS = { lyney_surplus_stacks: 5 } as const;

interface Fixture {
  readonly slug: string;
  readonly features: Record<string, FixtureEntry>;
}

const SURPLUS_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../tests/golden/fixtures/lyney-surplus"
);

const FIXTURE_PATH = join(SURPLUS_DIR, "lyney-surplus.json");

const char: DbObjectChar = lyney;

const fixture: Fixture | undefined = existsSync(FIXTURE_PATH)
  ? (JSON.parse(readFileSync(FIXTURE_PATH, "utf-8")) as Fixture)
  : undefined;

describe("lyney-surplus-burndown", () => {
  it("the lyney-surplus fixture exists", () => {
    expect(fixture, `missing fixture ${FIXTURE_PATH}`).toBeDefined();
  });
});

if (fixture) {
  const { context, settings: merged } = buildStats({
    char,
    weaponStatTable: alleyHunterStatTable,
    statBlock: STAT_BLOCK,
    levels: LEVELS,
    enemy: ENEMY,
    settings: SETTINGS,
  });

  const compiled = compileCharacter(char, {
    charElement: char.element,
    talentLevels: TALENTS,
    settings: merged,
    charLevel: LEVELS.charLevel,
  });

  // ---------------------------------------------------------------------
  // DAMAGE-triple assertions.
  //
  // skill.skill_dmg gets the stacks bonus (its 2nd mult reads lyney_surplus_stacks): ours
  // (base mult only) UNDERSHOOTS the oracle (base + bonus×5) → RED. Every OTHER damage feature
  // (normals, charged, burst, plunge) does NOT read the stacks → already matches → asserted as a
  // NO-DELTA GUARD (proves the RED is the skill_dmg 2nd mult, not a global mismatch). Filtered by
  // `k in compiled` because these damage features DO exist in our port (skill_dmg just lacks the
  // 2nd mult) — honest, not vacuous.
  // ---------------------------------------------------------------------
  describe("lyney-surplus-burndown: damage triples", () => {
    const damageKeys = Object.entries(fixture.features)
      .filter(([, e]) => isDamageTripleEntry(e))
      .map(([k]) => k);

    for (const key of damageKeys.filter((k) => k in compiled)) {
      const oracle = fixture.features[key]!;

      it(`${key} normal within ${TOLERANCE}`, () => {
        const result = compiled[key]!(context);
        expect(
          Math.abs(result.normal - oracle.normal),
          `${key} normal: ours=${result.normal.toFixed(2)}, oracle=${oracle.normal.toFixed(2)}`
        ).toBeLessThanOrEqual(TOLERANCE);
      });

      it(`${key} crit within ${TOLERANCE}`, () => {
        const result = compiled[key]!(context);
        expect(
          Math.abs(result.crit - oracle.crit),
          `${key} crit: ours=${result.crit.toFixed(2)}, oracle=${oracle.crit.toFixed(2)}`
        ).toBeLessThanOrEqual(TOLERANCE);
      });

      it(`${key} avg within ${TOLERANCE}`, () => {
        const result = compiled[key]!(context);
        expect(
          Math.abs(result.avg - oracle.average),
          `${key} avg: ours=${result.avg.toFixed(2)}, oracle=${oracle.average.toFixed(2)}`
        ).toBeLessThanOrEqual(TOLERANCE);
      });
    }
  });

  // ---------------------------------------------------------------------
  // NON-DAMAGE OUTPUT assertions (the stacks-scaled heal — RED-BY-ABSENCE).
  //
  // skill.lyney_hp_regeneration is entirely ABSENT from our port today (DEFERRED) → at stacks=5 the
  // oracle emits a non-zero heal (= hp_total, since 0.20 × 5 = 1.0 with no healing bonus). This is
  // NOT guarded by `k in compiled` (that would VACUOUSLY skip the absent heal). It REQUIRES the key
  // PRESENT in `compiled` AND its value to match. Once the heal feature lands with `stacksFactor`,
  // both clauses pass. Non-damage outputs are single-valued (normal == crit == average).
  // ---------------------------------------------------------------------
  describe("lyney-surplus-burndown: non-damage heal", () => {
    const nonDamageKeys = Object.entries(fixture.features)
      .filter(([, e]) => isNonDamageOutput(e))
      .map(([k]) => k);

    for (const key of nonDamageKeys) {
      const oracle = fixture.features[key]!;

      it(`${key} present + value within ${TOLERANCE}`, () => {
        // (1) the heal feature must be MODELLED (not absent → would skip vacuously under `k in compiled`).
        expect(
          key in compiled,
          `${key}: heal feature ABSENT from our port; oracle=${oracle.average.toFixed(4)}`
        ).toBe(true);
        // (2) the value must match: 0.20 × hp_total × min(5,5) × (1 + healing…).
        const result = compiled[key]!(context);
        expect(
          Math.abs(result.avg - oracle.average),
          `${key}: ours=${result.avg.toFixed(4)}, oracle=${oracle.average.toFixed(4)}`
        ).toBeLessThanOrEqual(TOLERANCE);
      });
    }
  });
}
