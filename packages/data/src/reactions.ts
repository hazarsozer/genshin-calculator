/**
 * Standard transformative-reaction contribution features — generic, per-element.
 *
 * Every character emits a set of standalone transformative-reaction "contribution"
 * damage instances (Overload, Superconduct, Electro-Charged, Shatter, Swirl,
 * Hyperbloom, Burgeon, Burning, …) computed purely from its EM + level + the
 * reaction's coefficient/element. The SET a character emits is gated by its
 * element, mirroring her `db/Features/Reactions.js` `ConditionBooleanCharElement`
 * conditions (with elemental-infusion settings OFF — the canonical-build default).
 *
 * This is GENERIC: there is no per-character reaction data. `compileCharacter`
 * appends `transformativeReactionFeatures(char.element, …)` so all 107 characters
 * get the right reaction set once. The features route through `compileFeature`'s
 * `compileReaction` → `@genshin/core`'s `cTransformativeDamage`.
 *
 * FORMULA (per reaction, her `Reaction/Transformative.js` + `Multiplier/Reaction.js`):
 *   damage = reactionRate × levelMult(charLevel)
 *            × (1 + 16·EM/(EM+2000) + Σ dmg_reaction_<kind>)
 *            × resMult(element)
 * Cannot crit (normal = crit = avg).
 *
 * REACTION RATES are HER internal `getReactionRate()` values, NOT the canonical
 * game coefficients (e.g. Overload is 2.75 here, not the game's "2.0"); the level
 * table absorbs the rest. Cited per reaction below.
 *
 * ELEMENT GATING (verified against all 107 oracle fixtures, infusion off):
 *   pyro    → overloaded, burning, burgeon, electrocharged, shatter
 *   hydro   → rupture, electrocharged, shatter
 *   electro → overloaded, superconduct, hyperbloom, electrocharged, shatter
 *   cryo    → superconduct, electrocharged, shatter
 *   anemo   → swirl(×4), burning, superconduct, overloaded, rupture, burgeon,
 *             hyperbloom, electrocharged, shatter
 *   geo     → electrocharged, shatter
 *   dendro  → burning, rupture, electrocharged, shatter
 * (`electrocharged` and `shatter` are universal; `electrocharged` is suppressed
 * for a Lunar-Charged-active character — see `lunarChargedActive` below.)
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Features/Reactions.js (the feature catalog + conditions)
 *   raw/genshin_calc_pub/src/js/classes/Feature2/Reaction/Transformative.js:7-18 (rate × levelMult × penalty)
 *   raw/genshin_calc_pub/src/js/classes/Feature2/Multiplier/Reaction.js:23-75 (CMulti composition)
 *   raw/genshin_calc_pub/src/js/classes/Feature2/Multiplier/Reaction/Transformative.js:7-18 (16·EM/(EM+2000))
 *   raw/genshin_calc_pub/src/js/classes/Feature2/Reaction/Transformative/<Reaction>.js (each getReactionRate + dmg_reaction_<kind>)
 */

import type { Element, Feature } from "@genshin/types";

/**
 * One transformative reaction's invariant data. `name` is the feature/fixture key
 * suffix (`reaction.<name>`); `element` is the resistance-lookup element
 * (`enemy_res_<element>`); `rate` is her `getReactionRate()`; `reactionBonusKeys`
 * are the `dmg_reaction_*` stat keys summed inside `(1 + emBonus + Σ)`.
 */
interface TransformativeReactionDef {
  readonly name: string;
  readonly element: Element;
  readonly rate: number;
  readonly reactionBonusKeys: readonly string[];
  /**
   * Reaction-specific crit keys — her per-reaction `getStatsCritRate`/
   * `getStatsCritDamage` overrides. Only Burning (`crit_rate_burning`) and the
   * Bloom family (Bloom/Rupture/Hyperbloom/Burgeon all inherit `crit_rate_bloom`)
   * declare them; every other reaction is non-crit. Keys read 0 unless a source
   * grants them (Nahida C2) → crit === normal === avg.
   */
  readonly critRateKeys?: readonly string[];
  readonly critDmgKeys?: readonly string[];
}

/**
 * The transformative reaction catalog — name → (rate, element, bonus keys),
 * faithful to her `Reaction/Transformative/*` modules.
 *
 * Swirl is four element-specific instances (the swirled element drives the
 * resistance lookup), matching her four `FeatureReactionSwirl` declarations in
 * Reactions.js. `swirl_hydro` is flagged `cannotReact` in her data but still emits
 * a contribution row, so it is included.
 *
 * NOTE on her data quirks (preserved verbatim, with cites):
 *   - Superconduct pushes `dmg_reaction_overloaded` (Reaction/SuperConduct.js:11),
 *     not a `_superconduct` key — kept as-is.
 *   - Burning pushes `dmg_reaction_bloom` (Reaction/Burning.js:11) — kept as-is.
 *   - Hyperbloom/Burgeon/Rupture extend Bloom, so they carry BOTH `dmg_reaction_bloom`
 *     (from the parent) AND their own key (Reaction/Bloom.js:11, HyperBloom.js:11,
 *     Burgeon.js:11, Rupture.js:9). All absent keys read 0, so this is exact.
 */
const REACTION_DEFS: Readonly<Record<string, TransformativeReactionDef>> = {
  // getReactionRate 2.75 — Reaction/Transformative/Overloaded.js:4, key :11
  overloaded: { name: "overloaded", element: "pyro", rate: 2.75, reactionBonusKeys: ["dmg_reaction_overloaded"] },
  // getReactionRate 1.5 — Reaction/Transformative/SuperConduct.js:4, key :11 (her `_overloaded`)
  superconduct: { name: "superconduct", element: "cryo", rate: 1.5, reactionBonusKeys: ["dmg_reaction_overloaded"] },
  // getReactionRate 2 — Reaction/Transformative/ElectroCharged.js:4, key :11
  electrocharged: { name: "electrocharged", element: "electro", rate: 2, reactionBonusKeys: ["dmg_reaction_electrocharged"] },
  // getReactionRate 3 — Reaction/Transformative/Shattered.js:4, key :11. Her element 'phys' → enemy_res_physical.
  shatter: { name: "shatter", element: "physical", rate: 3, reactionBonusKeys: ["dmg_reaction_shatter"] },
  // getReactionRate 0.25 — Reaction/Transformative/Burning.js:4, key :11 (her `_bloom`)
  burning: { name: "burning", element: "pyro", rate: 0.25, reactionBonusKeys: ["dmg_reaction_bloom"], critRateKeys: ["crit_rate_burning"], critDmgKeys: ["crit_dmg_burning"] },
  // getReactionRate 2 — Reaction/Transformative/Bloom.js:4, key :11. Bloom-family crit = `_bloom` (Bloom.js:20,29).
  bloom: { name: "bloom", element: "dendro", rate: 2, reactionBonusKeys: ["dmg_reaction_bloom"], critRateKeys: ["crit_rate_bloom"], critDmgKeys: ["crit_dmg_bloom"] },
  // getReactionRate 3 — Reaction/Transformative/HyperBloom.js:4 (+ Bloom parent key + inherited `_bloom` crit)
  hyperbloom: { name: "hyperbloom", element: "dendro", rate: 3, reactionBonusKeys: ["dmg_reaction_bloom", "dmg_reaction_hyperbloom"], critRateKeys: ["crit_rate_bloom"], critDmgKeys: ["crit_dmg_bloom"] },
  // getReactionRate 3 — Reaction/Transformative/Burgeon.js:4 (+ Bloom parent key + inherited `_bloom` crit)
  burgeon: { name: "burgeon", element: "dendro", rate: 3, reactionBonusKeys: ["dmg_reaction_bloom", "dmg_reaction_burgeon"], critRateKeys: ["crit_rate_bloom"], critDmgKeys: ["crit_dmg_bloom"] },
  // getReactionRate 2 (Bloom default) — Reaction/Transformative/Rupture.js (+ Bloom parent key + inherited `_bloom` crit)
  rupture: { name: "rupture", element: "dendro", rate: 2, reactionBonusKeys: ["dmg_reaction_bloom", "dmg_reaction_rupture"], critRateKeys: ["crit_rate_bloom"], critDmgKeys: ["crit_dmg_bloom"] },
  // getReactionRate 0.6 — Reaction/Transformative/Swirl.js:4, key :29. Element-specific instances.
  swirl_pyro: { name: "swirl_pyro", element: "pyro", rate: 0.6, reactionBonusKeys: ["dmg_reaction_swirl"] },
  swirl_hydro: { name: "swirl_hydro", element: "hydro", rate: 0.6, reactionBonusKeys: ["dmg_reaction_swirl"] },
  swirl_electro: { name: "swirl_electro", element: "electro", rate: 0.6, reactionBonusKeys: ["dmg_reaction_swirl"] },
  swirl_cryo: { name: "swirl_cryo", element: "cryo", rate: 0.6, reactionBonusKeys: ["dmg_reaction_swirl"] },
};

/**
 * element → emitted reaction-name set (her Reactions.js conditions, infusion off).
 * `shatter` (unconditional) and `electrocharged` (`ConditionNot([lunarchargedCond])`,
 * true when not Lunar-Charged) are appended to every element below.
 */
const ELEMENT_REACTIONS: Readonly<Record<Element, readonly string[]>> = {
  // overloaded(pyro∈list), burning(pyro), burgeon(pyro) — Reactions.js conditions
  pyro: ["overloaded", "burning", "burgeon"],
  // rupture(hydro∈list) — Reactions.js
  hydro: ["rupture"],
  // overloaded(electro), superconduct(electro), hyperbloom(electro) — Reactions.js
  electro: ["overloaded", "superconduct", "hyperbloom"],
  // superconduct(cryo) — Reactions.js
  cryo: ["superconduct"],
  // anemo is in EVERY condition's element list → all swirl + every reaction
  anemo: [
    "swirl_pyro", "swirl_hydro", "swirl_electro", "swirl_cryo",
    "burning", "superconduct", "overloaded", "rupture", "burgeon", "hyperbloom",
  ],
  // geo triggers only crystallize (a shield, out of scope) + the universals
  geo: [],
  // burning(dendro), rupture(dendro) — Reactions.js
  dendro: ["burning", "rupture"],
  // physical chars don't exist as a playable element; no element-specific set
  physical: [],
};

/** Reactions every element triggers (her unconditional / not-lunarcharged ones). */
const UNIVERSAL_REACTIONS: readonly string[] = ["electrocharged", "shatter"];

/** Options for the reaction-feature emitter. */
export interface TransformativeReactionOptions {
  /**
   * True when the character has Lunar-Charged active (her `allowed_lunarcharged:1`
   * default — Ineffa only). Her `electrocharged` is gated by
   * `ConditionNot([lunarchargedCond])`, so a Lunar-Charged-active character emits
   * NO `electrocharged` contribution (its lunar variants are declared separately
   * on the character). Source: Reactions.js `lunarchargedCond` + Char/Ineffa.js:355.
   */
  readonly lunarChargedActive?: boolean;
}

/**
 * Build the standard transformative-reaction contribution `Feature[]` for a
 * character of the given innate element. Each feature carries a `reaction`
 * descriptor (`variant: "transformative"`) that `compileFeature` routes to
 * `cTransformativeDamage`. Keys land as `reaction.<name>`, matching the fixtures.
 */
export function transformativeReactionFeatures(
  element: Element,
  options: TransformativeReactionOptions = {}
): readonly Feature[] {
  const names = [...(ELEMENT_REACTIONS[element] ?? []), ...UNIVERSAL_REACTIONS];

  // Lunar-Charged suppresses electrocharged (replaced by the lunar variants).
  const filtered = options.lunarChargedActive
    ? names.filter((n) => n !== "electrocharged")
    : names;

  return filtered.map((name) => {
    const def = REACTION_DEFS[name]!;
    return {
      name: def.name,
      category: "reaction",
      damageType: "reaction",
      reaction: {
        variant: "transformative",
        element: def.element,
        reactionMultiplier: def.rate,
        reactionBonusKeys: def.reactionBonusKeys,
        ...(def.critRateKeys ? { critRateKeys: def.critRateKeys } : {}),
        ...(def.critDmgKeys ? { critDmgKeys: def.critDmgKeys } : {}),
      },
    } satisfies Feature;
  });
}
