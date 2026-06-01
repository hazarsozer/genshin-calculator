/**
 * Aquila Favonia — 5★ Sword (NOVEL hand-port; weapon FeatureDamage consumer).
 *
 * Passive "Falcon's Defiance":
 *   - Always-on: ATK +20/25/30/35/40% (ConditionStaticRefine, refine-scaled).
 *   - On taking DMG (here always-on in the calc): triggers a heal AND deals
 *     "Falcon's Defiance" AoE damage = 200/230/260/290/320% of ATK. The DAMAGE is
 *     the reason this is a hand-port: it's a `FeatureDamage` the WEAPON itself deals,
 *     which the stat-only wrapper can't express.
 *
 * The proc is PHYSICAL: her `FeatureDamage` defaults `element = 'phys'` when no
 * `element` param is given (Damage.js:26), and Aquila's FeatureDamage passes none —
 * so the wrapper sets `element: "physical"` explicitly (a bare `category: "weapon"`
 * would otherwise resolve to the WIELDER's innate element via `resolveElement`). Its
 * damageType is "none" (her default, Damage.js:27) → no `dmg_<type>` bonus, so the
 * feature key is `weapon.aquila_favonia_aoe` (no damageType field needed; the
 * default-case of `damageTypeOf` already yields ""). Verified exact vs the R1 fixture
 * (hu_tao rep: 2981.8 / 7108.5 / 3394.4 — physical, ATK%-only, full crit_dmg).
 *
 * The single multiplier scales off ATK (her FeatureMultiplier default 'atk*' → the
 * `atk_total` the build supplies) and is REFINE-leveled (`leveling: 'weapon_refine'`),
 * exactly like the heal: `values.getValue(weapon_refine)/100`. The R1/R5 burndown
 * fixtures pin both ends of the refine table.
 *
 * The FeatureHeal (`aquila_favonia_heal`) is out of scope — a non-damage feature
 * (its fixture entry carries no damageType → excluded by the harness's
 * `isDamageTripleEntry`); we declare only the damage proc.
 *
 * serializeId: 2 (raw DbObjectWeapon.serializeId). The `text_percent_hp` /
 * `text_percent_dmg` condition markers (StaffofHoma-style UI text) are not in any
 * buildStats emit list → numeric no-ops, omitted.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Weapon/Sword/AquilaFavonia.js:9-54
 *   raw/genshin_calc_pub/src/js/classes/Feature2/Damage.js:26-27 (element/damageType defaults)
 *   raw/genshin_calc_pub/src/js/classes/Feature2/Multiplier.js (getValue: values.getValue(level)/100, 'atk*')
 */

import type {
  ConditionStaticRefine,
  DbObjectWeapon,
  Feature,
  TalentTable,
} from "@genshin/types";
import { AquilaFavoniaStatTable } from "../generated/weaponStatTables.js";

/**
 * A refine-indexed multiplier table. `getValue(refine)` is 1-indexed (R1 → values[0]),
 * mirroring her `StatTable.getValue(weapon_refine)`. compileFeature divides by 100.
 */
function refineValueTable(values: readonly number[]): TalentTable {
  return { getValue: (refine: number): number => values[refine - 1] ?? 0 };
}

// Always-on ATK +20/25/30/35/40% (AquilaFavonia.js:18-24).
const atkPassive: ConditionStaticRefine = {
  type: "refine",
  title: "talent_name.weapon_aquila_favonia",
  description: "talent_descr.bonus_atk",
  refinementStats: [
    { atk_percent: 20 }, // R1
    { atk_percent: 25 }, // R2
    { atk_percent: 30 }, // R3
    { atk_percent: 35 }, // R4
    { atk_percent: 40 }, // R5
  ],
};

// "Falcon's Defiance" AoE damage proc: 200/230/260/290/320% of ATK, PHYSICAL,
// refine-leveled (AquilaFavonia.js:44-52). category "weapon" + no damageType → the
// produced key is `weapon.aquila_favonia_aoe`.
const aoeProc: Feature = {
  name: "aquila_favonia_aoe",
  category: "weapon",
  element: "physical",
  multipliers: [
    {
      leveling: "weapon_refine",
      values: refineValueTable([200, 230, 260, 290, 320]),
    },
  ],
};

export const aquilaFavonia: DbObjectWeapon = {
  name: "aquila_favonia",
  serializeId: 2,
  gameId: 11501,
  rarity: 5,
  weapon: "sword",
  statTable: AquilaFavoniaStatTable,
  conditions: [atkPassive],
  features: [aoeProc],
};
