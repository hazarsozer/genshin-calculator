import { describe, it, expect } from "vitest";
import { arlecchino } from "../characters/arlecchino.js";
import { clorinde } from "../characters/clorinde.js";
import { crimsonMoonsSemblance } from "../weapons/crimson-moons-semblance.js";
import { flowingPurity } from "../weapons/flowing-purity.js";
import { finaleOfTheDeep } from "../weapons/finale-of-the-deep.js";
import { BOND_OF_LIFE_INPUT } from "../characterConditions.js";

const hasBoLInput = (conds: readonly { type: string; name?: string; noStat?: boolean; max?: number }[]) =>
  conds.some((c) => c.type === "number" && c.name === "common.bond_of_life" && c.noStat === true && c.max === 200);

describe("Bond of Life — per-owner input ownership", () => {
  it("the shared input is noStat with max 200", () => {
    expect(BOND_OF_LIFE_INPUT).toMatchObject({ type: "number", name: "common.bond_of_life", noStat: true, max: 200 });
  });
  it("each BoL owner declares the input slider", () => {
    expect(hasBoLInput(arlecchino.conditions ?? [])).toBe(true);
    expect(hasBoLInput(clorinde.conditions ?? [])).toBe(true);
    expect(hasBoLInput(crimsonMoonsSemblance.conditions ?? [])).toBe(true);
    expect(hasBoLInput(flowingPurity.conditions ?? [])).toBe(true);
    expect(hasBoLInput(finaleOfTheDeep.conditions ?? [])).toBe(true);
  });
});
