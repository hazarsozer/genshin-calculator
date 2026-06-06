/**
 * Chasca — anemo bow (Natlan, Nightsoul).
 *
 * Multi-shot "Shadowhunt" mechanic: her charged skill shots convert to TEAM
 * elements (pyro/hydro/electro/cryo), modelled exactly like Venti's burst
 * element-absorb — each element variant is its own feature sharing one talent
 * table, differing only in `element` (so the per-element DMG bonus / RES key
 * apply correctly).
 *
 * Three families of element variants in the fixture (each = pyro/hydro/electro/cryo):
 *   - skill.chasca_shining_shadowhunt_shell_<elem>_dmg  (s2.p4)
 *   - skill.chasca_burning_shadowhunt_shot_<elem>_dmg   (s2.p4 × A4 1.5)
 *   - burst.chasca_radiant_soulreaping_shell_<elem>_dmg (s3.p3)
 * Plus the anemo "base" shells (shadowhunt_shell s2.p3, its A4 burning shot
 * s2.p3 × 1.5).
 *
 * A1 (Bullet Trick) bonus `dmg_charged_elem_chasca` = 0 in the solo/no-resonance
 * build: ConditionCalcElementsChasca only contributes when `resonance_element_*`
 * settings name a non-anemo team element (none here), so the element shells get
 * NO extra A1 DMG%. Confirmed numerically: electro vs pyro shell ratio = exactly
 * the +2% `dmg_electro` from the stat block, so the chasca bonus term is 0.
 *
 * A4 (Intent to Cover) burning-shadowhunt variants: raw applies them via
 * `scalingMultiplier: 1.5` (A4AnemoDmg/100) on the multiplier, which the engine's
 * baseDamageTerm does NOT read. Equivalent and faithful: fold the ×1.5 into the
 * talent% by wrapping the table (1.5 × talent% × atk = talent% × atk × 1.5).
 * Verified: burning/shining shell ratio = 1.5000 in the fixture.
 *
 * C0 build: the C2 `other`-category element shells and C6 `crit_dmg_chasca` are
 * OFF (constellation-gated) → omitted. The skill shell's `critDamageBonuses:
 * ['crit_dmg_chasca']` reads 0 at C0, so it is left off (no behavioural change).
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Chasca.js
 *   raw/genshin_calc_pub/src/js/classes/Condition/CalcElementsChasca.js (A1 = 0 solo)
 *   raw/genshin_calc_pub/src/js/classes/Feature2/Multiplier.js:getTreeBonusMultiplier (scalingMultiplier ×1.5)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Chasca)
 */

import type {
  Condition,
  DbObjectChar,
  Feature,
  TalentResolver,
  TalentTable,
} from "@genshin/types";
import { Chasca as ChascaStatTable } from "../generated/charTables.js";
import { Chasca as ChascaTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// A4 scaling helper: wrap a talent table so getValue → 1.5 × original.
// Mirrors FeatureMultiplier.scalingMultiplier = A4AnemoDmg/100 = 1.5 applied as
// a CConst factor on the per-multiplier base. Engine reads talent% × atk only,
// so folding ×1.5 into talent% is exact.
// ---------------------------------------------------------------------------

const A4_SCALE = 1.5; // A4AnemoDmg / 100 (raw Chasca.js: A4AnemoDmg = 150)

function scaled(table: TalentTable, factor: number): TalentTable {
  return { getValue: (level: number) => table.getValue(level) * factor };
}

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string): TalentTable {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return ChascaTalents.s1.p1;
      if (name === "normal_hit_2") return ChascaTalents.s1.p2;
      if (name === "normal_hit_3") return ChascaTalents.s1.p3;
      if (name === "normal_hit_4") return ChascaTalents.s1.p4;
      if (name === "aimed") return ChascaTalents.s1.p5;
      if (name === "charged_aimed") return ChascaTalents.s1.p6;
      if (name === "plunge") return ChascaTalents.s1.p7;
      if (name === "plunge_low") return ChascaTalents.s1.p8;
      if (name === "plunge_high") return ChascaTalents.s1.p9;
    }
    if (talent === "skill") {
      if (name === "chasca_activation_dmg") return ChascaTalents.s2.p1;
      if (name === "chasca_multi_aim_press_dmg") return ChascaTalents.s2.p2;
      if (name === "chasca_shadowhunt_shell_dmg") return ChascaTalents.s2.p3;
      if (name === "chasca_shining_shadowhunt_shell_dmg") return ChascaTalents.s2.p4;
    }
    if (talent === "burst") {
      if (name === "chasca_galesplitting_soulreaper_shell_dmg") return ChascaTalents.s3.p1;
      if (name === "chasca_soulreaping_shell_dmg") return ChascaTalents.s3.p2;
      if (name === "chasca_radiant_soulreaping_shell_dmg") return ChascaTalents.s3.p3;
    }
    throw new Error(`chasca talents: unknown path '${path}'`);
  },
};

const ABSORB_ELEMENTS = ["pyro", "hydro", "electro", "cryo"] as const;

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
  // normal_hit_3: 2-hit multihit parent (same multiplier × 2).
  // raw: FeatureDamageMultihit({ name:'normal_hit_3', items:[{ hits:2, multipliers:[p3] }] })
  {
    name: "normal_hit_3",
    category: "attack",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_3") }] },
    ],
  },
  // normal_hit_3_1: one of the 2 sub-hits (half the parent).
  // raw: FeatureDamageNormal({ isChild:true, ... }) — emit as regular (loader drops isChild).
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
  // --- Charged attacks (bow: aimed = tap shot physical, charged_aimed = anemo) ---
  {
    name: "aimed",
    isAimed: true,
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.aimed") }],
  },
  {
    name: "charged_aimed",
    isAimed: true,
    category: "attack",
    damageType: "charged",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_aimed") }],
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
    tags: ["plunge_shockwave"],
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_low") }],
  },
  {
    name: "plunge_high",
    tags: ["plunge_shockwave"],
    category: "attack",
    damageType: "plunge",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.plunge_high") }],
  },
  // --- Skill: Spirit Reins, Shadow Hunt ---
  // Activation hit (anemo skill).
  {
    name: "chasca_activation_dmg",
    category: "skill",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.chasca_activation_dmg") }],
  },
  // Multi-aim press: anemo, but raw types it FeatureDamageNormal (damageType normal).
  {
    name: "chasca_multi_aim_press_dmg",
    category: "skill",
    damageType: "normal",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.chasca_multi_aim_press_dmg") }],
  },
  // Base shadowhunt shell (anemo, charged-type). raw carries critDamageBonuses
  // ['crit_dmg_chasca'] (C6) — 0 at C0, so omitted (no behavioural change).
  {
    name: "chasca_shadowhunt_shell_dmg",
    category: "skill",
    damageType: "charged",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.chasca_shadowhunt_shell_dmg") }],
  },
  // Shining shadowhunt shells: per-element charged shots (s2.p4).
  // raw: damageBonuses ['dmg_charged_elem_chasca'] (A1=0 solo) + critDamageBonuses
  // ['crit_dmg_chasca'] (C6=0). Both read 0 here → omitted.
  ...ABSORB_ELEMENTS.map((elem): Feature => ({
    name: `chasca_shining_shadowhunt_shell_${elem}_dmg`,
    category: "skill",
    damageType: "charged",
    element: elem,
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.chasca_shining_shadowhunt_shell_dmg") }],
  })),
  // A4 burning shadowhunt shot (anemo base shell × 1.5).
  {
    name: "chasca_burning_shadowhunt_shot_dmg",
    category: "skill",
    damageType: "charged",
    element: "anemo",
    multipliers: [
      { leveling: "char_skill_elemental", values: scaled(talents.get("skill.chasca_shadowhunt_shell_dmg"), A4_SCALE) },
    ],
  },
  // A4 burning shadowhunt shots: per-element shells × 1.5.
  ...ABSORB_ELEMENTS.map((elem): Feature => ({
    name: `chasca_burning_shadowhunt_shot_${elem}_dmg`,
    category: "skill",
    damageType: "charged",
    element: elem,
    multipliers: [
      { leveling: "char_skill_elemental", values: scaled(talents.get("skill.chasca_shining_shadowhunt_shell_dmg"), A4_SCALE) },
    ],
  })),
  // --- Burst: Soul Reaper's Fatal Round ---
  // Galesplitting soulreaper shell (anemo).
  {
    name: "chasca_galesplitting_soulreaper_shell_dmg",
    category: "burst",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.chasca_galesplitting_soulreaper_shell_dmg") }],
  },
  // Soulreaping shell (anemo).
  {
    name: "chasca_soulreaping_shell_dmg",
    category: "burst",
    element: "anemo",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.chasca_soulreaping_shell_dmg") }],
  },
  // Radiant soulreaping shells: per-element burst shots (s3.p3).
  ...ABSORB_ELEMENTS.map((elem): Feature => ({
    name: `chasca_radiant_soulreaping_shell_${elem}_dmg`,
    category: "burst",
    element: elem,
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.chasca_radiant_soulreaping_shell_dmg") }],
  })),
  // C2 "Muzzle — The Searing Smoke": cons-added element-infused charged hits at 400% ATK.
  // Raw: Chasca.js features FeatureDamageCharged per elem, category:'other' (→ "other" fixture key),
  // values:StatTable([400]), source:'constellation2', condition:ConditionConstellation({constellation:2}).
  // category omitted = engine maps undefined → "other" (per collei.ts precedent).
  // Raw: Chasca.js:332-344.
  ...ABSORB_ELEMENTS.map((elem): Feature => ({
    name: `chasca_c2_${elem}_dmg`,
    damageType: "charged",
    element: elem,
    condition: { type: "constellation", constellation: 2 },
    multipliers: [
      {
        leveling: "char_skill_attack",
        values: { getValue: (_level: number) => 400 },
        source: "constellation2",
      },
    ],
  })),
];

// ---------------------------------------------------------------------------
// Constellation conditions (P2.C)
// ---------------------------------------------------------------------------
// C1 "Cylinder — The Restless Roulette": ConditionStatic display-only → SKIP.
// C2 "Muzzle — The Searing Smoke": ConditionStatic display-only (real damage = features above) → SKIP.
// C3: +3 levels to Spirit Reins, Shadow Hunt (skill). Raw cons[2] settings char_skill_elemental_bonus:3.
// C4 "Sparks — The Sudden Shot": ConditionStatic display-only → SKIP.
// C5: +3 levels to Soul Reaper's Fatal Round (burst). Raw cons[4] settings char_skill_burst_bonus:3.
// C6 "Showdown — The Glory of Battle": ConditionBoolean toggle (crit_dmg_chasca:120) → SKIP (toggle OFF).
// Raw: Chasca.js constellation array (Chasca.js:376-443).
const constellationConditions: readonly Condition[] = [
  // C3: +3 levels to elemental skill.
  { type: "constellation", constellation: 3, settings: { char_skill_elemental_bonus: 3 } },
  // C5: +3 levels to elemental burst.
  { type: "constellation", constellation: 5, settings: { char_skill_burst_bonus: 3 } },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const chasca: DbObjectChar = {
  name: "chasca",
  gameId: 10000104,
  rarity: 5,
  element: "anemo",
  weapon: "bow",
  origin: "natlan",
  statTable: ChascaStatTable,
  talents,
  features,
  multipliers: [],
  conditions: constellationConditions,
  // Source: raw/genshin_calc_pub/src/js/db/Char/Chasca.js (partyData: empty conditions)
  partyData: {},
};
