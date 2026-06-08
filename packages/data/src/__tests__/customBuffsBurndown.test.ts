/**
 * P3.5 custom-buffs — universal MANUAL-BUFF escape-hatch burndown (RED by design, pending Task B).
 *
 * The `custom-buffs` oracle config (build-configs.mjs §customBuffsItems) drives her always-present
 * ConditionCustomBuffs (raw/.../classes/Condition/CustomBuffs.js:9-23, registered in
 * db/Buffs/ElementalResonance.js:70-74): it loops every `custom_buffs.<key>` setting, regex-strips
 * the `custom_buffs.` prefix, and ADDITIVELY injects the suffix as a RAW stat into the bag
 * (result.stats.add(m[1], value)); `processPercent` (Stats.js:119-125 + isPercent :327-337) then folds
 * percent keys /100 ONCE over the whole bag. The condition's loop is KEY-GENERIC (m[1] + stats.add is
 * an open-bag write — the "35 stats" is a UI preset, not a code limit), so ONE key per emit-LANE proves
 * the lane (one element proves all 8 dmg_<element>). Each rep is driven with the EXACT `custom_buffs.*`
 * settings the oracle item set; this burndown threads those same settings into both buildStats and
 * compileCharacter and asserts the lifted outputs.
 *
 * THE PERCENT-FOLD (re-derived from isPercent, Stats.js:327-337 — `/_percent/` OR
 * `^(bond_of_life|stamina|recovery|duration|atk_speed|move_speed|healing|recharge|crit_|dmg_|enemy_|`
 * `res_|.*bonus_|.*shield|.*_multi)`):
 *   custom_buffs.atk:500           → bare `atk` matches NEITHER /_percent/ NOR ^atk_speed → NOT percent
 *                                    → bag 500 FLAT → atk_total via getTotal.
 *   custom_buffs.atk_percent:40    → /_percent/ → bag 0.40 → atk_total (the % term).
 *   custom_buffs.crit_rate:30      → ^crit_ → bag 0.30 → crit_rate_total.
 *   custom_buffs.crit_dmg:60       → ^crit_ → bag 0.60 → crit_dmg_total.
 *   custom_buffs.dmg_pyro:50       → ^dmg_ → bag 0.50 → dmg_pyro (proves all 8 dmg_<element>).
 *   custom_buffs.dmg_normal:25     → ^dmg_ → bag 0.25 → dmg_normal (the type-DMG lane).
 *   custom_buffs.enemy_def_ignore:20 → ^enemy_ → bag 0.20 → enemy_def_ignore.
 *   custom_buffs.shield:50         → `.*shield` → bag 0.50 → FeatureShield base × (1 + 0.50).
 *   custom_buffs.healing:30        → ^healing → bag 0.30 → FeatureHeal base × (1 + 0.30).
 *
 * Three reps span the three OUTPUT KINDS:
 *   - custom-buffs-damage (Diluc): a clean ATK-scaling pyro DPS with normal-attack + pyro skill/burst
 *     damage features. Drives 7 keys across the six already-emitted DAMAGE lanes — flat-scaling
 *     (`atk`) / percent-scaling (`atk_percent`; both fold into the SAME atk_total lane) / crit-rate /
 *     crit-dmg / element-DMG (`dmg_pyro`) / type-DMG (`dmg_normal`) / enemy-def (`enemy_def_ignore`).
 *     (crit-rate + crit-dmg are listed as one "crit-fraction" lane below; counted as two distinct
 *     emit sites they make six lanes total.) EVERY lane already emits in our buildStats,
 *     so the RED here is driven PURELY by the MISSING CONDITION (no custom_buffs.* ever reaches the
 *     bag) — every damage triple shifts. Asserted as the full triple of each damage feature in our
 *     port (filtered by `k in compiled` — the features DO exist, just without the bonus → honest, not
 *     vacuous).
 *   - custom-buffs-shield (Noelle): her skill `shield` output (FeatureShield, output:{kind:'shield'},
 *     base × (1 + shield), compileFeature.ts:741). THE ANTI-HOLLOW-GREEN KEY: RED until Task B adds
 *     BOTH the condition AND the genuinely-new out['shield'] emit (our buildStats emits no out['shield']
 *     today → cStat('shield')=0 → shield undershoots by the full 50%). Asserted as the shield output
 *     VALUE (single-valued: normal == crit == average).
 *   - custom-buffs-heal (Sangonomiya Kokomi): her HP-scaling heal outputs (FeatureHeal heal_dot +
 *     kokomi_burst_heal, both output:{kind:'heal'}, base × (1 + healing + …), read cStat('healing')
 *     compileFeature.ts:759). The `healing` lane ALREADY emits (HEAL_BONUS_KEYS, buildStats.ts:946-948),
 *     so the RED here is driven by the MISSING CONDITION (without it no `healing` bonus reaches the bag
 *     → heals undershoot by 30%). Asserted as the heal output VALUE.
 *
 * The shield/heal features EXIST in our port (unlike a RED-by-absence gate), so they are asserted via
 * the `k in compiled` filter + a VALUE check (mirroring outputCoverage.test.ts:191-200) — the value
 * FAILS today (the bonus is absent) → genuinely RED. The settings injected per rep are EXACTLY the
 * `custom_buffs.*` keys that rep's oracle item set, so this suite goes GREEN under Task B with NO edits
 * here.
 *
 * GUARD — HONESTY RULES (verbatim from armory.test.ts / bolMultiplierBurndown.test.ts): NO it.skip,
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

// Per-rep settings — mirrors the custom-buffs oracle config (build-configs.mjs §customBuffsItems).
// Each value is EXACTLY the `custom_buffs.*` key(s) the oracle item set for that rep, injected verbatim
// into both buildStats and compileCharacter:
//   custom-buffs-damage — setBuffsSettings({custom_buffs.atk:500, atk_percent:40, crit_rate:30,
//                          crit_dmg:60, dmg_pyro:50, dmg_normal:25, enemy_def_ignore:20}).
//   custom-buffs-shield — setBuffsSettings({custom_buffs.shield:50}).
//   custom-buffs-heal   — setBuffsSettings({custom_buffs.healing:30}).
const SETTINGS_BY_SLUG: Readonly<Record<string, Readonly<Record<string, unknown>>>> = {
  "custom-buffs-damage": {
    "custom_buffs.atk": 500,
    "custom_buffs.atk_percent": 40,
    "custom_buffs.crit_rate": 30,
    "custom_buffs.crit_dmg": 60,
    "custom_buffs.dmg_pyro": 50,
    "custom_buffs.dmg_normal": 25,
    "custom_buffs.enemy_def_ignore": 20,
  },
  "custom-buffs-shield": { "custom_buffs.shield": 50 },
  "custom-buffs-heal": { "custom_buffs.healing": 30 },
};

interface ManifestItem {
  readonly slug: string;
  /** The charKey (e.g. "Diluc"). */
  readonly repKey: string;
  /** The TS slug (e.g. "diluc") — used to resolve the recipient DbObjectChar. */
  readonly repSlug: string;
}

interface Manifest {
  readonly items: readonly ManifestItem[];
}

interface Fixture {
  readonly slug: string;
  readonly features: Record<string, FixtureEntry>;
}

const CUSTOM_BUFFS_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../tests/golden/fixtures/custom-buffs"
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

// slug ("diluc") -> DbObjectChar. custom-buffs is a partyItems config, so a fixture's slug is the
// EFFECT slug (e.g. "custom-buffs-damage"); the rep char is resolved from the manifest's repSlug
// (mirroring bolMultiplierBurndown.test.ts / enemyStateBurndown.test.ts).
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

const manifest: Manifest = existsSync(join(CUSTOM_BUFFS_DIR, "_manifest.json"))
  ? (JSON.parse(
      readFileSync(join(CUSTOM_BUFFS_DIR, "_manifest.json"), "utf-8")
    ) as Manifest)
  : { items: [] };

describe("custom-buffs-burndown", () => {
  it("the custom-buffs fixture family exists", () => {
    expect(manifest.items.length).toBeGreaterThan(0);
  });
});

for (const item of manifest.items) {
  describe(`custom-buffs-burndown: ${item.slug}`, () => {
    const char = charBySlug[item.repSlug];
    const fixture: Fixture | undefined = existsSync(join(CUSTOM_BUFFS_DIR, `${item.slug}.json`))
      ? (JSON.parse(
          readFileSync(join(CUSTOM_BUFFS_DIR, `${item.slug}.json`), "utf-8")
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
    // DAMAGE-triple assertions (the custom-buffs-damage rep — RED).
    //
    // The damage rep drives 7 keys across six already-emitted DAMAGE lanes; without the condition NONE
    // of the custom_buffs.* keys reach the bag, so EVERY damage feature undershoots (atk/atk_percent lift the
    // base; crit_rate/crit_dmg lift the crit; dmg_pyro lifts pyro skill/burst; dmg_normal lifts normals;
    // enemy_def_ignore lifts all). Assert the full triple (normal/crit/avg) of each damage feature.
    // Filtered by `k in compiled` because these features DO exist in our port (just without the bonus)
    // — honest, not vacuous. The shield/heal reps carry no in-scope damage delta (their non-damage
    // outputs are asserted below), so this block fires only for the damage rep.
    // ---------------------------------------------------------------------
    const damageKeys = Object.entries(fixture.features)
      .filter(([, e]) => isDamageTripleEntry(e))
      .map(([k]) => k);

    if (item.slug === "custom-buffs-damage") {
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
    }

    // ---------------------------------------------------------------------
    // NON-DAMAGE OUTPUT assertions (the shield + heal reps — RED).
    //
    // shield rep → her FeatureShield outputs (skill.shield is the clean target; A1 devotion shield
    // likewise reads cStat('shield')); heal rep → her FeatureHeal outputs (heal_dot + kokomi_burst_heal,
    // read cStat('healing')). These features EXIST in our port, so they are asserted via `k in compiled`
    // + a VALUE check (single-valued: normal == crit == average). The value FAILS today: shield because
    // the `shield` BAG STAT (not the feature) is unemitted — out['shield'] is absent → cStat('shield')=0
    // (genuinely-new emit, Task B2); heal because the condition that would inject the `healing` bonus is
    // missing (Task B1) — so each undershoots by its full bonus. Restricted to the shield/heal reps (the
    // damage rep's deliverable is the damage triples above).
    //
    // Why these gates are NOT vacuous: the shield/heal FEATURES are present in `compiled` (the
    // `k in compiled` filter holds), and the values fail only because a BAG STAT they read is
    // absent — shield because buildStats emits no `out['shield']` yet (genuinely-new code, Task B2),
    // heal because the condition that would inject the `healing` bonus is missing (Task B1). Each
    // output undershoots by exactly its full bonus (shield/heal × (1 + bonus) with bonus omitted).
    // ---------------------------------------------------------------------
    const nonDamageKeys =
      item.slug === "custom-buffs-shield" || item.slug === "custom-buffs-heal"
        ? Object.entries(fixture.features)
            .filter(([, e]) => isNonDamageOutput(e))
            .map(([k]) => k)
            .filter((k) => k in compiled)
        : [];

    for (const key of nonDamageKeys) {
      const oracle = fixture.features[key]!;

      it(`${item.slug}/${key} value within ${TOLERANCE}`, () => {
        const result = compiled[key]!(context); // DamageResult; non-damage → normal == crit == avg
        expect(
          Math.abs(result.avg - oracle.average),
          `${item.slug}/${key}: ours=${result.avg.toFixed(4)}, oracle=${oracle.average.toFixed(4)}`
        ).toBeLessThanOrEqual(TOLERANCE);
      });
    }
  });
}
