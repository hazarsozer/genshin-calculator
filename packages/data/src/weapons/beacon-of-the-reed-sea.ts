/**
 * Beacon of the Reed Sea — 5★ Claymore (NOVEL hand-port).
 *
 * - Stacks `beacon_of_the_reed_sea` (max 2): ATK +20/25/30/35/40% per stack (ConditionStacks). The
 *   oracle sets 2 stacks → +40% at R1.
 * - HP +32/40/48/56/64% while NOT shielded (her `ConditionNot([Boolean(common.char_status_shield)])`
 *   sub-gate). The oracle config IS shielded (`common.char_status_shield: true`) → the HP bonus is
 *   INERT and is omitted here (the shielded branch). The non-shielded branch defers to ②.
 *
 * serializeId: 143. Sources: raw/.../Weapon/Claymore/BeaconOfTheReedSea.js.
 */

import type { ConditionStacks, DbObjectWeapon } from "@genshin/types";
import { BeaconOfTheReedSeaStatTable } from "../generated/weaponStatTables.js";

const atkStacks: ConditionStacks = {
  type: "stacks",
  name: "beacon_of_the_reed_sea",
  maxStacks: 2,
  refinementStats: [{ atk_percent: 20 }, { atk_percent: 25 }, { atk_percent: 30 }, { atk_percent: 35 }, { atk_percent: 40 }],
};

export const beaconOfTheReedSea: DbObjectWeapon = {
  name: "beacon_of_the_reed_sea",
  serializeId: 143,
  gameId: 12511,
  rarity: 5,
  weapon: "claymore",
  statTable: BeaconOfTheReedSeaStatTable,
  conditions: [atkStacks],
};
