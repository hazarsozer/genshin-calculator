/**
 * Crimson Witch of Flames — artifact set port.
 *
 * 2pc: +15% Pyro DMG (always-on once 2 pieces are equipped).
 * 4pc: Overloaded/Burning/Burgeon reaction DMG +40%, Vaporize/Melt reaction DMG
 *      +15% (always-on); AND, after using an Elemental Skill, Pyro DMG +7.5% per
 *      stack for 10s, up to 3 stacks (+22.5% at max). The 2pc + max stacks give
 *      +37.5% Pyro total — verified to 5 dp against the oracle set-4pc fixture
 *      (diluc.json pyro hits scale ×1.695/1.32 over base).
 *
 * This set's bonuses are ENTIRELY in the per-set `setBonus` array — there is no
 * global Buffs/Artifacts.js entry for it (unlike Noblesse/Deepwood). The stacks
 * are a flat per-stack bag (`StatTable('dmg_pyro', [7.5])` → `{ dmg_pyro: 7.5 }`):
 * the engine's `conditionStats` resolver multiplies it by `getStackCount` (the
 * `set.crimson_witch_of_flames_4` setting, clamped to 3).
 *
 * The reaction-DMG keys (`dmg_reaction_overloaded` etc.) arrive RAW (percent) and
 * are emitted as fractions by buildStats; the reaction factories read them inside
 * `(1 + emBonus + Σ dmg_reaction_*)`. Note `dmg_reaction_burning` is a no-op for the
 * Burning reaction (her Burning reads `dmg_reaction_bloom`, Reaction/Burning.js:11) —
 * preserved verbatim as her data has it; absent reads are 0 so this is exact.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Artifacts/Set/CrimsonWitch.js:15-56 (setBonus 2pc/4pc)
 *   raw/genshin_calc_pub/src/js/classes/StatTable.js (single-value table → flat per-stack bag)
 *   packages/data/src/reactions.ts (which reaction reads which dmg_reaction_* key)
 */

import type { DbObjectArtifactSet } from "@genshin/types";

export const crimsonWitch: DbObjectArtifactSet = {
  name: "artifact_set.crimson_witch_of_flames",
  goodId: "CrimsonWitchOfFlames",
  bonus: {
    // 2pc — Pyro DMG +15% (CrimsonWitch.js:17-27).
    2: {
      conditions: [
        {
          type: "static",
          title: "set_bonus.crimson_witch_of_flames_2",
          stats: { dmg_pyro: 15 },
        },
      ],
    },
    // 4pc — always-on reaction-DMG bonuses + a 3-stack post-skill Pyro DMG buff
    // (CrimsonWitch.js:31-54).
    4: {
      conditions: [
        {
          type: "static",
          title: "set_bonus.crimson_witch_of_flames_4",
          stats: {
            dmg_reaction_overloaded: 40,
            dmg_reaction_burning: 40,
            dmg_reaction_burgeon: 40,
            dmg_reaction_vaporize: 15,
            dmg_reaction_melt: 15,
          },
        },
        {
          type: "stacks",
          name: "set.crimson_witch_of_flames_4",
          title: "set_bonus.crimson_witch_of_flames_4",
          maxStacks: 3,
          // Flat per-stack bag (×getStackCount): her StatTable('dmg_pyro', [7.5]).
          stats: { dmg_pyro: 7.5 },
        },
      ],
    },
  },
};
