/**
 * Ineffa — P1.7b Lunar-Charged representative (electro polearm).
 *
 * Exercises the electro stat table, crit-rate ascension substat, and the
 * crit-bearing Lunar-Charged archetype. Standard damage features (normal
 * attacks, skill, burst) compile via the normal-hit path; the Lunar-Charged
 * features route through the P1.6 reaction factory (see compileFeature's
 * `compileReaction`):
 *   - `reaction.lunarcharged_contrubution` — rate-based Lunar-Charged reaction
 *     (`1.8 × (1+lunarcharged_multi) × levelMult × (1+emBonus+…) × res`, crits).
 *   - `skill.ineffa_birgitta_coordinated_dmg` — A1 base-scaled lunardirect hit
 *     (`A1 65% × ATK × (1+lunarcharged_multi) × (1+emBonus+…) × 3 × res`, crits).
 *
 * Post-effects:
 *   - A4 EM→ATK bonus (gated by ineffa_panoramic_permutation_protocol)
 *   - Lunar-Charged ATK bonus (passive, 0.7% of lunarcharged_multi per ATK)
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Ineffa.js
 *   raw/genshin_calc_pub/src/js/db/Features/Reactions.js (lunarcharged_contrubution)
 *   raw/genshin_calc_pub/src/js/classes/Feature2/Reaction/Transformative/Lunar/*.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js:4320
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js:2240
 */

import type {
  DbObjectChar,
  Feature,
  TalentResolver,
} from "@genshin/types";
import { Ineffa as IneffaStatTable } from "../generated/charTables.js";
import { Ineffa as IneffaTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return IneffaTalents.s1.p1;
      if (name === "normal_hit_2") return IneffaTalents.s1.p2;
      if (name === "normal_hit_3_1") return IneffaTalents.s1.p3;
      if (name === "normal_hit_3_2") return IneffaTalents.s1.p4;
      if (name === "normal_hit_4") return IneffaTalents.s1.p5;
      if (name === "charged_hit") return IneffaTalents.s1.p6;
      if (name === "plunge") return IneffaTalents.s1.p8;
      if (name === "plunge_low") return IneffaTalents.s1.p9;
      if (name === "plunge_high") return IneffaTalents.s1.p10;
    }
    if (talent === "skill") {
      if (name === "skill_dmg") return IneffaTalents.s2.p1;
      if (name === "ineffa_birgitta_dmg") return IneffaTalents.s2.p4;
    }
    if (talent === "burst") {
      if (name === "burst_dmg") return IneffaTalents.s3.p1;
    }
    throw new Error(`ineffa talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Lunar-Charged constants & shared reaction stat keys
// ---------------------------------------------------------------------------

/** A1 "Overclocking Circuit" coordinated-attack multiplier (65% of ATK). */
const A1_COORDINATED_DMG = 65;
/** ChargedLike flat amplifying factor: CMultiplierAmplifying([3%]) → bare ×3. */
const LUNAR_DIRECT_AMPLIFY = 3;
/** `(1 + lunarcharged_multi)` rate/base scaling key (her getScalingStat). */
const LUNAR_SCALING_KEYS = ["lunarcharged_multi"] as const;
/** Reaction-DMG-bonus key folded into `(1 + emBonus + Σ)`. */
const LUNAR_REACTION_BONUS_KEYS = ["dmg_reaction_lunarcharged"] as const;
/**
 * Crit keys read from the build. buildStats folds the per-element/-type crit
 * keys her engine sums (`crit_rate_electro`, …) into the aggregated totals, so
 * the data layer reads the totals — same convention as the normal-hit path.
 */
const LUNAR_CRIT_RATE_KEYS = ["crit_rate_total"] as const;
const LUNAR_CRIT_DMG_KEYS = ["crit_dmg_total"] as const;

// ---------------------------------------------------------------------------
// Features (normal damage + the crit-bearing Lunar-Charged family)
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (electro element via character innate) ---
  {
    name: "normal_hit_1",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1") }],
  },
  {
    name: "normal_hit_2",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2") }],
  },
  // normal_hit_3: multihit (2 × p3 per hit)
  {
    name: "normal_hit_3",
    category: "attack",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3_1") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3_2") }] },
    ],
  },
  {
    name: "normal_hit_3_1",
    category: "attack",
    isChild: true,
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3_1") }],
  },
  {
    name: "normal_hit_4",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4") }],
  },
  // --- Charged attack ---
  {
    name: "charged_hit",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }],
  },
  // --- Plunge attacks ---
  {
    name: "plunge",
    category: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge") }],
  },
  {
    name: "plunge_low",
    category: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_low") }],
  },
  {
    name: "plunge_high",
    category: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_high") }],
  },
  // --- Skill: Carrier Frequency ---
  {
    name: "skill_dmg",
    category: "skill",
    element: "electro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.skill_dmg") }],
  },
  {
    name: "ineffa_birgitta_dmg",
    category: "skill",
    element: "electro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.ineffa_birgitta_dmg") }],
  },
  // --- Burst: Cyclonic Exterminator ---
  {
    name: "burst_dmg",
    category: "burst",
    element: "electro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") }],
  },
  // --- Lunar-Charged: standalone reaction (rate-based, crit-bearing) ---
  // 1.8 × (1+lunarcharged_multi) × levelMult × (1 + 6·EM/(EM+2000) + dmg_reaction) × res.
  // Source: raw/.../db/Features/Reactions.js (FeatureReactionLunarCharged 'lunarcharged_contrubution').
  {
    name: "lunarcharged_contrubution",
    category: "reaction",
    damageType: "lunarreaction",
    reaction: {
      variant: "lunarcharged",
      element: "electro",
      scalingStatKeys: LUNAR_SCALING_KEYS,
      reactionBonusKeys: LUNAR_REACTION_BONUS_KEYS,
      critRateKeys: LUNAR_CRIT_RATE_KEYS,
      critDmgKeys: LUNAR_CRIT_DMG_KEYS,
    },
  },
  // --- A1 lunardirect: Birgitta coordinated attack (base-scaled, crit-bearing) ---
  // (65% × ATK) × (1+lunarcharged_multi) × (1 + 6·EM/(EM+2000) + dmg_reaction) × 3 × res.
  // Source: raw/.../db/Char/Ineffa.js (FeatureReactionLunarChargedLike, ascension1).
  {
    name: "ineffa_birgitta_coordinated_dmg",
    category: "skill",
    damageType: "lunardirect",
    multipliers: [
      { leveling: "", scaling: "atk", values: { getValue: () => A1_COORDINATED_DMG } },
    ],
    reaction: {
      variant: "lunardirect",
      element: "electro",
      scalingStatKeys: LUNAR_SCALING_KEYS,
      reactionBonusKeys: LUNAR_REACTION_BONUS_KEYS,
      amplifyingMultiplier: LUNAR_DIRECT_AMPLIFY,
      critRateKeys: LUNAR_CRIT_RATE_KEYS,
      critDmgKeys: LUNAR_CRIT_DMG_KEYS,
    },
  },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const ineffa: DbObjectChar = {
  name: "ineffa",
  gameId: 10000116,
  rarity: 5,
  element: "electro",
  weapon: "polearm",
  origin: "nodkrai",
  statTable: IneffaStatTable,
  talents,
  features,
  multipliers: [],
};
