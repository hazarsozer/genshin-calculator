/**
 * calamity_of_eshu — 4★ Sword.
 *
 * Passive "Desert Warden" (hand-port):
 *   - Always-on shield-status toggle (ConditionBoolean, display-only gate for the stat block).
 *   - ConditionStaticRefine gated by "common.char_status_shield":
 *       dmg_normal +20/25/30/35/40%, dmg_charged +20/25/30/35/40%,
 *       crit_rate_normal +8/10/12/14/16%, crit_rate_charged +8/10/12/14/16%.
 *
 * The stats ONLY apply when the shield toggle is on → INERT in the no-shield oracle
 * fixture (the brief confirms settingsSets has a `no_shield` profile with shield:0).
 * Port faithfully: the ConditionBoolean is the gate on the ConditionStaticRefine,
 * expressed via `condition: { type:"boolean", name:"common.char_status_shield" }`.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Weapon/Sword/CalamityOfEshu.js
 */

import type { DbObjectWeapon } from "@genshin/types";
import { CalamityOfEshuStatTable } from "../generated/weaponStatTables.js";

export const calamityOfEshu: DbObjectWeapon = {
  name: "calamity_of_eshu",
  serializeId: 191,
  gameId: 11432,
  rarity: 4,
  weapon: "sword",
  statTable: CalamityOfEshuStatTable,
  conditions: [
    // Display-only boolean toggle (gates the stat block below; no direct stats).
    {
      type: "boolean",
      name: "common.char_status_shield",
      serializeId: 1,
      title: "buffs_name.resonance_geo_shield",
    },
    // dmg_normal/charged + crit_rate_normal/charged, active only under shield.
    {
      type: "refine",
      title: "talent_name.calamity_of_eshu",
      description: "talent_descr.calamity_of_eshu",
      refinementStats: [
        { dmg_normal: 20, dmg_charged: 20, crit_rate_normal: 8, crit_rate_charged: 8 },   // R1
        { dmg_normal: 25, dmg_charged: 25, crit_rate_normal: 10, crit_rate_charged: 10 }, // R2
        { dmg_normal: 30, dmg_charged: 30, crit_rate_normal: 12, crit_rate_charged: 12 }, // R3
        { dmg_normal: 35, dmg_charged: 35, crit_rate_normal: 14, crit_rate_charged: 14 }, // R4
        { dmg_normal: 40, dmg_charged: 40, crit_rate_normal: 16, crit_rate_charged: 16 }, // R5
      ],
      condition: { type: "boolean", name: "common.char_status_shield" },
    },
  ],
};
