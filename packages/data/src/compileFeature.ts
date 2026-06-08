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
 *   wiki/tools/calculator/feature2-engine.md, wiki/game/mechanics/damage-formula.md
 */

import {
  AmplifyingVariant,
  cAmplifyingFactor,
  cBaseDamage,
  cConst,
  cCritDmg,
  cCritRate,
  cRoyalCritRate,
  cDamage,
  cDivide,
  cFloor,
  cLunarChargedDamage,
  cMax,
  cMin,
  cMulti,
  cSubtract,
  cMultiplierBonus,
  cMultiplierDefence,
  cMultiplierReaction,
  cMultiplierResistance,
  cStat,
  cSum,
  cTransformativeDamage,
  REACTION_LEVEL_MULTIPLIERS,
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
  FeatureOutput,
  FeatureReaction,
} from "@genshin/types";
import { reactionShieldValues } from "./generated/elementScale.js";

/** Maps a multiplier's `leveling` key to the talent-level slot it reads. */
const LEVELING_TO_SLOT: Readonly<Record<string, keyof TalentLevels>> = {
  char_skill_attack: "attack",
  char_skill_elemental: "elemental",
  char_skill_burst: "burst",
};

/**
 * Multiplier scaling keys that resolve to `<stat>_total` (her makeStatTotalItem); every
 * other scaling key reads the raw bag verbatim (makeStatItem). Module-scope: allocated once,
 * not per `baseDamageTerm` call (hot path across the armory loop).
 */
const TOTAL_SCALING_STATS: ReadonlySet<string> = new Set(["atk", "hp", "def", "mastery"]);

/**
 * Amplifying-reaction variant policy: `${settings.reaction}_${hitElement}` → the
 * Vaporize/Melt direction. Mirrors her `REACTION_MULTI` (raw/.../Feature2/Damage.js:13-18)
 * exactly: hydro/cryo hits have one direction; pyro hits depend on the chosen reaction;
 * every other element has no entry (→ un-amplified). The core owns the math
 * (`cAmplifyingFactor`); the data layer owns this settings→variant policy, matching her
 * layering (REACTION_MULTI lives in her feature layer).
 */
const AMPLIFYING_VARIANT: Readonly<Record<string, AmplifyingVariant>> = {
  vaporize_hydro: AmplifyingVariant.VaporizeForward, // Hydro onto Pyro aura, ×2.0
  vaporize_pyro: AmplifyingVariant.VaporizeReverse, // Pyro onto Hydro aura, ×1.5
  melt_cryo: AmplifyingVariant.MeltReverse, // Cryo onto Pyro aura, ×1.5
  melt_pyro: AmplifyingVariant.MeltForward, // Pyro onto Cryo aura, ×2.0
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
  /**
   * WEAPON/SET-sourced features folded into the compile loop alongside `char.features`
   * — a weapon's `DbObjectWeapon.features` (Aquila's ATK%-physical proc) + an equipped
   * set's `DbObjectArtifactSet.features` (Ocean-Hued Clam's Foam), concatenated by the
   * caller (the armory harness). Each compiles through the SAME `compileFeature` path as
   * a char feature (its scaling reads the wielder's `*_total` stats, already in the
   * build) and is subject to the same `feature.condition` produce-gate. Mirrors her
   * `CalcSet.getFeaturesHash`, which concats features from every equipped object.
   * Absent/empty = char features only (the base build → C0 golden untouched).
   */
  readonly extraFeatures?: readonly Feature[];
  /**
   * WEAPON/SET-sourced CHAR-LEVEL ("targeted") multipliers merged into the active
   * char-level multiplier list — a weapon's `DbObjectWeapon.multipliers` (Redhorn's
   * `def*` into normal/charged) + an equipped set's `DbObjectArtifactSet.multipliers`
   * (Echoes' normal-DMG variant), concatenated by the caller. Each injects into every
   * matching feature's base term gated by its own `target` + `condition`, exactly as
   * `char.multipliers` do — her `Feature2.getMultipliers` iterates `data.multipliers`,
   * which she populates from every equipped object's contributions. Absent/empty = char
   * multipliers only.
   */
  readonly extraMultipliers?: readonly CharMultiplier[];
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

/**
 * Resolve a multiplier scaling/coefficient stat key to the bag key it reads.
 * The four total stats (atk/hp/def/mastery) map to `<stat>_total` (the aggregate
 * buildStats emits); any other key reads the raw bag verbatim. Shared by the base
 * term's `scaling` and the coefficient's `stat` so both honour the same convention.
 */
function resolveStatKey(stat: string): string {
  const bare = stat.replace("*", "");
  return TOTAL_SCALING_STATS.has(bare) ? `${bare}_total` : bare;
}

/**
 * The M1 stat-derived coefficient as a RUNTIME subtree: `min( f(getTotal(stat)), cap )`,
 * where `f` is `stat × ratio` (sayu C6) or `floor(stat / divisor)` (kirara C1).
 *
 * Built from `cStat(<stat>_total)` so it reads the LIVE build total at eval time — the
 * stat bag is not in the CompileContext (it materialises only in the eval-time
 * `DamageContext`), so the coefficient is composed where every other stat-dependent
 * factor is. floor THEN cap (the `cMin` wraps the floored value — kirara hp=45000 →
 * floor 5 → cap 4, NOT floor of the min). Ports her FeatureMultiplierSayuBurst /
 * FeatureMultiplierKiraraBurst getScalingMultiplier (`CMin([CMul/CFloor, CConst(cap)])`).
 */
function coefficientBlock(
  spec: NonNullable<FeatureMultiplierEntry["coefficientFromStat"]>
): Block {
  const total = cStat(resolveStatKey(spec.stat));
  const raw =
    spec.divisor !== undefined
      ? cFloor(cDivide([total, cConst(spec.divisor)]))
      : cMulti([total, cConst(spec.ratio ?? 1)]);
  return cMin([raw, cConst(spec.cap)]);
}

/**
 * Catalyze EM curve: `5 × mastery_total / (mastery_total + 1200)`.
 *
 * Her `FeatureMultiplierReactionQuicken.getMasteryMultiplier` (Quicken.js:21-33):
 * `CMulti([5, CDivide([masteryTotal, CSum([masteryTotal, 1200])])])`, using
 * `makeStatTotalItem('mastery')` → the aggregate `mastery_total`. Mirrors
 * `lunarEmBonusTerm`, but the catalyze coefficient is 5 (not 6) over (EM + 1200)
 * (not + 2000), and reads the TOTAL (not the raw `mastery`).
 */
function catalyzeEmCurve(): Block {
  const em = cStat("mastery_total");
  return cDivide([cMulti([cConst(5), em]), cSum([em, cConst(1200)])]);
}

/** Build the base-damage term for one multiplier: talent% × scalingStatTotal. */
function baseDamageTerm(
  entry: FeatureMultiplierEntry,
  ctx: CompileContext
): Block {
  // Catalyze (Spread/Aggravate) term — present ONLY on the two global catalyze
  // multipliers. This is NOT a talent% × scalingStat product; it is her
  // `FeatureMultiplierReactionQuicken.getTree` (Quicken.js:73-83):
  //   prefactor × REACTION_LEVEL_MULTIPLIERS[charLevel-1]
  //             × (1 + 5·EM/(EM+1200) + Σ dmg_reaction_*)
  // summed into cBaseDamage BEFORE dmg%/crit/res/def (so it inherits the hit's
  // crit/DMG%/res/def). prefactor is her getReactionMultiplier (Spread 1.25 /
  // Aggravate 1.15); the level multiplier is her getBaseValue =
  // `reactionDamageValues.getValue(char_level)` (1-indexed → `[charLevel-1]`). The
  // bonus keys are PLAIN bag reads (her getReactionBonuses → makeStatItem, not _total).
  // Routed first so none of the scaling/talent machinery below applies. Base-inert:
  // no existing entry sets `catalyze` ⇒ the 58k damage goldens are byte-identical.
  if (entry.catalyze !== undefined) {
    if (ctx.charLevel === undefined) {
      throw new Error(
        `baseDamageTerm: catalyze multiplier needs ctx.charLevel (the reaction level table lookup)`
      );
    }
    const levelMult = REACTION_LEVEL_MULTIPLIERS[ctx.charLevel - 1]!;
    return cMulti([
      cConst(entry.catalyze.prefactor),
      cConst(levelMult),
      cMultiplierReaction([
        catalyzeEmCurve(),
        ...entry.catalyze.bonusKeys.map((k) => cStat(k)),
      ]),
    ]);
  }
  // Resolve the base level her `FeatureMultiplier.getLevel` reads
  // (`settings.getLevel(leveling)` → `getSkillLevelByName`, Build/Settings.js:49-50:
  // `settings[name] || 1`). For the three char-skill slots that is the build's talent
  // level (carried on `ctx.talentLevels`); for any OTHER settings-driven leveling key
  // (`weapon_refine` for a weapon/set FeatureDamage proc — Aquila's AoE — leveled R1→R5)
  // it is `settings[leveling]`. A constant multiplier (`leveling: ""`) stays at 1.
  // Base-inert: every base/cons char feature uses a char-skill slot or "" → the
  // `settings[leveling]` branch is reached only by weapon/set features (none in the base
  // build), so the goldenConfig 1773 / constellations surface is untouched.
  const slot = LEVELING_TO_SLOT[entry.leveling];
  let baseLevel: number;
  if (slot !== undefined) {
    baseLevel = ctx.talentLevels[slot];
  } else if (entry.leveling) {
    const fromSettings = ctx.settings[entry.leveling];
    baseLevel = typeof fromSettings === "number" ? fromSettings : 1;
  } else {
    baseLevel = 1;
  }
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
  let talentPercent = (entry.values.getValue(talentLevel) / 100) * scalingFactor;
  // ADDITIVE bonus term keyed off a SEPARATE stacks level — her FeatureMultiplier.getValue
  // adds `bonusValues.getValue(getBonusLevel)/100` on top of the talent% fraction
  // (Multiplier.js:184-186), `getBonusLevel = settings.getLevel(bonusLeveling) || 1` (:168-169).
  // Her `getLevel` routes through getSkillLevelByName, which WOULD add `_bonus`/`_bonus_2`/
  // `_bonus_party` offsets (Settings.js:49-57) — but no such offset setting exists for the only
  // v5.8 bonusLeveling key, so it reduces to a plain settings read and our bare `ctx.settings[...]`
  // read is exact here. The sole user is Yun Jin's NA-DMG teammate multiplier
  // (`yunjin_traditionalist_stacks` → [2.5,5,7.5,11.5]). Both fields absent ⇒ no term added ⇒
  // base-inert (the 58k-golden / armory surface is byte-unchanged).
  if (entry.bonusLeveling !== undefined && entry.bonusValues !== undefined) {
    const bonusLevel = (ctx.settings[entry.bonusLeveling] as number | undefined) || 1;
    talentPercent += entry.bonusValues.getValue(bonusLevel) / 100;
  }

  // Scaling stat key. Two paths, faithful to her FeatureMultiplier.getTreeStatValue
  // (Multiplier.js:281-288 → makeStatItem vs makeStatTotalItem):
  //   - TOTAL scaling (`<stat>_total`): the base×(1+%)+flat aggregate buildStats emits.
  //     In OUR port the standard char/weapon/set multipliers carry the bare stat key
  //     (`scaling: "hp"`, `"def"`, `"atk"`, `"mastery"`) — or her `*` marker — and have
  //     always meant the total here, so the total path is keyed on that stat-set (the `*`
  //     is stripped first for the rare entry that carries it). This preserves every
  //     HP-/DEF-/ATK-/EM-scaling feature (Nilou, Sigewinne, Xilonen, Chiori, Kuki A4,
  //     Sethos, …) byte-for-byte: each maps to `<stat>_total`, exactly as before.
  //   - RAW-BAG scaling (`stats.get(scaling)` verbatim): a scaling key that is NOT one of
  //     the total stats reads the RAW value the bag carries under that exact key — her
  //     `makeStatItem(scaling)` with no `*`. The only v5.8 user is Song of Days Past's
  //     team multiplier, scaling `party_days_past_healing_recorded` (a ConditionNumber
  //     adds the recorded healing — 15000 — directly to the stats bag). Base-safe: the
  //     other non-total key any data file carries is `accumulated_healing` (Song of Days
  //     Past self-worn), absent from every build's bag → 0 either way; no base/cons/armory
  //     fixture exercises a non-total scaling that resolves nonzero, so this branch leaves
  //     goldenConfig / constellations / armory byte-unchanged.
  const scalingKey = resolveStatKey(entry.scaling ?? "atk");

  // M1 coefficient: a THIRD, mutually-exclusive factor beside scalingMultiplier /
  // scalingOffset (none co-occur on a coefficient term). When present, the term's
  // scaling factor is `min( f(getTotal(stat)), cap )` read at eval time, replacing
  // the build-coupled constant fold (sayu C6 30.2, kirara C1 scalingMultiplier 3).
  // Absent → the children are exactly [talentPercent, scalingStat] as before.
  if (entry.coefficientFromStat !== undefined) {
    // Fail loud: mutually exclusive with scalingMultiplier / scalingOffset (either would
    // double-count the coefficient — the convention is coefficientFromStat XOR scalar).
    if (entry.scalingMultiplier !== undefined || entry.scalingOffset !== undefined) {
      throw new Error(
        `baseDamageTerm: entry '${entry.source ?? "(unnamed)"}' sets coefficientFromStat ` +
        `alongside ${entry.scalingMultiplier !== undefined ? "scalingMultiplier" : "scalingOffset"} ` +
        `— these are mutually exclusive`
      );
    }
    // Fail loud: exactly one of ratio | divisor required (both or neither silently mis-computes).
    const hasRatio = entry.coefficientFromStat.ratio !== undefined;
    const hasDivisor = entry.coefficientFromStat.divisor !== undefined;
    if (hasRatio === hasDivisor) {
      throw new Error(
        `baseDamageTerm: entry '${entry.source ?? "(unnamed)"}' coefficientFromStat must set ` +
        `exactly one of ratio | divisor (got ${hasRatio && hasDivisor ? "both" : "neither"})`
      );
    }
  }
  const factors: Block[] = [cConst(talentPercent)];
  if (entry.coefficientFromStat !== undefined) {
    factors.push(coefficientBlock(entry.coefficientFromStat));
  }
  // Scaling factor = the (total or raw) stat read, OPTIONALLY floored at a threshold:
  // her FeatureMultiplier.getTreeStatValue wraps the BARE stat read (not the talent% and
  // not the coefficient) in `CMax([CSubtract([stat, exceedStatValue]), 0])` when
  // `exceedStatValue` is set (Multiplier.js:281-301) — i.e. `max(scalingStat − threshold, 0)`.
  // The sole v5.8 user is Sigewinne's teammate skill-DMG buff (max HP above 30000). Absent ⇒
  // the plain `cStat(scalingKey)`, byte-identical to before (no other multiplier sets it).
  let scalingStatBlock: Block = cStat(scalingKey);
  if (entry.exceedStatValue !== undefined) {
    scalingStatBlock = cMax([cSubtract([scalingStatBlock, cConst(entry.exceedStatValue)]), cConst(0)]);
  }
  factors.push(scalingStatBlock);
  // Bond-of-Life factor — her FeatureMultiplierBondOfLife.getTreeBonusMultiplier pushes
  // makeStatItem('bond_of_life') into the multiplier's CMulti (BondOfLife.js:9-11), so the
  // term becomes `talent% × scalingStat × bond_of_life`. `cStat("bond_of_life")` reads the
  // FRACTION buildStats emits (`raw/100`, e.g. 0.5 at setting 50) — the processPercent-folded
  // value, NOT the raw `bond_of_life` Clorinde's C4 post-effect reads. The two v5.8 users are
  // Arlecchino's masque + Clorinde's heals. Absent ⇒ no factor; and when set, `out` reads 0 for
  // every BoL-free build (all 58k goldens) → ×0 → the term vanishes (base-inert).
  if (entry.bondOfLifeFactor) {
    factors.push(cStat("bond_of_life"));
  }
  let term: Block = cMulti(factors);
  // Flat additive term from FeatureMultiplierList (her CConst(getValueFlat)):
  // `(levelMult × stat) + flat` — the flat component is talent-level-indexed and added
  // DIRECTLY (not scaled by any stat). Absent on every damage feature → base-inert.
  // Source: raw/.../Feature2/Multiplier/List.js:18-31 (getTree, CSum([CMulti, CConst])).
  if (entry.flatValues !== undefined) {
    const flat = entry.flatValues.getValue(talentLevel);
    term = cSum([term, cConst(flat)]);
  }
  // Per-multiplier absolute cap (her FeatureMultiplier.capValue → CValueCap, a
  // Math.min wrapping the multiplier tree): `min(levelMult × scalingStat, capValue)`,
  // applied to THIS term before it enters the base-damage sum and before the
  // dmg-bonus/res/def factors. The sole v5.8 user is Ocean-Hued Clam's foam
  // (`min(0.9 × accumulated_healing, 30000)`). Absent → no cap (every other multiplier).
  return entry.capValue !== undefined ? cMin([term, cConst(entry.capValue)]) : term;
}

/**
 * Select the char-level ("targeted") multipliers that apply to this feature:
 * those whose `target` MATCHES the feature AND whose gate is active
 * (`evaluate(condition)`; an absent condition is always-on, per her
 * `FeatureMultiplier.isActive`).
 *
 * `target.isMatchFeature` is an AND-chain of present filters (Target.js):
 *   - `damageTypes` (always present): includes the feature's resolved damage type.
 *   - `damageElements` (optional): includes the feature's RESOLVED element
 *     (`element`, already infusion-resolved by the caller — her `feature.getElement(data)`).
 *     Absent/empty → the element filter is skipped (no constraint, base-inert).
 *
 * Faithful to her `Feature2.getMultipliers` second loop (Feature2.js:121-125):
 * `for (item of data.multipliers) if (item.isActive(data) && item.isMatchFeature(this, data)) push`.
 * The matched entries' base terms are summed into the SAME `cBaseDamage` as the
 * feature's own multipliers (Damage.js:271-276) — a base term, not a separate factor.
 */
function activeCharMultipliers(
  feature: Feature,
  damageType: string,
  element: Element,
  ctx: CompileContext
): readonly CharMultiplier[] {
  const all = ctx.charMultipliers;
  if (!all || all.length === 0) return [];
  return all.filter((m) => {
    // isMatchFeature — AND-chain of present filters (her Target.js:27-55).
    // damageTypes branch: only constrains when present + non-empty (mirrors her
    // `if (this.damageTypes.length && !this.damageTypes.includes(damageType))`).
    // An empty array means "no type filter" (all types match) — e.g. Faruzan A4.
    if (m.target.damageTypes.length > 0 && !m.target.damageTypes.includes(damageType)) return false;
    // Element branch (Target.js:37-39): only constrains when present + non-empty.
    if (
      m.target.damageElements !== undefined &&
      m.target.damageElements.length > 0 &&
      !m.target.damageElements.includes(element)
    ) {
      return false;
    }
    // Tag branch (Target.js:41-53): only constrains when present + non-empty. The feature
    // matches iff its `tags` intersect the target's. The sole v5.8 tag is "plunge_shockwave"
    // (Xianyun's A4 teammate multiplier targets it; the shockwave features carry it). No
    // base/cons/armory multiplier sets target.tags → this branch is never entered for any
    // solo golden build (base-inert: the 58k damage goldens stay byte-identical).
    if (
      m.target.tags !== undefined &&
      m.target.tags.length > 0 &&
      !(feature.tags ?? []).some((t) => m.target.tags!.includes(t))
    ) {
      return false;
    }
    // canReact branch — CATALYZE multipliers only. Her `FeatureMultiplierReactionQuicken
    // .isMatchFeature` (Quicken.js:13-16) returns false for `!feature.canReact()`, so a
    // `cannotReact` hit (the descent FeatureDamagePlungeCollision) is NOT catalyzed even
    // when its element matches (e.g. Baizhu's dendro `plunge`: oracle isReacted:false).
    // Guarded on `m.catalyze` so it applies ONLY to the two global catalyze entries — a
    // normal char multiplier (Itto A4, …) has no canReact constraint. Inert for every
    // non-catalyze multiplier and every reacting hit. Source: raw/.../Quicken.js:13-16.
    if (m.catalyze !== undefined && feature.cannotReact) return false;
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
  if (damageType) {
    keys.push(`dmg_${damageType}`);
    // Composite type×element bonus — her getStatsDmgBonus also pushes
    // `dmg_<damageType>_<element>` (Damage.js:58), a key that applies ONLY to a
    // hit matching BOTH the type AND the (infusion-resolved) element. The element
    // segment uses the SAME `dmgElementKey(element)` as the `dmg_<element>` push
    // above (so physical → `dmg_<type>_phys`, faithful to her `getElement` which
    // returns 'phys'). v5.8 source: Candace's prayer + A4 (`dmg_normal_<element>`).
    // Absent for every build that sets no composite key → cStat reads 0 (the
    // established `dmg_charged_enemy` pattern) → base-inert (58k goldens untouched).
    keys.push(`dmg_${damageType}_${dmgElementKey(element)}`);
  }
  // Charged attacks additionally pick up the enemy-vulnerability key
  // `dmg_charged_enemy` — her FeatureDamageCharged.getStatsDmgBonus override
  // (Charged.js:14-18) is the ONLY damage subclass that adds a `dmg_<type>_enemy`
  // key. The v5.8 source is an enemy debuff (Scion of the Blazing Sun's Sunfire
  // Fan); the key reads 0 for every build that contributes none → base-safe.
  if (damageType === "charged") keys.push("dmg_charged_enemy");
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
 * Compile a NON-DAMAGE output feature (heal / shield / static / crystallize).
 *
 * Her CHeal / CShield / CStaticValue all compile to the SAME thing — Π(items)
 * emitted as a non-crit triple `[v, v, v]`; her FeatureHeal uses CDamage with crit
 * blocks that are zero unless `critRateBonuses` exist. So every kind is
 * `cDamage({items})` (which collapses to a non-crit triple when no crit blocks are
 * passed — the same chance-0 path the noCrit foam uses) with a kind-specific item
 * list. Reuses `activeOwnMultipliers` + `baseDamageTerm` — the identical base-term
 * compilation as damage features.
 *
 * Sources: raw/.../Feature2/{Heal,Shield,Static}.js, Reaction/Crystallize.js,
 *          Compile/Types/Damage.js (CHeal/CShield/CStaticValue == non-crit triple).
 */
function compileOutput(
  feature: Feature,
  output: FeatureOutput,
  ctx: CompileContext
): DamageBlock {
  // Crystallize: base is the per-level constant (her reactionRate 1 ×
  // reactionShieldValues[level]) × (1 + shield) × (1 + 4.44·EM/(EM+1400)).
  // Carries no talent multipliers.
  if (output.kind === "crystallize") {
    if (ctx.charLevel === undefined) {
      throw new Error(
        `compileOutput: crystallize feature '${feature.name}' needs ctx.charLevel (the level table lookup)`
      );
    }
    const masteryCurve = cMulti([
      cConst(4.44),
      cDivide([cStat("mastery_total"), cSum([cStat("mastery_total"), cConst(1400)])]),
    ]);
    return cDamage({
      items: [
        cBaseDamage([cConst(reactionShieldValues.getValue(ctx.charLevel))]),
        cMultiplierBonus([cStat("shield")]),
        cMultiplierReaction([masteryCurve]),
      ],
    });
  }

  // Heal / shield / static share the base term = Σ active own multipliers
  // (her getMultipliers → CBaseDamage). Multihit `items` flatten in, mirroring
  // the damage path.
  const ownMultipliers: readonly FeatureMultiplierEntry[] =
    feature.multipliers ?? (feature.items ?? []).flatMap((item) => item.multipliers);
  const base = cBaseDamage(activeOwnMultipliers(ownMultipliers, ctx).map((m) => baseDamageTerm(m, ctx)));

  // FeatureStatic: the bare base term (buff-value readouts).
  if (output.kind === "static") {
    return cDamage({ items: [base] });
  }

  // FeatureShield: base × (1 + shield). `add_shield_element` is off in the base
  // dump, so the element-bonus factor is not applied.
  if (output.kind === "shield") {
    return cDamage({ items: [base, cMultiplierBonus([cStat("shield")])] });
  }

  // After crystallize/static/shield the only remaining kind is "heal" — assert
  // exhaustiveness so a future FeatureOutput kind cannot silently fall through to the
  // heal formula (becomes a compile error until the new kind is handled here).
  if (output.kind !== "heal") {
    const unhandled: never = output;
    throw new Error(`compileOutput: unhandled output kind '${(unhandled as { kind: string }).kind}'`);
  }

  // FeatureHeal: base × (1 + healing + healing_base + healing_recv), optionally
  // − bond_of_life × hp_total (her subtractBoL — Arlecchino). Non-crit unless the
  // feature carries `critRateBonuses` (her getStatsCritRate returns ONLY those).
  // `healing_recv` is always summed — her `ignore_healing_recv` display-toggle variant
  // is not exercised by the base dump (out of scope — design §5).
  const healItems: Block[] = [
    base,
    cMultiplierBonus([cStat("healing"), cStat("healing_base"), cStat("healing_recv")]),
  ];
  // Flat items mirror the shield path + her CDamage([CBaseDamage, CMultiplierBonus]);
  // the BoL case groups the product so the subtraction applies to the whole heal.
  const items: Block[] = output.subtractBoL
    ? [cSubtract([cMulti(healItems), cMulti([cStat("bond_of_life"), cStat("hp_total")])])]
    : healItems;
  if (feature.critRateBonuses && feature.critRateBonuses.length > 0) {
    return cDamage({
      items,
      critRate: cCritRate(feature.critRateBonuses.map((k) => cStat(k))),
      critDmg: cCritDmg((feature.critDamageBonuses ?? []).map((k) => cStat(k))),
    });
  }
  return cDamage({ items });
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
  // Non-damage outputs (heal/shield/static/crystallize) route to the non-crit-triple
  // path — her FeatureHeal/Shield/Static/ReactionCrystallize subclasses (P3.5.3).
  if (feature.output !== undefined) {
    return compileOutput(feature, feature.output, ctx);
  }

  const element = resolveElement(feature, ctx);
  const damageType = damageTypeOf(feature);

  // Base damage = Σ over the feature's own multipliers (multihit `items` flatten
  // in) PLUS the active char-level multipliers targeting this damage type — her
  // getMultipliers merges both into one CBaseDamage (e.g. Itto A4's 0.35×DEF on
  // every charged hit). They are base terms, not separate multiplicative factors.
  const ownMultipliers: readonly FeatureMultiplierEntry[] =
    feature.multipliers ??
    (feature.items ?? []).flatMap((item) => item.multipliers);
  // Char-level ("targeted") multipliers apply PER ITEM, not once to the aggregate:
  // her FeatureDamageMultihit.getTree calls getMultipliers() FRESH inside the per-hit
  // loop (Multihit.js:23-27), so an N-instance hit (e.g. Keqing's 2-slash normal_hit_4,
  // Hu Tao's normal_hit_5) sums each matched char-multiplier's base term N times. Our
  // model computes ONE shared CBaseDamage over the summed item bases, so we replicate
  // the matched char-multiplier terms once per item to reproduce that sum. itemCount = 1
  // for a single-hit feature → IDENTICAL to before. Base-safe: a currently-green feature
  // is either single-item (itemCount 1, no change) or has no active char-multiplier
  // targeting it (nothing to replicate) — a base multihit feature targeted by an active
  // char-multiplier would already be RED (short by the per-item amount), and none are.
  const charMultipliers = activeCharMultipliers(feature, damageType, element, ctx);
  const itemCount = feature.items?.length ?? 1;
  const replicatedCharMultipliers: FeatureMultiplierEntry[] = [];
  for (let i = 0; i < itemCount; i++) replicatedCharMultipliers.push(...charMultipliers);
  const baseTerms = [
    ...activeOwnMultipliers(ownMultipliers, ctx),
    ...replicatedCharMultipliers,
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
  // Special-damage suppressions (her FeatureDamageClam): NO dmg-bonus → an empty
  // cMultiplierBonus (degenerates to 1); IGNORE enemy DEF → a constant-1 defence factor
  // (her getDefenceLevelMultiplier → CConst(1)). Resistance is NEVER suppressed. Both
  // flags absent for every normal hit → identical block as before (base/cons/armory safe).
  const bonusBlock = feature.noDamageBonus
    ? cMultiplierBonus([])
    : cMultiplierBonus(dmgBonusKeys(feature, element, damageType).map((k) => cStat(k)));
  const defenceBlock = feature.ignoreEnemyDefence
    ? cConst(1)
    : cMultiplierDefence("enemy_def_reduce", defIgnoreKeys);
  const items: Block[] = [
    cBaseDamage(baseTerms),
    bonusBlock,
    cMultiplierResistance(element),
    defenceBlock,
  ];

  // NO-CRIT special damage (her FeatureDamageClam getStatsCritRate/CritDamage → []):
  // omit the crit blocks entirely → cDamage uses chance 0 → crit == normal == avg.
  // Only the foam sets this; every normal hit falls through to the crit path below.
  if (feature.noCrit) {
    return cDamage({ items });
  }

  // Amplifying reaction (Vaporize/Melt): when `settings.reaction` is set, the hit can react
  // (`!feature.cannotReact` — her canReact(), Damage.js:308), AND the hit's resolved element
  // maps to a variant, append the amplifying factor to `items` — her getReactionMultipliers
  // (Damage.js:195-219) pushed into getTree's items (Damage.js:286). The factor multiplies the
  // whole hit (normal/crit/avg scale together). No `settings.reaction`, a cannotReact hit (Mona's
  // plunge Collision), or a non-reacting element (physical/electro/anemo/geo/dendro) → nothing
  // appended → un-amplified, byte-identical to before. Standalone reaction features
  // (`feature.reaction`) and the noCrit foam path are excluded above. `dmg_reaction_<reaction>`
  // (her getReactionBonuses) reads 0 unless a source grants it.
  const reaction = ctx.settings["reaction"];
  if (typeof reaction === "string" && !feature.cannotReact) {
    const variant = AMPLIFYING_VARIANT[`${reaction}_${element}`];
    if (variant !== undefined) {
      items.push(cAmplifyingFactor({ variant, reactionBonusKeys: [`dmg_reaction_${reaction}`] }));
    }
  }

  // Crit: the aggregated totals (buildStats folds crit_rate/_dmg in), PLUS the
  // generic per-TYPE crit keys (`crit_*_<damageType>`, folded here exactly as
  // `dmg_<damageType>` is in dmgBonusKeys — so a weapon/set/cons-sourced type-crit
  // like The Catch's `crit_rate_burst` reaches every burst hit), PLUS any
  // feature-declared crit bonus keys (char-specific suffixed keys + element crit,
  // not yet generically folded). Mirrors her getDefaultStatsCritRate /
  // getDefaultStatsCritDamage (Damage.js:72-122): generic set (incl. the per-type
  // push), then `this.critRateBonuses` / `this.critDamageBonuses` concatenated.
  // Aimed weak-shot → 100% crit. Her FeatureDamageChargedAimed.getCritRateBlock
  // (raw/.../Feature2/Damage/Charged/Aimed.js:5-13) returns `CCritRate([CConst(1)])`
  // (a flat 100% crit) when `data.settings.enemy_weak_shot` is set, ELSE the normal
  // crit block. NOT bow-restricted (the db/Conditions/Enemy.js weapon hideCondition is
  // a cosmetic UI gate); every aimed feature gets it. Two independent guards keep this
  // base-inert: it fires only when `enemy_weak_shot` is truthy (unset in all 58k
  // goldens) AND only on a feature flagged `isAimed` (a FeatureDamageChargedAimed). The
  // downstream Royal-passive wrap is applied to this block exactly as in raw, where the
  // royalCrit wrap (Damage.js:298) sits on top of getCritRateBlock's result.
  const critRateBase =
    ctx.settings["enemy_weak_shot"] && feature.isAimed
      ? cCritRate([cConst(1)])
      : cCritRate([
          cStat("crit_rate_total"),
          // Enemy-vulnerability crit rate — her getDefaultStatsCritRate ALWAYS includes
          // `crit_rate_enemy` (Feature2/Damage.js:73). buildStats emits it as a fraction only
          // when a source sets it (Cryo Resonance / BlizzardStrayer 4pc); 0 otherwise → no-op
          // for every build that has no enemy-status crit debuff (base golden untouched).
          cStat("crit_rate_enemy"),
          ...critBonusTypeKeys("rate", damageType).map((k) => cStat(k)),
          ...(feature.critRateBonuses ?? []).map((k) => cStat(k)),
        ]);
  // Royal-passive AVERAGE crit transform — wrap the clamped chance ONLY when the
  // Royal-weapon toggle `weapon_royal_avg_crit_rate` is set (her Damage.js:298 gate)
  // AND this is a single-hit feature. Affects ONLY the avg (cDamage feeds `chance`
  // only into the avg term); normal/crit are untouched. Base-inert: no base-build
  // char sets that toggle → the wrap never applies (goldenConfig 1773 + constellations
  // 107 unchanged). When set but `royal_crit_rate` is 0/absent the polynomial
  // degenerates to the base chance.
  //
  // MULTIHIT EXCLUSION: her `FeatureDamageMultihit.getTree` (Multihit.js:57-60)
  // builds its CDamage WITHOUT `royalCrit` — it OVERRIDES the base getTree that adds
  // it (Damage.js:298-300). So multihit-AGGREGATE features (our `feature.items` shape)
  // use the plain crit chance for their avg; only their single-hit children (modelled
  // with `multipliers`, using the base getTree) get the royal transform. Every other
  // Damage subclass (Normal/Charged/Burst/Skill/Plunge) inherits the base getTree →
  // royal applies. Mirror that exactly: skip the wrap when `feature.items` is present.
  const isMultihitAggregate = feature.items !== undefined;
  const critRate =
    ctx.settings["weapon_royal_avg_crit_rate"] && !isMultihitAggregate
      ? cRoyalCritRate(critRateBase)
      : critRateBase;
  const critDmg = cCritDmg([
    cStat("crit_dmg_total"),
    ...critBonusTypeKeys("dmg", damageType).map((k) => cStat(k)),
    ...(feature.critDamageBonuses ?? []).map((k) => cStat(k)),
  ]);

  return cDamage({ items, critRate, critDmg });
}
