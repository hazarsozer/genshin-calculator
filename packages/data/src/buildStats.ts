/**
 * buildStats — the stats-bag assembly glue.
 *
 * Turns a typed character + weapon base-stat tables + a raw (un-percent-
 * processed) bonus stat block into the executable BuildStats bag + DamageContext
 * the `@genshin/core` engine reads. This is the data-layer mirror of her
 * CalcSet.getBuildData (tools/oracle/engine.mjs is the reference sequence):
 *
 *   1. AGGREGATE base stats — add each char + weapon StatTableEntry's
 *      getValue(level, ascension) under its stat key (atk_base, hp_base, …).
 *   2. CONCAT the bonus stat block (artifacts/sample stats) — RAW percents.
 *   3. DERIVE — run condition-gated post-effects (HP→ATK) via applyPostEffects,
 *      threading the EvalContext.
 *   4. READ — emit the bag the engine consumes:
 *        - `<stat>_total` for atk/hp/def (= base×(1+%/100)+flat via Stats.getTotal)
 *          and the flat-summed stats (crit_rate, crit_dmg, mastery, recharge).
 *        - percent stats as FRACTIONS at execution time: crit_rate/crit_dmg
 *          totals ÷100, DMG% bonuses ÷100, enemy_res_<element> ÷100.
 *        - DEF-ignore / DEF-reduce keys (default 0).
 *
 * BOUNDARY (load-bearing): `Stats.getTotal` expects RAW percents (its `/100`),
 * so the bag fed to it keeps `atk_percent` as 18 — NOT 0.18. The engine, by
 * contrast, reads fractions; so the fraction keys are divided by 100 once here,
 * at emit time. Get this wrong and every downstream number is off.
 *
 * Sources:
 *   tools/oracle/engine.mjs (FIXED_BUILD + getBuildData sequence)
 *   raw/genshin_calc_pub/src/js/classes/Stats.js (getTotal, getTotalPercent, isPercent)
 *   raw/genshin_calc_pub/src/js/classes/CalcSet.js (getBuildData → getBaseStats → processPercent)
 *   wiki/game/mechanics/stat-keys-and-good-format.md
 */

import { Stats, applyPostEffects, conditionStats, conditionSettings, evaluate, type PostEffect } from "@genshin/core";
import type {
  BuildStats,
  CharMultiplier,
  CharPostEffect,
  Condition,
  DamageContext,
  DbObjectArtifactSet,
  DbObjectChar,
  Element,
  EvalContext,
  Feature,
  StatTableEntry,
} from "@genshin/types";
import { getArtifactSet } from "./artifacts/sets/index.js";
import { CHARACTER_CONDITIONS, CHARACTER_MULTIPLIERS, CHARACTER_POST_EFFECTS, CUSTOM_BUFFS_CONDITION, ENEMY_CONDITIONS } from "./characterConditions.js";
import { buildPartyContext, type PartyInput, type ActiveCharFacts } from "./partyContext.js";
import { buildPartyBuffs } from "./partyBuffs.js";

/** The seven elements + physical, in the order the engine keys resistance. */
const ELEMENTS: readonly Element[] = [
  "physical",
  "pyro",
  "hydro",
  "electro",
  "cryo",
  "anemo",
  "geo",
  "dendro",
];

/** Stats whose total is `base×(1+%/100)+flat` (her REAL_TOTAL). */
const SCALING_TOTAL_STATS = ["atk", "hp", "def"] as const;
/** Flat-summed stats whose total is `base+flat` and that the engine reads as a number. */
const FLAT_TOTAL_STATS = ["mastery", "recharge"] as const;
/** Flat-summed PERCENT stats whose total is `base+flat` but emitted as a FRACTION. */
const FRACTION_TOTAL_STATS = ["crit_rate", "crit_dmg"] as const;
/**
 * DMG% bonus keys carried in the bonus block; emitted as fractions.
 *
 * Split by her aggregation rule in getStatsDmgBonus (Damage.js:51-66):
 *   - ELEMENT keys are read as `dmg_<element>*` (the `*` → makeStatTotalItem →
 *     `dmg_<elem>_base + dmg_<elem>`, since dmg_* is not a REAL_TOTAL stat). The
 *     `_base` carries a char/weapon ASCENDARY-SECONDARY elemental DMG bonus
 *     (e.g. Razor's A6 Physical DMG +30 lands as `dmg_phys_base`).
 *   - TYPE keys (`dmg_normal`, `dmg_skill`, …) and `dmg_all` are read WITHOUT the
 *     `*`, so only their flat bonus value counts (no `_base` fold).
 */
const DMG_BONUS_ELEMENT_KEYS = [
  "dmg_phys",
  "dmg_pyro",
  "dmg_hydro",
  "dmg_electro",
  "dmg_cryo",
  "dmg_anemo",
  "dmg_geo",
  "dmg_dendro",
] as const;
const DMG_BONUS_TYPE_KEYS = [
  "dmg_all",
  "dmg_normal",
  "dmg_charged",
  "dmg_plunge",
  "dmg_skill",
  "dmg_burst",
  // Charged-only enemy-vulnerability key — her FeatureDamageCharged.getStatsDmgBonus
  // (Charged.js:14-18) is the sole subclass that adds a `dmg_<type>_enemy` key, so
  // compileFeature requests it only for charged hits. Emitted as a fraction like the
  // rest; Scion of the Blazing Sun's Sunfire Fan is the v5.8 source. 0 (unset) for
  // every build that contributes none → base golden untouched.
  "dmg_charged_enemy",
] as const;

/**
 * Composite type×element DMG% bonus keys (`dmg_<type>_<element>`) a teammate
 * buff can set — read by a hit matching BOTH the type AND the resolved element
 * (her getStatsDmgBonus pushes `dmg_<damageType>_<element>`, Damage.js:58).
 *
 * The ONLY v5.8 producer is Candace's "Prayer of the Crimson Crown" + A4
 * "Celestial Dome of Sand": both write `dmg_normal_<element>` for the seven
 * non-physical elements (the prayer a flat 20, the A4 `0.0005 × HP`). Listed
 * EXPLICITLY (not a type×element cross-product) — only the keys a ported buff
 * actually sets, mirroring the explicit-emit discipline of every other dmg_*
 * key list here. Emitted as a FRACTION only when set; absent for every build
 * that names no Candace teammate → the key is never in the bag → the base
 * golden suite + all existing fixtures are byte-unchanged.
 *
 * Source: raw/genshin_calc_pub/src/js/db/Char/Candace.js:485-541 (the prayer
 *         ConditionBoolean stats + the A4 PostEffectStats (from:candace_hp_total) percent tables).
 */
const DMG_BONUS_COMPOSITE_KEYS = [
  "dmg_normal_anemo",
  "dmg_normal_geo",
  "dmg_normal_pyro",
  "dmg_normal_electro",
  "dmg_normal_hydro",
  "dmg_normal_cryo",
  "dmg_normal_dendro",
] as const;

/**
 * The damage TYPES whose per-type crit folds generically (her
 * getDefaultStatsCritRate / getDefaultStatsCritDamage push `crit_rate_<type>` /
 * `crit_dmg_<type>` for the hit's damageType — Damage.js:77/105). Emitted as
 * `crit_rate_<type>` / `crit_dmg_<type>` fractions when set in the bag so a
 * weapon/set/cons-sourced type-crit (e.g. The Catch's `crit_rate_burst`) reaches
 * compileFeature's `critBonusTypeKeys` regardless of feature references.
 *
 * No `_all` (her engine has no `crit_rate_all`). ELEMENT crit (`crit_*_<element>`)
 * is NOT folded here — it stays on the per-feature `collectFeatureBonusKeys` emit
 * (deferred follow-up). Mirrors the structure of DMG_BONUS_TYPE_KEYS above.
 */
const CRIT_BONUS_TYPES = ["normal", "charged", "plunge", "skill", "burst"] as const;

/**
 * Reaction SCALING keys derived by post-effects (Ineffa's `lunarcharged_multi`
 * today; extended as more reaction-rate-driving post-effects land). Already
 * fraction-valued in `raw` (the post-effect folded the isPercent /100 — her
 * PostEffect/Stats.js getTree), so emitted as-is. Read by the reaction factories'
 * `(1 + Σ scaling)` rate term.
 *
 * NOTE: `dmg_reaction_lunarcharged` is NOT here — see REACTION_BONUS_PERCENT_KEYS.
 * Every LIVE v5.8 producer of that key is a CONDITION emitting a RAW percent
 * (FracturedHalo refine 40-80, ThunderingFury 4pc 20), so it must be /100'd like
 * its sibling `dmg_reaction_*` keys. The only post-effect that would write it
 * (Ineffa's C1 `lunarPost2`) is a gated-off toggle never ported, so no
 * fraction-valued contribution to that key exists in scope.
 */
const REACTION_DERIVED_KEYS = [
  "lunarcharged_multi",
] as const;

/**
 * Per-reaction DMG bonus keys CONDITIONS contribute (e.g. CrimsonWitch 4pc's
 * `dmg_reaction_overloaded`/`_burgeon`/…). The reaction factories read each via
 * `cStat(key)` inside `(1 + emBonus + Σ dmg_reaction_*)` (core's
 * cTransformativeDamage / cAmplifyingDamage / cLunarChargedDamage). These arrive
 * as RAW percents from `conditionStats`, so they are emitted as FRACTIONS (÷100)
 * at emit time, exactly like every dmg_* key. Absent keys are left unset → engine
 * reads 0.
 *
 * `dmg_reaction_lunarcharged` belongs HERE. Both of its LIVE v5.8 producers are
 * conditions emitting raw percents — FracturedHalo's refine passive (40-80) and
 * ThunderingFury 4pc (20) — so its /100 is identical to its sibling keys. (The
 * only post-effect that would write it pre-divided is Ineffa's C1 `lunarPost2`, a
 * gated-off toggle never ported; were it ported, its fraction would accumulate
 * into the SAME `raw` value as the conditions and could not be re-separated at
 * emit, so the engine assumes condition-sourced raw percents only. The rate
 * scaling `lunarcharged_multi` IS post-effect-sourced and stays pre-divided in
 * REACTION_DERIVED_KEYS above.) This is the M3 fix: previously it sat in the
 * un-divided REACTION_DERIVED_KEYS path, so ThunderingFury's 20 read as +2000%.
 *
 * Source: packages/data/src/reactions.ts (reactionBonusKeys per reaction);
 *         raw/.../db/Artifacts/Set/CrimsonWitch.js (the 4pc reaction bonuses);
 *         raw/.../db/Artifacts/Set/ThunderingFury.js + Weapon/Polearm/FracturedHalo.js.
 */
const REACTION_BONUS_PERCENT_KEYS = [
  "dmg_reaction_overloaded",
  "dmg_reaction_superconduct",
  "dmg_reaction_electrocharged",
  "dmg_reaction_shatter",
  "dmg_reaction_swirl",
  "dmg_reaction_bloom",
  "dmg_reaction_hyperbloom",
  "dmg_reaction_burgeon",
  "dmg_reaction_rupture",
  "dmg_reaction_aggravate",  // ALSO the third member of Aggravate's catalyze Σ (below); ThunderingFury 4pc:20 is its v5.8 producer
  // Catalyze (Spread/Aggravate) reaction-DMG-bonus keys read by the catalyze base term's
  // `(1 + 5·EM/(EM+1200) + Σ)` factor (compileFeature). `dmg_reaction_quicken` is Baizhu's A4
  // `buffQuicken` post-effect (HP→quicken%, an isPercent stat → its post-effect getTree writes a
  // RAW percent into the bag, /100'd here like every sibling). `dmg_reaction_spread` has no live
  // v5.8 producer (no source grants it), so it reads 0 — present for the Spread Σ's completeness
  // and forward-safety. Source: raw/.../db/Char/Baizhu.js:136-159 (A4 buffQuicken),
  //         raw/.../Feature2/Multiplier/Reaction/Quicken/Spread.js (getStatsDmgBonus).
  "dmg_reaction_quicken",
  "dmg_reaction_spread",
  "dmg_reaction_vaporize",
  "dmg_reaction_melt",
  "dmg_reaction_lunarcharged",
] as const;

/**
 * Raw-bag scaling INPUT keys read VERBATIM by a non-`*` multiplier scaling.
 *
 * A multiplier whose `scaling` key carries no `*` (and is not one of the total stats
 * atk/hp/def/mastery) reads the bag value directly — her `makeStatItem(scaling)`
 * (Feature2/Compile/Helpers.js:11-19) → `stats.get(scaling)`, no `_total`, no `/100`.
 * These are flat numeric inputs a ConditionNumber injects (not percent stats), so they
 * are emitted RAW. The v5.8 users (all ConditionNumber-driven scaling inputs):
 *   - `party_days_past_healing_recorded` — Song of Days Past 4pc (team): the recorded
 *     healing the team multiplier scales (≤15000).
 *   - `accumulated_healing` — Ocean-Hued Clam 4pc (self-worn): the healing accumulated
 *     over the foam's window that the Sea-Dyed Foam (`FeatureDamageClam`) scales `90% ×`,
 *     capped 30000. Her ConditionNumber (OceanHuedClam.js:35-41) is INACTIVE until the
 *     input is > 0 (Condition/Number.js:8-11), so at the v5.8 standard 0 the key is never
 *     in the bag → never emitted → the foam reads 0 (the existing OceanHuedClam armory
 *     fixture, foam 0, is byte-unchanged).
 *   - `shenhe_atk_total` — Shenhe's Icy Quill TEAMMATE multiplier (P3.5.2 Bucket C): her
 *     `partyData` lifts the teammate's `atk_total` into the recipient bag via a
 *     ConditionNumber (`partyStat:'atk_total', max:10000`), and the cryo-element teammate
 *     FeatureMultiplier scales `shenhe_dmg_bonus% ×` that value into each cryo hit's base
 *     term. Structurally identical to Song of Days Past's team-multiplier scaling input.
 *     Set ONLY when a Shenhe teammate is in the roster (the lift condition fires); absent
 *     for every solo / non-Shenhe build → key never emitted → byte-unchanged.
 * Absent for every build that sets no such input → key never emitted → multiplier reads
 * 0 → the base golden suite + all existing fixtures are byte-untouched.
 *
 * Source: raw/genshin_calc_pub/src/js/db/Buffs/Artifacts.js:262-380 (Song of Days Past
 *         ConditionNumber + its FeatureMultiplier), db/Artifacts/Set/OceanHuedClam.js:35-67
 *         (Clam ConditionNumber + FeatureDamageClam), db/Char/Shenhe.js:456-621 (Icy Quill
 *         partyData ConditionNumber + teammate FeatureMultiplier),
 *         classes/Feature2/Multiplier.js:281-288.
 */
const RAW_BAG_SCALING_KEYS = [
  "party_days_past_healing_recorded",
  "accumulated_healing",
  "shenhe_atk_total",
  "faruzan_atk_base",     // Faruzan A4 anemo-DMG teammate multiplier (P3.5.2 Bucket C)
  "escoffier_atk_total",  // Escoffier C2 cryo-DMG teammate multiplier (P3.5.2 Bucket C)
  "xilonen_def_total",    // Xilonen C4 normal/charged/plunge-DMG teammate multiplier (P3.5.2 Bucket C)
  "yunjin_def_total",     // Yun Jin Flying Cloud Flag Formation DEF-scaled normal-DMG multiplier (P3.5.2 engine-ext)
  "citlali_mastery_total", // Citlali C1 EM-scaled all-type-DMG multiplier (P3.5.2 Bucket C)
  "layla_max_hp",         // Layla C4 HP-scaled normal/charged-DMG multiplier (P3.5.2 Bucket C)
  "sigewinne_hp_total",   // Sigewinne A1 max-HP-ABOVE-30000-scaled skill-DMG multiplier (P3.5.2 engine-ext; exceedStatValue)
  "xianyun_atk_total",    // Xianyun A4 ATK-scaled plunge-SHOCKWAVE-DMG multiplier (P3.5.2 Xianyun sub-pass; tags target)
] as const;

/**
 * Heal-bonus percent stats — her `FeatureHeal.getStatsHealBonus` (Feature2/Heal.js:38-45)
 * returns `['healing', 'healing_base', 'healing_recv']`, each read by `makeStatItem` and
 * summed into the heal's `CMultiplierBonus` = `(1 + healing + healing_base + healing_recv)`.
 *   - `healing_base` — the character's ASCENSION healing-bonus secondary, carried in
 *     `charTables` (e.g. Jean / Qiqi 22.15% at A6; 0 for non-healing-secondary chars).
 *   - `healing` / `healing_recv` — outgoing-healing-bonus and healing-received, arriving
 *     from artifacts / weapons / conditions (e.g. Maiden Beloved, Diona C6 healing_recv).
 * All match her `isPercent` (`/^healing/`) → processPercent /100 → emitted here as FRACTIONS.
 * Read ONLY by `compileOutput`'s heal path; the damage tree never touches them → base-inert
 * for the 58k damage goldens. (Heals were unmodelled pre-P3.5.3, so these were never emitted —
 * which silently dropped the ascension healing bonus from every heal output. P3.5.3 fix.)
 * Source: raw/.../Feature2/Heal.js:38-45,90-95 (getStatsHealBonus + CMultiplierBonus base).
 */
const HEAL_BONUS_KEYS = ["healing", "healing_base", "healing_recv"] as const;

/**
 * Level/ascension parameters for base-stat assembly. (Talent levels are a
 * compileFeature concern — they pick the talent-table row, not a base stat — so
 * they live on CompileContext, not here.)
 */
export interface BuildLevels {
  readonly charLevel: number;
  readonly ascension: number;
  readonly weaponLevel: number;
  readonly weaponAscension: number;
}

/** Enemy parameters: level + resistance as a percent (uniform number) or per-element map. */
export interface BuildEnemy {
  readonly level: number;
  /** Either one percent applied to all elements, or a per-element percent map. */
  readonly resistance: number | Readonly<Partial<Record<Element, number>>>;
}

/**
 * Optional base talent levels — the 1-indexed game talent level for each slot
 * (attack / elemental / burst). When provided, `buildStats` injects these as
 * `char_skill_attack`, `char_skill_elemental`, `char_skill_burst` into the
 * merged settings so that talent-scaled post-effects (`ratioFromTalent`) can
 * resolve the effective level (base + constellation `_bonus`).
 *
 * The `_bonus` keys are already propagated by the condition loop (C3/C5
 * constellation keystone); the base keys are NOT in `input.settings` by
 * default (they are a compileFeature concern), so they must be injected here
 * for post-effects that need them. Only the keys present in the `talentLevels`
 * object are injected — missing slots default to `undefined` (→ 0 in
 * `settings[key] || 1` fallback, which mirrors her PostEffect.getLevel).
 */
export interface TalentLevels {
  readonly attack?: number;
  readonly elemental?: number;
  readonly burst?: number;
}

/** Everything `buildStats` needs to assemble the bag. */
export interface BuildInput {
  readonly char: DbObjectChar;
  /** Weapon base-stat providers (passive handling is the caller's concern). */
  readonly weaponStatTable: readonly StatTableEntry[];
  /** RAW (un-percent-processed) bonus stat block (artifacts + sample stats). */
  readonly statBlock: Readonly<Record<string, number>>;
  readonly levels: BuildLevels;
  readonly enemy: BuildEnemy;
  /** The immutable EvalContext for condition-gated post-effects/buffs. */
  readonly settings?: EvalContext;
  /**
   * Base talent levels (attack / elemental / burst). When provided, their
   * values are injected into the merged settings as `char_skill_attack`,
   * `char_skill_elemental`, `char_skill_burst` — required for talent-scaled
   * post-effects (`CharPostEffect.ratioFromTalent`).
   */
  readonly talentLevels?: TalentLevels;
  /**
   * Generic condition channel for equipped-object (weapon / artifact-set)
   * conditions. Applied identically to `char.conditions` in the condition loop —
   * later tasks (weapon passives, set shapes) pass the equipped objects'
   * conditions in here. Her CalcSet.getBaseStats iterates every equipped object's
   * `getConditions()`; this is that same set, minus the character's own.
   */
  readonly extraConditions?: readonly Condition[];
  /**
   * Equipped weapon's post-effects (HP→ATK / crit-from-HP folds). Applied in the
   * SAME post-effect path as char + set post-effects — her `getPostEffects()`
   * concats every equipped object's. The weapon path passes `weapon.postEffects`
   * here (mirroring how it passes `weapon.conditions` via `extraConditions`).
   * Absent / empty → no-op: no base-build weapon carries a post-effect, so the
   * base golden suite is untouched.
   */
  readonly weaponPostEffects?: readonly CharPostEffect[];
  /**
   * Equipped artifact sets + their piece counts (e.g. `[{ setKey: "NoblesseOblige",
   * pieces: 4 }]`). Each is resolved against the set registry; conditions from every
   * bonus tier `t <= pieces` enter the condition loop (the PIECE-COUNT gate), each
   * then independently subject to its own gate (the CONDITION gate). Mirrors her
   * `CalcObjectArtifacts`: `activeSets()` counts pieces per set, `getConditions(pieces)`
   * collects the unlocked tiers' conditions, and `getSettings()` injects
   * `set_pieces.<setKey-lowercased> = pieces` (read by `ConditionBooleanPiecesCount`).
   * Absent / empty → the whole set path is a no-op (the base golden suite is untouched).
   */
  readonly setBonuses?: readonly EquippedSet[];
  /**
   * Optional set-registry override (DI seam). When provided, set lookups resolve
   * against this map instead of the module barrel `getArtifactSet`. Production callers
   * omit it (→ barrel); the golden harness injects a glob-built registry so a set file
   * validates without a barrel edit. The override is complete: if `setRegistry` is
   * present and a key is absent from it, that set is treated as unported (no-op).
   */
  readonly setRegistry?: Readonly<Record<string, DbObjectArtifactSet>>;
  /**
   * Optional party composition. When provided, the universal party publisher
   * (`buildPartyContext`) derives `party_*` context keys (element/origin counts,
   * resonance slots, raw passthrough) and injects them into `baseSettings` so the
   * condition loop and compiled features can gate on them. Absent → no `party_*` keys
   * are added and the base build path is byte-identical (base-safety invariant).
   *
   * Slug-keyed members (`{ character: slug }`) require the caller to supply a
   * `partySlugResolver`; without one the default resolver throws. For now, callers
   * that know each member's element/origin should use `{ element, origin }` members
   * directly (no resolver needed). See Task B1 for oracle-harness wiring.
   */
  readonly party?: PartyInput;
  /**
   * Optional resolver for slug-keyed party members (`{ character: slug }`). Called
   * with the slug string; must return `{ element, origin? }`. Omitting this while
   * passing slug members causes a runtime throw. Callers using only
   * `{ element, origin? }` members can safely omit this.
   */
  readonly partySlugResolver?: (slug: string) => DbObjectChar;
}

/** One equipped artifact set: its registry key + how many pieces are worn. */
export interface EquippedSet {
  /** Registry key (GOOD `goodId`), e.g. "NoblesseOblige". */
  readonly setKey: string;
  /** Equipped piece count (1–5; bonus tiers exist at 2 and 4). */
  readonly pieces: number;
}

/** The assembled bag + the context the engine evaluates against. */
export interface BuildResult {
  readonly stats: BuildStats;
  readonly context: DamageContext;
  /**
   * The settings AFTER condition-`.settings` propagation — the input settings
   * extended with every active condition's contributed settings, exactly as her
   * `CalcSet.getBaseStats` merges `condData.settings` into the running settings
   * (CalcSet.js:360-363). The caller threads these into the `CompileContext` so
   * condition-driven settings resolve at compile time: talent-level `_bonus`
   * offsets (Hu Tao C3/C5), constellation-gated multiplier gates, infusions.
   * Equals the input settings (+ system-canonical `weapon_type`/`set_pieces.*`)
   * when no active condition carries `.settings` — i.e. the base-107 build.
   */
  readonly settings: EvalContext;
  /**
   * Global character MULTIPLIERS (`CHARACTER_MULTIPLIERS`) — the team-buff analogue of
   * the global `CHARACTER_CONDITIONS`, for set_other buffs whose effect is a
   * FeatureMultiplier (a base-damage-term bonus, e.g. Song of Days Past 4pc team) rather
   * than a stat-bag condition. The caller threads these into `compileCharacter` as
   * `extraMultipliers` so each is summed into every matching feature's base term, gated
   * by its own `condition` against THESE propagated settings. Each is gated on a
   * `set_other.*` toggle, so the channel is inert for every non-party build (no toggle →
   * no match → byte-identical compiled features). Returned verbatim — the gate decides
   * activation at compile time, not buildStats.
   */
  readonly characterMultipliers: readonly CharMultiplier[];
}

/**
 * Adapt a declarative CharPostEffect into an executable core PostEffect.
 *
 * Mirrors her PostEffectStatsHP: derive `ratio × getTotal(fromStat)`, optionally
 * capped at `capRatio × getTotal(capStat)`, gated by ALL `conditions` evaluating
 * true against the settings. Reads the PRE-GROUP snapshot (never mutates).
 *
 * When `offset` is set: `bonus = max(0, getTotal(fromStat) − offset) × ratio`,
 * floored at 0 before capping. Mirrors `PostEffectStatsExceedRecharge` which
 * subtracts 1 from the decimal recharge before multiplying (ExceedRecharge.js).
 *
 * `capUsesBase`: the stat-relative `cap` reads the BASE stat (`capStat_base`)
 * × capRatio, not `getTotal(capStat)` — her `statCapPost` whose base is a
 * `from: '<stat>_base'` term (Hu Tao's `atk_base × 4`, Hutao.js:155-158).
 *
 * Percent-stat post-effects (e.g. Furina's A4 `dmg_skill_furina`) land in the
 * bag as RAW PERCENTS; `buildStats`'s `collectFeatureBonusKeys` emit loop applies
 * the /100 at emit time — exactly as every other dmg_* feature-bonus key.
 */
function toPostEffect(effect: CharPostEffect): PostEffect {
  const conditions: readonly Condition[] = effect.conditions ?? [];
  return {
    priority: effect.priority ?? 1,
    contribute(readStats: Stats, settings: EvalContext): Record<string, number> {
      if (!conditions.every((c) => evaluate(c, settings))) return {};
      // Talent-table direct bonus — `bonus = table.getValue(effectiveLevel)`.
      // Models ConditionLevels: contributes `dmg_skill_nahida` at burst talent level
      // (Nahida.js:338-371). Skips the base-stat multiplication entirely.
      // Source: raw/genshin_calc_pub/src/js/classes/Condition/Levels.js (getStats)
      if (effect.talentBonus !== undefined) {
        const { table, levelSetting } = effect.talentBonus;
        const base = (settings[levelSetting] as number | undefined) ?? 1;
        const bonus1 = (settings[`${levelSetting}_bonus`] as number | undefined) ?? 0;
        const bonus2 = (settings[`${levelSetting}_bonus_2`] as number | undefined) ?? 0;
        const effectiveLevel = base + bonus1 + bonus2;
        return { [effect.toStat]: table.getValue(effectiveLevel) };
      }
      // Resolve ratio: talent-scaled (dynamic) or fixed constant.
      let ratio: number;
      if (effect.ratioFromTalent !== undefined) {
        const { table, levelSetting, multi } = effect.ratioFromTalent;
        // Mirror her PostEffect.getLevel: base || 1, then add _bonus and _bonus_2.
        const base = (settings[levelSetting] as number | undefined) ?? 1;
        const bonus1 = (settings[`${levelSetting}_bonus`] as number | undefined) ?? 0;
        const bonus2 = (settings[`${levelSetting}_bonus_2`] as number | undefined) ?? 0;
        const effectiveLevel = base + bonus1 + bonus2;
        ratio = table.getValue(effectiveLevel) * multi;
      } else {
        ratio = effect.ratio ?? 0;
      }
      // Per-stack ADDITIVE on the ratio (her percentBonus × bonusStackSettings; the
      // MULTIPLICATIVE whole-ratio stacks is the separate `stacksSetting` branch below):
      // ratio += perStackTable(level) × settings[setting]. Absent setting → 0 → no change.
      if (effect.ratioPerStack !== undefined) {
        const { setting, table, levelSetting } = effect.ratioPerStack;
        const lvl = (settings[levelSetting] as number | undefined) ?? 1;
        const stacks = (settings[setting] as number | undefined) ?? 0;
        ratio += table.getValue(lvl) * stacks;
      }
      // Multiplicative stacks on the whole ratio (her getStacks → CMulti([ratio, stacks]),
      // Stats.js:77-81): ratio *= settings[stacksSetting] (her `|| 1` ⇒ >1 only). Applied
      // BEFORE percentBonus (her (ratio × stacks) + bonus). Absent → unchanged (base-inert).
      if (effect.stacksSetting !== undefined) {
        const stacks = (settings[effect.stacksSetting] as number | undefined) ?? 1;
        if (stacks > 1) ratio *= stacks;
      }
      // Conditional flat addend on the ratio (her percentBonus × bonusCondition,
      // PostEffect/Stats.js:41-50,77-88): when the gate is absent or active, add percentBonus.value
      // to the ratio AFTER any stacks multiply and BEFORE it multiplies the `from` stat (her
      // CSum([value × stacks, bonus]), bonus = percentBonus.value). Absent → no addend
      // (base-inert: 58k goldens byte-unchanged).
      if (
        effect.percentBonus !== undefined &&
        (effect.percentBonus.condition === undefined || evaluate(effect.percentBonus.condition, settings))
      ) {
        ratio += effect.percentBonus.value;
      }
      // Base stat: getTotal(fromStat), or max(getTotal(fromStat), getTotal(fromStatMax))
      // when fromStatMax is set. Mirrors PostEffectStatsNahida.getBaseValueTree which
      // returns CMax([makeStatTotalItem('mastery'), makeStatItem('party_max_mastery')]).
      // Source: raw/genshin_calc_pub/src/js/classes/PostEffect/Stats/Nahida.js:6-11
      const fromTotal0 = readStats.getTotal(effect.fromStat);
      const fromTotal1 = effect.fromStatMax !== undefined
        ? Math.max(fromTotal0, readStats.getTotal(effect.fromStatMax))
        : fromTotal0;
      // HP-ratio transform (her PostEffectStatsNeuvillette.getBaseValueTree): when the
      // raw `from` value is an ABSOLUTE HP amount (> 100), convert it to a percentage of
      // the divisor stat — `100 · from / getTotal(fromStatDivide)`. A value already given
      // as a percentage (<= 100) passes through. Applied BEFORE the offset/floor below.
      // Absent fromStatDivide → unchanged (base-inert). Source: PostEffect/Stats/Neuvillette.js:7-20.
      const fromTotal = effect.fromStatDivide !== undefined && fromTotal1 > 100
        ? fromTotal1 / (readStats.getTotal(effect.fromStatDivide) / 100)
        : fromTotal1;
      // ADD a second stat into the base (her PostEffectPartyEnergy.getBaseValueTree:
      // CSum([makeStatItem('burst_energy_cost'), makeStatItem('party_burst_energy_cost')])).
      // The addend is read on the SAME scale as `fromStat` and summed BEFORE offset/ratio/cap —
      // no extra fold (both energy terms are raw integers; only the dmg_burst output folds /100
      // at emit, exactly as the self-only term already does for the solo goldens). Absent
      // fromStatAddend → unchanged (base-inert: sole user = the 3 party-energy burst weapons).
      // Source: raw/genshin_calc_pub/src/js/classes/PostEffect/Stats/PartyEnergy.js:5-12.
      const fromBase = effect.fromStatAddend !== undefined
        ? fromTotal + readStats.getTotal(effect.fromStatAddend)
        : fromTotal;
      // SETTING-sourced percent factor (her PostEffectStatsBondOfLife.getBolValue:
      // base = hp_total × (settings[bolSettingName] || 0) / 100). The `/100` is intrinsic —
      // the setting is a UI percent (the Bond-of-Life slider), NOT a getTotal stat. Applied
      // AFTER fromStatAddend, BEFORE offset/ratio/cap. Absent → unchanged (base-inert: sole
      // users are the two BoL-scaling weapons Flowing Purity / Finale of the Deep).
      // Source: raw/genshin_calc_pub/src/js/classes/PostEffect/Stats/BondOfLife.js:6-15.
      const fromFactored = effect.fromStatFactorSetting !== undefined
        ? fromBase * ((settings[effect.fromStatFactorSetting] as number | undefined ?? 0) / 100)
        : fromBase;
      const fromValue = effect.offset !== undefined ? Math.max(0, fromFactored - effect.offset) : fromFactored;
      let bonus = fromValue * ratio;
      if (effect.cap !== undefined) {
        const capBase = effect.capUsesBase
          ? readStats.get(`${effect.cap.capStat}_base`)
          : readStats.getTotal(effect.cap.capStat);
        bonus = Math.min(bonus, capBase * effect.cap.capRatio);
      }
      if (effect.capValue !== undefined) {
        bonus = Math.min(bonus, effect.capValue);
      }
      // Refine/talent-scaled absolute cap (her statCap StatTable keyed off a
      // levelSetting) — e.g. Ring of Yaxche's [16,20,24,28,32] over weapon_refine.
      if (effect.capValueFromTalent !== undefined) {
        const { table, levelSetting } = effect.capValueFromTalent;
        const level = (settings[levelSetting] as number | undefined) ?? 1;
        bonus = Math.min(bonus, table.getValue(level));
      }
      return { [effect.toStat]: bonus };
    },
  };
}

/**
 * The set of feature-declared bonus stat keys referenced across a character's
 * features (`critRateBonuses` ∪ `critDamageBonuses` ∪ `damageBonuses`). These are
 * the char-specific percent keys `compileFeature` reads; buildStats must emit each
 * present one as a fraction. (De-duped — keys are shared across hits.)
 */
function collectFeatureBonusKeys(features: readonly Feature[]): readonly string[] {
  const keys = new Set<string>();
  for (const f of features) {
    for (const k of f.critRateBonuses ?? []) keys.add(k);
    for (const k of f.critDamageBonuses ?? []) keys.add(k);
    for (const k of f.damageBonuses ?? []) keys.add(k);
  }
  return [...keys];
}

/** What an equipped-set's `setBonuses` resolve to: gated conditions + piece-count settings + post-effects. */
interface ResolvedSetBonuses {
  /** Piece-count-gated conditions (tiers `t <= pieces`), still subject to their own gate. */
  readonly conditions: readonly Condition[];
  /** `set_pieces.<setKey-lowercased> → pieces`, the settings ConditionBooleanPiecesCount reads. */
  readonly pieceSettings: Readonly<Record<string, number>>;
  /** Set-level post-effects (HP→ATK-style folds), in equip order. */
  readonly postEffects: readonly CharPostEffect[];
}

/**
 * Resolve equipped sets into their piece-count-gated conditions, the
 * `set_pieces.*` settings, and any set-level post-effects.
 *
 * The PIECE-COUNT gate lives here (which tiers enter): a set's tier-`t` conditions
 * are included only when `pieces >= t`. The CONDITION gate stays in `conditionStats`
 * (whether an entered condition fires). Mirrors her `ArtifactSet.getConditions(pieces)`
 * (concats `bonus[i].conditions` for `i <= pieces`) + `CalcObjectArtifacts.getSettings`
 * (injects `set_pieces.<name> = count`). Unknown set keys are skipped (a set not yet
 * ported contributes nothing) — P2.A1 fills the registry.
 *
 * When `setRegistry` is provided it replaces the barrel lookup entirely (DI seam):
 * the golden harness injects a glob-built registry so a set file validates without
 * a barrel edit.
 */
function resolveSetBonuses(
  setBonuses: readonly EquippedSet[],
  setRegistry?: Readonly<Record<string, DbObjectArtifactSet>>
): ResolvedSetBonuses {
  const conditions: Condition[] = [];
  const pieceSettings: Record<string, number> = {};
  const postEffects: CharPostEffect[] = [];

  for (const { setKey, pieces } of setBonuses) {
    const set = setRegistry ? setRegistry[setKey] : getArtifactSet(setKey);
    if (set === undefined) continue;
    pieceSettings[`set_pieces.${setKey.toLowerCase()}`] = pieces;
    // Piece-count gate: include each bonus tier unlocked at this piece count.
    for (const tier of [2, 4] as const) {
      if (pieces < tier) continue;
      const bonus = set.bonus[tier];
      if (bonus?.conditions) conditions.push(...bonus.conditions);
    }
    if (set.postEffects) postEffects.push(...set.postEffects);
  }

  return { conditions, pieceSettings, postEffects };
}

/** Resolve the enemy resistance input into a per-element fraction lookup. */
function resistanceFraction(
  resistance: BuildEnemy["resistance"],
  element: Element
): number {
  if (typeof resistance === "number") return resistance / 100;
  return (resistance[element] ?? 0) / 100;
}

/**
 * Assemble the BuildStats bag + DamageContext for a character under a build.
 */
export function buildStats(input: BuildInput): BuildResult {
  // Resolve equipped sets up front: their piece-count settings (`set_pieces.*`)
  // must be visible to every condition's evaluate() — the global set buffs gate on
  // them via ConditionBooleanPiecesCount. Merge them into the build settings (they
  // add only `set_pieces.*` keys, which char/weapon conditions never read, so this
  // is inert for the no-set path → the base golden suite is untouched).
  const sets = resolveSetBonuses(input.setBonuses ?? [], input.setRegistry);

  // Inject the character's weapon type as `weapon_type` so ConditionBooleanWeaponType
  // conditions (e.g. GladiatorFinale 4pc) can read it from the EvalContext. Like the
  // `set_pieces.*` keys, this is a SYSTEM-DERIVED canonical fact (the char's actual
  // equipped weapon), so it is spread AFTER `input.settings` — a caller cannot override
  // it. It is always present; no existing condition reads it, so this is inert for every
  // current build — the base-107 golden suite and all existing set suites are untouched.
  // NOTE (P2.C): char-feature weapon-type conditions would also need `weapon_type` in
  // the COMPILE settings (CompileContext). Out of scope here — set conditions are
  // resolved entirely within buildStats, so this injection suffices for set 4pc gates.
  //
  // Inject base talent levels (when provided) as `char_skill_<slot>` keys so that
  // talent-scaled post-effects (`CharPostEffect.ratioFromTalent`) can read the base
  // level from settings and combine it with the constellation `_bonus` offset (already
  // propagated by the condition loop). Mirrors her `PostEffect.getLevel` which reads
  // `settings[levelSetting] || 1` + `settings[levelSetting + '_bonus']`. These keys
  // are NOT normally in the caller's settings (they are a compileFeature concern); this
  // injection is opt-in (only when `input.talentLevels` is provided) and base-safe —
  // no existing condition reads `char_skill_*`, so the 107/base + all other tests are
  // untouched. Injected BEFORE `input.settings` so callers can override if needed.
  const talentSettings: Record<string, number> = {};
  if (input.talentLevels) {
    if (input.talentLevels.attack !== undefined) talentSettings["char_skill_attack"] = input.talentLevels.attack;
    if (input.talentLevels.elemental !== undefined) talentSettings["char_skill_elemental"] = input.talentLevels.elemental;
    if (input.talentLevels.burst !== undefined) talentSettings["char_skill_burst"] = input.talentLevels.burst;
  }

  // System-canonical wielder attributes injected into the settings the condition loop reads
  // (alongside weapon_type). Drive char-attribute gates: char_origin → ConditionLithic /
  // ConditionBooleanNightSoul, char_name → ConditionBooleanChar. Base-inert (no base char
  // condition reads them). char_id (=serializeId) is deferred (DbObjectChar has no serializeId;
  // the natlan-origin branch covers every v5.8 NightSoul case).
  //
  // Party keys (party_*): derived from the optional PartyInput via the universal publisher.
  // Absent party → empty object → no party_* keys added (base-safety invariant).
  const resolveChar = input.partySlugResolver;
  const partyKeys = input.party
    ? buildPartyContext(
        input.party,
        { element: input.char.element, origin: input.char.origin },
        resolveChar ? (slug) => { const c = resolveChar(slug); return { element: c.element, origin: c.origin }; } : undefined
      )
    : {};
  const partyBuffs = input.party && resolveChar
    ? buildPartyBuffs(input.party, resolveChar)
    : { conditions: [], postEffects: [], multipliers: [], settings: {} };
  const baseSettings: EvalContext = {
    weapon_type: input.char.weapon,
    char_origin: input.char.origin,
    char_name: input.char.name,
    char_element: input.char.element,
    ...partyKeys,
    ...partyBuffs.settings,
  };

  const settings: EvalContext =
    input.setBonuses && input.setBonuses.length > 0
      ? { ...talentSettings, ...(input.settings ?? {}), ...baseSettings, ...sets.pieceSettings }
      : { ...talentSettings, ...(input.settings ?? {}), ...baseSettings };

  // 1-2. Aggregate base stats (char then weapon), then concat the bonus block.
  const raw = new Stats();
  const addEntries = (entries: readonly StatTableEntry[], level: number, ascension: number): void => {
    for (const e of entries) {
      raw.add(e.getName(), e.getValue(level, ascension));
    }
  };
  addEntries(input.char.statTable, input.levels.charLevel, input.levels.ascension);
  addEntries(input.weaponStatTable, input.levels.weaponLevel, input.levels.weaponAscension);
  // Always-active passive stat bonuses (auto-active ascension/passive conditions
  // under the canonical build) — RAW, concatenated like the bonus block. Her
  // getBuildData applies these via the baseline-active conditions.
  if (input.char.baseStats) raw.concat(input.char.baseStats);
  raw.concat(input.statBlock);

  // 2b. Apply the conditional layer — every active condition's contributed stats,
  // RAW, concatenated like the bonus block. Mirrors her CalcSet.getBaseStats loop
  // (`cond.getData(settings).stats` over each equipped object's conditions). This
  // is ADDITIVE on top of `baseStats` (always-on passives): each condition here is
  // gated/toggleable, so at the base C0 build with no toggles `conditionStats`
  // returns {} and the loop is a no-op (the 107/107 base golden suite is untouched).
  // Runs BEFORE applyPostEffects so post-effects (HP→ATK) read condition-contributed
  // stats — exactly her order. Stacks scale by getStackCount, refine resolves by
  // weapon_refine: all handled inside the pure `conditionStats` resolver.
  //
  // Settings PROPAGATION (her CalcSet.getBaseStats:360-363): each active condition's
  // `.settings` are merged into the running settings that subsequent conditions, the
  // post-effects, AND the compile context read. `getData` returns `{stats, settings}`
  // and she does `result.settings.concat(result.settings, condData.settings)`; here
  // `conditionStats` is the stats half and `conditionSettings` the settings half. The
  // stats for a condition are computed against the PRE-merge settings (its own settings
  // don't gate itself), then merged in for the rest — exactly her order. Inert for the
  // base build: every condition is a gated-off toggle → both halves return {} → no merge.
  let merged: EvalContext = settings;
  const applyCondition = (cond: Condition): void => {
    raw.concat(conditionStats(cond, merged));
    merged = { ...merged, ...conditionSettings(cond, merged) };
  };
  for (const cond of input.char.conditions ?? []) applyCondition(cond);
  for (const cond of input.extraConditions ?? []) applyCondition(cond);
  // Equipped artifact-set conditions (piece-count gated in resolveSetBonuses, then
  // each subject to its own gate here) — the same loop as char/weapon conditions.
  // Mirrors her CalcSet.getBaseStats iterating the artifacts' (+ buffs') getConditions.
  for (const cond of sets.conditions) applyCondition(cond);
  // Global character conditions (DB.Conditions.Character). In her engine,
  // CalcObjectCharacter.getConditions() does `result.concat(DB.Conditions.Character)`,
  // appending these onto EVERY character's condition list. Each is gated by its own
  // boolean `name` — contributes nothing unless that toggle is set in settings. Inert
  // for the base build and all constellation/set configs where no global toggle is set.
  // Source: raw/genshin_calc_pub/src/js/db/Conditions/Character.js
  //         raw/genshin_calc_pub/src/js/classes/Objects/Character.js (getConditions concat)
  for (const cond of CHARACTER_CONDITIONS) applyCondition(cond);
  // Global ENEMY conditions (DB.Conditions.Enemy). Her Enemy CalcObject concats these
  // (CalcObject/Enemy.js:71-77) and CalcSet.getBaseStats folds every object's conditions —
  // including the enemy's — into the same base-stats bag (CalcSet.js:357-363). The only
  // stat-bearing entry is `enemy.superconduct → enemy_res_physical:-40`; gated on its own
  // boolean toggle, so inert for every build that does not set it (all 58k goldens).
  // Source: raw/genshin_calc_pub/src/js/db/Conditions/Enemy.js:65-73
  for (const cond of ENEMY_CONDITIONS) applyCondition(cond);
  // The universal manual-buff escape-hatch (her always-present ConditionCustomBuffs in
  // DB.Buffs.ElementalResonance). Loops `custom_buffs.<key>` settings → injects each suffix as a
  // RAW stat into `raw`. Folds {} unless a `custom_buffs.*` setting is present → inert for every
  // build that doesn't set one (all 58k goldens). Source: raw/.../classes/Condition/CustomBuffs.js
  applyCondition(CUSTOM_BUFFS_CONDITION);
  // Per-teammate kit conditions (her char.getPartyConditions() concat). A `number` condition
  // (e.g. bennet_atk_base) lifts a baked setting into the stat bag for a post-effect to read.
  for (const cond of partyBuffs.conditions) applyCondition(cond);

  // 3. Derive — condition-gated post-effects (reads RAW percents via getTotal).
  // Char post-effects, then the equipped WEAPON's post-effects (Staff of Homa /
  // Primordial Jade Cutter HP→ATK folds), then any set-level post-effects — all
  // through the same path. Her getPostEffects concats EVERY equipped object's
  // (char + weapon + artifact sets). Reads the MERGED settings so a condition-
  // contributed level bonus / infusion is visible to a post-effect's `levelSetting`
  // (her PostEffect.getLevel adds `_bonus`); refine-scaled weapon folds read
  // `weapon_refine` from the merged settings. No base-build weapon carries a
  // post-effect → the weapon channel is a no-op for the base golden suite.
  //
  // Global character post-effects (DB.Buffs `weapons`/`static` post-effects in her engine) —
  // off-field weapon teammate-stat conversions (desert_pavilion EM→atk, key_of_khaj_nisut HP→mastery,
  // whisper_of_the_jinn EM→recharge, peak_patrol_song DEF→dmg_<el>). Appended onto EVERY character's
  // post-effect list exactly like CHARACTER_CONDITIONS, since her CalcSet.getPostEffects() concats the
  // always-present `weapons`/`static` buffs' post-effects. Each is gated on a `weapon_other.*` toggle
  // and reads its teammate-stat INPUT from the bag; inert (gate fails → {}) for every build that sets
  // no such toggle, so the base golden suite + all existing fixtures are byte-unchanged.
  const effects = [
    ...(input.char.postEffects ?? []),
    ...(input.weaponPostEffects ?? []),
    ...sets.postEffects,
    ...CHARACTER_POST_EFFECTS,
    ...partyBuffs.postEffects, // per-teammate kit post-effects (her char.getPartyPostEffects())
  ].map(toPostEffect);
  applyPostEffects(raw, effects, merged);

  // Fold `dmg_own` (the wielder's "own-element" DMG bonus — Mistsplitter Reforged, A
  // Thousand Floating Dreams, Hakushin Ring) into `dmg_<char_element>`, mirroring her
  // CalcSet.js:380-381 (`stats.add('dmg_'+char_element, stats.get('dmg_own'))`). The
  // element key uses `phys` for physical (matching DMG_BONUS_ELEMENT_KEYS). Base-inert:
  // no base build contributes `dmg_own` → `get` returns 0 → no-op.
  const ownDmg = raw.get("dmg_own");
  if (ownDmg) {
    const elemKey = input.char.element === "physical" ? "phys" : input.char.element;
    raw.add(`dmg_${elemKey}`, ownDmg);
  }

  // 4. Read — emit the engine-facing bag.
  const out: Record<string, number> = {};

  // Scaling totals (atk/hp/def): base×(1+%/100)+flat — raw value, read directly.
  for (const stat of SCALING_TOTAL_STATS) {
    out[`${stat}_total`] = raw.getTotal(stat);
  }
  // WHITE base ATK — her `makeStatItem('atk_base')` = `stats.get('atk_base')`, the
  // accumulated base ATK (char base + weapon base + any flat `atk_base` bonus), read
  // VERBATIM with NO `/100` (it is flat ATK, not a percent stat — `isPercent('atk_base')`
  // is false). Distinct from `atk_total` (= base×(1+%)+flat): this is the pre-%, pre-flat
  // white base that the ATK-buff readouts and the Hu Tao cap scale on. `atk_base` was used
  // ONLY internally before (Stats.getTotal('atk') and the Hu Tao `capUsesBase` term) and
  // never copied into the bag — so a `scaling:"atk_base"` static OUTPUT read undefined.
  // Emitted now so those readouts (bennett.burst.atk_bonus, kujou_sara.skill.sara_atk_bonus,
  // hu_tao.skill.hutao_max_hp_bonus) resolve — hutao_atk_bonus scales on hp_total, not this key
  // (only its DEFERRED 4×atk_base cap is atk_base-relative). Read ONLY by a
  // multiplier whose scaling key is exactly `atk_base` (resolveStatKey passes it verbatim —
  // it is NOT in TOTAL_SCALING_STATS={atk,hp,def,mastery}), and NO damage feature opts in →
  // base-inert for the 58k damage goldens (mirrors the healing_base emission, commit 8e101ea,
  // minus the /100). Source: raw/.../Feature2/Compile/Helpers.js makeStatItem,
  //         raw/.../classes/Stats.js isPercent (no atk_base branch).
  if (raw.isSet("atk_base")) out["atk_base"] = raw.get("atk_base");
  // BURST ENERGY COST — her `makeStatItem('burst_energy_cost')` = `stats.get('burst_energy_cost')`,
  // the char's burst energy requirement (a `constEntry` in CharTables, e.g. Raiden 90), read VERBATIM
  // with NO `/100` (it is a flat energy count, not a percent — `isPercent('burst_energy_cost')` is false:
  // the prefix list has `enemy_`, not `energy`). Used ONLY internally before (her burst-DMG/energy
  // post-effects) and never copied into the bag — so a `scaling:"burst_energy_cost"` static OUTPUT read
  // undefined. Emitted now so the Raiden A4 burst-DMG readout (raiden_shogun.other.burst_dmg_bonus,
  // = 0.3% per energy × 90 = 27) resolves. Read ONLY by a multiplier whose scaling key is exactly
  // `burst_energy_cost` (resolveStatKey passes it verbatim — NOT in TOTAL_SCALING_STATS={atk,hp,def,mastery}),
  // and NO damage feature opts in → base-inert for the 58k damage goldens (mirrors the atk_base emit above).
  // (The akuoumaru/wavebreakers-fin/mouuns-moon weapon postEffects also reference burst_energy_cost, but via
  //  `fromStat`→`raw.getTotal` on the internal Stats object, NOT this `out` bag — independent of this emit.)
  // Source: raw/.../Feature2/Compile/Helpers.js makeStatItem, raw/.../classes/Stats.js isPercent (no `energy` branch),
  //         raw/.../db/generated/CharTables.js (constEntry burst_energy_cost).
  if (raw.isSet("burst_energy_cost")) out["burst_energy_cost"] = raw.get("burst_energy_cost");
  // Flat totals read as numbers (mastery, recharge).
  for (const stat of FLAT_TOTAL_STATS) {
    out[`${stat}_total`] = raw.getTotal(stat);
  }
  // Reaction EM key: the reaction factories (`@genshin/core`'s cLunarChargedDamage,
  // the transformative EM bonuses, compileFeature's lunarEmBonusTerm) read the bare
  // `mastery` key for the EM-watershed term. Her engine's `makeStatTotalItem('mastery')`
  // sums `mastery_base + mastery` (flat) — exactly getTotal('mastery'), since mastery
  // is not a REAL_TOTAL stat. Emit it so every EM-scaling reaction reads the true total
  // EM with no per-feature aliasing. (Raw: Feature2/Multiplier/Reaction/LunarCharged.js,
  // Feature2/Compile/Helpers.js makeStatTotalItem, db/Constants.js REAL_TOTAL.)
  out["mastery"] = raw.getTotal("mastery");
  // Flat percent totals → fractions for the engine (crit_rate, crit_dmg).
  for (const stat of FRACTION_TOTAL_STATS) {
    out[`${stat}_total`] = raw.getTotal(stat) / 100;
  }

  // Element DMG% bonuses → fractions, folding the `_base` ascension/passive
  // secondary into the total (her `dmg_<element>*`). Emit when either the flat
  // bonus OR its `_base` is present so the +30% phys DMG (`dmg_phys_base`) lands.
  for (const key of DMG_BONUS_ELEMENT_KEYS) {
    const baseKey = `${key}_base`;
    if (raw.isSet(key) || raw.isSet(baseKey)) {
      out[key] = (raw.get(key) + raw.get(baseKey)) / 100;
    }
  }
  // Type DMG% bonuses + dmg_all → fractions, flat only (no `*` in her getStatsDmgBonus).
  for (const key of DMG_BONUS_TYPE_KEYS) {
    if (raw.isSet(key)) out[key] = raw.get(key) / 100;
  }
  // Composite type×element DMG% bonuses → fractions, only when set (Candace's
  // `dmg_normal_<element>`). Both the prayer condition (raw 20) and the A4
  // postEffect (raw `0.0005 × HP`) accumulate into the SAME bag key as RAW
  // percent, then a SINGLE /100 here — exactly her `processPercent` on the
  // condition value summed with the post-effect's pre-divided getTree output
  // (her PostEffectStats on a percent stat folds the isPercent /100 internally;
  // our toPostEffect stores the raw scale instead, so the single emit /100
  // reproduces it — the established Furina `dmg_skill_furina` idiom). Absent for
  // every non-Candace build → no key → base golden + fixtures byte-unchanged.
  for (const key of DMG_BONUS_COMPOSITE_KEYS) {
    if (raw.isSet(key)) out[key] = raw.get(key) / 100;
  }
  // Per-TYPE crit (her getDefaultStatsCritRate/CritDamage push crit_*_<type> for the
  // hit's type) → fractions, flat only. Emitted GENERICALLY (not gated on feature
  // references) so a weapon/set/cons-sourced type-crit reaches compileFeature regardless
  // of which feature declares it — e.g. The Catch's always-on `crit_rate_burst` lands on
  // every Hu Tao burst hit. 0 for every base build (no source sets a type-crit at C0) →
  // base golden untouched. ELEMENT crit (`crit_*_<element>`) stays on the
  // collectFeatureBonusKeys emit below (deferred — no ported item folds it yet).
  for (const type of CRIT_BONUS_TYPES) {
    for (const which of ["rate", "dmg"] as const) {
      const key = `crit_${which}_${type}`;
      if (raw.isSet(key)) out[key] = raw.get(key) / 100;
    }
  }
  // Enemy-vulnerability crit rate (her getDefaultStatsCritRate ALWAYS includes
  // `crit_rate_enemy` in the crit-rate sum, Feature2/Damage.js:73) → fraction, flat.
  // Sourced by enemy-status debuffs: Cryo Resonance (+15 vs Cryo'd enemy) and
  // BlizzardStrayer 4pc (+20/+40 vs Cryo/Frozen). compileFeature folds it into every
  // feature's crit-rate block (no `crit_dmg_enemy` counterpart — she has none). 0 for
  // every base build (no C0 source sets it; Razor C2's is a gated-off toggle) → base
  // golden untouched; only the resonance-cryo / blizzard party fixtures exercise it.
  if (raw.isSet("crit_rate_enemy")) out["crit_rate_enemy"] = raw.get("crit_rate_enemy") / 100;
  // Bond-of-Life as a damage/heal MULTIPLIER factor (her FeatureMultiplierBondOfLife reads
  // `bond_of_life` via makeStatItem) — emitted as a FRACTION, mirroring her `Stats.processPercent`
  // which folds the percent stat /100 before the compiled fn runs (`bond_of_life ∈ isPercent`,
  // Stats.js:119-124): setting 50 → 0.5. This `out` fraction is read by `bondOfLifeFactor`
  // (Arlecchino masque, Clorinde heals) and the `subtractBoL` heal term. DISTINCT from the RAW
  // `bond_of_life` the bag carries for Clorinde's C4 post-effect (`fromStat:"bond_of_life"` reads
  // raw 50 with a compensating raw ratio/cap) — a different reader; do NOT unify (raw→out = 100×).
  // 0 for every base build (no source sets BoL → raw.isSet false → key absent), so the 58k
  // damage goldens are byte-identical.
  if (raw.isSet("bond_of_life")) out["bond_of_life"] = raw.get("bond_of_life") / 100;
  // Royal-passive crit-rate stat — emitted VERBATIM (RAW, NOT /100) for the
  // Royal-weapon series' average-crit transform (cRoyalCritRate). Her
  // `makeStatItem('royal_crit_rate')` reads `stats.royal_crit_rate` directly, and
  // `isPercent('royal_crit_rate')` is FALSE (it starts `royal_`, not `crit_`), so
  // `processPercent` never divides it — the value stays raw (8 at R1, 16 at R5).
  // Gated on the Royal toggle so this is a no-op for every non-royal build (the
  // base golden suite never sets `weapon_royal_avg_crit_rate` → key never emitted).
  // Source: raw/.../Feature2/Damage.js:298-300, .../Compile/Helpers.js makeStatItem,
  //         raw/.../classes/Stats.js isPercent (no `royal_` branch).
  if (settings["weapon_royal_avg_crit_rate"] && raw.isSet("royal_crit_rate")) {
    out["royal_crit_rate"] = raw.get("royal_crit_rate");
  }

  // Feature-declared bonus keys (her FeatureDamage critRateBonuses /
  // critDamageBonuses / damageBonuses) — char-specific percent stats like Amber's
  // `crit_rate_amber` or C2's `dmg_skill_amber`. compileFeature sums each into the
  // matching term, so emit every referenced key present in the bag as a FRACTION
  // (all are percent stats). Absent → unset (engine reads 0). This stays in the
  // explicit-emit spirit: only keys the character's features actually reference.
  for (const key of collectFeatureBonusKeys(input.char.features)) {
    if (!raw.isSet(key)) continue;
    out[key] = raw.get(key) / 100;
  }

  // Heal-bonus stats (her FeatureHeal.getStatsHealBonus → healing/healing_base/healing_recv),
  // read DIRECTLY (makeStatItem, not a base+flat total) and summed in the heal's
  // CMultiplierBonus. `healing_base` is the ascension healing-bonus secondary from charTables;
  // all three are percent stats → emit as FRACTIONS. Read ONLY by compileOutput's heal path →
  // base-inert for the damage goldens (P3.5.3 — see HEAL_BONUS_KEYS doc).
  for (const key of HEAL_BONUS_KEYS) {
    if (raw.isSet(key)) out[key] = raw.get(key) / 100;
  }

  // Reaction-RATE scaling keys the reaction factories read inside their
  // `(1 + Σ scaling)` rate term — Ineffa's `lunarcharged_multi`. In her engine
  // this is produced by a post-effect (PostEffectStatsAtk on a percent stat),
  // which already folds the isPercent /100 — so it lands in the bag as a FRACTION
  // and is read out as-is (no further /100). Absent → unset (engine reads 0,
  // cStat default). The reaction-DMG-bonus key `dmg_reaction_lunarcharged` is
  // condition-sourced (raw percent) and lives in REACTION_BONUS_PERCENT_KEYS — it
  // is /100'd below. (Raw: db/Char/Ineffa.js lunarPost, PostEffect/Stats.js getTree.)
  for (const key of REACTION_DERIVED_KEYS) {
    if (raw.isSet(key)) out[key] = raw.get(key);
  }

  // Raw-bag scaling inputs that a NON-`*` multiplier scaling reads VERBATIM via
  // `cStat(key)` (her `makeStatItem(scaling)` → `stats.get(scaling)`, no `_total`,
  // no `/100`). These are flat numeric INPUTS injected by a ConditionNumber, not
  // percent stats. The only v5.8 source is Song of Days Past 4pc (team): its global
  // ConditionNumber `party_days_past_healing_recorded` adds the recorded healing
  // (≤15000) to the bag, and the CHARACTER_MULTIPLIERS team multiplier scales `8% ×`
  // that value into each matching feature's base term. Absent (no party / toggle off)
  // → the ConditionNumber is inactive → key never set → not emitted → the multiplier
  // reads 0 and the base golden suite is byte-untouched.
  for (const key of RAW_BAG_SCALING_KEYS) {
    if (raw.isSet(key)) out[key] = raw.get(key);
  }

  // Condition-contributed per-reaction DMG bonuses (e.g. CrimsonWitch 4pc, and
  // `dmg_reaction_lunarcharged` from FracturedHalo / ThunderingFury) → fractions.
  // These arrive RAW (percent) from the condition loop, so divide by 100 here
  // (unlike the pre-divided rate-scaling REACTION_DERIVED_KEYS above). Absent →
  // unset (engine reads 0). No-op for every build that contributes no
  // `dmg_reaction_*` (the base suite is untouched).
  for (const key of REACTION_BONUS_PERCENT_KEYS) {
    if (raw.isSet(key)) out[key] = raw.get(key) / 100;
  }

  // Condition-contributed reaction CRIT (Nahida C2 makes burning/bloom crittable;
  // Mizuki C6+dreamdrifter makes swirl crittable) → fractions. Read by
  // cTransformativeDamage's reaction-specific crit keys; absent → unset (engine reads 0)
  // so every non-crit reaction and every char without the grant is unchanged
  // (crit === normal === avg). crit_*_swirl is sourced ONLY by Mizuki's C6 ConditionStatic
  // (raw Mizuki.js:402-416) → base-inert for every other build.
  for (const key of [
    "crit_rate_burning", "crit_dmg_burning",
    "crit_rate_bloom", "crit_dmg_bloom",
    "crit_rate_swirl", "crit_dmg_swirl",
  ]) {
    if (raw.isSet(key)) out[key] = raw.get(key) / 100;
  }

  // Enemy resistance (percent) → enemy_res_<element> fractions. Fold any
  // char-contributed shred from the stats bag into the base enemy resistance
  // (the shred is a RAW negative percent, e.g. Escoffier's A4 `enemy_res_cryo`/
  // `enemy_res_hydro` = -5 at solo → -0.05 each; her `getBuildData` adds the
  // shredding condition's stats into the same bag the resistance is read from).
  // `raw.get` is 0 for any element no char shreds, so this is a no-op for every
  // non-shredder. The engine reads ONLY these emitted fractions; the negative
  // shred lowers `r` and `cMultiplierResistance` reads it directly.
  for (const el of ELEMENTS) {
    const base = resistanceFraction(input.enemy.resistance, el);
    out[`enemy_res_${el}`] = base + raw.get(`enemy_res_${el}`) / 100;
  }

  // DEF-ignore / DEF-reduce (source-local + team-wide), default 0, as fractions.
  out["enemy_def_ignore"] = raw.get("enemy_def_ignore") / 100;
  // Per-damage-type DEF-ignore — her getStatsDefIgnore sums the base key plus a
  // per-type `enemy_def_ignore_<type>` (Damage.js:128-137). 0 for every base build;
  // constellation-gated sources (Raiden C2 burst, Yae Miko C6 skill) land here as
  // fractions and compileFeature passes the matching key to cMultiplierDefence.
  for (const t of ["normal", "charged", "plunge", "skill", "burst"]) {
    out[`enemy_def_ignore_${t}`] = raw.get(`enemy_def_ignore_${t}`) / 100;
  }
  out["enemy_def_reduce"] = raw.get("enemy_def_reduce") / 100;

  const stats = out as BuildStats;
  const context: DamageContext = {
    stats,
    enemy: { level: input.enemy.level, resistance: {} },
    characterLevel: input.levels.charLevel,
  };

  return {
    stats,
    context,
    settings: merged,
    characterMultipliers: [...CHARACTER_MULTIPLIERS, ...partyBuffs.multipliers],
  };
}
