/**
 * partyContext — the universal party publisher (Phase 3 ②, Approach C).
 *
 * Pure function: a party roster → the character-AGNOSTIC derived `party_*` ctx
 * keys her CalcElements / CalcOrigin publishers emit, plus the raw passthrough
 * inputs. Character/constellation-COUPLED publishers (Nahida etc.) are a condition
 * variant (Task C5), NOT here. Absent party ⇒ this is never called ⇒ base path unchanged.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/classes/Condition/CalcElements.js:4-51
 *   raw/genshin_calc_pub/src/js/classes/Condition/CalcOrigin.js:4-44
 */
import type { Element } from "@genshin/types";

export type PartyMember =
  | { readonly character: string }
  | { readonly element: Element; readonly origin?: string };

export interface PartyInput {
  readonly members?: readonly PartyMember[];
  readonly enemyStatus?: string;
  readonly setOther?: readonly string[];
  readonly partyWeapons?: Readonly<Record<string, number>>;
  readonly bondOfLife?: number;
}

export interface ActiveCharFacts {
  readonly element: Element;
  readonly origin?: string;
}

function resolveMember(m: PartyMember, resolve: (slug: string) => ActiveCharFacts): ActiveCharFacts {
  if ("character" in m) return resolve(m.character);
  return m.origin !== undefined ? { element: m.element, origin: m.origin } : { element: m.element };
}

export function buildPartyContext(
  party: PartyInput,
  active: ActiveCharFacts,
  resolve: (slug: string) => ActiveCharFacts = () => {
    throw new Error("buildPartyContext: slug members require a catalog resolver");
  }
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const members = (party.members ?? []).map((m) => resolveMember(m, resolve));

  // CalcElements.js:4-51 — distinct element set includes active char; same/different counted over teammates only
  const distinct = new Set<string>();
  if (active.element) distinct.add(active.element);
  let same = 0;
  let different = 0;
  members.forEach((m, i) => {
    // Dead under the Element type, but mirrors CalcElements.js:14 (`settings[name] || ''`):
    // a member whose element fails to resolve contributes nothing (no distinct/same/different).
    if (!m.element) return;
    distinct.add(m.element);
    if (m.element === active.element) same += 1;
    else different += 1;
    out[`resonance_element_${i + 1}`] = m.element;
  });
  out["party_size"] = members.length + 1;
  out["party_elements_count_level"] = distinct.size;
  out["party_elements_same"] = same;
  out["party_elements_same_inc"] = same + 1;
  out["party_elements_different"] = different;
  out["party_elements_different_total"] = same + different; // = different_chars in CalcElements.js:38

  // CalcOrigin.js:4-44 — origin counts over teammates vs active char's origin
  let originSame = 0;
  let originDifferent = 0;
  for (const m of members) {
    if (!m.origin) continue;
    if (m.origin === active.origin) originSame += 1;
    else originDifferent += 1;
  }
  out["party_origin_same"] = originSame;
  out["party_origin_same_inc"] = originSame + 1;
  out["party_origin_different"] = originDifferent;

  // Raw passthrough inputs
  if (party.enemyStatus !== undefined) out["common.enemy_status"] = party.enemyStatus;
  if (party.bondOfLife !== undefined) out["common.bond_of_life"] = party.bondOfLife;
  for (const s of party.setOther ?? []) out[`set_other.${s}`] = true;
  for (const [k, v] of Object.entries(party.partyWeapons ?? {})) out[`party_weapon_${k}`] = v;

  return out;
}
