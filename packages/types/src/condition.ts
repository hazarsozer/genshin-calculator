/**
 * Condition structural shapes.
 *
 * Conditions are the toggles/states that gate buff application.
 * They are purely declarative data at the DB layer; the engine resolves them.
 *
 * Sources:
 *   wiki/game/mechanics/buff-condition-system.md
 *   wiki/tools/calculator/db-object-model.md
 *   raw/genshin_calc_pub/src/js/classes/Condition/Boolean.js
 *   raw/genshin_calc_pub/src/js/classes/Condition/Boolean/Refine.js
 *   raw/genshin_calc_pub/src/js/classes/Condition/Static.js
 *   raw/genshin_calc_pub/src/js/classes/Condition/Static/Refine.js
 *   raw/genshin_calc_pub/src/js/classes/Condition/Constellation.js
 *   raw/genshin_calc_pub/src/js/classes/Condition/Number.js
 *   raw/genshin_calc_pub/src/js/classes/Condition/Stacks.js
 *   raw/genshin_calc_pub/src/js/classes/Condition/And.js
 *   raw/genshin_calc_pub/src/js/classes/Condition/Or.js
 *   raw/genshin_calc_pub/src/js/classes/Condition/Boolean/WeaponType.js
 */

import type { AscensionLevel, ConstellationLevel, Refinement } from "./character.js";
import type { AspirineStatKey } from "./stats.js";

/** Stats contributed when a condition is active. Keys are Aspirine stat keys (engine-internal layer). */
export type ConditionStats = Readonly<Partial<Record<AspirineStatKey | string, number>>>;

/** Settings applied when a condition is active (e.g. attack_infusion, level bonuses). */
export type ConditionSettings = Readonly<Record<string, unknown>>;

/**
 * The immutable evaluation context passed to condition evaluators.
 *
 * This is Aspirine's `settings` object, made explicit and immutable.
 * Keys are arbitrary strings; values are booleans, numbers, or strings
 * depending on the condition type.
 *
 * Examples:
 *   { char_constellation: 4, weapon_refine: 3 }
 *   { "set.noblesse_oblige_4": true, shenhe_icy_quill: 3 }
 */
export type EvalContext = Readonly<Record<string, unknown>>;

/**
 * Base fields shared by all condition variants.
 */
export interface ConditionBase {
  readonly name?: string;
  /** Used for serialization to URL/save state. */
  readonly serializeId?: number;
  readonly title?: string;
  readonly description?: string;
  /** Stats contributed when this condition is active (non-refine-scaled). */
  readonly stats?: ConditionStats;
  /** Settings applied when this condition is active (e.g. attack_infusion, level bonuses). */
  readonly settings?: ConditionSettings;
  /**
   * Optional gating condition. If present, this condition is only active
   * when the gate evaluates to true.
   * Replaces her `params.condition` (preferred) / `params.subConditions` (deprecated).
   */
  readonly condition?: Condition;
  /** Whether to invert the evaluation result. */
  readonly invert?: boolean;
}

/**
 * A user-toggled boolean condition (checkbox).
 * Example: Hu Tao "Paramita Papilio" (skill active), team Noblesse toggle.
 * Active when ctx[name] is truthy.
 */
export interface ConditionBoolean extends ConditionBase {
  readonly type: "boolean";
  readonly rotation?: string;
}

/**
 * A user-toggled boolean condition with per-refinement-rank stat values.
 * Evaluation semantics identical to ConditionBoolean (active when ctx[name] truthy).
 * Stats vary by weapon_refine: refinementStats[weapon_refine - 1].
 *
 * Ports raw/genshin_calc_pub/src/js/classes/Condition/Boolean/Refine.js
 * (ConditionBooleanRefine extends ConditionBoolean, resolves via stat.getValue(weapon_refine)).
 *
 * Example: WolfsGravestone's toggle passive (ATK +40/50/60/70/80% at R1..R5).
 */
export interface ConditionBooleanRefine extends ConditionBase {
  readonly type: "boolean-refine";
  readonly name: string;
  /**
   * Per-refinement stat bags. Index 0 = R1, index 4 = R5.
   * Resolve via: refinementStats[weapon_refine - 1].
   */
  readonly refinementStats: readonly ConditionStats[];
  readonly rotation?: string;
}

/**
 * A static condition that is always active when its gate/sub-conditions are met.
 * Example: ascension passives that are always on once unlocked.
 */
export interface ConditionStatic extends ConditionBase {
  readonly type: "static";
  readonly info?: {
    readonly ascension?: AscensionLevel | number;
    readonly constellation?: ConstellationLevel | number;
  };
}

/**
 * A condition gated by constellation level.
 * Active when ctx.char_constellation >= this.constellation.
 */
export interface ConditionConstellation extends ConditionBase {
  readonly type: "constellation";
  readonly constellation: ConstellationLevel | number;
}

/**
 * A condition with per-refinement-rank stat values.
 * Inherits Static evaluation semantics (always active unless gated/inverted).
 * Used by weapon passives that are always on but scale with refinement.
 *
 * Ports raw/genshin_calc_pub/src/js/classes/Condition/Static/Refine.js
 * (ConditionStaticRefine extends ConditionStatic, resolves via stat.getValue(weapon_refine)).
 *
 * `refinementStats` holds one ConditionStats bag per refinement rank (R1..R5, 0-indexed).
 * Resolve via: refinementStats[weapon_refine - 1].
 * `stats` (from ConditionBase) carries stats that do NOT vary by refine.
 *
 * Example: WolfsGravestone always-on passive (ATK +20/25/30/35/40% at R1..R5),
 *          The Catch burst passive (Burst DMG / Burst Crit Rate by refine).
 */
export interface ConditionStaticRefine extends ConditionBase {
  readonly type: "refine";
  /**
   * Per-refinement stat bags. Index 0 = R1, index 4 = R5.
   * Resolve via: refinementStats[weapon_refine - 1].
   */
  readonly refinementStats: readonly ConditionStats[];
}

/**
 * A numeric (slider/spinner) condition.
 * Active when ctx[name] > 0.
 * The numeric value is meaningful for display; evaluate() just gates on > 0.
 */
export interface ConditionNumber extends ConditionBase {
  readonly type: "number";
  readonly min?: number;
  readonly max?: number;
  /**
   * Optional target stat key for the clamped value. Her ConditionNumber.getStats
   * writes `min(ctx[name], max)` under `params.stat || params.name` (Number.js:58-70);
   * when `stat` is set, the dynamic value lands on a DIFFERENT key than the toggle's
   * `name` — e.g. Mavuika's A4 Kiongozi (`name:'party_mavuika_kiongozi'` →
   * `stat:'dmg_all'`): the slider is keyed by name, the +DMG% bonus by `dmg_all`.
   * Absent → the value is keyed by `name` (the prior behavior; base-inert — no
   * existing number condition sets `stat`).
   */
  readonly stat?: string;
  /**
   * When true, the condition still gates and its control still writes its `name`
   * setting, but it contributes NO bag stat — her `params.noStat`
   * (raw/.../classes/Condition/Number/BondOfLife.js:8). Lets a per-owner input
   * slider coexist with a single global emit (e.g. ConditionBoLStat) without
   * double-counting. Absent → emits as before (base-inert).
   */
  readonly noStat?: boolean;
  /**
   * Per-value damage-bonus distribution: for each `[stat, ratio]` entry, the clamped slider
   * value × ratio is added under `stat`, ON TOP of the base `stat||name` emit, and ONLY when
   * the value is > 0. Ports the `ConditionNumberCitlali.getStats` override
   * (raw/genshin_calc_pub/src/js/classes/Condition/Number/Citlali.js:4-19):
   *   `if (value > 0) { stats.add('dmg_all', value*selfBonus);
   *                     stats.add('dmg_pyro'|'dmg_hydro', value*otherBonus) }`.
   * The single `.stat` form writes the value to ONE key at an implicit ratio 1; this writes it
   * to MANY keys, each at its own ratio (e.g. Citlali C6 `citlali_points` →
   * `{ dmg_all: 2.5, dmg_pyro: 1.5, dmg_hydro: 1.5 }`). Keys are assumed disjoint from `name`
   * and `stats` (true for the sole user). Absent → no per-value bonus (base-inert).
   */
  readonly bonusPerValue?: Readonly<Record<string, number>>;
  /**
   * Constellation-gated increase(s) to the clamp `max`. For EACH entry whose
   * `constellation` threshold is met (`ctx.char_constellation >= entry.constellation`),
   * `entry.bonus` is added to the effective upper clamp (requires `max` set); multiple
   * satisfied entries are SUMMED (mirrors her getMaxValue chaining multiple `if` bumps —
   * see `ConditionNumberFurina.getMaxValue`, Number/Furina.js:14-26, which adds `c1bonus`
   * at C1 AND `c2bonus` at C2, both applying together at C2+).
   * Ports her ConditionNumberIfa.getMaxValue override
   * (raw/genshin_calc_pub/src/js/classes/Condition/Number/Ifa.js:4-12):
   *   `let value = super.getMaxValue(settings);
   *    if (settings.char_constellation >= 2) value += this.params.c2bonus;`
   * — Ifa's "Field Medic's Vision" slider cap rises 150 → 200 at C2 (1-entry array).
   * Furina's fanfare slider rises 300 → 400 @C1 → 800 @C2 (2-entry array, both bumps
   * additive at C2+). Absent → the clamp uses `max` unchanged (base-inert).
   */
  readonly maxBonusFromConstellation?: readonly {
    readonly constellation: number;
    readonly bonus: number;
  }[];
}

/**
 * A stack-count condition (0–maxStacks).
 * Active when ctx[name] > 0.
 * getStackCount() returns the clamped stack value for use in scaling calculations.
 *
 * When the per-stack stat values vary by refinement rank (raw: `levelSetting: "weapon_refine"`),
 * `refinementStats` holds one ConditionStats bag per refinement rank (R1..R5, 0-indexed),
 * each bag representing the per-stack stats at that rank.
 * Resolve via: refinementStats[weapon_refine - 1].
 *
 * Example: Lost Prayer's stack passive — 8/10/12/14/16% per stack per R1..R5.
 */
export interface ConditionStacks extends ConditionBase {
  readonly type: "stacks";
  readonly maxStacks: number;
  /**
   * Optional per-refinement stat bags for stack passives whose per-stack value
   * scales with weapon refinement. Index 0 = R1, index 4 = R5.
   */
  readonly refinementStats?: readonly ConditionStats[];
}

/**
 * A condition gated by equipped piece-count of a named artifact set.
 * Active when ctx["set_pieces.<setName-lowercased>"] >= count.
 *
 * Ports raw/genshin_calc_pub/src/js/classes/Condition/Boolean/PiecesCount.js
 * (`settings[Artifact.settingName(setName)] >= count`, where
 * `Artifact.settingName(name) = 'set_pieces.' + name.toLowerCase()`).
 *
 * This is the piece-count half of the global artifact-set buffs in
 * raw/.../db/Buffs/Artifacts.js (e.g. Noblesse +20% ATK, Deepwood -30% dendro res),
 * which gate on `(set.<x>_4 AND ConditionBooleanPiecesCount(<X>, 4)) OR set_other.<x>_4`.
 * `buildStats` injects the `set_pieces.<name>` count from its `setBonuses` input.
 */
export interface ConditionBooleanPiecesCount extends ConditionBase {
  readonly type: "pieces-count";
  /** Registry key of the set, e.g. "NoblesseOblige" (lowercased for the setting key). */
  readonly setName: string;
  /** Minimum equipped pieces for activation (2 or 4). */
  readonly count: number;
  /**
   * A pure gate — it contributes NO stats of its own (`conditionStats` returns `{}`
   * for this variant even when active, like `and`/`or`). Narrowed to `never` so
   * attaching a `stats` bag is a compile error, not a silently-discarded value.
   */
  readonly stats?: never;
}

/**
 * A condition gated by the wearer's weapon type.
 * Active when ctx["weapon_type"] is in `types` (AND the optional `.condition` gate passes).
 * Ports raw/genshin_calc_pub/src/js/classes/Condition/Boolean/WeaponType.js
 * (`this.params.types.includes(settings.weapon_type)`).
 */
export interface ConditionBooleanWeaponType extends ConditionBase {
  readonly type: "weapon-type";
  /** Allowed weapon types, e.g. ["sword","claymore","polearm"]. */
  readonly types: readonly string[];
  /** A pure gate — contributes NO stats (narrowed to `never`, like pieces-count). */
  readonly stats?: never;
}

/**
 * A condition gated by the enemy's current elemental affliction status.
 * Active when ctx["common.enemy_status"] is a non-empty string present in
 * `statuses` (AND the optional `.condition` gate passes; `invert` flips it).
 *
 * Ports raw/genshin_calc_pub/src/js/classes/Condition/Boolean/EnemyStatus.js
 * (`this.params.status.includes(settings['common.enemy_status'])`; an absent/empty
 * status → false). The enemy-status key is CALLER-supplied via settings (her
 * `settingsSets` presets enemy_no_status / enemy_cryo / …), so buildStats injects
 * nothing — it flows through `input.settings` unchanged. Every v5.8 oracle fixture
 * leaves it unset → these gates are inert (the guarded DMG bonus / FeatureDamage
 * branch is dormant), matching her output exactly.
 *
 * `invert: true` (her `ConditionNot([ConditionEnemyStatus])`) is the "enemy NOT
 * affected" branch — Dragonspine Spear / Frostbearer / Snow-Tombed Starsilver's
 * lower-multiplier Everfrost hit, which fires when no cryo status is set.
 */
export interface ConditionEnemyStatus extends ConditionBase {
  readonly type: "enemy-status";
  /** Enemy affliction elements that activate this condition, e.g. ["cryo", "hydro"]. */
  readonly statuses: readonly string[];
  /** A pure gate — contributes NO stats of its own (narrowed to `never`, like weapon-type). */
  readonly stats?: never;
}

/**
 * A condition that activates when a numeric value in the context passes a comparison
 * threshold. Activation: `ctx[setting] <cond> value` (value defaults to 0; an absent ctx
 * key reads 0), AND the optional `.condition` gate passes; `invert` flips the result.
 *
 * Stat-bearing and refine-scaled like ConditionBooleanRefine: when `refinementStats` is
 * present the active bag is `refinementStats[weapon_refine - 1]` (folded with any flat
 * `stats`); otherwise plain `stats`. Models "max-stack reached" weapon passives (Primordial
 * Jade Winged Spear's 7th stack, Kagura's Verity's 3rd, Cashflow Supervision) and sub-gates
 * on a ConditionStaticRefine (Bond-of-Life / party-element thresholds).
 *
 * Ports raw/genshin_calc_pub/src/js/classes/Condition/Boolean/Value.js:
 *   getCompareValue = settings[setting] || 0;  checkSubconditions = gate && (value2 <cond> value1);
 *   getStats refine-scaled via getLevel('weapon_refine').
 */
export interface ConditionBooleanValue extends ConditionBase {
  readonly type: "boolean-value";
  /** Settings key holding the comparison value (caller-supplied; e.g. a stack count). */
  readonly setting: string;
  /** Comparison operator applied as `ctx[setting] <cond> value`. */
  readonly cond: "gt" | "ge" | "eq" | "le" | "lt";
  /** Threshold to compare against (default 0). */
  readonly value?: number;
  /** Optional per-refinement stat bags (refinementStats[weapon_refine - 1]); else `stats`. */
  readonly refinementStats?: readonly ConditionStats[];
}

/**
 * A multi-state selector ("dropdown") condition. Active when `ctx[name]` is a positive
 * number (the selected option, 1-indexed) AND the optional `.condition` gate passes.
 * Each option carries a refine-indexed stat bag; the active bag is
 * `options[ctx[name] - 1][weapon_refine - 1]`.
 *
 * Ports raw/genshin_calc_pub/src/js/classes/Condition/Dropdown.js — her `params.values[i]`
 * each wrap an inner `ConditionStaticRefine` whose `getStats` is refine-scaled. The selection
 * is caller-supplied (a `passiveToggles` value; e.g. Mistsplitter's stack level 1/2/3, Polar
 * Star's 1-4). `ConditionDropdownElement` (an element-keyed selector) reuses this shape — the
 * element-icon rendering is UI-only; here the option index is the discriminant either way.
 */
export interface ConditionDropdown extends ConditionBase {
  readonly type: "dropdown";
  /** Settings key holding the selected option (positive integer; 0/absent → inactive). */
  readonly name: string;
  /**
   * Per-option stat bags. `options[selected - 1]` is the chosen option's per-refinement
   * array (`refinementStats[weapon_refine - 1]`). Mirrors her `values[i].conditions[0]`
   * (a ConditionStaticRefine) per option.
   */
  readonly options: readonly (readonly ConditionStats[])[];
}

/**
 * Logical NOT: active iff NOT all `items` are active (`!items.every(active)`).
 * Her `ConditionNot.isActive` = `!(item1 && item2 && …)`. A pure gate (no stats);
 * used as a `.condition` on another condition (e.g. The Widsith's mutually-exclusive
 * themes: theme N active only when no higher theme is selected).
 *
 * NOTE: unlike the other variants, ConditionNot does NOT extend `ConditionBase` — it carries
 * no `settings`/`invert`/`condition`/`stats`. Use it ONLY as a nested `.condition` gate, never
 * as a top-level entry in a conditions array: it would evaluate fine but contribute no stats or
 * settings (and cannot itself be gated). For a top-level negated gate, attach the `not` as the
 * `.condition` of a stat-bearing variant.
 * Source: raw/genshin_calc_pub/src/js/classes/Condition/Not.js
 */
export interface ConditionNot {
  readonly type: "not";
  readonly items: readonly Condition[];
}

/**
 * Lithic settings-publisher: ALWAYS active, contributes no stats, but publishes
 * `weapon_lithic_stacks` = (wielder is Liyue ? 1 : 0) + Liyue party (party=0 solo).
 * A downstream `ConditionStacks` keyed `weapon_lithic_stacks` reads it (the
 * settings-propagation keystone). Reads `ctx["char_origin"]` (injected by buildStats).
 * Source: raw/genshin_calc_pub/src/js/classes/Condition/Lithic.js
 */
export interface ConditionLithic extends ConditionBase {
  readonly type: "lithic";
  /** A pure settings-publisher — no stats of its own. */
  readonly stats?: never;
}

/**
 * Gate on the WIELDER's identity: active when `ctx["char_name"]` ∈ `chars`
 * (+ optional `.condition` gate + `invert`). Ports Condition/Boolean/Char.js.
 */
export interface ConditionBooleanChar extends ConditionBase {
  readonly type: "boolean-char";
  /** Allowed character names (snake_case slugs, e.g. ["aloy"]). */
  readonly chars: readonly string[];
  readonly stats?: never;
}

/**
 * Gate active for NightSoul-capable wielders: `ctx["char_origin"]==="natlan"`
 * (TravelerPyro id==100 deferred — needs char_id injection). Pure gate.
 * Ports Condition/Boolean/NightSoul.js. INERT for any non-Natlan rep.
 */
export interface ConditionBooleanNightSoul extends ConditionBase {
  readonly type: "nightsoul";
  readonly stats?: never;
}

/**
 * Gate on the ENEMY's type: active when `ctx["enemy_type"]` ∈ `types`. The oracle
 * never sets `enemy_type` → always INERT in v5.8 fixtures. Ports Boolean/EnemyType.js.
 */
export interface ConditionBooleanEnemyType extends ConditionBase {
  readonly type: "enemy-type";
  readonly types: readonly string[];
  readonly stats?: never;
}

/**
 * Elemental-resonance gate. Counts each element across the resonance slots
 * `char_element` + `resonance_element_1/2/3`; active per `ConditionResonance.isActive`:
 *   - with `element` set: active iff that element's count is >= 2 (a duo of it), OR
 *   - with `element` absent/"" (the none-case): active iff NO element reaches 2 (`!isDuo`).
 * `invert` flips the result (her `params.invert` — used as a `hideCondition`, irrelevant here).
 * A pure gate: contributes NO stats (narrowed to `never`); used as the `.condition` on the
 * stat-bearing resonance buffs in CHARACTER_CONDITIONS.
 *
 * Inert with no party: the resonance slots `resonance_element_*` are absent, so an
 * element gate counts only `char_element` (count 1, never >= 2 → inactive). The none-case
 * is held inert by the ResonanceEnabled team-presence gate it is AND-composed with (a real
 * party has `party_size >= 2`; solo leaves it absent → 0).
 *
 * Source: raw/genshin_calc_pub/src/js/classes/Condition/Resonance.js:8-38
 */
export interface ConditionResonance extends ConditionBase {
  readonly type: "resonance";
  /** Target element (e.g. "pyro"); omit/"" for the none-resonance (no-duo) case. */
  readonly element?: string;
  /** A pure gate — contributes NO stats of its own (narrowed to `never`, like and/or). */
  readonly stats?: never;
}

/**
 * Two-element party-composition gate: active iff the party (the `char_element` +
 * `resonance_element_1/2/3` slots) contains BOTH `elements[0]` AND `elements[1]`
 * AND no element outside that pair — the "ONLY these two elements" requirement.
 *
 * Ports the three structurally-identical gates Chevreuse/Nilou/Skirk share, each a
 * scan over the four slots tracking hasA / hasB / hasOther, returning
 * `hasA && hasB && !hasOther` after the super (subcondition) gate:
 *   - raw/genshin_calc_pub/src/js/classes/Condition/Boolean/ChevreuseParty.js
 *     (NOTE her quirk: she treats `electro` as the second trigger — Chevreuse's party
 *     requires Pyro + Electro, so `elements: ["pyro","electro"]`).
 *   - raw/genshin_calc_pub/src/js/classes/Condition/Boolean/NilouParty.js  → ["hydro","dendro"].
 *   - raw/genshin_calc_pub/src/js/classes/Condition/Boolean/SkirkParty.js  → ["cryo","hydro"].
 *
 * The three differ ONLY in the element pair; a single parameterised variant is faithful
 * to all three. NOT expressible by composing existing gates: `resonance` counts a DUO of
 * one element (count >= 2), and nothing expresses the "no third element present" clause.
 *
 * A pure gate — contributes NO stats of its own (narrowed to `never`, like `resonance`);
 * used as the `.condition` on the stat-bearing toggle it guards (Chevreuse's `chevreuse_tactics`
 * res-shred, Nilou's `nilou_stance_bonus`, Skirk's `skirk_mutual_weapons_mentorship`). `invert`
 * flips the result. Inert with no party: a solo build has only `char_element` (one element) →
 * the wielder's own element is one of the pair but the partner is absent → `false`.
 */
export interface ConditionPartyElements extends ConditionBase {
  readonly type: "party-elements";
  /** The two elements the party must contain (and ONLY those), e.g. ["pyro","electro"]. */
  readonly elements: readonly [string, string];
  /** A pure gate — contributes NO stats of its own (narrowed to `never`, like resonance). */
  readonly stats?: never;
}

/**
 * Element-count gate. Counts `element` across the resonance slots
 * (char_element + resonance_element_1/2/3) and is active iff that count >= `count`.
 * Ports ConditionElementsCount.isActive (getType()='static'). May carry stats when used
 * stat-bearing (like ConditionStatic); Gorou uses it purely as a gate inside `and`.
 * Inert with no party: only char_element present → count 1 < 2 → inactive.
 *
 * `element` may be a SET (array) — a slot counts if its element is IN the set. This ports
 * the CalcElementsNavia count-a-family idiom (Navia A4: count nearby Pyro/Hydro/Electro/Cryo
 * members). The single-string form is unchanged. Note: like ConditionElementsCount (and unlike
 * CalcElementsNavia, which scans only resonance_element_1/2/3), the count includes char_element;
 * this is equivalent whenever the SET excludes the char's own element (Navia is geo ∉ the set).
 * Source: raw/genshin_calc_pub/src/js/classes/Condition/ElementsCount.js
 *         raw/genshin_calc_pub/src/js/classes/Condition/CalcElementsNavia.js
 */
export interface ConditionElementsCount extends ConditionBase {
  readonly type: "elements-count";
  readonly element: string | readonly string[];
  readonly count: number;
}

/**
 * Settings-copy: a base-inert DYNAMIC settings-publisher. When active (its optional
 * `.condition` gate passes; no gate → always active — `invert` is NOT applied), publishes
 * `ctx[from]` under the `to` key. A generic port of the getData-settings dynamic-alias idiom
 * several of her per-char `ConditionStatic` subclasses use, e.g. `ConditionStaticYunJin.getData`:
 * `settings.yunjin_traditionalist_stacks = settings.party_elements_count_level`.
 * A pure settings-publisher — contributes NO stats of its own (narrowed to `never`, like `lithic`).
 * Inert with no party: `from` (typically a `party_*` key) is absent from `ctx` → publishes
 * `{ [to]: undefined }`, and a consumer's `ctx.settings[key] || 1`-style default is unchanged.
 * Source: raw/genshin_calc_pub/src/js/classes/Condition/Static/YunJin.js (getData)
 */
export interface ConditionSettingsCopy extends ConditionBase {
  readonly type: "settings-copy";
  /** The source ctx key to read (e.g. "party_elements_count_level"). */
  readonly from: string;
  /** The published settings key (e.g. "yunjin_traditionalist_stacks"). */
  readonly to: string;
  readonly stats?: never;
}

/**
 * Logical AND of all items — all must evaluate to true.
 * Vacuous truth: empty items list → true.
 */
export interface ConditionAnd {
  readonly type: "and";
  readonly items: readonly Condition[];
}

/**
 * Logical OR of all items — at least one must evaluate to true.
 * Empty items list → false.
 */
export interface ConditionOr {
  readonly type: "or";
  readonly items: readonly Condition[];
}

/**
 * A level-indexed condition whose stat contributions are determined by reading an
 * integer level from `ctx[levelSetting]` and indexing into per-stat value arrays.
 *
 * Evaluation: active iff the optional `.condition` gate passes (inherits ConditionStatic
 * semantics — always active once gated). Stats are resolved by `getLevel`:
 *   level = (ctx[levelSetting] || 0) + (fromZero ? 1 : 0)
 *   per stat: stats[key][level - 1] (1-indexed, clamped to array length; level <= 0 → 0)
 * A stat whose resolved value is 0 is omitted from the emitted bag.
 *
 * `fromZero: true` means a missing/0 key in ctx shifts to level 1 (index 0), which
 * conventionally holds a 0 placeholder — so a 0 ctx value still yields no contribution.
 *
 * Ports raw/genshin_calc_pub/src/js/classes/Condition/Static/Level.js:
 *   getLevel(settings) reads settings[levelSetting] || 0, adds 1 when fromZero.
 *   getStats(settings) calls StatTable.getValue(level) for each entry.
 *   StatTable.getValue: level <= 0 → 0; level > length → values[length-1]; else values[level-1].
 *
 * Example (GildedDreams 4pc, same-element path):
 *   { type: "static-level", levelSetting: "party_elements_same", fromZero: true,
 *     levelStats: { atk_percent: [0, 14, 28, 42] },
 *     condition: { type: "and", items: [{type:"boolean",name:"set.gilded_dreams_4"},
 *                                       {type:"boolean",name:"party_elements_same"}] } }
 *   ctx { party_elements_same: 2 } → level = 2+1 = 3 → atk_percent[2] = 28.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/classes/Condition/Static/Level.js
 *   raw/genshin_calc_pub/src/js/classes/StatTable.js
 *   raw/genshin_calc_pub/src/js/db/Artifacts/Set/GildedDreams.js:44-73
 */
export interface ConditionStaticLevel extends ConditionBase {
  readonly type: "static-level";
  /** The context key holding the integer level (e.g. "party_elements_same"). */
  readonly levelSetting: string;
  /**
   * When true, the raw value is incremented by 1 before indexing (her `fromZero` flag).
   * Conventionally the value arrays begin with a 0 placeholder at index 0, so a ctx
   * value of 0 still resolves to 0 contribution.
   */
  readonly fromZero?: boolean;
  /**
   * Per-stat value arrays. Each key maps to a StatTable-values array (1-indexed by level).
   * StatTable.getValue semantics: level <= 0 → 0; level > length → values[length-1].
   */
  readonly levelStats: Readonly<Record<string, readonly number[]>>;
}

/**
 * Gate on the WIELDER's element: active when `ctx["char_element"]` ∈ `elements`
 * (+ optional `.condition` gate + `invert`). A pure gate — contributes NO stats
 * (narrowed to `never`, like `boolean-char`).
 *
 * Ports raw/genshin_calc_pub/src/js/classes/Condition/Boolean/CharElement.js
 * (`this.params.element.includes(settings.char_element)`; a non-array/absent
 * `element` → false). `char_element` is injected by buildStats from `input.char.element`.
 *
 * Used by ViridescentVenerer's 4pc swirl res-shred (the `anemo` gate on each
 * per-element `enemy_res_<el>: -40` condition).
 */
export interface ConditionBooleanCharElement extends ConditionBase {
  readonly type: "char-element";
  /** Allowed wielder elements, e.g. ["anemo"]. */
  readonly elements: readonly string[];
  readonly stats?: never;
}

/**
 * Gate on whether a specific element is selected in a multi-select element dropdown.
 * Active when `ctx[name]` (a `;`-delimited string of element tokens) split-includes
 * `element`, AND the optional `.condition` gate passes; `invert` flips it. A pure gate —
 * contributes NO stats of its own (narrowed to `never`).
 *
 * Ports raw/genshin_calc_pub/src/js/classes/Condition/Boolean/DropdownValue.js
 * (`(settings[name] || '').split(';').includes(this.params.value)` after super gate).
 *
 * This is the CONSUMER of the multi-select `ConditionDropdownElement` selector
 * (`ViridescentVenerer.js:43-72`, a UI/suggester widget whose `getAllConditionsOn`
 * publishes the element list). The actual effect — ViridescentVenerer's 4pc swirl
 * res-shred — lives in `raw/.../db/Buffs/Artifacts.js:82-99` as four per-element
 * `enemy_res_<el>: -40` conditions, each gated by a `ConditionBooleanDropdownValue`
 * on `set.viridescent_venerer_4` (value === that element). The numeric-indexed
 * `dropdown` variant cannot express this string-membership selection.
 *
 * The selection is caller-supplied (a string setting, e.g. `set.viridescent_venerer_4`
 * = "pyro" or "cryo;electro"). Absent/empty → inactive (every v5.8 fixture that does
 * not select an element leaves it inert).
 */
export interface ConditionDropdownElement extends ConditionBase {
  readonly type: "dropdown-element";
  /** Settings key holding the `;`-delimited element selection string. */
  readonly name: string;
  /** The element token this gate fires for (e.g. "pyro"). */
  readonly element: string;
  readonly stats?: never;
}

/**
 * The universal manual-buff escape-hatch. Her always-present `ConditionCustomBuffs`
 * (Condition/CustomBuffs.js, registered in db/Buffs/ElementalResonance.js:70-74) loops
 * every `custom_buffs.<key>` setting and additively injects the suffix as a RAW stat.
 * No gate, no `.stats`, no `.settings` — the injection is computed in `conditionStats`.
 */
export interface ConditionCustomBuffs extends ConditionBase {
  readonly type: "custom-buffs";
}

/** Discriminated union of all condition types. */
export type Condition =
  | ConditionBoolean
  | ConditionBooleanRefine
  | ConditionStatic
  | ConditionConstellation
  | ConditionStaticRefine
  | ConditionNumber
  | ConditionStacks
  | ConditionBooleanPiecesCount
  | ConditionBooleanWeaponType
  | ConditionEnemyStatus
  | ConditionBooleanValue
  | ConditionDropdown
  | ConditionNot
  | ConditionLithic
  | ConditionBooleanChar
  | ConditionBooleanNightSoul
  | ConditionBooleanEnemyType
  | ConditionResonance
  | ConditionPartyElements
  | ConditionElementsCount
  | ConditionSettingsCopy
  | ConditionAnd
  | ConditionOr
  | ConditionStaticLevel
  | ConditionBooleanCharElement
  | ConditionDropdownElement
  | ConditionCustomBuffs;

export type { AscensionLevel, ConstellationLevel, Refinement };
