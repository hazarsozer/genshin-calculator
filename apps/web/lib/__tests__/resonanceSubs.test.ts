import { describe, it, expect } from "vitest";
import { resonatingElements, partitionResonanceSubs } from "../resonanceSubs.js";
import type { ConditionControl } from "../conditions.js";

const ctrl = (name: string): ConditionControl => ({ name, kind: "boolean", label: name });

describe("resonatingElements", () => {
  it("returns elements present >= 2 times", () => {
    expect(resonatingElements(["geo", "geo", "pyro"])).toEqual(new Set(["geo"]));
    expect(resonatingElements(["geo", "dendro", "dendro", "geo"])).toEqual(new Set(["geo", "dendro"]));
    expect(resonatingElements(["geo", "pyro", "hydro", "cryo"])).toEqual(new Set());
  });
});

describe("partitionResonanceSubs", () => {
  const subs = [ctrl("common.char_status_shield"), ctrl("buffs.resonance_geo_attack"), ctrl("buffs.resonance_dendro_1"), ctrl("buffs.resonance_dendro_2")];
  const other = ctrl("imaginarium_theatre");
  it("surfaces geo subs only when geo resonates", () => {
    const { resonanceSubs, rest } = partitionResonanceSubs([...subs, other], new Set(["geo"]));
    expect(resonanceSubs.map((c) => c.name)).toEqual(["common.char_status_shield", "buffs.resonance_geo_attack"]);
    expect(rest.map((c) => c.name)).toEqual(["imaginarium_theatre"]);
  });
  it("hides all resonance subs when nothing resonates", () => {
    const { resonanceSubs, rest } = partitionResonanceSubs([...subs, other], new Set());
    expect(resonanceSubs).toEqual([]);
    expect(rest.map((c) => c.name)).toEqual(["imaginarium_theatre"]);
  });
});
