import { describe, it, expect } from "vitest";
import { ALL_CHARACTERS, ALL_WEAPONS } from "@genshin/data";
import type { DbObjectChar } from "@genshin/types";
import {
  extractNestedGateControls,
  collectGroupedConditions,
  collectPartyConditions,
} from "../conditions";
import { DEFAULT_FORM } from "../defaults";
import { computeBuild } from "../calc";
import type { BuildForm } from "../types";

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

// AUDITED 2026-07-03 (Task 4, Finding 3) — partyData scaling-stat number/stacks
// inputs (e.g. xilonen_def_total) are lifted teammate stats: each of these 16
// keys is read ONLY inside its own char's `partyData.multipliers`/
// `partyData.postEffects` (verified via grep against packages/data/src/characters/*.ts —
// every "scaling"/"fromStat" reference lives in a *PartyMultipliers/*PartyPost
// const assigned solely to `partyData`, never to the char's own top-level
// `multipliers`/`postEffects`). Full ledger: .superpowers/sdd/task-4-report.md.
// For the ACTIVE character the engine reads the computed sheet directly — these
// self-serve manual inputs are a footgun and are excluded from the self group.
// The teammate lane (collectPartyConditions) is UNCHANGED and still surfaces them.
describe("active-char scaling-stat inputs (Finding 3)", () => {
  it("xilonen_def_total does not render as a self control", () => {
    const g = collectGroupedConditions(byName("xilonen"), weaponByName("cool_steel"), []);
    expect(g.self.map((c) => c.name)).not.toContain("xilonen_def_total");
  });

  it("teammate lane still surfaces xilonen_def_total", () => {
    const names = collectPartyConditions(byName("xilonen")).map((c) => c.name);
    expect(names).toContain("xilonen_def_total");
  });

  it("excludes every audited scaling-stat input from the self group", () => {
    const cases: Array<[string, string]> = [
      ["bennett", "bennet_atk_base"],
      ["candace", "candace_hp_total"],
      ["chevreuse", "chevreuse_hp_total"],
      ["citlali", "citlali_mastery_total"],
      ["escoffier", "escoffier_atk_total"],
      ["faruzan", "faruzan_atk_base"],
      ["iansan", "iansan_atk_total"],
      ["ineffa", "ineffa_atk_total"],
      ["kujou_sara", "sara_atk_base"],
      ["layla", "layla_max_hp"],
      ["rosaria", "rosaria_crit_rate_total"],
      ["shenhe", "shenhe_atk_total"],
      ["sigewinne", "sigewinne_hp_total"],
      ["xianyun", "xianyun_atk_total"],
      ["xilonen", "xilonen_def_total"],
      ["yun_jin", "yunjin_def_total"],
    ];
    for (const [charName, key] of cases) {
      const names = extractSelfNames(charName);
      expect(names).not.toContain(key);
      // Teammate lane still surfaces it.
      expect(collectPartyConditions(byName(charName)).map((c) => c.name)).toContain(key);
    }
  });
});

function extractSelfNames(charName: string): string[] {
  const g = collectGroupedConditions(byName(charName), weaponByName("cool_steel"), []);
  return g.self.map((c) => c.name);
}

// AUDITED 2026-07-03 (final-review fix) — these three nested gates are stack
// COUNTS in the engine (consumed as table indices: albedo_opening_of_hanerozoic
// leveling into a 4-entry ValueTable, skirk_return_to_oblivion levelSetting into
// 3-entry scalingMultiplierFromTable(s), yanfei_scarlet_seal levelSetting into a
// 4-entry levelStats table). Surfacing them as a boolean coerces to 1 stack, so
// higher stacks were unreachable from the UI. See NESTED_GATE_STACKS in
// ../conditions.
describe("nested gates that are stack counts, not booleans", () => {
  it.each([
    ["albedo", "albedo_opening_of_hanerozoic", 4],
    ["skirk", "skirk_return_to_oblivion", 3],
    ["yanfei", "yanfei_scarlet_seal", 4],
  ] as const)("%s's %s surfaces as a number control with max %d", (charName, gateName, max) => {
    const ctrl = extractNestedGateControls(byName(charName)).find((c) => c.name === gateName);
    expect(ctrl).toBeDefined();
    expect(ctrl!.kind).toBe("number");
    expect(ctrl!.max).toBe(max);
  });

  it("albedo: higher stacks on albedo_opening_of_hanerozoic reach the engine (feature averages differ)", () => {
    const base: BuildForm = {
      ...DEFAULT_FORM,
      characterKey: "albedo",
      weaponKey: "cool_steel",
      constellation: 2,
    };
    const lowForm: BuildForm = {
      ...base,
      conditions: { toggles: {}, stacks: { albedo_opening_of_hanerozoic: 1 } },
    };
    const highForm: BuildForm = {
      ...base,
      conditions: { toggles: {}, stacks: { albedo_opening_of_hanerozoic: 4 } },
    };
    const lowResult = computeBuild(lowForm, {}, []);
    const highResult = computeBuild(highForm, {}, []);
    expect(lowResult.error).toBeUndefined();
    expect(highResult.error).toBeUndefined();

    const lowAvgs = new Map(lowResult.features.map((f) => [f.key, f.triple[2]]));
    const highAvgs = new Map(highResult.features.map((f) => [f.key, f.triple[2]]));
    const anyDifferent = [...highAvgs.entries()].some(
      ([key, avg]) => Math.abs(avg - (lowAvgs.get(key) ?? avg)) > 1e-6
    );
    expect(anyDifferent).toBe(true);
  });
});

it("drift guard: extracted nested-gate set matches the audited registry", () => {
  const actual: Record<string, string[]> = {};
  for (const c of ALL_CHARACTERS) {
    const names = extractNestedGateControls(c).map((x) => x.name);
    if (names.length) actual[c.name] = names;
  }
  expect(actual).toEqual(EXPECTED_NESTED_GATES);
});
