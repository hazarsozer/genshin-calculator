/**
 * nightweavers_looking_glass — 5★ catalyst (v6.0, live port; Lauma's signature)
 *
 * Sub-stat: Elemental Mastery. Passive "Millennial Hymn" — a Bloom/Lunar-Bloom support catalyst with
 * three layered effects:
 *   1. Prayer of the Far North: when the equipper's Elemental Skill deals Hydro/Dendro DMG → EM
 *      +60/75/90/105/120 (R1..R5) for 4.5s.
 *   2. New Moon Verse: when nearby party members trigger Lunar-Bloom → equipper EM +60/75/90/105/120
 *      for 10s. (Independent of (1); the two EM buffs STACK — the Dawning Frost two-toggle precedent.)
 *   3. When BOTH (1) and (2) are in effect → ALL nearby party members' Bloom DMG +120-240%, their
 *      Hyperbloom & Burgeon DMG +80-160%, and their Lunar-Bloom DMG +40-80%. Off-field capable;
 *      "cannot stack".
 *
 * SELF layer (this file): three boolean-refine toggles. Effects (1)/(2) are `mastery` toggles (the
 * etherlight/Snare-Hook EM shape); effect (3) is the blackmarrow/Prospector multi-channel reaction-DMG
 * toggle. weapon_millennial_hymn models the "both EM buffs active" state — realistic usage enables it
 * together with both EM toggles (its in-game precondition). All four reaction-DMG keys are existing
 * golden-tested emit keys (REACTION_BONUS_PERCENT_KEYS → /100). Sub-stat EM; gen table pre-existing.
 *
 * TEAM layer (off-field): effect (3) buffs ALL party members, so it ALSO propagates to teammates via
 * weapon_other.weapon_millennial_hymn (the Wolf's-Gravestone off-field pattern) — see
 * characterConditions.ts. The invert-self guard there prevents double-count when the active char is the
 * wielder (then the self toggle above carries it).
 *
 * Values 2-witness-confirmed (no single source; see CLAUDE.md § Source-of-truth discipline):
 *   Project Amber (pinned): tools/port/_fixtures/ambr/weapon/14520.json
 *     affix["114520"] "Millennial Hymn": EM 60→120; Bloom 120→240, Hyperbloom/Burgeon 80→160,
 *     Lunar-Bloom 40→80 (R1→R5).
 *   GCSim (cross-check): /tmp/gcsim/internal/weapons/catalyst/nightweavers/nightweavers.go
 *     m[EM] = 45 + 15*r (60→120); reactBuff = 0.3 + 0.1*r → Bloom/BountifulCore ×3 (1.2→2.4),
 *     Hyperbloom/Burgeon ×2 (0.8→1.6), DirectLunarBloom ×1 (0.4→0.8).
 *   live-weapons.json gameId 14520, slug "nightweavers-looking-glass", type "catalyst".
 *
 * Validation (B4 5★ doctrine): values 2-witness; armory port-snapshot on Lauma (load-bearing r1≠r5 on
 * the EM toggles + the Lunar-Bloom channel via her DirectLunarBloom hits). Bloom-family reactions are
 * delayed Dendro-Core explosions / lunar contributors the GCSim driver does not single-rep gate, so no
 * live gate (the blackmarrow precedent); the team propagation is structurally locked by the
 * party-aware GCSim-free test. Stat-delta unit test: src/__tests__/nightweaversLookingGlass.test.ts.
 */

import type { DbObjectWeapon } from "@genshin/types";
import { NightweaversLookingGlassStatTable } from "../generated/nightweavers-looking-glass.gen-weapon.js";

export const nightweaversLookingGlass: DbObjectWeapon = {
  name: "nightweavers_looking_glass",
  gameId: 14520,
  rarity: 5,
  weapon: "catalyst",
  statTable: NightweaversLookingGlassStatTable,
  conditions: [
    // Prayer of the Far North — EM after a Hydro/Dendro Elemental Skill (4.5s).
    {
      type: "boolean-refine",
      name: "weapon_prayer_of_the_far_north",
      serializeId: 1,
      title: "talent_name.prayer_of_the_far_north",
      description: "talent_descr.millennial_hymn_1",
      refinementStats: [
        { mastery: 60 }, // R1
        { mastery: 75 }, // R2
        { mastery: 90 }, // R3
        { mastery: 105 }, // R4
        { mastery: 120 }, // R5
      ],
    },
    // New Moon Verse — EM after a nearby Lunar-Bloom trigger (10s). Stacks with Prayer.
    {
      type: "boolean-refine",
      name: "weapon_new_moon_verse",
      serializeId: 2,
      title: "talent_name.new_moon_verse",
      description: "talent_descr.millennial_hymn_2",
      refinementStats: [
        { mastery: 60 }, // R1
        { mastery: 75 }, // R2
        { mastery: 90 }, // R3
        { mastery: 105 }, // R4
        { mastery: 120 }, // R5
      ],
    },
    // Combined buff (both EM buffs active) — Bloom/Hyperbloom/Burgeon/Lunar-Bloom DMG to all party
    // members. SELF copy here; teammate copy = weapon_other.weapon_millennial_hymn (characterConditions).
    {
      type: "boolean-refine",
      name: "weapon_millennial_hymn",
      serializeId: 3,
      title: "talent_name.millennial_hymn",
      description: "talent_descr.millennial_hymn_3",
      refinementStats: [
        { dmg_reaction_bloom: 120, dmg_reaction_hyperbloom: 80, dmg_reaction_burgeon: 80, dmg_reaction_lunarbloom: 40 }, // R1
        { dmg_reaction_bloom: 150, dmg_reaction_hyperbloom: 100, dmg_reaction_burgeon: 100, dmg_reaction_lunarbloom: 50 }, // R2
        { dmg_reaction_bloom: 180, dmg_reaction_hyperbloom: 120, dmg_reaction_burgeon: 120, dmg_reaction_lunarbloom: 60 }, // R3
        { dmg_reaction_bloom: 210, dmg_reaction_hyperbloom: 140, dmg_reaction_burgeon: 140, dmg_reaction_lunarbloom: 70 }, // R4
        { dmg_reaction_bloom: 240, dmg_reaction_hyperbloom: 160, dmg_reaction_burgeon: 160, dmg_reaction_lunarbloom: 80 }, // R5
      ],
    },
  ],
};
