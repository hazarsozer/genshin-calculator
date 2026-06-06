/**
 * P3.5 enemy-state — Enemy-state guard (RED by design, pending Tasks B/C).
 *
 * The `enemy-state` oracle config (build-configs.mjs) drives user-settable ENEMY-STATE flags
 * via the buffs bag (setBuffsSettings — the no-teammate passthrough the `party` config uses for
 * common.enemy_status/enemy_frozen) and dumps her engine's resulting triples to
 * tests/golden/fixtures/enemy-state/. Three flags, each a global condition/feature override in
 * raw whose effect lifts a damage feature our engine does NOT yet model:
 *
 *   - enemy_weak_shot (Ganyu, Tighnari): FeatureDamageChargedAimed.getCritRateBlock returns
 *     100% crit (raw/.../classes/Feature2/Damage/Charged/Aimed.js:5-13). NOT bow-restricted —
 *     the db/Conditions/Enemy.js:79-84 hideCondition is cosmetic, so every aimed feature gets
 *     it. Her dumped aimed triples have average == crit; our engine compiles the aimed crit-rate
 *     from the normal stat block (≈5% crit) → our `avg` undershoots by the full crit spread.
 *   - enemy.superconduct (Eula): ConditionBoolean{stats:{enemy_res_phys:-40}}
 *     (raw/.../db/Conditions/Enemy.js:65-72), a global stats-accumulation condition. Our
 *     buildStats reads enemy_res_phys from the stats bag (buildStats.ts:949-959) but NO global
 *     condition injects the -40 when settings["enemy.superconduct"] is set → Eula's physical
 *     hits land vs full phys-res (our `avg` undershoots).
 *   - enemy_burning (Emilie): her A4 atkBuffPost (PostEffectStatsAtk, dmg_all += ATK×0.015 cap
 *     36) gated ConditionBoolean('enemy_burning') + ConditionAscensionChar(4) [met at A6]
 *     (raw/.../db/Char/Emilie.js:129-137). Our emilie.ts omits this postEffect → our `avg`
 *     undershoots by the dmg_all bonus.
 *
 * Each rep's damage triple's avg is therefore SMALLER than the oracle's, and that RED is the
 * deliverable: it proves the holes. Wiring them to GREEN is Tasks B (weak-shot crit branch +
 * superconduct condition if RED) and C (Emilie A4 postEffect). The settings injected per rep are
 * EXACTLY the enemy flag(s) that rep's oracle item set — so this suite goes GREEN under Tasks B/C
 * with NO edits here.
 *
 * GUARD — HONESTY RULES (verbatim from armory.test.ts / catalyzeBurndown.test.ts): NO it.skip,
 * NO it.todo, NO it.fails, NO loosened tolerance, NO hard-coded overrides. The RED is by design
 * pending Tasks B/C.
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

// Per-rep enemy-state settings — mirrors the enemy-state oracle config (build-configs.mjs
// §enemy-state: enemyStateItems). Each value is EXACTLY the enemy flag(s) the oracle item set
// for that rep, injected verbatim into both buildStats and compileCharacter.
const SETTINGS_BY_SLUG: Readonly<Record<string, Readonly<Record<string, unknown>>>> = {
  "weak-shot-ganyu": { enemy_weak_shot: true },
  "weak-shot-tighnari": { enemy_weak_shot: true },
  "superconduct-eula": { "enemy.superconduct": true },
  "burning-emilie": { enemy_burning: true },
};

interface ManifestItem {
  readonly slug: string;
  /** The charKey (e.g. "Ganyu"). */
  readonly repKey: string;
  /** The TS slug (e.g. "ganyu") — used to resolve the recipient DbObjectChar. */
  readonly repSlug: string;
}

interface Manifest {
  readonly items: readonly ManifestItem[];
}

interface Fixture {
  readonly slug: string;
  readonly features: Record<string, FixtureEntry>;
}

const ENEMY_STATE_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../tests/golden/fixtures/enemy-state"
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

// slug ("ganyu") -> DbObjectChar. The enemy-state config is a partyItems config, so a fixture's
// slug is the EFFECT slug (e.g. "weak-shot-ganyu"); the rep char is resolved from the manifest's
// repSlug (mirroring partyBuffsBurndown.test.ts).
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

const manifest: Manifest = existsSync(join(ENEMY_STATE_DIR, "_manifest.json"))
  ? (JSON.parse(
      readFileSync(join(ENEMY_STATE_DIR, "_manifest.json"), "utf-8")
    ) as Manifest)
  : { items: [] };

describe("enemy-state-burndown", () => {
  it("the enemy-state fixture family exists", () => {
    expect(manifest.items.length).toBeGreaterThan(0);
  });
});

for (const item of manifest.items) {
  describe(`enemy-state-burndown: ${item.slug}`, () => {
    const char = charBySlug[item.repSlug];
    const fixture: Fixture | undefined = existsSync(join(ENEMY_STATE_DIR, `${item.slug}.json`))
      ? (JSON.parse(
          readFileSync(join(ENEMY_STATE_DIR, `${item.slug}.json`), "utf-8")
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

    const { context } = buildStats({
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
      settings,
      charLevel: LEVELS.charLevel,
    });

    // Assert every damage triple the oracle emitted (a crit-spread triple). Non-damage outputs
    // (heal/shield/static readouts: normal == crit == average) and stats are excluded — this gate
    // is about the enemy-state flags lifting DAMAGE.
    const damageKeys = Object.entries(fixture.features)
      .filter(([, e]) => isDamageTripleEntry(e))
      .map(([k]) => k);

    for (const key of damageKeys.filter((k) => k in compiled)) {
      const oracle = fixture.features[key]!;
      it(`${item.slug}/${key} avg within ${TOLERANCE}`, () => {
        const result = compiled[key]!(context);
        expect(
          Math.abs(result.avg - oracle.average),
          `${item.slug}/${key}: ours=${result.avg.toFixed(2)}, oracle=${oracle.average.toFixed(2)}`
        ).toBeLessThanOrEqual(TOLERANCE);
      });
    }
  });
}
