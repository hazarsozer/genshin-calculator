/**
 * Silken Moon's Serenade — artifact set port (v6.x Nod-Krai / Lunar).
 *
 * 2pc: +20% Energy Recharge (no damage output — ported as a stat for completeness, not gated).
 * 4pc: ALL party members gain EM +60/+120 (Moonsign ≥1/≥2) AND Lunar-reaction DMG +10% (at ≥1).
 *      Team-propagation is modeled via three conditions in characterConditions.ts
 *      (setOtherSilkenMoonsSerenade4React/Ms1/Ms2, the Noblesse OR pattern). The
 *      `set.silken_moons_serenade_4` boolean below is the TOGGLE activating the self-worn arm
 *      of those OR gates; real stats live in characterConditions.ts.
 * QUARANTINED (SILKEN-QUARANTINE.md): the 2pc ER (no damage output), the on-hit UPTIME (always-on
 *   toggle here — the 8s buff window after an elemental hit is a rotation concern).
 *
 * `moonsign_1`/`moonsign_2` are settings KEYS (boolean conditions read them); both are absent in
 * every v5.8 build → base-inert (the ~58k goldens are unaffected).
 *
 * Sources:
 *   GCSim: /tmp/gcsim/internal/artifacts/silkenmoonsserenade/silkenmoonsserenade.go
 *     (2pc ER=0.2; 4pc EM 60@MS1/120@MS2 via GetMoonsignLevel(); +0.1 Lunar-react DMG via
 *      gleamingMoonDevotionReactKey while gleamingMoonDevotionEMKey is active)
 *   Genshin Optimizer localization (frzyc/genshin-optimizer, en, SilkenMoonsSerenade):
 *     "2pc: Energy Recharge +20%."
 *     "4pc: ...Increases all party members' Elemental Mastery by 60/120 when the party's Moonsign
 *      is Nascent Gleam/Ascendant Gleam. ...All party members' Lunar Reaction DMG is increased by
 *      10% for each different Gleaming Moon effect that party members have."
 *     URL: raw.githubusercontent.com/frzyc/genshin-optimizer/master/libs/gi/dm-localization/
 *          assets/locales/en/artifact_SilkenMoonsSerenade_gen.json (accessed 2026-06-12)
 */

import type { DbObjectArtifactSet } from "@genshin/types";

export const silkenMoonsSerenade: DbObjectArtifactSet = {
  name: "artifact_set.silken_moons_serenade",
  goodId: "SilkenMoonsSerenade",
  bonus: {
    // 2pc — +20% Energy Recharge (display/utility only; no damage output → not gated).
    2: {
      conditions: [
        {
          type: "static",
          title: "set_bonus.silken_moons_serenade_2",
          stats: { recharge: 20 },
        },
      ],
    },
    // 4pc — display-only toggle. Real stats (team EM + Lunar-react DMG) are in
    // characterConditions.ts via the set_other OR pattern (Noblesse convention).
    // This boolean activates the self-worn arm of those OR gates in characterConditions.
    // `text_percent: 120` is the headline EM value shown in the UI (max tier, MS2).
    4: {
      conditions: [
        {
          type: "boolean",
          name: "set.silken_moons_serenade_4",
          title: "set_bonus.silken_moons_serenade_4",
          stats: { text_percent: 120 },
        },
      ],
    },
  },
};
