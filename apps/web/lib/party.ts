/**
 * party — pure helpers for the Team & Buffs drawer.
 *
 * Turns the UI's PartyMemberForm roster into the engine's PartyInput, defaulting
 * each teammate's talent-level settings to 10 (the standard "maxed support"
 * assumption — buildStats defaults an unset levelSetting to 1, far too low). The
 * explicit teammate STAT fields (atk_base, mastery…) stay user-entered (default 0).
 */

import type { DbObjectChar } from "@genshin/types";
import type { PartyInput } from "@genshin/data";
import type { PartyMemberForm } from "./types";

const RESONANCE_LABELS: Readonly<Record<string, string>> = {
  pyro: "Pyro Resonance",
  hydro: "Hydro Resonance",
  electro: "Electro Resonance",
  cryo: "Cryo Resonance",
  anemo: "Anemo Resonance",
  geo: "Geo Resonance",
  dendro: "Dendro Resonance",
};

/**
 * Every talent-level setting a teammate's partyData buffs reference → 10.
 * Scans the buff-scaling post-effect forms (ratioFromTalent / talentBonus /
 * ratioPerStack) that read a `levelSetting`.
 */
function teammateLevelDefaults(char: DbObjectChar): Record<string, number> {
  const out: Record<string, number> = {};
  for (const pe of char.partyData?.postEffects ?? []) {
    const ls =
      pe.ratioFromTalent?.levelSetting ??
      pe.talentBonus?.levelSetting ??
      pe.ratioPerStack?.levelSetting;
    if (ls) out[ls] = 10;
  }
  return out;
}

export function buildPartyInput(
  members: readonly PartyMemberForm[],
  resolveChar: (slug: string) => DbObjectChar | undefined
): PartyInput | undefined {
  if (members.length === 0) return undefined;
  return {
    members: members.map((m) => {
      const char = resolveChar(m.slug);
      const levelDefaults = char ? teammateLevelDefaults(char) : {};
      // user settings win over level defaults
      return { character: m.slug, settings: { ...levelDefaults, ...m.settings } };
    }),
  };
}

export function addMember(
  members: readonly PartyMemberForm[],
  slug: string
): PartyMemberForm[] {
  return [...members, { slug, settings: {} }];
}

export function removeMember(
  members: readonly PartyMemberForm[],
  index: number
): PartyMemberForm[] {
  return members.filter((_, i) => i !== index);
}

export function setMemberSetting(
  members: readonly PartyMemberForm[],
  index: number,
  key: string,
  value: number | boolean
): PartyMemberForm[] {
  return members.map((m, i) =>
    i === index ? { ...m, settings: { ...m.settings, [key]: value } } : m
  );
}

export function activeResonances(elements: readonly string[]): string[] {
  const counts: Record<string, number> = {};
  for (const el of elements) counts[el] = (counts[el] ?? 0) + 1;
  // Preserve RESONANCE_LABELS order (pyro, hydro, electro, …) for stable output.
  return Object.keys(RESONANCE_LABELS)
    .filter((el) => (counts[el] ?? 0) >= 2)
    .map((el) => RESONANCE_LABELS[el]);
}
