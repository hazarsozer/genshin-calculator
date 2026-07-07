import { describe, it, expect, beforeEach } from "vitest";
import { useBuildStore } from "../store.js";
import { DEFAULT_FORM } from "../defaults.js";

describe("useBuildStore", () => {
  beforeEach(() => {
    useBuildStore.setState({ form: DEFAULT_FORM });
  });

  it("setForm merges — optional fields survive a patch that omits them (documents the leak setForm alone would cause)", () => {
    useBuildStore.getState().setForm({
      pinnedFeature: "skill.some_hit",
      food: { Attack: { key: "mondstadt-hash-brown", tier: 3 } },
      customBuffs: { "atk_%": 10 },
    });

    // A patch that doesn't mention these keys leaves them in place — this is
    // exactly the leak: loading build B via setForm(loadBuild(id)) would keep
    // build A's pin/food/customBuffs since JSON.stringify dropped them from
    // the saved hash (they were undefined) and setForm only merges.
    useBuildStore.getState().setForm({ characterKey: "hu_tao" });

    const form = useBuildStore.getState().form;
    expect(form.pinnedFeature).toBe("skill.some_hit");
    expect(form.food).toEqual({ Attack: { key: "mondstadt-hash-brown", tier: 3 } });
    expect(form.customBuffs).toEqual({ "atk_%": 10 });
  });

  it("replaceForm replaces the form wholesale — a loaded form lacking pinnedFeature/food/customBuffs clears them", () => {
    useBuildStore.getState().setForm({
      pinnedFeature: "skill.some_hit",
      food: { Attack: { key: "mondstadt-hash-brown", tier: 3 } },
      customBuffs: { "atk_%": 10 },
    });

    // Simulates loading a build whose saved hash never had these optional
    // fields set (JSON.stringify drops `undefined` keys on save).
    const loaded = { ...DEFAULT_FORM, characterKey: "hu_tao" };
    useBuildStore.getState().replaceForm(loaded);

    const form = useBuildStore.getState().form;
    expect(form.characterKey).toBe("hu_tao");
    expect(form.pinnedFeature).toBeUndefined();
    expect(form.food).toBeUndefined();
    expect(form.customBuffs).toBeUndefined();
  });
});
