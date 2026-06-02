/**
 * hakushin_ring — 4★ Catalyst. INERT (toggle off in fixture).
 *
 * Passive "Hakushin Theory":
 *   - Toggle (ConditionBooleanRefine, "weapon_white_dragon_ring"):
 *       `dmg_own` +10/12.5/15/17.5/20% at R1..R5.
 *       `dmg_own` is a real key — buildStats resolves it to the wielder's element
 *       damage bonus. Toggle is off in the oracle fixture → INERT.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Weapon/Catalyst/HakushinRing.js
 */

import type { DbObjectWeapon } from "@genshin/types";
import { HakushinRingStatTable } from "../generated/weaponStatTables.js";

export const hakushinRing: DbObjectWeapon = {
  name: "hakushin_ring",
  serializeId: 104,
  gameId: 14414,
  rarity: 4,
  weapon: "catalyst",
  statTable: HakushinRingStatTable,
  conditions: [
    // Toggle: wielder's element DMG +10/12.5/15/17.5/20% (HakushinRing.js:15-21).
    // Off in oracle fixture → INERT.
    {
      type: "boolean-refine",
      name: "weapon_white_dragon_ring",
      serializeId: 1,
      title: "talent_name.weapon_white_dragon_ring",
      description: "talent_descr.weapon_white_dragon_ring",
      refinementStats: [
        { dmg_own: 10 },   // R1
        { dmg_own: 12.5 }, // R2
        { dmg_own: 15 },   // R3
        { dmg_own: 17.5 }, // R4
        { dmg_own: 20 },   // R5
      ],
    },
  ],
};
