/**
 * Character domain types.
 *
 * Sources:
 *   wiki/architecture/db-object-model.md
 *   raw/genshin_calc_pub/src/js/db/Char/Hutao.js
 */

// ---------------------------------------------------------------------------
// Branded numeric ranges
// ---------------------------------------------------------------------------

/** Character level 1–90. */
export type CharacterLevel = number & { readonly __brand: "CharacterLevel" };

/** Talent level 1–15. */
export type TalentLevel = number & { readonly __brand: "TalentLevel" };

/** Ascension phase 0–6. */
export type AscensionLevel = number & { readonly __brand: "AscensionLevel" };

/** Weapon refinement rank 1–5. */
export type Refinement = number & { readonly __brand: "Refinement" };

/** Constellation level 0–6. */
export type ConstellationLevel = number & {
  readonly __brand: "ConstellationLevel";
};

// ---------------------------------------------------------------------------
// Enums-as-unions
// ---------------------------------------------------------------------------

/** The seven playable elements plus Physical (non-elemental). */
export type Element =
  | "pyro"
  | "hydro"
  | "electro"
  | "cryo"
  | "anemo"
  | "geo"
  | "dendro"
  | "physical";

/** Weapon categories a character can equip. */
export type WeaponType =
  | "sword"
  | "claymore"
  | "polearm"
  | "bow"
  | "catalyst";

// ---------------------------------------------------------------------------
// DbObjectChar structural shape
// ---------------------------------------------------------------------------

/**
 * Structural shape of a character entity as registered in DB.
 *
 * Fields drawn from DbObjectChar constructor usage in Hutao.js:
 *   name, rarity, element, weapon, origin, talents, statTable, features,
 *   postEffects, conditions, multipliers, constellation, partyData.
 *
 * NOTE: `talents`, `statTable`, `features`, etc. are typed as their
 * structural interfaces — see feature.ts / condition.ts for those shapes.
 * P1.5 (engine core, Opus) will refine how Feature and Condition are consumed.
 */
export interface DbObjectChar {
  readonly name: string;
  /** Game-internal numeric ID. */
  readonly gameId: number;
  readonly rarity: 4 | 5;
  readonly element: Element;
  readonly weapon: WeaponType;
  /** Region of origin (liyue, mondstadt, etc.). */
  readonly origin: string;
  /** Stat-table data for base stats at each level/ascension. */
  readonly statTable: unknown;
  /** Ordered list of combat feature declarations. */
  readonly features: readonly unknown[];
  /** Optional post-effects (HP→ATK derivations, etc.). */
  readonly postEffects?: readonly unknown[];
  /** Character-level conditions (buffs, toggles). */
  readonly conditions?: readonly unknown[];
  /** Constellation data. */
  readonly constellation?: unknown;
  /** Party (external) conditions the character provides. */
  readonly partyData?: { readonly conditions: readonly unknown[] };
}
