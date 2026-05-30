/**
 * Branded-level minters — range-checked smart constructors.
 *
 * These let data modules produce branded numeric values (CharacterLevel,
 * TalentLevel, …) without unsafe casts, while enforcing the documented ranges
 * at the system boundary (her game data is always in-range; out-of-range input
 * is a bug we want to fail loudly on).
 */

import { describe, it, expect } from "vitest";
import {
  asCharacterLevel,
  asTalentLevel,
  asAscensionLevel,
  asRefinement,
  asConstellationLevel,
} from "../character.js";

describe("branded-level minters", () => {
  describe("asCharacterLevel (1–90)", () => {
    it("accepts in-range values", () => {
      expect(asCharacterLevel(1)).toBe(1);
      expect(asCharacterLevel(90)).toBe(90);
    });
    it("rejects out-of-range and non-integers", () => {
      expect(() => asCharacterLevel(0)).toThrow();
      expect(() => asCharacterLevel(91)).toThrow();
      expect(() => asCharacterLevel(50.5)).toThrow();
    });
  });

  describe("asTalentLevel (1–15)", () => {
    it("accepts in-range values", () => {
      expect(asTalentLevel(1)).toBe(1);
      expect(asTalentLevel(15)).toBe(15);
    });
    it("rejects out-of-range", () => {
      expect(() => asTalentLevel(0)).toThrow();
      expect(() => asTalentLevel(16)).toThrow();
    });
  });

  describe("asAscensionLevel (0–6)", () => {
    it("accepts in-range values incl. 0", () => {
      expect(asAscensionLevel(0)).toBe(0);
      expect(asAscensionLevel(6)).toBe(6);
    });
    it("rejects out-of-range", () => {
      expect(() => asAscensionLevel(-1)).toThrow();
      expect(() => asAscensionLevel(7)).toThrow();
    });
  });

  describe("asRefinement (1–5)", () => {
    it("accepts in-range values", () => {
      expect(asRefinement(1)).toBe(1);
      expect(asRefinement(5)).toBe(5);
    });
    it("rejects out-of-range", () => {
      expect(() => asRefinement(0)).toThrow();
      expect(() => asRefinement(6)).toThrow();
    });
  });

  describe("asConstellationLevel (0–6)", () => {
    it("accepts in-range values incl. 0", () => {
      expect(asConstellationLevel(0)).toBe(0);
      expect(asConstellationLevel(6)).toBe(6);
    });
    it("rejects out-of-range", () => {
      expect(() => asConstellationLevel(-1)).toThrow();
      expect(() => asConstellationLevel(7)).toThrow();
    });
  });
});
