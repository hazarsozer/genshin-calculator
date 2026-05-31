/**
 * Golden Troupe — artifact set port.
 *
 * 2pc: +20% Elemental Skill DMG (always-on once 2 pieces are equipped).
 * 4pc: +25% Elemental Skill DMG (always-on); AND when the wearer is off-field (or
 *      the buff is toggled on), a further +25% Elemental Skill DMG.
 *
 * Both 4pc conditions are ENTIRELY in the per-set `setBonus` array — there is no
 * global Buffs/Artifacts.js entry for Golden Troupe (unlike Noblesse/Deepwood).
 *
 * The 4pc carries two conditions:
 *   (a) a static +25% (GoldenTroupe.js:31-35): always fires once 4 pieces are
 *       equipped, stacking on top of the 2pc +20%;
 *   (b) a boolean +25% gated on `set.golden_troupe_4` (GoldenTroupe.js:36-45):
 *       fires only when the off-field/buff toggle is active.
 *
 * With pieces=4 and toggle ON: 2pc(20) + 4pc-static(25) + 4pc-toggle(25) = +70% Skill DMG.
 * With pieces=4, toggle OFF: 2pc(20) + 4pc-static(25) = +45% Skill DMG.
 *
 * Verified against the oracle set-4pc/fischl.json fixture (Fischl, AlleyHunter weapon,
 * set.golden_troupe_4=true): skill hits scale accordingly.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Artifacts/Set/GoldenTroupe.js:14-48 (setBonus 2pc/4pc)
 */

import type { DbObjectArtifactSet } from "@genshin/types";

export const goldenTroupe: DbObjectArtifactSet = {
  name: "artifact_set.golden_troupe",
  goodId: "GoldenTroupe",
  bonus: {
    // 2pc — Elemental Skill DMG +20% (GoldenTroupe.js:17-24).
    2: {
      conditions: [
        {
          type: "static",
          title: "set_bonus.golden_troupe_2",
          stats: { dmg_skill: 20 },
        },
      ],
    },
    // 4pc — always-on +25% Skill DMG; plus +25% Skill DMG when off-field toggle is active
    // (GoldenTroupe.js:29-47).
    4: {
      conditions: [
        {
          type: "static",
          title: "set_bonus.golden_troupe_4",
          stats: { dmg_skill: 25 },
        },
        {
          type: "boolean",
          name: "set.golden_troupe_4",
          title: "set_bonus.golden_troupe_4",
          stats: { dmg_skill: 25 },
        },
      ],
    },
  },
};
