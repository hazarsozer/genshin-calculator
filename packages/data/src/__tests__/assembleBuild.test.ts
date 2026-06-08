/**
 * assembleBuild — unit tests + end-to-end smoke.
 *
 * assembleArtifactStats now DERIVES each main from the ported per-rarity/level Mainstats
 * table and SNAPS each sub via the exact getPreciseValue dictionary (generated/
 * artifactTables.ts), so the pieces below carry only RAW GOOD fields (rarity/level/slot/
 * main-KEY/substat display rolls) — NO caller-supplied mainStatValue. The expected sums
 * fold the table-derived main + the SNAPPED substat values (e.g. critRate_ 6.6 → 6.61,
 * atk 19 → 19.45). The metric-for-metric golden floor under this path lives in
 * assemblyGolden.test.ts (the `assembly` oracle config); this file stays a unit + smoke
 * check of the sum/snap arithmetic and the end-to-end compose.
 *
 * Main-stat values derived below are from Aspirine's Mainstats.js (5★ +20, idx 20):
 *   flower hp 4780 / plume atk 311 / sands atk_ 46.6 / goblet pyro_dmg_ 46.6 / circlet critDMG_ 62.2.
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
  it("derives hp from the 5★+20 flower-main table + snapped substats", () => {
    const bag = assembleArtifactStats(FIVE_PIECES);
    // flower main (table 5★+20 hp)=4780 + sands sub hp 508→507.88 + circlet sub hp 299→298.75
    expect(bag["hp"]).toBeCloseTo(4780 + 507.88 + 298.75, 5);
  });

  it("derives atk (flat) from plume-main table + snapped substats", () => {
    const bag = assembleArtifactStats(FIVE_PIECES);
    // plume main (table)=311 + flower sub atk 19→19.45 + circlet sub atk 19→19.45
    expect(bag["atk"]).toBeCloseTo(311 + 19.45 + 19.45, 5);
  });

  it("derives atk_percent (%) as whole numbers (snapped, no pre-divide)", () => {
    const bag = assembleArtifactStats(FIVE_PIECES);
    // sands main (table) 46.6 + snapped subs: flower 5.8→5.83 + plume 5.8→5.83 + shime 4.1→4.08 + circlet 4.7→4.66
    const expected = 46.6 + 5.83 + 5.83 + 4.08 + 4.66;
    expect(bag["atk_percent"]).toBeCloseTo(expected, 5);
  });

  it("maps pyro_dmg_ goblet main to dmg_pyro (Aspirine key, table-derived)", () => {
    const bag = assembleArtifactStats(FIVE_PIECES);
    // only the goblet main contributes pyro dmg — table 5★+20 pyro_dmg_ = 46.6
    expect(bag["dmg_pyro"]).toBeCloseTo(46.6, 5);
  });

  it("derives crit_dmg (%) from circlet-main table + snapped substat rolls", () => {
    const bag = assembleArtifactStats(FIVE_PIECES);
    // circlet main (table) 62.2 + snapped subs: 7.0→6.99 + 14.0→13.985 + 7.8→7.77 + 6.2→6.22
    const expected = 62.2 + 6.99 + 13.985 + 7.77 + 6.22;
    expect(bag["crit_dmg"]).toBeCloseTo(expected, 5);
  });

  it("sums snapped crit_rate from all substat rolls (no main-stat contributor)", () => {
    const bag = assembleArtifactStats(FIVE_PIECES);
    // snapped: flower 3.5→3.5 + plume 3.9→3.89 + sands 3.1→3.11 + shime 3.5→3.5 + circlet 6.6→6.61
    const expected = 3.5 + 3.89 + 3.11 + 3.5 + 6.61;
    expect(bag["crit_rate"]).toBeCloseTo(expected, 5);
  });

  it("snaps elemental mastery from only the sands substat", () => {
    const bag = assembleArtifactStats(FIVE_PIECES);
    // sands sub eleMas 21 → 20.98 (5★ snap)
    expect(bag["mastery"]).toBeCloseTo(20.98, 5);
  });

  it("sums snapped hp_percent (%) from all substat rolls", () => {
    const bag = assembleArtifactStats(FIVE_PIECES);
    // plume 4.1→4.08 + shime 4.7→4.66
    const expected = 4.08 + 4.66;
    expect(bag["hp_percent"]).toBeCloseTo(expected, 5);
  });

  it("does not pre-divide percents (atk_percent stays > 1, not a fraction)", () => {
    const bag = assembleArtifactStats(FIVE_PIECES);
    // Sanity: atk_percent should be a number > 1, never a fraction.
    expect(bag["atk_percent"]!).toBeGreaterThan(1);
  });

  it("omits a key when no artifact contributes it", () => {
    const bag = assembleArtifactStats(FIVE_PIECES);
    // No artifact in our fixture has enerRech_ (recharge) as main or sub
    expect(bag["recharge"]).toBeUndefined();
  });

  it("single artifact (1-piece) derives + snaps correctly", () => {
    const bag = assembleArtifactStats([CRIMSON_FLOWER]);
    expect(bag["hp"]).toBeCloseTo(4780, 5);          // table main
    expect(bag["atk_percent"]).toBeCloseTo(5.83, 5); // 5.8 → 5.83
    expect(bag["crit_rate"]).toBeCloseTo(3.5, 5);    // 3.5 → 3.5 (dict-exact)
    expect(bag["crit_dmg"]).toBeCloseTo(6.99, 5);    // 7.0 → 6.99
    expect(bag["atk"]).toBeCloseTo(19.45, 5);        // 19 → 19.45
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
