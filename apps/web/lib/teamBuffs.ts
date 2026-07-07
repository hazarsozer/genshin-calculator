/**
 * teamBuffs — curated UI tables for the off-field teammate Set/Weapon buffs
 * (Wave 1.5). Each entry's `gate` is the EXACT condition gate from
 * `packages/data/src/characterConditions.ts` (the source of truth). The drift
 * guard in `__tests__/teamBuffs.test.ts` asserts every gate still exists there.
 *
 * Data flow: a teammate's pick → buildPartyInput folds it into
 * PartyInput.setOther / weaponOther → buildPartyContext publishes the gate keys →
 * the global conditions in characterConditions.ts fire.
 *
 *  - setOther record key = the `gate` slug (partyContext prepends "set_other.").
 *  - weaponOther record key = the full `gate` string (published verbatim).
 */

import type { WeaponType } from "@genshin/types";

export interface TeamBuffSet {
  /** set_other gate slug — the setOther record key (partyContext prepends "set_other."). */
  gate: string;
  label: string;
  /** VV / Archaic Petra: user picks one element from ELEMENT_PICK_OPTIONS → setOther[gate] = element. */
  elementPick?: boolean;
  /** Scroll of the Hero of Cinder City: user picks a tier → setOther[`${gate}_${tier}`] = true. */
  tierPick?: boolean;
}

export interface OffFieldWeapon {
  /** Full levelSetting gate string (`weapon_other.*` or `weapon.thrilling_tales`) — published verbatim. */
  gate: string;
  label: string;
  /** DbObjectWeapon.weapon type — drives the per-teammate weapon-type filter. */
  weaponType: WeaponType;
}

/** Elements a VV/Archaic teammate can absorb/swirl. Both sets gate exactly these four. */
export const ELEMENT_PICK_OPTIONS = ["pyro", "hydro", "electro", "cryo"] as const;

/** Scroll of the Hero of Cinder City tiers (tier1 +12% / tier2 +28% all-elemental DMG). */
export const SCROLL_TIER_OPTIONS = ["1", "2"] as const;

/**
 * Off-field 4pc Artifact-Set team buffs. Plain booleans except:
 *  - elementPick: Viridescent Venerer (swirl RES shred) + Archaic Petra (Crystallize DMG bonus, NO geo).
 *  - tierPick:    Scroll of the Hero of Cinder City (two boolean tier gates `${gate}_1` / `${gate}_2`).
 * Silken Moon's Serenade is the single REACTION-toggle gate only (its Moonsign EM tiers share the same
 * `set_other.silken_moons_serenade_4` gate and are gated by the active char's Moonsign). Song of Days Past
 * (a healing-number input) is out of scope this wave.
 */
export const TEAM_BUFF_SETS: readonly TeamBuffSet[] = [
  { gate: "noblesse_oblige_4", label: "Noblesse Oblige (4pc)" },
  { gate: "deepwood_memories_4", label: "Deepwood Memories (4pc)" },
  { gate: "tenacity_of_the_millelith_4", label: "Tenacity of the Millelith (4pc)" },
  { gate: "instructor_4", label: "Instructor (4pc)" },
  { gate: "night_of_the_skys_unveiling_4", label: "Night of the Sky's Unveiling (4pc)" },
  { gate: "silken_moons_serenade_4", label: "Silken Moon's Serenade (4pc)" },
  { gate: "viridescent_venerer_4", label: "Viridescent Venerer (4pc)", elementPick: true },
  { gate: "archaic_petra_4", label: "Archaic Petra (4pc)", elementPick: true },
  { gate: "scroll_of_the_hero_of_cinder_city_4", label: "Scroll of the Hero of Cinder City (4pc)", tierPick: true },
] as const;

/**
 * Off-field weapon team buffs (Buffs/Weapons.js). The 4 stat-conversion weapons
 * (Makhaira / Xiphos / Peak Patrol Song / Key of Khaj-Nisut) are EXCLUDED — they
 * need teammate-stat inputs, out of scope this wave. `gate` is the exact levelSetting.
 */
export const OFF_FIELD_WEAPONS: readonly OffFieldWeapon[] = [
  { gate: "weapon.thrilling_tales", label: "Thrilling Tales of Dragon Slayers", weaponType: "catalyst" },
  { gate: "weapon_other.weapon_wolfs_gravestone", label: "Wolf's Gravestone", weaponType: "claymore" },
  { gate: "weapon_other.weapon_white_dragon_ring", label: "Hakushin Ring", weaponType: "catalyst" },
  { gate: "weapon_other.forest_sanctuary", label: "Sapwood Blade", weaponType: "sword" },
  { gate: "weapon_other.stillwood_moonshadow", label: "Moonpiercer", weaponType: "polearm" },
  { gate: "weapon_other.weapon_starcallers_watch", label: "Starcaller's Watch", weaponType: "catalyst" },
  { gate: "weapon_other.weapon_symphonist_of_scents", label: "Symphonist of Scents", weaponType: "polearm" },
  { gate: "weapon_other.weapon_thousand_floating_dreams", label: "A Thousand Floating Dreams", weaponType: "catalyst" },
  { gate: "weapon_other.weapon_elegy_for_the_end", label: "Elegy for the End", weaponType: "bow" },
  { gate: "weapon_other.weapon_song_of_broken_pines", label: "Song of Broken Pines", weaponType: "claymore" },
  { gate: "weapon_other.weapon_freedom_sworn", label: "Freedom-Sworn", weaponType: "sword" },
  { gate: "weapon_other.weapon_millennial_hymn", label: "Nightweaver's Looking Glass", weaponType: "catalyst" },
] as const;
