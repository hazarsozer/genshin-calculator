/**
 * Flowing Purity — 4★ Catalyst (NOVEL hand-port).
 *
 * - Toggle `weapon_flowing_purity_1`: all 7 elemental DMG +8/10/12/14/16% (ConditionBooleanRefine) —
 *   ACTIVE in the oracle. (Only the wielder's own element binds on their direct hits; the rest are
 *   inert for the rep, but ported faithfully.)
 * - A `PostEffectStatsBondOfLife` (7 element DMG += HP × Bond-of-Life%, cap 12…24) gated by
 *   `weapon_flowing_purity_bol`. In a solo C0 build the BoL level is 0 → gated off → contributes
 *   nothing. DEFERRED to ② (Bond-of-Life input model). The `ConditionNumberLevels` BoL input +
 *   `text_*` markers are UI-only → omitted.
 *
 * serializeId: 154. Sources: raw/.../Weapon/Catalyst/FlowingPurity.js,
 *   raw/.../classes/PostEffect/Stats/BondOfLife.js.
 */

import type { ConditionBooleanRefine, DbObjectWeapon } from "@genshin/types";
import { FlowingPurityStatTable } from "../generated/weaponStatTables.js";

const elementBuff: ConditionBooleanRefine = {
  type: "boolean-refine",
  name: "weapon_flowing_purity_1",
  title: "talent_name.weapon_flowing_purity",
  description: "talent_descr.weapon_flowing_purity_1",
  refinementStats: ([8, 10, 12, 14, 16] as const).map((v) => ({
    dmg_anemo: v, dmg_geo: v, dmg_pyro: v, dmg_electro: v, dmg_hydro: v, dmg_cryo: v, dmg_dendro: v,
  })),
};

export const flowingPurity: DbObjectWeapon = {
  name: "flowing_purity",
  serializeId: 154,
  gameId: 14425,
  rarity: 4,
  weapon: "catalyst",
  statTable: FlowingPurityStatTable,
  conditions: [elementBuff],
};
