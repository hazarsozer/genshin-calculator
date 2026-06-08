/**
 * Arlecchino — pyro polearm (5★ Fontaine), C0 solo canonical build.
 *
 * Pure ATK scaler. Normal/charged/plunge attacks are PHYSICAL by default;
 * skill (spike / cleave / blooddebt) and burst are pyro.
 *
 * BOND-OF-LIFE NOTE (load-bearing):
 *   Her Balemoon Bivouac "masque" is a char-level FeatureMultiplierBondOfLife scaling
 *   NORMALS by `masque% × atk_total × bond_of_life`, gated `common.bond_of_life ≥ 30`
 *   (Arlecchino.js:357-372). PORTED (P3.5 bol-multiplier) as the `charMultipliers` entry
 *   below (bondOfLifeFactor + the ≥30 boolean-value gate + C1 bonusValues). Under the
 *   canonical golden build (`settings: {}`) `common.bond_of_life` is 0, so:
 *     - the masque gate (BoL ≥ 30) is OFF AND `bond_of_life` reads 0 → no term on normals,
 *     - the Masque-of-the-Red-Death pyro infusion ConditionStatic is OFF → attacks physical,
 *     - the Cinders ConditionBoolean (+40% pyro DMG, toggle) is OFF.
 *   → every normal hit matches the plain physical, no-BoL computation exactly (the 58k
 *   damage goldens are byte-identical). The masque's BoL≥30 pyro infusion is a settings
 *   contribution a condition can't express; a real BoL≥30 build needs the user to set
 *   `attack_infusion:'pyro'` (see the charMultipliers comment — documented fidelity gap).
 *
 * SKIPPED (off in solo C0): the C2 `arlecchino_balemoon_bloodfire_dmg` feature
 * (constellation-gated). Transformative reactions
 * (overloaded/burning/burgeon/electrocharged/shatter) and the stat readouts are
 * emitted generically by the harness, not declared here.
 *
 * MODELLED: the `arlecchino_heal` burst heal (a FeatureHeal, not a damage triple —
 * display-only, no `damageType`) with BOTH multipliers (ATK term + HP×BoL term);
 * see its block below.
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

import type { CharMultiplier, Condition, DbObjectChar, Feature, TalentResolver } from "@genshin/types";
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
      // Masque of the Red Death — the BoL-multiplier talent (s1.p12 = 238% @L10).
      if (name === "arlecchino_masque") return ArlecchinoTalents.s1.p12;
    }
    if (talent === "skill") {
      if (name === "arlecchino_spike_dmg") return ArlecchinoTalents.s2.p1;
      if (name === "arlecchino_cleave_dmg") return ArlecchinoTalents.s2.p2;
      if (name === "arlecchino_blooddebt_dmg") return ArlecchinoTalents.s2.p3;
    }
    if (talent === "burst") {
      if (name === "burst_dmg") return ArlecchinoTalents.s3.p1;
      if (name === "arlecchino_heal_atk") return ArlecchinoTalents.s3.p4;
      if (name === "arlecchino_heal") return ArlecchinoTalents.s3.p3;
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
  // --- arlecchino_heal: burst heal (FeatureHeal, subtractBoL:true) ---
  // raw: FeatureHeal({ category:'burst', name:'arlecchino_heal', subtractBoL:true,
  //   multipliers:[
  //     new FeatureMultiplier({ leveling:'char_skill_burst',
  //       values: Talents.get('burst.arlecchino_heal_atk') }),          ← M1: ATK-scaled (s3.p4=150%)
  //     new FeatureMultiplierBondOfLife({ scaling:'hp*', leveling:'char_skill_burst',
  //       values: Talents.get('burst.arlecchino_heal') }),               ← M2: HP-scaled × BoL% (s3.p3=150%)
  //   ] })  Arlecchino.js:340-355.
  // Both multipliers are now ported. Her FeatureHeal is the sum of the two base-damage terms times
  // the healing-bonus factor, minus the subtractBoL pool (Feature2/Heal.js:88-99):
  //   heal = [ 1.5×ATK_total + 1.5×HP_total×BoL ] × (1 + healing + healing_base + healing_recv)
  //          − BoL × HP_total
  // M2's `bondOfLifeFactor:true` adds the `bond_of_life` treeBonus factor (BondOfLife.js:9-11),
  // reading the `out` 0.5 FRACTION (setting 50 → 0.5) — the SAME factor the masque/Clorinde heals
  // read. subtractBoL (compileFeature.ts:763-765) is her DISTINCT `−BoL×HP` term, NOT a duplicate.
  // Base-inert: at BoL=0 → M2 = 0 AND subtract = 0 → only M1 (1.5×ATK_total = 3049.06) contributes;
  // the base arlecchino.json heal + 58k goldens are byte-identical. At BoL 50 the oracle gains the
  // net-positive HP×BoL term (masque fixture: 9631.34) — the partial-port negative-heal bug is closed.
  {
    name: "arlecchino_heal",
    category: "burst",
    output: { kind: "heal", subtractBoL: true },
    multipliers: [
      { leveling: "char_skill_burst", values: talents.get("burst.arlecchino_heal_atk") },
      {
        scaling: "hp*",
        leveling: "char_skill_burst",
        values: talents.get("burst.arlecchino_heal"),
        bondOfLifeFactor: true,
      },
    ],
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
// Char-level multipliers
// ---------------------------------------------------------------------------
// Balemoon Bivouac "masque": her NORMAL attacks get an ADDITIVE base-damage term
// `+ masque% × atk_total × bond_of_life`, gated `common.bond_of_life ≥ 30`. Faithful
// port of her char-level FeatureMultiplierBondOfLife (raw Arlecchino.js:357-372):
//   - leveling char_skill_attack, values attack.arlecchino_masque (s1.p12 → 238% @L10),
//   - bondOfLifeFactor:true → the `bond_of_life` (out-fraction) third factor,
//   - target.damageTypes:['normal'] → NORMALS ONLY (charged/plunge/skill/burst excluded),
//   - condition boolean-value common.bond_of_life ≥ 30 (BondOfLifeThreshold),
//   - C1 lever: bonusLeveling 'arlecchino_all_reprisals' + bonusValues [0, C1BonusScale=100]
//     (her ValueTable). At C0 the stack setting is unset → bonusLevel 1 → values[0] = 0 (off);
//     at C1 the ConditionStatic sets arlecchino_all_reprisals:2 → values[1] = 100 → +100% masque.
// Base-inert: at BoL=0 the gate (≥30) is off AND `bond_of_life` reads 0 → no term added →
// the 58k damage goldens are byte-identical. The BoL≥30 pyro infusion (her ConditionStatic
// attack_infusion:'pyro', Arlecchino.js:377-390) is a SEPARATE settings-contribution a
// condition can't express; a real BoL≥30 build needs the user to set `attack_infusion:'pyro'`
// (the oracle fixture sets it explicitly — documented fidelity gap, same class as Candace's
// attack_infusion_hydro). The masque DAMAGE term is the validated correctness gain.
const ARLECCHINO_C1_BONUS = [0, 100] as const; // her ValueTable([0, C1BonusScale=100])
const charMultipliers: readonly CharMultiplier[] = [
  {
    scaling: "atk",
    leveling: "char_skill_attack",
    values: talents.get("attack.arlecchino_masque"),
    bondOfLifeFactor: true,
    bonusLeveling: "arlecchino_all_reprisals",
    bonusValues: {
      getValue: (level: number): number =>
        level > 0 ? ARLECCHINO_C1_BONUS[Math.min(level, ARLECCHINO_C1_BONUS.length) - 1]! : 0,
    },
    condition: { type: "boolean-value", setting: "common.bond_of_life", cond: "ge", value: 30 },
    target: { damageTypes: ["normal"] },
  },
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
  multipliers: charMultipliers,
  conditions: constellationConditions,
};
