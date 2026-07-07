import { describe, it, expect } from "vitest";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { BuildForm } from "../types";
import { DEFAULT_FORM } from "../defaults";
import { encodeBuild } from "../url";
import { computeBuild } from "../calc";
import { findCharacter, findWeapon } from "../catalog";
import { collectGroupedConditions, extractNestedGateControls } from "../conditions";

/**
 * Generator for the e2e sweep-verification fixture (e2e/fixtures/sweep-selfbuffs.json).
 *
 * Playwright's runner cannot resolve the ESM-only @genshin/data package, so the
 * engine-side expectations (encoded build hash + expected max average) are
 * computed HERE — in the same module graph the app itself uses — and consumed
 * browser-only by e2e/sweep-selfbuffs.spec.ts. Re-runs on every unit-test pass,
 * so the fixture can never go stale against the engine.
 */

const CASES: { char: string; weapon: string }[] = [
  { char: "xilonen", weapon: "cool_steel" }, // nightsoul stance-swap cluster
  { char: "furina", weapon: "cool_steel" }, // fanfare + C2 cap
  { char: "gorou", weapon: "messenger" }, // geo party-element count (solo tier)
  { char: "yun_jin", weapon: "black_tassel" }, // distinct-element NA DEF buff
  { char: "navia", weapon: "bloodtainted_greatsword" }, // A4 element-count
];

/**
 * Boolean gates for the "click-test" cases: nested toggles the UI surfaces via
 * extractNestedGateControls but that are NOT part of collectGroupedConditions'
 * top-level self conditions (see the 2026-07-03 verification-pass finding).
 * Keyed by character slug → the exact gate name(s) an e2e test clicks.
 */
const CLICK_CASES: Record<string, string[]> = {
  gorou: ["gorou_generals_war_banner"],
  xilonen: ["common.nightsoul_blessing_state"],
};

function activateSelf(form: BuildForm): { form: BuildForm; labels: string[] } {
  const char = findCharacter(form.characterKey)!;
  const weapon = findWeapon(form.weaponKey)!;
  const { self } = collectGroupedConditions(char, weapon, []);
  const toggles: Record<string, boolean> = {};
  const stacks: Record<string, number> = {};
  const pooled = new Set<string>();
  for (const c of self) {
    if (c.kind === "boolean") {
      toggles[c.name] = true;
    } else if (c.sharedPool) {
      if (pooled.has(c.name)) continue;
      stacks[c.name] = c.sharedPool.cap;
      for (const sib of c.sharedPool.siblings) pooled.add(sib);
    } else {
      stacks[c.name] = c.max ?? 1;
    }
  }
  for (const ctrl of extractNestedGateControls(char)) {
    if (ctrl.kind === "boolean") {
      if (!(ctrl.name in toggles)) toggles[ctrl.name] = true;
    } else if (!(ctrl.name in stacks)) {
      stacks[ctrl.name] = ctrl.max ?? 1;
    }
  }
  return { form: { ...form, conditions: { toggles, stacks } }, labels: self.map((c) => c.label) };
}

function featureAvgs(form: BuildForm): Map<string, number> {
  const result = computeBuild(form, {}, []);
  expect(result.error, `computeBuild error for ${form.characterKey}`).toBeUndefined();
  expect(result.features.length).toBeGreaterThan(0);
  return new Map(result.features.map((f) => [f.key, Math.round(f.triple[2])]));
}

/** The feature a set of buffs moves the MOST vs. a baseline (max features are
 * often transformative reactions — level-scaled, buff-inert at EM 0). */
function bestMovedFeature(
  offAvgs: Map<string, number>,
  onAvgs: Map<string, number>
): { key: string; diff: number; value: number } {
  let bestKey = "";
  let bestDiff = -1;
  for (const [key, on] of onAvgs) {
    const off = offAvgs.get(key);
    const diff = off === undefined ? on : Math.abs(on - off);
    if (diff > bestDiff) {
      bestDiff = diff;
      bestKey = key;
    }
  }
  return { key: bestKey, diff: bestDiff, value: onAvgs.get(bestKey)! };
}

describe("sweep e2e fixture generation", () => {
  it("computes engine expectations for sweep-fixed characters and writes the fixture", () => {
    const entries = CASES.map(({ char, weapon }) => {
      const base: BuildForm = { ...DEFAULT_FORM, characterKey: char, weaponKey: weapon };
      const offAvgs = featureAvgs(base);
      const { form: onForm, labels } = activateSelf(base);
      const onAvgs = featureAvgs(onForm);
      expect(labels.length, `${char} should expose self conditions`).toBeGreaterThan(0);

      const best = bestMovedFeature(offAvgs, onAvgs);
      expect(
        best.diff,
        `${char}: activating all self buffs should move at least one feature`
      ).toBeGreaterThan(0);

      const clickNames = CLICK_CASES[char] ?? [];
      let clickToggles: { label: string }[] | undefined;
      let clickExpected: number | undefined;
      let clickFeatureKey: string | undefined;
      if (clickNames.length > 0) {
        const char_ = findCharacter(char)!;
        const gateControls = extractNestedGateControls(char_);
        clickToggles = clickNames.map((name) => {
          const ctrl = gateControls.find((c) => c.name === name);
          expect(ctrl, `${char}: click-case gate ${name} must be surfaced`).toBeDefined();
          return { label: ctrl!.label };
        });

        const clickForm: BuildForm = {
          ...base,
          conditions: {
            toggles: Object.fromEntries(clickNames.map((n) => [n, true])),
            stacks: {},
          },
        };
        const clickAvgs = featureAvgs(clickForm);
        const clickBest = bestMovedFeature(offAvgs, clickAvgs);
        expect(
          clickBest.diff,
          `${char}: clicking ${clickNames.join(", ")} alone should move at least one feature`
        ).toBeGreaterThan(0);
        clickExpected = clickBest.value;
        clickFeatureKey = clickBest.key;
      }

      return {
        char,
        hash: encodeBuild(onForm),
        hashOff: encodeBuild(base),
        featureKey: best.key,
        expectedOn: onAvgs.get(best.key)!,
        expectedOff: offAvgs.get(best.key) ?? null,
        firstLabel: labels[0],
        ...(clickToggles ? { clickToggles, clickExpected, clickFeatureKey } : {}),
      };
    });

    const here = dirname(fileURLToPath(import.meta.url));
    const out = join(here, "..", "..", "e2e", "fixtures", "sweep-selfbuffs.json");
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, JSON.stringify(entries, null, 2));
  });
});

/**
 * Generator for the e2e results-depth fixture (e2e/fixtures/results-depth.json),
 * covering Arc A's Stats tab, pin-as-headline, and reaction-override surfaces
 * (Tasks 1, 2, 6). Same rationale as the fixture above: Playwright can't import
 * @genshin/data, so the engine expectations are computed here.
 */
describe("results-depth e2e fixture generation", () => {
  it("computes engine expectations for stats/pin/reaction cases and writes the fixture", () => {
    // --- Stats case: default Bennett build → Stats tab's ATK total row. ---
    const statsForm: BuildForm = { ...DEFAULT_FORM };
    const statsResult = computeBuild(statsForm, {}, []);
    expect(statsResult.error).toBeUndefined();
    expect(statsResult.stats).toBeDefined();
    const expectedTotal = statsResult.stats!.atk_total;
    expect(expectedTotal).toBeGreaterThan(0);

    // --- Pin case: default Bennett build, pin a NON-highest feature and expect
    // the Stage headline to switch to it. ---
    const pinForm: BuildForm = { ...DEFAULT_FORM };
    const pinResult = computeBuild(pinForm, {}, []);
    expect(pinResult.error).toBeUndefined();
    expect(pinResult.features.length).toBeGreaterThan(1);
    const sortedByAvg = [...pinResult.features].sort((a, b) => b.triple[2] - a.triple[2]);
    const highestAvg = sortedByAvg[0].triple[2];
    const pinTarget = sortedByAvg.find((f) => f.triple[2] < highestAvg);
    expect(pinTarget, "need a strictly non-highest feature to pin").toBeDefined();

    // --- Vaporize case: Hu Tao's pyro burst, amplifying-reaction override. ---
    const huTaoBase: BuildForm = {
      ...DEFAULT_FORM,
      characterKey: "hu_tao",
      weaponKey: "staff_of_homa",
      conditions: { toggles: {}, stacks: {} },
    };
    const vaporizeForm: BuildForm = {
      ...huTaoBase,
      conditions: { toggles: {}, stacks: {}, reaction: "vaporize" },
    };
    const baseResult = computeBuild(huTaoBase, {}, []);
    const vapResult = computeBuild(vaporizeForm, {}, []);
    expect(baseResult.error).toBeUndefined();
    expect(vapResult.error).toBeUndefined();
    const baseFeature = baseResult.features.find((f) => f.key === "burst.burst_dmg");
    const vapFeature = vapResult.features.find((f) => f.key === "burst.burst_dmg");
    expect(baseFeature, "hu_tao burst.burst_dmg must exist").toBeDefined();
    expect(vapFeature, "hu_tao burst.burst_dmg must exist under vaporize").toBeDefined();
    expect(vapFeature!.triple[2]).toBeGreaterThan(baseFeature!.triple[2]);

    const fixture = {
      stats: {
        hash: encodeBuild(statsForm),
        statKey: "atk_total",
        expectedTotal,
      },
      pin: {
        hash: encodeBuild(pinForm),
        pinKey: pinTarget!.key,
        pinnedHeadline: pinTarget!.triple[2],
      },
      vaporize: {
        hash: encodeBuild(vaporizeForm),
        featureLabel: vapFeature!.label,
        featureKey: vapFeature!.key,
        expectedAmped: vapFeature!.triple[2],
        expectedBase: baseFeature!.triple[2],
      },
    };

    const here = dirname(fileURLToPath(import.meta.url));
    const out = join(here, "..", "..", "e2e", "fixtures", "results-depth.json");
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, JSON.stringify(fixture, null, 2));
  });
});

/**
 * Generator for the e2e Arc B fixture (e2e/fixtures/food-custom.json), covering
 * the Food drawer's damage-delta ranking (Task 4) and the Custom Buffs section
 * (Task 5). Same rationale as the fixtures above: Playwright can't import
 * @genshin/data, so the engine expectations are computed here.
 */
describe("food-custom e2e fixture generation", () => {
  it("computes engine expectations for the food and custom-buffs cases and writes the fixture", () => {
    // --- Food case: Hu Tao + Staff of Homa, pinned to burst.burst_dmg (default
    // Bennett form's headline is reaction.burgeon — flat transformative, food-
    // insensitive; the pinned burst feature is stable and food-sensitive). ---
    const dishKey = "AdeptusTemptation";
    const tier = 3;
    const foodBase: BuildForm = {
      ...DEFAULT_FORM,
      characterKey: "hu_tao",
      weaponKey: "staff_of_homa",
      conditions: { toggles: {}, stacks: {} },
      pinnedFeature: "burst.burst_dmg",
    };
    const foodForm: BuildForm = {
      ...foodBase,
      food: { Attack: { key: dishKey, tier } },
    };
    const baseResult = computeBuild(foodBase, {}, []);
    const foodResult = computeBuild(foodForm, {}, []);
    expect(baseResult.error).toBeUndefined();
    expect(foodResult.error).toBeUndefined();
    const baseFeature = baseResult.features.find((f) => f.key === "burst.burst_dmg");
    const foodFeature = foodResult.features.find((f) => f.key === "burst.burst_dmg");
    expect(baseFeature, "hu_tao burst.burst_dmg must exist").toBeDefined();
    expect(foodFeature, "hu_tao burst.burst_dmg must exist with food equipped").toBeDefined();
    expect(foodFeature!.triple[2]).not.toEqual(baseFeature!.triple[2]);

    // --- Custom-buffs case: default Bennett form + custom_buffs.atk: 500. ---
    const customBase: BuildForm = { ...DEFAULT_FORM };
    const customForm: BuildForm = { ...DEFAULT_FORM, customBuffs: { atk: 500 } };
    const customBaseResult = computeBuild(customBase, {}, []);
    const customResult = computeBuild(customForm, {}, []);
    expect(customBaseResult.error).toBeUndefined();
    expect(customResult.error).toBeUndefined();
    expect(customBaseResult.stats).toBeDefined();
    expect(customResult.stats).toBeDefined();
    const expectedAtkTotalBase = customBaseResult.stats!.atk_total;
    const expectedAtkTotalCustom = customResult.stats!.atk_total;
    expect(expectedAtkTotalCustom).toBeGreaterThan(expectedAtkTotalBase);

    const fixture = {
      food: {
        hashBase: encodeBuild(foodBase),
        hashFood: encodeBuild(foodForm),
        dishKey,
        tier,
        expectedHeadlineBase: baseFeature!.triple[2],
        expectedHeadlineFood: foodFeature!.triple[2],
      },
      custom: {
        hashBase: encodeBuild(customBase),
        hashCustom: encodeBuild(customForm),
        expectedAtkTotalBase,
        expectedAtkTotalCustom,
      },
    };

    const here = dirname(fileURLToPath(import.meta.url));
    const out = join(here, "..", "..", "e2e", "fixtures", "food-custom.json");
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, JSON.stringify(fixture, null, 2));
  });
});
