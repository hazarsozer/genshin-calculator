import { describe, expect, it } from "vitest";
import {
  aspirineToGood,
  goodToAspirine,
  GOOD_STAT_KEYS,
  ASPIRINE_STAT_KEYS,
} from "../stats.js";

describe("GOOD stat key maps", () => {
  it("aspirineToGood covers all ASPIRINE_STAT_KEYS", () => {
    for (const key of ASPIRINE_STAT_KEYS) {
      expect(aspirineToGood[key], `aspirineToGood["${key}"] missing`).toBeDefined();
    }
  });

  it("goodToAspirine covers all GOOD_STAT_KEYS", () => {
    for (const key of GOOD_STAT_KEYS) {
      expect(goodToAspirine[key], `goodToAspirine["${key}"] missing`).toBeDefined();
    }
  });

  it("aspirineToGood → goodToAspirine round-trips for all core stats", () => {
    for (const aKey of ASPIRINE_STAT_KEYS) {
      const gKey = aspirineToGood[aKey];
      expect(goodToAspirine[gKey]).toBe(aKey);
    }
  });

  it("goodToAspirine → aspirineToGood round-trips for all core stats", () => {
    for (const gKey of GOOD_STAT_KEYS) {
      const aKey = goodToAspirine[gKey];
      expect(aspirineToGood[aKey]).toBe(gKey);
    }
  });

  it("GOOD_STAT_KEYS and ASPIRINE_STAT_KEYS have the same length (bijection)", () => {
    expect(GOOD_STAT_KEYS.length).toBe(ASPIRINE_STAT_KEYS.length);
  });

  it("maps contain the expected core stats spot-check", () => {
    expect(aspirineToGood["crit_rate"]).toBe("critRate_");
    expect(aspirineToGood["crit_dmg"]).toBe("critDMG_");
    expect(aspirineToGood["mastery"]).toBe("eleMas");
    expect(aspirineToGood["recharge"]).toBe("enerRech_");
    expect(aspirineToGood["dmg_pyro"]).toBe("pyro_dmg_");
    expect(goodToAspirine["hp_"]).toBe("hp_percent");
    expect(goodToAspirine["atk_"]).toBe("atk_percent");
    expect(goodToAspirine["def_"]).toBe("def_percent");
  });
});
