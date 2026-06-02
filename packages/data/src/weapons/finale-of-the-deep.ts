/**
 * Finale of the Deep — 4★ Sword (NOVEL hand-port).
 *
 * - Toggle `weapon_finale_of_the_deep_1`: ATK +12/15/18/21/24% (ConditionBooleanRefine) — ACTIVE
 *   in the oracle (toggle on).
 * - A `PostEffectStatsBondOfLife` (ATK += HP × Bond-of-Life%, cap 150…300) gated by
 *   `weapon_finale_of_the_deep_bol`. In a solo C0 build with no Bond-of-Life the BoL level is 0 →
 *   the post-effect is gated off and contributes nothing. DEFERRED to ② (Bond-of-Life input model).
 *   The `ConditionNumberLevels` BoL input + its `text_*` stats are UI-only → omitted.
 *
 * serializeId: 147. Sources: raw/.../Weapon/Sword/FinaleOfTheDeep.js,
 *   raw/.../classes/PostEffect/Stats/BondOfLife.js.
 */

import type { ConditionBooleanRefine, DbObjectWeapon } from "@genshin/types";
import { FinaleOfTheDeepStatTable } from "../generated/weaponStatTables.js";

const atkBuff: ConditionBooleanRefine = {
  type: "boolean-refine",
  name: "weapon_finale_of_the_deep_1",
  title: "talent_name.weapon_finale_of_the_deep",
  description: "talent_descr.weapon_finale_of_the_deep_1",
  refinementStats: [{ atk_percent: 12 }, { atk_percent: 15 }, { atk_percent: 18 }, { atk_percent: 21 }, { atk_percent: 24 }],
};

export const finaleOfTheDeep: DbObjectWeapon = {
  name: "finale_of_the_deep",
  serializeId: 147,
  gameId: 11425,
  rarity: 4,
  weapon: "sword",
  statTable: FinaleOfTheDeepStatTable,
  conditions: [atkBuff],
};
