import { describe, it, expect } from "vitest";
import { ALL_CHARACTERS, ALL_WEAPONS } from "@genshin/data";
import type { DbObjectChar } from "@genshin/types";
import { extractNestedGateControls, collectGroupedConditions } from "../conditions";

const byName = (name: string): DbObjectChar => {
  const c = ALL_CHARACTERS.find((x) => x.name === name);
  if (!c) throw new Error(`char not found: ${name}`);
  return c;
};

const weaponByName = (name: string) => {
  const w = ALL_WEAPONS.find((x) => x.name === name);
  if (!w) throw new Error(`weapon not found: ${name}`);
  return w;
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

  it("excludes a gate published inside a FEATURE's condition tree (not just conditionSources)", () => {
    // Synthetic char: a feature.condition whose nested boolean gate ("test_gate")
    // is also published via a sibling settings:{} in the SAME tree. Before the
    // fix, walkPublishedKeys only ran over conditionSources, so this would have
    // leaked through as a false-positive user-facing toggle.
    const synthetic = {
      name: "synthetic-test-char",
      conditions: [],
      postEffects: [],
      multipliers: [],
      features: [
        {
          condition: {
            items: [
              { type: "boolean", name: "test_gate" },
              { settings: { test_gate: { min: 0, max: 1 } } },
            ],
          },
        },
      ],
    } as unknown as DbObjectChar;

    const names = extractNestedGateControls(synthetic).map((c) => c.name);
    expect(names).not.toContain("test_gate");
  });
});

describe("collectGroupedConditions + nested gates", () => {
  it("gorou's Build drawer self group contains the war-banner toggle", () => {
    const g = collectGroupedConditions(byName("gorou"), weaponByName("messenger"), []);
    expect(g.self.map((c) => c.name)).toContain("gorou_generals_war_banner");
  });

  it("xilonen's self group contains the nightsoul toggle exactly once", () => {
    const g = collectGroupedConditions(byName("xilonen"), weaponByName("cool_steel"), []);
    const hits = g.self.filter((c) => c.name === "common.nightsoul_blessing_state");
    expect(hits).toHaveLength(1);
  });

  it("does not add nested gates to weapon/set/global/enemy groups", () => {
    const g = collectGroupedConditions(byName("gorou"), weaponByName("messenger"), []);
    for (const group of [g.weapon, g.set, g.global, g.enemy]) {
      expect(group.map((c) => c.name)).not.toContain("gorou_generals_war_banner");
    }
  });
});
