import { describe, it, expect } from "vitest";
import { buildPartyContext } from "../partyContext.js";
import { buildStats } from "../buildStats.js";
import { huTao } from "../characters/hu-tao.js";
import { blackcliffPoleStatTable } from "../generated/weaponStatTables.js";
import { SAMPLE_BLOCK } from "./_statBlocks.js";

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
        setOther: ["noblesse_oblige_4"], partyWeapons: { skyward_blade: 5 } },
      { element: "cryo", origin: "natlan" }
    );
    expect(ctx.resonance_element_1).toBe("hydro");
    expect(ctx["common.enemy_status"]).toBe("cryo");
    expect(ctx["common.bond_of_life"]).toBe(0.5);
    expect(ctx["set_other.noblesse_oblige_4"]).toBe(true);
    expect(ctx["party_weapon_skyward_blade"]).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// buildStats integration — party wiring
// ---------------------------------------------------------------------------

const LEVELS = {
  charLevel: 90,
  ascension: 6,
  weaponLevel: 90,
  weaponAscension: 6,
} as const;

const ENEMY = { level: 90, resistance: 10 } as const;

describe("buildStats — party integration", () => {
  it("party ABSENT → settings has no party_* keys (base-safety)", () => {
    const { settings } = buildStats({
      char: huTao,
      weaponStatTable: blackcliffPoleStatTable,
      statBlock: SAMPLE_BLOCK,
      levels: LEVELS,
      enemy: ENEMY,
    });
    const partyKeys = Object.keys(settings).filter((k) => k.startsWith("party_"));
    expect(partyKeys).toHaveLength(0);
  });

  it("party PRESENT → settings.party_elements_count_level equals distinct-element count", () => {
    const { settings } = buildStats({
      char: huTao,
      weaponStatTable: blackcliffPoleStatTable,
      statBlock: SAMPLE_BLOCK,
      levels: LEVELS,
      enemy: ENEMY,
      party: {
        members: [
          { element: "hydro", origin: "fontaine" },
          { element: "pyro", origin: "liyue" },
        ],
      },
    });
    // active=pyro + teammate hydro + teammate pyro → distinct = {pyro, hydro} = 2
    expect(settings["party_elements_count_level"]).toBe(2);
    expect(settings["party_size"]).toBe(3);
  });
});
