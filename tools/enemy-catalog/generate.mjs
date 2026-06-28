#!/usr/bin/env node
/**
 * generate.mjs — enemy preset catalog generator
 *
 * Reads the 10 raw enemy JS files from raw/genshin_calc_pub/src/js/db/Enemies/
 * and emits packages/data/src/generated/enemyCatalog.ts.
 *
 * Each DbObjectEnemy provides:
 *   - JS key name  → display `name` (PascalCase → space-separated)
 *   - name: '...' → `slug` (internal id)
 *   - resistances: { phys, pyro, ... } → mapped with phys→physical
 *
 * Handles variable-reference resistances (e.g. `resistances: humanRes`)
 * by pre-parsing const-defined resistance objects from each file.
 *
 * Run from project root:
 *   node tools/enemy-catalog/generate.mjs
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, "..", "..");

// ── Constants ─────────────────────────────────────────────────────────────────

const ENEMIES_DIR = join(
  root,
  "raw",
  "genshin_calc_pub",
  "src",
  "js",
  "db",
  "Enemies"
);

const OUT_FILE = join(
  root,
  "packages",
  "data",
  "src",
  "generated",
  "enemyCatalog.ts"
);

// Element order matches buildStats.ts ELEMENTS (physical uses engine key, not raw 'phys')
const ELEMENT_ORDER = [
  "physical",
  "pyro",
  "hydro",
  "electro",
  "cryo",
  "anemo",
  "geo",
  "dendro",
];

// Raw key for physical in Aspirine's data is "phys" → mapped to "physical"
const RAW_TO_ENGINE_KEY = /** @type {Record<string,string>} */ ({
  phys: "physical",
  pyro: "pyro",
  hydro: "hydro",
  electro: "electro",
  cryo: "cryo",
  anemo: "anemo",
  geo: "geo",
  dendro: "dendro",
});

const ENEMY_FILES = [
  "Hilichurl.js",
  "Elemental.js",
  "Automaton.js",
  "Fatui.js",
  "Abyss.js",
  "Magical.js",
  "TreasureHoarders.js",
  "HydroMimics.js",
  "Bosses.js",
  "LocalLegends.js",
];

/** Maps each source filename to its human-readable category label. */
const CATEGORY_MAP = /** @type {Record<string,string>} */ ({
  "Hilichurl.js": "Hilichurls",
  "Elemental.js": "Elemental Lifeforms",
  "Automaton.js": "Automatons",
  "Fatui.js": "Fatui",
  "Abyss.js": "Abyss Order",
  "Magical.js": "Mystical Beasts",
  "TreasureHoarders.js": "Treasure Hoarders",
  "HydroMimics.js": "Hydro Mimics",
  "Bosses.js": "Bosses",
  "LocalLegends.js": "Local Legends",
});

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Convert PascalCase JS key to display name with spaces.
 * "HilichurlFighter" → "Hilichurl Fighter"
 *
 * @param {string} key
 */
function pascalToDisplay(key) {
  return key.replace(/([A-Z])/g, (c, _m, i) => (i > 0 ? " " + c : c)).trim();
}

/**
 * Extract the content between the first `{` and its matching `}` in `text`
 * starting at `start`. Returns the inner text (excluding the outer braces)
 * and the end index of the closing `}`.
 *
 * @param {string} text
 * @param {number} start - index at or before the opening `{`
 * @returns {{ inner: string; end: number } | null}
 */
function extractBraceBlock(text, start) {
  // Find the opening { at or after start
  let i = start;
  while (i < text.length && text[i] !== "{") i++;
  if (i >= text.length) return null;

  let depth = 0;
  let blockStart = -1;

  while (i < text.length) {
    const ch = text[i];
    if (ch === "{") {
      depth++;
      if (depth === 1) blockStart = i + 1;
    } else if (ch === "}") {
      depth--;
      if (depth === 0) {
        return { inner: text.slice(blockStart, i), end: i };
      }
    }
    i++;
  }
  return null;
}

/**
 * Parse resistances from an inline block string like:
 *   " phys: 10, pyro: 10, ..."
 *
 * @param {string} blockInner
 * @returns {Record<string,number>}
 */
function parseResistanceBlock(blockInner) {
  const res = /** @type {Record<string,number>} */ ({});
  const re = /(\w+):\s*(-?\d+)/g;
  let m;
  while ((m = re.exec(blockInner)) !== null) {
    const rawKey = m[1];
    const engineKey = RAW_TO_ENGINE_KEY[rawKey];
    if (engineKey) {
      res[engineKey] = parseInt(m[2], 10);
    }
  }
  return res;
}

/**
 * Pre-pass: extract any `const <name> = { phys: ..., pyro: ..., ... }` definitions
 * from the file text. Only captures objects whose content contains the "phys:" key
 * so we don't accidentally capture non-resistance objects.
 *
 * @param {string} text
 * @returns {Map<string, Record<string,number>>}  varName → engine-keyed resistances
 */
function extractConstResistances(text) {
  const map = new Map();
  const constRe = /\bconst\s+(\w+)\s*=\s*\{/g;
  let m;
  while ((m = constRe.exec(text)) !== null) {
    const varName = m[1];
    const block = extractBraceBlock(text, m.index + m[0].length - 1);
    if (!block) continue;
    // Only treat as a resistance object if it contains "phys:"
    if (!/\bphys\s*:/.test(block.inner)) continue;
    const res = parseResistanceBlock(block.inner);
    if (Object.keys(res).length > 0) {
      map.set(varName, res);
    }
  }
  return map;
}

/**
 * Extract all DbObjectEnemy entries from a single JS file's text.
 * Returns an array of { name: displayName, slug, resistances }.
 *
 * @param {string} text
 * @param {string} filename  (for error messages)
 */
function extractEnemiesFromFile(text, filename) {
  // Pre-pass: extract named resistance constants (e.g. humanRes, defaultRes)
  const constRes = extractConstResistances(text);

  const results = [];

  // Match each "KeyName: new DbObjectEnemy({"
  // Allow optional spaces before the colon (some entries have "Key : new DbObjectEnemy")
  const entryRe = /(\w+)\s*:\s*new DbObjectEnemy\s*\(\s*\{/g;
  let match;

  while ((match = entryRe.exec(text)) !== null) {
    const keyName = match[1].trim();
    // The opening `{` is the last char of the match
    const braceStart = match.index + match[0].length - 1;

    const block = extractBraceBlock(text, braceStart);
    if (!block) {
      console.warn(`[${filename}] Could not find end brace for ${keyName}`);
      continue;
    }

    const blockText = block.inner;

    // ── Extract `name:` ──
    const nameMatch = /\bname:\s*'([^']+)'/.exec(blockText);
    if (!nameMatch) {
      console.warn(`[${filename}] No 'name:' found in ${keyName} block`);
      continue;
    }
    const slug = nameMatch[1];

    // ── Extract `resistances:` ──
    let resistances;

    // Find `resistances:` in the block
    const resKeyMatch = /\bresistances:\s*(\w+|\{)/m.exec(blockText);
    if (!resKeyMatch) {
      console.warn(
        `[${filename}] No 'resistances:' found in ${keyName} block`
      );
      continue;
    }

    const afterResKey = resKeyMatch[1];

    if (afterResKey === "{") {
      // Inline block: `resistances: { ... }`
      const resIdx = blockText.indexOf("resistances:");
      const resBlock = extractBraceBlock(blockText, resIdx + "resistances:".length);
      if (!resBlock) {
        console.warn(
          `[${filename}] Could not find end of resistances block in ${keyName}`
        );
        continue;
      }
      resistances = parseResistanceBlock(resBlock.inner);
    } else {
      // Variable reference: `resistances: humanRes` / `resistances: defaultRes`
      const varResistances = constRes.get(afterResKey);
      if (varResistances) {
        resistances = { ...varResistances };
      } else {
        console.warn(
          `[${filename}] Unknown resistance variable '${afterResKey}' in ${keyName}`
        );
        continue;
      }
    }

    // Verify all 8 elements are present; fill missing with 10 (game default)
    const missing = ELEMENT_ORDER.filter((el) => !(el in resistances));
    if (missing.length > 0) {
      console.warn(
        `[${filename}] ${keyName}: missing resistance keys: ${missing.join(", ")} (defaulting to 10)`
      );
      for (const el of missing) {
        resistances[el] = 10;
      }
    }

    results.push({
      name: pascalToDisplay(keyName),
      slug,
      resistances,
    });
  }

  return results;
}

// ── Main ─────────────────────────────────────────────────────────────────────

const allEnemies = [];

for (const filename of ENEMY_FILES) {
  const filepath = join(ENEMIES_DIR, filename);
  const text = readFileSync(filepath, "utf8");
  const category = CATEGORY_MAP[filename];
  const enemies = extractEnemiesFromFile(text, filename);
  allEnemies.push(...enemies.map((e) => ({ ...e, category })));
  console.log(`  ${filename} (${category}): ${enemies.length} enemies`);
}

console.log(`\nTotal: ${allEnemies.length} enemies`);

// ── Generate TypeScript ───────────────────────────────────────────────────────

function fmtRes(resistances) {
  return (
    "{ " +
    ELEMENT_ORDER.map((el) => `${el}: ${resistances[el] ?? 10}`).join(", ") +
    " }"
  );
}

const lines = [
  "// GENERATED — do not edit by hand; regenerate via: node tools/enemy-catalog/generate.mjs",
  "//",
  `// Source: raw/genshin_calc_pub/src/js/db/Enemies/ (${ENEMY_FILES.length} files)`,
  `// ${allEnemies.length} enemies extracted`,
  "",
  "/** Per-element resistance preset from Aspirine's enemy database. */",
  "export interface EnemyPreset {",
  "  /** Human-readable display name (e.g. \"Pyro Regisvine\"). */",
  "  name: string;",
  "  /** Internal slug from raw db (e.g. \"pyro_regisvine\"). */",
  "  slug: string;",
  "  /** Enemy category derived from its source file (e.g. \"Hilichurls\"). */",
  "  category: string;",
  "  /**",
  "   * Per-element resistances (%) in engine key format.",
  "   * raw 'phys' is mapped to 'physical' so these keys match",
  "   * buildStats.ts ELEMENTS and the enemy_res_<el> bag keys.",
  "   */",
  "  resistances: {",
  "    physical: number;",
  "    pyro: number;",
  "    hydro: number;",
  "    electro: number;",
  "    cryo: number;",
  "    anemo: number;",
  "    geo: number;",
  "    dendro: number;",
  "  };",
  "}",
  "",
  "export const ENEMY_CATALOG: EnemyPreset[] = [",
];

for (const enemy of allEnemies) {
  lines.push(
    `  { name: ${JSON.stringify(enemy.name)}, slug: ${JSON.stringify(enemy.slug)}, category: ${JSON.stringify(enemy.category)}, resistances: ${fmtRes(enemy.resistances)} },`
  );
}

lines.push("];", "");

writeFileSync(OUT_FILE, lines.join("\n"), "utf8");
console.log(`\nWrote ${OUT_FILE}`);
