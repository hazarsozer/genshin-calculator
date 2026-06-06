/**
 * P3.5 Mizuki swirl-crit — Swirl-crit guard (RED by design, pending Task B).
 *
 * The `swirl-crit` oracle config (build-configs.mjs) dumps Yumemizuki Mizuki's engine output
 * at C6 + dreamdrifter ON to tests/golden/fixtures/swirl-crit/. At C6 her SWIRL reactions CRIT:
 * raw/.../db/Char/Mizuki.js:402-416 is a ConditionStatic{crit_rate_swirl:30, crit_dmg_swirl:100}
 * on the constellation-6 entry, gated by a subCondition ConditionBoolean('mizuki_dreamdrifter')
 * (consts at Mizuki.js:126-127). Those keys feed all 4 swirl instances via
 * FeatureReactionSwirl.getStatsCritRate()->['crit_rate_swirl'] / getStatsCritDamage()->
 * ['crit_dmg_swirl'] (raw/.../Feature2/Reaction/Transformative/Swirl.js:9-22). crit_*_swirl are
 * isPercent (raw 30 -> 30%) → a 30% rate at +100% crit DMG → each swirl triple's crit ≈ 2×normal,
 * average ≈ 1.3×normal.
 *
 * Our engine's 4 `swirl_*` reaction defs (packages/data/src/reactions.ts:107-110) carry NO
 * critRateKeys/critDmgKeys, and our port SKIPs Mizuki's C6 condition (yumemizuki_mizuki.ts) — so
 * our swirl is always non-crit (normal == crit == average). Each oracle swirl triple's crit (and
 * average) therefore EXCEEDS ours, and that RED is the deliverable: it proves the hole. Wiring it
 * to GREEN is Task B (swirl crit keys on the 4 defs + the Mizuki C6+dreamdrifter condition).
 *
 * SCOPE — the SWIRL reaction triples (a crit-spread triple). The C6 crit_*_swirl keys touch ONLY
 * swirl (Swirl.js, not the shared FeatureReactionTransformative base), so we assert exactly the 4
 * `reaction.swirl_*` outputs. Other reactions (overloaded/EC/burning/bloom-family/etc.) carry no
 * crit_*_swirl and are unchanged by C6 — out of scope here. We assert NORMAL and CRIT and AVERAGE
 * separately so the de-risk is visible: a RED on NORMAL signals an additional dreamdrifter-EM
 * (dmg_reaction_swirl) modeling gap; a RED on CRIT/AVERAGE alone is the pure C6 swirl-crit gap.
 *
 * GUARD — HONESTY RULES (verbatim from armory.test.ts / catalyzeBurndown.test.ts): NO it.skip,
 * NO it.todo, NO it.fails, NO loosened tolerance, NO hard-coded overrides. The RED is by design
 * pending Task B.
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

// The swirl-crit oracle build: C6 (every constellation ≤ 6 active) AND the dreamdrifter stance ON
// — the ONLY combo that activates Mizuki's C6 swirl crit (build-configs.mjs §swirl-crit).
const SETTINGS = {
  char_constellation: 6,
  mizuki_dreamdrifter: true,
} as const;

interface Fixture {
  readonly slug: string;
  readonly features: Record<string, FixtureEntry>;
}

const SWIRL_CRIT_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../tests/golden/fixtures/swirl-crit"
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

const fixtureFiles = existsSync(SWIRL_CRIT_DIR)
  ? readdirSync(SWIRL_CRIT_DIR).filter(
      (f) => f.endsWith(".json") && f !== "_manifest.json"
    )
  : [];

describe("swirl-crit-burndown", () => {
  it("the swirl-crit fixture family exists", () => {
    expect(fixtureFiles.length).toBeGreaterThan(0);
  });
});

for (const file of fixtureFiles) {
  const fixture = JSON.parse(
    readFileSync(join(SWIRL_CRIT_DIR, file), "utf-8")
  ) as Fixture;
  const slug = fixture.slug;

  describe(`swirl-crit-burndown: ${slug}`, () => {
    const char = charForSlug(slug);
    if (!char) {
      it(`${slug}: rep char file present`, () =>
        expect.fail(`no characters/*.ts for ${slug}`));
      return;
    }

    // buildStats propagates condition `.settings` into the returned merged `settings`; thread
    // those into the compile context exactly as constellations.test.ts does, so the C3/C5
    // talent `_bonus` offsets and any constellation-gated effects resolve at compile time.
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

    // Scope: the SWIRL reaction triples only. The C6 crit_*_swirl keys feed exclusively
    // FeatureReactionSwirl (Swirl.js), so only `reaction.swirl_*` carries the crit spread; the
    // other transformative reactions are unchanged at C6 and out of scope here.
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
