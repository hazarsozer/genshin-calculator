import type { FeatureResult } from "./types";

/**
 * Pick the Stage headline: the pinned feature if it still exists in the
 * current result set, otherwise the highest-average feature. Pure function.
 */
export function selectHeadline(
  features: readonly FeatureResult[],
  pinnedFeature?: string,
): FeatureResult | null {
  if (!features.length) return null;
  const pinned = pinnedFeature ? features.find((f) => f.key === pinnedFeature) : undefined;
  if (pinned) return pinned;
  return [...features].sort((a, b) => b.triple[2] - a.triple[2])[0];
}
