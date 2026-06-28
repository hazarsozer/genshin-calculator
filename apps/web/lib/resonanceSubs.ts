import type { ConditionControl } from "./conditions";

/** Resonance sub-effect controls → the element whose resonance gates them. */
const RESONANCE_SUB_ELEMENT: Readonly<Record<string, string>> = {
  "common.char_status_shield": "geo",   // geo resonance: +15% DMG while shielded
  "buffs.resonance_geo_attack": "geo",  // geo resonance: enemy geo RES −20
  "buffs.resonance_dendro_1": "dendro", // dendro resonance: +30 EM after a dendro-core reaction
  "buffs.resonance_dendro_2": "dendro", // dendro resonance: +20 EM after burning/bloom/etc.
};

/** Elements present >= 2 times among [active char + teammates] → the resonating set. */
export function resonatingElements(elements: readonly string[]): Set<string> {
  const counts: Record<string, number> = {};
  for (const el of elements) counts[el] = (counts[el] ?? 0) + 1;
  return new Set(Object.keys(counts).filter((el) => counts[el] >= 2));
}

/**
 * Split global controls into (a) resonance sub-toggles to show under Resonance —
 * only when their element resonates — and (b) the rest (true globals like
 * imaginarium_theatre). A resonance sub whose element is NOT resonating is dropped
 * (it would be engine-inert anyway).
 */
export function partitionResonanceSubs(
  controls: readonly ConditionControl[],
  resonating: ReadonlySet<string>
): { resonanceSubs: ConditionControl[]; rest: ConditionControl[] } {
  const resonanceSubs: ConditionControl[] = [];
  const rest: ConditionControl[] = [];
  for (const c of controls) {
    const el = RESONANCE_SUB_ELEMENT[c.name];
    if (el !== undefined) {
      if (resonating.has(el)) resonanceSubs.push(c);
      continue;
    }
    if (c.name.includes("resonance")) continue; // any other resonance-named control stays roster-driven
    rest.push(c);
  }
  return { resonanceSubs, rest };
}
