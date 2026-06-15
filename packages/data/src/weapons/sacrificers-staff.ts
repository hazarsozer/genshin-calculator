/**
 * sacrificers_staff — 4★ polearm (v6.1, live port)
 *
 * Sub-stat: CRIT Rate (gen-weapon emits crit_rate_base; the per-stack Energy Recharge in the passive
 * below is a SEPARATE effect, NOT the sub-stat). Passive "Untainted Desire": for 6s after an Elemental
 * Skill hits an opponent, ATK +8/10/12/14/16% and Energy Recharge +6/7.5/9/10.5/12% PER STACK, max 3
 * stacks (off-field triggerable). At 3 stacks (R5): ATK +48%, ER +36%.
 *
 * Passive shape: ConditionStacks (Lithic Blade pattern) — per-stack stats scale with weapon_refine;
 * the player supplies the stack count via the weapon_untainted_desire setting (clamped to maxStacks).
 *
 * Validation: the off-field stack-ramp uptime is a rotation concern (not single-rep GCSim-gateable),
 * so the armory port-snapshot on an ATK-scaling rep (stacks set to 3) is the in-suite lock — ATK%
 * changes every hit → the passive IS exercised there. ER has no single-hit damage effect. Values
 * cross-checked below. Stat-delta unit test: src/__tests__/sacrificersStaff.test.ts.
 *
 * Sources:
 *   Project Amber (pinned): tools/port/_fixtures/ambr/weapon/13434.json
 *     affix["113434"]: name "Untainted Desire", per-stack ATK 8%→16%, ER 6%→12%, max 3 stacks
 *   GCSim (cross-check): /tmp/gcsim/internal/weapons/spear/sacrificersstaff/sacrificersstaff.go
 *     atkBuff = 0.06+0.02*r (0.08→0.16); erBuff = 0.045+0.015*r (0.06→0.12); buff*stacks, stacks≤3
 *   live-weapons.json gameId 13434, slug "sacrificers-staff", type "polearm"
 */

import type { DbObjectWeapon } from "@genshin/types";
import { SacrificersStaffStatTable } from "../generated/sacrificers-staff.gen-weapon.js";

export const sacrificersStaff: DbObjectWeapon = {
  name: "sacrificers_staff",
  gameId: 13434,
  rarity: 4,
  weapon: "polearm",
  statTable: SacrificersStaffStatTable,
  conditions: [
    {
      type: "stacks",
      name: "weapon_untainted_desire",
      serializeId: 1,
      title: "talent_name.untainted_desire",
      description: "talent_descr.untainted_desire",
      maxStacks: 3,
      refinementStats: [
        { atk_percent: 8, recharge: 6 }, // R1 per stack
        { atk_percent: 10, recharge: 7.5 }, // R2 per stack
        { atk_percent: 12, recharge: 9 }, // R3 per stack
        { atk_percent: 14, recharge: 10.5 }, // R4 per stack
        { atk_percent: 16, recharge: 12 }, // R5 per stack
      ],
    },
  ],
};
