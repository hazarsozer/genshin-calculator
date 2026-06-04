/**
 * buildPartyBuffs — the teammate kit-buff deriver (P3.5.2).
 *
 * For each {character} teammate in the roster, resolve its DbObjectChar and pull its
 * `partyData` (conditions/postEffects/multipliers), accumulating the teammate's own baked
 * `settings`. Returns the four lists `buildStats` appends at the three existing buff-channel
 * insertion points — the per-teammate analogue of the CHARACTER_* globals. Her engine concats
 * each teammate's getPartyConditions/Multipliers/PostEffects onto the active calc's lists.
 *
 * {element,origin} members carry no kit buff (resonance only) and are skipped. Absent members
 * => empty => buildStats' base path is byte-identical (the 58k-golden guard).
 *
 * Source: raw/genshin_calc_pub/src/js/classes/CalcObject/Buffs.js:149-209
 *         raw/genshin_calc_pub/src/js/classes/DbObject/Char.js:56-97
 */
import type { Condition, CharPostEffect, CharMultiplier, DbObjectChar } from "@genshin/types";
import type { PartyInput } from "./partyContext.js";

export interface PartyBuffs {
  readonly conditions: readonly Condition[];
  readonly postEffects: readonly CharPostEffect[];
  readonly multipliers: readonly CharMultiplier[];
  readonly settings: Readonly<Record<string, unknown>>;
}

export function buildPartyBuffs(
  party: PartyInput,
  resolve: (slug: string) => DbObjectChar
): PartyBuffs {
  const conditions: Condition[] = [];
  const postEffects: CharPostEffect[] = [];
  const multipliers: CharMultiplier[] = [];
  let settings: Record<string, unknown> = {};
  for (const m of party.members ?? []) {
    if (!("character" in m)) continue; // {element,origin} => resonance only, no kit buff
    if (m.settings) settings = { ...settings, ...m.settings };
    const pd = resolve(m.character).partyData;
    if (!pd) continue;
    if (pd.conditions) conditions.push(...pd.conditions);
    if (pd.postEffects) postEffects.push(...pd.postEffects);
    if (pd.multipliers) multipliers.push(...pd.multipliers);
  }
  return { conditions, postEffects, multipliers, settings };
}
