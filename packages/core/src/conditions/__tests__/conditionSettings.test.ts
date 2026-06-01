/**
 * conditionSettings resolver tests — P2.C condition-settings propagation.
 *
 * conditionSettings(cond, ctx) is the SETTINGS half of her CalcSet.getBaseStats loop
 * (the stats half is conditionStats): when a condition is active it contributes
 * `cond.settings` (her Condition.getData returning `params.settings`), else `{}`.
 * The propagated keys (e.g. constellation talent bumps `char_skill_*_bonus`,
 * Paramita's `attack_infusion`) flow into the settings downstream resolution reads.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/classes/Condition.js (getData)
 *   raw/genshin_calc_pub/src/js/classes/CalcSet.js (getBaseStats settings merge)
 */

import { describe, expect, it } from "vitest";
import { conditionSettings, type EvalContext } from "../index.js";
import type { Condition } from "@genshin/types";

const emptyCtx: EvalContext = {};

describe("conditionSettings — active variants emit cond.settings", () => {
  it("boolean toggle: settings only when active", () => {
    const c: Condition = {
      type: "boolean",
      name: "hutao_paramita_papilio",
      settings: { attack_infusion: "pyro" },
    };
    expect(conditionSettings(c, emptyCtx)).toEqual({}); // toggle off
    expect(conditionSettings(c, { hutao_paramita_papilio: true })).toEqual({
      attack_infusion: "pyro",
    });
  });

  it("constellation gate: C3 skill bump emits only at/above its level (the talent-bump shape)", () => {
    const c3: Condition = {
      type: "constellation",
      constellation: 3,
      settings: { char_skill_elemental_bonus: 3 },
    };
    expect(conditionSettings(c3, { char_constellation: 2 })).toEqual({}); // below gate
    expect(conditionSettings(c3, { char_constellation: 3 })).toEqual({
      char_skill_elemental_bonus: 3,
    });
    expect(conditionSettings(c3, { char_constellation: 6 })).toEqual({
      char_skill_elemental_bonus: 3,
    });
  });

  it("static (always-on) with settings emits when ungated", () => {
    const c: Condition = { type: "static", settings: { allowed_infusion_cryo: 1 } };
    expect(conditionSettings(c, emptyCtx)).toEqual({ allowed_infusion_cryo: 1 });
  });
});

describe("conditionSettings — empty when no settings to contribute", () => {
  it("active condition without a .settings field → {}", () => {
    const c: Condition = { type: "static", stats: { atk_percent: 20 } };
    expect(conditionSettings(c, emptyCtx)).toEqual({});
  });

  it("logical containers (and/or) carry no settings of their own, even when active", () => {
    const and: Condition = {
      type: "and",
      items: [{ type: "constellation", constellation: 1 }],
    };
    const or: Condition = {
      type: "or",
      items: [{ type: "constellation", constellation: 1 }],
    };
    expect(conditionSettings(and, { char_constellation: 6 })).toEqual({});
    expect(conditionSettings(or, { char_constellation: 6 })).toEqual({});
  });

  it("inactive condition → {} even if it declares settings", () => {
    const c: Condition = {
      type: "constellation",
      constellation: 5,
      settings: { char_skill_burst_bonus: 3 },
    };
    expect(conditionSettings(c, { char_constellation: 0 })).toEqual({});
  });
});
