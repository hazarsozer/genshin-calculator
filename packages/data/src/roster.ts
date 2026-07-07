import type { DbObjectChar, DbObjectWeapon } from "@genshin/types";
import * as chars from "./characters/index.js";
import * as weapons from "./weapons/index.js";

/** Every ported character, as an array (the named barrel re-exported flat). */
export const ALL_CHARACTERS: readonly DbObjectChar[] = Object.values(chars) as DbObjectChar[];
/** Every ported weapon, as an array. */
export const ALL_WEAPONS: readonly DbObjectWeapon[] = Object.values(weapons) as DbObjectWeapon[];
