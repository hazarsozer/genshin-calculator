/**
 * P3.5 food — Food (cooking-buff) guard (RED by design until the bag concat lands).
 *
 * The `food` oracle config (build-configs.mjs §food: foodItems) drives Aspirine's Food
 * subsystem — a PURE FLAT-STAT additive layer (CalcObjectFood, raw/.../classes/CalcObject/
 * Food.js:43-75): 3 slots {Attack,Defence,Potion}, 43 items, NO conditions/postEffects/settings.
 * A selected food's getStats(tier) (DbObjectFood.getStats, Food.js:96-109 → StatTable.getValue,
 * StatTable.js:11-20: a 1-indexed quality TIER, clamp-to-last, 0-floor, `if (value)` skip) is
 * concat'd into the bag in CalcSet.getBaseStats, then processPercent folds percent keys /100.
 * Each rep's fixture (tests/golden/fixtures/food/) therefore carries her engine's FOOD-BUFFED
 * triples; this suite reconstructs the SAME food flat stats from generated/foodTables.ts (via the
 * manifest's {type,key,tier} — NO raw import), passes them as the new `food` input to buildStats,
 * and asserts the lifted DAMAGE triples:
 *
 *   - food-attack-keqing (Keqing): setFood('Attack', AdeptusTemptation, 3) → atk+372 + crit_rate+12.
 *     Both are already-emitted bag keys (atk→getTotal, crit_rate→fraction) → every Keqing damage
 *     triple shifts (base + crit spread). Until buildStats merges `input.food`, our bag lacks them
 *     → every triple undershoots by the food's ATK/crit contribution.
 *   - food-potion-diluc (Diluc): setFood('Potion', FlamingEssentialOil, 1) → dmg_pyro+25. Reaches
 *     the damage multiplier via DMG_BONUS_ELEMENT_KEYS (buildStats.ts) → fraction; lifts his pyro
 *     skill/burst (his physical normals are untouched → already-GREEN). One element proves all 7 oils.
 *   - food-defence-albedo (Albedo): setFood('Defence', CallaLilySeafoodSoup, 4) → def+282. His
 *     DEF-scaled skill.albedo_blossom (+ burst) lifts; his ATK normals are untouched. Gates the
 *     Defence `def` lane on a toggle-free DEF-native rep.
 *
 * Each rep's damage-triple avg is therefore SMALLER than the oracle's, and that RED is the
 * deliverable: it proves the hole (food stats absent from our bag). Wiring it to GREEN is the
 * one-line `raw.concat(input.food ?? {})` merge in buildStats. The food reconstructed per rep is
 * EXACTLY the food the oracle item set — so this suite goes GREEN under the merge with NO edits here.
 *
 * GUARD — HONESTY RULES (verbatim from armory.test.ts / enemyStateBurndown.test.ts): NO it.skip,
 * NO it.todo, NO it.fails, NO loosened tolerance, NO hard-coded overrides. The RED is by design
 * pending the buildStats food merge.
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
import { getFoodStats } from "../generated/foodTables.js";
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

interface FoodSlot {
  readonly type: string;
  readonly key: string;
  readonly tier: number;
}

interface ManifestItem {
  readonly slug: string;
  /** The charKey (e.g. "Keqing"). */
  readonly repKey: string;
  /** The TS slug (e.g. "keqing") — used to resolve the recipient DbObjectChar. */
  readonly repSlug: string;
  /** The reconstructable food slot {type,key,tier} the oracle item set. */
  readonly party: { readonly food: FoodSlot };
}

interface Manifest {
  readonly items: readonly ManifestItem[];
}

interface Fixture {
  readonly slug: string;
  readonly features: Record<string, FixtureEntry>;
}

const FOOD_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../tests/golden/fixtures/food"
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

// slug ("keqing") -> DbObjectChar. The food config is a partyItems config, so a fixture's slug is
// the EFFECT slug (e.g. "food-attack-keqing"); the rep char is resolved from the manifest's
// repSlug (mirroring enemyStateBurndown.test.ts / bolStatBurndown.test.ts).
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

const manifest: Manifest = existsSync(join(FOOD_DIR, "_manifest.json"))
  ? (JSON.parse(readFileSync(join(FOOD_DIR, "_manifest.json"), "utf-8")) as Manifest)
  : { items: [] };

describe("food-burndown", () => {
  it("the food fixture family exists", () => {
    expect(manifest.items.length).toBeGreaterThan(0);
  });
});

for (const item of manifest.items) {
  describe(`food-burndown: ${item.slug}`, () => {
    const char = charBySlug[item.repSlug];
    const fixture: Fixture | undefined = existsSync(join(FOOD_DIR, `${item.slug}.json`))
      ? (JSON.parse(readFileSync(join(FOOD_DIR, `${item.slug}.json`), "utf-8")) as Fixture)
      : undefined;

    if (!char || !fixture) {
      it(`${item.slug}: rep char + fixture present`, () =>
        expect.fail(
          `missing rep char '${item.repSlug}' or fixture '${item.slug}.json'`
        ));
      return;
    }

    // Reconstruct the food's flat-stat bag from generated/foodTables.ts (NO raw import) — exactly
    // DbObjectFood.getStats(tier): the manifest's {type,key,tier} → getFoodValue per stat key,
    // skipping zero values. These are Aspirine-native keys → fed verbatim as the new `food` input.
    const { type, key, tier } = item.party.food;
    const food = getFoodStats(type, key, tier);

    const { context } = buildStats({
      char,
      weaponStatTable: WEAPON_TABLE_BY_TYPE[char.weapon]!,
      statBlock: STAT_BLOCK,
      levels: LEVELS,
      enemy: ENEMY,
      food,
    });

    // Food carries NO settings (Food.js:69-75 getSettings()={}) → compile with the base talents
    // and an empty settings bag (compileCharacter reads ctx.settings for the catalyze gate).
    const compiled = compileCharacter(char, {
      charElement: char.element,
      talentLevels: TALENTS,
      settings: {},
      charLevel: LEVELS.charLevel,
    });

    // Assert every damage triple the oracle emitted (a crit-spread triple). Non-damage outputs
    // (heal/shield/static readouts: normal == crit == average) and stats are excluded — this gate
    // is about the food's flat stats lifting DAMAGE.
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
