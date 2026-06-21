/**
 * computeBuild — the single typed engine wrapper the UI calls.
 *
 * A thin browser-side adapter over the engine's `reconstructPort` (the SAME
 * build reconstruction goldenConfig.test.ts and the differential-parity harness
 * use). It maps a `BuildForm` + an already-assembled stat block + equipped sets
 * onto `reconstructPort`, then evaluates every compiled feature closure into a
 * `[non-crit, crit, average]` triple. The engine itself is golden-tested; this
 * wrapper only needs to be a faithful BuildForm → reconstructPort mapping, which
 * the golden-anchor test (lib/__tests__/calc.test.ts) proves.
 *
 * `statBlock` and `setBonuses` are passed in (assembled upstream from GOOD /
 * manual input by the form layer), so this function is purely the engine bridge.
 */

import {
  buildSettings,
  reconstructPort,
  type BuildLevels,
  type EquippedSet,
  type ReconstructInput,
} from "@genshin/data";
import {
  buildSetRegistry,
  findCharacter,
  findWeapon,
  resolveWeaponStatTable,
} from "./catalog";
import type { BuildForm, ComputeResult, FeatureResult } from "./types";

const humanize = (key: string): string =>
  key
    .split(/[._]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

export function computeBuild(
  form: BuildForm,
  statBlock: Record<string, number>,
  setBonuses: readonly EquippedSet[]
): ComputeResult {
  const char = findCharacter(form.characterKey);
  const weapon = findWeapon(form.weaponKey);
  if (!char || !weapon) {
    return { features: [], error: "Select a character and weapon." };
  }

  const settings = buildSettings({
    constellation: form.constellation,
    weaponRefine: form.weaponRefine,
    toggles: form.conditions.toggles,
    stacks: form.conditions.stacks,
    ...(form.conditions.infusion ? { infusion: form.conditions.infusion } : {}),
  });

  const setRegistry = buildSetRegistry();
  const artifactSets: Record<string, number> = {};
  for (const s of setBonuses) artifactSets[s.setKey] = s.pieces;

  // ReconstructInput.levels is typed as `typeof LEVELS` (literal 90/6) but is only
  // ever read as plain numbers (forwarded verbatim to buildStats, which wants
  // BuildLevels: all `number`). User-driven levels are general numbers, so we widen
  // through BuildLevels — a sound structural match the over-narrow interface rejects.
  const levels: BuildLevels = {
    charLevel: form.charLevel,
    ascension: form.ascension,
    weaponLevel: form.weaponLevel,
    weaponAscension: form.weaponAscension,
  };

  try {
    const { compiled, context } = reconstructPort({
      char,
      weapon,
      weaponStatTable: resolveWeaponStatTable(weapon),
      statBlock,
      settings,
      passiveOn: true,
      artifactSets,
      setRegistry,
      levels: levels as ReconstructInput["levels"],
      talents: form.talents,
      enemy: form.enemy,
    });

    const features: FeatureResult[] = Object.entries(compiled).map(([key, fn]) => {
      // CompiledFeature returns DamageResult = { normal, crit, avg } — always an
      // object, never an array (packages/types/src/damage.ts:23, feature.ts:636).
      const r = fn(context);
      const triple: [number, number, number] = [r.normal, r.crit, r.avg];
      return { key, label: humanize(key), triple };
    });
    return { features };
  } catch (e) {
    return {
      features: [],
      error: e instanceof Error ? e.message : "Calculation failed.",
    };
  }
}
