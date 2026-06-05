/**
 * Aloy — cryo bow ATK scaler (collab character, foreign origin).
 *
 * 4-hit normal combo where normal_hit_1 is a 2-sub-hit multihit (tables
 * _1_1 + _1_2, children shown separately), physical aimed shot, fully-charged
 * cryo aimed shot, plunge (collision) + plunge_low/high (shockwave), two cryo
 * skill hits (Frozen Wilds: freeze bomb + chillwater bomblets), cryo burst.
 *
 * NORMALS ARE PHYSICAL in the fixed solo-C0 build. Aloy's cryo infusion comes
 * only from the `aloy_coils` stack condition (sets `attack_infusion: 'cryo'` at
 * max coils via Rushing Ice) — a stack toggle that is OFF under `settings: {}`,
 * so normals/aimed stay physical. Only `charged_aimed`, the two skills, and the
 * burst carry an explicit cryo element. The fixture confirms: normal/aimed are
 * physical (pick up dmg_phys), charged_aimed/skills/burst are cryo.
 *
 * NO always-on passive bonuses at solo C0:
 *   - A1 "Combat Override" (+atk%): ConditionBoolean toggle → OFF at baseline.
 *   - A4 "Strong Strike" (+cryo dmg per coil): ConditionStacks → 0 stacks OFF.
 *   - Coil normal-dmg bonuses: ConditionStacks (coils) → OFF.
 * None fold into baseStats/critRateBonuses/damageBonuses.
 *
 * skill.aloy_atk_decrease is a FeatureStatic (format: percent, damageType: "")
 * — a display row, not a damage triple; the harness filters it, so it is not
 * modelled. The cryo transformative reactions (superconduct, electrocharged,
 * shatter) are emitted generically from the cryo element by the loader.
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Aloy.js
 *   raw/genshin_calc_pub/src/js/classes/Feature2/Damage/Multihit.js (multihit tree)
 *   raw/genshin_calc_pub/src/js/classes/Feature2/Damage/Plunge/ShockWave.js (dmg_plunge_shockwave)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Aloy)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Aloy)
 */

import type { DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Aloy as AloyStatTable } from "../generated/charTables.js";
import { Aloy as AloyTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1_1") return AloyTalents.s1.p1;
      if (name === "normal_hit_1_2") return AloyTalents.s1.p2;
      if (name === "normal_hit_2") return AloyTalents.s1.p3;
      if (name === "normal_hit_3") return AloyTalents.s1.p4;
      if (name === "normal_hit_4") return AloyTalents.s1.p5;
      if (name === "aimed") return AloyTalents.s1.p6;
      if (name === "charged_aimed") return AloyTalents.s1.p7;
      if (name === "plunge") return AloyTalents.s1.p8;
      if (name === "plunge_low") return AloyTalents.s1.p9;
      if (name === "plunge_high") return AloyTalents.s1.p10;
    }
    if (talent === "skill") {
      if (name === "aloy_freeze_bomb_dmg") return AloyTalents.s2.p1;
      if (name === "aloy_chillwater_bomblets") return AloyTalents.s2.p2;
    }
    if (talent === "burst") {
      if (name === "burst_dmg") return AloyTalents.s3.p1;
    }
    throw new Error(`aloy talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks ---
  // normal_hit_1: 2-sub-hit multihit (tables _1_1 + _1_2). Parent = sum of both.
  // raw: FeatureDamageMultihit({ items: [{hits:1, [_1_1]}, {hits:1, [_1_2]}] }).
  // Per-hit bonus/res/def are identical, so Σ(base)×B×R×D ≡ her per-hit sum.
  {
    name: "normal_hit_1",
    category: "attack",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1_1") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1_2") }] },
    ],
  },
  // Sub-hits of normal_hit_1 (raw marks isChild — DROPPED so they emit, since the
  // fixture asserts them as independent features). raw Aloy.js child decls.
  {
    name: "normal_hit_1_1",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1_1") }],
  },
  {
    name: "normal_hit_1_2",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_1_2") }],
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
  {
    name: "normal_hit_4",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4") }],
  },
  // --- Charged attacks (bow aimed shots) ---
  // aimed: physical charged shot (FeatureDamageChargedAimed → damageType="charged").
  {
    name: "aimed",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.aimed") }],
  },
  // charged_aimed: fully-charged cryo arrow.
  {
    name: "charged_aimed",
    category: "attack",
    damageType: "charged",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_aimed") }],
  },
  // --- Plunge attacks ---
  // plunge: collision (FeatureDamagePlungeCollision → damageType="plunge").
  {
    name: "plunge",
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge") }],
  },
  // plunge_low / plunge_high: shockwave (FeatureDamagePlungeShockWave). Its
  // getStatsDmgBonus adds dmg_plunge_shockwave (modelled via damageBonuses;
  // absent from the fixed STAT_BLOCK so it reads 0 — a faithful no-op).
  {
    name: "plunge_low",
    tags: ["plunge_shockwave"],
    category: "attack",
    damageType: "plunge",
    damageBonuses: ["dmg_plunge_shockwave"],
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_low") }],
  },
  {
    name: "plunge_high",
    tags: ["plunge_shockwave"],
    category: "attack",
    damageType: "plunge",
    damageBonuses: ["dmg_plunge_shockwave"],
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_high") }],
  },
  // --- Skill: Frozen Wilds (cryo) ---
  {
    name: "aloy_freeze_bomb_dmg",
    category: "skill",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.aloy_freeze_bomb_dmg") }],
  },
  {
    name: "aloy_chillwater_bomblets",
    category: "skill",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.aloy_chillwater_bomblets") }],
  },
  // --- Burst: Prophecies of Dawn (cryo) ---
  {
    name: "burst_dmg",
    category: "burst",
    element: "cryo",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") }],
  },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const aloy: DbObjectChar = {
  name: "aloy",
  gameId: 10000062,
  rarity: 5,
  element: "cryo",
  weapon: "bow",
  origin: "foreign",
  statTable: AloyStatTable,
  talents,
  features,
  multipliers: [],
  // partyData — teammate kit buffs (P3.5.2 Bucket A)
  // A1 "Combat Override": ConditionBoolean(party.aloy_combat_override) → atk_percent:8.
  //   text_percent_1/text_percent_2 are display-only, skipped.
  //   TalentValues.A1AtkOther=8, TalentValues.A1AtkSelf=16 (self-only, display).
  //   Source: raw/genshin_calc_pub/src/js/db/Char/Aloy.js partyData.conditions[0]
  partyData: {
    conditions: [
      {
        type: "boolean",
        name: "party.aloy_combat_override",
        stats: { atk_percent: 8 },
      },
    ],
  },
};
