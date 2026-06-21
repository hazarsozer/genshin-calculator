import { describe, it, expect } from "vitest";
import { assembleFromGood, assembleFromManual } from "../artifacts.js";

const minimalGood = JSON.stringify({
  format: "GOOD", version: 2, source: "test",
  artifacts: [{
    setKey: "GladiatorsFinale", slotKey: "flower", level: 20, rarity: 5,
    mainStatKey: "hp", location: "", lock: false,
    substats: [{ key: "atk_", value: 5.8 }, { key: "critRate_", value: 3.1 }],
  }],
});

describe("artifact input", () => {
  it("parses GOOD and derives a raw-percent statBlock + setBonuses", () => {
    const { statBlock, setBonuses, error } = assembleFromGood(minimalGood);
    expect(error).toBeUndefined();
    expect(Object.keys(statBlock).length).toBeGreaterThan(0);
    expect(setBonuses).toContainEqual({ setKey: "GladiatorsFinale", pieces: 1 });
  });
  it("returns a friendly error on malformed GOOD (no throw)", () => {
    expect(assembleFromGood("{ not json").error).toBeTruthy();
    expect(assembleFromGood(JSON.stringify({ format: "WRONG" })).error).toBeTruthy();
  });
  it("manual mode passes raw-percent stats straight through", () => {
    const out = assembleFromManual({ atk_percent: 46.6, crit_rate: 31.1 }, [{ setKey: "CrimsonWitchOfFlames", pieces: 4 }]);
    expect(out.statBlock.atk_percent).toBe(46.6);
    expect(out.setBonuses).toHaveLength(1);
  });
});
