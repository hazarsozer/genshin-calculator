import { describe, it, expect } from "vitest";
import { buildPartyBuffs } from "../partyBuffs.js";
import type { DbObjectChar } from "@genshin/types";

const stub = (partyData: DbObjectChar["partyData"]): DbObjectChar =>
  ({ name: "stub", element: "pyro", origin: "mondstadt", partyData } as unknown as DbObjectChar);

describe("buildPartyBuffs", () => {
  it("returns empty for no members (base-safety)", () => {
    expect(buildPartyBuffs({}, () => stub(undefined))).toEqual({
      conditions: [], postEffects: [], multipliers: [], settings: {},
    });
  });
  it("collects a {character} teammate's partyData lists + merges its settings", () => {
    const cond = { type: "static", stats: { enemy_res_geo: -20 } } as never;
    const res = buildPartyBuffs(
      { members: [{ character: "zhongli", settings: { "party.zhongli_res_shred": true } }] },
      () => stub({ conditions: [cond] })
    );
    expect(res.conditions).toEqual([cond]);
    expect(res.settings).toEqual({ "party.zhongli_res_shred": true });
    expect(res.postEffects).toEqual([]);
    expect(res.multipliers).toEqual([]);
  });
  it("ignores {element,origin} members (they carry no kit buffs)", () => {
    const res = buildPartyBuffs({ members: [{ element: "hydro" }] }, () => stub({ conditions: [{} as never] }));
    expect(res).toEqual({ conditions: [], postEffects: [], multipliers: [], settings: {} });
  });
});
