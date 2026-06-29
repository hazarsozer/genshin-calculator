/**
 * P3.5 bol-multiplier — BoL-as-MULTIPLIER burndown (RED by design, pending Task B).
 *
 * The `bol-multiplier` oracle config (build-configs.mjs §bolMultiplierItems) drives two per-entity
 * gaps where the `bond_of_life` BAG STAT is a damage/heal MULTIPLIER FACTOR — folded into a
 * `FeatureMultiplierBondOfLife` (raw/.../classes/Feature2/Multiplier/BondOfLife.js:9-11:
 * `getTreeBonusMultiplier → makeStatItem('bond_of_life', data.stats)`, a treeBonus factor on the
 * feature's base-damage term). This is DISTINCT from:
 *   - bol-weapons, which read a per-WEAPON UI setting `weapon_*_bol` (NOT the bag stat), and
 *   - bol-stat clorinde-c4, where BoL drives a `dmg_*` POST-EFFECT.
 * Each rep is driven with the exact BoL setting (+ Arlecchino's pyro-infusion setting) the oracle
 * item set; this burndown threads those same settings into both buildStats and compileCharacter and
 * asserts the lifted outputs.
 *
 * THE SCALE (shared with bol-stat): `bond_of_life` enters the bag via ConditionBoLStat
 * (db/Buffs/Static.js:28: `stats.bond_of_life = settings['common.bond_of_life']`) AND ALSO matches
 * isPercent → the stat-merge folds it /100, so the BAG value = common.bond_of_life/100 (VERIFIED in
 * bol-stat: setting 50 → bag 0.5). So at common.bond_of_life:50 the multiplier factor is ×0.5 (NOT
 * ×50). The oracle dump already reflects this fold; we just drive the SETTING.
 *
 *   - arlecchino-masque (Arlecchino): a char-level `FeatureMultiplierBondOfLife` (leveling
 *     char_skill_attack, values attack.arlecchino_masque s1.p12 → 238% @talent10), gated
 *     `ConditionBooleanValue{common.bond_of_life ge BondOfLifeThreshold=30}`, target
 *     `damageTypes:['normal']` (Arlecchino.js:357-372). So each NORMAL hit gets an ADDITIVE
 *     base-damage term `+ masque% × atk_total × bond_of_life` = +2.38 × atk × 0.5 (C0; the
 *     `bonusValues:[0, C1BonusScale=100]` C1 lever is OFF at C0). At BoL≥30 her normals ALSO infuse
 *     PYRO via a ConditionStatic{attack_infusion:'pyro'} subgated on BoL≥30 (Arlecchino.js:377-390);
 *     the fixture sets attack_infusion:'pyro' EXPLICITLY (belt-and-suspenders — since R4e the
 *     port's `bolInfusion` boolean-value condition ALSO injects it idempotently at BoL≥30; the
 *     explicit set is retained here for isolation clarity and is now redundant, not load-bearing).
 *     resolveElement reads settings.attack_infusion, and OUR port ALREADY reads it → our normals are
 *     pyro at this fixture too, so the RED delta isolates EXACTLY the missing masque term (NOT an
 *     element mismatch). Our port omits the masque char-level multiplier (characters/arlecchino.ts
 *     L8-19, L209 OMITTED) → every NORMAL undershoots by the masque term. Her non-normal damage
 *     (charged/skill/burst/plunge) does NOT get the masque (target damageTypes:['normal']) → those
 *     already match → asserted as a NO-DELTA GUARD that isolates the RED to the normals.
 *   - clorinde-bol-heal (Clorinde): two `FeatureHeal{subtractBoL:true}` (UNGATED — no night_watch
 *     condition), each a single `FeatureMultiplierBondOfLife{scaling:'hp*', leveling:
 *     'char_skill_elemental', values:skill.clorinde_impale_the_night_{2,3}_heal}` (s2.p6=104%,
 *     s2.p8=110%; Clorinde.js:393-416). subtractBoL (Feature2/Heal.js:88-99) subtracts the absolute
 *     BoL pool: `heal = (talent% × hp_total × bond_of_life) − (bond_of_life × hp_total)`. At
 *     common.bond_of_life:50 → bag 0.5: heal_2 = 1.04×hp×0.5 − 0.5×hp = 0.02×hp; heal_3 =
 *     1.10×hp×0.5 − 0.5×hp = 0.05×hp (both POSITIVE at this BoL). These FeatureHeal features are
 *     entirely ABSENT from our port today (characters/clorinde.ts:161-170 DEFERRED) → RED-BY-ABSENCE.
 *     The assertions below REQUIRE the heal key to be PRESENT in `compiled` AND match — they are NOT
 *     guarded by a `k in compiled` filter (that would VACUOUSLY skip the absent heals). They FAIL.
 *
 * OUTPUTCOVERAGE CLOSURE NOTE (for Task B): the clorinde outputCoverage gate
 * (packages/data/src/__tests__/outputCoverage.test.ts) loads the BASE `clorinde.json` fixture with
 * `settings:{}` → common.bond_of_life = 0 → BAG 0 → both heals = `talent%×hp×0 − 0×hp = 0`. The base
 * clorinde.json carries exactly these two non-damage outputs, both value 0; they are clorinde's
 * outputCoverage RED (unmodelled). So Task B's two heal features, once added, must at BoL=0 evaluate
 * to EXACTLY 0 there — a faithful subtractBoL port yields 0 naturally — which flips clorinde
 * outputCoverage GREEN (the value check at L191-200 runs once the key exists). I.e. the SAME two
 * heal features close BOTH this RED-by-absence gate (at BoL 50, value-correct) and the outputCoverage
 * clorinde RED (at BoL 0, value 0).
 *
 * GUARD — HONESTY RULES (verbatim from armory.test.ts / bolWeaponBurndown.test.ts): NO it.skip,
 * NO it.todo, NO it.fails, NO loosened tolerance, NO hard-coded overrides. The RED is by design
 * pending Task B; TEST-ONLY (no production code touched). This suite goes GREEN under Task B with NO
 * edits here.
 */
import { readFileSync, existsSync } from "node:fs";
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
import {
  type FixtureEntry,
  isDamageTripleEntry,
  isNonDamageOutput,
} from "./_fixtureEntry.js";

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

// Per-rep settings — mirrors the bol-multiplier oracle config (build-configs.mjs §bolMultiplierItems).
// Each value is EXACTLY the input(s) the oracle item set for that rep, injected verbatim into both
// buildStats and compileCharacter:
//   arlecchino-masque    — setBuffsSettings({common.bond_of_life:50, attack_infusion:'pyro'}).
//   arlecchino-masque-c6 — setConstellation(6) + setBuffsSettings({common.bond_of_life:50,
//                          attack_infusion:'pyro'}); char_constellation:6 threads C6 so buildStats
//                          runs Arlecchino's C1/C3/C5 conditions AND compileFeature activates the
//                          burst's C6 FeatureMultiplierBondOfLife (700% × atk_total × bond_of_life,
//                          ConditionConstellation(6)) — the burst_dmg term this rep locks.
//   clorinde-bol-heal    — setBuffsSettings({common.bond_of_life:50}).
const SETTINGS_BY_SLUG: Readonly<Record<string, Readonly<Record<string, unknown>>>> = {
  "arlecchino-masque": { "common.bond_of_life": 50, attack_infusion: "pyro" },
  "arlecchino-masque-c6": { "common.bond_of_life": 50, attack_infusion: "pyro", char_constellation: 6 },
  "clorinde-bol-heal": { "common.bond_of_life": 50 },
};

interface ManifestItem {
  readonly slug: string;
  /** The charKey (e.g. "Arlecchino"). */
  readonly repKey: string;
  /** The TS slug (e.g. "arlecchino") — used to resolve the recipient DbObjectChar. */
  readonly repSlug: string;
}

interface Manifest {
  readonly items: readonly ManifestItem[];
}

interface Fixture {
  readonly slug: string;
  readonly features: Record<string, FixtureEntry>;
}

const BOL_MULT_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../tests/golden/fixtures/bol-multiplier"
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

// slug ("arlecchino") -> DbObjectChar. bol-multiplier is a partyItems config, so a fixture's slug is
// the EFFECT slug (e.g. "arlecchino-masque"); the rep char is resolved from the manifest's repSlug
// (mirroring bolStatBurndown.test.ts / bolWeaponBurndown.test.ts).
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

const manifest: Manifest = existsSync(join(BOL_MULT_DIR, "_manifest.json"))
  ? (JSON.parse(
      readFileSync(join(BOL_MULT_DIR, "_manifest.json"), "utf-8")
    ) as Manifest)
  : { items: [] };

describe("bol-multiplier-burndown", () => {
  it("the bol-multiplier fixture family exists", () => {
    expect(manifest.items.length).toBeGreaterThan(0);
  });
});

for (const item of manifest.items) {
  describe(`bol-multiplier-burndown: ${item.slug}`, () => {
    const char = charBySlug[item.repSlug];
    const fixture: Fixture | undefined = existsSync(join(BOL_MULT_DIR, `${item.slug}.json`))
      ? (JSON.parse(
          readFileSync(join(BOL_MULT_DIR, `${item.slug}.json`), "utf-8")
        ) as Fixture)
      : undefined;

    if (!char || !fixture) {
      it(`${item.slug}: rep char + fixture present`, () =>
        expect.fail(
          `missing rep char '${item.repSlug}' or fixture '${item.slug}.json'`
        ));
      return;
    }

    const settings = SETTINGS_BY_SLUG[item.slug] ?? {};

    const { context, settings: merged } = buildStats({
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
      settings: merged,
      charLevel: LEVELS.charLevel,
    });

    // ---------------------------------------------------------------------
    // DAMAGE-triple assertions (Arlecchino's masque-carrying NORMALS — RED).
    //
    // The masque is an ADDITIVE base-damage term on NORMAL-attack features only (target
    // damageTypes:['normal']). So we assert the full triple (normal/crit/avg) of EACH normal-attack
    // damage feature: ours (pyro, NO masque) undershoots the oracle (pyro + masque) → RED. The
    // non-normal damage (charged/skill/burst/plunge) does NOT get the masque, so it already matches
    // → asserted too as a NO-DELTA GUARD (proves the RED is the masque, not a global mismatch).
    // Filtered by `k in compiled` because these damage features DO exist in our port (just without
    // the masque term) — honest, not vacuous. Clorinde's slug has no normal-masque damage delta;
    // its NON-damage heals are asserted separately below.
    // ---------------------------------------------------------------------
    const damageKeys = Object.entries(fixture.features)
      .filter(([, e]) => isDamageTripleEntry(e))
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

    // ---------------------------------------------------------------------
    // NON-DAMAGE OUTPUT assertions (BoL heals — RED-BY-ABSENCE / partial-port).
    //
    // SCOPE: BoL-as-MULTIPLIER heal terms on both reps.
    //   - clorinde-bol-heal: the two clorinde_impale_the_night_{2,3}_heal (added by the
    //     bol-multiplier pass; here as a NO-REGRESSION guard).
    //   - arlecchino-masque: the burst `arlecchino_heal` (the masque rep's ONLY non-damage
    //     output). Her FeatureHeal carries TWO multipliers — an ATK term (modelled) AND an
    //     HP×BoL term (`FeatureMultiplierBondOfLife`, s3.p3=150%). The arlecchino-burst-heal pass
    //     ADDS the missing HP×BoL multiplier (`bondOfLifeFactor:true`). Until it lands the port
    //     omits M2 but keeps the `subtractBoL` `−BoL×HP` term, so at BoL 50 it nets NEGATIVE
    //     (undershoots the oracle 9631.34) → RED. At BoL 0 the term is 0 → the base arlecchino.json
    //     heal (3049 @ BoL 0) is unchanged (outputCoverage untouched).
    //
    // CRITICAL: these are NOT guarded by `k in compiled`. For Clorinde the heal features were
    // absent until ported (a `k in compiled` filter would silently SKIP → pass VACUOUSLY); for
    // Arlecchino the heal feature IS present but its VALUE is wrong pre-M2. So we assert, per heal
    // key: (1) the key is PRESENT in `compiled`, AND (2) its value matches the oracle. Clause (2)
    // FAILS for arlecchino-masque today (M2 missing) → the gate is genuinely RED. Once M2 is added
    // both clauses pass (Arlecchino burst heal 9631.34 at BoL 50). Non-damage outputs are
    // single-valued (normal == crit == average).
    // ---------------------------------------------------------------------
    const nonDamageKeys = Object.entries(fixture.features)
      .filter(([, e]) => isNonDamageOutput(e))
      .map(([k]) => k);

    for (const key of nonDamageKeys) {
      const oracle = fixture.features[key]!;

      it(`${item.slug}/${key} present + value within ${TOLERANCE}`, () => {
        // (1) the heal feature must be MODELLED (not absent → would skip vacuously under `k in compiled`).
        expect(
          key in compiled,
          `${item.slug}/${key}: heal feature ABSENT from our port; oracle=${oracle.average.toFixed(4)}`
        ).toBe(true);
        // (2) the value must match (Clorinde: talent%×hp×0.5 − 0.5×hp; Arlecchino: ATK + HP×BoL terms − 0.5×hp at BoL 50).
        const result = compiled[key]!(context);
        expect(
          Math.abs(result.avg - oracle.average),
          `${item.slug}/${key}: ours=${result.avg.toFixed(4)}, oracle=${oracle.average.toFixed(4)}`
        ).toBeLessThanOrEqual(TOLERANCE);
      });
    }
  });
}
