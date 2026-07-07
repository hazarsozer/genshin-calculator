import { describe, expect, it } from "vitest";
import { humanizePascal } from "../utils";

describe("humanizePascal", () => {
  it("splits PascalCase dish keys into spaced words", () => {
    expect(humanizePascal("AdeptusTemptation")).toBe("Adeptus Temptation");
  });

  it("splits multi-word PascalCase keys", () => {
    expect(humanizePascal("ChickenTofuPudding")).toBe("Chicken Tofu Pudding");
  });

  it("passes single-word keys through unchanged", () => {
    expect(humanizePascal("Potion")).toBe("Potion");
  });

  it("humanizePascal splits a leading single capital followed by a capitalized word", () => {
    expect(humanizePascal("ALeisurelySip")).toBe("A Leisurely Sip");
  });
  it("humanizePascal leaves other dish names byte-identical", () => {
    expect(humanizePascal("AdeptusTemptation")).toBe("Adeptus Temptation");
    expect(humanizePascal("SweetMadame")).toBe("Sweet Madame");
    expect(humanizePascal("MoraMeat")).toBe("Mora Meat");
  });
});
