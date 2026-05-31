/**
 * P2.3 — Generalized char-level targeted multipliers.
 *
 * Her engine (Feature2.getMultipliers, raw/.../classes/Feature2.js:114-128) merges
 * a character's `char.multipliers` into EACH feature's base-damage term, keeping
 * only entries that are (a) active (`condition.isActive`) and (b) match the feature
 * (`target.isMatchFeature` — primarily `target.damageTypes` ∋ feature.damageType).
 * Both the feature's own multipliers and the matching char-level ones flow into the
 * same `CBaseDamage` (Damage.js:271-276). This is the general mechanism that the
 * per-feature Itto-A4 `def`-term hack stood in for (carried from P1.7b/P1.9).
 *
 * This suite proves the generalized form in three ways:
 *   1. SYNTHETIC: a char-level multiplier injects into a matching feature's base
 *      term, is gated by `evaluate(condition)`, and is skipped for non-matching
 *      damage types.
 *   2. ITTO (always-on, regression): A4's `0.35×DEF` on charged attacks, now a single
 *      declarative `char.multipliers` entry (no per-feature term), still matches the
 *      `base` oracle fixture exactly.
 *   3. ALBEDO (gated, dual direction): the C2 `def*→burst` targeted multiplier is
 *      OFF under the canonical base build (constellation 0) — proving the gate
 *      suppresses it (Albedo's `base` fixture stays green) — and ON when its gate is
 *      satisfied, proving the same channel serves a constellation-granted multiplier
 *      (the P2.C use case).
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/classes/Feature2.js (getMultipliers)
 *   raw/genshin_calc_pub/src/js/classes/Feature2/Damage.js:271 (getTree → CBaseDamage)
 *   raw/genshin_calc_pub/src/js/classes/Feature2/Multiplier.js (isActive/isMatchFeature/getValue)
 *   raw/genshin_calc_pub/src/js/classes/Feature2/Multiplier/Target.js (isMatchFeature)
 *   raw/genshin_calc_pub/src/js/db/Char/Itto.js:320-330 (A4 def* charged targeted multiplier)
 *   raw/genshin_calc_pub/src/js/db/Char/Albedo.js:325-345 (C2 def* burst targeted multiplier)
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";
import { compile } from "@genshin/core";
import type {
  CharMultiplier,
  DbObjectChar,
  EvalContext,
  Feature,
  FeatureMultiplierEntry,
} from "@genshin/types";
import { buildStats } from "../buildStats.js";
import { compileFeature, type CompileContext } from "../compileFeature.js";
import { compileCharacter } from "../loader.js";
import { aratakiItto } from "../characters/arataki-itto.js";
import { albedo } from "../characters/albedo.js";
import {
  theBellStatTable, // claymore (Itto)
  alleyFlashStatTable, // sword (Albedo)
} from "../generated/weaponStatTables.js";

// ---------------------------------------------------------------------------
// Canonical fixed build (verbatim from golden.test.ts / _manifest.json)
// ---------------------------------------------------------------------------

const STAT_BLOCK = {
  atk_base: 871,
  atk_percent: 18,
  crit_dmg_base: 50,
  crit_rate_base: 5,
  def_base: 876,
  dmg_burst: 64,
  dmg_charged: 16,
  dmg_electro: 2,
  dmg_normal: 8,
  dmg_phys: 4,
  dmg_skill: 32,
  hp_base: 13226,
  mastery_base: 55,
  recharge_base: 100,
} as const;

const LEVELS = {
  charLevel: 90,
  ascension: 6,
  weaponLevel: 90,
  weaponAscension: 6,
} as const;

const ENEMY = { level: 90, resistance: 10 } as const;
const TALENTS = { attack: 10, elemental: 10, burst: 10 } as const;

const FIXTURES_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../tests/golden/fixtures"
);

interface FixtureEntry {
  readonly normal: number;
  readonly crit: number;
  readonly average: number;
}
function loadFixture(slug: string): { features: Record<string, FixtureEntry> } {
  return JSON.parse(readFileSync(join(FIXTURES_DIR, `${slug}.json`), "utf-8"));
}

/** A constant 1-entry talent table — what char-level multipliers carry. */
function constTable(value: number): FeatureMultiplierEntry["values"] {
  return { getValue: () => value };
}

// ===========================================================================
// 1. SYNTHETIC — the mechanism in isolation
// ===========================================================================

describe("P2.3 char-level targeted multipliers — synthetic", () => {
  // A trivial char with no innate multipliers: a charged feature and a normal feature,
  // both pure 100% ATK. We inject char-level multipliers via the compile context and
  // assert the base-damage delta.
  const charged: Feature = {
    name: "synthetic_charged",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "", values: constTable(100) }], // 1.0 × ATK
  };
  const normal: Feature = {
    name: "synthetic_normal",
    category: "attack",
    multipliers: [{ leveling: "", values: constTable(100) }], // 1.0 × ATK
  };
  const synthChar: DbObjectChar = {
    name: "synthetic",
    gameId: 0,
    rarity: 5,
    element: "geo",
    weapon: "claymore",
    origin: "test",
    statTable: aratakiItto.statTable, // any valid table; we only need ATK/DEF totals
    talents: aratakiItto.talents,
    features: [charged, normal],
    multipliers: [],
  };

  function ctxWith(
    charMultipliers: readonly CharMultiplier[],
    settings: EvalContext = {}
  ): { context: ReturnType<typeof buildStats>["context"]; compileCtx: CompileContext } {
    const { context } = buildStats({
      char: synthChar,
      weaponStatTable: theBellStatTable, // claymore default; only ATK/DEF totals matter here
      statBlock: STAT_BLOCK,
      levels: LEVELS,
      enemy: ENEMY,
      settings,
    });
    const compileCtx: CompileContext = {
      charElement: "geo",
      talentLevels: TALENTS,
      settings,
      charLevel: LEVELS.charLevel,
      charMultipliers,
    };
    return { context, compileCtx };
  }

  // DEF total in the canonical build, read off the engine, so the expected delta
  // is computed against the same number the engine uses.
  function defTotal(context: ReturnType<typeof buildStats>["context"]): number {
    const v = context.stats["def_total"];
    expect(typeof v).toBe("number");
    return v as number;
  }
  function atkTotal(context: ReturnType<typeof buildStats>["context"]): number {
    const v = context.stats["atk_total"];
    expect(typeof v).toBe("number");
    return v as number;
  }

  it("injects an always-on def* multiplier into a matching (charged) feature's base term", () => {
    const m: CharMultiplier = {
      leveling: "",
      scaling: "def*",
      values: constTable(35), // 0.35 × DEF
      target: { damageTypes: ["charged"] },
    };
    const baseline = ctxWith([]);
    const withM = ctxWith([m]);

    const baseNormal = compile(compileFeature(charged, baseline.compileCtx))(baseline.context).normal;
    const withNormal = compile(compileFeature(charged, withM.compileCtx))(withM.context).normal;

    // Base damage rises by 0.35×DEF × (the same dmg/res/def multipliers the 1.0×ATK base saw).
    // Equivalently: ratio of (withM.base / baseline.base) === (atk_total + 0.35*def_total)/atk_total.
    const expectedRatio = (atkTotal(withM.context) + 0.35 * defTotal(withM.context)) / atkTotal(baseline.context);
    expect(withNormal / baseNormal).toBeCloseTo(expectedRatio, 6);
    expect(withNormal).toBeGreaterThan(baseNormal);
  });

  it("does NOT inject into a non-matching (normal) feature", () => {
    const m: CharMultiplier = {
      leveling: "",
      scaling: "def*",
      values: constTable(35),
      target: { damageTypes: ["charged"] },
    };
    const baseline = ctxWith([]);
    const withM = ctxWith([m]);

    const baseNormal = compile(compileFeature(normal, baseline.compileCtx))(baseline.context).normal;
    const withNormal = compile(compileFeature(normal, withM.compileCtx))(withM.context).normal;
    expect(withNormal).toBeCloseTo(baseNormal, 6); // unchanged — damageType is "normal", not "charged"
  });

  it("is gated by evaluate(condition): inactive condition contributes nothing", () => {
    const gated: CharMultiplier = {
      leveling: "",
      scaling: "def*",
      values: constTable(35),
      target: { damageTypes: ["charged"] },
      condition: { type: "boolean", name: "synthetic_toggle" },
    };
    const baseline = ctxWith([]);
    const offCtx = ctxWith([gated], {}); // toggle absent → inactive
    const onCtx = ctxWith([gated], { synthetic_toggle: true }); // toggle on → active

    const baseNormal = compile(compileFeature(charged, baseline.compileCtx))(baseline.context).normal;
    const offNormal = compile(compileFeature(charged, offCtx.compileCtx))(offCtx.context).normal;
    const onNormal = compile(compileFeature(charged, onCtx.compileCtx))(onCtx.context).normal;

    expect(offNormal).toBeCloseTo(baseNormal, 6); // gated off → no contribution
    expect(onNormal).toBeGreaterThan(offNormal); // gated on → contributes
  });
});

// ===========================================================================
// 2. ITTO — always-on A4, regression against the base oracle via the general form
// ===========================================================================

describe("P2.3 Itto A4 — generalized, regression vs base oracle", () => {
  const fixture = loadFixture("arataki_itto");

  const { context } = buildStats({
    char: aratakiItto,
    weaponStatTable: theBellStatTable,
    statBlock: STAT_BLOCK,
    levels: LEVELS,
    enemy: ENEMY,
    settings: {},
  });
  const compiled = compileCharacter(aratakiItto, {
    charElement: aratakiItto.element,
    talentLevels: TALENTS,
    settings: {},
    charLevel: LEVELS.charLevel,
  });

  const CHARGED_KEYS = [
    "attack.itto_kesagiri_combo_slash_dmg",
    "attack.itto_kesagiri_final_slash_dmg",
    "attack.itto_saichimonji_slash_dmg",
  ];

  for (const key of CHARGED_KEYS) {
    it(`${key} matches the base oracle (A4 def via char.multipliers)`, () => {
      const oracle = fixture.features[key]!;
      const r = compiled[key]!(context);
      expect(Math.abs(r.normal - oracle.normal)).toBeLessThanOrEqual(0.1);
      expect(Math.abs(r.crit - oracle.crit)).toBeLessThanOrEqual(0.1);
      expect(Math.abs(r.avg - oracle.average)).toBeLessThanOrEqual(0.1);
    });
  }

  it("Itto declares the A4 def term as a char-level targeted multiplier (not per-feature)", () => {
    // The generalized form lives on char.multipliers, targeting charged.
    const a4 = aratakiItto.multipliers.find(
      (m): m is CharMultiplier =>
        (m as CharMultiplier).target?.damageTypes?.includes("charged") ?? false
    );
    expect(a4, "Itto should carry a charged-targeted char-level multiplier").toBeDefined();
    expect(a4!.scaling).toBe("def*");

    // And no charged FEATURE may still carry an inline def term (no double-count).
    for (const f of aratakiItto.features) {
      if (f.damageType !== "charged") continue;
      const inlineDef = (f.multipliers ?? []).some((m) => (m.scaling ?? "atk").includes("def"));
      expect(inlineDef, `${f.name} must not keep an inline def term`).toBe(false);
    }
  });
});

// ===========================================================================
// 3. ALBEDO — gated C2 targeted multiplier (dual direction)
// ===========================================================================

describe("P2.3 Albedo C2 — gated targeted multiplier", () => {
  const fixture = loadFixture("albedo");

  function build(settings: EvalContext) {
    const { context } = buildStats({
      char: albedo,
      weaponStatTable: alleyFlashStatTable,
      statBlock: STAT_BLOCK,
      levels: LEVELS,
      enemy: ENEMY,
      settings,
    });
    const compileCtx: CompileContext = {
      charElement: albedo.element,
      talentLevels: TALENTS,
      settings,
      charLevel: LEVELS.charLevel,
      charMultipliers: albedo.multipliers as readonly CharMultiplier[],
    };
    return { context, compileCtx };
  }

  const burst: Feature = albedo.features.find((f) => f.name === "burst_dmg")!;

  it("Albedo carries a burst-targeted def* char-level multiplier (C2)", () => {
    const c2 = albedo.multipliers.find(
      (m): m is CharMultiplier =>
        (m as CharMultiplier).target?.damageTypes?.includes("burst") ?? false
    );
    expect(c2, "Albedo should carry a burst-targeted char-level multiplier").toBeDefined();
    expect(c2!.scaling).toBe("def*");
    expect(c2!.condition, "C2 multiplier must be gated").toBeDefined();
  });

  it("is OFF under the canonical base build (constellation 0): albedo base fixture stays green", () => {
    // Base build = no constellation, no toggle → C2 gate is false → burst unchanged.
    const { context, compileCtx } = build({});
    const oracle = fixture.features["burst.burst_dmg"]!;
    const r = compile(compileFeature(burst, compileCtx))(context);
    expect(Math.abs(r.normal - oracle.normal)).toBeLessThanOrEqual(0.1);
    expect(Math.abs(r.crit - oracle.crit)).toBeLessThanOrEqual(0.1);
    expect(Math.abs(r.avg - oracle.average)).toBeLessThanOrEqual(0.1);
  });

  it("is ON when its gate is satisfied (C2 + toggle): burst base damage rises", () => {
    const off = build({});
    const on = build({ char_constellation: 2, albedo_opening_of_hanerozoic: true });

    const offNormal = compile(compileFeature(burst, off.compileCtx))(off.context).normal;
    const onNormal = compile(compileFeature(burst, on.compileCtx))(on.context).normal;
    expect(onNormal).toBeGreaterThan(offNormal); // the def* burst multiplier now contributes
  });

  it("is ON for albedo_fatal_blossom too (same category:'burst', same target)", () => {
    // Both burst_dmg and albedo_fatal_blossom are category:'burst' and therefore
    // match target.damageTypes:['burst'] — the C2 def* bonus applies to BOTH.
    // Raw: Albedo.js getMultipliers merges the char-level multiplier into every
    // matching feature, so fatal_blossom gets the same boost as burst_dmg.
    const fatalBlossom: Feature = albedo.features.find((f) => f.name === "albedo_fatal_blossom")!;
    const off = build({});
    const on = build({ char_constellation: 2, albedo_opening_of_hanerozoic: true });

    const offNormal = compile(compileFeature(fatalBlossom, off.compileCtx))(off.context).normal;
    const onNormal = compile(compileFeature(fatalBlossom, on.compileCtx))(on.context).normal;
    expect(onNormal).toBeGreaterThan(offNormal); // def* burst mult applies to fatal_blossom too
  });
});
