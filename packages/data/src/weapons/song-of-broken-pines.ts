/**
 * song_of_broken_pines — 5★ Claymore. BIND.
 *
 * Passive "Rebel's Banner-Hymn":
 *   - Always-on (ConditionStaticRefine): ATK% +16/20/24/28/32% at R1..R5.
 *   - Toggle (ConditionBooleanRefine, "weapon_song_of_broken_pines"): stats are
 *     `text_percent` [20..30] and `text_percent_2` [12..24] only → UI display
 *     markers (not in any buildStats emit list) → OMITTED.
 *     The team buff entry in Buffs/Weapons.js is likewise INERT in solo → OMITTED.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Weapon/Claymore/SongofBrokenPines.js
 */

import type { DbObjectWeapon } from "@genshin/types";
import { SongofBrokenPinesStatTable } from "../generated/weaponStatTables.js";

export const songOfBrokenPines: DbObjectWeapon = {
  name: "song_of_broken_pines",
  serializeId: 96,
  gameId: 12503,
  rarity: 5,
  weapon: "claymore",
  statTable: SongofBrokenPinesStatTable,
  conditions: [
    // Always-on ATK% +16/20/24/28/32% (SongofBrokenPines.js:15-19).
    {
      type: "refine",
      title: "talent_name.weapon_song_of_broken_pines_passive",
      description: "talent_descr.weapon_song_of_broken_pines_passive",
      refinementStats: [
        { atk_percent: 16 }, // R1
        { atk_percent: 20 }, // R2
        { atk_percent: 24 }, // R3
        { atk_percent: 28 }, // R4
        { atk_percent: 32 }, // R5
      ],
    },
    // ConditionBooleanRefine toggle ("weapon_song_of_broken_pines") carries only
    // text_percent/text_percent_2 → display-only → OMITTED.
  ],
};
