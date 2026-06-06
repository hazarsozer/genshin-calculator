/**
 * P3.5 bol-stat — BoL/stat-postEffect guard (RED by design, pending Task B).
 *
 * The `bol-stat` oracle config (build-configs.mjs) drives two per-entity DAMAGE gaps that share a
 * shape — a USER-SETTABLE INPUT → a stat in the bag → a `dmg_*` postEffect our engine does NOT yet
 * model — and dumps her engine's resulting triples to tests/golden/fixtures/bol-stat/. Each rep is
 * driven with the exact input(s) the oracle item set; the burndown threads those same settings into
 * both buildStats and compileCharacter and asserts the lifted DAMAGE triples:
 *
 *   - clorinde-c4 (Clorinde): C4 PostEffectStats `dmg_burst_clorinde += min(bond_of_life × 2.0, 2.0)`
 *     (raw/.../db/Char/Clorinde.js:508-517). The ratio (StatTable [200]) and cap (ValueTable [200])
 *     both fold /100 because `dmg_burst_clorinde` is a percent key (PostEffect/Stats.js:63-66). The
 *     base `bond_of_life` enters via ConditionBoLStat (db/Buffs/Static.js:28) and is ITSELF
 *     percent-folded, so the bag value = common.bond_of_life/100 (setting 50 → bag 0.5). At C4 +
 *     common.bond_of_life:50 → min(0.5 × 2.0, 2.0) = 1.0 (uncapped; +100% burst DMG). Gate
 *     char_constellation≥4. Our engine never writes `dmg_burst_clorinde` (no ConditionBoLStat-equiv
 *     emit + no C4 postEffect) → her burst undershoots.
 *   - neuvillette-a4 (Neuvillette): A4 PostEffectStatsNeuvillette `dmg_hydro += min(max(0, pct−30) ×
 *     0.006, 0.3)` where `pct = (slider>100) ? 100·slider/hp_total : slider`
 *     (raw/.../db/Char/Neuvillette.js:326-335 + classes/PostEffect/Stats/Neuvillette.js:7-20). The
 *     ratio (A4HydroBonus 0.6) and cap (A4HydroBonusCap 30) fold /100 via the dmg_hydro percent fold;
 *     the slider bag value is RAW (not percent-folded). At slider 30000 with hp_total≈27921 →
 *     pct≈107.4 → max(0,77.4) × 0.006 = 0.4646, capped to 0.3 (+30% hydro DMG). Our engine models
 *     neither the slider→stat emit nor the postEffect → every hydro feature undershoots.
 *
 * Each rep's damage-triple avg is therefore SMALLER than the oracle's, and that RED is the
 * deliverable: it proves the holes. Wiring them to GREEN is Task B (the ConditionBoLStat-equivalent
 * setting→stat emit + the slider→stat emit + the two postEffects). The settings injected per rep are
 * EXACTLY the input(s) that rep's oracle item set — so this suite goes GREEN under Task B with NO
 * edits here.
 *
 * GUARD — HONESTY RULES (verbatim from armory.test.ts / enemyStateBurndown.test.ts): NO it.skip,
 * NO it.todo, NO it.fails, NO loosened tolerance, NO hard-coded overrides. The RED is by design
 * pending Task B.
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

// Per-rep settings — mirrors the bol-stat oracle config (build-configs.mjs §bol-stat: bolStatItems).
// Each value is EXACTLY the input(s) the oracle item set for that rep, injected verbatim into both
// buildStats and compileCharacter:
//   clorinde-c4    — setConstellation(4) → char_constellation:4; setBuffsSettings(common.bond_of_life:50).
//   neuvillette-a4 — mergeCharSettings(neuvillette_the_high_arbitrators_discipline:30000) [char-self slider].
const SETTINGS_BY_SLUG: Readonly<Record<string, Readonly<Record<string, unknown>>>> = {
  "clorinde-c4": { char_constellation: 4, "common.bond_of_life": 50 },
  "neuvillette-a4": { neuvillette_the_high_arbitrators_discipline: 30000 },
};

interface ManifestItem {
  readonly slug: string;
  /** The charKey (e.g. "Clorinde"). */
  readonly repKey: string;
  /** The TS slug (e.g. "clorinde") — used to resolve the recipient DbObjectChar. */
  readonly repSlug: string;
}

interface Manifest {
  readonly items: readonly ManifestItem[];
}

interface Fixture {
  readonly slug: string;
  readonly features: Record<string, FixtureEntry>;
}

const BOL_STAT_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../tests/golden/fixtures/bol-stat"
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

// slug ("clorinde") -> DbObjectChar. The bol-stat config is a partyItems config, so a fixture's slug
// is the EFFECT slug (e.g. "clorinde-c4"); the rep char is resolved from the manifest's repSlug
// (mirroring enemyStateBurndown.test.ts / partyBuffsBurndown.test.ts).
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

const manifest: Manifest = existsSync(join(BOL_STAT_DIR, "_manifest.json"))
  ? (JSON.parse(
      readFileSync(join(BOL_STAT_DIR, "_manifest.json"), "utf-8")
    ) as Manifest)
  : { items: [] };

describe("bol-stat-burndown", () => {
  it("the bol-stat fixture family exists", () => {
    expect(manifest.items.length).toBeGreaterThan(0);
  });
});

for (const item of manifest.items) {
  describe(`bol-stat-burndown: ${item.slug}`, () => {
    const char = charBySlug[item.repSlug];
    const fixture: Fixture | undefined = existsSync(join(BOL_STAT_DIR, `${item.slug}.json`))
      ? (JSON.parse(
          readFileSync(join(BOL_STAT_DIR, `${item.slug}.json`), "utf-8")
        ) as Fixture)
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

    // Thread buildStats' RETURNED (propagated) settings into compileCharacter, as
    // partyBuffsBurndown.test.ts does. This matters for Clorinde: passing char_constellation:4
    // makes buildStats run her C3 constellation condition, which propagates char_skill_elemental_bonus:3
    // into `merged` (a +3 skill-talent bump our engine ALREADY models). Compiling against `merged`
    // (not the raw input) lets that legitimate C3 bump apply, so surging_blade_dmg/skill features are
    // GREEN and the RED is ISOLATED to the actual BoL/stat-postEffect gap (Task B) — not the unrelated
    // constellation talent-level propagation.
    const compiled = compileCharacter(char, {
      charElement: char.element,
      talentLevels: TALENTS,
      settings: merged,
      charLevel: LEVELS.charLevel,
    });

    // Assert every damage triple the oracle emitted (a crit-spread triple). Non-damage outputs
    // (heal/shield/static readouts: normal == crit == average) and stats are excluded — this gate
    // is about the BoL/stat postEffects lifting DAMAGE.
    const damageKeys = Object.entries(fixture.features)
      .filter(([, e]) => isDamageTripleEntry(e))
      .map(([k]) => k);

    for (const key of damageKeys.filter((k) => k in compiled)) {
      const oracle = fixture.features[key]!;
      it(`${item.slug}/${key} avg within ${TOLERANCE}`, () => {
        const result = compiled[key]!(context);
        expect(
          Math.abs(result.avg - oracle.average),
          `${item.slug}/${key}: ours=${result.avg.toFixed(2)}, oracle=${oracle.average.toFixed(2)}`
        ).toBeLessThanOrEqual(TOLERANCE);
      });
    }
  });
}
