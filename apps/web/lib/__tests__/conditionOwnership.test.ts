import { describe, it, expect } from "vitest";
import { ALL_CHARACTERS, ALL_WEAPONS } from "@genshin/data";
import { collectGroupedConditions } from "../conditions.js";

const char = (n: string) => ALL_CHARACTERS.find((c) => c.name === n)!;
const weapon = (n: string) => ALL_WEAPONS.find((w) => w.name === n)!;
const names = (cs: { name: string }[]) => cs.map((c) => c.name);

describe("ownership routing", () => {
  it("BoL renders under the active char when Arlecchino, not in global", () => {
    const g = collectGroupedConditions(char("arlecchino"), weapon("crimson_moons_semblance"), []);
    expect(names(g.self)).toContain("common.bond_of_life");
    expect(names(g.global)).not.toContain("common.bond_of_life");
  });
  it("BoL renders under the weapon when a BoL weapon is on a non-owner char", () => {
    const g = collectGroupedConditions(char("hu_tao"), weapon("crimson_moons_semblance"), []);
    expect(names(g.weapon)).toContain("common.bond_of_life");
    expect(names(g.global)).not.toContain("common.bond_of_life");
  });
  it("Neuvillette discipline renders under the active char, not global", () => {
    const g = collectGroupedConditions(char("neuvillette"), weapon("the_first_great_magic"), []);
    expect(names(g.self)).toContain("neuvillette_the_high_arbitrators_discipline");
    expect(names(g.global)).not.toContain("neuvillette_the_high_arbitrators_discipline");
  });
  it("no BoL slider for a char/weapon that doesn't own it", () => {
    const g = collectGroupedConditions(char("hu_tao"), weapon("staff_of_homa"), []);
    const all = [...g.self, ...g.weapon, ...g.set, ...g.global].map((c) => c.name);
    expect(all).not.toContain("common.bond_of_life");
  });
});
