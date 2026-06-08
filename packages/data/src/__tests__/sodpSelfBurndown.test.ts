/**
 * P3.5 sodp-self — Song of Days Past 4pc SELF-WORN guard (RED by design until the wrong-key bug fix).
 *
 * The `sodp-self` oracle config (build-configs.mjs §sodp-self: sodpSelfItems) equips Song of Days Past
 * 4pc on its rep (Sigewinne) with a NON-ZERO `days_past_healing_recorded` (the self-worn ConditionNumber,
 * max 15000) and dumps her engine's resulting triples to tests/golden/fixtures/sodp-self/. The 4pc's
 * per-hit FeatureMultiplier (raw/.../db/Artifacts/Set/SongOfDaysPast.js:56-66) adds
 * `8% × days_past_healing_recorded` to EVERY normal/charged/plunge/skill/burst hit's base term, gated by
 * the `set.song_of_days_past_4` checkbox (auto-enabled by equipSet). At recorded=15000 each of those base
 * terms gains +0.08 × 15000 = +1200, so the oracle's normal/charged/plunge/skill/burst triples are all
 * raised vs the recorded-unset baseline.
 *
 * THE BUG (R4d): our port's self-worn multiplier scaled the WRONG key — `accumulated_healing` (Ocean-Hued
 * Clam's key, raw OceanHuedClam.js:61) instead of the self-worn `days_past_healing_recorded` (raw
 * SongOfDaysPast.js:59). `resolveStatKey` reads a non-`_total` scaling key verbatim, so the port read
 * `accumulated_healing` (0 on any SoDP build) → the multiplier emitted 0 while the oracle emits
 * +0.08 × recorded. Compounding it, `days_past_healing_recorded` was ABSENT from RAW_BAG_SCALING_KEYS, so
 * even with the scaling key fixed the bag never carried the recorded value → still 0. TWO layers.
 *
 * This suite reconstructs Sigewinne's SoDP-4pc build (setBonuses + the recorded-healing input + the set
 * registry + the set's own features/multipliers, exactly as armory.test.ts does), compiles, and asserts
 * every damage triple's avg == oracle within 0.1. It is RED on the current port (reads accumulated_healing
 * = 0 → undershoots by the +1200×def×res×bonus term per hit) and goes GREEN once BOTH layers land:
 *   1. song-of-days-past.ts: scaling "accumulated_healing" → "days_past_healing_recorded".
 *   2. buildStats.ts RAW_BAG_SCALING_KEYS: add "days_past_healing_recorded".
 * The settings/sets injected here are EXACTLY what the oracle item set, so this goes GREEN under the fix
 * with NO edits here.
 *
 * GUARD — HONESTY RULES (verbatim from armory.test.ts / bolStatBurndown.test.ts): NO it.skip, NO it.todo,
 * NO it.fails, NO loosened tolerance, NO hard-coded overrides. The RED is by design pending the bug fix.
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";
import { describe, it, expect } from "vitest";
import { buildStats } from "../buildStats.js";
import { compileCharacter } from "../loader.js";
import { alleyHunterStatTable } from "../generated/weaponStatTables.js";
import { songOfDaysPast } from "../artifacts/sets/song-of-days-past.js";
import type { DbObjectArtifactSet, DbObjectChar } from "@genshin/types";
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

// The recorded-healing input + the 4pc toggle the oracle item set (sodpSelfItems). Threaded verbatim
// into both buildStats and compileCharacter. `set.song_of_days_past_4` is the checkbox equipSet auto-
// enables; `days_past_healing_recorded` is the ConditionNumber (max 15000) that adds the recorded value
// to the bag (the self-worn key the multiplier scales 8% × — distinct from the team key
// `party_days_past_healing_recorded` and from Ocean-Hued Clam's `accumulated_healing`).
const SETTINGS: Readonly<Record<string, unknown>> = {
  "set.song_of_days_past_4": true,
  days_past_healing_recorded: 15000,
};

// One-entry set registry (DI seam, exactly as armory.test.ts injects a glob-built registry): the
// self-worn SoDP 4pc resolves against this instead of the barrel.
const SET_REGISTRY: Readonly<Record<string, DbObjectArtifactSet>> = {
  [songOfDaysPast.goodId!]: songOfDaysPast,
};

interface ManifestItem {
  readonly slug: string;
  /** The charKey (e.g. "Sigewinne"). */
  readonly repKey: string;
  /** The TS slug (e.g. "sigewinne") — used to resolve the recipient DbObjectChar. */
  readonly repSlug: string;
}

interface Manifest {
  readonly items: readonly ManifestItem[];
}

interface Fixture {
  readonly slug: string;
  readonly features: Record<string, FixtureEntry>;
}

const SODP_SELF_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../tests/golden/fixtures/sodp-self"
);

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

// slug ("sigewinne") -> DbObjectChar. The sodp-self config is a partyItems config, so a fixture's slug
// is the EFFECT slug (e.g. "sodp_self_sigewinne"); the rep char is resolved from the manifest's repSlug
// (mirroring bolStatBurndown.test.ts / foodBurndown.test.ts).
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

const manifest: Manifest = existsSync(join(SODP_SELF_DIR, "_manifest.json"))
  ? (JSON.parse(
      readFileSync(join(SODP_SELF_DIR, "_manifest.json"), "utf-8")
    ) as Manifest)
  : { items: [] };

describe("sodp-self-burndown", () => {
  it("the sodp-self fixture family exists", () => {
    expect(manifest.items.length).toBeGreaterThan(0);
  });
});

for (const item of manifest.items) {
  describe(`sodp-self-burndown: ${item.slug}`, () => {
    const char = charBySlug[item.repSlug];
    const fixture: Fixture | undefined = existsSync(join(SODP_SELF_DIR, `${item.slug}.json`))
      ? (JSON.parse(
          readFileSync(join(SODP_SELF_DIR, `${item.slug}.json`), "utf-8")
        ) as Fixture)
      : undefined;

    if (!char || !fixture) {
      it(`${item.slug}: rep char + fixture present`, () =>
        expect.fail(
          `missing rep char '${item.repSlug}' or fixture '${item.slug}.json'`
        ));
      return;
    }

    // Reconstruct the SoDP-4pc build — the set bonus (resolved against SET_REGISTRY) + the recorded
    // healing input. The 4pc's own per-hit multiplier compiles through the SAME extraMultipliers path
    // armory.test.ts uses for self-worn set multipliers (Echoes' normal-DMG variant); the
    // ConditionNumber in the set's bonus[4] injects `days_past_healing_recorded` into the bag.
    const { context, settings: propagated } = buildStats({
      char,
      weaponStatTable: alleyHunterStatTable, // Sigewinne is a bow user (default alley_hunter, passive OFF)
      statBlock: STAT_BLOCK,
      levels: LEVELS,
      enemy: ENEMY,
      settings: SETTINGS,
      setBonuses: [{ setKey: songOfDaysPast.goodId!, pieces: 4 }],
      setRegistry: SET_REGISTRY,
      talentLevels: TALENTS,
    });

    const compiled = compileCharacter(char, {
      charElement: char.element,
      talentLevels: TALENTS,
      settings: propagated,
      charLevel: LEVELS.charLevel,
      extraFeatures: songOfDaysPast.features ?? [],
      extraMultipliers: songOfDaysPast.multipliers ?? [],
    });

    // Assert every damage triple the oracle emitted (a crit-spread triple). Non-damage outputs
    // (heal/shield/static readouts: normal == crit == average) and stats are excluded — this gate
    // is about the self-worn SoDP multiplier lifting DAMAGE.
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
