import { describe, it, expect } from "vitest";
import { ALL_CHARACTERS } from "@genshin/data";
import type { DbObjectChar } from "@genshin/types";
import { extractNestedGateControls } from "../conditions";

const byName = (name: string): DbObjectChar => {
  const c = ALL_CHARACTERS.find((x) => x.name === name);
  if (!c) throw new Error(`char not found: ${name}`);
  return c;
};

describe("extractNestedGateControls", () => {
  it("surfaces gorou's war-banner gate (static condition, nested boolean)", () => {
    const controls = extractNestedGateControls(byName("gorou"));
    const names = controls.map((c) => c.name);
    expect(names).toContain("gorou_generals_war_banner");
    const ctrl = controls.find((c) => c.name === "gorou_generals_war_banner")!;
    expect(ctrl.kind).toBe("boolean");
    expect(ctrl.label.length).toBeGreaterThan(0);
  });

  it("surfaces mavuika_stance (Feature.condition production gate)", () => {
    const names = extractNestedGateControls(byName("mavuika")).map((c) => c.name);
    expect(names).toContain("mavuika_stance");
  });

  it("surfaces the nightsoul gate with its explicit label", () => {
    const ctrl = extractNestedGateControls(byName("xilonen")).find(
      (c) => c.name === "common.nightsoul_blessing_state"
    );
    expect(ctrl).toBeDefined();
    expect(ctrl!.label).toBe("Nightsoul's Blessing");
  });

  it("excludes gates PUBLISHED by another condition (derived, not user choices)", () => {
    // xilonen_damage_mode is published by an elements-count static's settings:{}.
    const names = extractNestedGateControls(byName("xilonen")).map((c) => c.name);
    expect(names).not.toContain("xilonen_damage_mode");
    expect(names).not.toContain("xilonen_sampler_geo");
    expect(names).not.toContain("xilonen_active_sampler_geo");
  });

  it("excludes derived-prefix keys and already-surfaced top-level controls", () => {
    for (const char of ALL_CHARACTERS) {
      for (const c of extractNestedGateControls(char)) {
        expect(c.name).not.toMatch(
          /^(char_|party_|resonance_|weapon_|enemy_|attack_infusion)/
        );
      }
    }
  });

  it("returns [] for a char with no hidden gates (bennett)", () => {
    expect(extractNestedGateControls(byName("bennett"))).toEqual([]);
  });
});
