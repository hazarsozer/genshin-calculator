/**
 * Artifact input assembly for the web UI.
 *
 * Two entry points:
 *   assembleFromGood  — parse a GOOD-format JSON string and derive statBlock + setBonuses
 *   assembleFromManual — pass raw-percent stats straight through with explicit set bonuses
 *
 * GOOD→Artifact field mapping (the confirm-point):
 *   GOOD `slotKey`  → Artifact `slot`
 *   GOOD `substats` → Artifact `subStats`
 *   GOOD `setKey`, `rarity`, `level`, `mainStatKey` → same field names
 */

import { z } from "zod";
import { assembleArtifactStats, detectSets } from "@genshin/data";
import type { EquippedSet } from "@genshin/data";
import type { Artifact, ArtifactSlot, GoodStatKey } from "@genshin/types";

const SubStatSchema = z.object({
  key: z.string(),
  value: z.number(),
});

const ArtifactSchema = z.object({
  setKey: z.string(),
  slotKey: z.string(),
  level: z.number(),
  rarity: z.number().int().min(1).max(5),
  mainStatKey: z.string(),
  substats: z.array(SubStatSchema),
  location: z.string().optional(),
  lock: z.boolean().optional(),
});

const GoodSchema = z.object({
  format: z.literal("GOOD"),
  artifacts: z.array(ArtifactSchema).optional().default([]),
});

/** Convert a GOOD-format artifact object to the internal `Artifact` type. */
function goodArtifactToInternal(a: z.infer<typeof ArtifactSchema>): Artifact {
  return {
    slot: a.slotKey as ArtifactSlot,
    setKey: a.setKey,
    rarity: a.rarity as 1 | 2 | 3 | 4 | 5,
    level: a.level,
    mainStatKey: a.mainStatKey as GoodStatKey,
    subStats: a.substats.map((s) => ({
      key: s.key as GoodStatKey,
      value: s.value,
    })),
  };
}

/** Parse a GOOD-format JSON string and return statBlock + setBonuses for computeBuild.
 *  Never throws: malformed JSON or invalid GOOD data returns an error string. */
export function assembleFromGood(goodJson: string): {
  statBlock: Record<string, number>;
  setBonuses: EquippedSet[];
  error?: string;
} {
  let parsed: unknown;
  try {
    parsed = JSON.parse(goodJson);
  } catch {
    return { statBlock: {}, setBonuses: [], error: "Not valid JSON." };
  }

  const result = GoodSchema.safeParse(parsed);
  if (!result.success) {
    return { statBlock: {}, setBonuses: [], error: "Not a GOOD-format file." };
  }

  const artifacts = result.data.artifacts.map(goodArtifactToInternal);
  try {
    return {
      statBlock: assembleArtifactStats(artifacts),
      setBonuses: detectSets(artifacts),
    };
  } catch (e) {
    return {
      statBlock: {},
      setBonuses: [],
      error: e instanceof Error ? e.message : "Bad artifact data.",
    };
  }
}

/** Pass raw-percent stats straight through with explicit set bonuses. */
export function assembleFromManual(
  stats: Record<string, number>,
  sets: readonly EquippedSet[]
): { statBlock: Record<string, number>; setBonuses: EquippedSet[] } {
  return { statBlock: { ...stats }, setBonuses: [...sets] };
}
