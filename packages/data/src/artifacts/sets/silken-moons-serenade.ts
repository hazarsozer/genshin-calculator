/**
 * Silken Moon's Serenade — artifact set port (v6.x Nod-Krai / Lunar).
 *
 * 2pc: +20% Energy Recharge (no damage output — ported as a stat for completeness, not gated).
 * 4pc: when the wearer deals Elemental DMG, all party members gain "Gleaming Moon: Devotion" for
 *      8s. While active: team EM +60 (Moonsign Nascent Gleam ≥1) or +120 (Ascendant Gleam ≥2).
 *      Additionally, while any party member has a Gleaming Moon effect, ALL characters' Lunar-
 *      reaction DMG +10%. The +10% fires whenever the EM buff is up (one Gleaming Moon effect).
 *
 * GATED (wearer-facing): Both the +120 EM (at MS2) AND the +10% Lunar-reaction DMG, together on
 *   the wearer's own Lunar-Charged hit (absolute mode — EM enters non-linearly; both effects fire
 *   once the wearer has triggered the on-hit EM buff, which precedes the LC reaction).
 * QUARANTINED (SILKEN-QUARANTINE.md): the 2pc ER (no damage output), the on-hit UPTIME (always-on
 *   toggle here — the 8s buff window after an elemental hit is a rotation concern), team-propagation
 *   (wearer-only here), and the Moonsign-1-only EM tier (separately testable follow-up).
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
    // 4pc — team EM (Moonsign-tiered) + Lunar-reaction DMG while EM buff is active.
    // Both gated on `set.silken_moons_serenade_4` (the on-hit uptime toggle, always-on here).
    4: {
      conditions: [
        // GATED: +10% Lunar-reaction DMG while Gleaming Moon: Devotion is active.
        // This fires as long as the EM buff is up (the wearer has one Gleaming Moon effect).
        // Always present when the set toggle is on — not Moonsign-tiered.
        {
          type: "boolean",
          name: "set.silken_moons_serenade_4",
          title: "set_bonus.silken_moons_serenade_4",
          stats: { dmg_reaction_lunarcharged: 10, dmg_reaction_lunarbloom: 10 },
        },
        // GATED: +60 EM base at Moonsign ≥1 (Nascent Gleam), also requiring the set toggle.
        {
          type: "static",
          title: "set_bonus.silken_moons_serenade_4_ms1",
          stats: { mastery: 60 },
          condition: {
            type: "and",
            items: [
              { type: "boolean", name: "set.silken_moons_serenade_4" },
              { type: "boolean", name: "moonsign_1" },
            ],
          },
        },
        // GATED: +60 EM increment at Moonsign ≥2 (Ascendant Gleam) → total +120 at MS2.
        {
          type: "static",
          title: "set_bonus.silken_moons_serenade_4_ms2",
          stats: { mastery: 60 },
          condition: {
            type: "and",
            items: [
              { type: "boolean", name: "set.silken_moons_serenade_4" },
              { type: "boolean", name: "moonsign_2" },
            ],
          },
        },
      ],
    },
  },
};
