/**
 * Weapon exemplar barrel — P2.W0 exemplars proving the DbObjectWeapon shape.
 *
 * Exported from here; re-export into @genshin/data is deferred to P2.W1
 * (which owns packages/data/src/index.ts in the parallel task coordination).
 *
 * Weapons:
 *   wolfsGravestone — ConditionStaticRefine (always-on) + ConditionBoolean (toggle)
 *   theCatch        — ConditionStaticRefine (pure refine passive)
 *   lostPrayer      — ConditionStacks (stack + refine-scaled)
 */

export { wolfsGravestone } from "./wolfs-gravestone.js";
export { theCatch } from "./the-catch.js";
export { lostPrayer } from "./lost-prayer.js";
