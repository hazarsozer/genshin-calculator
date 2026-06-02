/**
 * Crimson Moon's Semblance — 5★ Polearm (NOVEL hand-port; ConditionBooleanValue consumer).
 *
 * Two DMG bonuses gated by the wielder's Bond-of-Life amount: DMG +12/16/20/24/28% while BoL > 0,
 * and an extra +24/32/40/48/56% while BoL ≥ 30% of Max HP (her `ConditionBooleanValue` sub-gates on
 * `common.bond_of_life`). In a solo C0 build with no Bond-of-Life, `common.bond_of_life` is absent
 * (→ 0) → both gates are false → INERT (the rep sits at base). The BoL input
 * (`ConditionNumberBondOfLife`) is omitted — absent reads 0, identical to a 0-BoL input. The
 * BoL-active case + the input model defer to ② (Bond-of-Life). The `text_percent` markers are UI.
 *
 * serializeId: 172. Sources: raw/.../Weapon/Polearm/CrimsonMoonsSemblance.js.
 */

import type { ConditionStaticRefine, DbObjectWeapon } from "@genshin/types";
import { CrimsonMoonsSemblanceStatTable } from "../generated/weaponStatTables.js";

// DMG +12..28% while Bond-of-Life > 0 (INERT in solo: common.bond_of_life absent → 0 >= 1 false).
const bolDmg: ConditionStaticRefine = {
  type: "refine",
  title: "talent_name.weapon_crimson_moons_semblance",
  description: "talent_descr.weapon_crimson_moons_semblance_1",
  refinementStats: [{ dmg_all: 12 }, { dmg_all: 16 }, { dmg_all: 20 }, { dmg_all: 24 }, { dmg_all: 28 }],
  condition: { type: "boolean-value", setting: "common.bond_of_life", cond: "ge", value: 1 },
};

// Extra DMG +24..56% while Bond-of-Life ≥ 30% (INERT in solo).
const bolDmgHigh: ConditionStaticRefine = {
  type: "refine",
  title: "talent_name.weapon_crimson_moons_semblance",
  description: "talent_descr.weapon_crimson_moons_semblance_2",
  refinementStats: [{ dmg_all: 24 }, { dmg_all: 32 }, { dmg_all: 40 }, { dmg_all: 48 }, { dmg_all: 56 }],
  condition: { type: "boolean-value", setting: "common.bond_of_life", cond: "ge", value: 30 },
};

export const crimsonMoonsSemblance: DbObjectWeapon = {
  name: "crimson_moons_semblance",
  serializeId: 172,
  gameId: 13512,
  rarity: 5,
  weapon: "polearm",
  statTable: CrimsonMoonsSemblanceStatTable,
  conditions: [bolDmg, bolDmgHigh],
};
