/**
 * Night of the Sky's Unveiling — artifact set port (v6.x Nod-Krai / Lunar).
 *
 * 2pc: +80 Elemental Mastery.
 * 4pc: ALL party members' Lunar-reaction DMG +10%. Team-propagation is modeled via the
 *      `set_other.night_of_the_skys_unveiling_4` condition in characterConditions.ts
 *      (Noblesse OR pattern) — the `set.night_of_the_skys_unveiling_4` boolean below is the
 *      TOGGLE that activates the self-worn arm of that OR; real stats are in characterConditions.ts.
 *      QUARANTINED (NIGHT-QUARANTINE.md) — the 4pc also grants Moonsign-tiered CRIT Rate (+15% MS1 /
 *      +30% MS>=2) on Lunar reactions. NOT modeled: it is reaction-specific crit with no faithful
 *      global set channel (a global crit_rate would wrongly buff non-reaction hits) and is gate-
 *      invisible at the gate's forced cr=-1 build (the Lauma ascendant-CR precedent).
 *
 * Sources:
 *   GCSim: /tmp/gcsim/internal/artifacts/nightoftheskysunveiling/nightoftheskysunveiling.go
 *     (2pc mastery=80; 4pc +0.1 team lunar react via gleamingMoonIntentReactKey while
 *      gleamingMoonIntentCRKey active; CR 0.15@MS1/0.30@MS>=2 via gleamingMoonIntentCRKey)
 *   Genshin Optimizer localization (frzyc/genshin-optimizer, en, NightOfTheSkysUnveiling):
 *     "2pc: Increases Elemental Mastery by 80."
 *     "4pc: When nearby party members trigger Lunar Reactions, if the equipping character is on
 *      the field, gain the Gleaming Moon: Intent effect for 4s: Increases CRIT Rate by 15%/30%
 *      when the party's Moonsign is Nascent Gleam/Ascendant Gleam. All party members' Lunar
 *      Reaction DMG is increased by 10% for each different Gleaming Moon effect that party
 *      members have. Effects from Gleaming Moon cannot stack."
 *     URL: raw.githubusercontent.com/frzyc/genshin-optimizer/master/libs/gi/dm-localization/
 *          assets/locales/en/artifact_NightOfTheSkysUnveiling_gen.json (accessed 2026-06-12)
 */

import type { DbObjectArtifactSet } from "@genshin/types";

export const nightOfTheSkysUnveiling: DbObjectArtifactSet = {
  name: "artifact_set.night_of_the_skys_unveiling",
  goodId: "NightOfTheSkysUnveiling",
  bonus: {
    2: {
      conditions: [
        { type: "static", title: "set_bonus.night_of_the_skys_unveiling_2", stats: { mastery: 80 } },
      ],
    },
    4: {
      conditions: [
        // Display-only toggle — activates the self-worn arm of the OR gate in
        // characterConditions.ts (setOtherNightOfTheSkysUnveiling4). Real stats (+10%
        // Lunar-reaction DMG) live there, not here, to avoid double-counting with the
        // team-buff arm. `text_percent: 10` is the headline value shown in the UI.
        {
          type: "boolean",
          name: "set.night_of_the_skys_unveiling_4",
          title: "set_bonus.night_of_the_skys_unveiling_4",
          stats: { text_percent: 10 },
        },
      ],
    },
  },
};
