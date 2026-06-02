/**
 * Wandering Evenstar — 4★ Catalyst (NOVEL hand-port; weapon post-effect consumer).
 *
 * Passive "Wildling Nightstar": while `weapon_desert_pavilion` is active, ATK += 24/30/36/42/48%
 * of Elemental Mastery (refine-scaled) — the same `PostEffectStatsMastery` EM→ATK fold as Makhaira
 * Aquamarine (her shared Desert-Pavilion passive). The off-field 30% variant + the `text_percent`
 * marker are UI-only → omitted.
 *
 * serializeId: 137. Sources: raw/.../Weapon/Catalyst/WanderingEvenstar.js,
 *   raw/.../classes/PostEffect/Stats/Mastery.js.
 */

import type { CharPostEffect, DbObjectWeapon, TalentTable } from "@genshin/types";
import { WanderingEvenstarStatTable } from "../generated/weaponStatTables.js";

function refineRatioTable(fractions: readonly number[]): TalentTable {
  return { getValue: (refine: number): number => fractions[refine - 1] ?? 0 };
}

const emToAtk: CharPostEffect = {
  priority: 1,
  fromStat: "mastery",
  toStat: "atk",
  ratioFromTalent: {
    table: refineRatioTable([0.24, 0.3, 0.36, 0.42, 0.48]),
    levelSetting: "weapon_refine",
    multi: 1,
  },
  conditions: [{ type: "boolean", name: "weapon_desert_pavilion" }],
};

export const wanderingEvenstar: DbObjectWeapon = {
  name: "wandering_evenstar",
  serializeId: 137,
  gameId: 14416,
  rarity: 4,
  weapon: "catalyst",
  statTable: WanderingEvenstarStatTable,
  postEffects: [emToAtk],
};
