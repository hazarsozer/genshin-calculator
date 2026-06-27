/**
 * Shared UI build-state types for the v1 calculator web app.
 *
 * `BuildForm` is the canonical client-side build state every page reads/writes;
 * `computeBuild` (lib/calc.ts) maps it onto the engine's `reconstructPort`.
 */

import type { EquippedSet } from "@genshin/data";

export type ArtifactMode = "good" | "manual";

export interface BuildForm {
  characterKey: string; // DbObjectChar.name
  weaponKey: string; // DbObjectWeapon.name
  charLevel: number; // default 90
  ascension: number; // default 6
  weaponLevel: number; // default 90
  weaponAscension: number; // default 6
  talents: { attack: number; elemental: number; burst: number }; // default 10/10/10
  constellation: number; // 0..6
  weaponRefine: number; // 1..5
  conditions: {
    toggles: Record<string, boolean>;
    stacks: Record<string, number>;
    infusion?: string;
  };
  enemy: { level: number; resistance: number | Record<string, number> };
  artifactMode: ArtifactMode;
  goodJson: string; // raw GOOD text (good mode)
  manualStats: Record<string, number>; // raw-percent Aspirine keys (manual mode)
  manualSets: EquippedSet[]; // manual-mode set picker
}

export interface FeatureResult {
  key: string; // "<category>.<name>"
  label: string; // humanized
  triple: [number, number, number]; // [non-crit, crit, average]
}

export interface ComputeResult {
  features: readonly FeatureResult[];
  error?: string;
  stats?: Readonly<Record<string, number>>;
}
