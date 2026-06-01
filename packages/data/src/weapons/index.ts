/**
 * Weapon barrel — P2.W0 exemplars + P2.W1 default-weapon passives.
 *
 * Exported from here; re-exported from packages/data/src/index.ts (wired in P2.W1).
 *
 * P2.W0 exemplars (proving DbObjectWeapon shape):
 *   wolfsGravestone — ConditionStaticRefine (always-on) + ConditionBooleanRefine (toggle)
 *   theCatch        — ConditionStaticRefine (pure refine passive)
 *   lostPrayer      — ConditionStacks (stack + refine-scaled)
 *
 * P2.W1 default weapons (oracle-validated via weapon-passive/weapon-refine golden suites):
 *   theAlleyFlash   — ConditionBooleanRefine (sword default)
 *   solarPearl      — ConditionBooleanRefine × 2 (catalyst default)
 *   blackcliffPole  — ConditionStacks (polearm default)
 *   alleyHunter     — ConditionStacks (bow default)
 *   theBell         — ConditionStaticRefine + ConditionBooleanRefine (claymore default)
 */

export { wolfsGravestone } from "./wolfs-gravestone.js";
export { theCatch } from "./the-catch.js";
export { lostPrayer } from "./lost-prayer.js";
export { theAlleyFlash } from "./the-alley-flash.js";
export { solarPearl } from "./solar-pearl.js";
export { blackcliffPole } from "./blackcliff-pole.js";
export { alleyHunter } from "./alley-hunter.js";
export { theBell } from "./the-bell.js";
