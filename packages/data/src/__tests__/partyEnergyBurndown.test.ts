/**
 * P3.5 party-energy — combined-party-energy burst-weapon burndown (RED by design, pending Task B).
 *
 * The `party-energy` oracle config (build-configs.mjs §partyEnergyItems) equips one of the three
 * byte-identical combined-party-energy burst weapons — Akuoumaru / Mouun's Moon / Wavebreaker's Fin —
 * on a rep, with a 3-teammate party, and dumps her engine's resulting triples to
 * tests/golden/fixtures/party-energy/. Her PostEffectPartyEnergy sums BOTH energy terms:
 *
 *   dmg_burst += min( coeff[R] × (burst_energy_cost + party_burst_energy_cost), cap[R] )
 *
 * with coeff = [0.12,0.15,0.18,0.21,0.24] and cap = [40,50,60,70,80] over weapon_refine (R1→R5)
 * (raw/.../db/Weapon/{Claymore/Akoumaru,Bow/MouunsMoon,Polearm/WavebreakersFin}.js:9-11). Energy is a
 * RAW INTEGER on both terms (only dmg_burst, a percent key, folds /100 → 0.12 ⇒ +12%);
 * party_burst_energy_cost = the SUM of each teammate's burst energy cost (Char.js:74-89, wielder
 * excluded). Breakpoint cap/coeff = 333.33 uniformly, so base = wielder + party_sum < 333.34 is LINEAR
 * (bonus = base×coeff) and base ≥ 334 is CAP-BINDING (bonus pinned at cap).
 *
 * Our TS engine models ONLY the wielder's own term: the ported weapon post-effect reads
 * `fromStat: "burst_energy_cost"` (the wielder base-stat in the bag), and buildPartyContext.ts emits
 * NO `party_burst_energy_cost`. So in a team every burst-damage feature undershoots the oracle by the
 * party-summed portion of the dmg_burst bonus. THAT RED IS THE DELIVERABLE — it gates Task B, which
 * sums the party term (then this suite goes GREEN with NO edits here).
 *
 * This suite reconstructs the SAME party her oracle used — `{character: <slug>}` members + a slug→
 * DbObjectChar resolver (as partyBuffsBurndown.test.ts) — AND equips that weapon's stat table +
 * post-effect with `weapon_refine` injected (as partyBurndown.test.ts's inert-weapon family) — then
 * asserts each burst-DAMAGE feature's [non-crit, crit, avg] triple against the fixture. Only
 * burst-damage features are asserted: those are the ones the dmg_burst bonus moves (a non-burst
 * feature would be invariant → a vacuously-green gate). Verified ≥1 fixture LINEAR and ≥1 CAP-BINDING.
 *
 * GUARD — HONESTY RULES (verbatim from armory.test.ts / partyBurndown.test.ts): NO it.skip,
 * NO it.todo, NO it.fails, NO loosened tolerance, NO hard-coded overrides. The RED is by design
 * pending Task B; TEST-ONLY (no production code touched).
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";
import { describe, it, expect } from "vitest";
import { buildStats } from "../buildStats.js";
import { compileCharacter } from "../loader.js";
import type { PartyInput } from "../partyContext.js";
import type { DbObjectChar, DbObjectWeapon } from "@genshin/types";
import { type FixtureEntry, isDamageTripleEntry } from "./_fixtureEntry.js";

// ---------------------------------------------------------------------------
// Constants — mirror partyBurndown.test.ts (sampleStats build).
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Manifest + fixture types — the party-energy item shape (engine.resolveParty).
// ---------------------------------------------------------------------------

interface ManifestMember {
  readonly character?: string;
  readonly element?: string;
  readonly origin?: string;
}

interface ManifestParty {
  readonly members: readonly ManifestMember[];
  /** The weapon to equip on the rep (registry key) + its type + refine (R1..R5). */
  readonly weaponName: string;
  readonly weaponType: string;
  readonly refine: number;
}

interface ManifestItem {
  readonly slug: string;
  /** The charKey (e.g. "Eula"). */
  readonly repKey: string;
  /** The TS slug (e.g. "eula") — used to resolve the recipient DbObjectChar. */
  readonly repSlug: string;
  readonly party: ManifestParty;
}

interface Manifest {
  readonly items: readonly ManifestItem[];
}

interface Fixture {
  readonly slug: string;
  readonly features: Record<string, FixtureEntry>;
}

const DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../tests/golden/fixtures/party-energy"
);

// ---------------------------------------------------------------------------
// Auto-discover characters + weapons — same globs as partyBurndown.test.ts.
// ---------------------------------------------------------------------------

function isDbObjectChar(v: unknown): v is DbObjectChar {
  return (
    typeof v === "object" &&
    v !== null &&
    "weapon" in v &&
    "element" in v &&
    "features" in v
  );
}

function isDbObjectWeapon(v: unknown): v is DbObjectWeapon {
  return (
    typeof v === "object" &&
    v !== null &&
    "name" in v &&
    "weapon" in v &&
    "statTable" in v &&
    !("element" in v)
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

// The manifest `party.weaponName` is the ENGINE registry key (Akoumaru/MouunsMoon/WavebreakersFin);
// the ported DbObjectWeapon `name` is the canonical slug. These are the only three party-energy
// weapons, so a fixed map is exact (and lowercasing is unsafe: Akoumaru ≠ akuoumaru).
const WEAPON_SLUG_BY_REGISTRY_KEY: Readonly<Record<string, string>> = {
  Akoumaru: "akuoumaru",
  MouunsMoon: "mouuns_moon",
  WavebreakersFin: "wavebreakers_fin",
};

/** Resolve a teammate slug → DbObjectChar (the engine reads its burst cost / partyData). */
const resolveChar = (slug: string): DbObjectChar => {
  const c = charBySlug[slug];
  if (!c) throw new Error(`party-energy: no characters/*.ts for teammate slug '${slug}'`);
  return c;
};

const manifest: Manifest = existsSync(join(DIR, "_manifest.json"))
  ? (JSON.parse(readFileSync(join(DIR, "_manifest.json"), "utf-8")) as Manifest)
  : { items: [] };

// ---------------------------------------------------------------------------
// Family-exists guard.
// ---------------------------------------------------------------------------

describe("party-energy-burndown", () => {
  it("the party-energy fixture family exists", () => {
    expect(manifest.items.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Per-item burndown — one describe per fixture slug.
// ---------------------------------------------------------------------------

for (const item of manifest.items) {
  describe(`party-energy-burndown: ${item.slug}`, () => {
    const recipient = charBySlug[item.repSlug];
    const fixture: Fixture | undefined = existsSync(join(DIR, `${item.slug}.json`))
      ? (JSON.parse(readFileSync(join(DIR, `${item.slug}.json`), "utf-8")) as Fixture)
      : undefined;

    // The weapon to equip: the manifest party.weaponName is the engine registry key → TS slug.
    const weaponSlug = WEAPON_SLUG_BY_REGISTRY_KEY[item.party.weaponName];
    const weapon = weaponSlug ? weaponByName[weaponSlug] : undefined;

    if (!recipient || !fixture || !weapon) {
      it(`${item.slug}: recipient + fixture + weapon present`, () =>
        expect.fail(
          `missing recipient '${item.repSlug}', fixture '${item.slug}.json', or weapon '${item.party.weaponName}'`
        ));
      return;
    }

    // Reconstruct the PartyInput. The party-energy config emits every teammate as a
    // {character: <slug>} member (verified in the manifest) so the resolver can read each
    // teammate's burst cost; a missing `character` is a malformed fixture (fail loud).
    const members = item.party.members.map((m) => {
      if (m.character === undefined) {
        throw new Error(`party-energy: ${item.slug} member missing 'character' slug`);
      }
      return { character: m.character };
    });
    const party: PartyInput = { members };

    // Inject weapon_refine so the refine-scaled cap + ratio resolve (mirrors partyBurndown's
    // inert-weapon family: without it the post-effect's refine table reads undefined).
    const settings = { weapon_refine: item.party.refine } as const;

    const { context, settings: merged, characterMultipliers } = buildStats({
      char: recipient,
      weaponStatTable: weapon.statTable,
      statBlock: STAT_BLOCK,
      levels: LEVELS,
      enemy: ENEMY,
      settings,
      party,
      partySlugResolver: resolveChar,
      // The weapon's own post-effect (energy → dmg_burst). Conditions/features are empty for
      // these three weapons, but pass them through for parity with partyBurndown.
      extraConditions: weapon.conditions ?? [],
      weaponPostEffects: weapon.postEffects ?? [],
      talentLevels: TALENTS,
    });

    const compiled = compileCharacter(recipient, {
      charElement: recipient.element,
      talentLevels: TALENTS,
      settings: merged,
      charLevel: LEVELS.charLevel,
      extraFeatures: weapon.features ?? [],
      extraMultipliers: [
        ...(weapon.multipliers ?? []),
        ...characterMultipliers,
      ],
    });

    // Assert ONLY burst-DAMAGE features — the outputs the dmg_burst party-energy bonus moves.
    // (A non-burst feature is invariant to the party-energy term → asserting it would be a
    // vacuously-green gate. isDamageTripleEntry also excludes the weapon.burst_dmg_bonus readout.)
    const burstDamageKeys = Object.entries(fixture.features)
      .filter(([k, e]) => k.startsWith("burst.") && isDamageTripleEntry(e))
      .map(([k]) => k);

    for (const key of burstDamageKeys.filter((k) => k in compiled)) {
      const oracle = fixture.features[key]!;

      it(`${item.slug}/${key} normal within ${TOLERANCE}`, () => {
        const result = compiled[key]!(context);
        expect(
          Math.abs(result.normal - oracle.normal),
          `${item.slug}/${key} normal: ours=${result.normal.toFixed(2)}, oracle=${oracle.normal.toFixed(2)}`
        ).toBeLessThanOrEqual(TOLERANCE);
      });

      it(`${item.slug}/${key} crit within ${TOLERANCE}`, () => {
        const result = compiled[key]!(context);
        expect(
          Math.abs(result.crit - oracle.crit),
          `${item.slug}/${key} crit: ours=${result.crit.toFixed(2)}, oracle=${oracle.crit.toFixed(2)}`
        ).toBeLessThanOrEqual(TOLERANCE);
      });

      it(`${item.slug}/${key} avg within ${TOLERANCE}`, () => {
        const result = compiled[key]!(context);
        expect(
          Math.abs(result.avg - oracle.average),
          `${item.slug}/${key} avg: ours=${result.avg.toFixed(2)}, oracle=${oracle.average.toFixed(2)}`
        ).toBeLessThanOrEqual(TOLERANCE);
      });
    }
  });
}
