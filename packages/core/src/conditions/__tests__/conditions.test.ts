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
