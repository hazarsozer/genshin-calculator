#!/usr/bin/env node
/**
 * generate-enemy-icons.mjs — ENEMY_ICON table generator
 *
 * Source: tools/art-ids/vendor/ambr-monsters.json
 * Matches each ENEMY_CATALOG entry to an ambr monster by normalized name
 * (toLowerCase().replace(/[^a-z0-9]/g,'')).
 *
 * Emits: packages/data/src/generated/enemyIcons.ts
 *
 * Run from project root:
 *   node tools/art-ids/generate-enemy-icons.mjs
 */

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, "..", "..");

// ── vendor JSON ───────────────────────────────────────────────────────────────
const ambrMonsters = JSON.parse(
  readFileSync(join(__dir, "vendor", "ambr-monsters.json"), "utf8")
);
const monsterItems = ambrMonsters.data.items; // { id: { name, icon, ... } }

// ── roster from built package ─────────────────────────────────────────────────
const { ENEMY_CATALOG } = await import(
  join(root, "packages", "data", "dist", "index.js")
);

// ── helpers ───────────────────────────────────────────────────────────────────
function norm(s) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

// ── build normalized name → icon map from ambr ────────────────────────────────
// When multiple monsters share the same normalized name, keep the first.
const byNormName = {};
for (const item of Object.values(monsterItems)) {
  const key = norm(item.name);
  if (!byNormName[key]) {
    byNormName[key] = item.icon;
  }
}

// ── match ENEMY_CATALOG slugs → icon names ────────────────────────────────────
const enemyIcon = {};
const missed = [];

for (const e of ENEMY_CATALOG) {
  const icon = byNormName[norm(e.name)];
  if (icon) {
    enemyIcon[e.slug] = icon;
  } else {
    missed.push(e.name);
  }
}

const matched = Object.keys(enemyIcon).length;
const total = ENEMY_CATALOG.length;

console.log(`ENEMY_ICON: ${matched}/${total} matched`);
if (missed.length > 0) {
  console.log("Unmatched (first 20):", missed.slice(0, 20).join(", "));
}

// ── spot checks ───────────────────────────────────────────────────────────────
const checks = [
  ["hilichurl", enemyIcon["hilichurl"]],
  ["pyro_regisvine", enemyIcon["pyro_regisvine"]],
  ["stormterror_dvalin", enemyIcon["stormterror_dvalin"]],
];
for (const [key, val] of checks) {
  if (val) {
    console.log(`  ✓ ${key} → ${val}`);
  } else {
    console.log(`  - ${key} → (not matched)`);
  }
}

// ── emit enemyIcons.ts ────────────────────────────────────────────────────────
const entries = Object.entries(enemyIcon)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)},`)
  .join("\n");

const out = `// GENERATED — do not edit by hand; regenerate via: node tools/art-ids/generate-enemy-icons.mjs
//
// Source: tools/art-ids/vendor/ambr-monsters.json (normalized name match)
// Monster icons served at: https://gi.yatta.moe/assets/UI/monster/<icon>.png
//
// ENEMY_ICON: ${matched}/${total} of ENEMY_CATALOG matched (~${total - matched} graceful-fallback via FallbackImage gradient)

export const ENEMY_ICON: Record<string, string> = {
${entries}
};
`;

const outPath = join(
  root,
  "packages",
  "data",
  "src",
  "generated",
  "enemyIcons.ts"
);
writeFileSync(outPath, out, "utf8");
console.log(`\nWrote ${outPath}`);
