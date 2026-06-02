/**
 * Thundering Pulse — 5★ Bow (NOVEL hand-port; ConditionDropdown consumer).
 *
 * - Always-on: ATK +20/25/30/35/40% (ConditionStaticRefine).
 * - "The Rule of His Power" — a 3-level dropdown (`weapon_thundering_pulse_2`): each tier grants
 *   Normal Attack DMG (12/24/40% at R1, scaling per refine). Oracle selects tier 3.
 *
 * serializeId: 102. (Condition key is `weapon_thundering_pulse_2` — the 2nd passive; the ATK%
 * passive carries no name.) Sources: raw/.../Weapon/Bow/ThunderingPulse.js:16-67.
 */

import type { ConditionDropdown, ConditionStaticRefine, DbObjectWeapon } from "@genshin/types";
import { ThunderingPulseStatTable } from "../generated/weaponStatTables.js";

const atkPassive: ConditionStaticRefine = {
  type: "refine",
  title: "talent_name.weapon_thundering_pulse",
  description: "talent_descr.weapon_thundering_pulse_1",
  refinementStats: [{ atk_percent: 20 }, { atk_percent: 25 }, { atk_percent: 30 }, { atk_percent: 35 }, { atk_percent: 40 }],
};

const ruleOfPower: ConditionDropdown = {
  type: "dropdown",
  name: "weapon_thundering_pulse_2",
  options: [
    [{ dmg_normal: 12 }, { dmg_normal: 16 }, { dmg_normal: 18 }, { dmg_normal: 21 }, { dmg_normal: 24 }],
    [{ dmg_normal: 24 }, { dmg_normal: 30 }, { dmg_normal: 36 }, { dmg_normal: 42 }, { dmg_normal: 48 }],
    [{ dmg_normal: 40 }, { dmg_normal: 50 }, { dmg_normal: 60 }, { dmg_normal: 70 }, { dmg_normal: 80 }],
  ],
};

export const thunderingPulse: DbObjectWeapon = {
  name: "thundering_pulse",
  serializeId: 102,
  gameId: 15509,
  rarity: 5,
  weapon: "bow",
  statTable: ThunderingPulseStatTable,
  conditions: [atkPassive, ruleOfPower],
};
