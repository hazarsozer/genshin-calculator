/**
 * Tier-B Mizuki C1 "In Mist-Like Waters" — swirl-flat guard.
 *
 * The `swirl-flat` oracle config (build-configs.mjs) dumps Yumemizuki Mizuki's engine output
 * at C1 + dreamdrifter + in_mist_like_waters ON to tests/golden/fixtures/swirl-flat/. Her C1
 * "In Mist-Like Waters" is a SELF flat additive swirl bonus:
 * raw/genshin_calc_pub/src/js/db/Char/Mizuki.js:328-343 — a FeatureMultiplier{scaling:'mastery*',
 * values:ValueTable([1100]), target:{tags:['swirl'], options:['reaction_flat']}}, gated by
 * ConditionAnd of the C1 constellation, the 'mizuki_dreamdrifter' toggle, and the
 * 'mizuki_in_mist_like_waters' toggle. Consumed by FeatureReaction.getReactionBonusMultipliers /
 * getTree (raw/.../Feature2/Reaction.js:38-49,86-129): final =
 * (reactionCoeff×levelMult×(1+emBonus+Σreactionbonus) + (1100/100)×EM_total) × resMult — the flat
 * term (11.00 × EM) is ADDED before the resistance multiplier, uniform across all 4 swirl elements.
 *
 * Ported via a base-inert `reactionFlatKeys` field on `cTransformativeDamage` (packages/core/src/
 * reactions/transformative.ts) + `reactionFlatOverrides` on Mizuki's DbObjectChar
 * (packages/data/src/characters/yumemizuki_mizuki.ts) writing a `reaction_flat_swirl` post-effect
 * (ratio 11 × mastery_total).
 *
 * SCOPE — the SWIRL reaction triples only (a flat-additive triple, non-crit at C1: crit needs the
 * separate C6+dreamdrifter combo). We assert exactly the 4 `reaction.swirl_*` outputs.
 *
 * GUARD — HONESTY RULES (verbatim from armory.test.ts / swirlCritBurndown.test.ts): NO it.skip,
 * NO it.todo, NO it.fails, NO loosened tolerance, NO hard-coded overrides.
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

// The swirl-flat oracle build: C1 AND dreamdrifter AND in_mist_like_waters ON — the ONLY combo
// that activates Mizuki's C1 flat swirl bonus (build-configs.mjs §swirl-flat).
const SETTINGS = {
  char_constellation: 1,
  mizuki_dreamdrifter: true,
  mizuki_in_mist_like_waters: true,
} as const;

interface Fixture {
  readonly slug: string;
  readonly features: Record<string, FixtureEntry>;
}

const SWIRL_FLAT_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../tests/golden/fixtures/swirl-flat"
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

const fixtureFiles = existsSync(SWIRL_FLAT_DIR)
  ? readdirSync(SWIRL_FLAT_DIR).filter(
      (f) => f.endsWith(".json") && f !== "_manifest.json"
    )
  : [];

describe("swirl-flat-burndown", () => {
  it("the swirl-flat fixture family exists", () => {
    expect(fixtureFiles.length).toBeGreaterThan(0);
  });
});

for (const file of fixtureFiles) {
  const fixture = JSON.parse(
    readFileSync(join(SWIRL_FLAT_DIR, file), "utf-8")
  ) as Fixture;
  const slug = fixture.slug;

  describe(`swirl-flat-burndown: ${slug}`, () => {
    const char = charForSlug(slug);
    if (!char) {
      it(`${slug}: rep char file present`, () =>
        expect.fail(`no characters/*.ts for ${slug}`));
      return;
    }

    // buildStats propagates condition `.settings` into the returned merged `settings`; thread
    // those into the compile context exactly as constellations.test.ts does, so the C1-gated
    // post-effect and any constellation-gated effects resolve at compile time.
    const { context, settings } = buildStats({
      char,
      weaponStatTable: WEAPON_TABLE_BY_TYPE[char.weapon]!,
      statBlock: STAT_BLOCK,
      levels: LEVELS,
      enemy: ENEMY,
      settings: SETTINGS,
      talentLevels: TALENTS,
    });

    const compiled = compileCharacter(char, {
      charElement: char.element,
      talentLevels: TALENTS,
      settings,
      charLevel: LEVELS.charLevel,
    });

    // Scope: the SWIRL reaction triples only. C1's flat term feeds exclusively the 4
    // `reaction.swirl_*` outputs (Feature2/Reaction.js reaction_flat option, target
    // tags:['swirl']); the other transformative reactions are unchanged here.
    const swirlKeys = Object.entries(fixture.features)
      .filter(
        ([k, e]) => k.startsWith("reaction.swirl_") && isDamageTripleEntry(e)
      )
      .map(([k]) => k);

    for (const key of swirlKeys.filter((k) => k in compiled)) {
      const oracle = fixture.features[key]!;

      it(`${slug}/${key} normal within ${TOLERANCE}`, () => {
        const result = compiled[key]!(context);
        expect(
          Math.abs(result.normal - oracle.normal),
          `${slug}/${key} normal: ours=${result.normal.toFixed(2)}, oracle=${oracle.normal.toFixed(2)}`
        ).toBeLessThanOrEqual(TOLERANCE);
      });

      it(`${slug}/${key} crit within ${TOLERANCE}`, () => {
        const result = compiled[key]!(context);
        expect(
          Math.abs(result.crit - oracle.crit),
          `${slug}/${key} crit: ours=${result.crit.toFixed(2)}, oracle=${oracle.crit.toFixed(2)}`
        ).toBeLessThanOrEqual(TOLERANCE);
      });

      it(`${slug}/${key} avg within ${TOLERANCE}`, () => {
        const result = compiled[key]!(context);
        expect(
          Math.abs(result.avg - oracle.average),
          `${slug}/${key} avg: ours=${result.avg.toFixed(2)}, oracle=${oracle.average.toFixed(2)}`
        ).toBeLessThanOrEqual(TOLERANCE);
      });
    }
  });
}
