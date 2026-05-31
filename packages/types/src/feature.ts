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
 *   wiki/architecture/feature2-engine.md
 *   wiki/architecture/db-object-model.md
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
   */
  readonly source?: string;
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
   * CHAR-LEVEL multipliers only: optional gate. The multiplier contributes iff
   * `evaluate(condition)` is true (an absent condition is always-active, per her
   * `FeatureMultiplier.isActive`: `if (!this.condition) return true`). Routes
   * always-on (Itto A4) and constellation-/ascension-granted multipliers through
   * the same channel.
   */
  readonly condition?: Condition;
}

/**
 * Targeting predicate for a char-level multiplier — which features it applies to.
 *
 * A faithful subset of her `FeatureMultiplierTarget` (Multiplier/Target.js). Only
 * `damageTypes` is modelled here: it is the field every v5.8 char-level targeted
 * multiplier uses (Itto A4 → charged, Albedo C2 → burst, …). `isMatchFeature`
 * keeps an entry iff `damageTypes` includes the feature's resolved damage type
 * (`damageTypeOf`). The remaining raw fields (`damageTypesExclude`,
 * `damageElements`, `tags`, `options`) are unused by any v5.8 character's
 * char-level multipliers and are deferred until a source needs them.
 *
 * Source: raw/genshin_calc_pub/src/js/classes/Feature2/Multiplier/Target.js
 */
export interface FeatureMultiplierTarget {
  /** Feature damage types this multiplier applies to (e.g. `["charged"]`, `["burst"]`). */
  readonly damageTypes: readonly string[];
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
   * Marks a standalone reaction feature (a separate damage instance keyed by its
   * reaction nature, NOT a `settings.reaction` toggle on a normal hit). When set,
   * `compileFeature` routes the feature to the matching `@genshin/core` reaction
   * factory instead of building the normal-hit tree. Currently models the
   * crit-bearing Lunar-Charged family (`lunarreaction` / `lunardirect`).
   *
   * Source: raw/.../Feature2/Reaction/Transformative/Lunar/*.js
   */
  readonly reaction?: FeatureReaction;
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
