/**
 * blood_soaked_ruins — 5★ polearm (v6.0, live port; Flins's signature)
 *
 * Sub-stat: CRIT Rate. Passive "Mournful Tribute": two independent, differently-triggered bonuses
 * plus an energy restore —
 *   1. For 3.5s after an Elemental Burst: Lunar-Charged DMG +36/48/60/72/84% (R1..R5).
 *   2. After triggering a Lunar-Charged reaction ("Requiem of Ruin", 6s): CRIT DMG +28/35/42/49/56%.
 *   3. The trigger in (2) also restores 12/13/14/15/16 Elemental Energy, once every 14s.
 * Energy restore (3) is not a damage output — out of the port's scope (energy-gen, as elsewhere).
 *
 * The two damage channels reuse existing, golden-tested emit machinery, so this is a PURE DATA port
 * (no engine change). Modeled as two boolean-refine toggles — the FracturedHalo two-toggle shape,
 * because the two effects have distinct in-game triggers (post-Burst vs post-Lunar-Charged):
 *   - weapon_mournful_tribute → dmg_reaction_lunarcharged (FracturedHalo's channel;
 *     REACTION_BONUS_PERCENT_KEYS → /100 at emit, scales the Lunar-Charged reaction's `Σreaction`).
 *   - weapon_requiem_of_ruin  → crit_dmg (A Thousand Blazing Suns' channel; FRACTION_TOTAL_STATS).
 *
 * Values 2-witness-confirmed (no single source; see CLAUDE.md § Source-of-truth discipline):
 *   Project Amber (pinned): tools/port/_fixtures/ambr/weapon/13516.json
 *     affix["113516"] "Mournful Tribute": LC DMG 36%→84%, CRIT DMG 28%→56%, Energy 12→16 (R1→R5).
 *   GCSim (cross-check): /tmp/gcsim/internal/weapons/spear/bloodsoakedruins/bloodsoakedruins.go
 *     lcBonus = 0.24 + 0.12*r (0.36→0.84); mCrit[CD] = 0.21 + 0.07*r (0.28→0.56);
 *     energyRestore = 11 + r (12→16). No Moonsign condition on the weapon itself — Moonsign only
 *     governs the gate setup (Lunar-Charged is a night-team reaction).
 *   live-weapons.json gameId 13516, slug "blood-soaked-ruins", type "polearm".
 *
 * GCSim oracle gate: blood-soaked-ruins-gcsim (Lunar-Charged reaction on Flins, absolute mode);
 * see tools/oracle/gate-reps.mjs + v6WeaponsGate.test.ts. Stat-delta unit test:
 * src/__tests__/bloodSoakedRuins.test.ts.
 */

import type { DbObjectWeapon } from "@genshin/types";
import { BloodSoakedRuinsStatTable } from "../generated/blood-soaked-ruins.gen-weapon.js";

export const bloodSoakedRuins: DbObjectWeapon = {
  name: "blood_soaked_ruins",
  gameId: 13516,
  rarity: 5,
  weapon: "polearm",
  statTable: BloodSoakedRuinsStatTable,
  conditions: [
    // 3.5s after an Elemental Burst → Lunar-Charged DMG bonus (the FracturedHalo channel).
    {
      type: "boolean-refine",
      name: "weapon_mournful_tribute",
      serializeId: 1,
      title: "talent_name.mournful_tribute",
      description: "talent_descr.mournful_tribute_1",
      refinementStats: [
        { dmg_reaction_lunarcharged: 36 }, // R1
        { dmg_reaction_lunarcharged: 48 }, // R2
        { dmg_reaction_lunarcharged: 60 }, // R3
        { dmg_reaction_lunarcharged: 72 }, // R4
        { dmg_reaction_lunarcharged: 84 }, // R5
      ],
    },
    // "Requiem of Ruin" (6s after triggering Lunar-Charged) → CRIT DMG bonus.
    {
      type: "boolean-refine",
      name: "weapon_requiem_of_ruin",
      serializeId: 2,
      title: "talent_name.requiem_of_ruin",
      description: "talent_descr.mournful_tribute_2",
      refinementStats: [
        { crit_dmg: 28 }, // R1
        { crit_dmg: 35 }, // R2
        { crit_dmg: 42 }, // R3
        { crit_dmg: 49 }, // R4
        { crit_dmg: 56 }, // R5
      ],
    },
  ],
};
