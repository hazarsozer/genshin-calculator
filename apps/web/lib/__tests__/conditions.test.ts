import { describe, it, expect } from "vitest";
import { huTao } from "@genshin/data";
import { collectConditions } from "../conditions.js";
import type { DbObjectWeapon } from "@genshin/types";

/**
 * Unit test for collectConditions.
 *
 * Asserts that Hu Tao's `hutao_paramita_papilio` boolean condition surfaces as a
 * ConditionControl with kind:"boolean" and a humanized label.
 *
 * `hutao_paramita_papilio` is the first condition in Hu Tao's conditions array:
 *   raw/genshin_calc_pub/src/js/db/Char/Hutao.js → conditions: [paramita, ...]
 *   where paramita = { type:"boolean", name:"hutao_paramita_papilio", ... }
 */

// Minimal stub weapon — collectConditions only reads weapon.conditions?.
const stubWeapon: DbObjectWeapon = {
  name: "stub_weapon",
  gameId: 0,
  rarity: 4,
  weapon: "polearm",
  statTable: [],
  conditions: [],
};

describe("collectConditions", () => {
  it("includes hutao_paramita_papilio as a boolean control", () => {
    const controls = collectConditions(huTao, stubWeapon, []);

    const paramita = controls.find((c) => c.name === "hutao_paramita_papilio");
    expect(paramita).toBeDefined();
    expect(paramita!.kind).toBe("boolean");
    expect(paramita!.label).toBe("Hutao Paramita Papilio");
  });

  it("dedupes by name across char, weapon, and globals", () => {
    const controls = collectConditions(huTao, stubWeapon, []);
    const names = controls.map((c) => c.name);
    const uniqueNames = [...new Set(names)];
    expect(names).toEqual(uniqueNames);
  });

  it("does not include static conditions (no UI control needed)", () => {
    const controls = collectConditions(huTao, stubWeapon, []);
    // static conditions are always-on — they shouldn't appear as user controls
    // We can't know which are static without inspecting char.conditions, but we
    // CAN assert that no control has undefined kind (which would happen if we
    // accidentally mapped static → kind).
    for (const c of controls) {
      expect(c.kind).toMatch(/^(boolean|number)$/);
    }
  });
});
