/**
 * assembleBuild — unit tests + end-to-end smoke.
 *
 * Validation note: there is NO oracle fixture for "5 real artifacts → stat bag"
 * because Aspirine's oracle deliberately equips artifacts with mainStat='' and
 * no substats (build-configs.mjs) to isolate set bonuses. This test is therefore
 * UNIT-VALIDATED — each stat sums correctly via the bijective GOOD↔Aspirine map,
 * and the assembled bag flows cleanly through buildStats → compileCharacter to
 * yield finite, sane damage numbers. No oracle match is asserted.
 *
 * Main-stat values used below are from Aspirine's Mainstats.js:
 *   5★ flower  @+20 hp        → 4780  (StatTableArtifact[4][20])
 *   5★ plume   @+20 atk       → 311   (StatTableArtifact[4][20])
 *   5★ sands   @+20 atk_      → 46.6  (StatTableArtifact[4][20])
 *   5★ goblet  @+20 pyro_dmg_ → 46.6  (StatTableArtifact[4][20])
 *   5★ circlet @+20 critDMG_  → 62.2  (StatTableArtifact[4][20])
 *
 * setKey values use the goodId (registry key) as documented in DbObjectArtifactSet:
 *   "CrimsonWitch" (GOOD: "CrimsonWitchOfFlames") — follows Aspirine's key.
 */

import { describe, it, expect } from "vitest";
import { assembleArtifactStats, detectSets } from "../assembleBuild.js";
import { buildStats } from "../buildStats.js";
import { compileCharacter } from "../loader.js";
import { huTao } from "../characters/hu-tao.js";
import { blackcliffPoleStatTable } from "../generated/weaponStatTables.js";
import type { Artifact } from "@genshin/types";

// ---------------------------------------------------------------------------
// Fixture: a representative 5-piece build (Crimson Witch 4pc + 1 off-piece)
//
// Main-stat values at +20 (5★ rarity) taken verbatim from
// raw/genshin_calc_pub/src/js/db/Artifacts/Mainstats.js:
//   hp       flower  → 4780
//   atk      plume   → 311
//   atk_     sands   → 46.6
//   pyro_dmg_ goblet → 46.6
//   critDMG_ circlet → 62.2
// ---------------------------------------------------------------------------

const CRIMSON_FLOWER: Artifact = {
  slot: "flower",
  setKey: "CrimsonWitch",
  rarity: 5,
  level: 20,
  mainStatKey: "hp",
  mainStatValue: 4780,
  subStats: [
    { key: "atk_",     value: 5.8 },
    { key: "critRate_", value: 3.5 },
    { key: "critDMG_", value: 7.0 },
    { key: "atk",      value: 19  },
  ],
};

const CRIMSON_PLUME: Artifact = {
  slot: "plume",
  setKey: "CrimsonWitch",
  rarity: 5,
  level: 20,
  mainStatKey: "atk",
  mainStatValue: 311,
  subStats: [
    { key: "hp_",       value: 4.1  },
    { key: "critRate_", value: 3.9  },
    { key: "critDMG_",  value: 14.0 },
    { key: "atk_",      value: 5.8  },
  ],
};

const CRIMSON_SANDS: Artifact = {
  slot: "sands",
  setKey: "CrimsonWitch",
  rarity: 5,
  level: 20,
  mainStatKey: "atk_",
  mainStatValue: 46.6,
  subStats: [
    { key: "hp",        value: 508  },
    { key: "critRate_", value: 3.1  },
    { key: "critDMG_",  value: 7.8  },
    { key: "eleMas",    value: 21   },
  ],
};

// Goblet from a different set (Shimenawa's Reminiscence — the "off-piece")
const SHIME_GOBLET: Artifact = {
  slot: "goblet",
  setKey: "ShimenawasReminiscence",
  rarity: 5,
  level: 20,
  mainStatKey: "pyro_dmg_",
  mainStatValue: 46.6,
  subStats: [
    { key: "hp_",       value: 4.7  },
    { key: "atk_",      value: 4.1  },
    { key: "critRate_", value: 3.5  },
    { key: "critDMG_",  value: 6.2  },
  ],
};

const CRIMSON_CIRCLET: Artifact = {
  slot: "circlet",
  setKey: "CrimsonWitch",
  rarity: 5,
  level: 20,
  mainStatKey: "critDMG_",
  mainStatValue: 62.2,
  subStats: [
    { key: "hp",        value: 299  },
    { key: "atk",       value: 19   },
    { key: "atk_",      value: 4.7  },
    { key: "critRate_", value: 6.6  },
  ],
};

const FIVE_PIECES: readonly Artifact[] = [
  CRIMSON_FLOWER,
  CRIMSON_PLUME,
  CRIMSON_SANDS,
  SHIME_GOBLET,
  CRIMSON_CIRCLET,
];

// ---------------------------------------------------------------------------
// assembleArtifactStats — stat-sum unit tests
// ---------------------------------------------------------------------------

describe("assembleArtifactStats", () => {
  it("sums hp across flower main + relevant substats", () => {
    const bag = assembleArtifactStats(FIVE_PIECES);
    // flower mainStatValue=4780 + CRIMSON_SANDS sub hp=508 + CRIMSON_CIRCLET sub hp=299
    expect(bag["hp"]).toBeCloseTo(4780 + 508 + 299, 5);
  });

  it("sums atk (flat) across plume main + substats", () => {
    const bag = assembleArtifactStats(FIVE_PIECES);
    // plume mainStatValue=311 + flower sub atk=19 + circlet sub atk=19
    expect(bag["atk"]).toBeCloseTo(311 + 19 + 19, 5);
  });

  it("sums atk_percent (%) correctly as whole numbers (no pre-divide)", () => {
    const bag = assembleArtifactStats(FIVE_PIECES);
    // sands main 46.6 + flower 5.8 + plume 5.8 + shime 4.1 + circlet 4.7
    const expected = 46.6 + 5.8 + 5.8 + 4.1 + 4.7;
    expect(bag["atk_percent"]).toBeCloseTo(expected, 5);
  });

  it("maps pyro_dmg_ goblet main to dmg_pyro (Aspirine key)", () => {
    const bag = assembleArtifactStats(FIVE_PIECES);
    // only the goblet main contributes pyro dmg — 46.6
    expect(bag["dmg_pyro"]).toBeCloseTo(46.6, 5);
  });

  it("sums crit_dmg (%) from circlet main + all substat rolls", () => {
    const bag = assembleArtifactStats(FIVE_PIECES);
    // circlet main 62.2 + flower 7.0 + plume 14.0 + sands 7.8 + shime 6.2
    const expected = 62.2 + 7.0 + 14.0 + 7.8 + 6.2;
    expect(bag["crit_dmg"]).toBeCloseTo(expected, 5);
  });

  it("sums crit_rate from all substat rolls (no main-stat contributor)", () => {
    const bag = assembleArtifactStats(FIVE_PIECES);
    // flower 3.5 + plume 3.9 + sands 3.1 + shime 3.5 + circlet 6.6
    const expected = 3.5 + 3.9 + 3.1 + 3.5 + 6.6;
    expect(bag["crit_rate"]).toBeCloseTo(expected, 5);
  });

  it("sums elemental mastery from only the sands substat", () => {
    const bag = assembleArtifactStats(FIVE_PIECES);
    expect(bag["mastery"]).toBeCloseTo(21, 5);
  });

  it("sums hp_percent (%) from all substat rolls", () => {
    const bag = assembleArtifactStats(FIVE_PIECES);
    // plume 4.1 + shime 4.7
    const expected = 4.1 + 4.7;
    expect(bag["hp_percent"]).toBeCloseTo(expected, 5);
  });

  it("does not pre-divide percents (atk_percent stays 46.6, not 0.466)", () => {
    const bag = assembleArtifactStats(FIVE_PIECES);
    // Sanity: atk_percent should be a number > 1, never a fraction.
    expect(bag["atk_percent"]!).toBeGreaterThan(1);
  });

  it("omits a key when no artifact contributes it", () => {
    const bag = assembleArtifactStats(FIVE_PIECES);
    // No artifact in our fixture has enerRech_ (recharge) as main or sub
    expect(bag["recharge"]).toBeUndefined();
  });

  it("single artifact (1-piece) sums correctly", () => {
    const bag = assembleArtifactStats([CRIMSON_FLOWER]);
    expect(bag["hp"]).toBeCloseTo(4780, 5);
    expect(bag["atk_percent"]).toBeCloseTo(5.8, 5);
    expect(bag["crit_rate"]).toBeCloseTo(3.5, 5);
    expect(bag["crit_dmg"]).toBeCloseTo(7.0, 5);
    expect(bag["atk"]).toBeCloseTo(19, 5);
  });

  it("empty artifact list returns an empty bag", () => {
    const bag = assembleArtifactStats([]);
    expect(Object.keys(bag)).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// detectSets — piece counting unit tests
// ---------------------------------------------------------------------------

describe("detectSets", () => {
  it("counts 4 Crimson Witch + 1 Shimenawa correctly", () => {
    const sets = detectSets(FIVE_PIECES);
    // Registry goodId keys: "CrimsonWitch" (not "CrimsonWitchOfFlames"), "ShimenawasReminiscence"
    const cw = sets.find((s) => s.setKey === "CrimsonWitch");
    const sh = sets.find((s) => s.setKey === "ShimenawasReminiscence");
    expect(cw?.pieces).toBe(4);
    expect(sh?.pieces).toBe(1);
    expect(sets).toHaveLength(2);
  });

  it("counts 5 of the same set as 5 pieces", () => {
    const fiveNoblesse: readonly Artifact[] = Array.from({ length: 5 }, (_, i) => ({
      slot: ["flower", "plume", "sands", "goblet", "circlet"][i]! as "flower",
      setKey: "NoblesseOblige",
      rarity: 5 as const,
      level: 20,
      mainStatKey: "hp" as const,
      mainStatValue: 4780,
      subStats: [],
    }));
    const sets = detectSets(fiveNoblesse);
    expect(sets).toHaveLength(1);
    expect(sets[0]!.setKey).toBe("NoblesseOblige");
    expect(sets[0]!.pieces).toBe(5);
  });

  it("counts 5 different sets as 5 × 1-piece entries", () => {
    const allDifferent: readonly Artifact[] = [
      { ...CRIMSON_FLOWER,  setKey: "NoblesseOblige"          },
      { ...CRIMSON_PLUME,   setKey: "EmblemofSeveredFate"     },
      { ...CRIMSON_SANDS,   setKey: "DeepwoodMemories"        },
      { ...SHIME_GOBLET,    setKey: "GildedDreams"            },
      { ...CRIMSON_CIRCLET, setKey: "ThunderingFury"          },
    ];
    const sets = detectSets(allDifferent);
    expect(sets).toHaveLength(5);
    for (const s of sets) expect(s.pieces).toBe(1);
  });

  it("returns empty array for no artifacts", () => {
    expect(detectSets([])).toHaveLength(0);
  });

  it("setKey passes through unchanged (registry goodId key, not GOOD display name)", () => {
    const sets = detectSets(FIVE_PIECES);
    const keys = sets.map((s) => s.setKey);
    // "CrimsonWitch" is the goodId (Aspirine's key); GOOD uses "CrimsonWitchOfFlames"
    expect(keys).toContain("CrimsonWitch");
    expect(keys).toContain("ShimenawasReminiscence");
  });
});

// ---------------------------------------------------------------------------
// End-to-end smoke — assembled bag flows through buildStats → compileCharacter
//
// No oracle match. Just verifies the pipeline composes and outputs finite,
// sane numbers for a real 5-artifact build.
// ---------------------------------------------------------------------------

describe("end-to-end smoke: 5 artifacts → buildStats → compileCharacter", () => {
  it("produces finite, positive damage numbers for Hu Tao normal_hit_1", () => {
    const statBlock = assembleArtifactStats(FIVE_PIECES);
    const sets = detectSets(FIVE_PIECES);

    const { context, settings } = buildStats({
      char: huTao,
      weaponStatTable: blackcliffPoleStatTable,
      statBlock,
      levels: {
        charLevel: 90,
        ascension: 6,
        weaponLevel: 90,
        weaponAscension: 6,
      },
      enemy: { level: 90, resistance: 10 },
      setBonuses: sets,
      settings: {},
    });

    const compiled = compileCharacter(huTao, {
      charElement: huTao.element,
      talentLevels: { attack: 10, elemental: 10, burst: 10 },
      settings,
    });

    const normal1 = compiled["attack.normal_hit_1"];
    expect(normal1).toBeDefined();
    const result = normal1!(context);

    // Sanity: every output is a finite positive number.
    expect(Number.isFinite(result.normal)).toBe(true);
    expect(Number.isFinite(result.crit)).toBe(true);
    expect(Number.isFinite(result.avg)).toBe(true);
    expect(result.normal).toBeGreaterThan(0);
    expect(result.crit).toBeGreaterThan(result.normal); // crit > normal always
    expect(result.avg).toBeGreaterThan(result.normal);
    expect(result.avg).toBeLessThan(result.crit);
  });

  it("set bonuses take effect (3-stat check via Crimson Witch 2pc +15 pyro)", () => {
    // With vs without set bonuses — CW 2pc adds dmg_pyro +15 (unconditional).
    // Because the normal hit is Physical/Pyro depending on Paramita state,
    // we verify that the bag with sets has pyro damage registered.
    const statBlock = assembleArtifactStats(FIVE_PIECES);
    const sets = detectSets(FIVE_PIECES);

    const withSets = buildStats({
      char: huTao,
      weaponStatTable: blackcliffPoleStatTable,
      statBlock,
      levels: { charLevel: 90, ascension: 6, weaponLevel: 90, weaponAscension: 6 },
      enemy: { level: 90, resistance: 10 },
      setBonuses: sets,
      settings: {},
    });

    const withoutSets = buildStats({
      char: huTao,
      weaponStatTable: blackcliffPoleStatTable,
      statBlock,
      levels: { charLevel: 90, ascension: 6, weaponLevel: 90, weaponAscension: 6 },
      enemy: { level: 90, resistance: 10 },
      settings: {},
    });

    // CW 2pc grants 15% pyro dmg (dmg_pyro) — emitted as fraction 0.15
    const pyroWithSets    = (withSets.stats as Record<string, number>)["dmg_pyro"] ?? 0;
    const pyroWithoutSets = (withoutSets.stats as Record<string, number>)["dmg_pyro"] ?? 0;
    // Our goblet contributes pyro_dmg_ 46.6 in both cases; with sets the 2pc adds 15 more.
    expect(pyroWithSets).toBeGreaterThan(pyroWithoutSets);
    // The difference should be 0.15 (the 2pc bonus / 100).
    expect(pyroWithSets - pyroWithoutSets).toBeCloseTo(0.15, 4);
  });
});
