/**
 * buildSettings — unit + round-trip tests.
 *
 * Round-trip strategy: build an EvalContext with buildSettings, then pass it to
 * core's evaluate() / getStackCount() to confirm the evaluator reads the exact
 * keys we emit.
 *
 * Reserved-key sources:
 *   raw/genshin_calc_pub/src/js/classes/Condition/Constellation.js → settings.char_constellation
 *   raw/genshin_calc_pub/src/js/classes/Condition/Static/Refine.js → settings.weapon_refine
 *   raw/genshin_calc_pub/src/js/classes/Condition/Boolean.js       → settings[params.name]
 *   raw/genshin_calc_pub/src/js/classes/Condition/Stacks.js        → settings[params.name]
 *   raw/genshin_calc_pub/src/js/classes/Condition/Number.js        → settings[params.name]
 */

import { describe, it, expect } from "vitest";
import { evaluate, getStackCount } from "@genshin/core";
import type {
  ConditionBoolean,
  ConditionConstellation,
  ConditionStacks,
  ConditionStatic,
  ConditionStaticRefine,
  ConditionNumber,
} from "@genshin/types";

import { buildSettings, type BuildSettingsInput } from "../buildSettings.js";

// ---------------------------------------------------------------------------
// 1. Empty input → {}
// ---------------------------------------------------------------------------

describe("buildSettings — empty / base path", () => {
  it("returns {} for no arguments (default param)", () => {
    const ctx = buildSettings();
    expect(ctx).toEqual({});
  });

  it("returns {} for empty object input", () => {
    const ctx = buildSettings({});
    expect(ctx).toEqual({});
  });

  it("result is frozen (immutable)", () => {
    const ctx = buildSettings({ constellation: 2 });
    expect(Object.isFrozen(ctx)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 2. Reserved keys — constellation / weapon_refine / attack_infusion
// ---------------------------------------------------------------------------

describe("buildSettings — reserved keys", () => {
  it("maps constellation → char_constellation", () => {
    const ctx = buildSettings({ constellation: 4 });
    expect(ctx["char_constellation"]).toBe(4);
  });

  it("omits char_constellation when constellation is absent", () => {
    const ctx = buildSettings({});
    expect("char_constellation" in ctx).toBe(false);
  });

  it("maps weaponRefine → weapon_refine", () => {
    const ctx = buildSettings({ weaponRefine: 3 });
    expect(ctx["weapon_refine"]).toBe(3);
  });

  it("omits weapon_refine when weaponRefine is absent", () => {
    const ctx = buildSettings({});
    expect("weapon_refine" in ctx).toBe(false);
  });

  it("maps infusion → attack_infusion", () => {
    const ctx = buildSettings({ infusion: "pyro" });
    expect(ctx["attack_infusion"]).toBe("pyro");
  });

  it("omits attack_infusion when infusion is absent", () => {
    const ctx = buildSettings({});
    expect("attack_infusion" in ctx).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 3. Toggle / stack keys — spread under condition.name
// ---------------------------------------------------------------------------

describe("buildSettings — toggles and stacks", () => {
  it("spreads toggles keys as-is", () => {
    const ctx = buildSettings({
      toggles: { hutao_paramita_papilio: true, some_other: false },
    });
    expect(ctx["hutao_paramita_papilio"]).toBe(true);
    expect(ctx["some_other"]).toBe(false);
  });

  it("spreads stacks keys as-is", () => {
    const ctx = buildSettings({
      stacks: { shenhe_icy_quill: 3 },
    });
    expect(ctx["shenhe_icy_quill"]).toBe(3);
  });

  it("combines all fields into one flat bag", () => {
    const ctx = buildSettings({
      constellation: 4,
      weaponRefine: 3,
      toggles: { hutao_paramita_papilio: true },
      stacks: { shenhe_icy_quill: 2 },
      infusion: "pyro",
    });
    expect(ctx).toEqual({
      char_constellation: 4,
      weapon_refine: 3,
      hutao_paramita_papilio: true,
      shenhe_icy_quill: 2,
      attack_infusion: "pyro",
    });
  });

  it("does not mutate the input object", () => {
    const input: BuildSettingsInput = {
      constellation: 4,
      toggles: { hutao_paramita_papilio: true },
    };
    const inputCopy = JSON.parse(JSON.stringify(input));
    buildSettings(input);
    expect(input).toEqual(inputCopy);
  });
});

// ---------------------------------------------------------------------------
// 4. Round-trip: Boolean condition
//    Source: raw/.../Condition/Boolean.js → settings[params.name] truthy
// ---------------------------------------------------------------------------

describe("round-trip — Boolean condition", () => {
  const boolCond: ConditionBoolean = {
    type: "boolean",
    name: "hutao_paramita_papilio",
  };

  it("evaluate → true when toggle is on", () => {
    const ctx = buildSettings({ toggles: { hutao_paramita_papilio: true } });
    expect(evaluate(boolCond, ctx)).toBe(true);
  });

  it("evaluate → false when toggle is off", () => {
    const ctx = buildSettings({ toggles: { hutao_paramita_papilio: false } });
    expect(evaluate(boolCond, ctx)).toBe(false);
  });

  it("evaluate → false when toggle key is absent", () => {
    const ctx = buildSettings({});
    expect(evaluate(boolCond, ctx)).toBe(false);
  });

  it("evaluate → false when toggle is off and invert is set", () => {
    const invertedCond: ConditionBoolean = {
      type: "boolean",
      name: "hutao_paramita_papilio",
      invert: true,
    };
    const ctx = buildSettings({ toggles: { hutao_paramita_papilio: false } });
    // invert: true + toggle false → !false → true
    expect(evaluate(invertedCond, ctx)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 5. Round-trip: Constellation condition
//    Source: raw/.../Condition/Constellation.js → settings.char_constellation >= n
// ---------------------------------------------------------------------------

describe("round-trip — Constellation condition", () => {
  const c4cond: ConditionConstellation = {
    type: "constellation",
    constellation: 4,
  };

  it("evaluate → true when constellation >= threshold", () => {
    const ctx = buildSettings({ constellation: 4 });
    expect(evaluate(c4cond, ctx)).toBe(true);
  });

  it("evaluate → true when constellation > threshold", () => {
    const ctx = buildSettings({ constellation: 6 });
    expect(evaluate(c4cond, ctx)).toBe(true);
  });

  it("evaluate → false when constellation < threshold", () => {
    const ctx = buildSettings({ constellation: 3 });
    expect(evaluate(c4cond, ctx)).toBe(false);
  });

  it("evaluate → false when constellation absent (defaults to 0)", () => {
    const ctx = buildSettings({});
    expect(evaluate(c4cond, ctx)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 6. Round-trip: Stacks condition + getStackCount
//    Source: raw/.../Condition/Stacks.js → settings[name] > 0; clamped to maxStacks
// ---------------------------------------------------------------------------

describe("round-trip — Stacks condition", () => {
  const stacksCond: ConditionStacks = {
    type: "stacks",
    name: "shenhe_icy_quill",
    maxStacks: 5,
  };

  it("evaluate → true when stacks > 0", () => {
    const ctx = buildSettings({ stacks: { shenhe_icy_quill: 3 } });
    expect(evaluate(stacksCond, ctx)).toBe(true);
  });

  it("evaluate → false when stacks = 0", () => {
    const ctx = buildSettings({ stacks: { shenhe_icy_quill: 0 } });
    expect(evaluate(stacksCond, ctx)).toBe(false);
  });

  it("evaluate → false when stacks key absent", () => {
    const ctx = buildSettings({});
    expect(evaluate(stacksCond, ctx)).toBe(false);
  });

  it("getStackCount returns exact count when within maxStacks", () => {
    const ctx = buildSettings({ stacks: { shenhe_icy_quill: 3 } });
    expect(getStackCount(stacksCond, ctx)).toBe(3);
  });

  it("getStackCount clamps to maxStacks", () => {
    const ctx = buildSettings({ stacks: { shenhe_icy_quill: 10 } });
    expect(getStackCount(stacksCond, ctx)).toBe(5);
  });

  it("getStackCount returns 0 when inactive", () => {
    const ctx = buildSettings({ stacks: { shenhe_icy_quill: 0 } });
    expect(getStackCount(stacksCond, ctx)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 7. Round-trip: StaticRefine — weapon_refine key
//    Source: raw/.../Condition/Static/Refine.js → stat.getValue(settings.weapon_refine)
//    Note: evaluate() on a refine condition uses Static semantics (always active if gate passes).
//    We test that weapon_refine is in the context for downstream stat lookups.
// ---------------------------------------------------------------------------

describe("round-trip — StaticRefine condition", () => {
  const refineCond: ConditionStaticRefine = {
    type: "refine",
    name: "some_weapon_passive",
  };

  it("evaluate → true (static semantics, always active)", () => {
    const ctx = buildSettings({ weaponRefine: 3 });
    expect(evaluate(refineCond, ctx)).toBe(true);
  });

  it("weapon_refine key is present in context for stat-table lookup", () => {
    const ctx = buildSettings({ weaponRefine: 3 });
    expect(ctx["weapon_refine"]).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// 8. Round-trip: Static condition
// ---------------------------------------------------------------------------

describe("round-trip — Static condition", () => {
  const staticCond: ConditionStatic = {
    type: "static",
    name: "some_ascension_passive",
  };

  it("evaluate → true (always active, no ctx keys needed)", () => {
    const ctx = buildSettings({});
    expect(evaluate(staticCond, ctx)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 9. Round-trip: Number condition
//    Source: raw/.../Condition/Number.js → settings[name] > 0
// ---------------------------------------------------------------------------

describe("round-trip — Number condition", () => {
  const numCond: ConditionNumber = {
    type: "number",
    name: "some_slider",
    min: 0,
    max: 100,
  };

  it("evaluate → true when value > 0 (via stacks map)", () => {
    const ctx = buildSettings({ stacks: { some_slider: 50 } });
    expect(evaluate(numCond, ctx)).toBe(true);
  });

  it("evaluate → false when value = 0", () => {
    const ctx = buildSettings({ stacks: { some_slider: 0 } });
    expect(evaluate(numCond, ctx)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 10. Round-trip: And / Or composition
// ---------------------------------------------------------------------------

describe("round-trip — And / Or composition", () => {
  const boolA: ConditionBoolean = { type: "boolean", name: "flag_a" };
  const boolB: ConditionBoolean = { type: "boolean", name: "flag_b" };

  it("And → true when all items true", () => {
    const ctx = buildSettings({ toggles: { flag_a: true, flag_b: true } });
    expect(evaluate({ type: "and", items: [boolA, boolB] }, ctx)).toBe(true);
  });

  it("And → false when any item false", () => {
    const ctx = buildSettings({ toggles: { flag_a: true, flag_b: false } });
    expect(evaluate({ type: "and", items: [boolA, boolB] }, ctx)).toBe(false);
  });

  it("Or → true when any item true", () => {
    const ctx = buildSettings({ toggles: { flag_a: false, flag_b: true } });
    expect(evaluate({ type: "or", items: [boolA, boolB] }, ctx)).toBe(true);
  });

  it("Or → false when all items false", () => {
    const ctx = buildSettings({ toggles: { flag_a: false, flag_b: false } });
    expect(evaluate({ type: "or", items: [boolA, boolB] }, ctx)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 11. Acceptance criterion from brief
// ---------------------------------------------------------------------------

describe("acceptance criterion from brief", () => {
  it("buildSettings({constellation:4, weaponRefine:3, toggles:{hutao_paramita_papilio:true}}) produces exact bag", () => {
    const ctx = buildSettings({
      constellation: 4,
      weaponRefine: 3,
      toggles: { hutao_paramita_papilio: true },
    });
    expect(ctx).toEqual({
      char_constellation: 4,
      weapon_refine: 3,
      hutao_paramita_papilio: true,
    });

    // Boolean condition active
    const boolCond: ConditionBoolean = {
      type: "boolean",
      name: "hutao_paramita_papilio",
    };
    expect(evaluate(boolCond, ctx)).toBe(true);

    // Constellation >= 4 active
    const c4cond: ConditionConstellation = {
      type: "constellation",
      constellation: 4,
    };
    expect(evaluate(c4cond, ctx)).toBe(true);

    // Refine condition active (Static semantics)
    const refineCond: ConditionStaticRefine = {
      type: "refine",
      name: "some_weapon",
    };
    expect(evaluate(refineCond, ctx)).toBe(true);
    expect(ctx["weapon_refine"]).toBe(3);
  });

  it("empty input → {} (base / C0 path is byte-unchanged)", () => {
    expect(buildSettings()).toEqual({});
    expect(buildSettings({})).toEqual({});
  });
});
