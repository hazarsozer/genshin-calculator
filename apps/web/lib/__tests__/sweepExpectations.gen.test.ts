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
    if (!(ctrl.name in toggles)) toggles[ctrl.name] = true;
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
