/**
 * moonweavers_dawn — 4★ sword (v6.0, live port; Nod-Krai craftable)
 *
 * Sub-stat: ATK%. Passive "Secret Silver's Testament": increases Elemental Burst DMG by a
 * base 20/25/30/35/40% (R1..R5, ALWAYS-ON), PLUS an EXCLUSIVE energy-cap tier keyed on the
 * equipping character's Energy Capacity (GCSim `cost := char.EnergyMax`):
 *   cost ≤ 40       → +28/35/42/49/56%   (tier A)
 *   40 < cost ≤ 60  → +16/20/24/28/32%   (tier B)
 *   cost > 60       → +0
 * The bonus applies only to Elemental Burst DMG (`AttackTagElementalBurst` → `dmg_burst`).
 *
 * There is NO player toggle on this weapon: the base is always-on (ConditionStaticRefine) and the
 * tier is auto-resolved from the wielder's `burst_energy_cost` — a statTable constEntry that
 * `buildStats` surfaces into the condition EvalContext (the engine extension this port introduces;
 * Moonweaver is its first consumer). The exclusivity is expressed structurally: tier B is gated
 * `> 40`, so a ≤40 char takes tier A only. Tier A additionally carries a `> 0` floor so a char
 * with NO burst-cost const (absent ctx key → 0) gets no tier rather than spuriously matching ≤40.
 *
 * Values triple-cross-checked (no single source):
 *   Project Amber (pinned): tools/port/_fixtures/ambr/weapon/11434.json
 *     affix["111434"] "Secret Silver's Testament": base 20%→40%; tier "does not exceed 60/40"
 *     → +16%/28% (R1) … +32%/56% (R5).
 *   GCSim (cross-check): /tmp/gcsim/internal/weapons/sword/moonweaversdawn/moonweaversdawn.go
 *     val[DmgP] = 0.15+0.05r (always); cost<=40 += 0.21+0.07r; else if cost<=60 += 0.12+0.04r;
 *     AttackTagElementalBurst only.
 *   Datamine: docs/superpowers/plans/_notes/2026-06-14-b2-datamine.md.
 *   live-weapons.json gameId 11434, slug "moonweavers-dawn", type "sword".
 */

import type { DbObjectWeapon } from "@genshin/types";
import { MoonweaversDawnStatTable } from "../generated/moonweavers-dawn.gen-weapon.js";

export const moonweaversDawn: DbObjectWeapon = {
  name: "moonweavers_dawn",
  gameId: 11434,
  rarity: 4,
  weapon: "sword",
  statTable: MoonweaversDawnStatTable,
  conditions: [
    // Base: always-on +Burst DMG (ConditionStaticRefine — no toggle, like Polar Star's skill/burst).
    {
      type: "refine",
      title: "talent_name.secret_silvers_testament",
      description: "talent_descr.secret_silvers_testament_1",
      refinementStats: [
        { dmg_burst: 20 }, // R1
        { dmg_burst: 25 }, // R2
        { dmg_burst: 30 }, // R3
        { dmg_burst: 35 }, // R4
        { dmg_burst: 40 }, // R5
      ],
    },
    // Tier A — Energy Capacity ≤ 40 (with a > 0 floor so a missing burst-cost const → no tier).
    {
      type: "boolean-value",
      title: "talent_name.secret_silvers_testament",
      description: "talent_descr.secret_silvers_testament_2",
      setting: "burst_energy_cost",
      cond: "le",
      value: 40,
      condition: { type: "boolean-value", setting: "burst_energy_cost", cond: "gt", value: 0 },
      refinementStats: [
        { dmg_burst: 28 }, // R1
        { dmg_burst: 35 }, // R2
        { dmg_burst: 42 }, // R3
        { dmg_burst: 49 }, // R4
        { dmg_burst: 56 }, // R5
      ],
    },
    // Tier B — 40 < Energy Capacity ≤ 60 (exclusive with tier A via the `> 40` gate).
    {
      type: "boolean-value",
      title: "talent_name.secret_silvers_testament",
      description: "talent_descr.secret_silvers_testament_2",
      setting: "burst_energy_cost",
      cond: "le",
      value: 60,
      condition: { type: "boolean-value", setting: "burst_energy_cost", cond: "gt", value: 40 },
      refinementStats: [
        { dmg_burst: 16 }, // R1
        { dmg_burst: 20 }, // R2
        { dmg_burst: 24 }, // R3
        { dmg_burst: 28 }, // R4
        { dmg_burst: 32 }, // R5
      ],
    },
  ],
};
