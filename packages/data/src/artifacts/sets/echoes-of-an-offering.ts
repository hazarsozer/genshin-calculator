/**
 * Echoes of an Offering — 4★/5★ artifact set (NOVEL hand-port; set FeatureMultiplier consumer).
 *
 * 2pc: ATK +18% (always-on once 2 pieces).
 * 4pc: Valley Rite — when Normal Attacks hit, a chance to add Normal Attack DMG = 70% of
 *      ATK ("Quicken Boon"). The real proc depends on action-frame timing, so her calc
 *      models it with a SECONDARY `_avg` toggle: with the 4pc toggle ON, the deterministic
 *      "on" variant adds 70% of ATK, while the AVERAGED variant (the v5.8 default) adds
 *      70 × 0.502 = 35.14% of ATK (her empirical uptime factor). This is the reason it's a
 *      hand-port: a `FeatureMultiplier` the SET contributes that modifies the WIELDER's
 *      normal hits (her `setBonus[4].multipliers`) — the set-side analogue of Redhorn.
 *
 * Modelled as a single `CharMultiplier` (the AVG variant — the v5.8 oracle config sets BOTH
 * `set.echoes_of_an_offering_4` and `set.echoes_of_an_offering_4_avg` ON): default `atk*`
 * scaling, constant 35.14% (= 70 × 0.502, her `ValueTable([70*0.502])`), `target` normal,
 * gated by `And(set.echoes_4, set.echoes_4_avg)`. The harness threads `set.multipliers` into
 * compileCharacter's `extraMultipliers`; it injects into every normal-type hit — incl.
 * Mualani's shark-bite, whose `damageType` is "normal" (category "skill"). Verified vs the
 * sets-4pc fixture (mualani rep); inert at 2pc (the 4pc toggle is absent there).
 *
 * DEFERRED — the deterministic "on" variant (`ValueTable([70])`, gated
 * `And(set.echoes_4, Not(set.echoes_4_avg))`) needs `ConditionNot`, which our condition
 * union does not yet carry. The v5.8 fixtures drive the AVG path (`_avg` ON), so the "on"
 * variant is inert here; it lands with the `ConditionNot` engine extension (E3). Her two
 * multipliers are mutually exclusive on the `_avg` toggle — exactly one is ever active.
 *
 * goodId: "EchoesofanOffering" — the ORACLE MANIFEST KEY (the `artifactSets` lookup key),
 * which differs in casing from the raw `goodId: 'EchoesOfAnOffering'`. The burndown resolves
 * `setByGoodId[Object.keys(item.artifactSets)[0]]`, so the manifest key is authoritative.
 *
 * serializeId: 38 (raw ArtifactSet.serializeId). The 4pc `text_*` markers (display
 * chance/percent) are UI-only (not in any buildStats emit list) → numeric no-ops, omitted.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Artifacts/Set/EchoesofanOffering.js:9-77
 *   raw/genshin_calc_pub/src/js/classes/Feature2/Multiplier.js (getValue: value/100, default 'atk*')
 */

import type { CharMultiplier, DbObjectArtifactSet } from "@genshin/types";

// 4pc AVG variant: +35.14% of ATK on normal hits, gated on BOTH the 4pc toggle and the
// averaging toggle (the v5.8 oracle config). Constant (no leveling); default atk* scaling.
const valleyRiteAvg: CharMultiplier = {
  scaling: "atk*",
  source: "artifacts",
  leveling: "",
  values: { getValue: (): number => 70 * 0.502 },
  target: { damageTypes: ["normal"] },
  condition: {
    type: "and",
    items: [
      { type: "boolean", name: "set.echoes_of_an_offering_4" },
      { type: "boolean", name: "set.echoes_of_an_offering_4_avg" },
    ],
  },
};

export const echoesOfAnOffering: DbObjectArtifactSet = {
  name: "artifact_set.echoes_of_an_offering",
  goodId: "EchoesofanOffering",
  bonus: {
    // 2pc — ATK +18% (EchoesofanOffering.js setBonus[2]).
    2: {
      conditions: [
        {
          type: "static",
          title: "set_bonus.echoes_of_an_offering_2",
          stats: { atk_percent: 18 },
        },
      ],
    },
    // 4pc — the Valley Rite multiplier (above) is the damage; the tier carries no stats
    // (the raw 4pc `text_*` markers are UI-only → numeric no-ops).
    4: {
      conditions: [
        {
          type: "static",
          title: "set_bonus.echoes_of_an_offering_4",
          stats: {},
        },
      ],
    },
  },
  multipliers: [valleyRiteAvg],
};
