/**
 * Aubade of Morningstar and Moon — artifact set port (v6.x Nod-Krai / Lunar).
 *
 * 2pc: +80 Elemental Mastery (always-on once 2 pieces are equipped).
 * 4pc: while on-field, Lunar-reaction DMG +20%; at Moonsign >=2 (Ascendant Gleam) an additional +40%
 *      (so +60% total at MS>=2). Feeds the existing Lunar-reaction DMG channels
 *      (`dmg_reaction_lunarcharged` + `dmg_reaction_lunarbloom`) the live chars already read.
 *
 * In-game 4pc text: "When the equipping character is off-field, Lunar Reaction DMG is increased by
 *   20%. When the party's Moonsign Level is at least Ascendant Gleam, Lunar Reaction DMG will be
 *   further increased by 40%. This effect will disappear after the equipping character is active for
 *   3s." GCSim models this as an on-field 3s grace-window (equivalent: the effect is active on the
 *   wearer's hits, disappearing 3s after they become active — modeled here as always-on for the
 *   wearer when the set toggle is true).
 *
 * GATED (wearer-facing): the 2pc EM and the 4pc Lunar-reaction DMG, on the wearer's own Lunar-Charged
 *   hit at Moonsign 2 (absolute mode — reactions are not ATK-proportional; EM enters non-linearly).
 * QUARANTINED (see tools/port/AUBADE-QUARANTINE.md): the on-field 3s-after-swap UPTIME window
 *   (modeled as always-on toggle; rotation concern), and team-propagation (wearer-only here).
 *
 * Sources:
 *   GCSim: /tmp/gcsim/internal/artifacts/aubade/aubade.go
 *     (2pc EM=80; 4pc buff=0.2 + if MoonsignLevel>=2 { buff+=0.4 }; AttackTagIsLunar; on-field gate)
 *   Genshin Optimizer localization (frzyc/genshin-optimizer, en, AubadeOfMorningstarAndMoon):
 *     "2pc: Increases Elemental Mastery by 80."
 *     "4pc: ...Lunar Reaction DMG is increased by 20%. ...Moonsign Level is at least Ascendant Gleam,
 *      Lunar Reaction DMG will be further increased by 40%."
 *     URL: raw.githubusercontent.com/frzyc/genshin-optimizer/master/libs/gi/dm-localization/
 *          assets/locales/en/artifact_AubadeOfMorningstarAndMoon_gen.json (accessed 2026-06-12)
 */

import type { DbObjectArtifactSet } from "@genshin/types";

export const aubadeOfMorningstarAndMoon: DbObjectArtifactSet = {
  name: "artifact_set.aubade_of_morningstar_and_moon",
  goodId: "AubadeOfMorningstarAndMoon",
  bonus: {
    // 2pc — +80 EM.
    2: {
      conditions: [
        {
          type: "static",
          title: "set_bonus.aubade_of_morningstar_and_moon_2",
          stats: { mastery: 80 },
        },
      ],
    },
    // 4pc — Lunar-reaction DMG +20% (on-field/toggle) + an extra +40% at Moonsign >=2.
    4: {
      conditions: [
        // Base +20% — gated on the set's on-field/active toggle.
        {
          type: "boolean",
          name: "set.aubade_of_morningstar_and_moon_4",
          title: "set_bonus.aubade_of_morningstar_and_moon_4",
          stats: { dmg_reaction_lunarcharged: 20, dmg_reaction_lunarbloom: 20 },
        },
        // +40% increment at Moonsign >=2 (Ascendant Gleam), also requiring the set active.
        {
          type: "static",
          title: "set_bonus.aubade_of_morningstar_and_moon_4_ms2",
          stats: { dmg_reaction_lunarcharged: 40, dmg_reaction_lunarbloom: 40 },
          condition: {
            type: "and",
            items: [
              { type: "boolean", name: "set.aubade_of_morningstar_and_moon_4" },
              { type: "boolean", name: "moonsign_2" },
            ],
          },
        },
      ],
    },
  },
};
