/**
 * Peak Patrol Song — 5★ Sword (NOVEL hand-port; stacks + post-effect).
 *
 * - Stacks `weapon_peak_patrol_song` (max 2): per stack, DEF +8/10/12/14/16% AND all 7 elemental
 *   DMG +10/12.5/15/17.5/20% (ConditionStacks). The oracle sets 2 stacks.
 * - Toggle `weapon_peak_patrol_song_2`: all 7 elemental DMG += 0.8/1.0/1.2/1.4/1.6% of DEF, capped
 *   at 25.6/32/38.4/44.8/51.2% (refine-scaled) — a `PostEffectStatsDef`. Modelled as DEF → `dmg_own`
 *   (the wielder's element via the fold; the other 6 elements are inert on the wielder's direct hits).
 *
 * serializeId: 185. The toggle's `text_percent` marker is UI-only → omitted.
 * Sources: raw/.../Weapon/Sword/PeakPatrolSong.js, raw/.../classes/PostEffect/Stats/Def.js.
 */

import type {
  CharPostEffect,
  ConditionStacks,
  ConditionStats,
  DbObjectWeapon,
  TalentTable,
} from "@genshin/types";
import { PeakPatrolSongStatTable } from "../generated/weaponStatTables.js";

function refineRatioTable(values: readonly number[]): TalentTable {
  return { getValue: (refine: number): number => values[refine - 1] ?? 0 };
}

// Per-stack: DEF% + all-7 elemental DMG%, per refine.
const STACK_DEF = [8, 10, 12, 14, 16];
const STACK_ELEM = [10, 12.5, 15, 17.5, 20];
const perStack: readonly ConditionStats[] = STACK_DEF.map((def, i) => {
  const e = STACK_ELEM[i]!;
  return {
    def_percent: def,
    dmg_anemo: e, dmg_electro: e, dmg_pyro: e, dmg_cryo: e, dmg_hydro: e, dmg_geo: e, dmg_dendro: e,
  };
});

const stacks: ConditionStacks = {
  type: "stacks",
  name: "weapon_peak_patrol_song",
  maxStacks: 2,
  refinementStats: perStack,
};

// DEF → own-element DMG (via the dmg_own fold), gated by the 2nd toggle.
const defToOwnDmg: CharPostEffect = {
  priority: 1,
  fromStat: "def",
  toStat: "dmg_own",
  ratioFromTalent: {
    table: refineRatioTable([0.008, 0.01, 0.012, 0.014, 0.016]),
    levelSetting: "weapon_refine",
    multi: 1,
  },
  capValueFromTalent: {
    table: refineRatioTable([25.6, 32, 38.4, 44.8, 51.2]),
    levelSetting: "weapon_refine",
  },
  conditions: [{ type: "boolean", name: "weapon_peak_patrol_song_2" }],
};

export const peakPatrolSong: DbObjectWeapon = {
  name: "peak_patrol_song",
  serializeId: 185,
  gameId: 11516,
  rarity: 5,
  weapon: "sword",
  statTable: PeakPatrolSongStatTable,
  conditions: [stacks],
  postEffects: [defToOwnDmg],
};
