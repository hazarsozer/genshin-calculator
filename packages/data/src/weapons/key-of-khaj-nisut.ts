/**
 * Key of Khaj-Nisut — 5★ Sword (NOVEL hand-port; HP→Elemental-Mastery fold).
 *
 * Passive "Sunken Song of the Sands":
 *   - Always-on: HP +20/25/30/35/40% (ConditionStaticRefine).
 *   - HP→EM fold (the reason this is a hand-port) — the SUM of TWO HP-scaled mastery
 *     post-effects, both reading the HP TOTAL (incl. the +20-40% above, applied first):
 *
 *     TERM A — the weapon's own PostEffectStatsHP (KeyofKhajNisut.js:52-59):
 *       percent = mastery[0.0012,0.0015,0.0018,0.0021,0.0024], stacksSetting =
 *       weapon_key_of_khaj_nisut (=3). It has NO levelSetting, so her PostEffect.getLevel
 *       returns 1 → percent.getValue(1) = 0.0012 FLAT for every refine, ×3 stacks =
 *       0.0036 × HP. (The [..0.0024] tail is never reached on the self-wielder.)
 *
 *     TERM B — the GLOBAL Static buff's PostEffectKhajNisut (Buffs/Static.js:33-35,
 *       classes/PostEffect/KhajNisut.js): percent = mastery[0.002,0.0025,0.003,0.0035,0.004],
 *       getLevel = weapon_refine (REFINE-scaled), base = hp_total, isActive =
 *       weapon_key_of_khaj_nisut >= 3. The port has no global-buff channel, so it rides
 *       along as a second WEAPON post-effect (the wielder is the only one weapon_id==135
 *       targets) gated by stacks >= 3.
 *
 * Total effective ratio = 0.0036 + refine[0.002..0.004]: R1 0.0056×HP, R5 0.0076×HP.
 * Numeric proof (exact, diff 0.0 both refines): fixture stats.mastery − Hu Tao baseline 55:
 *   R1 hp 53571.854 → 0.0036×hp(192.859) + 0.002×hp(107.144) = 300.002 (355.002 − 55) ✓
 *   R5 hp 59327.515 → 0.0036×hp(213.579) + 0.004×hp(237.310) = 450.889 (505.889 − 55) ✓
 * The EM flows into the reaction features (burning/overloaded/…) the armory asserts.
 *
 * Conditions 2 (stacks text_percent) and 3 (ge-3-gated text_percent) carry only the
 * DISPLAY-ONLY `text_percent` key (the tooltip mirror of term B) → stat-inert, omitted.
 * The ge-3 gate is reproduced on term B.
 *
 * serializeId: 135, gameId: 11511.
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Weapon/Sword/KeyofKhajNisut.js
 *   raw/genshin_calc_pub/src/js/classes/PostEffect/KhajNisut.js (getLevel→weapon_refine, isActive≥3)
 *   raw/genshin_calc_pub/src/js/db/Buffs/Static.js:33-35 (term B percent table)
 */

import type {
  CharPostEffect,
  ConditionStaticRefine,
  DbObjectWeapon,
  TalentTable,
} from "@genshin/types";
import { KeyofKhajNisutStatTable } from "../generated/weaponStatTables.js";

/** Refine-indexed ratio table (1-indexed; R1 → fractions[0]); mirrors StatTable.getValue(weapon_refine). */
function refineRatioTable(fractions: readonly number[]): TalentTable {
  return { getValue: (refine: number): number => fractions[refine - 1] ?? 0 };
}

// Always-on HP +20/25/30/35/40% (KeyofKhajNisut.js:19-25).
const hpPassive: ConditionStaticRefine = {
  type: "refine",
  title: "talent_name.sunken_song_of_the_sands",
  description: "talent_descr.sunken_song_of_the_sands_1",
  refinementStats: [
    { hp_percent: 20 }, // R1
    { hp_percent: 25 }, // R2
    { hp_percent: 30 }, // R3
    { hp_percent: 35 }, // R4
    { hp_percent: 40 }, // R5
  ],
};

// TERM A — weapon postEffect: 0.0012 FLAT per stack × weapon_key_of_khaj_nisut stacks × HP.
// Her percent.getValue(level=1)=0.0012 (no levelSetting → refine-flat); ×3 stacks = 0.0036.
// Modelled via ratioPerStack (ratio += table.getValue(lvl) × settings[setting]); the
// constant table makes the result refine-flat regardless of the (ignored) levelSetting.
const hpToEmStacks: CharPostEffect = {
  priority: 1,
  fromStat: "hp",
  toStat: "mastery",
  ratioPerStack: {
    setting: "weapon_key_of_khaj_nisut",
    table: { getValue: (): number => 0.0012 }, // refine-flat (her getLevel→1)
    levelSetting: "weapon_refine", // ignored by the constant table; present for type shape
  },
};

// TERM B — the global Static buff's refine-scaled HP→EM, ported as a second weapon
// post-effect (no global-buff channel). Gated on stacks >= 3 (her isActive).
const hpToEmRefine: CharPostEffect = {
  priority: 1,
  fromStat: "hp",
  toStat: "mastery",
  ratioFromTalent: {
    table: refineRatioTable([0.002, 0.0025, 0.003, 0.0035, 0.004]),
    levelSetting: "weapon_refine",
    multi: 1,
  },
  conditions: [
    { type: "boolean-value", setting: "weapon_key_of_khaj_nisut", cond: "ge", value: 3 },
  ],
};

export const keyOfKhajNisut: DbObjectWeapon = {
  name: "key_of_khaj_nisut",
  serializeId: 135,
  gameId: 11511,
  rarity: 5,
  weapon: "sword",
  statTable: KeyofKhajNisutStatTable,
  conditions: [hpPassive], // conditions 2 & 3 (text_percent) are display-inert → omitted
  postEffects: [hpToEmStacks, hpToEmRefine],
};
