import { describe, it, expect } from "vitest";
import { arlecchino } from "../characters/arlecchino.js";
import { clorinde } from "../characters/clorinde.js";
import { crimsonMoonsSemblance } from "../weapons/crimson-moons-semblance.js";
import { flowingPurity } from "../weapons/flowing-purity.js";
import { finaleOfTheDeep } from "../weapons/finale-of-the-deep.js";
import { CHARACTER_CONDITIONS } from "../characterConditions.js";
import { neuvillette } from "../characters/neuvillette.js";

const hasBoLInputKey = (
  conds: readonly { type: string; name?: string; noStat?: boolean; max?: number }[],
  key: string,
) => conds.some((c) => c.type === "number" && c.name === key && c.noStat === true && c.max === 200);

describe("Bond of Life — per-owner input ownership", () => {
  it("the global emit carries stat:'bond_of_life' and max 200", () => {
    const emit = CHARACTER_CONDITIONS.find(
      (c) => (c as { name?: string }).name === "common.bond_of_life" && (c as { stat?: string }).stat !== undefined,
    );
    expect(emit).toMatchObject({ stat: "bond_of_life", max: 200 });
  });
  it("character owners declare the shared common.bond_of_life input slider", () => {
    expect(hasBoLInputKey(arlecchino.conditions ?? [], "common.bond_of_life")).toBe(true);
    expect(hasBoLInputKey(clorinde.conditions ?? [], "common.bond_of_life")).toBe(true);
  });
  it("Crimson Moon's Semblance declares the shared common.bond_of_life input slider", () => {
    expect(hasBoLInputKey(crimsonMoonsSemblance.conditions ?? [], "common.bond_of_life")).toBe(true);
  });
  it("Flowing Purity declares its OWN weapon_flowing_purity_bol input slider", () => {
    expect(hasBoLInputKey(flowingPurity.conditions ?? [], "weapon_flowing_purity_bol")).toBe(true);
  });
  it("Finale of the Deep declares its OWN weapon_finale_of_the_deep_bol input slider", () => {
    expect(hasBoLInputKey(finaleOfTheDeep.conditions ?? [], "weapon_finale_of_the_deep_bol")).toBe(true);
  });
});

describe("Neuvillette discipline — owned by Neuvillette", () => {
  const KEY = "neuvillette_the_high_arbitrators_discipline";
  it("Neuvillette declares the discipline slider", () => {
    expect((neuvillette.conditions ?? []).some((c) => c.type === "number" && (c as { name?: string }).name === KEY)).toBe(true);
  });
  it("the discipline slider is no longer in the global registry", () => {
    expect(CHARACTER_CONDITIONS.some((c) => (c as { name?: string }).name === KEY)).toBe(false);
  });
  it("the discipline slider has max 1_000_000 and is NOT noStat", () => {
    const cond = (neuvillette.conditions ?? []).find((c) => (c as { name?: string }).name === KEY);
    expect(cond).toBeDefined();
    expect((cond as { max?: number }).max).toBe(1_000_000);
    expect((cond as { noStat?: boolean }).noStat).not.toBe(true);
  });
});
