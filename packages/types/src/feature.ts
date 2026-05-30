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
import type { DamageContext, DamageResult } from "./damage.js";

/** High-level category of a feature declaration. */
export type FeatureCategory =
  | "attack"
  | "skill"
  | "burst"
  | "weapon"
  | "plunge";

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
}

/**
 * A compiled, executable damage feature: accepts the damage context (build
 * stats + enemy + settings) and returns the DamageResult triple.
 * This is what Feature2 + Compiler.js produce; P1.5 implements the compilation
 * and will refine this signature as the engine model is designed.
 */
export type CompiledFeature = (context: DamageContext) => DamageResult;
