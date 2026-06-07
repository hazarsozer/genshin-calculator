/**
 * P3.5 bol-weapons — Bond-of-Life weapon burndown (RED by design, pending Task B).
 *
 * The `bol-weapon` oracle config (build-configs.mjs §bolWeaponItems) equips one of the two
 * BoL-scaling weapons — Flowing Purity (catalyst) / Finale of the Deep (sword) — on a rep, binds its
 * `weapon_*_bol` setting, and dumps her engine's resulting triples to
 * tests/golden/fixtures/bol-weapon/. Each weapon carries a `PostEffectStatsBondOfLife`
 * (raw/.../classes/PostEffect/Stats/BondOfLife.js — a `PostEffectStatsHP` whose hp_total base is
 * multiplied by `getBolValue = settings[bolSettingName] / 100`, then capped):
 *
 *   toStat += min( ratio[R] × hp_total × (settings[weapon_*_bol] / 100),  cap[R] )
 *
 *   - Flowing Purity (raw/.../db/Weapon/Catalyst/FlowingPurity.js:11-31): `toStat` = the wielder's 7
 *     elemental DMG bonuses (dmg_anemo…dmg_dendro), ratio [.002,.0025,.003,.0035,.004], cap
 *     [12,15,18,21,24]; BoL setting `weapon_flowing_purity_bol`. `dmg_<el>` IS a percent key, so
 *     PostEffect/Stats.js:60-65 folds BOTH the value and the cap /100 → the emitted dmg_<el> bag
 *     contribution = min(…,cap)/100 (human-% = min(ratio×hp×BoL/100, cap)). Only the WIELDER's own
 *     element binds on direct hits (Klee = pyro → only dmg_pyro lifts her hits; the other 6 are inert).
 *   - Finale of the Deep (raw/.../db/Weapon/Sword/FinaleOfTheDeep.js:11-19): `toStat` = `atk`, ratio
 *     [.024,.03,.036,.042,.048], cap [150,187.5,225,262.5,300]; BoL setting
 *     `weapon_finale_of_the_deep_bol`. `atk` is NOT a percent key → no fold; bonus = flat ATK
 *     (= min(ratio×hp×BoL/100, cap)) → lifts ALL the wielder's ATK-scaling damage.
 *
 * Our TS port models ONLY the flat refine buff: packages/data/src/weapons/{flowing-purity,
 * finale-of-the-deep}.ts carry the `ConditionBooleanRefine` (7×dmg_<el> +8…16% / atk_percent +12…24%)
 * and NO `postEffects`. So the BoL term is fully DEFERRED, and every wielder-element (Flowing Purity)
 * / ATK-scaling (Finale) damage feature undershoots the oracle by the BoL bonus. THAT RED IS THE
 * DELIVERABLE — it gates Task B, which wires the BoL post-effect (then this suite goes GREEN with NO
 * edits here).
 *
 * ISOLATION (honesty): the settings injected per fixture are EXACTLY what the oracle item set —
 * `weapon_refine`, the flat-refine checkbox `weapon_<name>_1: true` (so our refine buff is ON, as in
 * the oracle's weaponPassiveOn), and the inert `weapon_<name>_bol` (a no-op on our side until Task B).
 * The refine buff being ON on BOTH sides means the ONLY thing missing on ours is the BoL post-effect,
 * so the RED delta equals exactly that term (verified: it matches her weapon.* BoL readout). The fixture
 * set exercises both cap arms — Flowing-Purity-R1 (BoL 10 → 4.70%, LINEAR) & Finale-R1 (BoL 10 → 63.19
 * ATK, LINEAR); Flowing-Purity-R5 (BoL 50 → 24%, CAPPED) & Finale-R5 (BoL 30 → 300 ATK, CAPPED).
 *
 * Every damage triple in each fixture moves with the BoL term (Klee's plunges are pyro-infused, and
 * Finale's flat ATK lifts all of Keqing's ATK-scaling hits — empirically confirmed), so asserting all
 * damage triples is honest (no invariant feature → no vacuously-green gate).
 *
 * GUARD — HONESTY RULES (verbatim from armory.test.ts / partyEnergyBurndown.test.ts): NO it.skip,
 * NO it.todo, NO it.fails, NO loosened tolerance, NO hard-coded overrides. The RED is by design
 * pending Task B; TEST-ONLY (no production code touched).
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";
import { describe, it, expect } from "vitest";
import { buildStats } from "../buildStats.js";
import { compileCharacter } from "../loader.js";
import type { DbObjectChar, DbObjectWeapon } from "@genshin/types";
import { type FixtureEntry, isDamageTripleEntry } from "./_fixtureEntry.js";

// ---------------------------------------------------------------------------
// Constants — mirror partyEnergyBurndown.test.ts (sampleStats build).
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
// Manifest + fixture types — the bol-weapon item shape (engine.resolveParty).
// ---------------------------------------------------------------------------

interface ManifestParty {
  /** The weapon to equip on the rep (engine registry key) + its type + refine (R1..R5). */
  readonly weaponName: string;
  readonly weaponType: string;
  readonly refine: number;
  /** EXACTLY the settings the oracle bound: weapon_refine, weapon_<name>_1, weapon_<name>_bol. */
  readonly settings: Readonly<Record<string, unknown>>;
}

interface ManifestItem {
  readonly slug: string;
  /** The charKey (e.g. "Klee"). */
  readonly repKey: string;
  /** The TS slug (e.g. "klee") — used to resolve the recipient DbObjectChar. */
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
  "../../../../tests/golden/fixtures/bol-weapon"
);

// ---------------------------------------------------------------------------
// Auto-discover characters + weapons — same globs as partyEnergyBurndown.test.ts.
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

// The manifest `party.weaponName` is the ENGINE registry key (FlowingPurity / FinaleOfTheDeep); the
// ported DbObjectWeapon `name` is the canonical slug. There are only two bol-weapons, so a fixed map
// is exact (and avoids guessing a snake_case transform).
const WEAPON_SLUG_BY_REGISTRY_KEY: Readonly<Record<string, string>> = {
  FlowingPurity: "flowing_purity",
  FinaleOfTheDeep: "finale_of_the_deep",
};

const manifest: Manifest = existsSync(join(DIR, "_manifest.json"))
  ? (JSON.parse(readFileSync(join(DIR, "_manifest.json"), "utf-8")) as Manifest)
  : { items: [] };

// ---------------------------------------------------------------------------
// Family-exists guard.
// ---------------------------------------------------------------------------

describe("bol-weapon-burndown", () => {
  it("the bol-weapon fixture family exists", () => {
    expect(manifest.items.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Per-item burndown — one describe per fixture slug.
// ---------------------------------------------------------------------------

for (const item of manifest.items) {
  describe(`bol-weapon-burndown: ${item.slug}`, () => {
    const recipient = charBySlug[item.repSlug];
    const fixture: Fixture | undefined = existsSync(join(DIR, `${item.slug}.json`))
      ? (JSON.parse(readFileSync(join(DIR, `${item.slug}.json`), "utf-8")) as Fixture)
      : undefined;

    // The weapon to equip: manifest party.weaponName (registry key) → TS slug → DbObjectWeapon.
    const weaponSlug = WEAPON_SLUG_BY_REGISTRY_KEY[item.party.weaponName];
    const weapon = weaponSlug ? weaponByName[weaponSlug] : undefined;

    if (!recipient || !fixture || !weapon) {
      it(`${item.slug}: recipient + fixture + weapon present`, () =>
        expect.fail(
          `missing recipient '${item.repSlug}', fixture '${item.slug}.json', or weapon '${item.party.weaponName}'`
        ));
      return;
    }

    // Thread the EXACT settings the oracle bound: weapon_refine (so the refine-scaled tables resolve)
    // + the flat-refine checkbox weapon_<name>_1: true (turns OUR ConditionBooleanRefine ON, matching
    // the oracle's weaponPassiveOn) + the inert weapon_<name>_bol (a no-op on our side until Task B).
    const settings = item.party.settings;

    const { context, settings: merged, characterMultipliers } = buildStats({
      char: recipient,
      weaponStatTable: weapon.statTable,
      statBlock: STAT_BLOCK,
      levels: LEVELS,
      enemy: ENEMY,
      settings,
      // The weapon's own conditions (the flat refine buff). postEffects is empty for these two
      // weapons today (the BoL term is DEFERRED) — pass it through for parity with partyEnergyBurndown.
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

    // Assert the DIRECT-HIT damage triples the BoL bonus moves. The bonus is dmg_<wielder-element>
    // (Flowing Purity) / flat ATK (Finale); both lift every one of the rep's direct-hit damage features
    // (Klee's plunges are pyro-infused; Finale's ATK lifts all ATK-scaling hits), so every asserted triple
    // shifts (no vacuously-green gate). TRANSFORMATIVE reactions (reaction.*) scale off EM + char level
    // only, invariant to BOTH a dmg_<el> bonus AND flat ATK, so they DON'T move with the BoL term and are
    // excluded. isDamageTripleEntry also excludes the non-damage stats + the weapon.* readout.
    const damageKeys = Object.entries(fixture.features)
      .filter(([, e]) => isDamageTripleEntry(e) && e.damageType !== "reaction")
      .map(([k]) => k);

    for (const key of damageKeys.filter((k) => k in compiled)) {
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
