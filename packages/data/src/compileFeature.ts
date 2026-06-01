/**
 * compileFeature — the feature→damage-tree resolution glue.
 *
 * Turns a declarative `Feature` into an executable `DamageBlock` by composing
 * the pure `@genshin/core` block factories. This is the resolution layer P1.5
 * deferred: feature→tree resolution needs character data (talent tables, the
 * infused element, the build's talent levels), and `core` may not import
 * `@genshin/data` (engine-purity invariant). So it lives here.
 *
 * Mirrors her FeatureDamage.getTree (raw/.../Feature2/Damage.js):
 *   items = [
 *     CBaseDamage( Σ talent% × scalingStat ),   // per multiplier
 *     CMultiplierBonus( dmg_all + dmg_<elem> + dmg_<type> ),
 *     CMultiplierResistance( enemy_res_<elem> ),
 *     CMultiplierDefence(),                       // attacker vs enemy level
 *   ]
 *   CDamage(items, { critRate, critDmg })
 *
 * Talent%: her FeatureMultiplier.getValue = values.getValue(talentLevel)/100
 * (a fraction). Scaling stat: her default `atk*` → the aggregated `atk_total`
 * (buildStats supplies the `*_total` keys). Crit: the aggregated `crit_rate_total`
 * / `crit_dmg_total` fractions (buildStats already folds the per-element/-type
 * crit keys into the totals).
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/classes/Feature2/Damage.js (getTree, getStatsDmgBonus, getElement)
 *   raw/genshin_calc_pub/src/js/classes/Feature2/Multiplier.js (getValue, getTree, scaling 'atk*')
 *   raw/genshin_calc_pub/src/js/classes/Feature2/Damage/Normal.js (allowInfusion, damageType)
 *   wiki/architecture/feature2-engine.md, wiki/concepts/damage-formula.md
 */

import {
  cBaseDamage,
  cConst,
  cCritDmg,
  cCritRate,
  cDamage,
  cDivide,
  cLunarChargedDamage,
  cMulti,
  cMultiplierBonus,
  cMultiplierDefence,
  cMultiplierReaction,
  cMultiplierResistance,
  cStat,
  cSum,
  cTransformativeDamage,
  evaluate,
  type Block,
  type DamageBlock,
} from "@genshin/core";
import type {
  CharMultiplier,
  Element,
  EvalContext,
  Feature,
  FeatureMultiplierEntry,
  FeatureReaction,
} from "@genshin/types";

/** Maps a multiplier's `leveling` key to the talent-level slot it reads. */
const LEVELING_TO_SLOT: Readonly<Record<string, keyof TalentLevels>> = {
  char_skill_attack: "attack",
  char_skill_elemental: "elemental",
  char_skill_burst: "burst",
};

/** Talent levels for a build (1-indexed game talent levels). */
export interface TalentLevels {
  readonly attack: number;
  readonly elemental: number;
  readonly burst: number;
}

/**
 * The character/build context compileFeature needs beyond the Feature itself:
 * the innate element, the build's talent levels, and the settings (for infusion
 * resolution on normal attacks). Reaction routing (P1.6 factories) keys off
 * `settings.reaction`; this task compiles the non-reacted path.
 */
export interface CompileContext {
  /** The character's innate element (skills/bursts use it directly). */
  readonly charElement: Element;
  readonly talentLevels: TalentLevels;
  /** Immutable settings (attack_infusion, etc.). */
  readonly settings: EvalContext;
  /**
   * Triggering character level (1–90). REQUIRED for standalone reaction features
   * (Lunar-Charged), whose level multiplier is baked at compile time. The
   * normal-hit path reads attacker level from the eval-time `DamageContext`
   * instead, so it does not need this field.
   */
  readonly charLevel?: number;
  /**
   * Char-level ("targeted") multipliers — her `char.multipliers`. Each is summed
   * into the base-damage term of EVERY feature whose damage type matches the
   * entry's `target.damageTypes`, gated by `evaluate(condition)` (absent = always
   * on). Mirrors her `Feature2.getMultipliers` merging `data.multipliers` into each
   * feature (Feature2.js:121-125). Absent/empty = no char-level multipliers.
   */
  readonly charMultipliers?: readonly CharMultiplier[];
}

/**
 * The DMG-bonus element-key short form. Her keys use `phys` for physical
 * (`dmg_phys`); every other element matches its name. Resistance keys, by
 * contrast, use the full element name the buildStats bag emits
 * (`enemy_res_physical`), so the two are kept distinct on purpose.
 */
function dmgElementKey(element: Element): string {
  return element === "physical" ? "phys" : element;
}

/**
 * Resolve a normal/charged/plunge attack's element, honouring infusion.
 *
 * Ports FeatureDamage.getElement + getInfusionElement: a feature that allows
 * infusion and is otherwise physical takes `settings.attack_infusion` when set.
 * Skills/bursts carry an explicit element on the Feature.
 */
function resolveElement(feature: Feature, ctx: CompileContext): Element {
  if (feature.element !== undefined) return feature.element;

  // Attacks (no explicit element) are physical unless infused.
  const allowInfusion = feature.category === "attack" || feature.category === "plunge";
  if (allowInfusion) {
    const infusion = ctx.settings["attack_infusion"];
    if (typeof infusion === "string") return infusion as Element;
    return "physical";
  }
  return ctx.charElement;
}

/**
 * Map a feature to her damageType for the DMG-bonus / RES keys.
 *
 * If the Feature carries an explicit `damageType` field, it takes precedence
 * (needed for charged attacks: category="attack" but damageType="charged" so
 * the `dmg_charged` bonus is applied correctly).
 */
function damageTypeOf(feature: Feature): string {
  if (feature.damageType !== undefined) return feature.damageType;
  switch (feature.category) {
    case "attack":
      return "normal";
    case "skill":
      return "skill";
    case "burst":
      return "burst";
    case "plunge":
      return "plunge";
    default:
      return "";
  }
}

/**
 * Resolve the talent-level `_bonus` offset for a leveling key from the settings.
 *
 * Her `Feature.getTalentLevel` adds `settings[<key>_bonus] + settings[<key>_bonus_2]`
 * on top of the base talent level (raw Feature.js:235-244), reached on the damage path
 * via `FeatureMultiplier.getLevel → settings.getLevel(leveling)` (Multiplier.js:149).
 * Constellations contribute these through condition `.settings` (Hu Tao C3 →
 * `char_skill_elemental_bonus: 3`, C5 → `char_skill_burst_bonus: 3`), which `buildStats`
 * propagates into the compile settings. Returns 0 for a constant multiplier
 * (`leveling: ""`) or when no `_bonus` key is set — inert for every base build.
 */
function skillLevelBonus(settings: EvalContext, leveling: string): number {
  if (!leveling) return 0;
  const b1 = settings[`${leveling}_bonus`];
  const b2 = settings[`${leveling}_bonus_2`];
  return (typeof b1 === "number" ? b1 : 0) + (typeof b2 === "number" ? b2 : 0);
}

/** Build the base-damage term for one multiplier: talent% × scalingStatTotal. */
function baseDamageTerm(
  entry: FeatureMultiplierEntry,
  ctx: CompileContext
): Block {
  const slot = LEVELING_TO_SLOT[entry.leveling];
  const baseLevel = slot !== undefined ? ctx.talentLevels[slot] : 1;
  // Talent-level bumps (constellation C3/C5) are condition-contributed
  // `<leveling>_bonus` settings added on top of the base level — her
  // Feature.getTalentLevel (Feature.js:235-244). Inert when no `_bonus` key is set.
  const talentLevel = baseLevel + skillLevelBonus(ctx.settings, entry.leveling);
  // her getValue: values.getValue(level)/100 → a fraction. The optional numeric
  // `scalingMultiplier` is the flat extra factor on the base term (her
  // getTreeBonusMultiplier CConst — "bonus hit = X% of a base hit", e.g. Amber C1's
  // second arrow at 0.20). Absent = ×1.
  // `scalingOffset` adds a settings-driven additive offset to the scaling factor —
  // faithful to FurinaSkill.getScalingMultiplier: `result += perStack × min(maxStacks, stacks)`.
  // Absent or 0 stacks → offset 0 → no change.
  let scalingFactor = entry.scalingMultiplier ?? 1;
  if (entry.scalingOffset !== undefined) {
    const raw = ctx.settings[entry.scalingOffset.setting];
    const stacks = typeof raw === "number" ? raw : 0;
    scalingFactor += entry.scalingOffset.perStack * Math.min(entry.scalingOffset.maxStacks, stacks);
  }
  const talentPercent = (entry.values.getValue(talentLevel) / 100) * scalingFactor;

  // Scaling stat: default 'atk' total. The `*` in her 'atk*' means "use total";
  // buildStats supplies `<stat>_total`. Strip any trailing '*' the data carries.
  const scaling = (entry.scaling ?? "atk").replace("*", "");
  const scalingKey = `${scaling}_total`;

  return cMulti([cConst(talentPercent), cStat(scalingKey)]);
}

/**
 * Select the char-level ("targeted") multipliers that apply to this feature:
 * those whose `target.damageTypes` includes the feature's resolved damage type
 * AND whose gate is active (`evaluate(condition)`; an absent condition is
 * always-on, per her `FeatureMultiplier.isActive`).
 *
 * Faithful to her `Feature2.getMultipliers` second loop (Feature2.js:121-125):
 * `for (item of data.multipliers) if (item.isActive(data) && item.isMatchFeature(this, data)) push`.
 * The matched entries' base terms are summed into the SAME `cBaseDamage` as the
 * feature's own multipliers (Damage.js:271-276) — a base term, not a separate factor.
 */
function activeCharMultipliers(
  feature: Feature,
  damageType: string,
  ctx: CompileContext
): readonly CharMultiplier[] {
  const all = ctx.charMultipliers;
  if (!all || all.length === 0) return [];
  return all.filter((m) => {
    if (!m.target.damageTypes.includes(damageType)) return false; // isMatchFeature
    return m.condition === undefined || evaluate(m.condition, ctx.settings); // isActive
  });
}

/**
 * Filter a feature's OWN multipliers to the active ones: those with no `condition`,
 * plus those whose `condition` evaluates true. Faithful to her
 * `FeatureMultiplier.isActive` (Multiplier.js), which honours the condition at the
 * per-feature level just as it does for char-level multipliers — e.g. Fischl C2:
 * `skill_dmg` carries a SECOND multiplier (`ValueTable([C2SkillDmg])`) gated by
 * `ConditionConstellation(2)` (Fischl.js:256-260), so the +200% ATK applies only at
 * C≥2. Inert for every base feature (none set a per-feature multiplier condition) →
 * the base golden is untouched.
 */
function activeOwnMultipliers(
  multipliers: readonly FeatureMultiplierEntry[],
  ctx: CompileContext
): readonly FeatureMultiplierEntry[] {
  return multipliers.filter(
    (m) => m.condition === undefined || evaluate(m.condition, ctx.settings)
  );
}

/**
 * Collect the DMG% bonus stat keys for a hit (additive inside cMultiplierBonus):
 * `dmg_all`, `dmg_<element>`, `dmg_<damageType>`, plus any feature-declared
 * `damageBonuses`. Absent keys read as 0. Mirrors her getStatsDmgBonus
 * (Damage.js:51-66): the generic set, then `this.damageBonuses` concatenated.
 */
function dmgBonusKeys(
  feature: Feature,
  element: Element,
  damageType: string
): readonly string[] {
  const keys = ["dmg_all", `dmg_${dmgElementKey(element)}`];
  if (damageType) keys.push(`dmg_${damageType}`);
  if (feature.damageBonuses) keys.push(...feature.damageBonuses);
  return keys;
}

/**
 * Per-type CRIT keys for a hit, folded generically (type only):
 * `crit_<which>_<damageType>` when the hit has a damage type. Mirrors her
 * getDefaultStatsCritRate / getDefaultStatsCritDamage (Damage.js:72-122), which
 * push `crit_rate_<damageType>` / `crit_dmg_<damageType>` for the hit's type —
 * exactly as getStatsDmgBonus pushes `dmg_<damageType>`. This lets a WEAPON/
 * SET/cons-sourced type-crit (e.g. The Catch's always-on `crit_rate_burst`)
 * reach every burst hit without the feature pre-declaring the key. Absent keys
 * read 0 (cStat default) → base-safe. ELEMENT crit (`crit_*_<element>`) and the
 * combined `crit_*_<element>_<type>` are deliberately NOT folded here (deferred);
 * char-specific suffixed keys stay on `feature.critRateBonuses` (not generic).
 */
function critBonusTypeKeys(which: "rate" | "dmg", damageType: string): readonly string[] {
  return damageType ? [`crit_${which}_${damageType}`] : [];
}

/**
 * Lunar-Charged EM bonus term: `6 × mastery / (mastery + 2000)`.
 *
 * The watershed coefficient is 6 (vs transformative's 16). Ported from
 * `LunarCharged.js:7-18`; mirrors `cLunarChargedEmBonus` in `@genshin/core`
 * but returned as a plain `Block` term so it composes inside `cMultiplierReaction`.
 */
function lunarEmBonusTerm(): Block {
  const em = cStat("mastery");
  return cDivide([cMulti([cConst(6), em]), cSum([em, cConst(2000)])]);
}

/**
 * Compile a standalone reaction feature (currently the crit-bearing Lunar-Charged
 * family) into a `DamageBlock`.
 *
 * Two shapes, both faithful to her `Reaction/Transformative/Lunar/*`:
 *   - `lunarcharged` (rate-based): routes to `@genshin/core`'s `cLunarChargedDamage`
 *     factory — `1.8 × (1 + Σ scaling) × levelMult × (1 + emBonus + Σ reactionBonus)
 *     × res`, crit via the supplied crit keys. (Her `Lunar/Charged.js`.)
 *   - `lunardirect` (base-scaled): the base is the feature's own multipliers
 *     (`Σ talent% × scalingStat`, e.g. A1 65% × ATK) scaled by `(1 + Σ scaling)`,
 *     then her `ChargedLike` flat amplifying factor (`amplifyingMultiplier`, ×3).
 *     Shares the same `(1 + emBonus + Σ reactionBonus) × res × crit` tail.
 *     (Her `Lunar/ChargedLike.js`.)
 */
function compileReaction(
  feature: Feature,
  reaction: FeatureReaction,
  ctx: CompileContext
): DamageBlock {
  // Crit hook is generic (Lunar-Charged is crit-bearing): omit keys → non-crit.
  const critRate = reaction.critRateKeys ?? [];
  const critDmg = reaction.critDmgKeys ?? [];
  const critOpts = {
    ...(critRate.length > 0 ? { critRate: cCritRate(critRate.map((k) => cStat(k))) } : {}),
    ...(critDmg.length > 0 ? { critDmg: cCritDmg(critDmg.map((k) => cStat(k))) } : {}),
  };

  if (ctx.charLevel === undefined) {
    throw new Error(
      `compileReaction: feature '${feature.name}' is a reaction but ctx.charLevel is unset (the level multiplier needs it)`
    );
  }

  // Standard transformative reaction (Overload, Superconduct, …): route to the
  // P1.6 core factory. reactionMultiplier is her getReactionRate(); levelMult is
  // baked from charLevel; EM + reaction-DMG bonuses read at eval time. Non-crit.
  if (reaction.variant === "transformative") {
    if (reaction.reactionMultiplier === undefined) {
      throw new Error(
        `compileReaction: transformative feature '${feature.name}' is missing reactionMultiplier`
      );
    }
    return cTransformativeDamage({
      reactionMultiplier: reaction.reactionMultiplier,
      element: reaction.element,
      characterLevel: ctx.charLevel,
      ...(reaction.reactionBonusKeys ? { reactionBonusKeys: reaction.reactionBonusKeys } : {}),
      // Reaction-specific crit (Nahida C2 makes burning/bloom crittable); 0/absent
      // for every other char → crit === normal === avg, unchanged.
      ...(critRate.length > 0 ? { critRateKeys: critRate } : {}),
      ...(critDmg.length > 0 ? { critDmgKeys: critDmg } : {}),
    });
  }

  if (reaction.variant === "lunarcharged") {
    return cLunarChargedDamage({
      element: reaction.element,
      characterLevel: ctx.charLevel,
      ...(reaction.scalingStatKeys ? { scalingStatKeys: reaction.scalingStatKeys } : {}),
      ...(reaction.reactionBonusKeys ? { reactionBonusKeys: reaction.reactionBonusKeys } : {}),
      ...(critRate.length > 0 ? { critRateKeys: critRate } : {}),
      ...(critDmg.length > 0 ? { critDmgKeys: critDmg } : {}),
      ...(reaction.penalty !== undefined ? { penalty: reaction.penalty } : {}),
    });
  }

  // lunardirect: base = (Σ talent% × scalingStat) × (1 + Σ scaling), then the
  // ChargedLike amplifying factor, then the shared (1 + emBonus + Σ) × res tail.
  const multipliers: readonly FeatureMultiplierEntry[] =
    feature.multipliers ?? (feature.items ?? []).flatMap((item) => item.multipliers);
  const baseTerms = activeOwnMultipliers(multipliers, ctx).map((m) => baseDamageTerm(m, ctx));
  const base: Block = cBaseDamage(baseTerms);

  const factors: Block[] = [base];
  if (reaction.scalingStatKeys && reaction.scalingStatKeys.length > 0) {
    // (1 + Σ scaling) — her FeatureMultiplier.getTreeBonusMultiplier (CSumPlusOne).
    factors.push(cMultiplierReaction(reaction.scalingStatKeys.map((k) => cStat(k))));
  }

  // (1 + emBonus + Σ reactionBonus) — the shared lunar reaction factor.
  const reactionBonusTerms: Block[] = reaction.reactionBonusKeys?.map((k) => cStat(k)) ?? [];
  factors.push(cMultiplierReaction([lunarEmBonusTerm(), ...reactionBonusTerms]));

  // ChargedLike flat amplifying factor (×3); CMultiplierAmplifying([3%]) → bare 3.
  if (reaction.amplifyingMultiplier !== undefined && reaction.amplifyingMultiplier !== 1) {
    factors.push(cConst(reaction.amplifyingMultiplier));
  }

  // resMultiplier(element).
  factors.push(cMultiplierResistance(reaction.element));

  return cDamage({ items: factors, ...critOpts });
}

/**
 * Compile a `Feature` into an executable `DamageBlock`.
 *
 * The returned block is a CDamage root; pass it to `compile(block)` for the
 * `(ctx) => DamageResult` closure. A feature carrying a `reaction` descriptor is
 * a standalone reaction instance (Lunar-Charged) and routes to the P1.6 reaction
 * factory via `compileReaction`; everything else compiles the normal-hit tree.
 * (Amplifying vaporize/melt — a `settings.reaction` toggle on a normal hit — is a
 * separate mechanism handled at the normal-hit level and is out of scope here.)
 */
export function compileFeature(
  feature: Feature,
  ctx: CompileContext
): DamageBlock {
  if (feature.reaction !== undefined) {
    return compileReaction(feature, feature.reaction, ctx);
  }

  const element = resolveElement(feature, ctx);
  const damageType = damageTypeOf(feature);

  // Base damage = Σ over the feature's own multipliers (multihit `items` flatten
  // in) PLUS the active char-level multipliers targeting this damage type — her
  // getMultipliers merges both into one CBaseDamage (e.g. Itto A4's 0.35×DEF on
  // every charged hit). They are base terms, not separate multiplicative factors.
  const multipliers: readonly FeatureMultiplierEntry[] =
    feature.multipliers ??
    (feature.items ?? []).flatMap((item) => item.multipliers);
  const baseTerms = [
    ...activeOwnMultipliers(multipliers, ctx),
    ...activeCharMultipliers(feature, damageType, ctx),
  ].map((m) => baseDamageTerm(m, ctx));

  // DEF-ignore: the generic key plus this feature's per-type key
  // (`enemy_def_ignore_<type>`), summed inside cMultiplierDefence — her
  // getStatsDefIgnore. Per-type is 0 for every base build (Raiden C2 burst /
  // Yae Miko C6 skill are the constellation-gated sources). Exclude the no-type
  // hits (`""`/`"none"`) exactly as her guard does (`damageType && damageType != 'none'`).
  const defIgnoreKeys =
    damageType !== "" && damageType !== "none"
      ? ["enemy_def_ignore", `enemy_def_ignore_${damageType}`]
      : ["enemy_def_ignore"];
  const items: Block[] = [
    cBaseDamage(baseTerms),
    cMultiplierBonus(dmgBonusKeys(feature, element, damageType).map((k) => cStat(k))),
    cMultiplierResistance(element),
    cMultiplierDefence("enemy_def_reduce", defIgnoreKeys),
  ];

  // Crit: the aggregated totals (buildStats folds crit_rate/_dmg in), PLUS the
  // generic per-TYPE crit keys (`crit_*_<damageType>`, folded here exactly as
  // `dmg_<damageType>` is in dmgBonusKeys — so a weapon/set/cons-sourced type-crit
  // like The Catch's `crit_rate_burst` reaches every burst hit), PLUS any
  // feature-declared crit bonus keys (char-specific suffixed keys + element crit,
  // not yet generically folded). Mirrors her getDefaultStatsCritRate /
  // getDefaultStatsCritDamage (Damage.js:72-122): generic set (incl. the per-type
  // push), then `this.critRateBonuses` / `this.critDamageBonuses` concatenated.
  const critRate = cCritRate([
    cStat("crit_rate_total"),
    ...critBonusTypeKeys("rate", damageType).map((k) => cStat(k)),
    ...(feature.critRateBonuses ?? []).map((k) => cStat(k)),
  ]);
  const critDmg = cCritDmg([
    cStat("crit_dmg_total"),
    ...critBonusTypeKeys("dmg", damageType).map((k) => cStat(k)),
    ...(feature.critDamageBonuses ?? []).map((k) => cStat(k)),
  ]);

  return cDamage({ items, critRate, critDmg });
}
