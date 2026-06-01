/**
 * Kinich — dendro claymore ATK scaler (fixed solo C0 build, Nightsoul/stacks OFF).
 *
 * Normals/midair/charged/plunge are standard claymore PHYSICAL hits (no element
 * override, mirrors razor). `kinich_midair_dmg` is a FeatureDamageNormal (fixture
 * damageType "normal"). The three plunge variants (collision + low/high shockwave)
 * are damageType "plunge".
 *
 * Skill (Riding High) is dendro:
 *   - kinich_loop_shot_dmg: a plain single-hit FeatureDamageSkill (1× s2.p1). The
 *     `type:'multihit', hits:2` in raw lives only on the talent-display item, NOT
 *     on the damage feature — the feature itself has a single multiplier.
 *   - kinich_scalespiker_cannon_dmg: base multiplier ONLY (s2.p2). Its second
 *     multiplier is the A4 "Flame-Spirit Pact" stack bonus, gated on
 *     ConditionBoolean('kinich_flame_spirit_pact') (a 0-stack toggle, OFF in the
 *     fixed solo build), so it does not fire. Its raw damageBonuses/critDamageBonuses
 *     (dmg_skill_kinich / crit_dmg_skill_kinich) are minted only by C1/C2 — absent
 *     at C0 — so they are omitted.
 *
 * Burst (Hail to the Almighty Dragonlord) is dendro: burst_dmg + kinich_laser_dmg.
 *
 * No always-on C0 passive stat folds: A1 (The Price of Desolation) is ConditionStatic
 * description-only (no stats); A4 (Flame-Spirit Pact) is the stack toggle above.
 * The ascension secondary stat is already folded into the generated stat table.
 * C6 adds kinich_scalespiker_cannon_bounce_dmg (FeatureDamageSkill, fixed 700%, dendro,
 * ConditionConstellation(6)). C3 skill bump / C5 burst bump. C1/C2/C4 are boolean
 * toggles (SKIP). The Nightsoul cannon stack (A4) and NightSoul features remain OFF.
 *
 * Fixture features NOT modelled here (engine/weapon-generated, not char features):
 *   reaction.{burning,electrocharged,rupture,shatter} (transformative reactions),
 *   weapon.bell_shield (The Bell passive shield). These appear as coverage gaps,
 *   identical to every other ported character (e.g. cyno).
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Kinich.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Kinich)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Kinich)
 */

import type { Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Kinich as KinichStatTable } from "../generated/charTables.js";
import { Kinich as KinichTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return KinichTalents.s1.p1;
      if (name === "normal_hit_2") return KinichTalents.s1.p2;
      if (name === "normal_hit_3") return KinichTalents.s1.p3;
      if (name === "kinich_midair_dmg") return KinichTalents.s1.p9;
      if (name === "charged_hit") return KinichTalents.s1.p4;
      if (name === "plunge") return KinichTalents.s1.p6;
      if (name === "plunge_low") return KinichTalents.s1.p7;
      if (name === "plunge_high") return KinichTalents.s1.p8;
    }
    if (talent === "skill") {
      if (name === "kinich_loop_shot_dmg") return KinichTalents.s2.p1;
      if (name === "kinich_scalespiker_cannon_dmg") return KinichTalents.s2.p2;
    }
    if (talent === "burst") {
      if (name === "burst_dmg") return KinichTalents.s3.p1;
      if (name === "kinich_laser_dmg") return KinichTalents.s3.p2;
    }
    throw new Error(`kinich talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (physical claymore, no element override) ---
  {
    name: "normal_hit_1",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1") }],
  },
  {
    name: "normal_hit_2",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_2") }],
  },
  {
    name: "normal_hit_3",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }],
  },
  // kinich_midair_dmg: FeatureDamageNormal (fixture damageType "normal").
  {
    name: "kinich_midair_dmg",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.kinich_midair_dmg") }],
  },
  // --- Charged attack (physical, no element override) ---
  {
    name: "charged_hit",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }],
  },
  // --- Plunge attacks ---
  {
    name: "plunge",
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge") }],
  },
  {
    name: "plunge_low",
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_low") }],
  },
  {
    name: "plunge_high",
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_high") }],
  },
  // --- Skill: Riding High (dendro) ---
  {
    name: "kinich_loop_shot_dmg",
    category: "skill",
    element: "dendro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.kinich_loop_shot_dmg") }],
  },
  {
    name: "kinich_scalespiker_cannon_dmg",
    category: "skill",
    element: "dendro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.kinich_scalespiker_cannon_dmg") }],
  },
  // --- Burst: Hail to the Almighty Dragonlord (dendro) ---
  {
    name: "burst_dmg",
    category: "burst",
    element: "dendro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") }],
  },
  {
    name: "kinich_laser_dmg",
    category: "burst",
    element: "dendro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.kinich_laser_dmg") }],
  },
  // --- C6 "Auspicious Beast's Shape": cons-added skill bounce hit (700% fixed, dendro).
  // FeatureDamageSkill gated by ConditionConstellation(6). Fixed value (ValueTable([700])).
  // damageBonuses/critDamageBonuses mirror the raw feature spec (gated by C1/C2 toggles,
  // evaluate to 0 with toggles off — base-safe). Raw Kinich.js:230-244.
  {
    name: "kinich_scalespiker_cannon_bounce_dmg",
    category: "skill",
    element: "dendro",
    damageBonuses: ["dmg_skill_kinich"],
    critDamageBonuses: ["crit_dmg_skill_kinich"],
    condition: { type: "constellation", constellation: 6 },
    multipliers: [
      {
        leveling: "char_skill_elemental",
        values: { getValue: (_level: number) => 700 },
        source: "constellation6",
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Constellation conditions (P2.C)
// ---------------------------------------------------------------------------
// C1 "Parrot's Beak": ConditionBoolean toggle (move_speed/crit_dmg_skill_kinich) — SKIP.
// C2 "Tiger Beetle's Palm": two ConditionBoolean toggles (enemy_res_dendro/dmg_skill_kinich) — SKIP.
// C3: +3 levels to Riding High (skill). Raw cons[2] char_skill_elemental_bonus:3.
//   NOTE: reversed order — C3=elemental, C5=burst (not the usual C3=elemental/C5=burst alias,
//   but here it IS C3=elemental actually). Raw Kinich.js:328-335.
// C4 "Hummingbird's Feather": ConditionBoolean toggle (dmg_burst_kinich:70) — SKIP (toggle OFF).
// C5: +3 levels to Hail to the Almighty Dragonlord (burst). Raw cons[4] char_skill_burst_bonus:3.
// C6 "Auspicious Beast's Shape": ConditionStatic display-only; actual damage is the feature above.
// Raw: db/Char/Kinich.js constellation array (Kinich.js:290-369).
const constellationConditions: readonly Condition[] = [
  // C3: +3 levels to Riding High (elemental skill).
  { type: "constellation", constellation: 3, settings: { char_skill_elemental_bonus: 3 } },
  // C5: +3 levels to Hail to the Almighty Dragonlord (burst).
  { type: "constellation", constellation: 5, settings: { char_skill_burst_bonus: 3 } },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const kinich: DbObjectChar = {
  name: "kinich",
  gameId: 10000101,
  rarity: 5,
  element: "dendro",
  weapon: "claymore",
  origin: "natlan",
  statTable: KinichStatTable,
  talents,
  features,
  multipliers: [],
  conditions: constellationConditions,
};
