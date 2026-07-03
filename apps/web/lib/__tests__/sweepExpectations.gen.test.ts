import { describe, it, expect } from "vitest";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { BuildForm } from "../types";
import { DEFAULT_FORM } from "../defaults";
import { encodeBuild } from "../url";
import { computeBuild } from "../calc";
import { findCharacter, findWeapon } from "../catalog";
import { collectGroupedConditions } from "../conditions";

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
 * Boolean gate names nested inside static/and/or conditions and Feature.condition
 * that the UI does NOT surface as controls (see the 2026-07-03 verification-pass
 * finding: conditionToControl only handles top-level boolean/stacks/number/dropdown).
 * They still flow through the URL → settings → engine path, so activating them here
 * lets the e2e verify rendering faithfulness for buffed builds.
 */
function nestedBooleanGates(char: ReturnType<typeof findCharacter> & object): string[] {
  const published = new Set<string>();
  const gates = new Set<string>();
  const walkPublish = (c: unknown): void => {
    if (!c || typeof c !== "object") return;
    const o = c as Record<string, unknown>;
    if (o.settings && typeof o.settings === "object")
      for (const k of Object.keys(o.settings as object)) published.add(k);
    if (o.type === "settings-copy" && typeof o.to === "string") published.add(o.to);
    if (Array.isArray(o.items)) o.items.forEach(walkPublish);
  };
  const walkGates = (c: unknown): void => {
    if (!c || typeof c !== "object") return;
    if (Array.isArray(c)) {
      c.forEach(walkGates);
      return;
    }
    const o = c as Record<string, unknown>;
    if (o.type === "boolean" && typeof o.name === "string") gates.add(o.name);
    for (const k of ["condition", "items"]) if (o[k]) walkGates(o[k]);
  };
  const conditionSources = [
    ...(char.conditions ?? []),
    ...(char.constellation?.entries ?? []).flatMap((e) => e.conditions ?? []),
    ...(char.postEffects ?? []).flatMap((p) => p.conditions ?? []),
  ];
  conditionSources.forEach(walkPublish);
  conditionSources.forEach(walkGates);
  for (const m of char.multipliers ?? []) if (m.condition) walkGates(m.condition);
  for (const f of char.features ?? []) if (f.condition) walkGates(f.condition);
  const derived = /^(char_|party_|resonance_|weapon_|enemy_|attack_infusion)/;
  return [...gates].filter((n) => !published.has(n) && !derived.test(n));
}

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
  for (const gate of nestedBooleanGates(char)) {
    if (!(gate in toggles)) toggles[gate] = true;
  }
  return { form: { ...form, conditions: { toggles, stacks } }, labels: self.map((c) => c.label) };
}

function featureAvgs(form: BuildForm): Map<string, number> {
  const result = computeBuild(form, {}, []);
  expect(result.error, `computeBuild error for ${form.characterKey}`).toBeUndefined();
  expect(result.features.length).toBeGreaterThan(0);
  return new Map(result.features.map((f) => [f.key, Math.round(f.triple[2])]));
}

describe("sweep e2e fixture generation", () => {
  it("computes engine expectations for sweep-fixed characters and writes the fixture", () => {
    const entries = CASES.map(({ char, weapon }) => {
      const base: BuildForm = { ...DEFAULT_FORM, characterKey: char, weaponKey: weapon };
      const offAvgs = featureAvgs(base);
      const { form: onForm, labels } = activateSelf(base);
      const onAvgs = featureAvgs(onForm);
      expect(labels.length, `${char} should expose self conditions`).toBeGreaterThan(0);

      // Pick the feature the self buffs move the MOST (max features are often
      // transformative reactions — level-scaled, buff-inert at EM 0).
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
      expect(
        bestDiff,
        `${char}: activating all self buffs should move at least one feature`
      ).toBeGreaterThan(0);

      return {
        char,
        hash: encodeBuild(onForm),
        featureKey: bestKey,
        expectedOn: onAvgs.get(bestKey)!,
        expectedOff: offAvgs.get(bestKey) ?? null,
        firstLabel: labels[0],
      };
    });

    const here = dirname(fileURLToPath(import.meta.url));
    const out = join(here, "..", "..", "e2e", "fixtures", "sweep-selfbuffs.json");
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, JSON.stringify(entries, null, 2));
  });
});
