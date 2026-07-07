/**
 * Shared UI build-state types for the v1 calculator web app.
 *
 * `BuildForm` is the canonical client-side build state every page reads/writes;
 * `computeBuild` (lib/calc.ts) maps it onto the engine's `reconstructPort`.
 */

import type { EquippedSet } from "@genshin/data";

export type ArtifactMode = "good" | "manual";

/** One teammate in the party roster. `settings` keys are the engine's partyData
 *  condition names (e.g. "party.bennet_fantastic_voyage", "bennet_atk_base").
 *
 *  The optional `set*`/`weapon*` fields carry this teammate's off-field
 *  Set/Weapon-buff picks (Wave 1.5), folded into PartyInput.setOther/weaponOther by
 *  buildPartyInput. All optional → existing serialized builds round-trip unchanged. */
export interface PartyMemberForm {
  slug: string; // DbObjectChar.name
  settings: Record<string, number | boolean>;
  setKey?: string;        // set_other gate slug (TEAM_BUFF_SETS gate); absent → no set buff
  setElement?: string;    // VV/Archaic absorbed element (only when the picked set has elementPick)
  setTier?: string;       // Scroll tier "1"|"2" (only when the picked set has tierPick)
  weaponKey?: string;     // off-field weapon gate (OFF_FIELD_WEAPONS gate); absent → no weapon buff
  weaponRefine?: number;  // teammate weapon refine 1–5 (default 1)
}

/** Per-slot artifact data for the slot-based manual input UI.
 *  Uses GOOD stat key strings so `assembleArtifactStats` can derive the flat block. */
export interface ArtifactSlotData {
  mainStatKey: string;              // GoodStatKey (e.g. "hp", "critDMG_")
  rarity: 1 | 2 | 3 | 4 | 5;
  level: number;                    // 0..20
  substats: Array<{ key: string; value: number }>;
  setKey?: string;                  // GOOD artifact set id; drives manualSets derivation
}

export interface BuildForm {
  characterKey: string; // DbObjectChar.name
  weaponKey: string; // DbObjectWeapon.name
  charLevel: number; // default 90
  ascension: number; // default 6
  weaponLevel: number; // default 90
  weaponAscension: number; // default 6
  talents: { attack: number; elemental: number; burst: number }; // default 10/10/10
  constellation: number; // 0..6
  weaponRefine: number; // 1..5
  conditions: {
    toggles: Record<string, boolean>;
    stacks: Record<string, number>;
    infusion?: string;
    /** Reaction override (settings.reaction) — None/Vaporize/Melt/Quicken.
     *  Quicken merges the engine's two global catalyze multipliers (Spread
     *  ×1.25 on dendro hits, Aggravate ×1.15 on electro — loader.ts:81). */
    reaction?: "vaporize" | "melt" | "quicken";
  };
  enemy: { level: number; resistance: number | Record<string, number> };
  artifactMode: ArtifactMode;
  goodJson: string; // raw GOOD text (good mode)
  manualStats: Record<string, number>; // raw-percent Aspirine keys (manual mode); derived from artifactSlots when slots are used
  manualSets: EquippedSet[]; // manual-mode set picker
  /** Per-slot data for the slot-based input UI. When set, manualStats is derived from this. Optional so existing builds without slots still work. */
  artifactSlots?: Partial<Record<string, ArtifactSlotData>>;
  /** Party roster (up to 3 teammates). Optional: absent → no party passed → engine call byte-identical. */
  party?: { members: PartyMemberForm[] };
  /** Feature key pinned as the Stage headline (see selectHeadline). Optional: absent → highest-average feature wins. */
  pinnedFeature?: string;
  /** Equipped food dishes per type (Attack/Defence/Potion). Optional: absent/empty → no food bag → engine call byte-identical. */
  food?: Partial<Record<"Attack" | "Defence" | "Potion", { key: string; tier: number }>>;
  /** Manual `custom_buffs.<key>` escape-hatch (raw percent points / flats, unscaled). Optional: absent → inert. */
  customBuffs?: Record<string, number>;
}

export interface FeatureResult {
  key: string; // "<category>.<name>"
  label: string; // humanized
  triple: [number, number, number]; // [non-crit, crit, average]
}

export interface ComputeResult {
  features: readonly FeatureResult[];
  error?: string;
  stats?: Readonly<Record<string, number>>;
}
