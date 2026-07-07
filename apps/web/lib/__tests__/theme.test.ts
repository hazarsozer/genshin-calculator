import { describe, it, expect } from "vitest";
import { elementAccent, ELEMENTS, SKINS, DEFAULT_SKIN } from "../theme";

describe("theme", () => {
  it("maps every element to a complete accent token set", () => {
    for (const el of ELEMENTS) {
      const a = elementAccent(el);
      expect(a.accent).toMatch(/^#|^oklch|^hsl/);
      expect(a.accent2).toBeTruthy();
      expect(a.glow).toBeTruthy();
      expect(a.gradient).toContain("gradient");
    }
  });
  it("pyro is a warm crimson/ember, hydro is blue", () => {
    expect(elementAccent("pyro").accent.toLowerCase()).toBe("#ff7a45");
    expect(elementAccent("hydro").accent.toLowerCase()).toBe("#3aa0ff");
  });
  it("exposes the skin registry with dark as default", () => {
    expect(SKINS).toContain("dark");
    expect(SKINS).toContain("vision");
    expect(DEFAULT_SKIN).toBe("dark");
  });
});
