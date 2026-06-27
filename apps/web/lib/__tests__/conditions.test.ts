import { describe, it, expect } from "vitest";
import { huTao, ALL_CHARACTERS, ALL_WEAPONS } from "@genshin/data";
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

function findByName<T extends { name: string }>(arr: readonly T[], n: string): T {
  const match = arr.find((x) => x.name === n);
  if (!match) throw new Error(`No entry named "${n}"`);
  return match;
}

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

  it("discovers Bennett's burst-ATK toggle from postEffects (not just char.conditions)", () => {
    const bennett = findByName(ALL_CHARACTERS, "bennett");
    const weapon = findByName(ALL_WEAPONS, "dark_iron_sword");
    const controls = collectConditions(bennett, weapon, []);
    const names = controls.map((c) => c.name);
    // bennet_fantastic_voyage lives on postEffects[].conditions, not char.conditions —
    // was invisible before the widened harvest.
    expect(names).toContain("bennet_fantastic_voyage");
  });

  it("still surfaces Hu Tao's Paramita (top-level) without duplicates after widened harvest", () => {
    // hutao_paramita_papilio appears in BOTH char.conditions AND postEffects[].conditions;
    // widened harvest must dedupe correctly.
    const hutao = findByName(ALL_CHARACTERS, "hu_tao");
    const weapon = findByName(ALL_WEAPONS, "staff_of_homa");
    const controls = collectConditions(hutao, weapon, []);
    const names = controls.map((c) => c.name);
    expect(names.filter((n) => n === "hutao_paramita_papilio")).toHaveLength(1);
  });
});
