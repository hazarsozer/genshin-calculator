/**
 * Silvershower Heartstrings — 5★ Bow (NOVEL hand-port; ConditionDropdown + ConditionBooleanValue).
 *
 * - "Loving Heart" — a 3-level dropdown (`weapon_silvershower_heartstrings`): each tier grants
 *   Max HP% (12/24/40% at R1, scaling per refine).
 * - At the MAX tier (≥3 stacks of the same key), Elemental Burst CRIT Rate +28/.../56%
 *   (ConditionBooleanValue gated `weapon_silvershower_heartstrings >= 3`; `crit_rate_burst` is the
 *   per-type crit fold, applied to burst hits only).
 *
 * serializeId: 175. Oracle selects tier 3 (`weapon_silvershower_heartstrings: 3`) → both bind.
 * Sources: raw/.../Weapon/Bow/SilvershowerHeartstrings.js:17-73.
 */

import type {
  ConditionBooleanValue,
  ConditionDropdown,
  DbObjectWeapon,
} from "@genshin/types";
import { SilvershowerHeartstringsStatTable } from "../generated/weaponStatTables.js";

const lovingHeart: ConditionDropdown = {
  type: "dropdown",
  name: "weapon_silvershower_heartstrings",
  options: [
    [{ hp_percent: 12 }, { hp_percent: 15 }, { hp_percent: 18 }, { hp_percent: 21 }, { hp_percent: 24 }],
    [{ hp_percent: 24 }, { hp_percent: 30 }, { hp_percent: 36 }, { hp_percent: 42 }, { hp_percent: 48 }],
    [{ hp_percent: 40 }, { hp_percent: 50 }, { hp_percent: 60 }, { hp_percent: 70 }, { hp_percent: 80 }],
  ],
};

const burstCritAtMax: ConditionBooleanValue = {
  type: "boolean-value",
  setting: "weapon_silvershower_heartstrings",
  cond: "ge",
  value: 3,
  refinementStats: [
    { crit_rate_burst: 28 },
    { crit_rate_burst: 35 },
    { crit_rate_burst: 42 },
    { crit_rate_burst: 49 },
    { crit_rate_burst: 56 },
  ],
};

export const silvershowerHeartstrings: DbObjectWeapon = {
  name: "silvershower_heartstrings",
  serializeId: 175,
  gameId: 15513,
  rarity: 5,
  weapon: "bow",
  statTable: SilvershowerHeartstringsStatTable,
  conditions: [lovingHeart, burstCritAtMax],
};
