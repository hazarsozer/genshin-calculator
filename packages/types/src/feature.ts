/**
 * Feature structural shapes.
 *
 * A Feature is a declarative description of a combat action — a damage hit,
 * a heal, a multiplier modifier — as seen in db/Char/<Name>.js and
 * db/Weapon/<Type>/<Name>.js. The Feature2 engine compiles these into
 * executable functions. This file defines the structural contract; P1.5
 * (engine core) will implement the compilation logic.
 *
 * Sources:
 *   wiki/tools/calculator/feature2-engine.md
 *   wiki/tools/calculator/db-object-model.md
 *   raw/genshin_calc_pub/src/js/db/Char/Hutao.js (usage examples)
 */

import type { Element, TalentTable } from "./character.js";
import type { Condition } from "./condition.js";
import type { DamageContext, DamageResult } from "./damage.js";

/** High-level category of a feature declaration. */
export type FeatureCategory =
  | "attack"
  | "skill"
  | "burst"
  | "weapon"
  | "plunge"
  | "reaction";

/**
 * A multiplier entry within a Feature: scaling stat, talent level progression,
 * and the percent-of-scaling-stat values per talent level.
 */
export interface FeatureMultiplierEntry {
  /**
   * Stat the multiplier scales from: 'atk' (default), 'def', 'hp', 'hp*'
   * (max HP — used for Hu Tao burst heal, etc.).
   */
  readonly scaling?: string;
  /**
   * Which level setting governs this multiplier's talent level (e.g.
   * 'char_skill_attack'). The glue reads this key from the EvalContext/build to
   * pick the talent level fed into `values.getValue(level)`.
   */
  readonly leveling: string;
  /**
   * Talent-level-indexed multiplier table; `getValue(talentLevel)` yields the
   * percent-of-scaling value (her `Talents.get(path)` result). For a constant
   * multiplier (e.g. constellation flat %) this is a 1-entry table.
   */
  readonly values: TalentTable;
  /**
   * Provenance label (her `FeatureMultiplier.source`, e.g. `"ascension4"`,
   * `"constellation2"`). Informational only — never affects the computed value.
   * Present on char-level multipliers; absent on plain per-feature talent terms.
   * (Her `scalingSource` is the same kind of label — fold it into `source`.)
   */
  readonly source?: string;
  /**
   * Flat extra multiplier on the base term (her `FeatureMultiplier.scalingMultiplier`
   * when NUMERIC): the term becomes `talent% × scalingStat × scalingMultiplier`. Used
   * by "bonus hit = X% of a base hit" constellations — e.g. Amber C1's second arrow
   * (20% of the aimed shot, `scalingMultiplier: 0.20`). Absent = ×1 (no effect).
   *
   * Mirrors her `getTreeBonusMultiplier` → `CConst(value)` for a numeric
   * `getScalingMultiplier` (Multiplier.js:223-264). The string-stat form
   * (`(1 + stat)`) and the `scalingMultiplierCondition` gate are not yet modelled
   * (no v5.8 constellation in scope needs them); add them if a source does.
   */
  readonly scalingMultiplier?: number;
  /**
   * Settings-driven additive offset to the scaling fraction.
   *
   * When present, `compileFeature` reads `settings[setting]`, clamps it to
   * `[0, maxStacks]`, and adds `perStack × clamped` to the `scalingMultiplier`
   * before the talent% × scalingStat multiplication. The total scaling factor
   * becomes `(scalingMultiplier ?? 1) + perStack × min(maxStacks, settings[setting])`.
   *
   * When `settings[setting]` is absent or 0 the offset is 0 — base-safe by design.
   *
   * Ports Furina's `FeatureMultiplierFurinaSkill.getScalingMultiplier`:
   *   `result += 0.1 × Math.min(4, data.settings.furina_hp_offers)`
   * (raw/genshin_calc_pub/src/js/classes/Feature2/Multiplier/FurinaSkill.js:12-13).
   * Only furina's three Salon Member hits use this; every other multiplier leaves it
   * absent → offset 0 → existing behaviour unchanged.
   */
  readonly scalingOffset?: {
    readonly setting: string;
    readonly perStack: number;
    readonly maxStacks: number;
  };
  /**
   * Runtime coefficient on the base term, derived from a STAT TOTAL (her
   * FeatureMultiplierSayuBurst / FeatureMultiplierKiraraBurst). When present, the
   * term's scalingFactor becomes min( f(getTotal(stat)), cap ), where
   *   f = stat × ratio          (sayu C6:  mastery × 0.002, cap 4)
   *     | floor(stat / divisor) (kirara C1: floor(hp / 8000), cap 4)
   * exactly one of `ratio` | `divisor` (divisor implies floor()). Absent → unchanged.
   * Replaces the build-coupled constant fold; reads the CURRENT build's total, so it
   * tracks any build (validated off-build by the Task-1 oracle fixtures in Task 3).
   *
   * Applied as a RUNTIME factor — a `cStat`-rooted subtree on the base term, NOT a
   * compile-time literal: the stat total lives in the eval-time bag (`<stat>_total`),
   * not in the CompileContext, so the coefficient is read where every other
   * stat-dependent factor is — at eval. `stat` is the bare total-stat key (`"mastery"`
   * | `"hp"`), resolved to `<stat>_total` exactly like the `scaling` field. Mutually
   * exclusive with `scalingMultiplier` / `scalingOffset` (none co-occur on a
   * coefficient term).
   */
  readonly coefficientFromStat?: {
    readonly stat: string;      // total-stat key, e.g. "mastery" | "hp"
    readonly ratio?: number;
    readonly divisor?: number;
    readonly cap: number;
  };
  /**
   * Absolute cap on THIS multiplier's base term (`levelMultiplier × scalingStat`),
   * applied as `min(term, capValue)` BEFORE the term enters the base-damage sum and
   * before the dmg-bonus / resistance / defence factors — exactly her
   * `FeatureMultiplier.capValue` (a `ValueTable`) which wraps the multiplier `getTree`
   * in a `CValueCap` (`Math.min(tree, cap)`, Multiplier.js:233-237, Block.js:466-477).
   *
   * The sole v5.8 user is Ocean-Hued Clam's Sea-Dyed Foam: `min(0.9 × accumulated_healing,
   * 30000)`. Her table is a 1-entry constant, so a plain number suffices. Absent → no cap.
   *
   * Source: raw/genshin_calc_pub/src/js/db/Artifacts/Set/OceanHuedClam.js:59-65
   */
  readonly capValue?: number;
  /**
   * CHAR-LEVEL multipliers only: which features this multiplier applies to.
   * When set (only on `char.multipliers` entries), the multiplier is summed into
   * a feature's base-damage term iff `target.damageTypes` includes the feature's
   * resolved damage type. Per-feature entries leave this absent (they apply only
   * to their own feature). Ports `FeatureMultiplier.target` /
   * `FeatureMultiplierTarget.isMatchFeature`.
   *
   * Source: raw/genshin_calc_pub/src/js/classes/Feature2/Multiplier/Target.js
   */
  readonly target?: FeatureMultiplierTarget;
  /**
   * Optional gate: the multiplier contributes iff `evaluate(condition)` is true
   * (an absent condition is always-active, per her `FeatureMultiplier.isActive`:
   * `if (!this.condition) return true`). Honoured at BOTH levels, exactly as her
   * `isActive` is — on a CHAR-LEVEL multiplier (`char.multipliers`: Itto A4,
   * Albedo C2, …) AND on a PER-FEATURE multiplier (a feature's own `multipliers`:
   * e.g. Fischl C2's second `skill_dmg` term gated by `ConditionConstellation(2)`).
   * `compileFeature` filters both via `evaluate`. Inert for every base feature
   * (none set a per-feature multiplier condition).
   */
  readonly condition?: Condition;
}

/**
 * Targeting predicate for a char-level multiplier — which features it applies to.
 *
 * A faithful subset of her `FeatureMultiplierTarget` (Multiplier/Target.js),
 * modelling the AND-chain of `isMatchFeature` as each in-scope source needs it:
 *   - `damageTypes` — the field every v5.8 char-level targeted multiplier uses
 *     (Itto A4 → charged, Albedo C2 → burst, …): keep iff it includes the
 *     feature's resolved damage type (`damageTypeOf`).
 *   - `damageElements` — keep iff it includes the feature's RESOLVED element
 *     (`resolveElement`). Used by Bucket-C teammate multipliers that buff one
 *     element only (Shenhe's Icy Quill → `["cryo"]`, Faruzan → `["anemo"]`,
 *     Escoffier → `["cryo"]`). ABSENT/empty → no element constraint (base-inert).
 *
 * The chain is AND: a feature must satisfy every PRESENT filter. The remaining raw
 * fields (`damageTypesExclude`, `tags`, `options`) are unused by any in-scope v5.8
 * char-level multiplier and are deferred until a source needs them.
 *
 * Source: raw/genshin_calc_pub/src/js/classes/Feature2/Multiplier/Target.js
 *         (`isMatchFeature`: the damageTypes branch + the damageElements branch).
 */
export interface FeatureMultiplierTarget {
  /** Feature damage types this multiplier applies to (e.g. `["charged"]`, `["burst"]`). */
  readonly damageTypes: readonly string[];
  /**
   * Feature ELEMENTS this multiplier applies to (e.g. `["cryo"]`, `["anemo"]`).
   * When present and non-empty, the feature's resolved element must be in it
   * (her `isMatchFeature` element branch, Target.js:37-39). Absent/empty → the
   * element filter is skipped (no constraint) — base-inert: no v5.8 base/cons/
   * armory multiplier sets it, so the new branch is never entered for them.
   */
  readonly damageElements?: readonly string[];
}

/**
 * A char-level ("targeted") multiplier: a `FeatureMultiplierEntry` carried on
 * `DbObjectChar.multipliers` (rather than on a single feature) that injects into
 * EVERY feature matching its `target`, gated by its optional `condition`. This is
 * her general mechanism for ascension/constellation damage-type bonuses (Itto A4's
 * `0.35×DEF` on charged, Albedo C2's `def*` on burst, etc.).
 *
 * It is the same structural shape as `FeatureMultiplierEntry`; this alias names the
 * char-level role (where `target` is meaningful) for readability. `target` is
 * required here (a char-level multiplier without a target would apply to nothing
 * useful); `condition` stays optional (absent = always-on, e.g. Itto A4).
 *
 * Source: raw/genshin_calc_pub/src/js/classes/Feature2.js:121-125 (getMultipliers
 *         merges active+matching char.multipliers into each feature's base term).
 */
export interface CharMultiplier extends FeatureMultiplierEntry {
  readonly target: FeatureMultiplierTarget;
}

/**
 * Structural shape of a Feature2 feature declaration.
 * Faithfully captures the fields present on FeatureDamage* / FeatureHeal subclasses.
 *
 * NOTE: `isChild`, `allowInfusion`, `items` are multihit-specific. P1.5 will
 * discriminate the union based on feature type; for now a single shape with
 * optional fields is the smallest faithful representation.
 */
export interface Feature {
  readonly name: string;
  readonly category?: FeatureCategory;
  /**
   * Explicit damage type for DMG-bonus key selection (e.g. `"charged"`, `"normal"`,
   * `"plunge"`, `"skill"`, `"burst"`). When present, this overrides the category-based
   * inference in `damageTypeOf()`. Required for charged-attack features because their
   * raw `category` is `"attack"` (same as normal hits) but they need `dmg_charged`.
   *
   * Source: raw/.../Feature2/Damage/Charged.js → damageType: 'charged'
   */
  readonly damageType?: string;
  /** Overrides the character's innate element for this hit (e.g. Hu Tao Blood Blossom). */
  readonly element?: Element;
  /**
   * Per-feature multiplier entries (talent scaling terms). Entries here apply
   * ONLY to this feature and must NOT set `target` or `condition` — those fields
   * are ignored on per-feature entries and are meaningful ONLY on char-level
   * entries (`char.multipliers` / `CharMultiplier`). Use `CharMultiplier` for
   * cross-feature targeted multipliers (Itto A4, Albedo C2, etc.).
   */
  readonly multipliers?: readonly FeatureMultiplierEntry[];
  /** True for child hits within a multihit (displayed but not counted in rotation by default). */
  readonly isChild?: boolean;
  /** Whether the hit can receive elemental infusion. */
  readonly allowInfusion?: boolean;
  /** Sub-items for multihit features. */
  readonly items?: readonly { readonly multipliers: readonly FeatureMultiplierEntry[] }[];
  /**
   * Extra DMG% bonus stat keys this feature picks up beyond the generic
   * `dmg_all`/`dmg_<element>`/`dmg_<type>` set — her `FeatureDamage.damageBonuses`,
   * concatenated into the DMG-bonus sum (Damage.js:61-64). E.g. Amber C2's
   * `dmg_skill_amber`. Each is a fraction at execution time. Absent keys read 0.
   */
  readonly damageBonuses?: readonly string[];
  /**
   * Extra crit-rate stat keys this feature picks up beyond the generic crit-rate
   * set — her `FeatureDamage.critRateBonuses`, summed into the crit-rate term
   * (Damage.js:81-83). E.g. Amber's A1 `crit_rate_amber` (auto-active at A6) or
   * Kaeya's conditional `crit_rate_kaeya`. Each is a fraction; absent keys read 0.
   */
  readonly critRateBonuses?: readonly string[];
  /**
   * Extra crit-DMG stat keys this feature picks up beyond the generic crit-DMG
   * set — her `FeatureDamage.critDamageBonuses`, summed into the crit-DMG term
   * (Damage.js:109-111). Each is a fraction at execution time; absent keys read 0.
   */
  readonly critDamageBonuses?: readonly string[];
  /**
   * Special-damage suppression flags — her `FeatureDamageClam` (Ocean-Hued Clam's
   * Sea-Dyed Foam) overrides, the only v5.8 user. Each maps 1:1 to one of her
   * `getStats*`/`getDefenceLevelMultiplier` overrides (Damage/Clam.js). All absent =
   * a normal damage feature (every other hit), so the base/cons/armory surface is
   * untouched.
   *
   *   `noCrit` — her `getStatsCritRate`/`getStatsCritDamage` → []: the hit cannot crit
   *     (crit blocks omitted → chance 0 → crit == normal == avg).
   *   `noDamageBonus` — her `getStatsDmgBonus` → []: NO `dmg_all`/`dmg_<element>`/
   *     `dmg_<type>` bonus is applied (the bonus factor degenerates to 1).
   *   `ignoreEnemyDefence` — her `getDefenceLevelMultiplier` → `CConst(1)`: the hit
   *     ignores enemy DEF entirely (the defence factor is a constant 1). Resistance is
   *     NOT suppressed (she does not override `getResistanceMultiplier`).
   *
   * Source: raw/genshin_calc_pub/src/js/classes/Feature2/Damage/Clam.js
   */
  // --- FeatureDamageClam suppression flags (see group doc above) ---
  readonly noCrit?: boolean;
  /** See group comment above (FeatureDamageClam suppression flags). */
  readonly noDamageBonus?: boolean;
  /** See group comment above (FeatureDamageClam suppression flags). */
  readonly ignoreEnemyDefence?: boolean;
  /**
   * Excludes this hit from amplifying reactions (Vaporize/Melt) — her `FeatureDamage`
   * `params.cannotReact` / `canReact()` (Damage.js:28,308). When true, `compileFeature`
   * never appends the amplifying factor even if `settings.reaction` is set and the element
   * matches. The systematic v5.8 user is `FeatureDamagePlungeCollision` (Plunge/Collision.js:5
   * — the descent plunge, vs the reacting `plunge_low`/`plunge_high` ShockWave); a few chars
   * also flag specific hits. Absent = reacts normally (and inert in every base build, where
   * `settings.reaction` is unset).
   */
  readonly cannotReact?: boolean;
  /**
   * Marks a standalone reaction feature (a separate damage instance keyed by its
   * reaction nature, NOT a `settings.reaction` toggle on a normal hit). When set,
   * `compileFeature` routes the feature to the matching `@genshin/core` reaction
   * factory instead of building the normal-hit tree. Currently models the
   * crit-bearing Lunar-Charged family (`lunarreaction` / `lunardirect`).
   *
   * Source: raw/.../Feature2/Reaction/Transformative/Lunar/*.js
   */
  readonly reaction?: FeatureReaction;
  /**
   * Optional gate on whether this feature is PRODUCED at all. When present,
   * `compileCharacter` emits the feature only if `evaluate(condition, settings)` is
   * true (absent = always produced). This is how a CONSTELLATION-added damage feature
   * is modelled: declare it with `condition: ConditionConstellation(n)` so it appears
   * only at C≥n — her `CalcObjectCharacter.getFeatures` concats
   * `constellation.getFeatures(level)` (cons features unlocked by level) +
   * `getFeaturesHash`'s `feat.checkConditions` filter. Inert at the base build (no base
   * feature sets it → all produced), so the C0 golden suite is untouched.
   *
   * Source: raw/.../classes/CalcObject/Character.js:82-95 (getFeatures);
   *         raw/.../classes/CalcSet.js (getFeaturesHash feat.checkConditions filter)
   */
  readonly condition?: Condition;
}

/**
 * Declarative descriptor for a standalone reaction feature. Faithfully captures
 * the inputs `@genshin/core`'s Lunar-Charged factory needs.
 *
 * Shapes (her `Reaction/Transformative/*`):
 *   - `variant: "transformative"` — standard non-crit reaction (Overload,
 *     Superconduct, Electro-Charged, Shatter, Swirl, Hyperbloom, Burgeon,
 *     Burning, …): `reactionMultiplier × levelMult × (1 + emBonus + Σ reactionBonus)
 *     × resMultiplier`. Cannot crit (crit keys omitted).
 *   - `variant: "lunarcharged"` — rate-based reaction: `1.8 × (1+scaling) × levelMult`.
 *   - `variant: "lunardirect"`  — base-scaled direct hit: `(Σ base%×scalingStat)
 *     × (1+scaling)`, then an extra flat amplifying factor (×3).
 *
 * All apply `(1 + emBonus + Σ reactionBonus) × resMultiplier`. The two Lunar
 * variants are crit-bearing via the supplied crit-stat keys; `transformative`
 * is not.
 */
export interface FeatureReaction {
  /** Which reaction shape this feature is. */
  readonly variant: "transformative" | "lunarcharged" | "lunardirect";
  /** Reaction output element for the resistance lookup (`enemy_res_<element>`). */
  readonly element: Element;
  /**
   * `transformative` only: the per-reaction coefficient (her `getReactionRate()`,
   * NOT the canonical game value) multiplied by the level table. E.g. Overload
   * 2.75, Superconduct 1.5, Electro-Charged 2, Shatter 3, Swirl 0.6, Bloom 2,
   * Hyperbloom/Burgeon 3, Burning 0.25.
   *
   * Source: raw/.../Feature2/Reaction/Transformative/<Reaction>.js getReactionRate()
   */
  readonly reactionMultiplier?: number;
  /**
   * Rate-scaling stat keys: the `(1 + Σ)` term that scales the rate (reaction) or
   * the base (direct). For Lunar-Charged this is `["lunarcharged_multi"]`.
   */
  readonly scalingStatKeys?: readonly string[];
  /** Reaction-DMG-bonus stat keys, summed inside `(1 + emBonus + Σ)`. */
  readonly reactionBonusKeys?: readonly string[];
  /** Crit-rate stat keys (Lunar-Charged is crit-bearing). */
  readonly critRateKeys?: readonly string[];
  /** Crit-DMG stat keys. */
  readonly critDmgKeys?: readonly string[];
  /**
   * `lunardirect` only: the flat amplifying multiplier her `ChargedLike` appends
   * (`CMultiplierAmplifying([3%])` → a bare ×3). Defaults to 1.
   */
  readonly amplifyingMultiplier?: number;
  /**
   * `lunarcharged` only: fractional penalty applied to the reaction rate.
   * Her `FeatureReactionLunarCharged({ penalty: 1/2 })` etc. Multiplied into
   * the base rate before levelMult. Defaults to 1 (no penalty).
   *
   * Source: raw/genshin_calc_pub/src/js/db/Features/Reactions.js:99-112
   */
  readonly penalty?: number;
}

/**
 * A compiled, executable damage feature: accepts the damage context (build
 * stats + enemy + settings) and returns the DamageResult triple.
 * This is what Feature2 + Compiler.js produce; P1.5 implements the compilation
 * and will refine this signature as the engine model is designed.
 */
export type CompiledFeature = (context: DamageContext) => DamageResult;
