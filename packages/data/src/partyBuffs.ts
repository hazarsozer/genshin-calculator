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
 * Party-energy term: her getPartyConditions ALSO pushes one unconditional
 * `Condition({stats: {party_burst_energy_cost: burst.getValue(1)}})` per teammate (Char.js:74-82) —
 * the teammate's burst energy cost. buildStats concats these into the raw stat bag, where the
 * combined-party-energy burst weapons' `fromStatAddend: "party_burst_energy_cost"` postEffect reads
 * the SUM (multiple teammates → additive concat → the party-summed energy). The teammate's burst
 * cost is the `burst_energy_cost` constEntry in its statTable (= her `talents.get('burst.energy_cost')`,
 * e.g. Raiden 90). Absent member / no statTable entry → 0 → the postEffect's base collapses to the
 * wielder's own term (base-inert for non-energy-weapon builds, which carry no such postEffect).
 *
 * Source: raw/genshin_calc_pub/src/js/classes/CalcObject/Buffs.js:149-209
 *         raw/genshin_calc_pub/src/js/classes/DbObject/Char.js:56-97
 *         raw/genshin_calc_pub/src/js/classes/PostEffect/Stats/PartyEnergy.js:5-12
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
    const resolved = resolve(m.character);
    // Unconditional party-energy term (Char.js:74-82): the teammate's burst energy cost,
    // injected as a `party_burst_energy_cost` stat for the combined-party-energy burst weapons'
    // postEffect to sum. Read from the `burst_energy_cost` constEntry in the teammate's statTable
    // (= her `talents.get('burst.energy_cost').getValue(1)`). Multiple teammates → multiple
    // always-active static conditions → buildStats' applyCondition concats them additively.
    const energyCost = resolved.statTable.find((e) => e.getName() === "burst_energy_cost")?.getValue(1, 0) ?? 0;
    if (energyCost) {
      conditions.push({ type: "static", stats: { party_burst_energy_cost: energyCost } });
    }
    const pd = resolved.partyData;
    if (!pd) continue;
    if (pd.conditions) conditions.push(...pd.conditions);
    if (pd.postEffects) postEffects.push(...pd.postEffects);
    if (pd.multipliers) multipliers.push(...pd.multipliers);
  }
  return { conditions, postEffects, multipliers, settings };
}
