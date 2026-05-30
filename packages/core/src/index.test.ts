import { describe, it, expect } from "vitest";
import { CORE_VERSION } from "./index.js";

describe("@genshin/core scaffold", () => {
  it("exports a version string", () => {
    expect(CORE_VERSION).toBe("0.0.0");
  });
});
