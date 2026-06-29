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
  // Kirara C6 dmg_<all 7 elements>+12 (gated C6 → char_constellation:6 threads the cons gate ON).
  "kirara-self-buffs": {
    char_constellation: 6,
    kirara_countless_sights_to_see: true,
  },
  // LanYan C4 mastery+60 (gated C4 → char_constellation:4 threads the cons gate ON).
  "lanyan-self-buffs": {
    char_constellation: 4,
    lanyan_with_drakefalcons_blood_pearls_adorned: true,
  },
  // Sucrose C6 dmg_<swirled element>+20 (gated C6 → char_constellation:6 threads the cons gate ON).
  // sucrose_chaotic_entropy:"pyro" selects pyro → dmg_pyro+20 on her pyro absorb variant.
  "sucrose-self-buffs": {
    char_constellation: 6,
    sucrose_chaotic_entropy: "pyro",
  },
  // Xiangling C1 enemy_res_pyro−15 (≥C1) + C6 dmg_pyro+15 (≥C6). char_constellation:6 threads BOTH
  // cons gates ON, matching the oracle dump at constellation 6.
  "xiangling-self-buffs": {
    char_constellation: 6,
    xiangling_crispy: true,
    xiangling_condensed_pyronado: true,
  },
  // Beidou A4 dmg_normal+15 & dmg_charged+15 (ungated) + C6 enemy_res_electro−15 (≥C6).
  // char_constellation:6 threads the C6 gate ON, matching the oracle dump at constellation 6.
  "beidou-self-buffs": {
    char_constellation: 6,
    beidou_lightning_storm: true,
    beidou_bane_of_the_evil: true,
  },
  // Venti C2 breeze ×2 (anemo/phys res −12 each) + C4 hurricane (dmg_anemo+25) + C6 storm
  // (anemo res −20) + storm_element:"pyro" (pyro res −20). char_constellation:6 threads ALL the
  // C2/C4/C6 gates ON, matching the oracle dump at constellation 6.
  "venti-self-buffs": {
    char_constellation: 6,
    venti_breeze: true,
    venti_breeze_2: true,
    venti_hurricane: true,
    venti_storm: true,
    venti_storm_element: "pyro",
  },
  // Gorou A1 def_percent+25 (ungated) + standing_firm flat DEF (banner-gated, scaled by skill level)
  // + C6 crit_dmg_geo+10 (banner+C6). char_skill_elemental:10 feeds the standing_firm static-level
  // (this burndown's buildStats call omits talentLevels, so the skill level is threaded here);
  // char_constellation:6 threads the C6 gate ON. Matches the oracle dump at constellation 6 / skill 10.
  "gorou-self-buffs": {
    char_constellation: 6,
    char_skill_elemental: 10,
    gorou_heedless_of_the_wind_and_weather: true,
    gorou_generals_war_banner: true,
  },
  // Amber A4 atk_percent+15 (ungated) + C6 atk_percent+15 (gated C6 → char_constellation:6 threads the
  // cons gate ON, matching the oracle dump at constellation 6).
  "amber-self-buffs": {
    char_constellation: 6,
    amber_precise_shot: true,
    amber_wildfire: true,
  },
  // Ningguang A4 dmg_geo+12 (ungated) + C4 self-RES+10 (damage-inert, gated C4 → char_constellation:6
  // threads the cons gate ON, matching the oracle dump at constellation 6). Only the geo damage triples
  // are asserted (the C4 self-RES never lifts damage).
  "ningguang-self-buffs": {
    char_constellation: 6,
    ningguang_strategic_reserve: true,
    ningguang_exquisite_be_the_jade_outshining_all_beneath: true,
  },
  // Albedo A1 dmg_skill_albedo+25 (ungated, lifts albedo_blossom) + C2 def*-stacks burst bonus
  // (albedo_opening_of_hanerozoic:4 → 120% DEF on burst) + C4 dmg_plunge+30 + C6 dmg_all+17.
  // char_constellation:6 threads the C4/C6 gates ON, matching the oracle dump at constellation 6 / 4 stacks.
  "albedo-self-buffs": {
    char_constellation: 6,
    albedo_calcite_might: true,
    albedo_opening_of_hanerozoic: 4,
    albedo_descent_of_divinity: true,
    albedo_dust_of_purification: true,
  },
  // Lisa A4 enemy_def_reduce+15 (ungated, lifts every hit) + C2 def_percent+25 (damage-inert, gated C2 →
  // char_constellation:6 threads the cons gate ON, matching the oracle dump at constellation 6). All damage
  // triples lift only by the A4 enemy-DEF shred.
  "lisa-self-buffs": {
    char_constellation: 6,
    lisa_static_electricity_field: true,
    lisa_electromagnetic_field: true,
  },
  // Mika A1 dmg_phys+10/stack (mika_suppressive_barrage:5 → +50% at C6 max-5) + C6 crit_dmg_phys+60.
  // char_constellation:6 threads the C6 gate ON (→ the stacks max becomes 5 and the phys crit DMG fires),
  // matching the oracle dump at constellation 6. Lifts every physical hit's normal/crit/avg.
  "mika-self-buffs": {
    char_constellation: 6,
    mika_suppressive_barrage: 5,
    mika_companions_counsel: true,
  },
  // Yaoyao C1 dmg_dendro+15 (gated C1 → char_constellation:6 threads the cons gate ON), lifting her
  // dendro hits. (C4 "Winsome" HP→EM is Tier-B deferred → not toggled; only the dendro damage triples.)
  "yaoyao-self-buffs": {
    char_constellation: 6,
    yaoyao_adeptus_tutelage: true,
  },
  // Chasca C6 crit_dmg_chasca+120 on her shadowhunt shells (base anemo + 4 shining shells), gated C6
  // → char_constellation:6 threads the cons gate ON, matching the oracle dump at constellation 6.
  "chasca-self-buffs": {
    char_constellation: 6,
    chasca_showdown_the_glory_of_battle: true,
  },
  // Ororon C1 dmg_skill_ororon+50 (hypersense hits) + C2 dmg_electro+8/stack (king_bee:4 → +32%) +
  // C6 atk_percent+10/stack (ode:3 → +30%). char_constellation:6 threads ALL three cons gates ON,
  // matching the oracle dump at constellation 6.
  "ororon-self-buffs": {
    char_constellation: 6,
    ororon_trails_amidst_the_forest_fog: true,
    ororon_king_bee_of_the_hidden_honeyed_wine: 4,
    ororon_ode_to_deep_springs: 3,
  },
  // Sayu C2 dmg_skill_sayu_hold+3.3/stack (sayu_egress_prep:20 → +66%) on the 5 hold-kick features,
  // gated C2 → char_constellation:6 threads the cons gate ON, matching the oracle dump at constellation 6.
  // (Only damage triples are asserted; the pre-existing C6 mastery-heal value gap is filtered out.)
  "sayu-self-buffs": {
    char_constellation: 6,
    sayu_egress_prep: 20,
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
