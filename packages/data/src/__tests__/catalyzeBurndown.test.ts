/**
 * P3.5 catalyze — Catalyze-reaction guard (RED by design, pending Task B).
 *
 * The `catalyze` oracle config (build-configs.mjs) dumps her engine's CATALYZED triples
 * (Spread on dendro hits ×1.25, Aggravate on electro hits ×1.15) to
 * tests/golden/fixtures/catalyze/. Catalyze is NOT REACTION_MULTI (that holds only
 * vaporize/melt); it is a global MULTIPLIER (db/CalcData/Multipliers.js) gated by
 * settings.reaction == 'quicken' + the hit element, adding a term SUMMED into the hit's
 * base damage: reactionBase × (1 + 5·EM/(EM+1200) + Σ), inheriting the hit's crit/DMG%/res/def.
 *
 * Our engine does NOT yet wire that multiplier — buildStats + compileCharacter compute the
 * UN-REACTED hit — so each catalyzed dendro/electro triple's avg is SMALLER than the oracle's
 * by exactly the catalyze term. This suite therefore fails RED, and that RED is the deliverable:
 * it proves the hole. Wiring catalyze to GREEN is Task B (mirrors the amplifying P3.5.1 fix).
 *
 * Each rep carries a NONZERO Σ (Baizhu A4 dmg_reaction_quicken; Fischl ThunderingFury 4pc
 * dmg_reaction_aggravate:20) so that when Task B lands, the gate exercises — and proves
 * load-bearing — the Σ term, not just the EM multiplier (anti-gaming). STAT_BLOCK injects
 * dmg_reaction_aggravate:20 (Fischl's Σ; inert for Baizhu's dendro/Spread), and EXTRA_SETTINGS
 * enables Baizhu's A4 toggle exactly as the oracle config did — so this suite goes GREEN under
 * Task B with NO edits.
 *
 * SCOPE — direct catalyzed HITS only. The Σ sources also buff TRANSFORMATIVE reaction OUTPUTS
 * (ThunderingFury's dmg_reaction_electrocharged/hyperbloom/overloaded/superconduct:40; Baizhu
 * A4's dmg_reaction_bloom/burning → bloom/burning/rupture). Those `category:'reaction'` outputs
 * are a DIFFERENT mechanic (the transformative-reaction sub-project), not Spread/Aggravate, and
 * have no crit spread (normal==crit). Catalyze (this gate) is the term summed into a direct hit's
 * base damage. We therefore assert only the catalyzed elemental hits (excluding category
 * 'reaction'); the transformative deltas are out of scope here and burned down by their own suite.
 *
 * GUARD — HONESTY RULES (verbatim from armory.test.ts): NO it.skip, NO it.todo, NO it.fails,
 * NO loosened tolerance, NO hard-coded overrides. The RED is by design pending Task B.
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
  // Fischl's oracle build wears ThunderingFury 4pc — which also grants the 2pc `dmg_electro: 15`
  // (raw/.../db/Artifacts/Set/ThunderingFury.js:2pc). The base substat `dmg_electro: 2` + the 2pc
  // 15 = 17 total, exactly the oracle's effective electro DMG% (the catalyze term inherits it, as
  // does every electro hit). Baizhu has no electro hit (pure dendro) → this is Baizhu-inert.
  dmg_electro: 17,
  dmg_normal: 8,
  dmg_phys: 4,
  dmg_skill: 32,
  hp_base: 13226,
  mastery_base: 55,
  recharge_base: 100,
  // Fischl's Aggravate Σ (ThunderingFury 4pc, dmg_reaction_aggravate:20). Inert for Baizhu's
  // dendro/Spread (Spread sums dmg_reaction_quicken + dmg_reaction_spread, not aggravate). Present
  // so Task B's catalyze wiring folds the SAME Σ the oracle used.
  dmg_reaction_aggravate: 20,
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

// Each rep's catalyze reaction — mirrors the catalyze oracle config (build-configs.mjs
// §catalyze axis: Baizhu spread, Fischl aggravate). The single setting value is "quicken";
// the HIT element decides Spread (Baizhu's native dendro hits ×1.25) vs Aggravate (Fischl's
// native electro skill/burst ×1.15). Each rep's non-matching hits (Baizhu plunge Collision;
// Fischl's physical normals/plunges) stay un-catalyzed.
const REACTION_BY_CHAR: Readonly<Record<string, string>> = {
  baizhu: "quicken",
  fischl: "quicken",
};

// Per-rep extra char settings the oracle config baked beyond `reaction` (so the Σ source fires).
// Baizhu's A4 dmg_reaction_quicken postEffect (the Spread Σ) is gated by his
// `baizhu_all_things_are_of_the_earth` toggle; enable it exactly as the oracle config did.
const EXTRA_SETTINGS: Readonly<Record<string, Readonly<Record<string, unknown>>>> = {
  baizhu: { baizhu_all_things_are_of_the_earth: true },
};

interface Fixture {
  readonly slug: string;
  readonly features: Record<string, FixtureEntry>;
}

const CATALYZE_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../tests/golden/fixtures/catalyze"
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

const fixtureFiles = existsSync(CATALYZE_DIR)
  ? readdirSync(CATALYZE_DIR).filter(
      (f) => f.endsWith(".json") && f !== "_manifest.json"
    )
  : [];

describe("catalyze-burndown", () => {
  it("the catalyze fixture family exists", () => {
    expect(fixtureFiles.length).toBeGreaterThan(0);
  });
});

for (const file of fixtureFiles) {
  const fixture = JSON.parse(
    readFileSync(join(CATALYZE_DIR, file), "utf-8")
  ) as Fixture;
  const slug = fixture.slug;

  describe(`catalyze-burndown: ${slug}`, () => {
    const char = charForSlug(slug);
    if (!char) {
      it(`${slug}: rep char file present`, () =>
        expect.fail(`no characters/*.ts for ${slug}`));
      return;
    }

    const reaction = REACTION_BY_CHAR[slug];
    const settings = {
      ...(reaction ? { reaction } : {}),
      ...(EXTRA_SETTINGS[slug] ?? {}),
    };

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

    // Catalyze scope: direct catalyzed HITS only (a crit-spread triple). Exclude
    // transformative reaction OUTPUTS (category 'reaction') — those differ here only because
    // the Σ sources (ThunderingFury / Baizhu A4) also carry transformative dmg_reaction_*
    // bonuses, which are the transformative-reaction sub-project, not Spread/Aggravate.
    const damageKeys = Object.entries(fixture.features)
      .filter(([, e]) => isDamageTripleEntry(e) && e.category !== "reaction")
      .map(([k]) => k);

    for (const key of damageKeys.filter((k) => k in compiled)) {
      const oracle = fixture.features[key]!;
      it(`${slug}/${key} catalyzed avg within ${TOLERANCE}`, () => {
        const result = compiled[key]!(context);
        expect(
          Math.abs(result.avg - oracle.average),
          `${slug}/${key}: ours=${result.avg.toFixed(2)}, oracle=${oracle.average.toFixed(2)}`
        ).toBeLessThanOrEqual(TOLERANCE);
      });
    }
  });
}
