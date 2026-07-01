/**
 * Tartaglia (Childe) — hydro bow.
 *
 * STANCE SWAP: the "Raging Tide" (Foul Legacy) melee toggle `tartaglia_raging_tide`
 * swaps his ranged bow moveset for a HYDRO melee moveset. Her engine gates the ranged
 * set with `ConditionNot([tartaglia_raging_tide])` and the melee set with
 * `ConditionBoolean(it)`, and the toggle publishes `attack_infusion: 'hydro'` so the
 * (otherwise-physical) melee normals/charged resolve hydro. Both stances are modelled;
 * the golden/fixture build has the stance OFF (the RANGED set produced).
 *
 * RANGED set (stance OFF, `NOT tartaglia_raging_tide`):
 *   - normal_hit_1..6: physical bow ranged normals (char_skill_attack).
 *   - aimed: physical charged shot; charged_aimed: fully-charged HYDRO arrow.
 *   - tartaglia_tide_flash / tartaglia_tide_burst: hydro normals, unconditional.
 *     (raw `tide_flash` carries `hits: 3`, but FeatureDamageNormal ignores `hits`
 *     — only FeatureDamageMultihit reads it — so it is a single-hit value, matching
 *     the small fixture average.)
 *   - plunge / plunge_low / plunge_high: physical, ranged (NOT raging_tide).
 *   - skill.activation_dmg / skill.tartaglia_slash_dmg: hydro skill, unconditional.
 *   - burst.burst_dmg: hydro burst, RANGED variant (s3.p3 `tartaglia_burst_dmg_ranged`).
 *   - burst.tartaglia_riptide_blast_dmg: hydro burst, unconditional.
 *
 * MELEE set (stance ON, `tartaglia_raging_tide`) — all char_skill_elemental, hydro-infused:
 *   - normal_hit_1..5 (skill.normal_hit_1..5); normal_hit_6 = 2-hit multihit + its two
 *     sub-hit rows normal_hit_6_1/_2 (raw models the sub-hits as FeatureDamageCharged →
 *     damageType 'charged'); charged_hit_total = 2-hit multihit + sub-hits charged_hit_1/_2.
 *   - burst.burst_dmg: MELEE variant (s3.p1 `tartaglia_burst_dmg_melee`).
 *   (The +1 Normal-attack level from A1 does NOT lift the melee set — it is
 *   char_skill_elemental-leveled, so no plusOneLevel wrap. The ranged aimed/plunges have
 *   no melee counterpart → produced only in the ranged stance.)
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

import type { Condition, DbObjectChar, Feature, TalentResolver, TalentTable } from "@genshin/types";
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
      // MELEE stance normals/charged (Raging Tide) — char_skill_elemental leveling,
      // tables live in the SKILL talent group (s2). raw Tartaglia.js:84-113.
      if (name === "normal_hit_1") return TartagliaTalents.s2.p2;
      if (name === "normal_hit_2") return TartagliaTalents.s2.p3;
      if (name === "normal_hit_3") return TartagliaTalents.s2.p4;
      if (name === "normal_hit_4") return TartagliaTalents.s2.p5;
      if (name === "normal_hit_5") return TartagliaTalents.s2.p6;
      if (name === "normal_hit_6_1") return TartagliaTalents.s2.p7;
      if (name === "normal_hit_6_2") return TartagliaTalents.s2.p8;
      if (name === "charged_hit_1") return TartagliaTalents.s2.p9;
      if (name === "charged_hit_2") return TartagliaTalents.s2.p10;
    }
    if (talent === "burst") {
      // RANGED burst (NOT raging_tide) = s3.p3; MELEE burst (raging_tide) = s3.p1.
      if (name === "tartaglia_burst_dmg_ranged") return TartagliaTalents.s3.p3;
      if (name === "tartaglia_burst_dmg_melee") return TartagliaTalents.s3.p1;
      if (name === "tartaglia_riptide_blast_dmg") return TartagliaTalents.s3.p2;
    }
    throw new Error(`tartaglia talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Raging Tide (Foul Legacy) MELEE STANCE toggle
// ---------------------------------------------------------------------------
// When ON, Childe's ranged bow moveset (normals/aimed/plunges + the ranged burst) is
// replaced by a HYDRO melee moveset (char_skill_elemental-leveled normals/charged + the
// melee burst). Her engine gates the ranged set with ConditionNot([tartaglia_raging_tide])
// and the melee set with ConditionBoolean(it), and the toggle publishes
// `attack_infusion: 'hydro'` so the melee normals/charged (no explicit element) resolve
// hydro. raw Tartaglia.js:183-514 (per-feature gates) + 522-533 (the toggle + infusion).
const STANCE: Condition = { type: "boolean", name: "tartaglia_raging_tide" };
const NOT_STANCE: Condition = { type: "not", items: [{ type: "boolean", name: "tartaglia_raging_tide" }] };

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Ranged normal attacks (physical bow, char_skill_attack) — gated OFF in melee stance ---
  {
    name: "normal_hit_1",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: plusOneLevel(talents.get("attack.normal_hit_1")) }],
    condition: NOT_STANCE,
  },
  {
    name: "normal_hit_2",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: plusOneLevel(talents.get("attack.normal_hit_2")) }],
    condition: NOT_STANCE,
  },
  {
    name: "normal_hit_3",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: plusOneLevel(talents.get("attack.normal_hit_3")) }],
    condition: NOT_STANCE,
  },
  {
    name: "normal_hit_4",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: plusOneLevel(talents.get("attack.normal_hit_4")) }],
    condition: NOT_STANCE,
  },
  {
    name: "normal_hit_5",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: plusOneLevel(talents.get("attack.normal_hit_5")) }],
    condition: NOT_STANCE,
  },
  {
    name: "normal_hit_6",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: plusOneLevel(talents.get("attack.normal_hit_6")) }],
    condition: NOT_STANCE,
  },
  // --- Charged (aimed) shots — ranged, gated OFF in melee stance ---
  // aimed: physical charged shot
  {
    name: "aimed",
    isAimed: true,
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: plusOneLevel(talents.get("attack.aimed")) }],
    condition: NOT_STANCE,
  },
  // charged_aimed: fully-charged hydro arrow
  {
    name: "charged_aimed",
    isAimed: true,
    category: "attack",
    damageType: "charged",
    element: "hydro",
    multipliers: [{ leveling: "char_skill_attack", values: plusOneLevel(talents.get("attack.charged_aimed")) }],
    condition: NOT_STANCE,
  },
  // --- Hydro normal variants (unconditional; FeatureDamageNormal, element hydro; present in BOTH stances) ---
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
  // --- Plunge attacks (physical, RANGED stance only — no melee plunge in raw) ---
  {
    name: "plunge",
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: plusOneLevel(talents.get("attack.plunge")) }],
    condition: NOT_STANCE,
  },
  {
    name: "plunge_low",
    tags: ["plunge_shockwave"],
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: plusOneLevel(talents.get("attack.plunge_low")) }],
    condition: NOT_STANCE,
  },
  {
    name: "plunge_high",
    tags: ["plunge_shockwave"],
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: plusOneLevel(talents.get("attack.plunge_high")) }],
    condition: NOT_STANCE,
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
  // burst_dmg: RANGED variant (s3.p3), gated OFF in melee stance.
  {
    name: "burst_dmg",
    category: "burst",
    element: "hydro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.tartaglia_burst_dmg_ranged") }],
    condition: NOT_STANCE,
  },
  {
    name: "tartaglia_riptide_blast_dmg",
    category: "burst",
    element: "hydro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.tartaglia_riptide_blast_dmg") }],
  },
  // ========================================================================
  // RAGING TIDE (melee stance) moveset — parallel HYDRO normals/charged, gated ON.
  // char_skill_elemental leveling; element via the stance's attack_infusion:'hydro'
  // (no explicit element on the normals/charged, so resolveElement infuses them).
  // raw Tartaglia.js:249-408, 495-505. The +1 Normal-attack level (char_skill_attack_bonus)
  // does NOT apply here (these are char_skill_elemental-leveled) → no plusOneLevel wrap.
  // ========================================================================
  {
    name: "normal_hit_1",
    category: "attack",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.normal_hit_1") }],
    condition: STANCE,
  },
  {
    name: "normal_hit_2",
    category: "attack",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.normal_hit_2") }],
    condition: STANCE,
  },
  {
    name: "normal_hit_3",
    category: "attack",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.normal_hit_3") }],
    condition: STANCE,
  },
  {
    name: "normal_hit_4",
    category: "attack",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.normal_hit_4") }],
    condition: STANCE,
  },
  {
    name: "normal_hit_5",
    category: "attack",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.normal_hit_5") }],
    condition: STANCE,
  },
  // normal_hit_6: 2-hit multihit (skill.normal_hit_6_1 + skill.normal_hit_6_2). raw keeps
  // damageType 'attack' on the multihit parent (FeatureDamageMultihit does NOT force a type),
  // so it gets dmg_all + dmg_hydro but NOT dmg_normal (dmg_attack reads 0) — matched here.
  {
    name: "normal_hit_6",
    category: "attack",
    damageType: "attack",
    items: [
      { multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.normal_hit_6_1") }] },
      { multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.normal_hit_6_2") }] },
    ],
    condition: STANCE,
  },
  // normal_hit_6_1 / normal_hit_6_2: the two sub-hits of normal_hit_6, emitted as standalone
  // rows. raw models them as FeatureDamageCharged (isChild) → damageType 'charged' (NOT normal),
  // so they carry dmg_charged. The loader drops isChild → emit plain. raw Tartaglia.js:319-338.
  {
    name: "normal_hit_6_1",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.normal_hit_6_1") }],
    condition: STANCE,
  },
  {
    name: "normal_hit_6_2",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.normal_hit_6_2") }],
    condition: STANCE,
  },
  // charged_hit_total: 2-hit multihit (skill.charged_hit_1 + skill.charged_hit_2), damageType
  // 'charged'. raw Tartaglia.js:362-386.
  {
    name: "charged_hit_total",
    category: "attack",
    damageType: "charged",
    items: [
      { multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.charged_hit_1") }] },
      { multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.charged_hit_2") }] },
    ],
    condition: STANCE,
  },
  // charged_hit_1 / charged_hit_2: the two sub-hits (FeatureDamageCharged isChild → damageType
  // 'charged'), emitted standalone. raw Tartaglia.js:387-408.
  {
    name: "charged_hit_1",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.charged_hit_1") }],
    condition: STANCE,
  },
  {
    name: "charged_hit_2",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.charged_hit_2") }],
    condition: STANCE,
  },
  // burst_dmg: MELEE variant (s3.p1), gated ON in melee stance.
  {
    name: "burst_dmg",
    category: "burst",
    element: "hydro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.tartaglia_burst_dmg_melee") }],
    condition: STANCE,
  },
];

// ---------------------------------------------------------------------------
// Constellations (P2.C Wave-1)
// ---------------------------------------------------------------------------
// C1 "Foul Legacy: Tide Withholder": ConditionStatic with text_percent_cd:20
//   (display-only stat) → SKIP.
// C2 "Foul Legacy: Understream": ConditionStatic no real stats → SKIP.
// C3 "Abyssal Mayhem: Vortex of Turmoil": +3 Elemental Skill talent levels.
//   Raw cons[2]: Condition{ settings:{ char_skill_elemental_bonus:3 } }
// C4 "Abyssal Mayhem: Hydrospout": ConditionStatic no real stats → SKIP.
// C5 "Havoc: Formless Blade": +3 Elemental Burst talent levels.
//   Raw cons[4]: Condition{ settings:{ char_skill_burst_bonus:3 } }
// C6 "Havoc: Annihilation": ConditionStatic no real stats → SKIP.
// Sources: raw/genshin_calc_pub/src/js/db/Char/Tartaglia.js:551-608

const constellationConditions: readonly Condition[] = [
  // C3 "Abyssal Mayhem: Vortex of Turmoil" — +3 Elemental Skill talent levels.
  // Raw cons[2]: Condition{ settings:{ char_skill_elemental_bonus:3 } }
  { type: "constellation", constellation: 3, settings: { char_skill_elemental_bonus: 3 } },
  // C5 "Havoc: Formless Blade" — +3 Elemental Burst talent levels.
  // Raw cons[4]: Condition{ settings:{ char_skill_burst_bonus:3 } }
  { type: "constellation", constellation: 5, settings: { char_skill_burst_bonus: 3 } },
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
  // Raging Tide melee-stance toggle: publishes `attack_infusion: 'hydro'` so the
  // char_skill_elemental-leveled melee normals/charged (no explicit element) resolve hydro.
  // The moveset swap itself is via the per-feature STANCE / NOT_STANCE gates above.
  // (raw's display-only `charged_stamina_cost: 20` stat is omitted — inert for damage.)
  // raw/genshin_calc_pub/src/js/db/Char/Tartaglia.js:522-533.
  conditions: [
    { type: "boolean", name: "tartaglia_raging_tide", settings: { attack_infusion: "hydro" } },
    ...constellationConditions,
  ],
  // partyData — teammate kit buffs (P3.5.2 Bucket A)
  // A1 "Master of Weaponry": always-active static.
  //   settings: { char_skill_attack_bonus_2: 1 } → +1 normal attack talent level to party.
  //   Source: raw/genshin_calc_pub/src/js/db/Char/Tartaglia.js partyData.conditions[0]
  partyData: {
    conditions: [
      {
        type: "static",
        settings: { char_skill_attack_bonus_2: 1 },
      },
    ],
  },
};
