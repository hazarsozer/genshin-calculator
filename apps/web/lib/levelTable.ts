/**
 * Aspirine's 14-stop level table: maps slider positions (0–13) to
 * (level, ascension, maxLevel) triples.
 *
 * Ported verbatim from her ObjectBlock.getLevelIndex logic.
 */

export interface LevelStop {
  level: number;
  ascension: number;
  maxLevel: number;
}

export const LEVEL_STOPS: readonly LevelStop[] = [
  { level: 1, ascension: 0, maxLevel: 20 },
  { level: 20, ascension: 0, maxLevel: 20 },
  { level: 20, ascension: 1, maxLevel: 40 },
  { level: 40, ascension: 1, maxLevel: 40 },
  { level: 40, ascension: 2, maxLevel: 50 },
  { level: 50, ascension: 2, maxLevel: 50 },
  { level: 50, ascension: 3, maxLevel: 60 },
  { level: 60, ascension: 3, maxLevel: 60 },
  { level: 60, ascension: 4, maxLevel: 70 },
  { level: 70, ascension: 4, maxLevel: 70 },
  { level: 70, ascension: 5, maxLevel: 80 },
  { level: 80, ascension: 5, maxLevel: 80 },
  { level: 80, ascension: 6, maxLevel: 90 },
  { level: 90, ascension: 6, maxLevel: 90 },
];

/** Max level for each ascension phase (index = ascension 0–6). */
export const ASC_CAPS = [20, 40, 50, 60, 70, 80, 90] as const;

/** Min level at which each ascension becomes valid. */
const ASC_MIN = [1, 20, 40, 50, 60, 70, 80] as const;

/**
 * Return the LEVEL_STOPS index for a (level, ascension) pair.
 * Prefers the exact breakpoint at this ascension; falls back to whichever
 * slot's [level..maxLevel] range contains the level.
 * Faithful to Aspirine's ObjectBlock.getLevelIndex.
 */
export function levelIndex(level: number, ascension: number): number {
  // 1. Prefer exact breakpoint at this ascension
  for (let i = 0; i < LEVEL_STOPS.length; i++) {
    const s = LEVEL_STOPS[i];
    if (s.ascension === ascension && s.level === level) return i;
  }
  // 2. Slot at this ascension whose range contains the level
  for (let i = 0; i < LEVEL_STOPS.length; i++) {
    const s = LEVEL_STOPS[i];
    if (s.ascension === ascension && level >= s.level && level <= s.maxLevel) return i;
  }
  // 3. Any slot whose range contains the level (fallback when ascension can't be matched)
  for (let i = 0; i < LEVEL_STOPS.length; i++) {
    const s = LEVEL_STOPS[i];
    if (level >= s.level && level <= s.maxLevel) return i;
  }
  return LEVEL_STOPS.length - 1;
}

/**
 * Given a typed exact level and the current ascension, return the ascension
 * that should apply. Keeps currentAscension if it is valid for this level;
 * otherwise returns the lowest valid ascension.
 */
export function ascensionForLevel(level: number, currentAscension: number): number {
  const cur = currentAscension;
  if (ASC_CAPS[cur] >= level && ASC_MIN[cur] <= level) return cur;
  for (let a = 0; a <= 6; a++) {
    if (ASC_CAPS[a] >= level && ASC_MIN[a] <= level) return a;
  }
  return 6;
}
