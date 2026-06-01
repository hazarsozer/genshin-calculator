/**
 * Polar Star — 5★ Bow (NOVEL hand-port; ConditionDropdown consumer).
 *
 * - Always-on: Elemental Skill & Burst DMG +12/15/18/21/24% (ConditionStaticRefine).
 * - "Ashen Nightstar" — a 4-level dropdown (`weapon_polar_star`): each tier grants ATK%
 *   (10/20/30/48% at R1, scaling per refine). The oracle selects tier 4 (`weapon_polar_star: 4`).
 *
 * serializeId: 112. Sources: raw/.../Weapon/Bow/PolarStar.js:17-80.
 */

import type { ConditionDropdown, ConditionStaticRefine, DbObjectWeapon } from "@genshin/types";
import { PolarStarStatTable } from "../generated/weaponStatTables.js";

const skillBurst: ConditionStaticRefine = {
  type: "refine",
  title: "talent_name.weapon_polar_star",
  description: "talent_descr.weapon_polar_star_1",
  refinementStats: [
    { dmg_skill: 12, dmg_burst: 12 },
    { dmg_skill: 15, dmg_burst: 15 },
    { dmg_skill: 18, dmg_burst: 18 },
    { dmg_skill: 21, dmg_burst: 21 },
    { dmg_skill: 24, dmg_burst: 24 },
  ],
};

const ashenNightstar: ConditionDropdown = {
  type: "dropdown",
  name: "weapon_polar_star",
  options: [
    [{ atk_percent: 10 }, { atk_percent: 12.5 }, { atk_percent: 15 }, { atk_percent: 17.5 }, { atk_percent: 20 }],
    [{ atk_percent: 20 }, { atk_percent: 25 }, { atk_percent: 30 }, { atk_percent: 35 }, { atk_percent: 40 }],
    [{ atk_percent: 30 }, { atk_percent: 37.5 }, { atk_percent: 45 }, { atk_percent: 52.5 }, { atk_percent: 60 }],
    [{ atk_percent: 48 }, { atk_percent: 60 }, { atk_percent: 72 }, { atk_percent: 84 }, { atk_percent: 96 }],
  ],
};

export const polarStar: DbObjectWeapon = {
  name: "polar_star",
  serializeId: 112,
  gameId: 15507,
  rarity: 5,
  weapon: "bow",
  statTable: PolarStarStatTable,
  conditions: [skillBurst, ashenNightstar],
};
