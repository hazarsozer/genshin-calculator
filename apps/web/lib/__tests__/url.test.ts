import { describe, it, expect } from "vitest";
import { encodeBuild, decodeBuild } from "../url.js";
import { DEFAULT_FORM } from "../defaults.js";

describe("url codec", () => {
  it("round-trips a build", () => {
    const form = { ...DEFAULT_FORM, characterKey: "Hu Tao", constellation: 6,
      conditions: { toggles: { hutao_paramita_papilio: true }, stacks: {} } };
    expect(decodeBuild(encodeBuild(form))).toEqual(form);
  });
  it("falls back to defaults on garbage", () => {
    expect(decodeBuild("@@@not-valid@@@")).toEqual(DEFAULT_FORM);
  });
  it("round-trips a pinned feature", () => {
    const form = { ...DEFAULT_FORM, pinnedFeature: "skill.skill_dmg" };
    expect(decodeBuild(encodeBuild(form)).pinnedFeature).toBe("skill.skill_dmg");
  });
  it("decodes a legacy hash without pinnedFeature as undefined", () => {
    expect(decodeBuild(encodeBuild(DEFAULT_FORM)).pinnedFeature).toBeUndefined();
  });
});
