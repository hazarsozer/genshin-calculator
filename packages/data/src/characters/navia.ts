/**
 * Navia — geo claymore ATK scaler.
 *
 * Normal combo identical in shape to Diluc (n1, n2, n3-as-3hit-multihit → child
 * _3_1, n4, charged_spin/final, plunge/low/high), plus geo skill (Rosula
 * Shardshot + Surging Blade) and geo burst (cannon volley + fire-support DoT).
 *
 * Crystal-Shrapnel scaling (her FeatureMultiplierNaviaSkill): the skill's
 * Shardshot damage is base-talent% × a `bulletMultiplier` table indexed by the
 * `navia_bullets` setting (capped by stored shrapnel). In the fixed solo-C0
 * golden build the settings are empty → navia_bullets defaults to 1, shrapnel 0,
 * so the multiplier is `bulletMultiplier.getValue(1) = 1.0` (verified against the
 * fixture: shardshot.normal / talent% == surging.normal / talent%, ratio 1.000).
 * The skill therefore reduces to a plain ATK-scaling geo skill — no special
 * multiplier needed. raw: Multiplier/NaviaSkill.js:5,12-20.
 *
 * Unconditional-in-solo-C0 passives: NONE active.
 *   - A1 (undisclosed_distribution_channels): ConditionBoolean toggle + geo
 *     infusion on normals — OFF by default (no infusion in the fixed build).
 *   - A4 (mutual_assistance_network): ATK% scales with nearby Pyro/Hydro/Electro/
 *     Cryo party members — solo build = 0 members = +0% ATK.
 *   - The skill's `dmg_skill_navia` / `crit_*_navia` bonus keys are only minted by
 *     ConditionStaticNavia when ≥4/≥7 shrapnel is stored (and C2/C6) — all 0 in
 *     the C0 shrapnel-0 build, so omitted (they would read as 0 regardless).
 *   The geo ascension stat bonus is already folded into the generated stat table.
 *
 * Skipped (C0 build): all constellations.
 * normal_hit_3 is a 3-hit multihit (parent = 3× single hit; ratio 3.000 vs the
 * _3_1 child); the child `normal_hit_3_1` is emitted as its own single-hit row.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Navia.js
 *   raw/genshin_calc_pub/src/js/classes/Feature2/Multiplier/NaviaSkill.js
 *   raw/genshin_calc_pub/src/js/classes/Condition/Static/Navia.js (shrapnel-gated bonuses)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Navia)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Navia)
 */

import type { DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Navia as NaviaStatTable } from "../generated/charTables.js";
import { Navia as NaviaTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return NaviaTalents.s1.p1;
      if (name === "normal_hit_2") return NaviaTalents.s1.p2;
      if (name === "normal_hit_3") return NaviaTalents.s1.p3;
      if (name === "normal_hit_4") return NaviaTalents.s1.p4;
      if (name === "charged_spin") return NaviaTalents.s1.p5;
      if (name === "charged_final") return NaviaTalents.s1.p6;
      if (name === "plunge") return NaviaTalents.s1.p9;
      if (name === "plunge_low") return NaviaTalents.s1.p10;
      if (name === "plunge_high") return NaviaTalents.s1.p11;
    }
    if (talent === "skill") {
      if (name === "navia_rosula_shardshot_base_dmg") return NaviaTalents.s2.p1;
      if (name === "surging_blade_dmg") return NaviaTalents.s2.p5;
    }
    if (talent === "burst") {
      if (name === "burst_dmg") return NaviaTalents.s3.p1;
      if (name === "navia_cannon_fire_support_dmg") return NaviaTalents.s3.p2;
    }
    throw new Error(`navia talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks ---
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
  // normal_hit_3: 3-hit multihit (same multiplier × 3). Parent models the total.
  // raw: FeatureDamageMultihit({ items: [{ hits: 3, multipliers: [p3] }] })
  {
    name: "normal_hit_3",
    category: "attack",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }] },
    ],
  },
  // Child hit: one of the 3 hits of normal_hit_3 (a third of the parent total).
  // raw: FeatureDamageNormal({ name: "normal_hit_3_1", isChild: true }) — child flag
  // dropped so the engine emits this independent fixture feature.
  {
    name: "normal_hit_3_1",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }],
  },
  {
    name: "normal_hit_4",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4") }],
  },
  // --- Charged attacks ---
  {
    name: "charged_spin",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_spin") }],
  },
  {
    name: "charged_final",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_final") }],
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
  // --- Skill: Ceremonial Crystalshot (geo) ---
  // Rosula Shardshot: bulletMultiplier == 1.0 in the solo-C0 build (see header),
  // so a plain ATK-scaling geo skill. dmg_skill_navia / crit_*_navia bonus keys
  // are shrapnel-gated (0 here) and omitted.
  {
    name: "navia_rosula_shardshot_dmg",
    category: "skill",
    element: "geo",
    multipliers: [
      { leveling: "char_skill_elemental", values: talents.get("skill.navia_rosula_shardshot_base_dmg") },
    ],
  },
  {
    name: "surging_blade_dmg",
    category: "skill",
    element: "geo",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.surging_blade_dmg") }],
  },
  // --- Burst: As the Sunlit Sky's Singing Salute (geo) ---
  {
    name: "burst_dmg",
    category: "burst",
    element: "geo",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") }],
  },
  {
    name: "navia_cannon_fire_support_dmg",
    category: "burst",
    element: "geo",
    multipliers: [
      { leveling: "char_skill_burst", values: talents.get("burst.navia_cannon_fire_support_dmg") },
    ],
  },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const navia: DbObjectChar = {
  name: "navia",
  gameId: 10000091,
  rarity: 5,
  element: "geo",
  weapon: "claymore",
  origin: "fontaine",
  statTable: NaviaStatTable,
  talents,
  features,
  multipliers: [],
};
