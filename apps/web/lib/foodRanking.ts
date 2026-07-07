/**
 * rankFood — pure per-dish headline damage-delta ranking for the Food drawer.
 *
 * Baseline = the CURRENT form's compute (food as-is for `category`). The
 * headline feature key is picked ONCE from the baseline (pinned-or-highest via
 * `selectHeadline`) and the SAME key is read from each candidate's result;
 * falls back to that candidate's own highest-avg feature if the key is absent
 * there (a food swap should never change which features exist, but this keeps
 * the ranking well-defined if it ever does).
 */

import { foodTables, getFoodStats } from "@genshin/data";
import { assembleFromGood, assembleFromManual } from "./artifacts";
import { computeBuild } from "./calc";
import { selectHeadline } from "./headline";
import type { BuildForm } from "./types";

export type FoodType = keyof NonNullable<BuildForm["food"]>;

export interface FoodRankRow {
  key: string;
  tier: number;
  maxTier: number;
  statPills: { stat: string; value: number }[];
  triple: [number, number, number];
  deltaAvg: number;
  equipped: boolean;
}

function assemble(form: BuildForm): {
  statBlock: Record<string, number>;
  setBonuses: readonly import("@genshin/data").EquippedSet[];
} {
  if (form.artifactMode === "good") {
    const { statBlock, setBonuses } = assembleFromGood(form.goodJson);
    return { statBlock, setBonuses };
  }
  return assembleFromManual(form.manualStats, form.manualSets);
}

function maxTierOf(stats: Readonly<Record<string, readonly number[]>>): number {
  return Object.values(stats).reduce((max, values) => Math.max(max, values.length), 0);
}

export function rankFood(form: BuildForm, category: FoodType, allTiers: boolean): FoodRankRow[] {
  const dishes = foodTables[category] ?? {};
  const { statBlock, setBonuses } = assemble(form);

  const baselineResult = computeBuild(form, statBlock, setBonuses);
  const baselineFeature = selectHeadline(baselineResult.features, form.pinnedFeature);
  const headlineKey = baselineFeature?.key;
  const baselineAvg = baselineFeature?.triple[2] ?? 0;

  const equippedSlot = form.food?.[category];

  const candidates: { key: string; tier: number; maxTier: number }[] = [];
  for (const [key, item] of Object.entries(dishes)) {
    const maxTier = maxTierOf(item.stats);
    if (allTiers) {
      for (let tier = 1; tier <= maxTier; tier++) candidates.push({ key, tier, maxTier });
    } else {
      candidates.push({ key, tier: maxTier, maxTier });
    }
  }

  // The currently equipped dish/tier is always present, even under allTiers=false
  // when equipped at a lower-than-max tier.
  if (equippedSlot && dishes[equippedSlot.key]) {
    const alreadyIncluded = candidates.some(
      (c) => c.key === equippedSlot.key && c.tier === equippedSlot.tier
    );
    if (!alreadyIncluded) {
      candidates.push({
        key: equippedSlot.key,
        tier: equippedSlot.tier,
        maxTier: maxTierOf(dishes[equippedSlot.key].stats),
      });
    }
  }

  const rows: FoodRankRow[] = candidates.map(({ key, tier, maxTier }) => {
    const candidateForm: BuildForm = {
      ...form,
      food: { ...form.food, [category]: { key, tier } },
    };
    const result = computeBuild(candidateForm, statBlock, setBonuses);
    const feature =
      (headlineKey && result.features.find((f) => f.key === headlineKey)) ||
      selectHeadline(result.features, form.pinnedFeature);
    const triple: [number, number, number] = feature ? feature.triple : [0, 0, 0];
    const equipped = equippedSlot?.key === key && equippedSlot?.tier === tier;

    return {
      key,
      tier,
      maxTier,
      statPills: Object.entries(getFoodStats(category, key, tier)).map(([stat, value]) => ({
        stat,
        value,
      })),
      triple,
      deltaAvg: triple[2] - baselineAvg,
      equipped,
    };
  });

  return rows.sort((a, b) => b.triple[2] - a.triple[2]);
}
