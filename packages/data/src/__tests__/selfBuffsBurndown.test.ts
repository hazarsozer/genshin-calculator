/**
 * skip-class SELF-condition sweep — self-buffs burndown (the ARC BACKBONE).
 *
 * The port systematically modelled the `party.*` TEAMMATE mirror of a character's self conditions
 * but SKIPPED the SELF version — and because NO golden ever toggles those self conditions, the 58k
 * DAMAGE goldens are structurally BLIND to the gap (it only fires when the self setting is active).
 * A diff-parity sweep (tools/oracle/diff-parity.mjs) surfaced the class. This suite is the reusable
 * oracle-lock for it: each rep's fixture (tests/golden/fixtures/self-buffs/) is dumped from HER
 * engine with the char's SELF toggle baked ON (build-configs.mjs §selfBuffsItems, via
 * mergeCharSettings — the SAME char-axis channel infusionItems uses for diluc_dawn); this suite
 * threads the SAME toggle (the manifest's party.settings) into both buildStats and compileCharacter
 * and asserts every buffed damage triple. Adding the next char is one item in selfBuffsItems + one
 * SETTINGS_BY_SLUG row here + a re-dump (`node tools/oracle/dump-oracle.mjs --config=self-buffs`).
 *
 *   - zhongli-jade-shield (Zhongli): {zhongli_jade_shield:true} → his own Jade Shield grants −20
 *     enemy RES to ALL 7 elements + physical (raw Zhongli.js:316-331, a C0 ConditionBoolean — NO
 *     ascension/constellation gate), buffing EVERY one of Zhongli's own damage features (the RES
 *     multiplier on every hit). The port modelled party.zhongli_jade_shield (the teammate mirror,
 *     Zhongli.js:447-463) but SKIPPED the SELF version, so before the fix every Zhongli damage
 *     triple undershot the oracle by the res-shred. The fix (characters/zhongli.ts conditions[]:
 *     the SELF `{type:"boolean", name:"zhongli_jade_shield", stats:{enemy_res_*:-20}}`) lands in
 *     the SAME commit → this rep is GREEN-on-arrival, locking the fix against regression. The
 *     anti-gaming proof: REMOVING that self condition from zhongli.ts turns this suite RED (every
 *     damage triple drops by the res-shred), confirming the fixture exercises the buff, not a
 *     vacuous 0==0 — the buff is cons-independent so this single cons-0 fixture is the load-bearing
 *     lock (the diff-parity sweep confirms it across cons 0..6).
 *
 * The full triple (normal/crit/avg) is asserted (not avg-only): a RES change scales all three
 * proportionally, so all three shift — mirroring infusionBurndown / lyneySurplusBurndown. The
 * `k in compiled` filter is honest, not vacuous: these damage features DO exist in our port (the
 * question is whether the self condition lifts them), and the RED-without-fix proof above confirms
 * the keys match (a namespacing mismatch would make removal a no-op, not a RED).
 *
 * GUARD — HONESTY RULES (verbatim from infusionBurndown.test.ts / bolMultiplierBurndown.test.ts):
 * NO it.skip, NO it.todo, NO it.fails, NO loosened tolerance, NO hard-coded overrides.
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

// Per-rep settings — mirrors the self-buffs oracle config (build-configs.mjs §selfBuffsItems). Each
// value is EXACTLY the SELF toggle the oracle item set for that rep, injected verbatim into both
// buildStats and compileCharacter so the rep's self condition is active on BOTH sides:
//   zhongli-jade-shield — mergeCharSettings({zhongli_jade_shield:true}) → −20 enemy RES (8 keys).
// ADD THE NEXT CHAR HERE: one row { "<slug>": { <toggle>: true } } matching the new selfBuffsItems
// entry, then re-dump (`node tools/oracle/dump-oracle.mjs --config=self-buffs`).
const SETTINGS_BY_SLUG: Readonly<Record<string, Readonly<Record<string, unknown>>>> = {
  "zhongli-jade-shield": { zhongli_jade_shield: true },
  // Xinyan A4 dmg_phys+15 (ungated) + C4 enemy_res_physical−15 (gated at C4 → char_constellation:4
  // threads the cons gate ON, matching the oracle dump at constellation 4).
  "xinyan-self-buffs": {
    char_constellation: 4,
    xinyan_now_thats_rock: true,
    xinyan_wildfire_rhythm: true,
  },
  // Rosaria A1 crit_rate+12 (ungated) + C1 dmg_normal+10 (≥C1) + C6 enemy_res_physical−20 (≥C6).
  // char_constellation:6 threads the cons gates ON, matching the oracle dump at constellation 6.
  "rosaria-self-buffs": {
    char_constellation: 6,
    rosaria_regina_probationum: true,
    rosaria_unholy_revelation: true,
    rosaria_divine_retribution: true,
  },
};

interface ManifestItem {
  readonly slug: string;
  /** The charKey (e.g. "Zhongli"). */
  readonly repKey: string;
  /** The TS slug (e.g. "zhongli") — used to resolve the recipient DbObjectChar. */
  readonly repSlug: string;
}

interface Manifest {
  readonly items: readonly ManifestItem[];
}

interface Fixture {
  readonly slug: string;
  readonly features: Record<string, FixtureEntry>;
}

const SELF_BUFFS_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../tests/golden/fixtures/self-buffs"
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

// slug ("zhongli") -> DbObjectChar. self-buffs is a partyItems config, so a fixture's slug is the
// EFFECT slug (e.g. "zhongli-jade-shield"); the rep char is resolved from the manifest's repSlug
// (mirroring infusionBurndown.test.ts / bolMultiplierBurndown.test.ts).
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

const manifest: Manifest = existsSync(join(SELF_BUFFS_DIR, "_manifest.json"))
  ? (JSON.parse(readFileSync(join(SELF_BUFFS_DIR, "_manifest.json"), "utf-8")) as Manifest)
  : { items: [] };

describe("self-buffs-burndown", () => {
  it("the self-buffs fixture family exists", () => {
    expect(manifest.items.length).toBeGreaterThan(0);
  });
});

for (const item of manifest.items) {
  describe(`self-buffs-burndown: ${item.slug}`, () => {
    const char = charBySlug[item.repSlug];
    const fixture: Fixture | undefined = existsSync(join(SELF_BUFFS_DIR, `${item.slug}.json`))
      ? (JSON.parse(readFileSync(join(SELF_BUFFS_DIR, `${item.slug}.json`), "utf-8")) as Fixture)
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

    // Assert every damage triple the oracle emitted under the self toggle. The self buff (e.g.
    // Zhongli's universal res-shred) lifts the FULL triple (normal/crit/avg), so all three are
    // asserted. Filtered by `k in compiled` because these damage features DO exist in our port (the
    // question is whether the self condition lifts them) — honest, not vacuous (the RED-without-fix
    // proof in the header confirms the keys match: removal turns this RED, not a no-op).
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
  });
}
