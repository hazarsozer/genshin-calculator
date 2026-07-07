import { describe, it, expect } from "vitest";
import { huTao, ALL_CHARACTERS, ALL_WEAPONS } from "@genshin/data";
import { collectConditions, collectSelfWornElementSelects } from "../conditions.js";
import type { DbObjectWeapon } from "@genshin/types";

/**
 * Unit test for collectConditions.
 *
 * Asserts that Hu Tao's `hutao_paramita_papilio` boolean condition surfaces as a
 * ConditionControl with kind:"boolean" and the CSV-resolved in-game name.
 *
 * `hutao_paramita_papilio` is the first condition in Hu Tao's conditions array:
 *   raw/genshin_calc_pub/src/js/db/Char/Hutao.js → conditions: [paramita, ...]
 *   where paramita = { type:"boolean", name:"hutao_paramita_papilio", ... }
 *
 * Since Task 24, `label` is resolved from CONDITION_STRINGS using the CSV
 * `talent_name` entry for the condition name — "Paramita Papilio" (the in-game
 * name) rather than the old humanized slug "Hutao Paramita Papilio".
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
    // Task 24: label now comes from CONDITION_STRINGS (CSV talent_name entry),
    // not from humanizeSlug — "Paramita Papilio" is the in-game name.
    expect(paramita!.label).toBe("Paramita Papilio");
    // description should also be populated from CONDITION_STRINGS
    expect(paramita!.description).toBeDefined();
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

  it("weapon condition with explicit i18n keys resolves to the correct pretty label and description", () => {
    // Aqua Simulacra's boolean-refine condition carries:
    //   title: "talent_name.aqua_simulacra"   → CONDITION_STRINGS["aqua_simulacra"].title
    //   description: "talent_descr.aqua_simulacra_2" → CONDITION_STRINGS["aqua_simulacra_2"].description
    const aquaSim = findByName(ALL_WEAPONS, "aqua_simulacra");
    const controls = collectConditions(huTao, aquaSim, []);
    const weaponCtrl = controls.find((c) => c.name === "weapon_aqua_simulacra");
    expect(weaponCtrl).toBeDefined();
    expect(weaponCtrl!.label).toBe("The Cleansing Form");
    expect(weaponCtrl!.description).toBeDefined();
  });

  it("condition with key absent everywhere falls back to humanized slug without crashing", () => {
    // A boolean-refine condition with an unknown name and no title/description
    // keys must resolve gracefully via humanizeSlug, not throw.
    const weaponWithUnknown: DbObjectWeapon = {
      ...stubWeapon,
      conditions: [
        {
          type: "boolean-refine",
          name: "weapon_totally_absent_xyz",
          serializeId: 99,
          refinementStats: [{}],
        },
      ],
    };
    const controls = collectConditions(huTao, weaponWithUnknown, []);
    const ctrl = controls.find((c) => c.name === "weapon_totally_absent_xyz");
    expect(ctrl).toBeDefined();
    // humanizeSlug("weapon_totally_absent_xyz") → "Weapon Totally Absent Xyz"
    expect(ctrl!.label).toBe("Weapon Totally Absent Xyz");
  });
});

describe("collectSelfWornElementSelects", () => {
  it("returns no selects when the gating set is not equipped 4pc", () => {
    expect(collectSelfWornElementSelects([])).toEqual([]);
    expect(collectSelfWornElementSelects([{ setKey: "ViridescentVenerer", pieces: 2 }])).toEqual([]);
  });

  it("surfaces a VV element select when ViridescentVenerer 4pc is worn", () => {
    const out = collectSelfWornElementSelects([{ setKey: "ViridescentVenerer", pieces: 4 }]);
    const vv = out.find((c) => c.name === "set.viridescent_venerer_4");
    expect(vv).toBeDefined();
    expect(vv!.kind).toBe("select");
    expect([...vv!.options!].sort()).toEqual(["cryo", "electro", "hydro", "pyro"]);
  });

  it("surfaces an Archaic Petra element select (set_bonus. key) when 4pc is worn", () => {
    const out = collectSelfWornElementSelects([{ setKey: "ArchaicPetra", pieces: 4 }]);
    const ap = out.find((c) => c.name === "set_bonus.archaic_petra_4");
    expect(ap).toBeDefined();
    expect(ap!.kind).toBe("select");
    expect([...ap!.options!].sort()).toEqual(["cryo", "electro", "hydro", "pyro"]);
  });
});
