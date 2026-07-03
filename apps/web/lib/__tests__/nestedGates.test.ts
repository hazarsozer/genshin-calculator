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

// AUDITED 2026-07-03 vs raw/genshin_calc_pub/src/js/db/Char/*.js —
// every entry confirmed to be a user-facing choice in her engine (a
// ConditionBoolean / ConditionBooleanLevels / ConditionStacks carrying a real
// talent_name.* title + serializeId the player toggles), not an internal
// derived flag. Full per-key audit ledger: .superpowers/sdd/task-3-report.md.
// A failure here means a data change altered the surfaced control set:
// re-audit the delta vs raw, then update this literal CONSCIOUSLY.
const EXPECTED_NESTED_GATES: Record<string, string[]> = {
  albedo: ["albedo_opening_of_hanerozoic"],
  baizhu: ["baizhu_ancient_art_of_perception", "baizhu_five_fortunes_forever"],
  chiori: ["chiori_sole_principle_pursuit"],
  diona: ["diona_cats_tail"],
  eula: ["eula_icewhirl_brand"],
  faruzan: ["faruzan_wind_bale", "faruzan_wind_benefit"],
  gorou: ["gorou_generals_war_banner"],
  ifa: ["common.nightsoul_blessing_state"],
  kamisato_ayato: ["ayato_bloomwater_blades"],
  layla: ["layla_starry_illumination"],
  lynette: ["lynette_sophisticated_synergy"],
  mavuika: [
    "mavuika_crucible_of_death_and_life",
    "mavuika_humanitys_name_unfettered",
    "mavuika_stance",
    "mavuika_the_ashen_price",
  ],
  mona: ["mona_omen"],
  mualani: ["mualani_the_leisurely_meztli"],
  nahida: ["nahida_the_root_of_all_fullness"],
  razor: ["razor_wolf_within"],
  shenhe: ["shenhe_spirit_field"],
  skirk: ["skirk_return_to_oblivion", "skirk_seven_phase_flash"],
  traveler_pyro: ["common.nightsoul_blessing_state"],
  varesa: ["varesa_fiery_passion", "varesa_the_courage_to_press_on_1"],
  wanderer: ["wanderer_windfavored"],
  xilonen: ["common.nightsoul_blessing_state"],
  yanfei: ["yanfei_brilliance", "yanfei_scarlet_seal"],
};

it("drift guard: extracted nested-gate set matches the audited registry", () => {
  const actual: Record<string, string[]> = {};
  for (const c of ALL_CHARACTERS) {
    const names = extractNestedGateControls(c).map((x) => x.name);
    if (names.length) actual[c.name] = names;
  }
  expect(actual).toEqual(EXPECTED_NESTED_GATES);
});
