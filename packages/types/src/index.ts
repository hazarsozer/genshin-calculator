/** @genshin/types — domain interfaces shared across core and data. */

/** A damage triple: [non-crit, crit, expected average]. */
export type DamageTriple = readonly [number, number, number];

export const TYPES_VERSION = "0.0.0";
