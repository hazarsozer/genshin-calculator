/**
 * Athame Artis — 5★ sword (v6.2, live port)
 *
 * Sub-stat: CRIT Rate (7.2% base). Passive "Hexerei's Calling":
 *   (a) ALWAYS-ON: burst-type hits get +16% CRIT DMG (R1..R5: 16/20/24/28/32%).
 *       GO: equal(input.hit.move, 'burst', burstCritDMG_disp) → premod.critDMG_
 *       Our key: `crit_dmg_burst` (per-type CRIT fold via CRIT_BONUS_TYPES in buildStats.ts).
 *       Applied to burst hits only — identical move-gate to GO's `equal(input.hit.move, 'burst',...)`.
 *   (b) TOGGLE `burstHit` (after Elemental Burst): self ATK +20% (R1..R5: 20/25/30/35/40%).
 *       → ABSOLUTE matched-build gate (ATK% cancels in the damage/ATK ratio, so a matched build
 *       is needed — same pattern as char ATK% gates).
 *
 * QUARANTINED (no code shipped, zero models):
 *   - Team ATK +16% (burstHit toggle → team buff): off-field propagation, out of scope.
 *   - Hexerei tally ≥ 2 → ×1.75 multiplier on the above: runtime `tally.hexerei` conditional,
 *     no engine primitive (same quarantine as Disaster and Remorse / Gest of the Mighty Wolf).
 *
 * GO sheet: /tmp/genshin-optimizer/libs/gi/sheets/src/Weapons/Sword/AthameArtis/index.tsx
 *   burstCritDmg_arr = [-1, 0.16, 0.20, 0.24, 0.28, 0.32]  (always-on, burst move-gated)
 *   self_atk_arr     = [-1, 0.20, 0.25, 0.30, 0.35, 0.40]  (burstHit toggle)
 *   team_atk_arr     = [-1, 0.16, 0.20, 0.24, 0.28, 0.32]  (team buff — quarantined)
 *
 * Gate: GO-gate, ABSOLUTE mode on Durin (sword, pure ATK, burst hit), tol 1e-6.
 *   athame-artis-weapon-gate: Durin burst.burst_purity_1 with `burstHit` toggle ON → ATK +20%.
 *   statBlock matched to GO's natural build (atk_base override not needed — sword equip both sides).
 *
 * Amber fixture: tools/port/_fixtures/ambr/weapon/11518.json
 *   (verified: name "Athame Artis", type "Sword", rank 5 — corrects common brief's "4★" guess).
 */

import type { DbObjectWeapon } from "@genshin/types";
import { AthameArtisStatTable } from "../generated/athame-artis.gen-weapon.js";

export const athameArtis: DbObjectWeapon = {
  name: "athame_artis",
  gameId: 11518,
  rarity: 5,
  weapon: "sword",
  statTable: AthameArtisStatTable,
  conditions: [
    // (a) Always-on: Burst-type hits get +16% CRIT DMG (R1..R5: 16/20/24/28/32%).
    // GO: equal(input.hit.move, 'burst', subscript(refinement, burstCritDmg_arr)) → premod.critDMG_.
    // Our engine: `crit_dmg_burst` ∈ CRIT_BONUS_TYPES → emitted as fraction for burst-type features
    // only (critBonusTypeKeys("dmg", "burst") in compileFeature.ts). Move-gate is identical.
    // Modeled as "refine" (always-on, no condition key).
    {
      type: "refine",
      title: "talent_name.athame_artis_burst_crit_dmg",
      description: "talent_descr.athame_artis_burst_crit_dmg",
      refinementStats: [
        { crit_dmg_burst: 16 }, // R1
        { crit_dmg_burst: 20 }, // R2
        { crit_dmg_burst: 24 }, // R3
        { crit_dmg_burst: 28 }, // R4
        { crit_dmg_burst: 32 }, // R5
      ],
    },
    // (b) Toggle `burstHit` (after Elemental Burst): self ATK +20% (R1..R5: 20/25/30/35/40%).
    // GO: equal(condBurstHit, 'on', subscript(refinement, self_atk_arr)) → premod.atk_.
    // ABSOLUTE gate: ATK% cancels in the damage/ATK ratio — must match the build (statBlock {}).
    // Team ATK +16% (burstHit_teamAtk_) and Hexerei ×1.75 (hexerei_selfAtk_) → QUARANTINED.
    {
      type: "boolean-refine",
      name: "weapon_athame_artis_1",
      serializeId: 1,
      title: "talent_name.athame_artis_burst_hit",
      description: "talent_descr.athame_artis_burst_hit",
      refinementStats: [
        { atk_percent: 20 }, // R1
        { atk_percent: 25 }, // R2
        { atk_percent: 30 }, // R3
        { atk_percent: 35 }, // R4
        { atk_percent: 40 }, // R5
      ],
    },
  ],
};
