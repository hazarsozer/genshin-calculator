/**
 * P3.5 conditional-infusion — attack-infusion burndown (GREEN-on-arrival for the wired self
 * reps; RED→GREEN for the Arlecchino BoL≥30 gap once its condition lands).
 *
 * The `infusion` oracle config (build-configs.mjs §infusionItems) drives the conditional
 * attack-infusion chain: a char's infusion ConditionBoolean publishes `attack_infusion:'<element>'`
 * into the settings bag (Condition.js:290-305 conditionSettings returns cond.settings when active —
 * `boolean`/`boolean-value` both propagate), which buildStats folds into `merged`
 * (buildStats.ts:755-768, mirroring her CalcSet.getBaseStats:360-363) and returns as `settings`
 * (buildStats.ts:1068). compileFeature.resolveElement (compileFeature.ts:175-186) reads
 * settings.attack_infusion for attack/plunge features otherwise physical → the infused normal/charged/
 * plunge resolve the infused element instead of physical (the RES key flips physical→element ⇒ a
 * different damage triple). ~11 chars declare attack_infusion but NO prior fixture toggled one ON, so
 * this chain was shipped-but-unverified; this suite gates it against the oracle.
 *
 * Each rep's fixture (tests/golden/fixtures/infusion/) carries her engine's INFUSED triples; this
 * suite threads the SAME infusion toggle (the manifest's party.settings) into both buildStats and
 * compileCharacter and asserts every infused damage triple (normal/crit/avg) — the FULL triple,
 * because the element change shifts all three (DMG-bonus + RES + crit-spread):
 *
 *   - infusion-diluc (Diluc): {diluc_dawn:true} → his Dawn ConditionBoolean publishes
 *     attack_infusion:'pyro' (raw Diluc.js:287-294, attack_infusion_pyro:1 collapsed to the single
 *     string in diluc.ts:170; his A4 +20% pyro is also wired, diluc.ts:174). His normal/charged/plunge
 *     resolve PYRO (vs physical at base) → every attack triple lifts. GREEN-on-arrival (Part A).
 *   - infusion-arlecchino (Arlecchino, ADDED in Part B): common.bond_of_life:50 (≥30) — NO
 *     hardcoded attack_infusion. Her BoL≥30 ConditionStatic infuses pyro (raw Arlecchino.js:377-390);
 *     the port NEVER wired it → her normal/charged/plunge resolve PHYSICAL (wrong RES) → RED before
 *     the condition, GREEN after the boolean-value bond_of_life≥30 infusion condition lands.
 *
 * NOT REPS HERE (both deliberate):
 *   - Hu Tao: her Paramita Papilio toggle is NOT infusion-isolatable — it ALSO gates an un-ported
 *     PostEffectStatsHP HP→ATK conversion (atkBuffPost, raw Hutao.js:145-160), so toggling it ON
 *     lifts EVERY feature's ATK, not just the infused normals. The port omits that postEffect
 *     (correctly inert at the C0 base where Paramita is OFF). Porting Hu Tao's full Paramita kit is a
 *     separate gap, out of conditional-infusion scope.
 *   - Chongyun (teammate cryo-infusion via the partyData weapon-type-gated condition) is ALREADY
 *     covered + GREEN by the party-buffs suite (chongyun-cryoinfusion-on-eula). No duplicate here.
 *
 * The Diluc fixture isolates the element flip: at base his normals are physical; with Dawn ON they are
 * pyro. The load-bearing proof (anti-gaming): toggling the infusion OFF resolves the normals physical →
 * the triples shift (RED), confirming the fixture exercises the element flip, not a vacuous 0==0. For
 * Arlecchino the RED-before-wiring IS the proof.
 *
 * GUARD — HONESTY RULES (verbatim from foodBurndown.test.ts / bolMultiplierBurndown.test.ts): NO
 * it.skip, NO it.todo, NO it.fails, NO loosened tolerance, NO hard-coded overrides.
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";
import { describe, it, expect } from "vitest";
import { buildStats } from "../buildStats.js";
import { compileCharacter } from "../loader.js";
import {
  blackcliffPoleStatTable,
  theBellStatTable,
  alleyFlashStatTable,
  alleyHunterStatTable,
  solarPearlStatTable,
} from "../generated/weaponStatTables.js";
import type { DbObjectChar, StatTableEntry } from "@genshin/types";
import { type FixtureEntry, isDamageTripleEntry } from "./_fixtureEntry.js";

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

const TOLERANCE = 0.1;

// Per-rep settings — mirrors the infusion oracle config (build-configs.mjs §infusionItems). Each
// value is EXACTLY the toggle the oracle item set for that rep, injected verbatim into both
// buildStats and compileCharacter so the rep's condition is active on BOTH sides:
//   infusion-diluc        — mergeCharSettings({diluc_dawn:true}) → attack_infusion:'pyro'.
//   infusion-arlecchino   — {common.bond_of_life:50} (≥30) → her BoL≥30 condition infuses pyro
//                           (NO hardcoded attack_infusion — the condition is the only driver).
const SETTINGS_BY_SLUG: Readonly<Record<string, Readonly<Record<string, unknown>>>> = {
  "infusion-diluc": { diluc_dawn: true },
  "infusion-arlecchino": { "common.bond_of_life": 50 },
};

interface ManifestItem {
  readonly slug: string;
  /** The charKey (e.g. "Hutao"). */
  readonly repKey: string;
  /** The TS slug (e.g. "hu_tao") — used to resolve the recipient DbObjectChar. */
  readonly repSlug: string;
}

interface Manifest {
  readonly items: readonly ManifestItem[];
}

interface Fixture {
  readonly slug: string;
  readonly features: Record<string, FixtureEntry>;
}

const INFUSION_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../tests/golden/fixtures/infusion"
);

const WEAPON_TABLE_BY_TYPE: Readonly<Record<string, readonly StatTableEntry[]>> = {
  sword: alleyFlashStatTable,
  claymore: theBellStatTable,
  polearm: blackcliffPoleStatTable,
  bow: alleyHunterStatTable,
  catalyst: solarPearlStatTable,
};

function isDbObjectChar(v: unknown): v is DbObjectChar {
  return (
    typeof v === "object" &&
    v !== null &&
    "weapon" in v &&
    "element" in v &&
    "features" in v
  );
}

// Minimal local type for Vite's `import.meta.glob` so the typecheck gate passes
// without a vite/client dependency. Vitest supplies the real implementation at runtime.
declare global {
  interface ImportMeta {
    glob(
      pattern: string,
      options: { eager: true }
    ): Record<string, Record<string, unknown>>;
  }
}

const CHAR_MODULES = import.meta.glob("../characters/*.ts", { eager: true });

// slug ("hu_tao") -> DbObjectChar. infusion is a partyItems config, so a fixture's slug is the
// EFFECT slug (e.g. "infusion-hutao"); the rep char is resolved from the manifest's repSlug
// (mirroring foodBurndown.test.ts / bolMultiplierBurndown.test.ts).
const charBySlug: Readonly<Record<string, DbObjectChar>> = Object.fromEntries(
  Object.entries(CHAR_MODULES).flatMap(([path, mod]) => {
    const slug = path
      .slice(path.lastIndexOf("/") + 1)
      .replace(/\.ts$/, "")
      .replace(/-/g, "_");
    const chars = Object.values(mod).filter(isDbObjectChar);
    return chars.length === 1 ? [[slug, chars[0]!] as [string, DbObjectChar]] : [];
  })
);

const manifest: Manifest = existsSync(join(INFUSION_DIR, "_manifest.json"))
  ? (JSON.parse(readFileSync(join(INFUSION_DIR, "_manifest.json"), "utf-8")) as Manifest)
  : { items: [] };

describe("infusion-burndown", () => {
  it("the infusion fixture family exists", () => {
    expect(manifest.items.length).toBeGreaterThan(0);
  });
});

for (const item of manifest.items) {
  describe(`infusion-burndown: ${item.slug}`, () => {
    const char = charBySlug[item.repSlug];
    const fixture: Fixture | undefined = existsSync(join(INFUSION_DIR, `${item.slug}.json`))
      ? (JSON.parse(readFileSync(join(INFUSION_DIR, `${item.slug}.json`), "utf-8")) as Fixture)
      : undefined;

    if (!char || !fixture) {
      it(`${item.slug}: rep char + fixture present`, () =>
        expect.fail(
          `missing rep char '${item.repSlug}' or fixture '${item.slug}.json'`
        ));
      return;
    }

    const settings = SETTINGS_BY_SLUG[item.slug] ?? {};

    const { context, settings: merged } = buildStats({
      char,
      weaponStatTable: WEAPON_TABLE_BY_TYPE[char.weapon]!,
      statBlock: STAT_BLOCK,
      levels: LEVELS,
      enemy: ENEMY,
      settings,
    });

    const compiled = compileCharacter(char, {
      charElement: char.element,
      talentLevels: TALENTS,
      settings: merged,
      charLevel: LEVELS.charLevel,
    });

    // Assert every damage triple the oracle emitted. The infusion changes the attack features'
    // element, so the FULL triple (normal/crit/avg) shifts (DMG-bonus + RES + crit-spread) — we
    // assert all three. Filtered by `k in compiled` because these damage features DO exist in our
    // port (the question is whether the infusion resolves the right element) — honest, not vacuous.
    // Non-attack damage (skill/burst) carries an explicit element → unaffected by the infusion →
    // already matches; asserted too as a NO-DELTA GUARD that the infusion is scoped to attacks.
    const damageKeys = Object.entries(fixture.features)
      .filter(([, e]) => isDamageTripleEntry(e))
      .map(([k]) => k);

    for (const key of damageKeys.filter((k) => k in compiled)) {
      const oracle = fixture.features[key]!;

      it(`${item.slug}/${key} normal within ${TOLERANCE}`, () => {
        const result = compiled[key]!(context);
        expect(
          Math.abs(result.normal - oracle.normal),
          `${item.slug}/${key} normal: ours=${result.normal.toFixed(2)}, oracle=${oracle.normal.toFixed(2)}`
        ).toBeLessThanOrEqual(TOLERANCE);
      });

      it(`${item.slug}/${key} crit within ${TOLERANCE}`, () => {
        const result = compiled[key]!(context);
        expect(
          Math.abs(result.crit - oracle.crit),
          `${item.slug}/${key} crit: ours=${result.crit.toFixed(2)}, oracle=${oracle.crit.toFixed(2)}`
        ).toBeLessThanOrEqual(TOLERANCE);
      });

      it(`${item.slug}/${key} avg within ${TOLERANCE}`, () => {
        const result = compiled[key]!(context);
        expect(
          Math.abs(result.avg - oracle.average),
          `${item.slug}/${key} avg: ours=${result.avg.toFixed(2)}, oracle=${oracle.average.toFixed(2)}`
        ).toBeLessThanOrEqual(TOLERANCE);
      });
    }
  });
}
