/**
 * Celestial Gift — artifact set port (v6.6).
 *
 * 2pc: Energy Recharge +20% (always-on once 2 pieces are equipped).
 *      Engine key: `recharge: 20` (our FLAT_TOTAL_STATS key, same as Emblem/Scholar).
 *      DAMAGE-INERT: enerRech_ does not contribute to any damage output; this stat
 *      is modeled faithfully but is NOT damage-gateable. No GO damage gate is added
 *      (doing so would produce a vacuous gate where both sides are unaffected).
 *
 * 4pc: "Light Guidance" +20% <ele>_dmg_ (team, nonStacking, after Skill) +
 *      "Mortal Hymn" +40% <ele>_dmg_ (team, when ≥2 Hexerei share element).
 *      BOTH effects are QUARANTINED — see tools/port/CELESTIAL-GIFT-QUARANTINE.md.
 *      No code is shipped for the 4pc. Reasons:
 *        - `nonStacking` propagation has no engine primitive.
 *        - `teamBuff` (off-field buff to party members) is not supported.
 *        - `tally.hexerei` / `input.isHexerei` (Hexerei class gating) has no engine primitive.
 *
 * NOT in Aspirine's raw (v6.6 set; oracle frozen at v5.8). goodId = GOOD-format key
 * (GO folder name: CelestialGift), used directly as the gate/manifest key.
 *
 * Sources:
 *   /tmp/genshin-optimizer/libs/gi/sheets/src/Artifacts/CelestialGift/index.tsx
 *     (set2: greaterEq(artSet,2, 0.2, enerRech_); 4pc: teamBuff nonStacking isHexerei
 *      lightGuidance +0.2 ele_dmg_ + mortalHymn tally.hexerei≥2 +0.4 ele_dmg_ — QUARANTINED)
 */

import type { DbObjectArtifactSet } from "@genshin/types";

export const celestialGift: DbObjectArtifactSet = {
  name: "artifact_set.celestial_gift",
  goodId: "CelestialGift",
  bonus: {
    // 2pc — Energy Recharge +20% (GO: greaterEq(input.artSet[key], 2, 0.2) → enerRech_).
    // Our engine key is `recharge` (FLAT_TOTAL_STATS; see buildStats.ts:67).
    // DAMAGE-INERT: enerRech_ has no damage output pathway. No GO damage gate is added.
    2: {
      conditions: [
        {
          type: "static",
          title: "set_bonus.celestial_gift_2",
          stats: { recharge: 20 },
        },
      ],
    },
    // 4pc — QUARANTINED (see tools/port/CELESTIAL-GIFT-QUARANTINE.md).
    // Light Guidance: +20% ele_dmg_ team buff, nonStacking, isHexerei-gated, after Skill.
    // Mortal Hymn: +40% ele_dmg_ team buff, when ≥2 Hexerei share the active element.
    // NO CODE shipped. These effects require engine primitives that do not exist:
    //   - teamBuff / nonStacking propagation
    //   - isHexerei character property
    //   - tally.hexerei ≥ 2 condition
    // Honesty: shipping any approximation here would produce a gamed gate.
  },
};
