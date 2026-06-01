/**
 * Xiphos' Moonlight — 4★ Sword (NOVEL hand-port; weapon post-effect consumer).
 *
 * Passive "Whisper of the Jinn": while the toggle is active, Energy Recharge += 3.6/4.5/5.4/6.3/7.2%
 * of Elemental Mastery (refine-scaled) — a `PostEffectStatsMastery` EM→ER fold. (Her off-field
 * `recharge_party_bonus` + the `text_percent` marker are UI-only → omitted.)
 *
 * The fold writes `recharge` (not a damage stat); for the burndown rep (Keqing) no feature scales
 * off Energy Recharge, so it is damage-inert — but ported faithfully so the recharge total is correct
 * for any caller. serializeId: 134.
 *
 * Sources: raw/.../Weapon/Sword/XiphosMoonlight.js, raw/.../classes/PostEffect/Stats/Mastery.js.
 */

import type { CharPostEffect, DbObjectWeapon, TalentTable } from "@genshin/types";
import { XiphosMoonlightStatTable } from "../generated/weaponStatTables.js";

function refineRatioTable(fractions: readonly number[]): TalentTable {
  return { getValue: (refine: number): number => fractions[refine - 1] ?? 0 };
}

const emToRecharge: CharPostEffect = {
  priority: 1,
  fromStat: "mastery",
  toStat: "recharge",
  ratioFromTalent: {
    table: refineRatioTable([0.036, 0.045, 0.054, 0.063, 0.072]),
    levelSetting: "weapon_refine",
    multi: 1,
  },
  conditions: [{ type: "boolean", name: "whisper_of_the_jinn" }],
};

export const xiphosMoonlight: DbObjectWeapon = {
  name: "xiphos_moonlight",
  serializeId: 134,
  gameId: 11418,
  rarity: 4,
  weapon: "sword",
  statTable: XiphosMoonlightStatTable,
  postEffects: [emToRecharge],
};
