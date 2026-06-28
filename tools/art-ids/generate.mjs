#!/usr/bin/env node
/**
 * generate.mjs — art/icon id table generator
 *
 * Sources:
 *   tools/art-ids/vendor/enka-characters.json  (Enka Network characters API)
 *   tools/art-ids/vendor/ambr-weapons.json      (Ambr.top weapons API)
 *   raw/genshin_calc_pub/src/js/db/Artifacts/Set/*.js  (ArtifactSet gameId fields)
 *
 * Reads ALL_CHARACTERS + ALL_WEAPONS + ARTIFACT_SETS from the built @genshin/data
 * and emits packages/data/src/generated/artIds.ts.
 *
 * Run from project root:
 *   node tools/art-ids/generate.mjs
 */

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
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
const { ALL_CHARACTERS, ALL_WEAPONS, ARTIFACT_SETS } = await import(
  join(root, "packages", "data", "dist", "index.js")
);

// ── helpers ───────────────────────────────────────────────────────────────────
function sortedRecord(obj) {
  return Object.fromEntries(
    Object.entries(obj).sort(([a], [b]) => a.localeCompare(b))
  );
}

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

// ── build SET_ICON ────────────────────────────────────────────────────────────
// Source: raw/genshin_calc_pub/src/js/db/Artifacts/Set/*.js
// Each file contains: goodId: '<RawGoodId>', gameId: <number>
// We map the TS goodId (from ARTIFACT_SETS) to the raw gameId.
//
// Where the TS goodId and raw goodId differ, this bridge table covers the gap.
// v6+ sets (no raw file) are silently skipped — no gameId available from raw.
const GOODID_BRIDGE = {
  "CrimsonWitch":                "CrimsonWitchOfFlames",
  "GladiatorFinale":             "GladiatorsFinale",
  "PrayersForSpringtime":        "PrayersToSpringtime",
  "TenacityofMillelith":         "TenacityOfTheMillelith",
  "ScrollOfTheEmberedCitysHero": "ScrollOfTheHeroOfCinderCity",
  "Exile":                       "TheExile",
  "DewflowersGlow":              "VourukashasGlow",
  "WandererTroupe":              "WanderersTroupe",
};

const rawSetDir = join(
  root, "raw", "genshin_calc_pub", "src", "js", "db", "Artifacts", "Set"
);
const rawSetFiles = readdirSync(rawSetDir).filter((f) => f.endsWith(".js"));

// Build rawGoodId → gameId; keep a lowercase variant for case-insensitive fallback.
const rawById = {};
const rawByIdLower = {};
for (const filename of rawSetFiles) {
  const content = readFileSync(join(rawSetDir, filename), "utf8");
  const goodIdMatch = content.match(/goodId:\s*'([^']+)'/);
  const gameIdMatch = content.match(/gameId:\s*(\d+)/);
  if (goodIdMatch && gameIdMatch) {
    const gid = goodIdMatch[1];
    const gameId = parseInt(gameIdMatch[1], 10);
    rawById[gid] = gameId;
    rawByIdLower[gid.toLowerCase()] = gameId;
  }
}

const setIcon = {};
for (const tsGoodId of Object.keys(ARTIFACT_SETS)) {
  const rawGoodId = GOODID_BRIDGE[tsGoodId] ?? tsGoodId;
  const gameId = rawById[rawGoodId] ?? rawByIdLower[rawGoodId.toLowerCase()];
  if (gameId !== undefined) {
    setIcon[tsGoodId] = gameId;
  }
}

// ── sort deterministically ────────────────────────────────────────────────────
const sortedCharIcon = sortedRecord(charIcon);
const sortedWeaponIcon = sortedRecord(weaponIcon);
const sortedSetIcon = sortedRecord(setIcon);

// ── coverage report ───────────────────────────────────────────────────────────
const charTotal = ALL_CHARACTERS.length;
const weapTotal = ALL_WEAPONS.length;
const setTotal = Object.keys(ARTIFACT_SETS).length;
const charMatched = Object.keys(sortedCharIcon).length;
const weapMatched = Object.keys(sortedWeaponIcon).length;
const setMatched = Object.keys(sortedSetIcon).length;

console.log(`CHAR_ICON:   ${charMatched}/${charTotal} matched`);
console.log(`WEAPON_ICON: ${weapMatched}/${weapTotal} matched`);
console.log(`SET_ICON:    ${setMatched}/${setTotal} matched (${setTotal - setMatched} v6+ sets skipped — no raw gameId)`);

const charMissed = ALL_CHARACTERS.filter(c => !sortedCharIcon[c.name]).map(c => `${c.name}(${c.gameId})`);
const weapMissed = ALL_WEAPONS.filter(w => !sortedWeaponIcon[w.name]).map(w => `${w.name}(${w.gameId})`);
if (charMissed.length) console.log("Unmatched chars:", charMissed.join(", "));
if (weapMissed.length) console.log("Unmatched weapons:", weapMissed.join(", "));

// ── spot checks ───────────────────────────────────────────────────────────────
const checks = [
  ["baizhu",       sortedCharIcon["baizhu"],                         "Baizhuer"],
  ["hu_tao",       sortedCharIcon["hu_tao"],                         "Hutao"],
  ["raiden_shogun",sortedCharIcon["raiden_shogun"],                   "Shougun"],
  ["staff_of_homa",sortedWeaponIcon["staff_of_homa"],                "UI_EquipIcon_Pole_Homa"],
  // SET_ICON spot checks: key = TS goodId, value = raw gameId
  ["CrimsonWitch", sortedSetIcon["CrimsonWitch"],  15006],  // raw CrimsonWitchOfFlames
  ["GladiatorFinale", sortedSetIcon["GladiatorFinale"], 15001],  // raw GladiatorsFinale
  ["NoblesseOblige", sortedSetIcon["NoblesseOblige"], 15007],
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
function renderStringRecord(name, obj) {
  const entries = Object.entries(obj)
    .map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)},`)
    .join("\n");
  return `export const ${name}: Record<string, string> = {\n${entries}\n};`;
}

function renderNumberRecord(name, obj) {
  const entries = Object.entries(obj)
    .map(([k, v]) => `  ${JSON.stringify(k)}: ${v},`)
    .join("\n");
  return `export const ${name}: Record<string, number> = {\n${entries}\n};`;
}

const out = `// GENERATED — do not edit by hand; regenerate via: node tools/art-ids/generate.mjs
//
// Sources:
//   tools/art-ids/vendor/enka-characters.json  (SideIconName → strip UI_AvatarIcon_Side_ → icon name)
//   tools/art-ids/vendor/ambr-weapons.json      (items[gameId].icon → full UI_EquipIcon_… name)
//   raw/genshin_calc_pub/src/js/db/Artifacts/Set/*.js  (ArtifactSet.goodId + ArtifactSet.gameId)
//
// CHAR_ICON:   ${charMatched}/${charTotal} of @genshin/data ALL_CHARACTERS matched
// WEAPON_ICON: ${weapMatched}/${weapTotal} of @genshin/data ALL_WEAPONS matched
// SET_ICON:    ${setMatched}/${setTotal} of @genshin/data ARTIFACT_SETS matched (${setTotal - setMatched} v6+ sets lack a raw gameId)

${renderStringRecord("CHAR_ICON", sortedCharIcon)}

${renderStringRecord("WEAPON_ICON", sortedWeaponIcon)}

${renderNumberRecord("SET_ICON", sortedSetIcon)}
`;

const outPath = join(root, "packages", "data", "src", "generated", "artIds.ts");
writeFileSync(outPath, out, "utf8");
console.log(`\nWrote ${outPath}`);
