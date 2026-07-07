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
import { TEAM_BUFF_SETS, OFF_FIELD_WEAPONS } from "./teamBuffs";

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
 * ratioPerStack) that read a `levelSetting`, AND multiplier entries that carry
 * a `leveling` key (FeatureMultiplierEntry.leveling).
 */
export function teammateLevelDefaults(char: DbObjectChar): Record<string, number> {
  const out: Record<string, number> = {};
  for (const pe of char.partyData?.postEffects ?? []) {
    const ls =
      pe.ratioFromTalent?.levelSetting ??
      pe.talentBonus?.levelSetting ??
      pe.ratioPerStack?.levelSetting;
    if (ls) out[ls] = 10;
  }
  for (const m of char.partyData?.multipliers ?? []) {
    if (m.leveling) out[m.leveling] = 10; // multiplier talent-level key (FeatureMultiplierEntry.leveling)
  }
  return out;
}

/**
 * Fold each teammate's off-field Set pick into PartyInput.setOther. Record keys are
 * the gate SLUG (partyContext prepends "set_other."). Plain sets → `true`; VV/Archaic
 * (elementPick) → the element string, multi-teammate same-gate `;`-joined+deduped (the
 * engine's evaluateDropdownElement splits on `;`, shredding every listed element);
 * Scroll (tierPick) → boolean on the tier-specific `${gate}_${tier}` key.
 */
function buildSetOther(members: readonly PartyMemberForm[]): Record<string, string | true> {
  const out: Record<string, string | true> = {};
  for (const m of members) {
    if (!m.setKey) continue;
    const def = TEAM_BUFF_SETS.find((s) => s.gate === m.setKey);
    if (!def) continue; // stale/unknown pick → ignore (no dead key emitted)
    if (def.elementPick) {
      if (!m.setElement) continue;
      const existing = out[def.gate];
      if (typeof existing === "string") {
        const els = existing.split(";");
        if (!els.includes(m.setElement)) out[def.gate] = `${existing};${m.setElement}`;
      } else {
        out[def.gate] = m.setElement;
      }
    } else if (def.tierPick) {
      if (!m.setTier) continue;
      out[`${def.gate}_${m.setTier}`] = true;
    } else {
      out[def.gate] = true;
    }
  }
  return out;
}

/**
 * Fold each teammate's off-field Weapon pick into PartyInput.weaponOther. Record keys
 * are the full gate string (published verbatim), value = the teammate's refine (1–5,
 * default 1). Two teammates carrying the same off-field weapon → the higher refine wins
 * (her ConditionLevelSelect reads a single level; the stronger buff dominates).
 */
function buildWeaponOther(members: readonly PartyMemberForm[]): Record<string, number> {
  const out: Record<string, number> = {};
  const valid = new Set(OFF_FIELD_WEAPONS.map((w) => w.gate));
  for (const m of members) {
    if (!m.weaponKey || !valid.has(m.weaponKey)) continue;
    const refine = m.weaponRefine ?? 1;
    out[m.weaponKey] = Math.max(out[m.weaponKey] ?? 0, refine);
  }
  return out;
}

export function buildPartyInput(
  members: readonly PartyMemberForm[],
  resolveChar: (slug: string) => DbObjectChar | undefined
): PartyInput | undefined {
  const resolved = members.filter((m) => resolveChar(m.slug) !== undefined);
  if (resolved.length === 0) return undefined;
  const setOther = buildSetOther(resolved);
  const weaponOther = buildWeaponOther(resolved);
  return {
    members: resolved.map((m) => {
      const char = resolveChar(m.slug); // defined by the filter above
      const levelDefaults = char ? teammateLevelDefaults(char) : {};
      // user settings win over level defaults
      return { character: m.slug, settings: { ...levelDefaults, ...m.settings } };
    }),
    // Omit empty lanes → a no-pick party stays byte-identical to the pre-Wave-1.5 shape.
    ...(Object.keys(setOther).length > 0 ? { setOther } : {}),
    ...(Object.keys(weaponOther).length > 0 ? { weaponOther } : {}),
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

/**
 * Set one of a teammate's off-field-buff pick fields immutably. `undefined` clears
 * (removes the key) — used by the picker's clear affordance. Other fields are
 * untouched, so e.g. setting setKey leaves a previously-chosen weaponKey intact.
 */
export function setMemberField(
  members: readonly PartyMemberForm[],
  index: number,
  field: "setKey" | "setElement" | "setTier" | "weaponKey" | "weaponRefine",
  value: string | number | undefined
): PartyMemberForm[] {
  return members.map((m, i) => {
    if (i !== index) return m;
    const next = { ...m };
    if (value === undefined) delete next[field];
    else (next as Record<string, unknown>)[field] = value;
    return next;
  });
}

export function activeResonances(elements: readonly string[]): string[] {
  const counts: Record<string, number> = {};
  for (const el of elements) counts[el] = (counts[el] ?? 0) + 1;
  // Preserve RESONANCE_LABELS order (pyro, hydro, electro, …) for stable output.
  return Object.keys(RESONANCE_LABELS)
    .filter((el) => (counts[el] ?? 0) >= 2)
    .map((el) => RESONANCE_LABELS[el]);
}
