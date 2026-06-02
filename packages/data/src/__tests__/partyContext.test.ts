import { describe, it, expect } from "vitest";
import { buildPartyContext } from "../partyContext.js";

describe("buildPartyContext — element counts (CalcElements.js:4-51)", () => {
  it("counts distinct elements incl. active char; same/different over teammates only", () => {
    const ctx = buildPartyContext(
      { members: [{ element: "pyro", origin: "liyue" }, { element: "hydro", origin: "mondstadt" }] },
      { element: "pyro", origin: "liyue" }
    );
    expect(ctx.party_elements_count_level).toBe(2);
    expect(ctx.party_elements_same).toBe(1);
    expect(ctx.party_elements_same_inc).toBe(2);
    expect(ctx.party_elements_different).toBe(1);
    expect(ctx.party_elements_different_total).toBe(2);
    expect(ctx.party_size).toBe(3);
  });

  it("origin counts over teammates; same_inc = same + 1 (CalcOrigin.js)", () => {
    const ctx = buildPartyContext(
      { members: [{ element: "geo", origin: "liyue" }, { element: "anemo", origin: "mondstadt" }] },
      { element: "pyro", origin: "liyue" }
    );
    expect(ctx.party_origin_same).toBe(1);
    expect(ctx.party_origin_same_inc).toBe(2);
    expect(ctx.party_origin_different).toBe(1);
  });

  it("passes raw inputs through unchanged", () => {
    const ctx = buildPartyContext(
      { members: [{ element: "hydro", origin: "fontaine" }], enemyStatus: "cryo", bondOfLife: 0.5,
        setOther: ["noblesse_oblige_4"] },
      { element: "cryo", origin: "natlan" }
    );
    expect(ctx.resonance_element_1).toBe("hydro");
    expect(ctx["common.enemy_status"]).toBe("cryo");
    expect(ctx["common.bond_of_life"]).toBe(0.5);
    expect(ctx["set_other.noblesse_oblige_4"]).toBe(true);
  });
});
