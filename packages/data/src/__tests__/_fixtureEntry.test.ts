import { describe, it, expect } from "vitest";
import {
  isDamageTripleEntry,
  isAssertableOutput,
  isNonDamageOutput,
  type FixtureEntry,
} from "./_fixtureEntry.js";

// Real shapes copied from tests/golden/fixtures/hu_tao.json.
const damage: FixtureEntry = {
  category: "attack", damageType: "normal",
  normal: 739.77, crit: 2171.44, average: 882.94, isReacted: false, format: "",
};
const heal: FixtureEntry = {
  category: "burst", damageType: "",
  normal: 2935.39, crit: 2935.39, average: 2935.39, isReacted: false, format: "",
};
const statReadout: FixtureEntry = {
  category: "stats", damageType: "",
  normal: 1754.71, crit: 1754.71, average: 1754.71, isReacted: false, format: "",
};

describe("_fixtureEntry predicates", () => {
  it("isDamageTripleEntry: only non-stats with a damageType", () => {
    expect(isDamageTripleEntry(damage)).toBe(true);
    expect(isDamageTripleEntry(heal)).toBe(false);
    expect(isDamageTripleEntry(statReadout)).toBe(false);
  });
  it("isAssertableOutput: everything except stats readouts", () => {
    expect(isAssertableOutput(damage)).toBe(true);
    expect(isAssertableOutput(heal)).toBe(true);
    expect(isAssertableOutput(statReadout)).toBe(false);
  });
  it("isNonDamageOutput: assertable but not a damage triple (heal/shield/crystallize/static)", () => {
    expect(isNonDamageOutput(heal)).toBe(true);
    expect(isNonDamageOutput(damage)).toBe(false);
    expect(isNonDamageOutput(statReadout)).toBe(false);
  });
});
