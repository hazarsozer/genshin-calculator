/**
 * Task 1 (Arc B) — `ReconstructInput.food` passthrough.
 *
 * `buildStats` already accepts an optional `food` flat-stat bag (buildStats.ts:471,840,
 * proven green by foodBurndown.test.ts), but `reconstructPort` — the web app's entry point —
 * never forwarded it. This test pins the passthrough: (a) absence is provably inert (a call
 * omitting `food` is deep-equal to one passing `food: undefined`), and (b) presence lifts the
 * expected stats (AdeptusTemptation tier 3: atk+372, crit_rate+12 — same values foodBurndown
 * reconstructs from `generated/foodTables.ts`).
 */
import { describe, it, expect } from "vitest";
import { nahida } from "../characters/nahida.js";
import { nocturnesCurtainCall } from "../weapons/nocturnes-curtain-call.js";
import { LEVELS, TALENTS, reconstructSettings, reconstructPort, type ReconstructInput } from "../reconstruct.js";
import { getFoodStats } from "../generated/foodTables.js";

const ENEMY = { level: 90, resistance: 10 } as const;
const STAT_BLOCK = { atk_base: 2000, hp_base: 10000 } as const;

function baseInput(food?: Readonly<Record<string, number>>): ReconstructInput {
  const settings = reconstructSettings({
    charToggles: {},
    setToggles: {},
    passiveToggles: {},
    constellation: 0,
    refine: 1,
  });
  return {
    char: nahida,
    weapon: nocturnesCurtainCall,
    weaponStatTable: nocturnesCurtainCall.statTable,
    statBlock: STAT_BLOCK,
    settings,
    passiveOn: true,
    artifactSets: {},
    setRegistry: {},
    levels: LEVELS,
    talents: TALENTS,
    enemy: ENEMY,
    ...(food !== undefined ? { food } : {}),
  };
}

describe("reconstructPort — food passthrough (base-inert)", () => {
  it("absence is inert: omitting `food` deep-equals passing `food: undefined`", () => {
    // Compare `context` (plain data: stats/enemy/characterLevel) rather than the whole
    // `ReconstructResult` — `compiled` holds fresh closures per call, which are never
    // reference-equal regardless of `food`, so comparing them would be a vacuous check.
    const omitted = reconstructPort(baseInput());
    // `food: undefined` is deliberately runtime-tested but banned by exactOptionalPropertyTypes,
    // so widen through the assertion — the runtime object genuinely carries the key.
    const explicitUndefined = reconstructPort({
      ...baseInput(),
      food: undefined,
    } as unknown as Parameters<typeof reconstructPort>[0]);
    expect(omitted.context).toEqual(explicitUndefined.context);
  });

  it("AdeptusTemptation tier 3 (atk+372, crit_rate+12) lifts atk_total and crit_rate_total", () => {
    const food = getFoodStats("Attack", "AdeptusTemptation", 3);
    expect(food).toEqual({ atk: 372, crit_rate: 12 });

    const without = reconstructPort(baseInput());
    const withFood = reconstructPort(baseInput(food));

    const statsWithout = without.context.stats as Record<string, number | undefined>;
    const statsWith = withFood.context.stats as Record<string, number | undefined>;

    // Discover the emitted key names actually present rather than assuming.
    expect(Object.keys(statsWith)).toEqual(expect.arrayContaining(["atk_total", "crit_rate_total"]));

    expect(statsWith["atk_total"]!).toBeGreaterThan(statsWithout["atk_total"]!);
    expect(statsWith["crit_rate_total"]! - statsWithout["crit_rate_total"]!).toBeCloseTo(0.12, 6);
  });
});
