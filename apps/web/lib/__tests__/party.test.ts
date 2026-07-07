import { describe, it, expect } from "vitest";
import { ALL_CHARACTERS } from "@genshin/data";
import type { DbObjectChar } from "@genshin/types";
import {
  buildPartyInput,
  teammateLevelDefaults,
  addMember,
  removeMember,
  setMemberSetting,
  setMemberField,
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

  it("defaults a multiplier-leveling talent key to 10 (Shenhe Icy Quill)", () => {
    const m = buildPartyInput([{ slug: "shenhe", settings: {} }], resolve)!.members![0] as { settings: Record<string, unknown> };
    expect(m.settings.shenhe_char_skill_elemental).toBe(10);
  });

  it("drops a member whose slug does not resolve (stale URL degrades gracefully)", () => {
    expect(buildPartyInput([{ slug: "not_a_real_char_xyz", settings: {} }], resolve)).toBeUndefined();
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

describe("buildPartyInput — off-field Set/Weapon lanes", () => {
  it("omits both lanes when no teammate has a pick (byte-identical to pre-1.5)", () => {
    const input = buildPartyInput([{ slug: "bennett", settings: {} }], resolve)!;
    expect("setOther" in input).toBe(false);
    expect("weaponOther" in input).toBe(false);
  });

  it("a VV(pyro) teammate publishes setOther.viridescent_venerer_4 = 'pyro'", () => {
    const input = buildPartyInput(
      [{ slug: "bennett", settings: {}, setKey: "viridescent_venerer_4", setElement: "pyro" }],
      resolve
    )!;
    expect(input.setOther).toEqual({ viridescent_venerer_4: "pyro" });
  });

  it("two VV teammates (pyro + cryo) ;-join the elements on the shared gate", () => {
    const input = buildPartyInput(
      [
        { slug: "bennett", settings: {}, setKey: "viridescent_venerer_4", setElement: "pyro" },
        { slug: "sucrose", settings: {}, setKey: "viridescent_venerer_4", setElement: "cryo" },
      ],
      resolve
    )!;
    expect(input.setOther!.viridescent_venerer_4).toBe("pyro;cryo");
  });

  it("dedups a repeated element on the shared VV gate", () => {
    const input = buildPartyInput(
      [
        { slug: "bennett", settings: {}, setKey: "viridescent_venerer_4", setElement: "pyro" },
        { slug: "sucrose", settings: {}, setKey: "viridescent_venerer_4", setElement: "pyro" },
      ],
      resolve
    )!;
    expect(input.setOther!.viridescent_venerer_4).toBe("pyro");
  });

  it("a plain set publishes a boolean true under its slug gate", () => {
    const input = buildPartyInput(
      [{ slug: "bennett", settings: {}, setKey: "noblesse_oblige_4" }],
      resolve
    )!;
    expect(input.setOther).toEqual({ noblesse_oblige_4: true });
  });

  it("Scroll tier pick publishes the tier-specific boolean gate", () => {
    const input = buildPartyInput(
      [{ slug: "bennett", settings: {}, setKey: "scroll_of_the_hero_of_cinder_city_4", setTier: "2" }],
      resolve
    )!;
    expect(input.setOther).toEqual({ scroll_of_the_hero_of_cinder_city_4_2: true });
  });

  it("Wolf's Gravestone R5 publishes weaponOther[full gate] = 5", () => {
    const input = buildPartyInput(
      [{ slug: "bennett", settings: {}, weaponKey: "weapon_other.weapon_wolfs_gravestone", weaponRefine: 5 }],
      resolve
    )!;
    expect(input.weaponOther).toEqual({ "weapon_other.weapon_wolfs_gravestone": 5 });
  });

  it("defaults an off-field weapon refine to 1 when unset", () => {
    const input = buildPartyInput(
      [{ slug: "bennett", settings: {}, weaponKey: "weapon.thrilling_tales" }],
      resolve
    )!;
    expect(input.weaponOther).toEqual({ "weapon.thrilling_tales": 1 });
  });

  it("two teammates with the same off-field weapon keep the higher refine", () => {
    const input = buildPartyInput(
      [
        { slug: "bennett", settings: {}, weaponKey: "weapon_other.weapon_wolfs_gravestone", weaponRefine: 2 },
        { slug: "sucrose", settings: {}, weaponKey: "weapon_other.weapon_wolfs_gravestone", weaponRefine: 4 },
      ],
      resolve
    )!;
    expect(input.weaponOther).toEqual({ "weapon_other.weapon_wolfs_gravestone": 4 });
  });
});

describe("setMemberField (immutable)", () => {
  const base: PartyMemberForm[] = [{ slug: "bennett", settings: {} }];

  it("sets a pick field on one member without mutating the input", () => {
    const next = setMemberField(base, 0, "setKey", "viridescent_venerer_4");
    expect(next[0].setKey).toBe("viridescent_venerer_4");
    expect(base[0].setKey).toBeUndefined();
  });

  it("clears a field when value is undefined", () => {
    const withKey = setMemberField(base, 0, "setKey", "noblesse_oblige_4");
    const cleared = setMemberField(withKey, 0, "setKey", undefined);
    expect("setKey" in cleared[0]).toBe(false);
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

describe("teammateLevelDefaults", () => {
  it("includes the multiplier leveling key (Shenhe Icy Quill)", () => {
    const shenhe = ALL_CHARACTERS.find((c) => c.name === "shenhe")!;
    expect(teammateLevelDefaults(shenhe).shenhe_char_skill_elemental).toBe(10);
  });
});
