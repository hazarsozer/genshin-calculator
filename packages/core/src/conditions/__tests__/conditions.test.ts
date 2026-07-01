/**
 * Condition system tests — TDD per task P1.4.
 *
 * Covers:
 *   1. Boolean + Or  → Noblesse Oblige 4pc pattern (self-set OR team-toggle)
 *   2. Number/Stacks → stack count gating & scaling (Shenhe-style flat term)
 *   3. Constellation gate → active/inactive by constellation level
 *   4. StaticRefine   → weapon R1-R5 scaling
 *   5. Static         → always-on (sub-conditions permitting)
 *   6. And combinator → all must be true
 *   7. Or combinator  → at least one must be true
 */

import { describe, expect, it } from "vitest";
import {
  evaluate,
  conditionStats,
  conditionSettings,
  getStackCount,
  type EvalContext,
} from "../index.js";
import type {
  Condition,
  ConditionBoolean,
  ConditionStatic,
  ConditionConstellation,
  ConditionStaticRefine,
  ConditionNumber,
  ConditionStacks,
  ConditionBooleanPiecesCount,
  ConditionBooleanWeaponType,
  ConditionEnemyStatus,
  ConditionBooleanValue,
  ConditionDropdown,
  ConditionNot,
  ConditionLithic,
  ConditionBooleanChar,
  ConditionBooleanNightSoul,
  ConditionBooleanEnemyType,
  ConditionBooleanCharElement,
  ConditionDropdownElement,
  ConditionElementsCount,
  ConditionAnd,
  ConditionOr,
} from "@genshin/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const emptyCtx: EvalContext = {};

// ---------------------------------------------------------------------------
// 1. Boolean condition
// ---------------------------------------------------------------------------

describe("ConditionBoolean", () => {
  it("is inactive when the setting key is absent", () => {
    const c: ConditionBoolean = { type: "boolean", name: "test_toggle" };
    expect(evaluate(c, emptyCtx)).toBe(false);
  });

  it("is inactive when the setting key is falsy", () => {
    const c: ConditionBoolean = { type: "boolean", name: "test_toggle" };
    expect(evaluate(c, { test_toggle: false })).toBe(false);
    expect(evaluate(c, { test_toggle: 0 })).toBe(false);
  });

  it("is active when the setting key is truthy", () => {
    const c: ConditionBoolean = { type: "boolean", name: "test_toggle" };
    expect(evaluate(c, { test_toggle: true })).toBe(true);
    expect(evaluate(c, { test_toggle: 1 })).toBe(true);
  });

  it("invert: flips the result", () => {
    const c: ConditionBoolean = { type: "boolean", name: "test_toggle", invert: true };
    expect(evaluate(c, { test_toggle: true })).toBe(false);
    expect(evaluate(c, emptyCtx)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 2. Static condition (always-on)
// ---------------------------------------------------------------------------

describe("ConditionStatic", () => {
  it("is always active when no sub-condition", () => {
    const c: ConditionStatic = { type: "static" };
    expect(evaluate(c, emptyCtx)).toBe(true);
  });

  it("invert: returns false", () => {
    const c: ConditionStatic = { type: "static", invert: true };
    expect(evaluate(c, emptyCtx)).toBe(false);
  });

  it("respects a gating condition", () => {
    const gate: ConditionBoolean = { type: "boolean", name: "gate" };
    const c: ConditionStatic = { type: "static", condition: gate };
    expect(evaluate(c, emptyCtx)).toBe(false);
    expect(evaluate(c, { gate: true })).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 3. Constellation condition
// ---------------------------------------------------------------------------

describe("ConditionConstellation", () => {
  it("is inactive below the required constellation", () => {
    const c: ConditionConstellation = { type: "constellation", constellation: 2 };
    expect(evaluate(c, { char_constellation: 1 })).toBe(false);
    expect(evaluate(c, { char_constellation: 0 })).toBe(false);
  });

  it("is active at or above the required constellation", () => {
    const c: ConditionConstellation = { type: "constellation", constellation: 2 };
    expect(evaluate(c, { char_constellation: 2 })).toBe(true);
    expect(evaluate(c, { char_constellation: 6 })).toBe(true);
  });

  it("invert: flips the result", () => {
    const c: ConditionConstellation = { type: "constellation", constellation: 2, invert: true };
    expect(evaluate(c, { char_constellation: 2 })).toBe(false);
    expect(evaluate(c, { char_constellation: 1 })).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 4. StaticRefine condition
// ---------------------------------------------------------------------------

describe("ConditionStaticRefine", () => {
  it("is always active (StaticRefine inherits Static semantics)", () => {
    const c: ConditionStaticRefine = { type: "refine", refinementStats: [{ atk_percent: 20 }] };
    expect(evaluate(c, emptyCtx)).toBe(true);
  });

  it("invert: returns false", () => {
    const c: ConditionStaticRefine = { type: "refine", invert: true, refinementStats: [{ atk_percent: 20 }] };
    expect(evaluate(c, emptyCtx)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 5. Number condition
// ---------------------------------------------------------------------------

describe("ConditionNumber", () => {
  it("is inactive when setting is 0 or missing", () => {
    const c: ConditionNumber = { type: "number", name: "bond_level", max: 5 };
    expect(evaluate(c, emptyCtx)).toBe(false);
    expect(evaluate(c, { bond_level: 0 })).toBe(false);
  });

  it("is active when setting is > 0", () => {
    const c: ConditionNumber = { type: "number", name: "bond_level", max: 5 };
    expect(evaluate(c, { bond_level: 3 })).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 6. Stacks condition
// ---------------------------------------------------------------------------

describe("ConditionStacks", () => {
  it("is inactive when stacks = 0 or missing", () => {
    const c: ConditionStacks = { type: "stacks", name: "quill_stacks", maxStacks: 5 };
    expect(evaluate(c, emptyCtx)).toBe(false);
    expect(evaluate(c, { quill_stacks: 0 })).toBe(false);
  });

  it("is active when stacks > 0", () => {
    const c: ConditionStacks = { type: "stacks", name: "quill_stacks", maxStacks: 5 };
    expect(evaluate(c, { quill_stacks: 3 })).toBe(true);
  });

  it("getStackCount returns 0 when inactive", () => {
    const c: ConditionStacks = { type: "stacks", name: "quill_stacks", maxStacks: 5 };
    expect(getStackCount(c, emptyCtx)).toBe(0);
  });

  it("getStackCount returns the context value clamped to maxStacks", () => {
    const c: ConditionStacks = { type: "stacks", name: "quill_stacks", maxStacks: 5 };
    expect(getStackCount(c, { quill_stacks: 3 })).toBe(3);
    expect(getStackCount(c, { quill_stacks: 99 })).toBe(5); // clamped
    expect(getStackCount(c, { quill_stacks: 5 })).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// 7. And combinator
// ---------------------------------------------------------------------------

describe("ConditionAnd", () => {
  const toggle_a: ConditionBoolean = { type: "boolean", name: "a" };
  const toggle_b: ConditionBoolean = { type: "boolean", name: "b" };

  it("is false when neither child is active", () => {
    const c: ConditionAnd = { type: "and", items: [toggle_a, toggle_b] };
    expect(evaluate(c, emptyCtx)).toBe(false);
  });

  it("is false when only one child is active", () => {
    const c: ConditionAnd = { type: "and", items: [toggle_a, toggle_b] };
    expect(evaluate(c, { a: true })).toBe(false);
    expect(evaluate(c, { b: true })).toBe(false);
  });

  it("is true when all children are active", () => {
    const c: ConditionAnd = { type: "and", items: [toggle_a, toggle_b] };
    expect(evaluate(c, { a: true, b: true })).toBe(true);
  });

  it("is true with an empty items list (vacuous truth)", () => {
    const c: ConditionAnd = { type: "and", items: [] };
    expect(evaluate(c, emptyCtx)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 8. Or combinator
// ---------------------------------------------------------------------------

describe("ConditionOr", () => {
  const toggle_a: ConditionBoolean = { type: "boolean", name: "a" };
  const toggle_b: ConditionBoolean = { type: "boolean", name: "b" };

  it("is false when no children are active", () => {
    const c: ConditionOr = { type: "or", items: [toggle_a, toggle_b] };
    expect(evaluate(c, emptyCtx)).toBe(false);
  });

  it("is true when at least one child is active", () => {
    const c: ConditionOr = { type: "or", items: [toggle_a, toggle_b] };
    expect(evaluate(c, { a: true })).toBe(true);
    expect(evaluate(c, { b: true })).toBe(true);
    expect(evaluate(c, { a: true, b: true })).toBe(true);
  });

  it("is false with empty items list", () => {
    const c: ConditionOr = { type: "or", items: [] };
    expect(evaluate(c, emptyCtx)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 9. Noblesse Oblige 4pc composite (the spec's key example)
//
//   "atk_percent: 20 is active when:
//     (self has 4pc noblesse AND wearing noblesse) OR team-toggle"
//
//   Modelled as: Or( And(wearing, piecesCount), team_toggle )
//   In our simple boolean terms:
//     Or( And(set_noblesse_4, wearing_noblesse), set_other_noblesse_4 )
// ---------------------------------------------------------------------------

describe("Noblesse Oblige Or pattern", () => {
  const selfHas4pc: ConditionBoolean = { type: "boolean", name: "set.noblesse_oblige_4" };
  const teamToggle: ConditionBoolean = { type: "boolean", name: "set_other.noblesse_oblige_4" };

  const noblesse4pc: ConditionOr = {
    type: "or",
    items: [
      // self path: And(set.noblesse_4, pieces >= 4) — simplified to two booleans
      { type: "and", items: [selfHas4pc] } as ConditionAnd,
      teamToggle,
    ],
  };

  it("is inactive when nothing is set", () => {
    expect(evaluate(noblesse4pc, emptyCtx)).toBe(false);
  });

  it("is active when team toggle is on", () => {
    expect(evaluate(noblesse4pc, { "set_other.noblesse_oblige_4": true })).toBe(true);
  });

  it("is active when self has the 4pc set", () => {
    expect(evaluate(noblesse4pc, { "set.noblesse_oblige_4": true })).toBe(true);
  });

  it("is active when both self and team are active", () => {
    expect(
      evaluate(noblesse4pc, {
        "set.noblesse_oblige_4": true,
        "set_other.noblesse_oblige_4": true,
      })
    ).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 9b. Number/Stacks gate path (covers uncovered branches)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// 9b. ConditionBoolean gate/name-absent branches
// ---------------------------------------------------------------------------

describe("ConditionBoolean gate branch", () => {
  it("is inactive when gating condition is false even if setting is truthy", () => {
    const gate: ConditionBoolean = { type: "boolean", name: "gate" };
    const c: ConditionBoolean = { type: "boolean", name: "toggle", condition: gate };
    expect(evaluate(c, { toggle: true })).toBe(false); // gate off → false
    expect(evaluate(c, { gate: true, toggle: true })).toBe(true); // gate on → true
  });

  it("is inactive when name is absent (no key to look up)", () => {
    const c: ConditionBoolean = { type: "boolean" }; // no name
    expect(evaluate(c, { anything: true })).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 9c. ConditionBooleanWeaponType — gates on the wearer's weapon type
//
// Ports raw/genshin_calc_pub/src/js/classes/Condition/Boolean/WeaponType.js:
//   result = checkSubconditions(settings) && types.includes(settings.weapon_type)
// ---------------------------------------------------------------------------

describe("ConditionBooleanWeaponType", () => {
  const meleeTypes: ConditionBooleanWeaponType = {
    type: "weapon-type",
    types: ["sword", "claymore", "polearm"],
  };

  it("is active when weapon_type is in the allowed list", () => {
    expect(evaluate(meleeTypes, { weapon_type: "claymore" })).toBe(true);
    expect(evaluate(meleeTypes, { weapon_type: "sword" })).toBe(true);
    expect(evaluate(meleeTypes, { weapon_type: "polearm" })).toBe(true);
  });

  it("is inactive when weapon_type is NOT in the allowed list", () => {
    expect(evaluate(meleeTypes, { weapon_type: "bow" })).toBe(false);
    expect(evaluate(meleeTypes, { weapon_type: "catalyst" })).toBe(false);
  });

  it("is inactive when weapon_type is absent from the context", () => {
    expect(evaluate(meleeTypes, {})).toBe(false);
  });

  it("is inactive when weapon_type is not a string", () => {
    expect(evaluate(meleeTypes, { weapon_type: 1 })).toBe(false);
  });

  it("invert: flips the result (active when NOT in the list)", () => {
    const inverted: ConditionBooleanWeaponType = {
      type: "weapon-type",
      types: ["sword", "claymore", "polearm"],
      invert: true,
    };
    expect(evaluate(inverted, { weapon_type: "bow" })).toBe(true);
    expect(evaluate(inverted, { weapon_type: "claymore" })).toBe(false);
  });

  it("respects the optional .condition gate (inner gate must pass first)", () => {
    const gate: ConditionBoolean = { type: "boolean", name: "gate" };
    const gated: ConditionBooleanWeaponType = {
      type: "weapon-type",
      types: ["claymore"],
      condition: gate,
    };
    // gate off → false even if weapon_type matches
    expect(evaluate(gated, { weapon_type: "claymore" })).toBe(false);
    // gate on + matching weapon_type → true
    expect(evaluate(gated, { weapon_type: "claymore", gate: true })).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 9d. ConditionEnemyStatus — gates on the enemy's elemental affliction status
//
// Ports raw/genshin_calc_pub/src/js/classes/Condition/Boolean/EnemyStatus.js:
//   status = settings['common.enemy_status'];
//   result = status && this.params.status.includes(status);  // else false
// ---------------------------------------------------------------------------

describe("ConditionEnemyStatus", () => {
  const vsWater: ConditionEnemyStatus = {
    type: "enemy-status",
    statuses: ["cryo", "hydro"],
  };

  it("is active when common.enemy_status is in the allowed list", () => {
    expect(evaluate(vsWater, { "common.enemy_status": "cryo" })).toBe(true);
    expect(evaluate(vsWater, { "common.enemy_status": "hydro" })).toBe(true);
  });

  it("is inactive when common.enemy_status is NOT in the allowed list", () => {
    expect(evaluate(vsWater, { "common.enemy_status": "pyro" })).toBe(false);
  });

  it("is inactive when common.enemy_status is absent (the oracle baseline)", () => {
    expect(evaluate(vsWater, {})).toBe(false);
  });

  it("is inactive when common.enemy_status is the empty string", () => {
    expect(evaluate(vsWater, { "common.enemy_status": "" })).toBe(false);
  });

  it("invert: flips the result (active when NOT affected — the Everfrost non-cryo branch)", () => {
    const inverted: ConditionEnemyStatus = {
      type: "enemy-status",
      statuses: ["cryo"],
      invert: true,
    };
    // no status set → not-cryo branch ACTIVE (this is the v5.8 oracle case)
    expect(evaluate(inverted, {})).toBe(true);
    expect(evaluate(inverted, { "common.enemy_status": "cryo" })).toBe(false);
  });

  it("respects the optional .condition gate", () => {
    const gate: ConditionBoolean = { type: "boolean", name: "gate" };
    const gated: ConditionEnemyStatus = {
      type: "enemy-status",
      statuses: ["pyro"],
      condition: gate,
    };
    expect(evaluate(gated, { "common.enemy_status": "pyro" })).toBe(false);
    expect(evaluate(gated, { "common.enemy_status": "pyro", gate: true })).toBe(true);
  });

  it("conditionStats: contributes no stats of its own (pure gate)", () => {
    expect(conditionStats(vsWater, { "common.enemy_status": "cryo" })).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// 9e. ConditionBooleanValue — gates on a numeric threshold comparison
//
// Ports raw/genshin_calc_pub/src/js/classes/Condition/Boolean/Value.js:
//   value2 = settings[setting] || 0;  active = value2 <cond> value
// ---------------------------------------------------------------------------

describe("ConditionBooleanValue", () => {
  const maxStack: ConditionBooleanValue = {
    type: "boolean-value",
    setting: "weapon_jade_spear",
    cond: "ge",
    value: 7,
    refinementStats: [{ dmg_all: 12 }, { dmg_all: 15 }, { dmg_all: 18 }, { dmg_all: 21 }, { dmg_all: 24 }],
  };

  it("is active when ctx[setting] meets the >= threshold", () => {
    expect(evaluate(maxStack, { weapon_jade_spear: 7 })).toBe(true);
    expect(evaluate(maxStack, { weapon_jade_spear: 8 })).toBe(true);
  });

  it("is inactive below the threshold (and when the key is absent → 0)", () => {
    expect(evaluate(maxStack, { weapon_jade_spear: 6 })).toBe(false);
    expect(evaluate(maxStack, {})).toBe(false);
  });

  it("honours each comparison operator", () => {
    const mk = (cond: ConditionBooleanValue["cond"]): ConditionBooleanValue => ({
      type: "boolean-value", setting: "s", cond, value: 3,
    });
    expect(evaluate(mk("gt"), { s: 4 })).toBe(true);
    expect(evaluate(mk("gt"), { s: 3 })).toBe(false);
    expect(evaluate(mk("eq"), { s: 3 })).toBe(true);
    expect(evaluate(mk("lt"), { s: 2 })).toBe(true);
    expect(evaluate(mk("le"), { s: 3 })).toBe(true);
  });

  it("invert flips the result", () => {
    const inv: ConditionBooleanValue = { type: "boolean-value", setting: "s", cond: "ge", value: 3, invert: true };
    expect(evaluate(inv, { s: 1 })).toBe(true);
    expect(evaluate(inv, { s: 3 })).toBe(false);
  });

  it("conditionStats: refine-scaled bag when active", () => {
    expect(conditionStats(maxStack, { weapon_jade_spear: 7, weapon_refine: 1 })).toEqual({ dmg_all: 12 });
    expect(conditionStats(maxStack, { weapon_jade_spear: 7, weapon_refine: 5 })).toEqual({ dmg_all: 24 });
    expect(conditionStats(maxStack, { weapon_jade_spear: 6, weapon_refine: 5 })).toEqual({});
  });

  it("respects the optional .condition gate", () => {
    const gate: ConditionBoolean = { type: "boolean", name: "g" };
    const gated: ConditionBooleanValue = { type: "boolean-value", setting: "s", cond: "ge", value: 1, condition: gate };
    expect(evaluate(gated, { s: 5 })).toBe(false);
    expect(evaluate(gated, { s: 5, g: true })).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 9f. ConditionDropdown — multi-state selector; active option → refine-scaled bag
//
// Ports raw/genshin_calc_pub/src/js/classes/Condition/Dropdown.js
// ---------------------------------------------------------------------------

describe("ConditionDropdown", () => {
  const sel: ConditionDropdown = {
    type: "dropdown",
    name: "weapon_polar_star",
    options: [
      [{ atk_percent: 10 }, { atk_percent: 12.5 }, { atk_percent: 15 }, { atk_percent: 17.5 }, { atk_percent: 20 }],
      [{ atk_percent: 20 }, { atk_percent: 25 }, { atk_percent: 30 }, { atk_percent: 35 }, { atk_percent: 40 }],
      [{ atk_percent: 30 }, { atk_percent: 37.5 }, { atk_percent: 45 }, { atk_percent: 52.5 }, { atk_percent: 60 }],
      [{ atk_percent: 48 }, { atk_percent: 60 }, { atk_percent: 72 }, { atk_percent: 84 }, { atk_percent: 96 }],
    ],
  };

  it("is active when a positive option is selected, inactive at 0/absent", () => {
    expect(evaluate(sel, { weapon_polar_star: 4 })).toBe(true);
    expect(evaluate(sel, { weapon_polar_star: 0 })).toBe(false);
    expect(evaluate(sel, {})).toBe(false);
  });

  it("conditionStats: the selected option's refine-scaled bag", () => {
    expect(conditionStats(sel, { weapon_polar_star: 4, weapon_refine: 1 })).toEqual({ atk_percent: 48 });
    expect(conditionStats(sel, { weapon_polar_star: 4, weapon_refine: 5 })).toEqual({ atk_percent: 96 });
    expect(conditionStats(sel, { weapon_polar_star: 1, weapon_refine: 1 })).toEqual({ atk_percent: 10 });
    expect(conditionStats(sel, { weapon_polar_star: 0, weapon_refine: 1 })).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// 9g. Char-attribute gates + ConditionNot (E3 char-attribute wave)
// ---------------------------------------------------------------------------

describe("ConditionNot", () => {
  it("active iff NOT all items are active", () => {
    const c: ConditionNot = { type: "not", items: [{ type: "boolean", name: "x" }] };
    expect(evaluate(c, {})).toBe(true); // x off → not(false) = true
    expect(evaluate(c, { x: true })).toBe(false);
  });
  it("nests Or (The Widsith theme exclusivity)", () => {
    const c: ConditionNot = {
      type: "not",
      items: [{ type: "or", items: [{ type: "boolean", name: "a" }, { type: "boolean", name: "b" }] }],
    };
    expect(evaluate(c, {})).toBe(true);
    expect(evaluate(c, { a: true })).toBe(false);
  });
  it("conditionStats: pure gate", () => {
    expect(conditionStats({ type: "not", items: [] }, {})).toEqual({});
  });
});

describe("ConditionLithic", () => {
  const c: ConditionLithic = { type: "lithic" };
  it("always active; publishes weapon_lithic_stacks from char_origin", () => {
    expect(evaluate(c, {})).toBe(true);
    expect(conditionSettings(c, { char_origin: "liyue" })).toEqual({ weapon_lithic_stacks: 1 });
    expect(conditionSettings(c, { char_origin: "mondstadt" })).toEqual({ weapon_lithic_stacks: 0 });
    expect(conditionSettings(c, {})).toEqual({ weapon_lithic_stacks: 0 });
  });
});

describe("ConditionBooleanChar / NightSoul / EnemyType", () => {
  it("boolean-char gates on char_name", () => {
    const c: ConditionBooleanChar = { type: "boolean-char", chars: ["aloy"] };
    expect(evaluate(c, { char_name: "aloy" })).toBe(true);
    expect(evaluate(c, { char_name: "ganyu" })).toBe(false);
    expect(evaluate(c, {})).toBe(false);
  });
  it("nightsoul gates on natlan origin", () => {
    const c: ConditionBooleanNightSoul = { type: "nightsoul" };
    expect(evaluate(c, { char_origin: "natlan" })).toBe(true);
    expect(evaluate(c, { char_origin: "mondstadt" })).toBe(false);
  });
  it("enemy-type is inert when enemy_type unset (the oracle baseline)", () => {
    const c: ConditionBooleanEnemyType = { type: "enemy-type", types: ["slime"] };
    expect(evaluate(c, {})).toBe(false);
    expect(evaluate(c, { enemy_type: "slime" })).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 9h. ConditionBooleanCharElement + ConditionDropdownElement
//     (ViridescentVenerer 4pc swirl res-shred — Phase 3 ② / D4)
// ---------------------------------------------------------------------------

describe("ConditionBooleanCharElement", () => {
  it("gates on char_element membership", () => {
    const c: ConditionBooleanCharElement = { type: "char-element", elements: ["anemo"] };
    expect(evaluate(c, { char_element: "anemo" })).toBe(true);
    expect(evaluate(c, { char_element: "pyro" })).toBe(false);
    expect(evaluate(c, {})).toBe(false);
  });
  it("supports multiple allowed elements", () => {
    const c: ConditionBooleanCharElement = { type: "char-element", elements: ["pyro", "hydro"] };
    expect(evaluate(c, { char_element: "hydro" })).toBe(true);
    expect(evaluate(c, { char_element: "cryo" })).toBe(false);
  });
  it("invert flips the result", () => {
    const c: ConditionBooleanCharElement = { type: "char-element", elements: ["anemo"], invert: true };
    expect(evaluate(c, { char_element: "anemo" })).toBe(false);
    expect(evaluate(c, { char_element: "pyro" })).toBe(true);
  });
  it("conditionStats: pure gate (no stats)", () => {
    const c: ConditionBooleanCharElement = { type: "char-element", elements: ["anemo"] };
    expect(conditionStats(c, { char_element: "anemo" })).toEqual({});
  });
});

describe("ConditionDropdownElement", () => {
  it("active when the element is present in the ;-delimited selection string", () => {
    const c: ConditionDropdownElement = { type: "dropdown-element", name: "set.viridescent_venerer_4", element: "pyro" };
    expect(evaluate(c, { "set.viridescent_venerer_4": "pyro" })).toBe(true);
    expect(evaluate(c, { "set.viridescent_venerer_4": "cryo;electro;pyro" })).toBe(true);
    expect(evaluate(c, { "set.viridescent_venerer_4": "cryo;electro" })).toBe(false);
    expect(evaluate(c, { "set.viridescent_venerer_4": "" })).toBe(false);
    expect(evaluate(c, {})).toBe(false);
  });
  it("does not match on substring (split must be exact-token)", () => {
    // "pyro" must NOT match within "cryopyro"; the split is on ';'.
    const c: ConditionDropdownElement = { type: "dropdown-element", name: "k", element: "pyro" };
    expect(evaluate(c, { k: "cryopyro" })).toBe(false);
    expect(evaluate(c, { k: "pyro;hydro" })).toBe(true);
  });
  it("conditionStats: pure gate (no stats of its own)", () => {
    const c: ConditionDropdownElement = { type: "dropdown-element", name: "k", element: "pyro" };
    expect(conditionStats(c, { k: "pyro" })).toEqual({});
  });
  it("composes under AND with char-element (the VV self-worn shred gate)", () => {
    const gate: ConditionAnd = {
      type: "and",
      items: [
        { type: "dropdown-element", name: "set.viridescent_venerer_4", element: "pyro" },
        { type: "char-element", elements: ["anemo"] },
      ],
    };
    expect(evaluate(gate, { "set.viridescent_venerer_4": "pyro", char_element: "anemo" })).toBe(true);
    // wrong element selected
    expect(evaluate(gate, { "set.viridescent_venerer_4": "cryo", char_element: "anemo" })).toBe(false);
    // non-anemo wielder
    expect(evaluate(gate, { "set.viridescent_venerer_4": "pyro", char_element: "pyro" })).toBe(false);
  });
});

describe("ConditionConstellation missing ctx key", () => {
  it("treats missing char_constellation as 0", () => {
    const c: ConditionConstellation = { type: "constellation", constellation: 1 };
    expect(evaluate(c, emptyCtx)).toBe(false); // 0 < 1 → inactive
  });
});

describe("ConditionNumber gate branch", () => {
  it("is inactive when gating condition is false", () => {
    const gate: ConditionBoolean = { type: "boolean", name: "gate" };
    const c: ConditionNumber = { type: "number", name: "stacks", max: 5, condition: gate };
    // gate is false → whole condition is false even if stacks > 0
    expect(evaluate(c, { stacks: 3 })).toBe(false);
  });

  it("is inactive when name is undefined (no settings key to read)", () => {
    // name is absent, so raw is undefined → typeof check returns false
    const c: ConditionNumber = { type: "number", max: 5 };
    expect(evaluate(c, { anything: 3 })).toBe(false);
  });
});

describe("ConditionStacks gate branch", () => {
  it("is inactive when gating condition is false", () => {
    const gate: ConditionBoolean = { type: "boolean", name: "gate" };
    const c: ConditionStacks = { type: "stacks", name: "quill", maxStacks: 5, condition: gate };
    expect(evaluate(c, { quill: 3 })).toBe(false);
  });

  it("getStackCount is 0 when name is absent", () => {
    const c: ConditionStacks = { type: "stacks", maxStacks: 5 };
    expect(getStackCount(c, { anything: 3 })).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 10. Stacks scaling (Shenhe Quill-style flat term scaled by stack count)
//
//   The condition gates and the stack count multiplies the per-stack value.
// ---------------------------------------------------------------------------

describe("Stacks scaling (Shenhe Quill-style)", () => {
  const quill: ConditionStacks = {
    type: "stacks",
    name: "shenhe_icy_quill",
    maxStacks: 5,
  };

  it("returns correct stacks for various counts", () => {
    expect(getStackCount(quill, { shenhe_icy_quill: 1 })).toBe(1);
    expect(getStackCount(quill, { shenhe_icy_quill: 5 })).toBe(5);
    expect(getStackCount(quill, { shenhe_icy_quill: 7 })).toBe(5); // clamped
  });

  it("flat term scales linearly with stacks", () => {
    const perStackValue = 100; // e.g. Shenhe's Quill cryo flat bonus
    const ctx3: EvalContext = { shenhe_icy_quill: 3 };
    const stackedBonus = getStackCount(quill, ctx3) * perStackValue;
    expect(stackedBonus).toBe(300);
  });
});

// ---------------------------------------------------------------------------
// 11. PiecesCount gate (artifact-set equipped-count condition)
//
//   Active when ctx["set_pieces.<setName lowercased>"] >= count, AND the optional
//   `.condition` gate passes. Ports Condition/Boolean/PiecesCount.js. Used by the
//   global set buffs (db/Buffs/Artifacts.js) in the self-set OR team pattern.
// ---------------------------------------------------------------------------

describe("ConditionBooleanPiecesCount", () => {
  const noblesse4: ConditionBooleanPiecesCount = {
    type: "pieces-count",
    setName: "NoblesseOblige",
    count: 4,
  };

  it("is inactive when the set_pieces setting is absent", () => {
    expect(evaluate(noblesse4, emptyCtx)).toBe(false);
  });

  it("is inactive when equipped count is below the threshold", () => {
    expect(evaluate(noblesse4, { "set_pieces.noblesseoblige": 2 })).toBe(false);
  });

  it("is active when equipped count meets the threshold", () => {
    expect(evaluate(noblesse4, { "set_pieces.noblesseoblige": 4 })).toBe(true);
  });

  it("is active when equipped count exceeds the threshold (e.g. 5-piece counted set)", () => {
    expect(evaluate(noblesse4, { "set_pieces.noblesseoblige": 5 })).toBe(true);
  });

  it("lowercases the setName for the setting key (registry-key case-insensitivity)", () => {
    // The setting key is 'set_pieces.' + setName.toLowerCase() — a mixed-case
    // registry key must still match the lowercased injected key.
    expect(evaluate(noblesse4, { "set_pieces.NoblesseOblige": 4 })).toBe(false);
    expect(evaluate(noblesse4, { "set_pieces.noblesseoblige": 4 })).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 12. Self-set OR team-toggle gate — the real Noblesse 4pc ATK buff gate
//
//   raw/.../db/Buffs/Artifacts.js: the +20% ATK Condition is gated by
//     Or( And(boolean set.noblesse_oblige_4, piecesCount NoblesseOblige>=4),
//         boolean set_other.noblesse_oblige_4 )
//   i.e. active if the holder wears 4pc and toggles it, OR a teammate has it.
// ---------------------------------------------------------------------------

describe("Noblesse 4pc ATK gate (self-set OR team)", () => {
  const gate: ConditionOr = {
    type: "or",
    items: [
      {
        type: "and",
        items: [
          { type: "boolean", name: "set.noblesse_oblige_4" } as ConditionBoolean,
          { type: "pieces-count", setName: "NoblesseOblige", count: 4 } as ConditionBooleanPiecesCount,
        ],
      } as ConditionAnd,
      { type: "boolean", name: "set_other.noblesse_oblige_4" } as ConditionBoolean,
    ],
  };

  it("is inactive with neither self-4pc nor team toggle", () => {
    expect(evaluate(gate, {})).toBe(false);
  });

  it("self toggle ON but only 2 pieces equipped → inactive", () => {
    expect(evaluate(gate, { "set.noblesse_oblige_4": true, "set_pieces.noblesseoblige": 2 })).toBe(false);
  });

  it("4 pieces equipped but toggle OFF → inactive (toggle still required)", () => {
    expect(evaluate(gate, { "set_pieces.noblesseoblige": 4 })).toBe(false);
  });

  it("self 4pc + toggle ON → active", () => {
    expect(evaluate(gate, { "set.noblesse_oblige_4": true, "set_pieces.noblesseoblige": 4 })).toBe(true);
  });

  it("teammate has it (set_other) → active even with no self pieces", () => {
    expect(evaluate(gate, { "set_other.noblesse_oblige_4": true })).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 13. ConditionElementsCount (Gorou General's Glory geo-count tiers)
//
//   Counts `element` across the four resonance slots (char_element +
//   resonance_element_1/2/3); active iff that count >= `count`. Base-inert:
//   a solo build only ever sets char_element, so any count >= 2 gate is
//   inactive by construction. Source: .../Condition/ElementsCount.js
// ---------------------------------------------------------------------------

describe("ConditionElementsCount", () => {
  it("is inactive with only char_element set (base-inert, solo)", () => {
    const c: ConditionElementsCount = { type: "elements-count", element: "geo", count: 2 };
    expect(evaluate(c, { char_element: "geo" })).toBe(false);
  });

  it("is inactive when the resonance slot holds a different element", () => {
    const c: ConditionElementsCount = { type: "elements-count", element: "geo", count: 2 };
    expect(evaluate(c, { char_element: "geo", resonance_element_1: "pyro" })).toBe(false);
  });

  it("is active once the count threshold is met", () => {
    const c: ConditionElementsCount = { type: "elements-count", element: "geo", count: 2 };
    expect(evaluate(c, { char_element: "geo", resonance_element_1: "geo" })).toBe(true);
  });

  it("count:3 requires char_element plus two matching resonance slots", () => {
    const c: ConditionElementsCount = { type: "elements-count", element: "geo", count: 3 };
    expect(evaluate(c, { char_element: "geo", resonance_element_1: "geo" })).toBe(false);
    expect(
      evaluate(c, { char_element: "geo", resonance_element_1: "geo", resonance_element_2: "geo" })
    ).toBe(true);
  });

  it("respects a gating condition", () => {
    const gate: ConditionBoolean = { type: "boolean", name: "gate" };
    const c: ConditionElementsCount = {
      type: "elements-count",
      element: "geo",
      count: 2,
      condition: gate,
    };
    const ctx: EvalContext = { char_element: "geo", resonance_element_1: "geo" };
    expect(evaluate(c, ctx)).toBe(false);
    expect(evaluate(c, { ...ctx, gate: true })).toBe(true);
  });

  it("invert: flips the result", () => {
    const c: ConditionElementsCount = {
      type: "elements-count",
      element: "geo",
      count: 2,
      invert: true,
    };
    expect(evaluate(c, { char_element: "geo", resonance_element_1: "geo" })).toBe(false);
    expect(evaluate(c, { char_element: "geo" })).toBe(true);
  });

  it("conditionStats: returns the stats bag only when active", () => {
    const c: ConditionElementsCount = {
      type: "elements-count",
      element: "geo",
      count: 2,
      stats: { crit_dmg_geo: 10 },
    };
    expect(conditionStats(c, { char_element: "geo" })).toEqual({});
    expect(conditionStats(c, { char_element: "geo", resonance_element_1: "geo" })).toEqual({
      crit_dmg_geo: 10,
    });
  });
});
