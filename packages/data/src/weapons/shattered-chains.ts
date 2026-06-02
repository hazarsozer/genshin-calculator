/**
 * Shattered Chains — 4★ Bow (static-only port; Natlan-party buffs INERT in the solo oracle).
 *
 * Passive "Chain Breaker" (raw, ALL three conditions refine-gated, NONE always-on):
 *   - ConditionShatteredChains publishes `weapon_shattered_chains_stacks` =
 *     (wielder Natlan ? 1 : 0) + party members that are Natlan OR off-element.
 *   - ConditionStacksSetting reads that count → ATK% 4.8→9.6/stack (maxStacks 3, refine-scaled).
 *   - ConditionBooleanValue(stacks ≥ 3) → Elemental Mastery 24→48 (refine-scaled).
 *
 * In the solo oracle the rep is Nahida (origin `sumeru`, NOT Natlan) and party = 0
 * (the manifest sets no `party_char_*`), so the published count is 0 → the stacks
 * condition (needs > 0) and the ≥3 gate are both inactive → ATK% and EM bonuses are 0.
 * Only the static main-stat (s4atk44 base + s4atkp6 ATK% substat, both refine-independent)
 * contributes. Confirmed: weapons-r1 == weapons-r5 byte-for-byte.
 *
 * The Natlan-party publisher + its consumers are omitted: they resolve to {} for any
 * non-Natlan solo rep, and porting them faithfully would require a new natlan-party
 * publisher condition variant with no v5.8 parity payoff (the published count is provably 0).
 *
 * serializeId: 177, gameId: 15431.
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Weapon/Bow/ShatteredChains.js:10-49
 *   raw/genshin_calc_pub/src/js/classes/Condition/ShatteredChains.js:9-33
 *   raw/genshin_calc_pub/src/js/classes/Condition/Stacks/Setting.js
 */

import type { DbObjectWeapon } from "@genshin/types";
import { ShatteredChainsStatTable } from "../generated/weaponStatTables.js";

export const shatteredChains: DbObjectWeapon = {
  name: "shattered_chains",
  serializeId: 177,
  gameId: 15431,
  rarity: 4,
  weapon: "bow",
  statTable: ShatteredChainsStatTable,
  conditions: [],
};
