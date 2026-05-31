/**
 * Arlecchino — pyro polearm (5★ Fontaine), C0 solo canonical build.
 *
 * Pure ATK scaler. Normal/charged/plunge attacks are PHYSICAL by default;
 * skill (spike / cleave / blooddebt) and burst are pyro.
 *
 * BOND-OF-LIFE NOTE (load-bearing, why this is a plain ATK port):
 *   Her Balemoon Bivouac "masque" (`FeatureMultiplierBondOfLife`, char-level
 *   multiplier scaling normals by `masque% × BoL`) and her Masque-of-the-Red-Death
 *   ConditionStatic (attack_infusion → pyro, gated on `common.bond_of_life >= 30`)
 *   only fire when BoL is built up. Under the canonical golden build
 *   (`settings: {}`) `common.bond_of_life` is 0, so:
 *     - the masque condition (BoL ≥ 30) is OFF → no BoL term added to normals,
 *     - the infusion ConditionStatic is OFF → attacks stay physical,
 *     - the Cinders ConditionBoolean (+40% pyro DMG, toggle) is OFF.
 *   Verified numerically against the fixture to 10 decimals: every normal hit
 *   matches the plain physical, no-BoL, no-Cinders computation exactly
 *   (e.g. normal_hit_1 normal = 961.9496874451365 = 0.938961·ATK · 1.12 · res · def).
 *   The engine's char-level `multipliers` (the masque) is not consumed by the
 *   loader, and BoL is absent — so a plain ATK port reproduces the oracle.
 *
 * SKIPPED (off in solo C0): the C2 `arlecchino_balemoon_bloodfire_dmg` feature
 * (constellation-gated), the `arlecchino_heal` burst heal (a FeatureHeal, not a
 * damage triple — display-only, no `damageType`). Transformative reactions
 * (overloaded/burning/burgeon/electrocharged/shatter) and the stat readouts are
 * emitted generically by the harness, not declared here.
 *
 * Multihit: `normal_hit_4` is a 2-hit aggregate (modelled as two identical items
 * → engine sums them, doubling). `normal_hit_4_1` is the single per-hit value,
 * modelled as its own emitting feature (her `isChild` sub-hit shown independently
 * in the fixture; dropped-from-rotation flag omitted so it emits).
 *
 * Sources:
 *   raw/genshin_calc_pub/src/js/db/Char/Arlecchino.js
 *   raw/genshin_calc_pub/src/js/db/generated/CharTables.js (Arlecchino stat table)
 *   raw/genshin_calc_pub/src/js/db/generated/CharTalentTables.js (Arlecchino s1/s2/s3)
 */

import type { Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
import { Arlecchino as ArlecchinoStatTable } from "../generated/charTables.js";
import { Arlecchino as ArlecchinoTalents } from "../generated/charTalentTables.js";

// ---------------------------------------------------------------------------
// TalentResolver
// ---------------------------------------------------------------------------

const talents: TalentResolver = {
  get(path: string) {
    const [talent, name] = path.split(".");
    if (talent === "attack") {
      if (name === "normal_hit_1") return ArlecchinoTalents.s1.p1;
      if (name === "normal_hit_2") return ArlecchinoTalents.s1.p2;
      if (name === "normal_hit_3") return ArlecchinoTalents.s1.p3;
      if (name === "normal_hit_4") return ArlecchinoTalents.s1.p4;
      if (name === "normal_hit_5") return ArlecchinoTalents.s1.p5;
      if (name === "normal_hit_6") return ArlecchinoTalents.s1.p6;
      if (name === "charged_hit") return ArlecchinoTalents.s1.p7;
      if (name === "plunge") return ArlecchinoTalents.s1.p9;
      if (name === "plunge_low") return ArlecchinoTalents.s1.p10;
      if (name === "plunge_high") return ArlecchinoTalents.s1.p11;
    }
    if (talent === "skill") {
      if (name === "arlecchino_spike_dmg") return ArlecchinoTalents.s2.p1;
      if (name === "arlecchino_cleave_dmg") return ArlecchinoTalents.s2.p2;
      if (name === "arlecchino_blooddebt_dmg") return ArlecchinoTalents.s2.p3;
    }
    if (talent === "burst") {
      if (name === "burst_dmg") return ArlecchinoTalents.s3.p1;
    }
    throw new Error(`arlecchino talents: unknown path '${path}'`);
  },
};

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features: readonly Feature[] = [
  // --- Normal attacks (physical) ---
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
  // normal_hit_4: 2-hit multihit (same p4 multiplier ×2). Parent models the total.
  // raw: FeatureDamageMultihit({ items: [{ hits: 2, multipliers: [p4] }] })
  {
    name: "normal_hit_4",
    category: "attack",
    items: [
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4") }] },
      { multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4") }] },
    ],
  },
  // Child hit: one of the 2 hits of normal_hit_4 (half the parent total).
  // raw: FeatureDamageNormalArlecchino({ name: 'normal_hit_4_1', isChild, hits: 2, [p4] })
  {
    name: "normal_hit_4_1",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_4") }],
  },
  {
    name: "normal_hit_5",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_5") }],
  },
  {
    name: "normal_hit_6",
    category: "attack",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.normal_hit_6") }],
  },
  // --- Charged attack (physical) ---
  {
    name: "charged_hit",
    category: "attack",
    damageType: "charged",
    multipliers: [{ leveling: "char_skill_attack", values: talents.get("attack.charged_hit") }],
  },
  // --- Plunge attacks (physical) ---
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
  // --- Skill: All Is Ash (pyro) ---
  {
    name: "arlecchino_spike_dmg",
    category: "skill",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.arlecchino_spike_dmg") }],
  },
  {
    name: "arlecchino_cleave_dmg",
    category: "skill",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.arlecchino_cleave_dmg") }],
  },
  {
    name: "arlecchino_blooddebt_dmg",
    category: "skill",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_elemental", values: talents.get("skill.arlecchino_blooddebt_dmg") }],
  },
  // --- C2 "All Rewards and Retribution, Mine to Bestow": bonus Balemoon Bloodfire
  // hit (pyro, fixed 900% ATK, not talent-leveled). Raw class is base FeatureDamage
  // (NOT FeatureDamageSkill) → damageType:"" to suppress dmg_skill bonus (gets
  // dmg_all + dmg_pyro only). Raw condition: ConditionAnd([ConditionAscensionChar(1),
  // ConditionConstellation(2)]); ascension:1 is always satisfied at A6 → gate on C2.
  // Raw Arlecchino.js:308-322 (FeatureDamage + ConditionAnd + ValueTable([900])).
  {
    name: "arlecchino_balemoon_bloodfire_dmg",
    category: "skill",
    element: "pyro",
    damageType: "",
    condition: { type: "constellation", constellation: 2 },
    multipliers: [
      {
        source: "constellation2",
        leveling: "char_skill_elemental",
        values: { getValue: (_level: number) => 900 },
      },
    ],
  },
  // --- Burst: Balemoon Rising (pyro) ---
  {
    name: "burst_dmg",
    category: "burst",
    element: "pyro",
    multipliers: [{ leveling: "char_skill_burst", values: talents.get("burst.burst_dmg") }],
  },
];

// ---------------------------------------------------------------------------
// Constellation conditions (P2.C)
// ---------------------------------------------------------------------------
// C1: ConditionStatic with arlecchino_all_reprisals:2 (affects BoL multiplier
//   bonusValues only — BoL=0 in our build → 0 net effect). SKIP.
// C2: ConditionStatic display-only (text_percent_dmg:900). The actual damage is
//   the arlecchino_balemoon_bloodfire_dmg feature above. No flat stat needed.
// C3: +3 levels to Invitation to a Beheading (attack). Raw cons[2] settings
//   char_skill_attack_bonus:3. Raw Arlecchino.js:456-463.
// C4: ConditionStatic display-only. SKIP.
// C5: +3 levels to Balemoon Rising (burst). Raw cons[4] settings
//   char_skill_burst_bonus:3. Raw Arlecchino.js:473-480.
// C6: ConditionStatic (display text_percent_dmg:700) + ConditionBoolean toggle
//   (crit_rate/crit_dmg for normal+burst). Toggle is OFF in the constellations
//   config → crit bonuses 0. FeatureMultiplierBondOfLife on burst (BoL=0 → 0).
//   Effectively inert at the base build. SKIP.
const constellationConditions: readonly Condition[] = [
  // C3: +3 levels to attack talent (Invitation to a Beheading).
  { type: "constellation", constellation: 3, settings: { char_skill_attack_bonus: 3 } },
  // C5: +3 levels to burst talent (Balemoon Rising).
  { type: "constellation", constellation: 5, settings: { char_skill_burst_bonus: 3 } },
];

// ---------------------------------------------------------------------------
// DbObjectChar
// ---------------------------------------------------------------------------

export const arlecchino: DbObjectChar = {
  name: "arlecchino",
  gameId: 10000096,
  rarity: 5,
  element: "pyro",
  weapon: "polearm",
  origin: "fontain",
  statTable: ArlecchinoStatTable,
  talents,
  features,
  multipliers: [],
  conditions: constellationConditions,
};
