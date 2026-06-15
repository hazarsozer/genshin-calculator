/**
 * reliquary_of_truth — 5★ catalyst (v6.1, live port; Nefer's signature)
 *
 * Sub-stat: CRIT DMG. Passive "Essence of Falsity" — SELF-only: every effect lands on the wielder.
 * GCSim adds all stat mods to `char` (no c.Player.Chars() team loop), and Secret of Lies even guards
 * on the equipper being on-field (reliquary.go:57). Unlike Nightweaver's Looking Glass (B4 #1, an
 * off-field TEAM buff), there is NO weapon_other propagation — this overturns the prior blanket
 * assumption that all three B4 5★ catalysts are team supports (verified against the source).
 *
 * Four conditions, all feeding existing golden-tested emit channels (PURE DATA port, no engine change):
 *   1. Always-on: CRIT Rate +8/10/12/14/16% (ConditionStaticRefine — the Skyward Blade shape).
 *   2. Secret of Lies (12s after an Elemental Skill): EM +80/100/120/140/160 → mastery (flat).
 *   3. Moon of Truth (4s after dealing Lunar-Bloom DMG): CRIT DMG +24/30/36/42/48% → crit_dmg
 *      (FRACTION_TOTAL_STATS → crit_dmg_total, /100; the Blood-Soaked Ruins channel).
 *   4. Resonance: when BOTH (2) and (3) are active, each effect is increased by 50%. Modeled as the
 *      EXTRA half (mastery +40-80, crit_dmg +12-24 = 0.5 × base) on a ConditionStaticRefine auto-gated
 *      by `and[boolean weapon_secret_of_lies, boolean weapon_moon_of_truth]`. This mirrors GCSim's
 *      AUTOMATIC ×1.5 (reliquary.go:65-67,93-95): the synergy is a consequence of both buffs being up,
 *      not a user toggle — so it can never be wrongly enabled alone nor forgotten. The boolean gates
 *      read the two toggles' own settings (the key-of-khaj-nisut sibling-gate pattern; `boolean` reads
 *      ctx[name] truthily — `boolean-value` would not, as it coerces the setting to a number).
 *
 * Values 2-witness-confirmed (no single source; see CLAUDE.md § Source-of-truth discipline):
 *   Project Amber (pinned): tools/port/_fixtures/ambr/weapon/14521.json
 *     affix["114521"] "Essence of Falsity": CR 8→16%, EM 80→160, CRIT DMG 24→48%, both ×1.5 (R1→R5).
 *   GCSim (cross-check): /tmp/gcsim/internal/weapons/catalyst/reliquary/reliquary.go
 *     m[CR] = 0.06 + 0.02r (0.08→0.16); emBuff = 60 + 20r (80→160, ×1.5 if Moon active);
 *     cdBuff = 0.18 + 0.06r (0.24→0.48, ×1.5 if Secret active).
 *   live-weapons.json gameId 14521, slug "reliquary-of-truth", type "catalyst".
 *
 * Validation (B4 5★ doctrine): values 2-witness; armory port-snapshot on Nahida (load-bearing r1≠r5 —
 * the always-on CR passive alone differs by refine, plus the two toggles bite her crit/EM). Moon of
 * Truth triggers on Lunar-Bloom DMG, which the GCSim driver does not single-rep gate (no lunarbloom
 * contributor; the Nightweaver's / blackmarrow precedent), so there is no live gate — validated by
 * 2-witness + armory-lock + the stat-delta unit test (src/__tests__/reliquaryOfTruth.test.ts).
 */

import type { DbObjectWeapon } from "@genshin/types";
import { ReliquaryOfTruthStatTable } from "../generated/reliquary-of-truth.gen-weapon.js";

export const reliquaryOfTruth: DbObjectWeapon = {
  name: "reliquary_of_truth",
  gameId: 14521,
  rarity: 5,
  weapon: "catalyst",
  statTable: ReliquaryOfTruthStatTable,
  conditions: [
    // Always-on: CRIT Rate +8/10/12/14/16% (the Skyward Blade static-refine passive shape).
    {
      type: "refine",
      title: "talent_name.essence_of_falsity",
      description: "talent_descr.essence_of_falsity",
      refinementStats: [
        { crit_rate: 8 }, // R1
        { crit_rate: 10 }, // R2
        { crit_rate: 12 }, // R3
        { crit_rate: 14 }, // R4
        { crit_rate: 16 }, // R5
      ],
    },
    // Secret of Lies — EM after an Elemental Skill (12s).
    {
      type: "boolean-refine",
      name: "weapon_secret_of_lies",
      serializeId: 1,
      title: "talent_name.secret_of_lies",
      description: "talent_descr.essence_of_falsity",
      refinementStats: [
        { mastery: 80 }, // R1
        { mastery: 100 }, // R2
        { mastery: 120 }, // R3
        { mastery: 140 }, // R4
        { mastery: 160 }, // R5
      ],
    },
    // Moon of Truth — CRIT DMG after dealing Lunar-Bloom DMG (4s).
    {
      type: "boolean-refine",
      name: "weapon_moon_of_truth",
      serializeId: 2,
      title: "talent_name.moon_of_truth",
      description: "talent_descr.essence_of_falsity",
      refinementStats: [
        { crit_dmg: 24 }, // R1
        { crit_dmg: 30 }, // R2
        { crit_dmg: 36 }, // R3
        { crit_dmg: 42 }, // R4
        { crit_dmg: 48 }, // R5
      ],
    },
    // Resonance — both Secret of Lies and Moon of Truth active → each effect +50%. Auto-gated (not a
    // user toggle): the EXTRA half of each buff, applied only when both toggles are on. Extra = 0.5×base.
    {
      type: "refine",
      title: "talent_name.essence_of_falsity",
      description: "talent_descr.essence_of_falsity",
      condition: {
        type: "and",
        items: [
          { type: "boolean", name: "weapon_secret_of_lies" },
          { type: "boolean", name: "weapon_moon_of_truth" },
        ],
      },
      refinementStats: [
        { mastery: 40, crit_dmg: 12 }, // R1
        { mastery: 50, crit_dmg: 15 }, // R2
        { mastery: 60, crit_dmg: 18 }, // R3
        { mastery: 70, crit_dmg: 21 }, // R4
        { mastery: 80, crit_dmg: 24 }, // R5
      ],
    },
  ],
};
