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
  cMulti,
  cMultiplierBonus,
  cMultiplierDefence,
  cMultiplierResistance,
  cStat,
  type Block,
  type DamageBlock,
} from "@genshin/core";
import type {
  Element,
  EvalContext,
  Feature,
  FeatureMultiplierEntry,
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

/** Build the base-damage term for one multiplier: talent% × scalingStatTotal. */
function baseDamageTerm(
  entry: FeatureMultiplierEntry,
  ctx: CompileContext
): Block {
  const slot = LEVELING_TO_SLOT[entry.leveling];
  const talentLevel = slot !== undefined ? ctx.talentLevels[slot] : 1;
  // her getValue: values.getValue(level)/100 → a fraction.
  const talentPercent = entry.values.getValue(talentLevel) / 100;

  // Scaling stat: default 'atk' total. The `*` in her 'atk*' means "use total";
  // buildStats supplies `<stat>_total`. Strip any trailing '*' the data carries.
  const scaling = (entry.scaling ?? "atk").replace("*", "");
  const scalingKey = `${scaling}_total`;

  return cMulti([cConst(talentPercent), cStat(scalingKey)]);
}

/**
 * Collect the DMG% bonus stat keys for a hit (additive inside cMultiplierBonus):
 * `dmg_all`, `dmg_<element>`, `dmg_<damageType>`. Absent keys read as 0.
 */
function dmgBonusKeys(element: Element, damageType: string): readonly string[] {
  const keys = ["dmg_all", `dmg_${dmgElementKey(element)}`];
  if (damageType) keys.push(`dmg_${damageType}`);
  return keys;
}

/**
 * Compile a `Feature` into an executable `DamageBlock`.
 *
 * The returned block is a CDamage root; pass it to `compile(block)` for the
 * `(ctx) => DamageResult` closure. (Reaction features — `settings.reaction` set
 * — route to the P1.6 factories; this task compiles the non-reacted hit, which
 * is what the Hu Tao oracle baseline exercises.)
 */
export function compileFeature(
  feature: Feature,
  ctx: CompileContext
): DamageBlock {
  const element = resolveElement(feature, ctx);
  const damageType = damageTypeOf(feature);

  // Base damage = Σ over the feature's multipliers (multihit `items` flatten in).
  const multipliers: readonly FeatureMultiplierEntry[] =
    feature.multipliers ??
    (feature.items ?? []).flatMap((item) => item.multipliers);
  const baseTerms = multipliers.map((m) => baseDamageTerm(m, ctx));

  const items: Block[] = [
    cBaseDamage(baseTerms),
    cMultiplierBonus(dmgBonusKeys(element, damageType).map((k) => cStat(k))),
    cMultiplierResistance(element),
    cMultiplierDefence(),
  ];

  // Crit: the aggregated totals (buildStats folds per-element/-type crit in).
  const critRate = cCritRate([cStat("crit_rate_total")]);
  const critDmg = cCritDmg([cStat("crit_dmg_total")]);

  return cDamage({ items, critRate, critDmg });
}
