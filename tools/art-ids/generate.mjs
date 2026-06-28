#!/usr/bin/env node
/**
 * generate.mjs — art/icon id table generator
 *
 * Sources:
 *   tools/art-ids/vendor/enka-characters.json  (Enka Network characters API)
 *   tools/art-ids/vendor/ambr-weapons.json      (Ambr.top weapons API)
 *
 * Reads ALL_CHARACTERS + ALL_WEAPONS gameIds from the built @genshin/data
 * and emits packages/data/src/generated/artIds.ts.
 *
 * Run from project root:
 *   node tools/art-ids/generate.mjs
 */

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, "..", "..");

// ── vendor JSONs ─────────────────────────────────────────────────────────────
const enkaChars = JSON.parse(
  readFileSync(join(__dir, "vendor", "enka-characters.json"), "utf8")
);
const ambrWeapons = JSON.parse(
  readFileSync(join(__dir, "vendor", "ambr-weapons.json"), "utf8")
);
const ambrItems = ambrWeapons.data.items; // { "13501": { icon: "UI_EquipIcon_Pole_Homa", ... } }

// ── roster from built package ─────────────────────────────────────────────────
const { ALL_CHARACTERS, ALL_WEAPONS } = await import(
  join(root, "packages", "data", "dist", "index.js")
);

// ── build CHAR_ICON ───────────────────────────────────────────────────────────
const SIDE_PREFIX = "UI_AvatarIcon_Side_";
const charIcon = {};

for (const char of ALL_CHARACTERS) {
  const entry = enkaChars[String(char.gameId)];
  if (!entry?.SideIconName) continue;
  const iconName = entry.SideIconName.startsWith(SIDE_PREFIX)
    ? entry.SideIconName.slice(SIDE_PREFIX.length)
    : entry.SideIconName;
  charIcon[char.name] = iconName;
}

// ── build WEAPON_ICON ─────────────────────────────────────────────────────────
const weaponIcon = {};

for (const weapon of ALL_WEAPONS) {
  const entry = ambrItems[String(weapon.gameId)];
  if (!entry?.icon) continue;
  weaponIcon[weapon.name] = entry.icon;
}

// ── sort deterministically ────────────────────────────────────────────────────
function sortedRecord(obj) {
  return Object.fromEntries(
    Object.entries(obj).sort(([a], [b]) => a.localeCompare(b))
  );
}

const sortedCharIcon = sortedRecord(charIcon);
const sortedWeaponIcon = sortedRecord(weaponIcon);

// ── coverage report ───────────────────────────────────────────────────────────
const charTotal = ALL_CHARACTERS.length;
const weapTotal = ALL_WEAPONS.length;
const charMatched = Object.keys(sortedCharIcon).length;
const weapMatched = Object.keys(sortedWeaponIcon).length;

console.log(`CHAR_ICON:   ${charMatched}/${charTotal} matched`);
console.log(`WEAPON_ICON: ${weapMatched}/${weapTotal} matched`);

const charMissed = ALL_CHARACTERS.filter(c => !sortedCharIcon[c.name]).map(c => `${c.name}(${c.gameId})`);
const weapMissed = ALL_WEAPONS.filter(w => !sortedWeaponIcon[w.name]).map(w => `${w.name}(${w.gameId})`);
if (charMissed.length) console.log("Unmatched chars:", charMissed.join(", "));
if (weapMissed.length) console.log("Unmatched weapons:", weapMissed.join(", "));

// ── spot checks ───────────────────────────────────────────────────────────────
const checks = [
  ["baizhu", sortedCharIcon["baizhu"], "Baizhuer"],
  ["hu_tao", sortedCharIcon["hu_tao"], "Hutao"],
  ["raiden_shogun", sortedCharIcon["raiden_shogun"], "Shougun"],
  ["staff_of_homa", sortedWeaponIcon["staff_of_homa"], "UI_EquipIcon_Pole_Homa"],
];
let allPassed = true;
for (const [key, got, want] of checks) {
  if (got === want) {
    console.log(`  ✓ ${key} → ${got}`);
  } else {
    console.error(`  ✗ ${key}: expected ${want}, got ${got}`);
    allPassed = false;
  }
}
if (!allPassed) process.exit(1);

// ── emit artIds.ts ────────────────────────────────────────────────────────────
function renderRecord(name, obj) {
  const entries = Object.entries(obj)
    .map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)},`)
    .join("\n");
  return `export const ${name}: Record<string, string> = {\n${entries}\n};`;
}

const out = `// GENERATED — do not edit by hand; regenerate via: node tools/art-ids/generate.mjs
//
// Sources:
//   tools/art-ids/vendor/enka-characters.json  (SideIconName → strip UI_AvatarIcon_Side_ → icon name)
//   tools/art-ids/vendor/ambr-weapons.json      (items[gameId].icon → full UI_EquipIcon_… name)
//
// CHAR_ICON:   ${charMatched}/${charTotal} of @genshin/data ALL_CHARACTERS matched
// WEAPON_ICON: ${weapMatched}/${weapTotal} of @genshin/data ALL_WEAPONS matched

${renderRecord("CHAR_ICON", sortedCharIcon)}

${renderRecord("WEAPON_ICON", sortedWeaponIcon)}
`;

const outPath = join(root, "packages", "data", "src", "generated", "artIds.ts");
writeFileSync(outPath, out, "utf8");
console.log(`\nWrote ${outPath}`);
