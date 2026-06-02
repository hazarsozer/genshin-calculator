/**
 * Phase 3 ② / B1 — Party-composition burndown harness (the party-effect consumer gate).
 *
 * Consumes the `party` oracle fixture family produced by the party config in
 * tools/oracle/build-configs.mjs (dumped via `node tools/oracle/dump-oracle.mjs --config=party`):
 *
 *   resonance-<element> / resonance-none — each elemental resonance (+ no-duo) on a rep whose
 *       scaling exercises it (party_size 4, 2-3x the element via buff-clean fillers).
 *   gate-{chevreuse,nilou,skirk}          — the three two-element gates (char-toggle + 1 teammate).
 *   gilded-dreams-{same,different}-{1..3} — GildedDreams 4pc party-element scaling (ATK / EM paths).
 *   blizzard-strayer-{cryo,frozen}        — BlizzardStrayer 4pc enemy-status crit tiers.
 *   viridescent-venerer-<element>         — ViridescentVenerer 4pc per-swirl-element res shred.
 *   set-other-<name>                      — every v5.8 set_other team buff on a binding rep.
 *   bond-of-life-<char>                   — common.bond_of_life consumers (Arlecchino / Clorinde).
 *   nahida-pyro-2                         — Nahida's character-coupled party-pyro publisher (A4).
 *   origin-{same,different}               — CalcOrigin counts (Charlotte, the only v5.8 consumer).
 *   weapon-<name>                         — the four inert party-element weapons under a party.
 *
 * For each manifest item the harness reconstructs the SAME party input her oracle used —
 * `buildStats({ char: rep, party: <manifest.party>, settings, setBonuses, … })` → `compileCharacter`
 * — and PROVES it matches the oracle (every produced damage feature's triple within abs 0.1, +
 * the mis-key guard + the full-coverage gate), OR fails with a precise "not yet matching — burndown"
 * test (the ② gate).
 *
 * THE SUITE IS INTENTIONALLY RED OVERALL. The party INPUT layer is wired (Phase A: buildPartyContext
 * → buildStats), but most CONSUMERS are not yet ported (GildedDreams 4pc / BlizzardStrayer 4pc /
 * ViridescentVenerer 4pc are deferred; resonance + two-element gates + set_other + bond-of-life
 * need their condition variants — Tasks C/D). Every unmatched effect emits a failing burndown test.
 * That RED is the remaining-work signal — Phase 3 ② flips each green effect-by-effect, exactly as
 * armory.test.ts drives ③. The branch is not merged until the party burndown reaches zero.
 *
 * NO-DELTA EFFECTS (correct, immutable — like the constellations/aloy precedent): some effects carry
 * no offensive stat on the canonical build and so her oracle fixture EQUALS the rep's no-party output.
 * These still appear as fixtures and are validated the SAME way (the rep must reproduce her exact
 * output, which for a no-delta effect means matching the no-party numbers — proving the input layer
 * adds nothing WRONG). Documented no-delta cases: resonance-electro (energy), resonance-anemo
 * (stamina/speed), resonance-none (defensive RES), gate-skirk (a talent-level bump that does not
 * surface at talent 10). These GO GREEN as soon as the rep + input layer reproduce the numbers
 * (no consumer wiring needed) — the expected first wins.
 *
 * RED-NOT-ERROR (verbatim from armory.test.ts): an unmatched effect resolves to a FAILING `it`,
 * never a thrown error at glob/load time. A throw would abort the whole suite and make burndown
 * impossible. A missing rep character (impossible — all 107 are ported) IS a hard error.
 *
 * HONESTY RULES (verbatim from goldenConfig.test.ts / armory.test.ts):
 *   - NO it.skip, NO it.todo, NO loosened tolerance, NO hard-coded overrides.
 *   - A RED effect means the engine doesn't yet reproduce the oracle under that party — a real
 *     signal worth investigating, not something to hide.
 *   - TEST-ONLY: no production code is touched.
 *
 * Manifest item shape (per item in `manifest.items`, from engine.resolveParty):
 *   { slug, kind: "party", repKey, repSlug, element, origin,
 *     weapon: { name, type },
 *     party: { members?: [{element,origin}], charSettings?, settings?, setBonuses?, enemyStatus?,
 *              setOther?, bondOfLife?, weaponName?, weaponType? },
 *     derived: { party_elements_* / party_origin_* / party_size },   // her engine's cross-check
 *     resonanceElements: { resonance_element_<i> }, statBlock, enemy, featureCount }
 *
 * Sources:
 *   tests/golden/fixtures/party/_manifest.json + tests/golden/fixtures/party/<slug>.json
 *   packages/data/src/__tests__/armory.test.ts          — burndown template (mirrored)
 *   packages/data/src/partyContext.ts                   — the PartyInput shape reconstructed here
 */

import { readFileSync, readdirSync } from "node:fs";
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
// Constants — mirror goldenConfig.test.ts / armory.test.ts
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

const PARTY_FAMILY = "party";

function loadFixture(slug: string): Fixture {
  return JSON.parse(
    readFileSync(join(FIXTURES_ROOT, PARTY_FAMILY, `${slug}.json`), "utf-8")
  ) as Fixture;
}

// ---------------------------------------------------------------------------
// Manifest types — the party item shape (engine.resolveParty)
// ---------------------------------------------------------------------------

/** A teammate as element+origin — directly usable as a PartyInput member (no resolver). */
interface ManifestMember {
  readonly element: string;
  readonly origin?: string;
}

/** The reconstructable PartyInput + the extra build inputs a party config can carry. */
interface ManifestParty {
  readonly members?: readonly ManifestMember[];
  /** Active char's own conditional toggles (Chevreuse chevreuse_tactics, GildedDreams set.*, …). */
  readonly charSettings?: EvalContext;
  /** Extra raw settings the effect needs (enemy_frozen, set.viridescent_venerer_4, set_other.*). */
  readonly settings?: EvalContext;
  /** Equipped artifact set(s) for set-bonus effects (GildedDreams/Blizzard/Viridescent 4pc). */
  readonly setBonuses?: readonly { readonly setKey: string; readonly pieces: number }[];
  /** Single enemy affliction status (BlizzardStrayer). */
  readonly enemyStatus?: string;
  /** set_other team-buff tokens, e.g. ["noblesse_oblige_4"] or ["archaic_petra_4=geo"]. */
  readonly setOther?: readonly string[];
  /** Bond-of-life fraction (Arlecchino / Clorinde). */
  readonly bondOfLife?: number;
  /** Inert party-element weapon (the 4-weapon family): the weapon to equip on the rep. */
  readonly weaponName?: string;
  readonly weaponType?: string;
}

interface ManifestItem {
  readonly slug: string;
  readonly kind: "party";
  readonly repKey: string;
  readonly repSlug: string;
  readonly element: string;
  readonly origin?: string;
  readonly weapon: { readonly name: string; readonly type: string };
  readonly party: ManifestParty;
  /** Her engine's derived party_* keys (the cross-check buildPartyContext must match). */
  readonly derived: Readonly<Record<string, number>>;
  readonly resonanceElements: Readonly<Record<string, string>>;
  readonly statBlock: string;
  readonly featureCount: number;
}

interface Manifest {
  readonly config: { readonly id: string };
  readonly base: { readonly statBlock: Readonly<Record<string, number>> };
  readonly items: readonly ManifestItem[];
}

function loadManifest(): Manifest {
  return JSON.parse(
    readFileSync(join(FIXTURES_ROOT, PARTY_FAMILY, "_manifest.json"), "utf-8")
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
// Auto-discover characters / weapons / sets — same globs as armory.test.ts
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

/** "weapon_name.the_bell" → "the_bell" (the DbObjectWeapon `name`). */
function weaponNameFromManifest(manifestName: string): string {
  return manifestName.startsWith("weapon_name.")
    ? manifestName.slice("weapon_name.".length)
    : manifestName;
}

// ---------------------------------------------------------------------------
// statBlock resolver — every party fixture uses "sampleStats".
// ---------------------------------------------------------------------------

function resolveStatBlock(
  manifest: Manifest,
  key: string
): Readonly<Record<string, number>> {
  if (key === "sampleStats") return manifest.base.statBlock;
  throw new Error(
    `party harness: unknown statBlock key "${key}" — only "sampleStats" is used by the party family`
  );
}

// ---------------------------------------------------------------------------
// PartyInput reconstruction — the manifest `party.members` are {element,origin}
// records, directly a PartyInput (no catalog resolver needed).
// ---------------------------------------------------------------------------

function partyInputFromManifest(party: ManifestParty): PartyInput {
  const members: PartyMember[] = (party.members ?? []).map((m) =>
    m.origin !== undefined
      ? { element: m.element as Element, origin: m.origin }
      : { element: m.element as Element }
  );
  // set_other tokens: "name" → toggle true; "name=value" → a dropdown value carried via
  // party.settings instead (see settingsFromManifest), so only plain tokens go to the input.
  const plainSetOther = (party.setOther ?? []).filter((t) => !t.includes("="));
  return {
    members,
    ...(party.enemyStatus !== undefined ? { enemyStatus: party.enemyStatus } : {}),
    ...(party.bondOfLife !== undefined ? { bondOfLife: party.bondOfLife } : {}),
    ...(plainSetOther.length ? { setOther: plainSetOther } : {}),
  };
}

/** The non-party raw settings the effect needs (charSettings + extra settings + dropdown set_other). */
function settingsFromManifest(party: ManifestParty): EvalContext {
  const out: Record<string, unknown> = { char_constellation: 0 };
  if (party.charSettings) Object.assign(out, party.charSettings);
  if (party.settings) Object.assign(out, party.settings);
  // Dropdown-valued set_other (e.g. "archaic_petra_4=geo") → set_other.<name> = <value>.
  for (const token of party.setOther ?? []) {
    const eq = token.indexOf("=");
    if (eq > 0) out[`set_other.${token.slice(0, eq)}`] = token.slice(eq + 1);
  }
  return out as EvalContext;
}

// ---------------------------------------------------------------------------
// Shared assertion block — register the per-feature triple + mis-key + coverage
// tests for a built+compiled item against its fixture. Verbatim structure from
// goldenConfig.test.ts / armory.test.ts.
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
// Burndown bookkeeping — counts reported once at the end (legible burndown).
// ---------------------------------------------------------------------------

const partyEffects = new Set<string>();

// ===========================================================================
// PARTY PATH — one describe per effect; build the rep WITH the party + compile,
// then assert against the oracle fixture (mis-match == the ② burndown signal).
// ===========================================================================

const manifest = loadManifest();

for (const item of manifest.items) {
  const { slug } = item;
  partyEffects.add(slug);

  // The rep MUST be a ported character (all 107 reps exist) — a missing rep is a
  // manifest/data error, not a burndown item, so throw loudly (mirrors armory.test.ts).
  const rep = charBySlug[item.repSlug];
  if (!rep) {
    throw new Error(
      `party harness: effect "${slug}" rep slug "${item.repSlug}" not in auto-discovered chars`
    );
  }

  // Resolve the rep's equipped weapon stat table. For most effects this is the rep's
  // DEFAULT weapon (passive OFF); for the inert-weapon family it is that specific weapon
  // (passive ON via its conditions). All party-rep weapons are ported (armory orphan-guard).
  const weaponKey = weaponNameFromManifest(item.weapon.name);
  const weapon = weaponByName[weaponKey];
  if (!weapon) {
    throw new Error(
      `party harness: effect "${slug}" rep weapon "${weaponKey}" not in ported weapons`
    );
  }

  const party = partyInputFromManifest(item.party);
  const settings = settingsFromManifest(item.party);
  const setBonuses = item.party.setBonuses ?? [];
  // Inert-weapon family: equip that weapon's passive (its own conditions, ON to max via the
  // oracle); other effects keep the default weapon passive OFF (no extra conditions).
  const isWeaponEffect = item.party.weaponName !== undefined;

  describe(`party: ${slug} (${item.repSlug})`, () => {
    const fixture = loadFixture(slug);
    const statBlock = resolveStatBlock(manifest, item.statBlock);

    const { context, settings: propagated } = buildStats({
      char: rep,
      weaponStatTable: weapon.statTable,
      statBlock,
      levels: LEVELS,
      enemy: ENEMY,
      settings,
      party,
      // Weapon passive channel (inert-weapon family only): the weapon's conditions read the
      // now-populated party_elements_* keys. Other effects pass no extra weapon conditions.
      extraConditions: isWeaponEffect ? weapon.conditions ?? [] : [],
      weaponPostEffects: isWeaponEffect ? weapon.postEffects ?? [] : [],
      setBonuses,
      setRegistry: setByGoodId,
      talentLevels: TALENTS,
    });

    const compiled = compileCharacter(rep, {
      charElement: rep.element,
      talentLevels: TALENTS,
      settings: propagated,
      charLevel: LEVELS.charLevel,
      extraFeatures: isWeaponEffect ? weapon.features ?? [] : [],
      extraMultipliers: isWeaponEffect ? weapon.multipliers ?? [] : [],
    });

    assertItemAgainstFixture(slug, fixture, context, compiled);
  });
}

// ===========================================================================
// Round-trip cross-check — buildPartyContext must reproduce her engine's derived
// party_* keys for every effect that carries a non-empty `derived` block. This is
// the B1 "verify the round-trip" guard at the KEY level: the fixture is generated
// from HER party_* keys; this proves OUR publisher emits the SAME keys (the damage
// match above proves the consumer; this proves the publisher independently).
// ===========================================================================

describe("party: buildPartyContext reproduces her derived keys (round-trip)", () => {
  for (const item of manifest.items) {
    const derivedKeys = Object.keys(item.derived);
    if (derivedKeys.length === 0) continue; // no party_* surfaced (e.g. pure passthrough effects)

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
});

// ===========================================================================
// Burndown summary — report once (the burndown is legible).
// ===========================================================================

describe("party: burndown summary", () => {
  it("reports the party-effect fixture count (the ② remaining-work signal)", () => {
    const fixtureFiles = readdirSync(join(FIXTURES_ROOT, PARTY_FAMILY)).filter(
      (f) => f.endsWith(".json") && f !== "_manifest.json"
    ).length;

    console.info(
      `[party] ${partyEffects.size} party-effect fixtures (${fixtureFiles} JSON files); ` +
      `each is RED until our engine reproduces her oracle under that party (tol ${TOLERANCE}). ` +
      `Phase 3 ② Tasks C/D flip them green; merge gate = 0 RED.`
    );
    expect(partyEffects.size).toBeGreaterThan(0);
    expect(partyEffects.size).toBe(fixtureFiles);
  });
});
