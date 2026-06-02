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
 * FAITHFULNESS NOTE (deferred to a non-zero-healing config): her `FeatureDamageClam`
 * OVERRIDES `getStatsDmgBonus`/`getStatsCritRate`/`getStatsCritDamage` → [] and
 * `getDefenceLevelMultiplier` → 1 (the foam takes NO dmg-bonus, cannot crit, ignores
 * enemy defense; Damage/Clam.js). Our generic `FeatureDamage` compile path does not
 * replicate those overrides — but with `accumulated_healing = 0` the foam is 0 regardless
 * (0 × any factor = 0), so the v5.8 fixture is exact. Modeling the Clam-specific
 * no-crit/no-dmg/no-def + the 30 000 cap is left for when a config drives non-zero
 * accumulated_healing (E2b / ④); it is not needed for v5.8 parity.
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

// Sea-Dyed Foam: 90% of accumulated_healing, PHYSICAL, no leveling (constant table).
// Gated to 4pc via ConditionBooleanPiecesCount so it never orphans the 2pc fixture.
const seaDyedFoam: Feature = {
  name: "sea_dyed_foam_dmg",
  // No `category` → `featureKey` defaults it to "other" (her raw `category: 'other'`,
  // which our FeatureCategory union doesn't enumerate; the default yields the exact
  // `other.sea_dyed_foam_dmg` key the fixture uses). `damageTypeOf`'s default-case → ""
  // (no `dmg_<type>` bonus), matching her FeatureDamage `damageType: 'none'` default.
  element: "physical",
  multipliers: [
    {
      scaling: "accumulated_healing",
      leveling: "",
      values: { getValue: (): number => 90 },
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
    // (not in any buildStats emit list → numeric no-op), so the tier carries no stats here.
    4: {
      conditions: [
        {
          type: "static",
          title: "set_bonus.ocean_hued_clam_4",
          stats: {},
        },
      ],
    },
  },
  features: [seaDyedFoam],
};
