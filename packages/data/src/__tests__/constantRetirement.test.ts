/**
 * Phase 3 ④ / ④.O — Build-coupled-fold burndown harness (the fold-retirement gate).
 *
 * Consumes the FOLD oracle fixture families produced by the fold configs in
 * tools/oracle/build-configs.mjs (dumped via
 * `node tools/oracle/dump-oracle.mjs --config=sayu_c6_em,kirara_c1_hp,yelan_adapt,yelan_a1,xilonen_resshred,thundering_lunarcharged`):
 *
 *   sayu_c6_em               — sayu C6 ATK-coefficient fold min(mastery×0.002, 4) at two EM points
 *                              (mastery 396 → coeff 0.792; mastery 2496 → cap 4). (fold: const 0.302.)
 *   kirara_c1_hp             — kirara C1 extra-explosion scalingMultiplier fold min(floor(hp/8000), 4)
 *                              at two HP points (hp 19939 → 2; hp 56023 → cap 4). (fold: const 3.)
 *   yelan_adapt              — yelan "Adapt with Ease" dmg_all levels-table at stacks 1 / 7
 *                              (dmg_all 1 / 22). (fold: boolean → dmg_all:50.)
 *   yelan_a1                 — yelan A1 hp_percent count-table at party_elements_count_level 4
 *                              (hp_percent:30). (fold: count 1 → hp_percent:6.)
 *   xilonen_resshred         — xilonen skill geo-RES shred enemy_res_geo:-36 (samplers ON).
 *                              (fold: unmodeled / inert at solo C0.)
 *   thundering_lunarcharged  — ThunderingFury 4pc dmg_reaction_lunarcharged with a live
 *                              Lunar-Charged reaction (Ineffa). (fold: buildStats un-divided emit.)
 *   clam_foam                — Ocean-Hued Clam 4pc Sea-Dyed Foam at accumulated_healing=20000
 *                              (foam 16200, no-crit / no-dmg-bonus / DEF-ignored). (fold: foam
 *                              modeled only at accumulated_healing=0, i.e. 0.)
 *   weapon_other             — off-field weapon party buffs (M4a): Thrilling Tales +48% ATK
 *                              (weapon.thrilling_tales) / Wolf's Gravestone +80% ATK
 *                              (weapon_other.weapon_wolfs_gravestone) on Diluc, via a global
 *                              weapon_other-gated condition. (fold: unmodeled / inert before this.)
 *
 * For each manifest item the harness reconstructs the SAME build her oracle used — the rep char,
 * the per-item raw stat block (sayu EM / kirara HP), the off-build constellation, and the off-build
 * lever (yelan adapt stacks / xilonen samplers / a party for yelan A1 / ThunderingFury 4pc) — and
 * PROVES it matches the oracle (every produced damage feature's triple within abs 0.1, + the mis-key
 * guard + the full-coverage gate), OR fails with a precise "not yet matching — burndown" test.
 *
 * THE SUITE IS INTENTIONALLY RED OVERALL (the ④ signal): every one of these folds is still a
 * BUILD-COUPLED CONSTANT in the TS port, correct only at the frozen build's stat point. Off that
 * point the constant desyncs from her runtime formula, so the produced triples mismatch the oracle.
 * That RED is the remaining-work signal — Phase 3 ④ Tasks 2-5 retire each fold to its faithful
 * runtime formula and flip the families green, exactly as partyBurndown.test.ts drove ②. The branch
 * is not merged until this burndown reaches ZERO.
 *
 * ROUND-TRIP ANCHOR (the M1 prerequisite, asserted GREEN now): for the stat-derived folds the
 * harness checks our build's mastery_total / hp_total equals the oracle's stats.mastery / stats.hp,
 * and for the party fold (yelan_a1) that buildPartyContext reproduces her derived party_* keys. This
 * proves the consumer sets the SAME stat point / party her engine did — so when M1/M2 land, the
 * coefficient computed from this exact total/level WILL reproduce the oracle (the desync is the fold,
 * not a mis-set input). These anchor tests are GREEN today and stay green; only the damage triples are
 * RED until the folds are retired.
 *
 * RED-NOT-ERROR (verbatim from armory.test.ts / partyBurndown.test.ts): an unmatched fold resolves to
 * a FAILING `it`, never a thrown error at glob/load time (a throw would abort the suite and make
 * burndown impossible). A missing rep character (impossible — all 107 are ported) IS a hard error.
 *
 * HONESTY RULES (verbatim from goldenConfig.test.ts / armory.test.ts):
 *   - NO it.skip, NO it.todo, NO loosened tolerance, NO hard-coded overrides.
 *   - A RED fold means the engine doesn't yet reproduce the oracle off-build — a real signal worth
 *     investigating (and retiring), not something to hide.
 *   - TEST-ONLY: no production code is touched.
 *
 * Manifest item shape (per item in `manifest.items`, from engine.resolveFold):
 *   { slug, kind: "fold", repKey, repSlug, element, origin, constellation,
 *     weapon: { name, type },
 *     party: { members?: [{element,origin}], charSettings?, settings?, setBonuses?, … },
 *     derived: { party_elements_* / party_size },   // her engine's cross-check (yelan_a1)
 *     resonanceElements, statBlock: "fold", statBlockValues: { <raw stat block> }, featureCount }
 *
 * Sources:
 *   tests/golden/fixtures/{sayu_c6_em,kirara_c1_hp,yelan_adapt,yelan_a1,xilonen_resshred,thundering_lunarcharged}/
 *   packages/data/src/__tests__/partyBurndown.test.ts   — burndown template (mirrored)
 *   packages/data/src/__tests__/armory.test.ts          — item-axis fixture consumption
 *   packages/data/src/partyContext.ts                   — the PartyInput shape reconstructed here
 */

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";
import { describe, it, expect } from "vitest";
import { buildStats } from "../buildStats.js";
import { compileCharacter } from "../loader.js";
import { buildPartyContext, type PartyInput, type PartyMember } from "../partyContext.js";
import type {
  CompiledFeature,
  DbObjectArtifactSet,
  DbObjectChar,
  DbObjectWeapon,
  Element,
  EvalContext,
} from "@genshin/types";

// ---------------------------------------------------------------------------
// Constants — mirror partyBurndown.test.ts / armory.test.ts
// ---------------------------------------------------------------------------

const LEVELS = {
  charLevel: 90,
  ascension: 6,
  weaponLevel: 90,
  weaponAscension: 6,
} as const;

const ENEMY = { level: 90, resistance: 10 } as const;

const TALENTS = { attack: 10, elemental: 10, burst: 10 } as const;

const TOLERANCE = 0.1;

/** The fold families dumped by the ④.O oracle configs (each a fixture subdir). */
const FOLD_FAMILIES = [
  "sayu_c6_em",
  "kirara_c1_hp",
  "yelan_adapt",
  "yelan_a1",
  "xilonen_resshred",
  "xilonen_c2_resshred",
  "thundering_lunarcharged",
  "clam_foam",
  "weapon_other",
  "weapon_other_group_b",
] as const;

// ---------------------------------------------------------------------------
// Fixture types — verbatim from armory.test.ts (carries isReacted/format)
// ---------------------------------------------------------------------------

interface FixtureEntry {
  readonly category: string;
  readonly damageType: string | undefined;
  readonly normal: number;
  readonly crit: number;
  readonly average: number;
  readonly isReacted: boolean;
  readonly format: string;
}

interface Fixture {
  readonly features: Record<string, FixtureEntry>;
}

/** Damage-triple predicate — verbatim from the templates. */
function isDamageTripleEntry(entry: FixtureEntry): boolean {
  if (entry.category === "stats") return false;
  if (!entry.damageType) return false;
  return true;
}

// ---------------------------------------------------------------------------
// Fixture and manifest paths
// ---------------------------------------------------------------------------

const FIXTURES_ROOT = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../tests/golden/fixtures"
);

function loadFixture(family: string, slug: string): Fixture {
  return JSON.parse(
    readFileSync(join(FIXTURES_ROOT, family, `${slug}.json`), "utf-8")
  ) as Fixture;
}

// ---------------------------------------------------------------------------
// Manifest types — the fold item shape (engine.resolveFold)
// ---------------------------------------------------------------------------

/** A teammate as element+origin — directly usable as a PartyInput member (no resolver). */
interface ManifestMember {
  readonly element: string;
  readonly origin?: string;
}

/** The reconstructable PartyInput + the extra build inputs a fold config can carry. */
interface ManifestParty {
  readonly members?: readonly ManifestMember[];
  /** Active char's own conditional toggles (yelan_adapt_with_ease stacks, xilonen samplers). */
  readonly charSettings?: EvalContext;
  /** Extra raw settings the effect needs (carried verbatim into the compile settings). */
  readonly settings?: EvalContext;
  /** Equipped artifact set(s) (ThunderingFury 4pc). */
  readonly setBonuses?: readonly { readonly setKey: string; readonly pieces: number }[];
  readonly enemyStatus?: string;
  readonly setOther?: readonly string[];
  readonly bondOfLife?: number;
}

interface ManifestItem {
  readonly slug: string;
  readonly kind: "fold";
  readonly repKey: string;
  readonly repSlug: string;
  readonly element: string;
  readonly origin?: string;
  /** Off-build constellation (sayu C6 / kirara C1; 0 otherwise). */
  readonly constellation: number;
  readonly weapon: { readonly name: string; readonly type: string };
  readonly party: ManifestParty;
  /** Her engine's derived party_* keys (the cross-check buildPartyContext must match; yelan_a1). */
  readonly derived: Readonly<Record<string, number>>;
  readonly resonanceElements: Readonly<Record<string, string>>;
  readonly statBlock: string;
  /** The verbatim per-item raw stat block (sayu EM / kirara HP) — the round-trip anchor. */
  readonly statBlockValues: Readonly<Record<string, number>>;
  readonly featureCount: number;
}

interface Manifest {
  readonly config: { readonly id: string };
  readonly base: { readonly statBlock: Readonly<Record<string, number>> };
  readonly items: readonly ManifestItem[];
}

function loadManifest(family: string): Manifest {
  return JSON.parse(
    readFileSync(join(FIXTURES_ROOT, family, "_manifest.json"), "utf-8")
  ) as Manifest;
}

// ---------------------------------------------------------------------------
// ImportMeta declaration for import.meta.glob — verbatim from the templates
// ---------------------------------------------------------------------------

declare global {
  interface ImportMeta {
    glob(
      pattern: string,
      options: { eager: true }
    ): Record<string, Record<string, unknown>>;
  }
}

// ---------------------------------------------------------------------------
// Slug + shape helpers — verbatim from the templates
// ---------------------------------------------------------------------------

function slugFromPath(path: string): string {
  const base = path.slice(path.lastIndexOf("/") + 1).replace(/\.ts$/, "");
  return base.replace(/-/g, "_");
}

function isDbObjectChar(value: unknown): value is DbObjectChar {
  return (
    typeof value === "object" &&
    value !== null &&
    "weapon" in value &&
    "element" in value &&
    "features" in value
  );
}

function isDbObjectWeapon(value: unknown): value is DbObjectWeapon {
  return (
    typeof value === "object" &&
    value !== null &&
    "name" in value &&
    "weapon" in value &&
    "statTable" in value &&
    !("element" in value)
  );
}

function isDbObjectArtifactSet(value: unknown): value is DbObjectArtifactSet {
  return (
    typeof value === "object" &&
    value !== null &&
    "goodId" in value &&
    "bonus" in value
  );
}

// ---------------------------------------------------------------------------
// Auto-discover characters / weapons — same globs as the templates
// ---------------------------------------------------------------------------

const CHAR_MODULES = import.meta.glob("../characters/*.ts", { eager: true });

const charBySlug: Readonly<Record<string, DbObjectChar>> = Object.fromEntries(
  Object.entries(CHAR_MODULES)
    .filter(([path]) => !path.endsWith("/index.ts"))
    .flatMap(([path, mod]) => {
      const slug = slugFromPath(path);
      const chars = Object.values(mod).filter(isDbObjectChar);
      if (chars.length !== 1) {
        throw new Error(
          `characters/${slug}: expected exactly 1 DbObjectChar export, found ${chars.length}`
        );
      }
      return [[slug, chars[0]!] as [string, DbObjectChar]];
    })
);

const WEAPON_MODULES = import.meta.glob("../weapons/*.ts", { eager: true });

const weaponByName: Readonly<Record<string, DbObjectWeapon>> = Object.fromEntries(
  Object.entries(WEAPON_MODULES)
    .filter(([path]) => !path.endsWith("/index.ts"))
    .flatMap(([, mod]) =>
      Object.values(mod)
        .filter(isDbObjectWeapon)
        .map((w) => [w.name, w] as [string, DbObjectWeapon])
    )
);

/** "weapon_name.the_bell" → "the_bell" (the DbObjectWeapon `name`). */
function weaponNameFromManifest(manifestName: string): string {
  return manifestName.startsWith("weapon_name.")
    ? manifestName.slice("weapon_name.".length)
    : manifestName;
}

// Set registry — fold families that equip a set (ThunderingFury 4pc) resolve it via the DI
// seam, exactly as armory.test.ts / partyBurndown.test.ts (key by goodId).
const SET_MODULES = import.meta.glob("../artifacts/sets/*.ts", { eager: true });

const setByGoodId: Readonly<Record<string, DbObjectArtifactSet>> = Object.fromEntries(
  Object.entries(SET_MODULES)
    .filter(([path]) => !path.endsWith("/index.ts"))
    .flatMap(([, mod]) =>
      Object.values(mod)
        .filter(isDbObjectArtifactSet)
        .map((s) => [s.goodId, s] as [string, DbObjectArtifactSet])
    )
);

// ---------------------------------------------------------------------------
// PartyInput reconstruction — the manifest `party.members` are {element,origin}
// records, directly a PartyInput (no catalog resolver needed). Verbatim from
// partyBurndown.test.ts.
// ---------------------------------------------------------------------------

function partyInputFromManifest(party: ManifestParty): PartyInput {
  const members: PartyMember[] = (party.members ?? []).map((m) =>
    m.origin !== undefined
      ? { element: m.element as Element, origin: m.origin }
      : { element: m.element as Element }
  );
  const plainSetOther = (party.setOther ?? []).filter((t) => !t.includes("="));
  return {
    members,
    ...(party.enemyStatus !== undefined ? { enemyStatus: party.enemyStatus } : {}),
    ...(party.bondOfLife !== undefined ? { bondOfLife: party.bondOfLife } : {}),
    ...(plainSetOther.length ? { setOther: plainSetOther } : {}),
  };
}

/** The non-party raw settings the fold needs (constellation + charSettings + extra settings). */
function settingsFromManifest(item: ManifestItem): EvalContext {
  const out: Record<string, unknown> = { char_constellation: item.constellation };
  if (item.party.charSettings) Object.assign(out, item.party.charSettings);
  if (item.party.settings) Object.assign(out, item.party.settings);
  for (const token of item.party.setOther ?? []) {
    const eq = token.indexOf("=");
    if (eq > 0) out[`set_other.${token.slice(0, eq)}`] = token.slice(eq + 1);
  }
  return out as EvalContext;
}

// ---------------------------------------------------------------------------
// Shared assertion block — register the per-feature triple + mis-key + coverage
// tests for a built+compiled item against its fixture. Verbatim structure from
// armory.test.ts / partyBurndown.test.ts.
// ---------------------------------------------------------------------------

function assertItemAgainstFixture(
  slug: string,
  fixture: Fixture,
  context: ReturnType<typeof buildStats>["context"],
  compiled: Readonly<Record<string, CompiledFeature>>
): void {
  const allDamageKeys = Object.entries(fixture.features)
    .filter(([, e]) => isDamageTripleEntry(e))
    .map(([k]) => k);

  const producedKeys = Object.keys(compiled).filter((k) => k in fixture.features);
  const unmodelledKeys = allDamageKeys.filter((k) => !(k in compiled));
  const orphanKeys = Object.keys(compiled).filter((k) => !(k in fixture.features));

  for (const key of producedKeys) {
    const oracle = fixture.features[key]!;
    if (!isDamageTripleEntry(oracle)) continue;

    it(`${key} normal within ${TOLERANCE}`, () => {
      const result = compiled[key]!(context);
      expect(
        Math.abs(result.normal - oracle.normal),
        `${slug}/${key} normal: ours=${result.normal.toFixed(4)}, oracle=${oracle.normal.toFixed(4)}`
      ).toBeLessThanOrEqual(TOLERANCE);
    });

    it(`${key} crit within ${TOLERANCE}`, () => {
      const result = compiled[key]!(context);
      expect(
        Math.abs(result.crit - oracle.crit),
        `${slug}/${key} crit: ours=${result.crit.toFixed(4)}, oracle=${oracle.crit.toFixed(4)}`
      ).toBeLessThanOrEqual(TOLERANCE);
    });

    it(`${key} avg within ${TOLERANCE}`, () => {
      const result = compiled[key]!(context);
      expect(
        Math.abs(result.avg - oracle.average),
        `${slug}/${key} avg: ours=${result.avg.toFixed(4)}, oracle=${oracle.average.toFixed(4)}`
      ).toBeLessThanOrEqual(TOLERANCE);
    });
  }

  // Mis-key guard: no produced key absent from the fixture.
  it(`${slug}: no produced key is absent from the fixture (mis-key guard)`, () => {
    expect(
      orphanKeys,
      `produced but absent from fixture (mis-keyed?): ${orphanKeys.join(", ")}`
    ).toEqual([]);
  });

  // Full-coverage gate: no unmodelled fixture damage feature.
  it(`${slug}: full coverage — no unmodelled fixture damage feature`, () => {
    expect(
      unmodelledKeys,
      `${slug}: unmodelled fixture damage features: ${unmodelledKeys.join(", ")}`
    ).toEqual([]);
  });
}

// ---------------------------------------------------------------------------
// Round-trip stat anchor — for the M1 stat-DERIVED folds (sayu mastery / kirara HP),
// the stat point is set EXTERNALLY via the per-item stat block, INDEPENDENT of the
// fold (only the coefficient computed from the total desyncs). Asserting mastery_total
// / hp_total equals the oracle's stats.mastery / stats.hp proves the consumer reached the
// SAME stat point, so the RED damage triple is attributable to the fold's constant — not a
// mis-set input. GREEN now and stays green.
//
// NOT applied to yelan_a1: there hp_total IS the fold's output (the A1 hp_percent table is
// folded into yelan's baseStats), so its hp desync is a RED burndown item itself — captured
// by the damage triples + the party-derived round-trip below, not double-counted here.
const STAT_ROUNDTRIP_FAMILIES: ReadonlySet<string> = new Set(["sayu_c6_em", "kirara_c1_hp"]);

function assertStatRoundTrip(
  slug: string,
  fixture: Fixture,
  stats: ReturnType<typeof buildStats>["stats"]
): void {
  const checks: ReadonlyArray<readonly [string, string]> = [
    ["stats.mastery", "mastery_total"],
    ["stats.hp", "hp_total"],
  ];
  for (const [fixtureKey, statKey] of checks) {
    const oracle = fixture.features[fixtureKey];
    if (!oracle) continue;
    it(`${slug}: ${statKey} round-trip matches oracle ${fixtureKey}`, () => {
      const ours = (stats as Record<string, number>)[statKey];
      expect(
        Math.abs(ours - oracle.normal),
        `${slug}/${statKey}: ours=${ours?.toFixed(4)}, oracle=${oracle.normal.toFixed(4)}`
      ).toBeLessThanOrEqual(TOLERANCE);
    });
  }
}

// ---------------------------------------------------------------------------
// Burndown bookkeeping — counts reported once at the end (legible burndown).
// ---------------------------------------------------------------------------

const foldEffects = new Set<string>();

// ===========================================================================
// FOLD PATH — one describe per fold point; rebuild the rep WITH the off-build
// stat block + lever + constellation, compile, then assert against the oracle
// fixture (mis-match == the ④ burndown signal).
// ===========================================================================

for (const family of FOLD_FAMILIES) {
  // A deferred/empty family (e.g. thundering_lunarcharged with no clean rep) writes no
  // fixtures + no manifest — skip its load silently (documented in the fold config + report).
  if (!existsSync(join(FIXTURES_ROOT, family, "_manifest.json"))) continue;

  const manifest = loadManifest(family);

  for (const item of manifest.items) {
    const { slug } = item;
    foldEffects.add(slug);

    // The rep MUST be a ported character (all 107 reps exist) — a missing rep is a
    // manifest/data error, not a burndown item, so throw loudly (mirrors armory.test.ts).
    const rep = charBySlug[item.repSlug];
    if (!rep) {
      throw new Error(
        `fold harness: effect "${slug}" rep slug "${item.repSlug}" not in auto-discovered chars`
      );
    }

    // Resolve the rep's equipped weapon stat table — its DEFAULT weapon (passive OFF); the
    // fold families never re-select a weapon. All fold-rep weapons are ported (armory guard).
    const weaponKey = weaponNameFromManifest(item.weapon.name);
    const weapon = weaponByName[weaponKey];
    if (!weapon) {
      throw new Error(
        `fold harness: effect "${slug}" rep weapon "${weaponKey}" not in ported weapons`
      );
    }

    const party = partyInputFromManifest(item.party);
    const settings = settingsFromManifest(item);
    const setBonuses = item.party.setBonuses ?? [];
    // SET-sourced features/multipliers from every equipped set (clam_foam equips OceanHuedClam
    // 4pc — its Sea-Dyed Foam is a SET FeatureDamage, threaded as extraFeatures exactly as
    // armory.test.ts does for the sets-4pc family). The foam carries its own pieces-count
    // produce-gate (4pc), so a <4pc equip leaves it absent; inert for every set-less fold.
    const setFeatures = setBonuses.flatMap((b) => setByGoodId[b.setKey]?.features ?? []);
    const setMultipliers = setBonuses.flatMap((b) => setByGoodId[b.setKey]?.multipliers ?? []);

    describe(`fold: ${family}/${slug} (${item.repSlug})`, () => {
      const fixture = loadFixture(family, slug);
      // The fold family carries a PER-ITEM raw stat block (sayu EM / kirara HP); others
      // record the base sampleStats block in statBlockValues — either way, rebuild verbatim.
      const statBlock = item.statBlockValues;

      const { stats, context, settings: propagated, characterMultipliers } = buildStats({
        char: rep,
        weaponStatTable: weapon.statTable,
        statBlock,
        levels: LEVELS,
        enemy: ENEMY,
        settings,
        party,
        setBonuses,
        setRegistry: setByGoodId,
        talentLevels: TALENTS,
      });

      const compiled = compileCharacter(rep, {
        charElement: rep.element,
        talentLevels: TALENTS,
        settings: propagated,
        charLevel: LEVELS.charLevel,
        // SET features (OceanHuedClam's foam) threaded as the char path's extraFeatures —
        // each subject to its own produce-gate against `propagated` (the merged settings, which
        // carry `set_pieces.*`). Empty for every set-less fold → byte-identical to before.
        extraFeatures: setFeatures,
        // The global CHARACTER_MULTIPLIERS team-buff channel (e.g. Song of Days Past 4pc),
        // each gated on its own toggle — inert for these folds, threaded for parity with the
        // party harness (the gate evaluates against `propagated`, the merged settings). PLUS
        // any equipped set's own char-level multipliers (parity with armory.test.ts).
        extraMultipliers: [...setMultipliers, ...characterMultipliers],
      });

      // Round-trip anchor (GREEN now) for the M1 stat-derived folds: the externally-set stat
      // point matches the oracle, so the RED below is the FOLD's coefficient, not a mis-set input.
      if (STAT_ROUNDTRIP_FAMILIES.has(family)) assertStatRoundTrip(slug, fixture, stats);
      // Damage triples (RED until the fold is retired): the build-coupled constant desyncs here.
      assertItemAgainstFixture(slug, fixture, context, compiled);
    });
  }
}

// ===========================================================================
// Round-trip cross-check — buildPartyContext must reproduce her engine's derived
// party_* keys for every fold that carries a non-empty `derived` block (yelan_a1).
// Verbatim structure from partyBurndown.test.ts. GREEN now (the publisher is wired).
// ===========================================================================

describe("fold: buildPartyContext reproduces her derived keys (round-trip)", () => {
  for (const family of FOLD_FAMILIES) {
    if (!existsSync(join(FIXTURES_ROOT, family, "_manifest.json"))) continue;
    const manifest = loadManifest(family);
    for (const item of manifest.items) {
      const derivedKeys = Object.keys(item.derived);
      if (derivedKeys.length === 0) continue; // no party_* surfaced (the non-party folds)

      it(`${item.slug}: party_* keys match the oracle manifest`, () => {
        const party = partyInputFromManifest(item.party);
        const ctx = buildPartyContext(party, {
          element: item.element as Element,
          origin: item.origin,
        });
        for (const key of derivedKeys) {
          expect(
            ctx[key],
            `${item.slug}/${key}: ours=${String(ctx[key])}, oracle=${item.derived[key]}`
          ).toBe(item.derived[key]);
        }
      });
    }
  }
});

// ===========================================================================
// Burndown summary — report once (the burndown is legible).
// ===========================================================================

describe("fold: burndown summary", () => {
  it("reports the build-coupled-fold fixture count (the ④ remaining-work signal)", () => {
    let fixtureFiles = 0;
    for (const family of FOLD_FAMILIES) {
      const dir = join(FIXTURES_ROOT, family);
      if (!existsSync(dir)) continue;
      fixtureFiles += readdirSync(dir).filter(
        (f) => f.endsWith(".json") && f !== "_manifest.json"
      ).length;
    }

    console.info(
      `[fold] ${foldEffects.size} build-coupled-fold fixtures (${fixtureFiles} JSON files); ` +
      `each is RED until our engine reproduces her oracle OFF the frozen build's stat point ` +
      `(tol ${TOLERANCE}). Phase 3 ④ Tasks 2-5 retire each fold; merge gate = 0 RED.`
    );
    expect(foldEffects.size).toBeGreaterThan(0);
    expect(foldEffects.size).toBe(fixtureFiles);
  });
});
