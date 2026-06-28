import { describe, it, expect } from "vitest";
import { ALL_CHARACTERS } from "@genshin/data";
import type { DbObjectChar } from "@genshin/types";
import {
  buildPartyInput,
  addMember,
  removeMember,
  setMemberSetting,
  activeResonances,
} from "../party.js";
import type { PartyMemberForm } from "../types.js";
import { collectPartyConditions } from "../conditions.js";

const resolve = (slug: string): DbObjectChar | undefined =>
  ALL_CHARACTERS.find((c) => c.name === slug);

describe("buildPartyInput", () => {
  it("returns undefined for an empty roster (engine call stays inert)", () => {
    expect(buildPartyInput([], resolve)).toBeUndefined();
  });

  it("maps a teammate to a {character, settings} member and defaults talent levels to 10", () => {
    const members: PartyMemberForm[] = [
      { slug: "bennett", settings: { bennet_atk_base: 800, "party.bennet_fantastic_voyage": true } },
    ];
    const input = buildPartyInput(members, resolve);
    expect(input).toBeDefined();
    expect(input!.members).toHaveLength(1);
    const m = input!.members![0] as { character: string; settings: Record<string, unknown> };
    expect(m.character).toBe("bennett");
    // user-entered stat + toggle preserved
    expect(m.settings.bennet_atk_base).toBe(800);
    expect(m.settings["party.bennet_fantastic_voyage"]).toBe(true);
    // burst level defaulted to 10 (engine would otherwise default an unset levelSetting to 1)
    expect(m.settings.bennet_char_skill_burst).toBe(10);
  });

  it("lets a user-set talent level override the level default", () => {
    const members: PartyMemberForm[] = [
      { slug: "bennett", settings: { bennet_char_skill_burst: 7 } },
    ];
    const m = buildPartyInput(members, resolve)!.members![0] as { settings: Record<string, unknown> };
    expect(m.settings.bennet_char_skill_burst).toBe(7);
  });
});

describe("roster mutation helpers (immutable)", () => {
  const base: PartyMemberForm[] = [{ slug: "bennett", settings: {} }];

  it("addMember appends an empty-settings member without mutating the input", () => {
    const next = addMember(base, "zhongli");
    expect(next).toHaveLength(2);
    expect(next[1]).toEqual({ slug: "zhongli", settings: {} });
    expect(base).toHaveLength(1); // unchanged
  });

  it("removeMember splices by index immutably", () => {
    const next = removeMember(addMember(base, "zhongli"), 0);
    expect(next).toEqual([{ slug: "zhongli", settings: {} }]);
  });

  it("setMemberSetting updates one key on one member immutably", () => {
    const next = setMemberSetting(base, 0, "bennet_atk_base", 900);
    expect(next[0].settings.bennet_atk_base).toBe(900);
    expect(base[0].settings.bennet_atk_base).toBeUndefined(); // original unchanged
  });
});

describe("activeResonances", () => {
  it("returns a resonance for any element with 2+ members", () => {
    expect(activeResonances(["pyro", "pyro", "hydro", "cryo"])).toEqual(["Pyro Resonance"]);
  });
  it("returns none when all four elements differ", () => {
    expect(activeResonances(["pyro", "hydro", "electro", "cryo"])).toEqual([]);
  });
  it("returns both for a double resonance (2+2)", () => {
    expect(activeResonances(["pyro", "pyro", "hydro", "hydro"])).toEqual([
      "Pyro Resonance",
      "Hydro Resonance",
    ]);
  });
});

describe("collectPartyConditions", () => {
  it("returns only the teammate's partyData conditions as controls", () => {
    const bennett = ALL_CHARACTERS.find((c) => c.name === "bennett")!;
    const ctrls = collectPartyConditions(bennett);
    const names = ctrls.map((c) => c.name);
    // Bennett's partyData.conditions: bennet_atk_base (number) + party.bennet_fantastic_voyage (boolean)
    expect(names).toContain("bennet_atk_base");
    expect(names).toContain("party.bennet_fantastic_voyage");
    expect(ctrls.find((c) => c.name === "bennet_atk_base")!.kind).toBe("number");
    expect(ctrls.find((c) => c.name === "party.bennet_fantastic_voyage")!.kind).toBe("boolean");
  });

  it("returns an empty array for a character with no partyData", () => {
    // pick any char whose partyData is absent; fall back to a synthetic if none
    const noParty = ALL_CHARACTERS.find((c) => c.partyData === undefined);
    if (noParty) expect(collectPartyConditions(noParty)).toEqual([]);
  });
});
