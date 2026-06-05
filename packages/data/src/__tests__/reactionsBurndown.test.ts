/**
 * P3.5.1 — Amplifying-reaction guard (GREEN).
 *
 * The `reactions` oracle config (build-configs.mjs) dumps her engine's AMPLIFIED triples
 * (vaporize/melt) to tests/golden/fixtures/reactions/. P3.5.1 wired settings.reaction →
 * cAmplifyingFactor into compileFeature; each rep requests its reaction (REACTION_BY_CHAR),
 * so its reacting hits match her amplified triples and its non-reacting hits (physical, or
 * Mona's cannotReact plunge Collision) stay un-amplified.
 *
 * GUARD — HONESTY RULES (verbatim from armory.test.ts): NO it.skip, NO it.todo, NO it.fails,
 * NO loosened tolerance, NO hard-coded overrides.
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
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

// Each rep's amplifying reaction — mirrors the reactions oracle config
// (tools/oracle/build-configs.mjs §reactions axis: Mona vaporize, Ganyu melt).
// Vaporize on Mona's native hydro hits → ×2.0(+EM); melt on Ganyu's native cryo
// hits → ×1.5(+EM). Each rep's non-reacting hits (physical, or Mona's cannotReact
// plunge Collision) stay un-amplified.
const REACTION_BY_CHAR: Readonly<Record<string, string>> = {
  mona: "vaporize",
  ganyu: "melt",
};

interface Fixture {
  readonly slug: string;
  readonly features: Record<string, FixtureEntry>;
}

const REACTIONS_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../tests/golden/fixtures/reactions"
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

function charForSlug(slug: string): DbObjectChar | undefined {
  for (const [path, mod] of Object.entries(CHAR_MODULES)) {
    const s = path
      .slice(path.lastIndexOf("/") + 1)
      .replace(/\.ts$/, "")
      .replace(/-/g, "_");
    if (s === slug) return Object.values(mod).filter(isDbObjectChar)[0];
  }
  return undefined;
}

const fixtureFiles = existsSync(REACTIONS_DIR)
  ? readdirSync(REACTIONS_DIR).filter(
      (f) => f.endsWith(".json") && f !== "_manifest.json"
    )
  : [];

describe("reactions-burndown", () => {
  it("the reactions fixture family exists", () => {
    expect(fixtureFiles.length).toBeGreaterThan(0);
  });
});

for (const file of fixtureFiles) {
  const fixture = JSON.parse(
    readFileSync(join(REACTIONS_DIR, file), "utf-8")
  ) as Fixture;
  const slug = fixture.slug;

  describe(`reactions-burndown: ${slug}`, () => {
    const char = charForSlug(slug);
    if (!char) {
      it(`${slug}: rep char file present`, () =>
        expect.fail(`no characters/*.ts for ${slug}`));
      return;
    }

    const reaction = REACTION_BY_CHAR[slug];
    const settings = reaction ? { reaction } : {};

    const { context } = buildStats({
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
      settings,
      charLevel: LEVELS.charLevel,
    });

    const damageKeys = Object.entries(fixture.features)
      .filter(([, e]) => isDamageTripleEntry(e))
      .map(([k]) => k);

    for (const key of damageKeys.filter((k) => k in compiled)) {
      const oracle = fixture.features[key]!;
      it(`${slug}/${key} amplified avg within ${TOLERANCE}`, () => {
        const result = compiled[key]!(context);
        expect(
          Math.abs(result.avg - oracle.average),
          `${slug}/${key}: ours=${result.avg.toFixed(2)}, oracle=${oracle.average.toFixed(2)}`
        ).toBeLessThanOrEqual(TOLERANCE);
      });
    }
  });
}
