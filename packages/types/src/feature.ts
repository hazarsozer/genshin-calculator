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
  | "reaction"
  // Her catch-all category for off-field / passive readouts (heal-over-time, devotion
  // shields, buff-value statics) keyed `other.<name>`. `featureKey` already defaults an
  // absent category to "other"; this lets a feature set it explicitly (P3.5.3 outputs).
  | "other";

/**
 * Catalyze (Spread/Aggravate) term spec — see {@link FeatureMultiplierEntry.catalyze}.
 * `prefactor` is the per-direction reaction multiplier (Spread 1.25 / Aggravate 1.15);
 * `bonusKeys` are the plain-bag `dmg_reaction_*` keys summed inside the `(1 + …)` factor.
 */
export interface CatalyzeSpec {
  /** Her `getReactionMultiplier`: 1.25 (Spread/dendro) | 1.15 (Aggravate/electro). */
  readonly prefactor: number;
  /** Plain-bag reaction-bonus keys (`dmg_reaction_quicken` + `_spread`/`_aggravate`). */
  readonly bonusKeys: readonly string[];
}

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
   * `getScalingMultiplier` (Multiplier.js:223-264). The optional
   * {@link scalingMultiplierCondition} gate is now modelled (Freminet's frost ×2);
   * the string-stat form (`(1 + stat)`) is still not (no v5.8 source in scope needs
   * it) — add it if a source does.
   */
  readonly scalingMultiplier?: number;
  /**
   * Optional gate on the numeric {@link scalingMultiplier}: her `getScalingMultiplier`
   * returns `scalingMultiplier` only when this condition is absent OR active, and `1`
   * otherwise (Multiplier.js:157-162: `if (!scalingMultiplierCondition ||
   * scalingMultiplierCondition.isActive(settings)) return scalingMultiplier; return 1`).
   * So an INACTIVE gate reverts the factor to 1 (no bonus); an ABSENT gate applies the
   * constant unconditionally (exactly as today). Evaluated at COMPILE time against the
   * build's settings, like {@link scalingOffset} (the multiplier bakes into the base
   * term; a settings change recompiles the feature).
   *
   * The sole v5.8 user is Freminet's frost DMG — `scalingMultiplier: 2` gated by the
   * `freminet_stalking_mode` burst-stance toggle (a `ConditionBoolean`, raw
   * Freminet.js:268-274). Absent ⇒ the constant always applies; and even when set, the
   * gate is OFF in every base build (all 58k goldens) → the factor stays
   * `scalingMultiplier ?? 1` unchanged → base-inert. Mutually exclusive with
   * {@link scalingMultiplierFromTable} (the table form is a full override).
   *
   * Source: raw/genshin_calc_pub/src/js/classes/Feature2/Multiplier.js:157-162
   *         (getScalingMultiplier); raw/.../db/Char/Freminet.js:268-274 (the gated ×2).
   */
  readonly scalingMultiplierCondition?: Condition;
  /**
   * TABLE-driven scaling multiplier: her `FeatureMultiplierNeuvilleteCharged` OVERRIDES
   * `getScalingMultiplier` with a `ValueTable` lookup keyed by a settings level —
   * `level = settings[levelSetting]; return level > 0 ? table.getValue(level) : 1`
   * (NeuvilleteCharged.js). The lookup is her `ValueTable.getValue` (1-indexed, clamped
   * to `table.length`, ValueTable.js); a level ≤ 0 (or an absent/non-numeric key) yields
   * `1`, NOT 0 (the subclass guards the table's 0-at-≤0 with an explicit `1`). This form
   * REPLACES the constant {@link scalingMultiplier} + {@link scalingMultiplierCondition}
   * (the subclass override ignores both) — set exactly one of the constant/conditional
   * form OR the table form (compileFeature throws if both are present).
   *
   * The sole v5.8 user is Neuvillette's two equitable-judgment charged attacks
   * (`neuvillette_ancient_seas_legacy` Sourcewater-droplet stacks → `[1.1, 1.25, 1.6]`,
   * raw Neuvillette.js:194-213). Absent ⇒ the constant path; and even when set, the level
   * is 0 in every base build (all 58k goldens) → factor 1 → base-inert.
   *
   * Source: raw/genshin_calc_pub/src/js/classes/Feature2/Multiplier/NeuvilleteCharged.js
   *         (getScalingMultiplier); raw/.../classes/ValueTable.js (getValue indexing).
   */
  readonly scalingMultiplierFromTable?: {
    /** The value table (her `new ValueTable([...])`), 1-indexed by the resolved level. */
    readonly table: readonly number[];
    /** The settings key holding the integer level (e.g. `neuvillette_ancient_seas_legacy`). */
    readonly levelSetting: string;
  };
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
   * Optional floor-at-zero threshold subtracted from the SCALING STAT before the
   * talent% multiply: the scaling factor becomes `max(scalingStat − exceedStatValue, 0)`
   * (her FeatureMultiplier.getTreeStatValue, Multiplier.js:281-301 — `CMax([CSubtract([stat,
   * exceedStatValue]), 0])`). Models a "scales off the stat ABOVE a threshold" buff
   * (Sigewinne: max HP above 30000). Absent ⇒ the plain `scalingStat` (base-inert).
   * Source: raw/.../db/Char/Sigewinne.js:533 (exceedStatValue: A1MinHP).
   */
  readonly exceedStatValue?: number;
  /**
   * Optional ADDITIVE bonus term on the talent% fraction, keyed off a SEPARATE stacks
   * level (her FeatureMultiplier.bonusLeveling/bonusValues): `talentPercent += bonusValues
   * .getValue(settings[bonusLeveling] || 1) / 100`. Mirrors her getValue (Multiplier.js:184-186)
   * = `values.getValue(level)/100 + bonusValues.getValue(getBonusLevel)/100`, getBonusLevel =
   * `getLevel(bonusLeveling) || 1` (:168-169) — the `|| 1` coerces an absent/0 stacks count to 1.
   * (Our plain `settings[bonusLeveling]` omits the `_bonus` offsets her getLevel would add, but
   * none exist for the only v5.8 key, so it is exact.) Both absent ⇒ no bonus term (base-inert).
   * Source: raw/.../db/Char/YunJin.js (yunjin_traditionalist_stacks → [2.5,5,7.5,11.5]).
   */
  readonly bonusLeveling?: string;
  /** Companion per-stacks-level value table for {@link bonusLeveling} (1-indexed). */
  readonly bonusValues?: TalentTable;
  /**
   * Catalyze (Spread/Aggravate) term spec — present ONLY on the two global catalyze
   * multipliers (`catalyzeMultipliers()` in `reactions.ts`). When set, this entry's
   * base-damage term is NOT the talent% × scalingStat product; it is the catalyze term
   * summed into a Dendro/Electro hit's base damage when `settings.reaction == 'quicken'`:
   *
   *   prefactor × REACTION_LEVEL_MULTIPLIERS[charLevel-1]
   *             × (1 + 5·EM/(EM+1200) + Σ bonusKeys)
   *
   * `prefactor` is her per-direction reaction multiplier (Spread 1.25 / Aggravate 1.15,
   * her `getReactionMultiplier`). The EM curve reads `mastery_total` (her
   * `makeStatTotalItem('mastery')`, the aggregate); `bonusKeys` are PLAIN bag reads (her
   * `makeStatItem`, NOT `_total`) — `dmg_reaction_quicken` + `dmg_reaction_{spread|aggravate}`.
   * The term is summed into `cBaseDamage` BEFORE the dmg%/crit/res/def factors, so it
   * inherits the hit's crit/DMG%/res/def — exactly her `FeatureMultiplierReactionQuicken`
   * (a base-term multiplier merged via `getMultipliers`).
   *
   * When set, the talent% / scaling / `scalingMultiplier` / `scalingOffset` /
   * `coefficientFromStat` / `exceedStatValue` / `flatValues` / `capValue` machinery is
   * bypassed (a catalyze multiplier carries none of those). Absent ⇒ the normal base-term
   * path; no existing entry sets it ⇒ the 58k damage goldens are byte-identical.
   *
   * Source: raw/.../classes/Feature2/Multiplier/Reaction/Quicken.js (getTree),
   *         Quicken/Spread.js + Quicken/Aggravate.js (the 1.25 / 1.15 + bonus keys),
   *         raw/.../db/CalcData/Multipliers.js (the two `reaction == 'quicken'`-gated entries).
   */
  readonly catalyze?: CatalyzeSpec;
  /**
   * Optional FLAT additive term from `FeatureMultiplierList` (her `CConst(getValueFlat)`):
   * a talent-level-indexed table whose value is added DIRECTLY to the base-damage term
   * AFTER the `(talentPercent × scalingStat)` product — i.e. the term becomes
   * `(talentPercent × scalingStat) + flatValues.getValue(talentLevel)`.
   *
   * Her `FeatureMultiplierList.getTree` is `CSum([CMulti([levelMult, statTotal]), CConst(flat)])`,
   * so the flat component is an absolute number (not scaled by any stat) that varies with talent
   * level. Used by every `FeatureMultiplierList`-backed shield (Thoma, Kirara, Xinyan, Citlali,
   * Lan Yan, …) whose talent table carries two entries: `values[0]` = percent, `values[1]` = flat.
   *
   * Absent ⇒ no flat term (base-inert: every existing damage feature leaves it unset).
   *
   * Source: raw/genshin_calc_pub/src/js/classes/Feature2/Multiplier/List.js:25-26,49-51
   *         (`getValueFlat` / `CConst({value: this.getValueFlat(data)})`).
   */
  readonly flatValues?: TalentTable;
  /**
   * When true, append the eval-time `bond_of_life` stat as an EXTRA factor in this
   * term's product — `talent% × scalingStat × bond_of_life` (a three-factor base term,
   * summed additively into `cBaseDamage`, NOT a `(1 + Σ)` layer). Ports her
   * `FeatureMultiplierBondOfLife.getTreeBonusMultiplier`, which pushes
   * `makeStatItem('bond_of_life')` into the multiplier's `CMulti` items
   * (raw/.../classes/Feature2/Multiplier/BondOfLife.js:9-11).
   *
   * THE SCALE: `bond_of_life` reads `out["bond_of_life"]`, which `buildStats` emits as a
   * FRACTION (`raw/100`, e.g. setting 50 → 0.5) — mirroring her `Stats.processPercent`
   * fold of the percent stat before eval. (The `raw` bag keeps it un-folded at 50; that
   * bag feeds Clorinde's C4 post-effect, a DIFFERENT reader — do not conflate.)
   *
   * The two v5.8 users are Arlecchino's masque (a char-level NORMAL multiplier, gated
   * `common.bond_of_life ≥ 30`) and Clorinde's `_{2,3}_heal` (an `hp*` heal multiplier,
   * ungated). Absent ⇒ no extra factor; and even when set, `out["bond_of_life"]` reads 0
   * for every build with no BoL (all 58k goldens) → the factor is ×0 → the term vanishes,
   * so the gated masque never adds and an ungated heal is 0 — base-inert.
   *
   * Source: raw/genshin_calc_pub/src/js/classes/Feature2/Multiplier/BondOfLife.js:9-11
   */
  readonly bondOfLifeFactor?: boolean;
  /**
   * PURE-×stacks factor: append `min(settings[setting], maxStacks)` as an EXTRA factor in this
   * term's product — `talent% × scalingStat × min(stacks, maxStacks)` (a multiplicative factor on
   * the base term, NOT a `1 + perStack×stacks` offset). Ports her `FeatureMultiplier.getStackMultiplier`
   * → `getTree` pushes `CConst(min(settings[stacksLeveling] ?? 0, maxStacks))` into the multiplier's
   * `CMulti` items IFF `stacksLeveling` is set (raw/.../classes/Feature2/Multiplier.js:196-211,228-230).
   *
   * THE DEFAULT: 0 stacks ⇒ the factor is `cConst(0)` ⇒ the whole term is ×0 (vanishes). This is the
   * faithful "0 at 0 stacks" her engine yields — distinct from {@link scalingOffset}
   * (`1 + perStack×stacks`, which can't reach 0) and from `CharPostEffect.stacksSetting` (the
   * party-path `×(stacks||1)`, wrong default). Shared by the DAMAGE base-term path AND the HEAL
   * base-term path (`compileOutput` reuses `baseDamageTerm`).
   *
   * The two v5.8 users are both Lyney's Prop-Surplus stacks (`lyney_surplus_stacks`, maxStacks 5):
   * his `skill.lyney_hp_regeneration` HEAL (`hp*`) and his `skill.skill_dmg`'s 2nd multiplier
   * (ATK-scaled). Absent ⇒ no factor; and even when set, every existing build leaves the setting
   * absent ⇒ `cConst(0)` ⇒ the term vanishes (heal stays 0, skill_dmg stays base-only) — base-inert
   * (the 58k damage goldens + goldenConfig are byte-identical).
   *
   * Source: raw/genshin_calc_pub/src/js/classes/Feature2/Multiplier.js:196-211,228-230
   */
  readonly stacksFactor?: { readonly setting: string; readonly maxStacks: number };
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
 * fields (`damageTypesExclude`, `options`) are unused by any in-scope v5.8
 * char-level multiplier and are deferred until a source needs them.
 *
 * Source: raw/genshin_calc_pub/src/js/classes/Feature2/Multiplier/Target.js
 *         (`isMatchFeature`: the damageTypes + damageElements + tags branches).
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
  /**
   * Feature TAGS this multiplier applies to (the only v5.8 tag is `"plunge_shockwave"`).
   * When present and non-empty, the feature's {@link Feature.tags} must intersect it
   * (her `isMatchFeature` tags branch, Target.js:41-53). Absent/empty → the tag filter
   * is skipped (no constraint). The ONLY v5.8 setter is Xianyun's A4 teammate multiplier
   * (`Xianyun.js:509-511`); no base/cons/armory multiplier sets it → base-inert.
   */
  readonly tags?: readonly string[];
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
 * A NON-DAMAGE feature output — her `FeatureHeal` / `FeatureShield` /
 * `FeatureStatic` / `FeatureReactionCrystallize`. When a {@link Feature} carries
 * `output`, `compileFeature` routes to `compileOutput` (the non-crit-triple path,
 * `normal == crit == avg`) instead of the damage tree. The base scaling stays in
 * `feature.multipliers` (heal/shield/static); crystallize needs no multipliers
 * (its base is the per-level `reactionShieldValues` constant).
 *
 * Her CHeal/CShield/CStaticValue compile to the SAME thing — Π(items) emitted as
 * a triple — so all four kinds are `cDamage({items})` with a kind-specific item
 * list (spec §2). Discriminated by `kind`:
 *   - `heal`   — `base × (1 + healing + healing_base + healing_recv)`; optional
 *     `− bond_of_life × hp_total` (`subtractBoL`, Arlecchino); crit only if the
 *     feature carries `critRateBonuses`. `partyHeal` is informational.
 *   - `shield` — `base × (1 + shield)`; `add_shield_element` (off in the base
 *     dump) would multiply by `elementBonus ?? (geo ? 1.5 : 2.5)`.
 *   - `static` — the bare base term (buff-value readouts).
 *   - `crystallize` — `reactionShieldValues[level] × (1 + shield) ×
 *     (1 + 4.44·EM/(EM+1400))`.
 *
 * Absent on every damage feature → inert for the 58k damage goldens.
 *
 * Source: raw/.../classes/Feature2/{Heal,Shield,Static,Reaction/Crystallize}.js
 */
export type FeatureOutput =
  | { readonly kind: "heal"; readonly subtractBoL?: boolean; readonly partyHeal?: boolean }
  | { readonly kind: "shield"; readonly element?: Element; readonly elementBonus?: number }
  | { readonly kind: "static" }
  | { readonly kind: "crystallize" };

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
  /**
   * Structural tags on this feature, used by char-level multiplier targeting
   * ({@link FeatureMultiplierTarget.tags}). The only v5.8 tag is `"plunge_shockwave"`,
   * carried by every plunge-shockwave hit (her `FeatureDamagePlungeShockWave`
   * constructor pushes it, `ShockWave.js:8`). Absent → no tags. Inert unless a
   * multiplier targets a matching tag (only Xianyun's A4 teammate buff does).
   *
   * Source: raw/.../Feature2/Damage/Plunge/ShockWave.js:8 (`params.tags.push('plunge_shockwave')`)
   */
  readonly tags?: readonly string[];
  /** Overrides the character's innate element for this hit (e.g. Hu Tao Blood Blossom). */
  readonly element?: Element;
  /**
   * Marks an AIMED-shot feature — one whose raw class is `FeatureDamageChargedAimed`
   * (`raw/.../classes/Feature2/Damage/Charged/Aimed.js`), as opposed to a plain
   * `FeatureDamageCharged`. The ONLY behavioural difference of that subclass is its
   * `getCritRateBlock` override: when `settings.enemy_weak_shot` is set it returns a
   * flat 100% crit (`CCritRate([CConst(1)])`, Aimed.js:5-13). There is no faithful
   * existing discriminator — `damageType: "charged"` is shared with non-aimed charged
   * hits (Ganyu's frostflake_bloom, Tighnari's clusterbloom, Lyney/Yelan extra
   * charged), and `category` is `"attack"` for both — so this flag tags exactly the
   * aimed features. The override is NOT bow-restricted (the `Enemy.js` weapon
   * `hideCondition` is a cosmetic UI gate); every `FeatureDamageChargedAimed` instance
   * gets it. Absent ⇒ the normal crit block; and even when present it only changes the
   * crit block when `settings.enemy_weak_shot` is truthy (unset in all 58k goldens) →
   * base-inert.
   *
   * Source: raw/genshin_calc_pub/src/js/classes/Feature2/Damage/Charged/Aimed.js:5-13
   */
  readonly isAimed?: boolean;
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
   * Marks a NON-DAMAGE output feature (heal/shield/static/crystallize). When set,
   * `compileFeature` routes to `compileOutput` (the non-crit-triple path) instead of
   * the damage tree. Mutually exclusive with `reaction`. Absent on every damage
   * feature → inert for the 58k damage goldens. See {@link FeatureOutput}.
   *
   * Source: raw/.../classes/Feature2/{Heal,Shield,Static,Reaction/Crystallize}.js
   */
  readonly output?: FeatureOutput;
  /**
   * Per-feature ROTATION weight — her `Feature2.rotationHitCount` (default 1,
   * `Feature2.js:40,242-244`). When this feature appears as a rotation `feature` node,
   * `compileRotation` scales its contribution to the rotation total by this factor.
   *
   * Her `Tree.js:83-90` pushes a scalar `rotationHitCount != 1` as a `CConst` into
   * `varNormal`, and ALL THREE rotation accumulators (normal/crit/avg) are linear in
   * `varNormal` (`Tree.js:92,95-100,116-136`) — so the weight scales the hit's WHOLE
   * triple, not just normal. It models a fractional-uptime / activation-chance hit
   * (a hit that lands `< 1` time per rotation cycle).
   *
   * The v5.8 scalar users are Mona's C2 `mona_charged_hit` (0.2 = `C2ChargedProb/100`,
   * `Mona.js:204`) and Yoimiya's 7 C6 `yoimiya_normal_hit_*` features (0.5,
   * `Yoimiya.js:222,…`). Absent ⇒ 1 (no rotation rescaling). Inert outside a rotation
   * (only `compileRotation` reads it) and inert in the 58k damage goldens (none set a
   * rotation) → byte-identical. The OBJECT branch of her `getRotationHitMiltiplier`
   * (Yanfei's crit-rate weight) is a SEPARATE field — see the follow-up brief.
   *
   * Source: raw/genshin_calc_pub/src/js/classes/Feature2.js:40,242-244 (rotationHitCount);
   *         raw/genshin_calc_pub/src/js/classes/Feature2/Rotation/Tree.js:83-90 (the push)
   */
  readonly rotationHitMulti?: number;
  /**
   * The OBJECT branch of her `getRotationHitMiltiplier` (Tree.js:83-85): instead of a
   * scalar, this feature's rotation weight IS its per-hit crit rate. The only v5.8 user
   * is Yanfei's A4 charged follow-up (`yanfei_blazing_eye`), a `FeatureDamageChargedYanfei`
   * whose `getRotationHitMiltiplier` returns `getCritRateBlock(data)` (a `CCritRate`,
   * `Charged/Yanfei.js:4-6`) pushed DIRECTLY into `varNormal` (`Tree.js:84-85`, the
   * `typeof hitMulti === 'object'` arm). Since all three rotation accumulators are linear
   * in `varNormal`, the contribution = `critRate × {normal,crit,avg}_base` — i.e. the
   * feature's whole triple scaled by its crit rate.
   *
   * When set, `compileRotation` ignores `rotationHitMulti` and folds the feature's CLAMPED
   * crit rate (summed from the active stat bag) into its rotation weight instead. The rate
   * is the SAME clamped value her `CCritRate.compile` produces (`Math.max(0, Math.min(1, …))`,
   * `Compile/Types/Damage.js:6-11`) — NOT the unclamped sum: her object factor is itself a
   * clamped `CCritRate`, so an unclamped weight would over-count above 100% crit and diverge
   * from her oracle. Mutually exclusive with `rotationHitMulti` in practice (she returns
   * exactly one of object/scalar). Absent ⇒ no crit-rate weighting. Inert outside a rotation
   * and in the 58k damage goldens (none set a rotation) → byte-identical.
   *
   * Source: raw/genshin_calc_pub/src/js/classes/Feature2/Damage/Charged/Yanfei.js:3-6
   *         (FeatureDamageChargedYanfei.getRotationHitMiltiplier → getCritRateBlock);
   *         raw/genshin_calc_pub/src/js/classes/Feature2/Damage.js:72-94 (getDefaultStatsCritRate);
   *         raw/genshin_calc_pub/src/js/classes/Feature2/Rotation/Tree.js:83-85 (the object push)
   */
  readonly rotationHitMultiFromCritRate?: boolean;
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
  /**
   * Optional elevation stat keys — the lunar `(1 + Σ elevation)` factor applied AFTER the reaction
   * factor (GCSim `× (1 + atk.Elevation)` in calcDirectLunar / CalcLunarChargedDmg). Flins C6 sets
   * `lunar_elevation`. Omitted ⇒ no elevation factor (base-inert for every existing lunar feature).
   */
  readonly elevationKeys?: readonly string[];
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
