/**
 * P3.5.2 — partyData teammate-buff burndown (RED -> GREEN across Tasks 2-5).
 *
 * The `party-buffs` oracle config (build-configs.mjs) dumps her engine's triples for a recipient
 * active char with ONE buff-source teammate (Zhongli=A / Bennett+Kazuha=B / Shenhe=C). This suite
 * drives OUR engine with the same {character, settings} roster + a slug->DbObjectChar resolver and
 * asserts the recipient's buffed damage. RED on arrival (engine models no partyData yet -> Task 2).
 *
 * GUARD — HONESTY RULES (verbatim from armory.test.ts): NO it.skip, NO it.todo, NO it.fails,
 * NO loosened tolerance, NO hard-coded overrides.
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";
import { describe, it, expect } from "vitest";
import { buildStats } from "../buildStats.js";
import { compileCharacter } from "../loader.js";
import type { PartyInput } from "../partyContext.js";
import type { ActiveCharFacts } from "../partyContext.js";
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

/**
 * Resolve a teammate slug → DbObjectChar for the party-buffs test.
 *
 * Today's `partySlugResolver` signature is `(slug: string) => ActiveCharFacts`.
 * Task 2 widens it to `(slug: string) => DbObjectChar` so the engine can read the
 * teammate's partyData kit. For Task 1 we return the full DbObjectChar but cast it
 * to satisfy the current type — the cast is removed in Task 2 when the types widen.
 */
const resolveChar = (slug: string): ActiveCharFacts => {
  const c = charBySlug[slug];
  if (!c) throw new Error(`party-buffs: no characters/*.ts for teammate slug '${slug}'`);
  // Task 2 widens partySlugResolver to (slug) => DbObjectChar; cast removed then.
  return c as unknown as ActiveCharFacts;
};

// ---------------------------------------------------------------------------
// Manifest + fixture types
// ---------------------------------------------------------------------------

interface ManifestMember {
  readonly character?: string;
  readonly settings?: Record<string, unknown>;
  readonly element?: string;
  readonly origin?: string;
}

interface ManifestItem {
  readonly slug: string;
  /** The charKey (e.g. "Ganyu") — used to look up the fixture's `repChar` field. */
  readonly repKey: string;
  /** The TS slug (e.g. "ganyu") — used to resolve the recipient DbObjectChar. */
  readonly repSlug: string;
  readonly party: { readonly members: readonly ManifestMember[] };
}

interface Manifest {
  readonly items: readonly ManifestItem[];
}

interface Fixture {
  readonly slug: string;
  readonly features: Record<string, FixtureEntry>;
}

// ---------------------------------------------------------------------------
// Fixture directory
// ---------------------------------------------------------------------------

const DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../tests/golden/fixtures/party-buffs"
);

const manifest: Manifest = existsSync(join(DIR, "_manifest.json"))
  ? (JSON.parse(
      readFileSync(join(DIR, "_manifest.json"), "utf-8")
    ) as Manifest)
  : { items: [] };

// ---------------------------------------------------------------------------
// Family-exists guard
// ---------------------------------------------------------------------------

describe("party-buffs-burndown", () => {
  it("the party-buffs fixture family exists", () => {
    expect(manifest.items.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Per-item burndown — one describe per fixture slug
// ---------------------------------------------------------------------------

for (const item of manifest.items) {
  describe(`party-buffs-burndown: ${item.slug}`, () => {
    const recipient = charBySlug[item.repSlug];
    const fixture: Fixture | undefined = existsSync(join(DIR, `${item.slug}.json`))
      ? (JSON.parse(
          readFileSync(join(DIR, `${item.slug}.json`), "utf-8")
        ) as Fixture)
      : undefined;

    if (!recipient || !fixture) {
      it(`${item.slug}: recipient + fixture present`, () =>
        expect.fail(
          `missing recipient '${item.repSlug}' or fixture '${item.slug}.json'`
        ));
      return;
    }

    // Reconstruct the PartyInput from the manifest members.
    // Manifest members are {character, settings} objects.
    // Today's PartyMember {character} variant has no `settings` field (Task 2 adds it).
    // Cast the members array to satisfy today's type while still running the test.
    const members = item.party.members.map((m) =>
      m.character !== undefined
        ? { character: m.character }
        : ({ element: m.element, ...(m.origin !== undefined ? { origin: m.origin } : {}) } as {
            element: string;
          })
    );
    const party = { members } as PartyInput;

    const { context, settings: merged, characterMultipliers } = buildStats({
      char: recipient,
      weaponStatTable: WEAPON_TABLE_BY_TYPE[recipient.weapon]!,
      statBlock: STAT_BLOCK,
      levels: LEVELS,
      enemy: ENEMY,
      party,
      // Task 2 widens partySlugResolver to (slug) => DbObjectChar so the engine can
      // read the teammate's partyData buffs. Today it resolves to ActiveCharFacts only
      // (element + origin counts), so party_* keys are computed but NO kit buffs land.
      partySlugResolver: resolveChar,
      talentLevels: TALENTS,
    });

    // Thread merged settings + characterMultipliers into the compile, as partyBurndown.test.ts
    // does: a Bucket-C teammate multiplier (Shenhe) applies via extraMultipliers, and its
    // condition gate (+ any teammate toggle) reads the merged settings.
    const compiled = compileCharacter(recipient, {
      charElement: recipient.element,
      talentLevels: TALENTS,
      settings: merged,
      charLevel: LEVELS.charLevel,
      extraMultipliers: characterMultipliers,
    });

    const damageKeys = Object.entries(fixture.features)
      .filter(([, e]) => isDamageTripleEntry(e))
      .map(([k]) => k);

    for (const key of damageKeys.filter((k) => k in compiled)) {
      const oracle = fixture.features[key]!;
      it(`${item.slug}/${key} buffed avg within ${TOLERANCE}`, () => {
        const result = compiled[key]!(context);
        expect(
          Math.abs(result.avg - oracle.average),
          `${item.slug}/${key}: ours=${result.avg.toFixed(2)}, oracle=${oracle.average.toFixed(2)}`
        ).toBeLessThanOrEqual(TOLERANCE);
      });
    }
  });
}
