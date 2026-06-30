/**
 * v6.x Lunar artifact sets — GCSim-free regression lock.
 *
 * Re-runs OUR PORT (no GCSim) for each of the 3 gated v6.x Lunar sets and asserts it
 * reproduces the frozen `ourRatio` from tests/golden/fixtures/gates/<set>-gate.json. This is
 * the live-content analog of a golden: it catches port/schema drift in CI without needing
 * the GCSim binary. Correctness vs GCSim is the dev-time `gate-live --self-test` gate.
 *
 * Gate method: Flins wears the 4pc set; idle Aino + Mona driver arms Moonsign 2.
 * Feature gated: `reaction.lunarcharged_contrubution` in absolute mode (nonCrit damage).
 * Fixtures: tests/golden/fixtures/gates/{aubade,silken,night}-gate.json (frozen by --write).
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { describe, it, expect } from "vitest";
import { flins } from "../characters/flins.js";
import { blackcliffPole } from "../weapons/blackcliff-pole.js";
import { aubadeOfMorningstarAndMoon } from "../artifacts/sets/aubade-of-morningstar-and-moon.js";
import { silkenMoonsSerenade } from "../artifacts/sets/silken-moons-serenade.js";
import { nightOfTheSkysUnveiling } from "../artifacts/sets/night-of-the-skys-unveiling.js";
import type { DbObjectArtifactSet } from "@genshin/types";
import {
  LEVELS,
  TALENTS,
  reconstructSettings,
  reconstructPort,
} from "../reconstruct.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES = resolve(__dirname, "../../../../tests/golden/fixtures/gates");

// ── frozen fixture row type ──────────────────────────────────────────────────
interface GateRow {
  rep: string;
  feature: string;
  ourRatio: number;
}

function loadFixture(name: string): GateRow[] {
  return JSON.parse(readFileSync(resolve(FIXTURES, name), "utf8")) as GateRow[];
}

// ── shared rep parameters (matches gate-reps.mjs entries exactly) ────────────
const ENEMY = { level: 100, resistance: 10 } as const;
const STAT_BLOCK = { atk_base: 2000 } as const;

/** Run our port for one set, return features map keyed by category.name. */
function runPort(
  set: DbObjectArtifactSet,
  goodId: string,
  setToggleKey: string,
): Record<string, { normal: number; crit: number; avg: number }> {
  const settings = reconstructSettings({
    charToggles: { moonsign_2: true },
    setToggles: { [setToggleKey]: true },
    passiveToggles: {},
    constellation: 0,
    refine: 1,
  });

  const setRegistry: Record<string, DbObjectArtifactSet> = { [goodId]: set };

  const { compiled, context } = reconstructPort({
    char: flins,
    weapon: blackcliffPole,
    weaponStatTable: blackcliffPole.statTable,
    statBlock: STAT_BLOCK,
    settings,
    passiveOn: false,
    artifactSets: { [goodId]: 4 },
    setRegistry,
    levels: LEVELS,
    talents: TALENTS,
    enemy: ENEMY,
  });

  const features: Record<string, { normal: number; crit: number; avg: number }> = {};
  for (const [key, fn] of Object.entries(compiled)) {
    features[key] = fn(context) as { normal: number; crit: number; avg: number };
  }
  return features;
}

// ── test cases ───────────────────────────────────────────────────────────────
describe("v6.x set gate — port reproduces frozen ourRatio (GCSim-free regression lock)", () => {
  it("aubade: reaction.lunarcharged_contrubution matches frozen fixture (absolute)", () => {
    const [row] = loadFixture("aubade-gate.json");
    const features = runPort(
      aubadeOfMorningstarAndMoon,
      "AubadeOfMorningstarAndMoon",
      "set.aubade_of_morningstar_and_moon_4",
    );
    const got = features[row!.feature]!.normal;
    expect(got).toBeCloseTo(row!.ourRatio, 6);
  });

  it("silken: reaction.lunarcharged_contrubution matches frozen fixture (absolute)", () => {
    const [row] = loadFixture("silken-gate.json");
    // Silken's 4pc also requires moonsign_1 (for gleamingMoonDevotionReactKey condition)
    const settings = reconstructSettings({
      charToggles: { moonsign_2: true, moonsign_1: true },
      setToggles: { "set.silken_moons_serenade_4": true },
      passiveToggles: {},
      constellation: 0,
      refine: 1,
    });
    const setRegistry: Record<string, DbObjectArtifactSet> = {
      SilkenMoonsSerenade: silkenMoonsSerenade,
    };
    const { compiled, context } = reconstructPort({
      char: flins,
      weapon: blackcliffPole,
      weaponStatTable: blackcliffPole.statTable,
      statBlock: STAT_BLOCK,
      settings,
      passiveOn: false,
      artifactSets: { SilkenMoonsSerenade: 4 },
      setRegistry,
      levels: LEVELS,
      talents: TALENTS,
      enemy: ENEMY,
    });
    const features: Record<string, { normal: number }> = {};
    for (const [key, fn] of Object.entries(compiled)) {
      features[key] = fn(context) as { normal: number };
    }
    const got = features[row!.feature]!.normal;
    expect(got).toBeCloseTo(row!.ourRatio, 6);
  });

  it("night: reaction.lunarcharged_contrubution matches frozen fixture (absolute)", () => {
    const [row] = loadFixture("night-gate.json");
    const features = runPort(
      nightOfTheSkysUnveiling,
      "NightOfTheSkysUnveiling",
      "set.night_of_the_skys_unveiling_4",
    );
    const got = features[row!.feature]!.normal;
    expect(got).toBeCloseTo(row!.ourRatio, 6);
  });
});

// ── teammate-buff regression lock ─────────────────────────────────────────────
// Flins (recipient) wears NOTHING; the set buff arrives via party.setOther.
// Mirrors the gate-reps.mjs "night-team" and "silken-team" GCSim gate builds exactly.

/** Shared resolver: setOther-only builds need no member resolution. */
const noMemberResolver = (s: string): never => {
  throw new Error("no party members: " + s);
};

describe("v6.x set gate — port reproduces frozen ourRatio, teammate path (GCSim-free regression lock)", () => {
  it("night-team: reaction.lunarcharged_contrubution matches frozen fixture (absolute)", () => {
    const [row] = loadFixture("night-team-gate.json");

    const settings = reconstructSettings({
      charToggles: {},
      setToggles: {},
      passiveToggles: {},
      constellation: 0,
      refine: 1,
    });

    const { compiled, context } = reconstructPort({
      char: flins,
      weapon: blackcliffPole,
      weaponStatTable: blackcliffPole.statTable,
      statBlock: STAT_BLOCK,
      settings,
      passiveOn: false,
      artifactSets: {},
      setRegistry: {},
      party: { setOther: { night_of_the_skys_unveiling_4: true } },
      partySlugResolver: noMemberResolver,
      levels: LEVELS,
      talents: TALENTS,
      enemy: ENEMY,
    });

    const features: Record<string, { normal: number }> = {};
    for (const [key, fn] of Object.entries(compiled)) {
      features[key] = fn(context) as { normal: number };
    }

    const got = features[row!.feature]!.normal;
    expect(got).toBeCloseTo(row!.ourRatio, 6);
  });

  it("silken-team: reaction.lunarcharged_contrubution matches frozen fixture (absolute)", () => {
    const [row] = loadFixture("silken-team-gate.json");

    // Silken's team react+EM gates on moonsign_1; the +60 EM increment gates on moonsign_2.
    const settings = reconstructSettings({
      charToggles: { moonsign_1: true, moonsign_2: true },
      setToggles: {},
      passiveToggles: {},
      constellation: 0,
      refine: 1,
    });

    const { compiled, context } = reconstructPort({
      char: flins,
      weapon: blackcliffPole,
      weaponStatTable: blackcliffPole.statTable,
      statBlock: STAT_BLOCK,
      settings,
      passiveOn: false,
      artifactSets: {},
      setRegistry: {},
      party: { setOther: { silken_moons_serenade_4: true } },
      partySlugResolver: noMemberResolver,
      levels: LEVELS,
      talents: TALENTS,
      enemy: ENEMY,
    });

    const features: Record<string, { normal: number }> = {};
    for (const [key, fn] of Object.entries(compiled)) {
      features[key] = fn(context) as { normal: number };
    }

    const got = features[row!.feature]!.normal;
    expect(got).toBeCloseTo(row!.ourRatio, 6);
  });
});
