/**
 * P3.5 build-assembly — real-artifact → stat-block assembly golden floor (RED by design
 * until assembleArtifactStats DERIVES from the ported tables).
 *
 * The `assembly` oracle config (build-configs.mjs §assembly: assemblyItems) equips 5 REAL
 * DB.__Artifact pieces under 5 DISTINCT registered sets at 1 PIECE each (every 1pc tier is
 * empty — bonus[1]={} in her setBonus [{},{2pc},{},{4pc}] array — so NO set bonus/condition/
 * feature fires; the oracle output is a PURE function of the artifact MAIN+SUB stats). Her
 * Artifact.calcStats() (raw/.../classes/Artifact.js:27-46) DERIVES each piece's MAIN from the
 * Mainstats per-rarity/level table (values[rarity-1].getValue(level), 0-INDEXED) and SNAPS each
 * SUBSTAT via the getPreciseValue EXACT dictionary (preciseValues[rarity-1][value] || value —
 * NOT rounding). Each rep's fixture (tests/golden/fixtures/assembly/) therefore carries her
 * engine's ARTIFACT-BUFFED damage triples.
 *
 * This suite reconstructs the SAME 5 pieces from the manifest's party.artifacts (GOOD
 * descriptors: rarity/level/slot/main-KEY/substat display rolls — NO values), DERIVES the bag
 * via assembleArtifactStats (the function under test), MERGES it onto the fixed sampleStats base
 * block (her getBuildData adds the artifact bag ON TOP of the FIXED_BUILD statBlock — both concat
 * additively into the same Stats), feeds that as the `statBlock` to buildStats, compiles, and
 * asserts each DAMAGE-triple avg within 0.1 of the oracle.
 *
 * THE RED (the deliverable): before the port, assembleArtifactStats trusts a caller-supplied
 * `mainStatValue` (absent from the reconstructed raw pieces) + sums substats VERBATIM (no snap).
 * Feeding raw pieces → the main contribution is absent (NaN/undershoot) and every substat is
 * un-snapped → every artifact-sensitive damage triple mismatches the oracle. GREEN = rewrite
 * assembleArtifactStats to DERIVE the main (getMainStatValue, 0-indexed) + SNAP each substat
 * (getPreciseSubValue) from generated/artifactTables.ts. The fixtures are byte-unchanged under
 * that flip (assembleArtifactStats is unit-only — not in the golden path), so this suite goes
 * GREEN with NO edits here.
 *
 * The HONEST RED requires feeding RAW pieces (NO mainStatValue) so the port must DERIVE —
 * passing mainStatValue would test nothing.
 *
 * GUARD — HONESTY RULES (verbatim from foodBurndown.test.ts / enemyStateBurndown.test.ts): NO
 * it.skip, NO it.todo, NO it.fails, NO loosened tolerance, NO hard-coded overrides. The RED is by
 * design pending the assembleArtifactStats derivation.
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";
import { describe, it, expect } from "vitest";
import { assembleArtifactStats } from "../assembleBuild.js";
import { buildStats } from "../buildStats.js";
import { compileCharacter } from "../loader.js";
import {
  blackcliffPoleStatTable,
  theBellStatTable,
  alleyFlashStatTable,
  alleyHunterStatTable,
  solarPearlStatTable,
} from "../generated/weaponStatTables.js";
import type { Artifact, DbObjectChar, StatTableEntry } from "@genshin/types";
import { SAMPLE_BLOCK } from "./_statBlocks.js";
import { type FixtureEntry, isDamageTripleEntry } from "./_fixtureEntry.js";

const LEVELS = {
  charLevel: 90,
  ascension: 6,
  weaponLevel: 90,
  weaponAscension: 6,
} as const;

const ENEMY = { level: 90, resistance: 10 } as const;

const TALENTS = { attack: 10, elemental: 10, burst: 10 } as const;

const TOLERANCE = 0.1;

/** A reconstructable GOOD piece descriptor from the manifest (NO main/sub VALUES — display rolls only). */
interface PieceDescriptor {
  readonly slot: Artifact["slot"];
  readonly setKey: string;
  readonly rarity: Artifact["rarity"];
  readonly level: number;
  readonly mainStatKey: Artifact["mainStatKey"];
  readonly subStats: readonly { readonly key: Artifact["subStats"][number]["key"]; readonly value: number }[];
}

interface ManifestItem {
  readonly slug: string;
  /** The charKey (e.g. "Hutao"). */
  readonly repKey: string;
  /** The TS slug (e.g. "hu_tao") — used to resolve the recipient DbObjectChar. */
  readonly repSlug: string;
  /** The reconstructable 5-piece build the oracle equipped (GOOD descriptors). */
  readonly party: { readonly artifacts: readonly PieceDescriptor[] };
}

interface Manifest {
  readonly items: readonly ManifestItem[];
}

interface Fixture {
  readonly slug: string;
  readonly features: Record<string, FixtureEntry>;
}

const ASSEMBLY_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../tests/golden/fixtures/assembly"
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

// slug ("hu_tao") -> DbObjectChar. The assembly config is a partyItems config, so a fixture's
// slug is the EFFECT slug (e.g. "assembly-hutao-5star"); the rep char is resolved from the
// manifest's repSlug (mirroring foodBurndown.test.ts).
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

const manifest: Manifest = existsSync(join(ASSEMBLY_DIR, "_manifest.json"))
  ? (JSON.parse(readFileSync(join(ASSEMBLY_DIR, "_manifest.json"), "utf-8")) as Manifest)
  : { items: [] };

/**
 * Reconstruct the port's Artifact[] from the manifest's GOOD piece descriptors — RAW pieces
 * with NO mainStatValue (the honest RED: the port must DERIVE the main from the table, not read
 * it). Typed as the (post-port) Artifact shape; in the RED state the absent mainStatValue makes
 * the current assembleArtifactStats produce a NaN/absent main → the undershoot the RED proves.
 */
function reconstructPieces(descriptors: readonly PieceDescriptor[]): readonly Artifact[] {
  return descriptors.map((d) => ({
    slot: d.slot,
    setKey: d.setKey,
    rarity: d.rarity,
    level: d.level,
    mainStatKey: d.mainStatKey,
    subStats: d.subStats.map((s) => ({ key: s.key, value: s.value })),
  })) as readonly Artifact[];
}

/** Sum the derived artifact bag onto the fixed sampleStats base block (both concat additively). */
function mergeBlocks(
  base: Readonly<Record<string, number>>,
  bag: Readonly<Record<string, number>>
): Record<string, number> {
  const out: Record<string, number> = { ...base };
  for (const [k, v] of Object.entries(bag)) out[k] = (out[k] ?? 0) + v;
  return out;
}

describe("assembly-golden", () => {
  it("the assembly fixture family exists", () => {
    expect(manifest.items.length).toBeGreaterThan(0);
  });
});

for (const item of manifest.items) {
  describe(`assembly-golden: ${item.slug}`, () => {
    const char = charBySlug[item.repSlug];
    const fixture: Fixture | undefined = existsSync(join(ASSEMBLY_DIR, `${item.slug}.json`))
      ? (JSON.parse(readFileSync(join(ASSEMBLY_DIR, `${item.slug}.json`), "utf-8")) as Fixture)
      : undefined;

    if (!char || !fixture) {
      it(`${item.slug}: rep char + fixture present`, () =>
        expect.fail(
          `missing rep char '${item.repSlug}' or fixture '${item.slug}.json'`
        ));
      return;
    }

    // Reconstruct the 5 RAW pieces (NO mainStatValue) and DERIVE the artifact bag via the
    // function under test, then merge onto the fixed sampleStats base (her getBuildData adds the
    // artifact stats on top of the FIXED_BUILD block). The derived bag's keys are Aspirine-native
    // (atk_percent / crit_rate / dmg_pyro / …) → consumed verbatim by buildStats's read loop.
    const pieces = reconstructPieces(item.party.artifacts);
    const artifactBag = assembleArtifactStats(pieces);
    const statBlock = mergeBlocks(SAMPLE_BLOCK, artifactBag);

    const { context } = buildStats({
      char,
      weaponStatTable: WEAPON_TABLE_BY_TYPE[char.weapon]!,
      statBlock,
      levels: LEVELS,
      enemy: ENEMY,
    });

    // No set bonuses, no toggles (the 5 sets are each 1pc → inert). Compile with the base talents
    // and an empty settings bag (compileCharacter reads ctx.settings for the catalyze gate).
    const compiled = compileCharacter(char, {
      charElement: char.element,
      talentLevels: TALENTS,
      settings: {},
      charLevel: LEVELS.charLevel,
    });

    // Assert every DAMAGE triple the oracle emitted (a crit-spread triple). Non-damage outputs
    // (heal/shield/static readouts: normal == crit == average) and stats are excluded — this gate
    // is about the assembled artifact stats lifting DAMAGE.
    const damageKeys = Object.entries(fixture.features)
      .filter(([, e]) => isDamageTripleEntry(e))
      .map(([k]) => k);

    for (const fkey of damageKeys.filter((k) => k in compiled)) {
      const oracle = fixture.features[fkey]!;
      it(`${item.slug}/${fkey} avg within ${TOLERANCE}`, () => {
        const result = compiled[fkey]!(context);
        expect(
          Math.abs(result.avg - oracle.average),
          `${item.slug}/${fkey}: ours=${result.avg.toFixed(2)}, oracle=${oracle.average.toFixed(2)}`
        ).toBeLessThanOrEqual(TOLERANCE);
      });
    }
  });
}
