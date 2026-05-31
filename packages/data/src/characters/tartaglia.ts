/**
 * Tartaglia (Childe) — hydro bow.
 *
 * The fixture is the RANGED build (his "Raging Tide" melee stance toggle OFF):
 *   - normal_hit_1..6: physical bow ranged normals (char_skill_attack). The melee
 *     stance normals (char_skill_elemental, gated on `tartaglia_raging_tide`) and
 *     their multihit children are OFF, so they are not produced.
 *   - aimed: physical charged shot; charged_aimed: fully-charged HYDRO arrow.
 *   - tartaglia_tide_flash / tartaglia_tide_burst: hydro normals, unconditional.
 *     (raw `tide_flash` carries `hits: 3`, but FeatureDamageNormal ignores `hits`
 *     — only FeatureDamageMultihit reads it — so it is a single-hit value, matching
 *     the small fixture average.)
 *   - plunge / plunge_low / plunge_high: physical, ranged (NOT raging_tide).
 *   - skill.activation_dmg / skill.tartaglia_slash_dmg: hydro skill, unconditional.
 *   - burst.burst_dmg: hydro burst, RANGED variant (s3.p3 `tartaglia_burst_dmg_ranged`,
 *     gated on NOT raging_tide; the melee s3.p1 variant is OFF).
 *   - burst.tartaglia_riptide_blast_dmg: hydro burst, unconditional.
 *
 * Reactions (electrocharged / rupture / shatter) are auto-emitted generically from
 * the hydro element by the engine; not declared here.
 *
 * No always-on passive damage/crit bonuses to fold: A1 "Never-Ending" and A4
 * "Sword of Torrents" are ConditionStatic with no `stats`/`settings` (text/riptide
 * only). All constellation bonuses are C0-off.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Tartaglia.js
 *   raw/genshin_calc_pub/src/js/classes/Feature2/Damage/Normal.js (hits is a no-op here)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Tartaglia)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Tartaglia)
 */

import type { DbObjectChar, Feature, TalentResolver, TalentTable } from "@genshin/types";
import { Tartaglia as TartagliaStatTable } from "../generated/charTables.js";
import { Tartaglia as TartagliaTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// Unconditional +1 Normal-Attack talent level
// ---------------------------------------------------------------------------

/**
 * Tartaglia's kit applies an UNCONDITIONAL `char_skill_attack_bonus: 1` (his A1
 * "Never-Ending" passive), which `Feature.getTalentLevel` adds to the talent
 * level of every `category: "attack"` feature — normals, aimed/charged shots,
 * the hydro tide normals, and plunges — so they evaluate at talent level 11 in
 * the 10/10/10 fixed build, while skill/burst stay at 10.
 *   raw/genshin_calc_pub/src/js/db/Char/Tartaglia.js (conditions: char_skill_attack_bonus: 1)
 *   raw/genshin_calc_pub/src/js/classes/Feature.js:233-236 (getTalentLevel)
 *
 * The compile engine has no per-feature talent-level offset, so we faithfully
 * fold the +1 into the data: wrap each attack table so getValue(level) reads one
 * talent level higher. (Same data-wrapping technique fischl.ts uses for its A1
 * derived table.) The attack tables have 15 entries, so level 11 is in range.
 */
function plusOneLevel(table: TalentTable): TalentTable {
  return { getValue: (level: number) => table.getValue(level + 1) };
}

// ---------------------------------------------------------------------------
// TalentResolver (only the ranged-build paths the OFF-stance fixture needs)
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return TartagliaTalents.s1.p1;
      if (name === "normal_hit_2") return TartagliaTalents.s1.p2;
      if (name === "normal_hit_3") return TartagliaTalents.s1.p3;
      if (name === "normal_hit_4") return TartagliaTalents.s1.p4;
      if (name === "normal_hit_5") return TartagliaTalents.s1.p5;
      if (name === "normal_hit_6") return TartagliaTalents.s1.p6;
      if (name === "aimed") return TartagliaTalents.s1.p7;
      if (name === "charged_aimed") return TartagliaTalents.s1.p8;
      if (name === "tartaglia_tide_flash") return TartagliaTalents.s1.p9;
      if (name === "tartaglia_tide_burst") return TartagliaTalents.s1.p10;
      if (name === "plunge") return TartagliaTalents.s1.p11;
      if (name === "plunge_low") return TartagliaTalents.s1.p12;
      if (name === "plunge_high") return TartagliaTalents.s1.p13;
    }
    if (talent === "skill") {
      if (name === "activation_dmg") return TartagliaTalents.s2.p1;
      if (name === "tartaglia_slash_dmg") return TartagliaTalents.s2.p11;
    }
    if (talent === "burst") {
      // RANGED burst (NOT raging_tide). Melee variant is s3.p1, OFF here.
      if (name === "tartaglia_burst_dmg_ranged") return TartagliaTalents.s3.p3;
      if (name === "tartaglia_riptide_blast_dmg") return TartagliaTalents.s3.p2;
    }
    throw new Error(`tartaglia talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Ranged normal attacks (physical bow, char_skill_attack) ---
  {
    name: "normal_hit_1",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: plusOneLevel(talents.get("attack.normal_hit_1")) }],
  },
  {
    name: "normal_hit_2",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: plusOneLevel(talents.get("attack.normal_hit_2")) }],
  },
  {
    name: "normal_hit_3",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: plusOneLevel(talents.get("attack.normal_hit_3")) }],
  },
  {
    name: "normal_hit_4",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: plusOneLevel(talents.get("attack.normal_hit_4")) }],
  },
  {
    name: "normal_hit_5",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: plusOneLevel(talents.get("attack.normal_hit_5")) }],
  },
  {
    name: "normal_hit_6",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: plusOneLevel(talents.get("attack.normal_hit_6")) }],
  },
  // --- Charged (aimed) shots ---
  // aimed: physical charged shot
  {
    name: "aimed",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: plusOneLevel(talents.get("attack.aimed")) }],
  },
  // charged_aimed: fully-charged hydro arrow
  {
    name: "charged_aimed",
    category: "attack",
    damageType: "charged",
    element: "hydro",
    multipliers: [{ leveling: "char_skill_attack", values: plusOneLevel(talents.get("attack.charged_aimed")) }],
  },
  // --- Hydro normal variants (unconditional; FeatureDamageNormal, element hydro) ---
  {
    name: "tartaglia_tide_flash",
    category: "attack",
    damageType: "normal",
    element: "hydro",
    multipliers: [{ leveling: "char_skill_attack", values: plusOneLevel(talents.get("attack.tartaglia_tide_flash")) }],
  },
  {
    name: "tartaglia_tide_burst",
    category: "attack",
    damageType: "normal",
    element: "hydro",
    multipliers: [{ leveling: "char_skill_attack", values: plusOneLevel(talents.get("attack.tartaglia_tide_burst")) }],
  },
  // --- Plunge attacks (physical, ranged stance) ---
  {
    name: "plunge",
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: plusOneLevel(talents.get("attack.plunge")) }],
  },
  {
    name: "plunge_low",
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: plusOneLevel(talents.get("attack.plunge_low")) }],
  },
  {
    name: "plunge_high",
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: plusOneLevel(talents.get("attack.plunge_high")) }],
  },
  // --- Skill: Foul Legacy: Raging Tide (hydro, unconditional) ---
  {
    name: "activation_dmg",
    category: "skill",
    element: "hydro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.activation_dmg") }],
  },
  {
    name: "tartaglia_slash_dmg",
    category: "skill",
    element: "hydro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.tartaglia_slash_dmg") }],
  },
  // --- Burst: Havoc: Obliteration (hydro) ---
  // burst_dmg: ranged variant (NOT raging_tide).
  {
    name: "burst_dmg",
    category: "burst",
    element: "hydro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.tartaglia_burst_dmg_ranged") }],
  },
  {
    name: "tartaglia_riptide_blast_dmg",
    category: "burst",
    element: "hydro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.tartaglia_riptide_blast_dmg") }],
  },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const tartaglia: DbObjectChar = {
  name: "tartaglia",
  gameId: 10000033,
  rarity: 5,
  element: "hydro",
  weapon: "bow",
  origin: "snezhnaya",
  statTable: TartagliaStatTable,
  talents,
  features,
  multipliers: [],
};
