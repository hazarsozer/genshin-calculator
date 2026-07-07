import { describe, it, expect } from "vitest";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { TOLERANCE } from "@genshin/data";
import type { EquippedSet } from "@genshin/data";
import type { BuildForm } from "../types";
import { DEFAULT_FORM } from "../defaults";
import { encodeBuild } from "../url";
import { computeBuild } from "../calc";
import { assembleFromManual } from "../artifacts";

/**
 * Full-roster expectation generator for the browser verification pass (2026-07).
 *
 * For each scenario (manifest-driven: base/C6/weapon-passive for all 107
 * characters + every curated char-keyed oracle family + hand-picked pilot
 * cases) it (1) reproduces the Aspirine golden-oracle fixture build as a
 * BuildForm, (2) computes it through the EXACT page path (assembleFromManual →
 * computeBuild), (3) gates every shared DAMAGE feature triple against the
 * oracle fixture within TOLERANCE (failures collected and reported all at
 * once), records non-damage mismatches / key-set asymmetries in
 * browser-pilot-warnings.json (the display-gap findings list), and (4) writes
 * e2e/fixtures/browser-pilot.json with the encoded hash + expected on-screen
 * numbers for the RUN_SWEEP=1 browser sweep (e2e/browser-pilot.spec.ts).
 *
 * Engine == Aspirine is re-proven HERE per scenario; the browser sweep then
 * proves DOM == engine, closing the chain DOM == engine == Aspirine.
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURES = join(HERE, "..", "..", "..", "..", "tests", "golden", "fixtures");
const OUT = join(HERE, "..", "..", "e2e", "fixtures", "browser-pilot.json");

const SAMPLE_BLOCK: Record<string, number> = {
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
};

// tools/oracle/build-configs.mjs HIGH_ATK_HP_BLOCK (stat-variance / full-build).
const HIGH_ATK_HP_BLOCK: Record<string, number> = {
  recharge_base: 100,
  hp_base: 30000,
  atk_base: 871,
  def_base: 876,
  crit_dmg_base: 200,
  crit_rate_base: 70,
  dmg_pyro: 46.6,
  dmg_normal: 8,
  dmg_charged: 16,
  dmg_skill: 32,
  dmg_burst: 64,
  mastery_base: 200,
  atk_percent: 50,
  hp_percent: 46.6,
};

interface Scenario {
  id: string;
  char: string;
  weapon: string;
  constellation?: number;
  weaponRefine?: number;
  toggles?: Record<string, boolean>;
  stacks?: Record<string, number>;
  selects?: Record<string, string>;
  reaction?: "vaporize" | "melt" | "quicken";
  block?: Record<string, number>;
  sets?: EquippedSet[];
  party?: { members: { slug: string; settings: Record<string, number | boolean> }[] };
  /** repo-relative fixture path under tests/golden/fixtures, or null = engine-gated only */
  fixture: string | null;
}

const S = (s: Scenario) => s;

// ---------------------------------------------------------------------------
// Roster sweep: manifest-driven scenarios for every char-keyed oracle family.
// ---------------------------------------------------------------------------

interface ManifestEntry {
  slug: string;
  char: { level: number; ascension: number; constellation: number };
  weapon: { name: string; refine: number; passiveToggles: Record<string, unknown> };
  charToggles: Record<string, unknown>;
  setToggles: Record<string, unknown>;
  artifactSets: Record<string, number>;
  statBlock: string | Record<string, number>;
  enemy: { level: number; res: number };
}

function resolveBlock(b: ManifestEntry["statBlock"]): Record<string, number> {
  if (typeof b === "object") return b;
  if (b === "sampleStats") return SAMPLE_BLOCK;
  if (b === "high-atk-hp") return HIGH_ATK_HP_BLOCK;
  throw new Error(`unknown statBlock name: ${b}`);
}

/** Manifest toggles carry booleans (checkbox), numbers (stacks/sliders) and — in
 *  principle — strings (dropdowns); route each to the BuildForm field the app uses. */
function splitToggles(
  ...maps: Record<string, unknown>[]
): Pick<Scenario, "toggles" | "stacks" | "selects"> {
  const toggles: Record<string, boolean> = {};
  const stacks: Record<string, number> = {};
  const selects: Record<string, string> = {};
  for (const map of maps) {
    for (const [k, v] of Object.entries(map)) {
      if (typeof v === "boolean") toggles[k] = v;
      else if (typeof v === "number") stacks[k] = v;
      else if (typeof v === "string") selects[k] = v;
    }
  }
  return {
    ...(Object.keys(toggles).length ? { toggles } : {}),
    ...(Object.keys(stacks).length ? { stacks } : {}),
    ...(Object.keys(selects).length ? { selects } : {}),
  };
}

function manifestScenarios(): Scenario[] {
  const out: Scenario[] = [];
  // reaction-override families: rep slug → the settings.reaction the config applies
  const REACTION_BY_FAMILY: Record<string, Record<string, "vaporize" | "melt" | "quicken">> = {
    reactions: { mona: "vaporize", ganyu: "melt" },
    catalyze: { fischl: "quicken", baizhu: "quicken" },
  };

  // (family dir, fixture subdir, constellation override)
  const FAMILIES: { dir: string; fixtureDir?: string; consOverride?: number; idPrefix?: string }[] = [
    // base = the constellations manifest entries at C0 → ROOT fixtures
    { dir: "constellations", fixtureDir: "", consOverride: 0, idPrefix: "base" },
    { dir: "constellations" },
    { dir: "weapon-passive" },
    { dir: "weapon-refine" },
    { dir: "toggles" },
    { dir: "cons-mid" },
    { dir: "set-4pc" },
    { dir: "set-2pc" },
    { dir: "stat-variance" },
    { dir: "full-build" },
    { dir: "reactions" },
    { dir: "catalyze" },
  ];

  for (const fam of FAMILIES) {
    const manifest = JSON.parse(
      readFileSync(join(FIXTURES, fam.dir, "_manifest.json"), "utf8")
    ) as { characters: ManifestEntry[] };
    for (const entry of manifest.characters) {
      const cons = fam.consOverride ?? entry.char.constellation;
      const fixtureDir = fam.fixtureDir ?? fam.dir;
      const reaction = REACTION_BY_FAMILY[fam.dir]?.[entry.slug];
      out.push({
        id: `${fam.idPrefix ?? fam.dir}/${entry.slug}`,
        char: entry.slug,
        weapon: entry.weapon.name.replace(/^weapon_name\./, ""),
        constellation: cons,
        weaponRefine: entry.weapon.refine,
        ...splitToggles(entry.charToggles, entry.setToggles, entry.weapon.passiveToggles),
        ...(reaction ? { reaction } : {}),
        block: resolveBlock(entry.statBlock),
        sets: Object.entries(entry.artifactSets).map(([setKey, pieces]) => ({ setKey, pieces })),
        fixture: fixtureDir === "" ? `${entry.slug}.json` : `${fixtureDir}/${entry.slug}.json`,
      });
    }
  }
  return out;
}

const SCENARIOS: Scenario[] = [
  // ---------- Hu Tao (pyro polearm; oracle default blackcliff_pole) ----------
  S({ id: "hu-tao-base", char: "hu_tao", weapon: "blackcliff_pole", fixture: "hu_tao.json" }),
  S({ id: "hu-tao-c6", char: "hu_tao", weapon: "blackcliff_pole", constellation: 6, fixture: "constellations/hu_tao.json" }),
  S({ id: "hu-tao-c2", char: "hu_tao", weapon: "blackcliff_pole", constellation: 2, fixture: "cons-mid/hu_tao.json" }),
  S({ id: "hu-tao-weapon-passive", char: "hu_tao", weapon: "blackcliff_pole", stacks: { weapon_blackcliff_pole: 3 }, fixture: "weapon-passive/hu_tao.json" }),
  S({ id: "hu-tao-paramita", char: "hu_tao", weapon: "blackcliff_pole", toggles: { hutao_paramita_papilio: true }, fixture: "toggles/hu_tao.json" }),
  S({
    id: "hu-tao-shimenawa4", char: "hu_tao", weapon: "blackcliff_pole",
    sets: [{ setKey: "ShimenawasReminiscence", pieces: 4 }],
    toggles: { "set.shimenawas_reminiscence_4": true },
    fixture: "set-4pc/hu_tao.json",
  }),
  S({ id: "hu-tao-statvar", char: "hu_tao", weapon: "blackcliff_pole", block: HIGH_ATK_HP_BLOCK, fixture: "stat-variance/hu_tao.json" }),
  S({
    id: "hu-tao-fullbuild", char: "hu_tao", weapon: "blackcliff_pole",
    constellation: 6, weaponRefine: 5, block: HIGH_ATK_HP_BLOCK,
    sets: [{ setKey: "CrimsonWitch", pieces: 4 }],
    toggles: { hutao_paramita_papilio: true },
    stacks: { weapon_blackcliff_pole: 3, "set.crimson_witch_of_flames_4": 3 },
    fixture: "full-build/hu_tao.json",
  }),
  // reaction override — engine-gated (amp policy golden-tested; reactions/mona+ganyu fixtures cover the channel)
  S({ id: "hu-tao-vaporize", char: "hu_tao", weapon: "staff_of_homa", toggles: { hutao_paramita_papilio: true }, reaction: "vaporize", fixture: null }),

  // ---------- Keqing (electro sword) ----------
  S({ id: "keqing-base", char: "keqing", weapon: "the_alley_flash", fixture: "keqing.json" }),
  S({ id: "keqing-c6", char: "keqing", weapon: "the_alley_flash", constellation: 6, fixture: "constellations/keqing.json" }),
  S({ id: "keqing-weapon-passive", char: "keqing", weapon: "the_alley_flash", toggles: { weapon_alley_flash: true }, fixture: "weapon-passive/keqing.json" }),
  S({ id: "keqing-tf4", char: "keqing", weapon: "the_alley_flash", sets: [{ setKey: "ThunderingFury", pieces: 4 }], fixture: "set-4pc/keqing.json" }),
  S({ id: "keqing-quicken", char: "keqing", weapon: "the_alley_flash", reaction: "quicken", fixture: null }),

  // ---------- Nahida (dendro catalyst) ----------
  S({ id: "nahida-base", char: "nahida", weapon: "solar_pearl", fixture: "nahida.json" }),
  S({ id: "nahida-c6", char: "nahida", weapon: "solar_pearl", constellation: 6, fixture: "constellations/nahida.json" }),
  S({ id: "nahida-c4", char: "nahida", weapon: "solar_pearl", constellation: 4, fixture: "cons-mid/nahida.json" }),
  S({
    id: "nahida-toggles", char: "nahida", weapon: "solar_pearl",
    toggles: { nahida_compassion_illuminated: true, nahida_illusory_heart: true },
    stacks: { party_max_mastery: 1000 },
    fixture: "toggles/nahida.json",
  }),
  S({
    id: "nahida-deepwood4", char: "nahida", weapon: "solar_pearl",
    sets: [{ setKey: "DeepwoodMemories", pieces: 4 }],
    toggles: { "set.deepwood_memories_4": true },
    fixture: "set-4pc/nahida.json",
  }),
  S({ id: "nahida-spread", char: "nahida", weapon: "solar_pearl", reaction: "quicken", fixture: null }),

  // ---------- Kazuha (anemo sword) ----------
  S({ id: "kazuha-base", char: "kaedehara_kazuha", weapon: "the_alley_flash", fixture: "kaedehara_kazuha.json" }),
  S({ id: "kazuha-c6", char: "kaedehara_kazuha", weapon: "the_alley_flash", constellation: 6, fixture: "constellations/kaedehara_kazuha.json" }),
  S({ id: "kazuha-vv4", char: "kaedehara_kazuha", weapon: "the_alley_flash", sets: [{ setKey: "ViridescentVenerer", pieces: 4 }], fixture: "set-4pc/kaedehara_kazuha.json" }),
  S({
    id: "kazuha-vv-pyro", char: "kaedehara_kazuha", weapon: "the_alley_flash",
    sets: [{ setKey: "ViridescentVenerer", pieces: 4 }],
    selects: { "set.viridescent_venerer_4": "pyro" },
    fixture: "party/viridescent-venerer-pyro.json",
  }),
  S({
    id: "kazuha-fullbuild", char: "kaedehara_kazuha", weapon: "the_alley_flash",
    constellation: 2, weaponRefine: 5, block: HIGH_ATK_HP_BLOCK,
    sets: [{ setKey: "ViridescentVenerer", pieces: 4 }],
    toggles: { weapon_alley_flash: true },
    fixture: "full-build/kaedehara_kazuha.json",
  }),
  // pyro resonance via real teammates — engine-gated (party channel is burndown-gated vs her engine)
  S({
    id: "kazuha-team-pyro-resonance", char: "kaedehara_kazuha", weapon: "the_alley_flash",
    party: { members: [{ slug: "diluc", settings: {} }, { slug: "klee", settings: {} }] },
    fixture: null,
  }),

  // ---------- Furina (hydro sword) ----------
  S({ id: "furina-base", char: "furina", weapon: "the_alley_flash", fixture: "furina.json" }),
  S({ id: "furina-c6", char: "furina", weapon: "the_alley_flash", constellation: 6, fixture: "constellations/furina.json" }),
  S({ id: "furina-c3", char: "furina", weapon: "the_alley_flash", constellation: 3, fixture: "cons-mid/furina.json" }),
  S({ id: "furina-offers", char: "furina", weapon: "the_alley_flash", stacks: { furina_hp_offers: 4 }, fixture: "toggles/furina.json" }),
  S({
    id: "furina-marechaussee4", char: "furina", weapon: "the_alley_flash",
    sets: [{ setKey: "MarechausseeHunter", pieces: 4 }],
    stacks: { "set.marechaussee_hunter_4": 3 },
    fixture: "set-4pc/furina.json",
  }),
  S({
    id: "furina-c1-fanfare-floor", char: "furina", weapon: "the_alley_flash",
    constellation: 1, stacks: { furina_fanfare_stacks: 50 },
    fixture: "self-buffs/furina-c1-fanfare-floor.json",
  }),
  S({
    id: "furina-c2-fanfare-hp", char: "furina", weapon: "the_alley_flash",
    constellation: 2, stacks: { furina_fanfare_stacks: 600 },
    fixture: "self-buffs/furina-c2-fanfare-hp.json",
  }),
  S({ id: "furina-statvar", char: "furina", weapon: "the_alley_flash", block: HIGH_ATK_HP_BLOCK, fixture: "stat-variance/furina.json" }),

  // ---------- catalyze fixture reps (browser Quicken option, fixture-gated) ----------
  S({
    id: "fischl-aggravate", char: "fischl", weapon: "alley_hunter",
    sets: [{ setKey: "ThunderingFury", pieces: 4 }], reaction: "quicken",
    fixture: "catalyze/fischl.json",
  }),
  S({
    id: "baizhu-spread", char: "baizhu", weapon: "solar_pearl",
    toggles: { baizhu_all_things_are_of_the_earth: true }, reaction: "quicken",
    fixture: "catalyze/baizhu.json",
  }),
];

function toForm(s: Scenario): BuildForm {
  return {
    ...DEFAULT_FORM,
    characterKey: s.char,
    weaponKey: s.weapon,
    constellation: s.constellation ?? 0,
    weaponRefine: s.weaponRefine ?? 1,
    conditions: {
      toggles: s.toggles ?? {},
      stacks: s.stacks ?? {},
      ...(s.selects ? { selects: s.selects } : {}),
      ...(s.reaction ? { reaction: s.reaction } : {}),
    },
    manualStats: s.block ?? SAMPLE_BLOCK,
    manualSets: s.sets ?? [],
    ...(s.party ? { party: s.party } : {}),
  };
}

interface FixtureFeature {
  average: number;
  crit: number;
  normal: number;
  category: string;
}

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

const ALL_SCENARIOS: Scenario[] = [...manifestScenarios(), ...SCENARIOS];

describe("browser sweep expectation generation (Aspirine-gated)", () => {
  it("gates every fixture scenario against the oracle and writes the browser fixture", () => {
    const out: unknown[] = [];
    const warnings: string[] = [];
    const failures: string[] = [];

    for (const s of ALL_SCENARIOS) {
      const form = toForm(s);
      const { statBlock, setBonuses } = assembleFromManual(form.manualStats, form.manualSets);
      const result = computeBuild(form, statBlock, setBonuses);
      if (result.error !== undefined || result.features.length === 0) {
        failures.push(`${s.id}: computeBuild error: ${result.error ?? "no features"}`);
        continue;
      }

      const engine = new Map(result.features.map((f) => [f.key, f.triple]));

      if (s.fixture) {
        const path = join(FIXTURES, s.fixture);
        if (!existsSync(path)) {
          failures.push(`${s.id}: fixture missing at ${s.fixture}`);
          continue;
        }
        const fx = JSON.parse(readFileSync(path, "utf8"));
        const fxFeatures: Record<string, FixtureFeature> = fx.features;

        let compared = 0;
        for (const [key, ff] of Object.entries(fxFeatures)) {
          if (ff.category === "stats" || key.startsWith("weapon.")) continue;
          const triple = engine.get(key);
          if (!triple) {
            warnings.push(`${s.id}: fixture feature ${key} ABSENT from engine output`);
            continue;
          }
          compared++;
          const isDamage = Boolean((ff as { damageType?: string }).damageType);
          if (isDamage) {
            // DAMAGE outputs: hard Aspirine gate (same bar as the golden suites) —
            // collected, not aborted, so one bad scenario doesn't hide the rest.
            if (
              Math.abs(triple[0] - ff.normal) > TOLERANCE ||
              Math.abs(triple[1] - ff.crit) > TOLERANCE ||
              Math.abs(triple[2] - ff.average) > TOLERANCE
            ) {
              failures.push(
                `${s.id} ${key}: engine [${triple.join(", ")}] vs oracle [${ff.normal}, ${ff.crit}, ${ff.average}]`
              );
            }
          } else if (Math.abs(triple[2] - ff.average) > TOLERANCE) {
            // NON-DAMAGE outputs (heals/shields/static readouts): outside the golden
            // damage gate — a mismatch is a pass FINDING, not an abort.
            warnings.push(
              `${s.id}: FINDING non-damage ${key}: engine ${triple[2]} vs oracle ${ff.average}`
            );
          }
        }
        if (compared <= 3) failures.push(`${s.id}: only ${compared} shared features compared`);

        // engine-only extras (excluding stats readouts) are worth eyeballing too
        const fxKeys = new Set(Object.keys(fxFeatures));
        for (const key of engine.keys()) {
          if (key.startsWith("stats.") || key.startsWith("rotation.") || key.startsWith("weapon.")) continue;
          if (!fxKeys.has(key)) warnings.push(`${s.id}: engine feature ${key} absent from fixture`);
        }
      }

      // Browser checks: top-3 damage features by average (skip stats readouts + heals,
      // whose DOM rendering the arc e2e already covers; heals are fixture-gated above).
      const damage = result.features
        .filter(
          (f) =>
            !f.key.startsWith("stats.") &&
            Number.isFinite(f.triple[2]) &&
            // exclude non-crit readouts/heals (normal==crit==avg) from DOM checks —
            // heal display is arc-e2e-covered; readouts are gated engine-side above
            !(f.triple[0] === f.triple[1] && f.triple[1] === f.triple[2])
        )
        .sort((a, b) => b.triple[2] - a.triple[2])
        .slice(0, 3);
      out.push({
        id: s.id,
        char: s.char,
        hash: encodeBuild(form),
        checks: damage.map((f) => ({ featureKey: f.key, avg: Math.round(f.triple[2]), text: fmt(f.triple[2]) })),
      });
    }

    writeFileSync(OUT, JSON.stringify(out, null, 1));
    writeFileSync(
      join(HERE, "..", "..", "e2e", "fixtures", "browser-pilot-warnings.json"),
      JSON.stringify(warnings, null, 1)
    );
    // Warnings are informational (key-set asymmetries / non-damage findings) — reviewed by hand.
    // Damage failures are the hard gate, reported all at once.
    expect(failures, `${failures.length} damage-gate failures:\n${failures.join("\n")}`).toEqual([]);
  });
});
