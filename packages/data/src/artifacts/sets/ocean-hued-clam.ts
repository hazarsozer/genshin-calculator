/**
 * Ocean-Hued Clam — 4★/5★ artifact set (NOVEL hand-port; set FeatureDamage consumer).
 *
 * 2pc: Healing Bonus +15% (always-on once 2 pieces — `healing` stat).
 * 4pc: Sea-Dyed Foam — periodically a bubble deals AoE DMG = 90% of the healing
 *      accumulated over its 3s window, capped at 30 000. This is the reason this is a
 *      hand-port: a `FeatureDamage` the SET itself deals (her `FeatureDamageClam` in
 *      `setBonus[4].features`), which the stat-only set wrapper can't express. It is the
 *      SET-side analogue of a weapon FeatureDamage (Aquila): the foam compiles through the
 *      SAME machinery via the harness's `extraFeatures` channel.
 *
 * The foam scales `accumulated_healing` (her `scaling: 'accumulated_healing'`, a
 * `ConditionNumber` input) × 90%, capped at 30 000. In the v5.8 standard build config
 * `accumulated_healing` is 0 (the player hasn't entered a healing amount), so the foam
 * deals 0 — exactly what the sets-4pc oracle records (`other.sea_dyed_foam_dmg` =
 * 0/0/0). The proc is PRODUCED and keyed `other.sea_dyed_foam_dmg` (category "other",
 * her default damageType 'none'), satisfying the harness's full-coverage gate; sigewinne's
 * own hits are untouched.
 *
 * FEATURE-LEVEL PIECE GATE: the foam lives in her `setBonus[4]`, so it must appear ONLY
 * at 4pc. The harness threads `set.features` flat (independent of pieces), so the feature
 * carries `condition: ConditionBooleanPiecesCount(OceanHuedClam, 4)` — at 2pc
 * (`set_pieces.oceanhuedclam = 2 < 4`) `compileCharacter` does not produce it (no orphan
 * in the sets-2pc fixture, which has no foam key); at 4pc it is produced. Verified: 2pc →
 * absent, 4pc → present & 0/0/0; sigewinne normal_hit_1 1242.4 (unaffected) both tiers.
 *
 * FAITHFULNESS (modeled in Phase 3 ④, M4b): her `FeatureDamageClam` OVERRIDES
 * `getStatsDmgBonus`/`getStatsCritRate`/`getStatsCritDamage` → [] and
 * `getDefenceLevelMultiplier` → 1 (the foam takes NO dmg-bonus, cannot crit, ignores
 * enemy defense; resistance still applies — Damage/Clam.js). These are ported as the
 * feature flags `noCrit` / `noDamageBonus` / `ignoreEnemyDefence` + the multiplier's
 * `capValue: 30000` (her `CValueCap`). The `accumulated_healing` input is a 4pc
 * `ConditionNumber` (max 30000) that injects the bare bag key the foam scales. The
 * `clam_foam` oracle fixture (Sigewinne, accumulated_healing 20000 → foam 16200) gates
 * this. At the v5.8 standard input 0 the ConditionNumber is inactive → the foam is 0,
 * so the existing accumulated_healing=0 armory fixture is byte-unchanged.
 *
 * serializeId: 37 (raw ArtifactSet.serializeId). The `ConditionStaticClam` / `ConditionNumber`
 * machinery (healing recalc, the stack input) governs the HP-bonus + recalc flow, not the
 * foam's v5.8 value; the 2pc `healing` + 4pc display markers are modeled as plain statics
 * (text_percent_hp is UI-only → omitted).
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Artifacts/Set/OceanHuedClam.js:9-71
 *   raw/genshin_calc_pub/src/js/classes/Feature2/Damage/Clam.js (getStats* → [], def mult → 1)
 *   raw/genshin_calc_pub/src/js/classes/Feature2/Damage.js:26-27 (element/damageType defaults)
 */

import type { DbObjectArtifactSet, Feature } from "@genshin/types";

// Sea-Dyed Foam: 90% of accumulated_healing, PHYSICAL, no leveling (constant table),
// capped at 30000. Her FeatureDamageClam: NO crit, NO dmg-bonus, DEF IGNORED (resistance
// still applies). Gated to 4pc via ConditionBooleanPiecesCount so it never orphans the 2pc
// fixture. `accumulated_healing` reads the BARE bag key (RAW_BAG_SCALING_KEYS) the 4pc's
// ConditionNumber injects from the input; at the v5.8 standard input 0 the condition is
// inactive → the key is absent → the foam reads 0 (the existing armory fixture is unmoved).
const seaDyedFoam: Feature = {
  name: "sea_dyed_foam_dmg",
  // No `category` → `featureKey` defaults it to "other" (her raw `category: 'other'`,
  // which our FeatureCategory union doesn't enumerate; the default yields the exact
  // `other.sea_dyed_foam_dmg` key the fixture uses). `damageTypeOf`'s default-case → ""
  // (no `dmg_<type>` bonus), matching her FeatureDamage `damageType: 'none'` default.
  element: "physical",
  // FeatureDamageClam overrides (Damage/Clam.js): the foam cannot crit, takes no
  // dmg-bonus, and ignores enemy DEF. Resistance is NOT suppressed (she keeps the base
  // getResistanceMultiplier).
  noCrit: true,
  noDamageBonus: true,
  ignoreEnemyDefence: true,
  multipliers: [
    {
      scaling: "accumulated_healing",
      leveling: "",
      values: { getValue: (): number => 90 },
      // Her FeatureMultiplier.capValue (ValueTable([30000])) → min(0.9 × ah, 30000) on the
      // base term. The cap is UNREACHABLE via the input (0.9 × max-input 30000 = 27000 <
      // 30000) but ported faithfully.
      capValue: 30000,
    },
  ],
  condition: { type: "pieces-count", setName: "OceanHuedClam", count: 4 },
};

export const oceanHuedClam: DbObjectArtifactSet = {
  name: "artifact_set.ocean_hued_clam",
  goodId: "OceanHuedClam",
  bonus: {
    // 2pc — Healing Bonus +15% (OceanHuedClam.js:20-30).
    2: {
      conditions: [
        {
          type: "static",
          title: "set_bonus.ocean_hued_clam_2",
          stats: { healing: 15 },
        },
      ],
    },
    // 4pc — the foam (below) is the damage; the raw 4pc `text_percent_hp` marker is UI-only
    // (not in any buildStats emit list → numeric no-op), so the static tier carries no stats.
    // The ConditionNumber `accumulated_healing` (her OceanHuedClam.js:35-41, max 30000) injects
    // the healing input into the stats bag the foam scales — her ConditionNumber.getStats adds
    // `accumulated_healing` (value clamped to [0,30000]) when ACTIVE. It is INACTIVE at input 0
    // (Condition/Number.js:8-11 require > 0), so the v5.8 standard build (no input) adds nothing
    // → the foam reads 0 and the existing OceanHuedClam armory fixture (foam 0) is byte-unchanged.
    4: {
      conditions: [
        {
          type: "static",
          title: "set_bonus.ocean_hued_clam_4",
          stats: {},
        },
        {
          type: "number",
          name: "accumulated_healing",
          title: "set_bonus.ocean_hued_clam_4_stack",
          max: 30000,
          stats: {},
        },
      ],
    },
  },
  features: [seaDyedFoam],
};
