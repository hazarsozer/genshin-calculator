import { describe, it, expect } from "vitest";
import { buildStats, compileCharacter, bennett } from "@genshin/data";

describe("engine consumption spike", () => {
  it("computes a Bennett normal_hit_1 triple > 0 from the app package boundary", () => {
    const { context, settings } = buildStats({
      char: bennett,
      weaponStatTable: [],
      statBlock: {},
      levels: { charLevel: 90, ascension: 6, weaponLevel: 90, weaponAscension: 6 },
      enemy: { level: 90, resistance: 10 },
      talentLevels: { attack: 10, elemental: 10, burst: 10 },
    });
    const compiled = compileCharacter(bennett, {
      charElement: bennett.element,
      talentLevels: { attack: 10, elemental: 10, burst: 10 },
      settings,
      charLevel: 90,
    });
    // CompiledFeature returns DamageResult = { normal, crit, avg } — always an object, never an array.
    const triple = compiled["attack.normal_hit_1"](context);
    expect(triple.normal).toBeGreaterThan(0);
  });
});
