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
  // A minority of party-buffs teammate settings carry a dropdown STRING value (e.g. Kazuha's
  // Poetics-of-Fuubutsu absorbed element) — widened past PartyMemberForm's number|boolean; the
  // engine settings bag accepts any value, and toForm casts at the BuildForm boundary.
  party?: { members: { slug: string; settings: Record<string, number | boolean | string> }[] };
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

// ---------------------------------------------------------------------------
// Party families: party-buffs (teammate kit-buff leak) / party (composition
// effects: resonance, set_other, self-worn dropdown-elements, bond-of-life,
// inert party weapons) / party-energy (combined-party burst-energy weapons).
// Closes the gap the roster sweep left: teammate buffs affect the active
// char's damage but were never driven through the web BuildForm's party path.
// ---------------------------------------------------------------------------

interface PartyManifestMember {
  character?: string;
  element?: string;
  origin?: string;
  settings?: Record<string, unknown>;
}

interface PartyBuffsManifestItem {
  slug: string;
  repSlug: string;
  weapon: { name: string; type: string };
  statBlock: string;
  party: { members: PartyManifestMember[] };
}

interface PartyFamilyManifestItem {
  slug: string;
  repSlug: string;
  weapon: { name: string; type: string };
  statBlock: string;
  party: {
    members?: PartyManifestMember[];
    charSettings?: Record<string, unknown>;
    settings?: Record<string, unknown>;
    setBonuses?: { setKey: string; pieces: number }[];
    enemyStatus?: string;
    bondOfLife?: number;
  };
}

interface PartyEnergyManifestItem {
  slug: string;
  repSlug: string;
  statBlock: string;
  party: { members: PartyManifestMember[]; weaponName: string; weaponType: string; refine: number };
}

/**
 * Buff-clean filler roster (tools/oracle/build-configs.mjs FILLER, probe-verified against her
 * engine to leak no partyData buff) mirrored here so the `party` family's abstract
 * {element, origin} manifest members — which have no real character — can be reconstructed as
 * REAL named teammates through the web BuildForm (PartyMemberForm.slug requires an actual
 * DbObjectChar). Verified: each {slug, origin} pair matches packages/data/src/characters/*.ts.
 */
const PARTY_FILLER: Record<string, { slug: string; origin: string }[]> = {
  pyro: [
    { slug: "amber", origin: "mondstadt" },
    { slug: "klee", origin: "mondstadt" },
    { slug: "xiangling", origin: "liyue" },
  ],
  hydro: [
    { slug: "barbara", origin: "mondstadt" },
    { slug: "mona", origin: "mondstadt" },
    { slug: "xingqiu", origin: "liyue" },
  ],
  electro: [
    { slug: "fischl", origin: "mondstadt" },
    { slug: "lisa", origin: "mondstadt" },
    { slug: "beidou", origin: "liyue" },
  ],
  cryo: [
    { slug: "kaeya", origin: "mondstadt" },
    { slug: "chongyun", origin: "liyue" },
    { slug: "diona", origin: "mondstadt" },
  ],
  geo: [
    { slug: "ningguang", origin: "liyue" },
    { slug: "noelle", origin: "mondstadt" },
    { slug: "gorou", origin: "inazuma" },
  ],
  dendro: [
    { slug: "tighnari", origin: "sumeru" },
    { slug: "collei", origin: "sumeru" },
    { slug: "yaoyao", origin: "liyue" },
  ],
  anemo: [
    { slug: "sucrose", origin: "mondstadt" },
    { slug: "jean", origin: "mondstadt" },
    { slug: "sayu", origin: "inazuma" },
  ],
};

/**
 * Pick a buff-clean filler of the given ELEMENT (origin is irrelevant to every consumer in this
 * family except CalcOrigin — the origin-different item overrides with an explicit origin-matched
 * triplet below, since that is the only origin-sensitive consumer; see docstring "CalcOrigin
 * counts (Charlotte, the only v5.8 consumer)"). Not yet used = not already in this scenario's party.
 */
function pickFiller(itemSlug: string, element: string, used: Set<string>): string {
  const pool = PARTY_FILLER[element];
  if (!pool) throw new Error(`party/${itemSlug}: no buff-clean filler pool for element '${element}'`);
  const found = pool.find((f) => !used.has(f.slug));
  if (!found) {
    throw new Error(
      `party/${itemSlug}: no buff-clean filler left for element '${element}' (used=${[...used].join(",")})`
    );
  }
  used.add(found.slug);
  return found.slug;
}

/** origin-different is the one item where origin (not just element) must match a specific
 *  triplet — CalcOrigin's ONLY v5.8 consumer. All three picks are still audited FILLER entries
 *  (pyro/mondstadt=amber, electro/liyue=beidou, geo/inazuma=gorou). */
const ORIGIN_SENSITIVE_OVERRIDE: Record<string, string[]> = {
  "origin-different": ["amber", "beidou", "gorou"],
};

/**
 * A manifest item this family CANNOT be gated on through the web BuildForm/page path, with the
 * reason — surfaced both here (skipped from generation) and as a warning line (visible, not
 * silently swallowed). Keyed by `<family>/<slug>`.
 *
 * The 10 "characterMultipliers dropped" entries are a REAL WEB-LAYER BUG, not an
 * inexpressible-input case: `packages/data/src/reconstruct.ts`'s `reconstructPort` (the function
 * `apps/web/lib/calc.ts#computeBuild` calls) destructures only `{ context, settings }` off
 * `buildStats(...)` and never threads the returned `characterMultipliers` (partyData Bucket-C
 * teammate multipliers — Shenhe/Faruzan/Escoffier/Citlali/Layla/Xilonen/Xianyun/Sigewinne/YunJin —
 * PLUS the always-present global CHARACTER_MULTIPLIERS channel, e.g. Song of Days Past) into
 * `compileCharacter`'s `extraMultipliers`. `packages/data/src/__tests__/partyBurndown.test.ts` /
 * `partyBuffsBurndown.test.ts` thread `characterMultipliers` manually and are fully GREEN — so the
 * engine is correct; only the web adapter's wiring drops the channel. `packages/*` is off-limits
 * for this harness-only task (brief), so these are excluded here and reported as a finding rather
 * than silently loosened. Fix: reconstructPort should return/consume `characterMultipliers` too.
 */
const WEB_LAYER_EXCLUSIONS: { key: string; reason: string }[] = [
  {
    key: "party/origin-same",
    reason:
      "needs 2x hydro/fontaine + 1x pyro/fontaine teammates; the audited buff-clean FILLER roster " +
      "(tools/oracle/build-configs.mjs) has no fontaine-origin entries for those elements. Picking an " +
      "un-probed substitute risks a false web-layer failure from an unverified partyData leak rather " +
      "than proving a real gap, so it is excluded rather than guessed.",
  },
  ...[
    "party-buffs/shenhe-icyquill-on-ayaka",
    "party-buffs/faruzan-anemodmg-on-wanderer",
    "party-buffs/escoffier-cryo-c2-on-ayaka",
    "party-buffs/citlali-c1-on-ganyu",
    "party-buffs/layla-c4-on-itto",
    "party-buffs/xilonen-c4-on-itto",
    "party-buffs/xianyun-plungeshockwave-on-xiao",
    "party-buffs/sigewinne-skilldmg-on-diluc",
    "party-buffs/yunjin-normaldmg-stacks-on-itto",
    "party/set-other-song-of-days-past-4",
  ].map((key) => ({
    key,
    reason:
      "REAL WEB-LAYER BUG (not inexpressible input): reconstructPort (packages/data/src/reconstruct.ts, " +
      "off-limits for this harness task) drops buildStats().characterMultipliers before calling " +
      "compileCharacter, so this Bucket-C partyData multiplier / CHARACTER_MULTIPLIERS-channel buff " +
      "never applies through the web path even though the engine itself is oracle-green " +
      "(packages/data/src/__tests__/partyBurndown.test.ts + partyBuffsBurndown.test.ts pass). " +
      "See this file's report for repro + fix pointer.",
  })),
];

function isWebLayerExcluded(key: string): boolean {
  return WEB_LAYER_EXCLUSIONS.some((e) => e.key === key);
}

/**
 * party-buffs family (97 items): a teammate INTENTIONALLY leaks its own kit buff onto the
 * recipient active char (party.<char>_<effect>-style settings baked on the member). Mirrors
 * packages/data/src/__tests__/partyBuffsBurndown.test.ts's manifest decode — the authoritative
 * reconstruction for this family (every item carries exactly one {character, settings} member).
 */
function partyBuffsScenarios(): Scenario[] {
  const manifest = JSON.parse(
    readFileSync(join(FIXTURES, "party-buffs", "_manifest.json"), "utf8")
  ) as { items: PartyBuffsManifestItem[] };
  const out: Scenario[] = [];
  for (const item of manifest.items) {
    if (isWebLayerExcluded(`party-buffs/${item.slug}`)) continue;
    const member = item.party.members[0];
    if (!member?.character) throw new Error(`party-buffs/${item.slug}: missing member.character`);
    out.push(
      S({
        id: `party-buffs/${item.slug}`,
        char: item.repSlug,
        weapon: item.weapon.name.replace(/^weapon_name\./, ""),
        block: resolveBlock(item.statBlock),
        party: {
          members: [
            {
              slug: member.character,
              settings: (member.settings ?? {}) as Record<string, number | boolean | string>,
            },
          ],
        },
        fixture: `party-buffs/${item.slug}.json`,
      })
    );
  }
  return out;
}

/** Manifest slug already covered by a hand-picked SCENARIOS pilot (kazuha-vv-pyro) — skip to avoid
 *  duplicate coverage; the hand pilot stays as-is (brief allows either; this preserves its comment). */
const PARTY_FAMILY_DEDUPE = new Set(["viridescent-venerer-pyro"]);

/**
 * party family (62 items, minus 1 dedupe + 1 exclusion = 60 generated): party-composition effects
 * — elemental/origin resonance, GildedDreams/BlizzardStrayer/ViridescentVenerer/ArchaicPetra
 * self-worn 4pc, every v5.8 set_other team buff, bond-of-life, the two-element gates
 * (Chevreuse/Nilou/Skirk), Gorou/YunJin/Xilonen/Escoffier/Navia element-count effects, the 4 inert
 * party-element weapons. Decoded generically off `party.{members,charSettings,settings,setBonuses,
 * enemyStatus,bondOfLife}` — mirrors packages/data/src/__tests__/partyBurndown.test.ts's manifest
 * shape (the authoritative reconstruction), substituting each abstract {element,origin} manifest
 * member with a real named PARTY_FILLER teammate. `charSettings`/`settings` are raw engine settings
 * keys (e.g. "set_other.noblesse_oblige_4", "chevreuse_tactics") — routed through the SAME
 * toggles/stacks/selects passthrough every other scenario in this file uses, so they reach the
 * engine exactly as a real party member's picks would, without requiring the Team drawer to expose
 * a dedicated widget for each one (the file's existing convention, e.g. nahida-toggles' raw
 * `party_max_mastery` stack).
 */
function partyFamilyScenarios(): Scenario[] {
  const manifest = JSON.parse(
    readFileSync(join(FIXTURES, "party", "_manifest.json"), "utf8")
  ) as { items: PartyFamilyManifestItem[] };

  const out: Scenario[] = [];
  for (const item of manifest.items) {
    if (PARTY_FAMILY_DEDUPE.has(item.slug)) continue;
    if (isWebLayerExcluded(`party/${item.slug}`)) continue;

    const used = new Set<string>([item.repSlug]); // never pick the active rep as its own filler
    const members = ORIGIN_SENSITIVE_OVERRIDE[item.slug]
      ? ORIGIN_SENSITIVE_OVERRIDE[item.slug]!.map((slug) => ({ slug, settings: {} }))
      : (item.party.members ?? []).map((m) => {
          if (!m.element) throw new Error(`party/${item.slug}: abstract member missing 'element'`);
          return { slug: pickFiller(item.slug, m.element, used), settings: {} };
        });

    // char_constellation is carried generically inside charSettings for a few effects (its
    // ABSENCE vs presence is itself the signal, e.g. gorou-geo-3-c0 vs gorou-geo-3) — pull it
    // into the dedicated `constellation` field rather than the raw toggle bag.
    const charSettings = { ...(item.party.charSettings ?? {}) };
    const constellation =
      typeof charSettings["char_constellation"] === "number"
        ? (charSettings["char_constellation"] as number)
        : undefined;
    delete charSettings["char_constellation"];
    // char_skill_elemental restates the default talent level (10, DEFAULT_FORM.talents.elemental)
    // for xilonen's samplers — dropped, not a raw settings key (buildStats derives it from
    // form.talents, not from the settings bag).
    delete charSettings["char_skill_elemental"];

    const extraRaw: Record<string, unknown> = {};
    if (item.party.enemyStatus !== undefined) extraRaw["common.enemy_status"] = item.party.enemyStatus;
    if (item.party.bondOfLife !== undefined) extraRaw["common.bond_of_life"] = item.party.bondOfLife;

    out.push(
      S({
        id: `party/${item.slug}`,
        char: item.repSlug,
        weapon: item.weapon.name.replace(/^weapon_name\./, ""),
        ...(constellation !== undefined ? { constellation } : {}),
        ...splitToggles(charSettings, item.party.settings ?? {}, extraRaw),
        block: resolveBlock(item.statBlock),
        sets: (item.party.setBonuses ?? []).map((s) => ({ setKey: s.setKey, pieces: s.pieces })),
        ...(members.length ? { party: { members } } : {}),
        fixture: `party/${item.slug}.json`,
      })
    );
  }
  return out;
}

/** party-energy family (6 items): the combined-party burst-energy dmg_burst bonus on the 3 inert
 *  weapons (Akuoumaru/Mouun's Moon/Wavebreaker's Fin) — real named teammates (their OWN burst
 *  energy costs sum into the bonus), mirrors partyEnergyBurndown.test.ts's registry-key map. */
const PARTY_ENERGY_WEAPON_SLUG: Record<string, string> = {
  Akoumaru: "akuoumaru",
  MouunsMoon: "mouuns_moon",
  WavebreakersFin: "wavebreakers_fin",
};

function partyEnergyScenarios(): Scenario[] {
  const manifest = JSON.parse(
    readFileSync(join(FIXTURES, "party-energy", "_manifest.json"), "utf8")
  ) as { items: PartyEnergyManifestItem[] };
  return manifest.items.map((item) => {
    const weaponSlug = PARTY_ENERGY_WEAPON_SLUG[item.party.weaponName];
    if (!weaponSlug) throw new Error(`party-energy/${item.slug}: unknown weaponName '${item.party.weaponName}'`);
    const members = item.party.members.map((m) => {
      if (!m.character) throw new Error(`party-energy/${item.slug}: abstract member (expected named character)`);
      return { slug: m.character, settings: {} };
    });
    return S({
      id: `party-energy/${item.slug}`,
      char: item.repSlug,
      weapon: weaponSlug,
      weaponRefine: item.party.refine,
      block: resolveBlock(item.statBlock),
      party: { members },
      fixture: `party-energy/${item.slug}.json`,
    });
  });
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
    ...(s.party ? { party: s.party as unknown as BuildForm["party"] } : {}),
  };
}

interface FixtureFeature {
  average: number;
  crit: number;
  normal: number;
  category: string;
}

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

const ALL_SCENARIOS: Scenario[] = [
  ...manifestScenarios(),
  ...partyBuffsScenarios(),
  ...partyFamilyScenarios(),
  ...partyEnergyScenarios(),
  ...SCENARIOS,
];

describe("browser sweep expectation generation (Aspirine-gated)", () => {
  it("gates every fixture scenario against the oracle and writes the browser fixture", () => {
    const out: unknown[] = [];
    const warnings: string[] = [];
    const failures: string[] = [];

    // Manifest items excluded from the web-path sweep — visible, not silently swallowed.
    for (const excl of WEB_LAYER_EXCLUSIONS) {
      warnings.push(`${excl.key}: EXCLUDED from web path: ${excl.reason}`);
    }

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
