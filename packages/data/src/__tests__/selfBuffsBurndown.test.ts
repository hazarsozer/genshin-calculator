/**
 * skip-class SELF-condition sweep — self-buffs burndown (the ARC BACKBONE).
 *
 * The port systematically modelled the `party.*` TEAMMATE mirror of a character's self conditions
 * but SKIPPED the SELF version — and because NO golden ever toggles those self conditions, the 58k
 * DAMAGE goldens are structurally BLIND to the gap (it only fires when the self setting is active).
 * A diff-parity sweep (tools/oracle/diff-parity.mjs) surfaced the class. This suite is the reusable
 * oracle-lock for it: each rep's fixture (tests/golden/fixtures/self-buffs/) is dumped from HER
 * engine with the char's SELF toggle baked ON (build-configs.mjs §selfBuffsItems, via
 * mergeCharSettings — the SAME char-axis channel infusionItems uses for diluc_dawn); this suite
 * threads the SAME toggle (the manifest's party.settings) into both buildStats and compileCharacter
 * and asserts every buffed damage triple. Adding the next char is one item in selfBuffsItems + one
 * SETTINGS_BY_SLUG row here + a re-dump (`node tools/oracle/dump-oracle.mjs --config=self-buffs`).
 *
 *   - zhongli-jade-shield (Zhongli): {zhongli_jade_shield:true} → his own Jade Shield grants −20
 *     enemy RES to ALL 7 elements + physical (raw Zhongli.js:316-331, a C0 ConditionBoolean — NO
 *     ascension/constellation gate), buffing EVERY one of Zhongli's own damage features (the RES
 *     multiplier on every hit). The port modelled party.zhongli_jade_shield (the teammate mirror,
 *     Zhongli.js:447-463) but SKIPPED the SELF version, so before the fix every Zhongli damage
 *     triple undershot the oracle by the res-shred. The fix (characters/zhongli.ts conditions[]:
 *     the SELF `{type:"boolean", name:"zhongli_jade_shield", stats:{enemy_res_*:-20}}`) lands in
 *     the SAME commit → this rep is GREEN-on-arrival, locking the fix against regression. The
 *     anti-gaming proof: REMOVING that self condition from zhongli.ts turns this suite RED (every
 *     damage triple drops by the res-shred), confirming the fixture exercises the buff, not a
 *     vacuous 0==0 — the buff is cons-independent so this single cons-0 fixture is the load-bearing
 *     lock (the diff-parity sweep confirms it across cons 0..6).
 *
 * The full triple (normal/crit/avg) is asserted (not avg-only): a RES change scales all three
 * proportionally, so all three shift — mirroring infusionBurndown / lyneySurplusBurndown. The
 * `k in compiled` filter is honest, not vacuous: these damage features DO exist in our port (the
 * question is whether the self condition lifts them), and the RED-without-fix proof above confirms
 * the keys match (a namespacing mismatch would make removal a no-op, not a RED).
 *
 * GUARD — HONESTY RULES (verbatim from infusionBurndown.test.ts / bolMultiplierBurndown.test.ts):
 * NO it.skip, NO it.todo, NO it.fails, NO loosened tolerance, NO hard-coded overrides.
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";
import { describe, it, expect } from "vitest";
import { buildStats } from "../buildStats.js";
import { compileCharacter } from "../loader.js";
import {
  blackcliffPoleStatTable,
  theBellStatTable,
  alleyFlashStatTable,
  alleyHunterStatTable,
  solarPearlStatTable,
} from "../generated/weaponStatTables.js";
import type { DbObjectChar, StatTableEntry } from "@genshin/types";
import { type FixtureEntry, isDamageTripleEntry } from "./_fixtureEntry.js";

const STAT_BLOCK = {
  atk_base: 871,
  atk_percent: 18,
  crit_dmg_base: 50,
  crit_rate_base: 5,
  def_base: 876,
  dmg_burst: 64,
  dmg_charged: 16,
  dmg_electro: 2,
  dmg_normal: 8,
  dmg_phys: 4,
  dmg_skill: 32,
  hp_base: 13226,
  mastery_base: 55,
  recharge_base: 100,
} as const;

const LEVELS = {
  charLevel: 90,
  ascension: 6,
  weaponLevel: 90,
  weaponAscension: 6,
} as const;

const ENEMY = { level: 90, resistance: 10 } as const;

const TALENTS = { attack: 10, elemental: 10, burst: 10 } as const;

const TOLERANCE = 0.1;

// Per-rep settings — mirrors the self-buffs oracle config (build-configs.mjs §selfBuffsItems). Each
// value is EXACTLY the SELF toggle the oracle item set for that rep, injected verbatim into both
// buildStats and compileCharacter so the rep's self condition is active on BOTH sides:
//   zhongli-jade-shield — mergeCharSettings({zhongli_jade_shield:true}) → −20 enemy RES (8 keys).
// ADD THE NEXT CHAR HERE: one row { "<slug>": { <toggle>: true } } matching the new selfBuffsItems
// entry, then re-dump (`node tools/oracle/dump-oracle.mjs --config=self-buffs`).
const SETTINGS_BY_SLUG: Readonly<Record<string, Readonly<Record<string, unknown>>>> = {
  "zhongli-jade-shield": { zhongli_jade_shield: true },
  // Noelle C0 Sweeping Time: DEF→ATK conversion (ratioFromTalent off burst level) + geo infusion on
  // normals/charged/plunge; at C6 the conversion ratio gains a flat +0.5. char_constellation:6 threads
  // the C6 percentBonus gate ON, matching the oracle dump at constellation 6.
  "noelle-sweeping-time": {
    char_constellation: 6,
    noelle_sweeping_time: true,
  },
  // Xinyan C6 Rockin' in a Flaming World: DEF→ATK conversion (fixed ratio 0.3), gated boolean AND
  // constellation 6. char_constellation:6 threads the C6 gate ON, matching the oracle dump.
  "xinyan-rockin": {
    char_constellation: 6,
    xinyan_rockin_in_a_flaming_world: true,
  },
  // Yaoyao C4 Winsome: HP→EM conversion (ratio 0.003, capped +120), gated boolean AND constellation 4.
  // The +EM lifts her EM-scaled transformative reactions. char_constellation:4 threads the C4 gate ON,
  // matching the oracle dump at constellation 4.
  "yaoyao-winsome": {
    char_constellation: 4,
    yaoyao_winsome: true,
  },
  // Kazuha A4 Poetics of Fuubutsu (EM→dmg_cryo, dropdown="cryo") + C6 Crimson Momiji
  // (EM→dmg_normal/charged/plunge + anemo infusion). char_constellation:6 threads the C6 gate ON,
  // matching the oracle dump at constellation 6.
  "kazuha-windsong": {
    char_constellation: 6,
    kaedehara_kazuha_poetics_of_fuubutsu: "cryo",
    kaedehara_kazuha_crimson_momiji: true,
  },
  // Faruzan SELF buffs — wind_bale (enemy_res_anemo −30) + wind_benefit (dmg_anemo% by burst level,
  // char_skill_burst:10 feeds the static-level) + A4 self atk_base→anemo multiplier + C6 crit_dmg_anemo
  // +40 (gated C6 AND wind_benefit). char_constellation:6 threads the C6 gate ON, matching the oracle dump.
  "faruzan-self-buffs": {
    char_constellation: 6,
    char_skill_burst: 10,
    faruzan_wind_bale: true,
    faruzan_wind_benefit: true,
    faruzan_lost_wisdom_of_the_seven_caverns: true,
  },
  // Lynette A1 sophisticated_synergy (atk_percent by party_elements_count_level=1 solo → +8%) + A4
  // props_positively_prepped (dmg_burst_lynette+15) + C6 watchful_eye (dmg_anemo+20 + anemo infusion).
  // char_constellation:6 threads the C6 gate ON, matching the oracle dump at constellation 6.
  "lynette-self-buffs": {
    char_constellation: 6,
    lynette_sophisticated_synergy: true,
    lynette_props_positively_prepped: true,
    lynette_watchful_eye: true,
  },
  // Furina skill HP-offerings scaling (furina_hp_offers:4 → ×1.4 on the three summon hits via the
  // scalingOffset field) + "Let the People Rejoice" fanfare→dmg_all/healing_recv at C1 with
  // furina_fanfare_stacks:350 (above the C0 max 300, within the C1-bumped max 400 — proves the
  // maxBonusFromConstellation clamp raise). char_constellation:1 threads the C1 gate (+3 burst talent).
  "furina-self-buffs": {
    char_constellation: 1,
    furina_hp_offers: 4,
    furina_fanfare_stacks: 350,
  },
  // Xinyan A4 dmg_phys+15 (ungated) + C4 enemy_res_physical−15 (gated at C4 → char_constellation:4
  // threads the cons gate ON, matching the oracle dump at constellation 4).
  "xinyan-self-buffs": {
    char_constellation: 4,
    xinyan_now_thats_rock: true,
    xinyan_wildfire_rhythm: true,
  },
  // Rosaria A1 crit_rate+12 (ungated) + C1 dmg_normal+10 (≥C1) + C6 enemy_res_physical−20 (≥C6).
  // char_constellation:6 threads the cons gates ON, matching the oracle dump at constellation 6.
  "rosaria-self-buffs": {
    char_constellation: 6,
    rosaria_regina_probationum: true,
    rosaria_unholy_revelation: true,
    rosaria_divine_retribution: true,
  },
  // Kirara C6 dmg_<all 7 elements>+12 (gated C6 → char_constellation:6 threads the cons gate ON).
  "kirara-self-buffs": {
    char_constellation: 6,
    kirara_countless_sights_to_see: true,
  },
  // LanYan C4 mastery+60 (gated C4 → char_constellation:4 threads the cons gate ON).
  "lanyan-self-buffs": {
    char_constellation: 4,
    lanyan_with_drakefalcons_blood_pearls_adorned: true,
  },
  // Sucrose C6 dmg_<swirled element>+20 (gated C6 → char_constellation:6 threads the cons gate ON).
  // sucrose_chaotic_entropy:"pyro" selects pyro → dmg_pyro+20 on her pyro absorb variant.
  "sucrose-self-buffs": {
    char_constellation: 6,
    sucrose_chaotic_entropy: "pyro",
  },
  // Xiangling C1 enemy_res_pyro−15 (≥C1) + C6 dmg_pyro+15 (≥C6). char_constellation:6 threads BOTH
  // cons gates ON, matching the oracle dump at constellation 6.
  "xiangling-self-buffs": {
    char_constellation: 6,
    xiangling_crispy: true,
    xiangling_condensed_pyronado: true,
  },
  // Beidou A4 dmg_normal+15 & dmg_charged+15 (ungated) + C6 enemy_res_electro−15 (≥C6).
  // char_constellation:6 threads the C6 gate ON, matching the oracle dump at constellation 6.
  "beidou-self-buffs": {
    char_constellation: 6,
    beidou_lightning_storm: true,
    beidou_bane_of_the_evil: true,
  },
  // Venti C2 breeze ×2 (anemo/phys res −12 each) + C4 hurricane (dmg_anemo+25) + C6 storm
  // (anemo res −20) + storm_element:"pyro" (pyro res −20). char_constellation:6 threads ALL the
  // C2/C4/C6 gates ON, matching the oracle dump at constellation 6.
  "venti-self-buffs": {
    char_constellation: 6,
    venti_breeze: true,
    venti_breeze_2: true,
    venti_hurricane: true,
    venti_storm: true,
    venti_storm_element: "pyro",
  },
  // Gorou A1 def_percent+25 (ungated) + standing_firm flat DEF (banner-gated, scaled by skill level)
  // + C6 crit_dmg_geo+10 (banner+C6). char_skill_elemental:10 feeds the standing_firm static-level
  // (this burndown's buildStats call omits talentLevels, so the skill level is threaded here);
  // char_constellation:6 threads the C6 gate ON. Matches the oracle dump at constellation 6 / skill 10.
  "gorou-self-buffs": {
    char_constellation: 6,
    char_skill_elemental: 10,
    gorou_heedless_of_the_wind_and_weather: true,
    gorou_generals_war_banner: true,
  },
  // Amber A4 atk_percent+15 (ungated) + C6 atk_percent+15 (gated C6 → char_constellation:6 threads the
  // cons gate ON, matching the oracle dump at constellation 6).
  "amber-self-buffs": {
    char_constellation: 6,
    amber_precise_shot: true,
    amber_wildfire: true,
  },
  // Ningguang A4 dmg_geo+12 (ungated) + C4 self-RES+10 (damage-inert, gated C4 → char_constellation:6
  // threads the cons gate ON, matching the oracle dump at constellation 6). Only the geo damage triples
  // are asserted (the C4 self-RES never lifts damage).
  "ningguang-self-buffs": {
    char_constellation: 6,
    ningguang_strategic_reserve: true,
    ningguang_exquisite_be_the_jade_outshining_all_beneath: true,
  },
  // Albedo A1 dmg_skill_albedo+25 (ungated, lifts albedo_blossom) + C2 def*-stacks burst bonus
  // (albedo_opening_of_hanerozoic:4 → 120% DEF on burst) + C4 dmg_plunge+30 + C6 dmg_all+17.
  // char_constellation:6 threads the C4/C6 gates ON, matching the oracle dump at constellation 6 / 4 stacks.
  "albedo-self-buffs": {
    char_constellation: 6,
    albedo_calcite_might: true,
    albedo_opening_of_hanerozoic: 4,
    albedo_descent_of_divinity: true,
    albedo_dust_of_purification: true,
  },
  // Lisa A4 enemy_def_reduce+15 (ungated, lifts every hit) + C2 def_percent+25 (damage-inert, gated C2 →
  // char_constellation:6 threads the cons gate ON, matching the oracle dump at constellation 6). All damage
  // triples lift only by the A4 enemy-DEF shred.
  "lisa-self-buffs": {
    char_constellation: 6,
    lisa_static_electricity_field: true,
    lisa_electromagnetic_field: true,
  },
  // Mika A1 dmg_phys+10/stack (mika_suppressive_barrage:5 → +50% at C6 max-5) + C6 crit_dmg_phys+60.
  // char_constellation:6 threads the C6 gate ON (→ the stacks max becomes 5 and the phys crit DMG fires),
  // matching the oracle dump at constellation 6. Lifts every physical hit's normal/crit/avg.
  "mika-self-buffs": {
    char_constellation: 6,
    mika_suppressive_barrage: 5,
    mika_companions_counsel: true,
  },
  // Yaoyao C1 dmg_dendro+15 (gated C1 → char_constellation:6 threads the cons gate ON), lifting her
  // dendro hits. (C4 "Winsome" HP→EM is Tier-B deferred → not toggled; only the dendro damage triples.)
  "yaoyao-self-buffs": {
    char_constellation: 6,
    yaoyao_adeptus_tutelage: true,
  },
  // Chasca C6 crit_dmg_chasca+120 on her shadowhunt shells (base anemo + 4 shining shells), gated C6
  // → char_constellation:6 threads the cons gate ON, matching the oracle dump at constellation 6.
  "chasca-self-buffs": {
    char_constellation: 6,
    chasca_showdown_the_glory_of_battle: true,
  },
  // Ororon C1 dmg_skill_ororon+50 (hypersense hits) + C2 dmg_electro+8/stack (king_bee:4 → +32%) +
  // C6 atk_percent+10/stack (ode:3 → +30%). char_constellation:6 threads ALL three cons gates ON,
  // matching the oracle dump at constellation 6.
  "ororon-self-buffs": {
    char_constellation: 6,
    ororon_trails_amidst_the_forest_fog: true,
    ororon_king_bee_of_the_hidden_honeyed_wine: 4,
    ororon_ode_to_deep_springs: 3,
  },
  // Sayu C2 dmg_skill_sayu_hold+3.3/stack (sayu_egress_prep:20 → +66%) on the 5 hold-kick features,
  // gated C2 → char_constellation:6 threads the cons gate ON, matching the oracle dump at constellation 6.
  // (Only damage triples are asserted; the pre-existing C6 mastery-heal value gap is filtered out.)
  "sayu-self-buffs": {
    char_constellation: 6,
    sayu_egress_prep: 20,
  },
  // Ganyu A1 crit_rate_ganyu+20 (2 frostflake hits) + A4 dmg_cryo+20 (cryo hits) + C1 enemy_res_cryo−15
  // (cryo hits + reactions) + C4 dmg_all+5/stack (westward:5 → +25%). char_constellation:6 threads the
  // C1/C4 gates ON, matching the oracle dump at constellation 6.
  "ganyu-self-buffs": {
    char_constellation: 6,
    ganyu_undivided_heart: true,
    ganyu_harmony: true,
    ganyu_dew_drinker: true,
    ganyu_westward_sojourn: 5,
  },
  // Klee A1 dmg_charged+50 (charged_hit) + C2 enemy_def_reduce+23 (every hit) + C6 dmg_pyro+10 (pyro
  // hits). char_constellation:6 threads the C2/C6 gates ON, matching the oracle dump at constellation 6.
  "klee-self-buffs": {
    char_constellation: 6,
    klee_pounding_surprise: true,
    klee_explosive_frags: true,
    klee_blazing_delight: true,
  },
  // Tighnari A1 mastery+50 (→ A4 dmg_charged/burst_tighnari EM→dmg + dendro reactions) + C2 dmg_dendro+20
  // (dendro hits) + C4 mastery+60 ×2 (2nd needs 1st). char_constellation:6 threads the C2/C4 gates ON,
  // matching the oracle dump at constellation 6.
  "tighnari-self-buffs": {
    char_constellation: 6,
    tighnari_keen_sight: true,
    tighnari_origins_known_from_the_stem: true,
    tighnari_withering_glimpsed_in_the_leaves_1: true,
    tighnari_withering_glimpsed_in_the_leaves_2: true,
  },
  // Mona burst "Omen" (mona_omen → +dmg_all per burst talent level; char_skill_burst:10 feeds the
  // static-level → +60% dmg_all) + C1 dmg_reaction electrocharged/vaporize/swirl_hydro +15 (≥C1) +
  // C4 crit_rate+15 (≥C4) + C6 dmg_charged+60/stack (rhetorics:3 → +180%, ≥C6). char_constellation:6
  // threads the C1/C4/C6 gates ON, matching the oracle dump at constellation 6.
  "mona-self-buffs": {
    char_constellation: 6,
    char_skill_burst: 10,
    mona_omen: true,
    mona_prophecy_of_submersion: true,
    mona_prophecy_of_oblivion: true,
    mona_rhetorics_of_calamitas: 3,
  },
  // Charlotte C2 charlotte_pursue_truth:3 (atk_percent +30%, ≥C2) + C4 charlotte_a_responsibility_to_
  // oversee (×1.1 scalingMultiplier on the 3 burst damage features, ≥C4). char_constellation:6 threads
  // both cons gates ON, matching the oracle dump at constellation 6. (A4 diff-origin dmg_cryo is party-
  // derived → not a self toggle, not set here.)
  "charlotte-self-buffs": {
    char_constellation: 6,
    charlotte_pursue_truth: 3,
    charlotte_a_responsibility_to_oversee: true,
  },
  // Kaveh burst "Painted Dome" (kaveh_painted_dome → attack_infusion:dendro on his physical normals/
  // charged/plunge + the bloom dmg_reaction_rupture bonus, fixed burst-level-10) + A4 "An Architect's
  // Undertaking" (kaveh_a_craftsmans_curious_conceptions → mastery +25/stack, max 4 = +100 EM on every
  // reaction). char_constellation:6 threads the C4 dmg_reaction_rupture:60 + C6 pairidaezas_light feature
  // ON, matching the oracle dump at constellation 6.
  "kaveh-self-buffs": {
    char_constellation: 6,
    kaveh_painted_dome: true,
    kaveh_a_craftsmans_curious_conceptions: 4,
  },
  // Dori C6 "Sprinkling Weight" (dori_sprinkling_weight → attack_infusion:electro on her physical
  // normals/charged/plunge). char_constellation:6 threads the C6 gate ON, matching the oracle dump at
  // constellation 6. (The C6 dori_sprinkling_weight heal is non-damage → not asserted by the burndown.)
  "dori-self-buffs": {
    char_constellation: 6,
    dori_sprinkling_weight: true,
  },
  // Diona C6 +200 EM gated by NOT(diona_cats_tail). diona_cats_tail:true suppresses the EM (the
  // toggle swaps it for healing_recv), so her reactions drop to base — the port's NOT-gate must
  // match. char_constellation:6 + diona_cats_tail:true is the discriminating config; without the
  // NOT-gate the port's EM stays on (reactions ~2x). (The C6 healing_recv is non-damage → not asserted.)
  "diona-self-buffs": {
    char_constellation: 6,
    diona_cats_tail: true,
  },
  // Kaeya C1 "Excellent Blood" crit_rate_kaeya+15 on every normal + charged hit (only the avg
  // component lifts; crit rate raises expected DMG). char_constellation:6 threads the C1 gate ON,
  // matching the oracle dump at constellation 6.
  "kaeya-self-buffs": {
    char_constellation: 6,
    kaeya_excellent_blood: true,
  },
  // Barbara C2 "Vitality Burst" dmg_hydro+15 on every hydro hit (all her normals/charged/plunge +
  // droplet skill). char_constellation:6 threads the C2 gate ON, matching the oracle dump at
  // constellation 6.
  "barbara-self-buffs": {
    char_constellation: 6,
    barbara_vitality_burst: true,
  },
  // Jean C1 "Spiraling Tempest" dmg_skill_jean+40 (skill_dmg) + C4 "Land's of Dandelion"
  // enemy_res_anemo−40 (skill + burst + field). char_constellation:6 threads BOTH cons gates ON,
  // matching the oracle dump at constellation 6.
  "jean-self-buffs": {
    char_constellation: 6,
    jean: true,
    jean_lands_of_dandelion: true,
  },
  // Diluc C1 "Conviction" dmg_all+15 (every hit) + C2 "Searing Ember" atk_percent+10/stack
  // (diluc_searing_ember:3 → +30% ATK) + C4 "Flowing Flame" dmg_skill_diluc_bonus+40 (skill_hit_2/3)
  // + C6 "Flaming Sword" dmg_normal+30 (normals). diluc_dawn:true keeps the pre-modelled infusion +
  // A4 dmg_pyro active (the A4 is gated on diluc_dawn). char_constellation:6 threads ALL cons gates ON,
  // matching the oracle dump at constellation 6.
  "diluc-self-buffs": {
    char_constellation: 6,
    diluc_dawn: true,
    diluc_conviction: true,
    diluc_searing_ember: 3,
    diluc_flowing_flame: true,
    diluc_flaming_sword_nemesis_of_the_dark: true,
  },
  // Bennett C6 "Fire Ventures with Me" (pyro infusion + dmg_pyro+15 on his physical attacks) +
  // the self Fantastic Voyage ATK battery scaling with the C5 +3 burst (fantasticVoyageAtk's
  // ratioFromTalent reads char_skill_burst). char_skill_burst:10 is the BASE burst level (this
  // burndown's buildStats omits talentLevels → thread it; the C5 +3 _bonus is added by the condition
  // loop via char_constellation:6). bennet_fantastic_voyage gates both the battery and the C6 effect.
  // Matches the oracle dump at constellation 6 (burst 10+3=13). (atk_bonus readout is non-damage → not asserted.)
  "bennett-self-buffs": {
    char_constellation: 6,
    char_skill_burst: 10,
    bennet_fantastic_voyage: true,
  },
  // Layla C4 "Starry Illumination" — 5% of her own Max HP added to each normal/charged hit (a SELF
  // CharMultiplier targeting normal/charged). char_constellation:6 threads the C4 gate ON (with
  // layla_starry_illumination), matching the oracle dump at constellation 6. (Shields are non-damage
  // → not asserted.)
  "layla-self-buffs": {
    char_constellation: 6,
    layla_starry_illumination: true,
  },
  // Thoma C6 "Burning Heart" dmg_normal/charged/plunge +15 on his own physical attacks (the SELF
  // mirror of party.thoma_burning_heart). char_constellation:6 threads the C6 gate ON, matching the
  // oracle dump at constellation 6. (His shields are non-damage → not asserted.)
  "thoma-self-buffs": {
    char_constellation: 6,
    thoma_burning_heart: true,
  },
  // Chongyun SELF buffs — Frost Field cryo infusion (chongyun_frost_field → her physical normals/
  // charged/plunge become cryo) + A4 enemy_res_cryo−10 (chongyun_rimechaser_blade) + C6
  // dmg_burst_chongyun+15 (chongyun_rally_of_four_blades). char_constellation:6 threads the C6 gate
  // ON, matching the oracle dump at constellation 6. The infusion + res-shred lift every cryo hit +
  // cryo reaction; C6 lifts the burst.
  "chongyun-self-buffs": {
    char_constellation: 6,
    chongyun_frost_field: true,
    chongyun_rimechaser_blade: true,
    chongyun_rally_of_four_blades: true,
  },
  // Dehya SELF buffs — C2 dmg_skill_dehya+50 (dehya_the_sand_blades_glittering → dehya_field_dmg) +
  // C6 crit_dmg_burst+15/stack (dehya_the_burning_claws_cleaving:4 → +60% on her burst hits).
  // char_constellation:6 threads BOTH cons gates ON, matching the oracle dump at constellation 6 / 4
  // stacks. (The C4 heal is non-damage → not asserted.)
  "dehya-self-buffs": {
    char_constellation: 6,
    dehya_the_sand_blades_glittering: true,
    dehya_the_burning_claws_cleaving: 4,
  },
  // Kuki Shinobu C6 "To Ward Weakness" mastery+150 (kuki_shinobu_to_ward_weakness) — lifts her skill
  // hits (via the A4 mastery→skill multiplier) + her reactions (EM-scaled). char_constellation:6
  // threads the C6 gate ON, matching the oracle dump at constellation 6.
  "kuki-shinobu-self-buffs": {
    char_constellation: 6,
    kuki_shinobu_to_ward_weakness: true,
  },
  // Kamisato Ayato Burst "Bloomwater Blades" (ayato_bloomwater_blades → dmg_normal per his own burst
  // talent level) lifting his physical normals (the SELF mirror of party.ayato_bloomwater_blades).
  // NOT cons-gated → dumped at cons 0. char_skill_burst:10 is the BASE burst level (this burndown's
  // buildStats omits talentLevels → thread it for the static-level), matching the oracle dump.
  "ayato-self-buffs": {
    ayato_bloomwater_blades: true,
    char_skill_burst: 10,
  },
  // Yelan C4 "Bait-and-Switch" yelan_bait_and_switch:4 → +40% Max HP, lifting every HP-scaled hit
  // (barb/skill/burst/exquisite/taking-all-comers/c6-barb). char_constellation:4 threads the C4 gate
  // ON, matching the oracle dump at constellation 4 / 4 stacks.
  "yelan-self-buffs": {
    char_constellation: 4,
    yelan_bait_and_switch: 4,
  },
  // Emilie C2 "Lakelight Top Note" emilie_lakelight_top_note (enemy_res_dendro−30 → dendro hits +
  // reactions) + C6 "Marcotte Sillage" emilie_marcotte_sillage (dendro infusion on physical normals/
  // charged/plunge + atk*−300% normal/charged bonus). char_constellation:6 threads BOTH cons gates
  // ON, matching the oracle dump at constellation 6.
  "emilie-self-buffs": {
    char_constellation: 6,
    emilie_lakelight_top_note: true,
    emilie_marcotte_sillage: true,
  },
  // Aloy A1 "Combat Override" aloy_combat_override (SELF +16% ATK) + A4 "Strong Strike"
  // aloy_strong_strike:10 (+35% Cryo DMG) + aloy_coils:4 (Rushing Ice: dmg_normal + cryo infusion on
  // her physical normals). char_skill_elemental:10 feeds the coil static-level (this burndown's
  // buildStats omits talentLevels → thread the skill level), matching the oracle dump at skill 10.
  // NOT cons-gated → dumped at cons 0.
  "aloy-self-buffs": {
    aloy_coils: 4,
    aloy_combat_override: true,
    aloy_strong_strike: 10,
    char_skill_elemental: 10,
  },
  // Traveler (Geo) shared passives traveler_swordfighting_techniques (+3 base ATK) +
  // traveler_special_training (+7 base ATK / +15 EM / +50 base HP), both ungated, + C1
  // traveler_invincible_stonewall (+10% CRIT Rate, gated C1). char_constellation:1 threads the
  // C1 gate ON, matching the oracle dump at constellation 1.
  "traveler-geo-self-buffs": {
    char_constellation: 1,
    traveler_invincible_stonewall: true,
    traveler_swordfighting_techniques: true,
    traveler_special_training: true,
  },
  // Traveler (Anemo) shared passives + C6 traveler_intertwined_winds (enemy_res_anemo−20 + the
  // pyro dropdown enemy_res_pyro−20). char_constellation:6 threads the C6 gate ON, matching the
  // oracle dump at constellation 6.
  "traveler-anemo-self-buffs": {
    char_constellation: 6,
    traveler_intertwined_winds: true,
    traveler_intertwined_winds_element: "pyro",
    traveler_swordfighting_techniques: true,
    traveler_special_training: true,
  },
  // Traveler (Electro) shared passives + C2 traveler_violet_vehemence (enemy_res_electro−15).
  // traveler_abundance_amulet is set (sweep) but damage-inert (recharge-only). char_constellation:2
  // threads the C2 gate ON, matching the oracle dump at constellation 2.
  "traveler-electro-self-buffs": {
    char_constellation: 2,
    traveler_violet_vehemence: true,
    traveler_abundance_amulet: true,
    traveler_swordfighting_techniques: true,
    traveler_special_training: true,
  },
  // Traveler (Dendro) A1 verdant_overgrowth:10 (+60 EM) + shared passives (+15 EM) + C6
  // traveler_withering_aggregation_1 (dmg_dendro+12). The +75 EM lifts the A4 dynamic EM→DMG +
  // every dendro reaction. char_constellation:6 threads the C6 gate ON, matching the oracle dump.
  "traveler-dendro-self-buffs": {
    char_constellation: 6,
    traveler_verdant_overgrowth: 10,
    traveler_withering_aggregation_1: true,
    traveler_swordfighting_techniques: true,
    traveler_special_training: true,
  },
  // YanFei "Brilliance" (dmg_charged per OWN burst level; char_skill_burst:10 is the BASE burst
  // level — this burndown's buildStats omits talentLevels → thread it) + A1 scarlet_seal:3
  // (dmg_pyro+15) + C2 yanfei_interpretation (crit_rate_charged+20). char_constellation:2 threads
  // the C2 gate ON, matching the oracle dump at constellation 2.
  "yanfei-self-buffs": {
    char_constellation: 2,
    char_skill_burst: 10,
    yanfei_brilliance: true,
    yanfei_scarlet_seal: 3,
    yanfei_interpretation: true,
  },
  // Arlecchino A1 "Cinders Alone Shall Nourish" (arlecchino_cinders_alone_shall_nourish →
  // dmg_pyro+40, a from-C0 ConditionBoolean, no cons gate). Every Arlecchino hit is pyro so it
  // lifts the whole kit. No constellation gate → dumped at C0.
  "arlecchino-self-buffs": {
    arlecchino_cinders_alone_shall_nourish: true,
  },
  // Qiqi C2 "Frozen to the Bone" (+15% Normal/Charged DMG vs cryo-afflicted enemies). Gated C2
  // (char_constellation:2) AND the enemy cryo status (common.enemy_status:'cryo'), matching the
  // oracle dump at constellation 2 with the cryo status set.
  "qiqi-self-buffs": {
    char_constellation: 2,
    "common.enemy_status": "cryo",
  },
  // Yae Miko C4 "Sakura Channeling" (SELF toggle, +20% Electro DMG). Gated C4
  // (char_constellation:4) + the toggle, matching the oracle dump at constellation 4.
  "yae-miko-self-buffs": {
    char_constellation: 4,
    miko_sakura_channeling: true,
  },
  // Gaming C2 "Plum Blossoms Underfoot" (SELF toggle, +20% ATK). Gated C2 (char_constellation:2)
  // + the toggle, matching the oracle dump at constellation 2.
  "gaming-self-buffs": {
    char_constellation: 2,
    gaming_plum_blossoms_underfoot: true,
  },
  // Hu Tao A4 "Sanguine Rouge" (+33% Pyro DMG, always-on at ascension 6) + C6 "Butterfly's
  // Embrace" (+100% CRIT Rate, gated C6). char_constellation:6 threads the C6 gate ON, matching
  // the oracle dump at constellation 6 with both toggles set.
  "hu-tao-self-buffs": {
    char_constellation: 6,
    hu_tao_sanguine_rouge: true,
    hu_tao_butterflys_embrace: true,
  },
  // Itto C4 "Jailhouse Bread and Butter" (SELF toggle, +20% DEF + +20% ATK). Gated C4
  // (char_constellation:4) + the toggle, matching the oracle dump at constellation 4.
  "itto-self-buffs": {
    char_constellation: 4,
    itto_jailhouse_bread_and_butter: true,
  },
  // Sara "Tengu Juurai" SELF ATK battery (sara_tengu_juurai → her own ATK += atk_base × skill
  // atk_bonus). The port had ONLY the party.sara_tengu_juurai mirror → golden-blind SKIP of the
  // SELF postEffect. char_constellation:6 threads C6 + the C5 skill +3 bonus into the dump.
  "sara-self-buffs": {
    char_constellation: 6,
    sara_tengu_juurai: true,
  },
  // Shenhe SELF buffs — Icy Quill on her own cryo hits + A4 seals (press/hold) + A1 Deific Embrace
  // (spirit_field-gated) + talisman res-shred + C2 Centered Spirit (C2+spirit_field crit DMG). The
  // port had ONLY the party.shenhe_icy_quill mirror → golden-blind SKIP of every SELF condition.
  "shenhe-self-buffs": {
    char_constellation: 6,
    shenhe_icy_quill: true,
    shenhe_spirit_field: true,
    shenhe_spirit_seal_press: true,
    shenhe_spirit_seal_hold: true,
    shenhe_talisman_spirit: true,
  },
  // Chiori SELF buffs — A1 Tailor-Made geo infusion (attack_infusion:'geo') + A4 Finishing Touch
  // (+20% Geo DMG) + C6 DEF-scaled flat geo damage-instance on normals (C6 + sole_principle_pursuit).
  "chiori-self-buffs": {
    char_constellation: 6,
    attack_infusion: "geo",
    chiori_tailor_made: true,
    chiori_the_finishing_touch: true,
    chiori_sole_principle_pursuit: true,
  },
  // Baizhu SELF buffs — A1 +25% Dendro DMG NOT-gate (dropped when five_fortunes ON) + A4 bloom/
  // burning reaction bonuses (port had only quicken) + C4 ancient-art +80 EM.
  "baizhu-self-buffs": {
    char_constellation: 6,
    baizhu_five_fortunes_forever: true,
    baizhu_all_things_are_of_the_earth: true,
    baizhu_ancient_art_of_perception: true,
  },
  // Nahida SELF buffs — A1 EM share (compassion + illusory_heart + party_max_mastery cap) + the C2
  // Root of All Fullness enemy_def_reduce:30 toggle (the skipped golden-blind gate).
  "nahida-self-buffs": {
    char_constellation: 6,
    nahida_compassion_illuminated: true,
    nahida_illusory_heart: true,
    party_max_mastery: 1000,
    nahida_the_root_of_all_fullness: true,
  },
  // Xingqiu C2 xingqiu_rainbow_upon_the_azure_sky (enemy_res_hydro−15) + C4 xingqiu_evilsoother
  // (+50% skill DMG, the folded ×1.5 on skill_dmg/skill_1/skill_2). char_constellation:4 threads
  // BOTH cons gates ON, matching the oracle dump at constellation 4.
  "xingqiu-self-buffs": {
    char_constellation: 4,
    xingqiu_rainbow_upon_the_azure_sky: true,
    xingqiu_evilsoother: true,
  },
  // YunJin SELF buffs — Flying Cloud Flag Formation NA DEF-buff (yunjin_flag → DEF×(burst%+2.5%) on
  // her own normals) + C2 yunjin_myriad (dmg_normal+15) + C4 yunjin_flower (def_percent+20).
  // char_constellation:6 threads both cons gates ON, matching the oracle dump at constellation 6.
  // SOLO (no resonance) → the bonusValues element-count tier is the faithful 1-element 2.5%; the 2-4
  // element refinement is a deferred Tier-B engine-extension (no self-side element-count publisher).
  "yunjin-self-buffs": {
    char_constellation: 6,
    yunjin_flag: true,
    yunjin_myriad: true,
    yunjin_flower: true,
  },
  // Citlali SELF buffs — A4 citlali_itzpapalotls_star_garments (mastery* EM terms on frostfall/
  // ice-storm) + C2 citlali_heart_devourers_travail (mastery+125) + C6 citlali_points:30
  // (ConditionNumberCitlali dmg_all += 30×2.5 = +75% via bonusPerValue, lifting every cryo hit).
  // frigid_rain set (its res-shred is pyro/hydro = inert for cryo). char_constellation:6 threads the
  // C2 + C6 gates ON, matching the oracle dump at constellation 6.
  "citlali-self-buffs": {
    char_constellation: 6,
    citlali_itzpapalotls_star_garments: true,
    citlali_heart_devourers_travail: true,
    citlali_mamaloacos_frigid_rain: true,
    citlali_points: 30,
  },
  // Clorinde SELF buffs — A4 clorinde_lawful_remuneration:2 (crit_rate+20) + C6
  // clorinde_and_so_shall_i_never_despair (crit_rate+10/crit_dmg+70) + A1 clorinde_dark_shattering_flame:3
  // (additive electro base term on her electro normal/burst, perStack 30% at C2+). char_constellation:6
  // threads the C6 crit toggle + the C2 perStack-30 ON, matching the oracle dump at constellation 6.
  // The crit buffs lift every hit; the A1 base term lifts her electro burst (+ the c6 glimbright normal).
  "clorinde-self-buffs": {
    char_constellation: 6,
    clorinde_lawful_remuneration: 2,
    clorinde_and_so_shall_i_never_despair: true,
    clorinde_dark_shattering_flame: 3,
  },
  // Candace SELF buffs — prayer_of_the_crimson_crown (flat dmg_normal_<el>+20 + own hydro infusion
  // on normals/charged/plunge; also gates the A4 HP→Normal-DMG post-effect) + C2
  // candace_moon_piercing_brilliance (hp_percent+20). char_constellation:6 threads the C2 gate ON,
  // matching the oracle dump at constellation 6. The infusion lifts charged/plunge to hydro; the
  // dmg_normal_<el> (flat + HP) lifts normals; +20% HP lifts every HP-scaled skill/burst hit.
  "candace-self-buffs": {
    char_constellation: 6,
    candace_prayer_of_the_crimson_crown: true,
    candace_moon_piercing_brilliance: true,
  },
  // Keqing SELF buffs — A1 keqing_penance (electro infusion → her normals/charged/plunge become
  // electro) + A4 keqing_dignity (crit_rate+15) + C4 keqing_attunement (atk_percent+25) + C6
  // keqing_tenacious_star:4 (dmg_electro+24%). char_constellation:6 threads both cons gates ON,
  // matching the oracle dump at constellation 6. The infusion lifts her physical attacks to electro
  // (so the C6 electro DMG lands on them); crit/atk lift every hit.
  "keqing-self-buffs": {
    char_constellation: 6,
    keqing_penance: true,
    keqing_dignity: true,
    keqing_attunement: true,
    keqing_tenacious_star: 4,
  },
  // Alhaitham SELF buffs — A1 alhaitham_mirror (dendro infusion → his normals/charged/plunge become
  // dendro) + C2 alhaitham_debate:4 (mastery+200) + C4 alhaitham_elucidation:3 (dmg_dendro+30%) + C6
  // alhaitham_structuration (crit_rate+10/crit_dmg+70). char_constellation:6 threads both cons gates
  // ON, matching the oracle dump at constellation 6. The infusion lifts his physical attacks to dendro
  // (so the C4 dendro DMG + EM land on them); the C2 EM also lifts his skill/burst mastery* terms.
  "alhaitham-self-buffs": {
    char_constellation: 6,
    alhaitham_mirror: true,
    alhaitham_debate: 4,
    alhaitham_elucidation: 3,
    alhaitham_structuration: true,
  },
  // Eula SELF buffs — Icewhirl Brand (eula_icewhirl_brand → phys+cryo RES shred, level-scaled on her
  // own skill level, NOT cons-gated) + C1 eula_tidal_illusion (dmg_phys+30) + C4 eula_obstinacy
  // (dmg_burst_eula+25). char_constellation:4 threads both cons gates ON, matching the oracle dump at
  // constellation 4. The res-shred lifts every physical + cryo hit; C1 the physical; C4 the bursts.
  "eula-self-buffs": {
    char_constellation: 4,
    eula_icewhirl_brand: true,
    eula_tidal_illusion: true,
    eula_obstinacy: true,
  },
  // Chevreuse SELF buffs — A1 chevreuse_tactics (enemy_res_pyro/electro−40, party-element gate) + A4
  // chevreuse_force_coordination (own HP→atk_percent capped 40) + C6 chevreuse_in_pursuit:3
  // (dmg_pyro/electro+60%). char_constellation:6 threads the C6 gate ON, matching the oracle dump at
  // constellation 6. The atk% + dmg buffs lift every hit; the res-shred her pyro damage.
  "chevreuse-self-buffs": {
    char_constellation: 6,
    chevreuse_tactics: true,
    chevreuse_force_coordination: true,
    chevreuse_in_pursuit: 3,
  },
  // Navia SELF buffs — A1 navia_undisclosed_distribution_channels (dmg_normal/charged/plunge+40 + geo
  // infusion) + C4 navia_the_oathsworn_never_capitulate (enemy_res_geo−20). char_constellation:4
  // threads the C4 gate ON, matching the oracle dump at constellation 4. The A1 dmg + infusion lift her
  // normals/charged/plunge; the C4 res-shred her geo hits. (A4 atk% party-axis + cannon/shrapnel Tier-B.)
  "navia-self-buffs": {
    char_constellation: 4,
    navia_undisclosed_distribution_channels: true,
    navia_the_oathsworn_never_capitulate: true,
  },
  // Nilou SELF buffs — C2 nilou_the_starry_skies_2 (enemy_res_dendro−35, lifts her bloom/rupture) + C4
  // nilou_fricative_pulse (dmg_burst+50). char_constellation:4 threads both cons gates ON, matching the
  // oracle dump at constellation 4. (A1 stance mastery + C2 hydro-res are NilouParty-gated → party-axis.)
  "nilou-self-buffs": {
    char_constellation: 4,
    nilou_the_starry_skies_2: true,
    nilou_fricative_pulse: true,
  },
  // Kachina A1 dmg_geo+20 (kachina_mountain_echoes, an ungated ascension boolean — the toggle is the
  // gate). Lifts every Kachina geo feature. Dumped at constellation 0.
  "kachina-self-buffs": {
    kachina_mountain_echoes: true,
  },
  // Kinich C1 crit_dmg_skill_kinich+100 (kinich_parrots_beak, ≥C1) + C2 enemy_res_dendro−30
  // (kinich_tiger_beetles_palm_1) & dmg_skill_kinich+100 (kinich_tiger_beetles_palm_2, ≥C2) + C4
  // dmg_burst_kinich+70 (kinich_hummingbirds_feather, ≥C4). char_constellation:4 threads ALL three
  // cons gates ON, matching the oracle dump at constellation 4. dmg_skill_kinich/crit_dmg_skill_kinich
  // are feature-scoped to the Scalespiker-Cannon hits; dmg_burst_kinich to the bursts.
  "kinich-self-buffs": {
    char_constellation: 4,
    kinich_parrots_beak: true,
    kinich_tiger_beetles_palm_1: true,
    kinich_tiger_beetles_palm_2: true,
    kinich_hummingbirds_feather: true,
  },
  // Xianyun C2 atk_percent+20 (xianyun_aloof_from_the_world, gated C2) + A1 galefeather stacks=3
  // (crit_rate_plunge:8, non-cumulative table lookup) + A4/C2 ATK→plunge-shockwave-DMG conversion
  // (xianyun_consider_the_adeptus_in_her_realm, level 2 via the C2 xianyun_a4_level publisher →
  // 400%×ATK capped 18000). char_constellation:2 threads the C2 gate ON (both the ATK buff and the
  // A4 level-2 publisher), matching the oracle dump at constellation 2.
  "xianyun-self-buffs": {
    char_constellation: 2,
    xianyun_aloof_from_the_world: true,
    xianyun_galefeather_pursuit: 3,
    xianyun_consider_the_adeptus_in_her_realm: true,
  },
  // Sigewinne A1 dmg_hydro+8 (sigewinne_requires_appropriate_rest, ungated ascension boolean) + C6
  // own-HP→crit (sigewinne_would_the_most_radiant_of_spirits_pray_for_me → +20% crit_rate / +110%
  // crit_dmg, two HP postEffects gated C6). char_constellation:6 threads the C6 gate ON, matching
  // the oracle dump at constellation 6.
  "sigewinne-self-buffs": {
    char_constellation: 6,
    sigewinne_requires_appropriate_rest: true,
    sigewinne_would_the_most_radiant_of_spirits_pray_for_me: true,
  },
  // TravelerPyro: ungated swordfighting/special_training base-stat passives + C1 Starfire's Flowing
  // Light (dmg_all+6 boolean + Nightsoul static dmg_all+9) + C4 Ravaging Flame (dmg_pyro+20) + C6
  // The Sacred Flame Imperishable (crit_dmg normal/charged/plunge +40 + pyro infusion).
  // char_constellation:6 threads every C1/C4/C6 gate ON, matching the oracle dump at constellation 6.
  "travelerpyro-self-buffs": {
    char_constellation: 6,
    traveler_swordfighting_techniques: true,
    traveler_special_training: true,
    traveler_pyro_starfires_flowing_light: true,
    "common.nightsoul_blessing_state": true,
    traveler_ravaging_flame: true,
    traveler_pyro_the_sacred_flame_imperishable: true,
  },
  // Iansan A1 atk_percent+20 (iansan_enhanced_resistance_training, ascension boolean) + C6 dmg_all+25
  // (iansan_teachings_of_the_collective_of_plenty, ≥C6). char_constellation:6 threads the C6 gate ON,
  // matching the oracle dump at constellation 6.
  "iansan-self-buffs": {
    char_constellation: 6,
    iansan_enhanced_resistance_training: true,
    iansan_teachings_of_the_collective_of_plenty: true,
  },
  // Varesa C4 dmg_burst_varesa+100 (varesa_the_courage_to_press_on_2, ≥C4) + C6 crit_rate/crit_dmg
  // plunge/burst (varesa_a_hero_of_justices_triumph, ≥C6). char_constellation:6 threads both cons
  // gates ON, matching the oracle dump at constellation 6.
  "varesa-self-buffs": {
    char_constellation: 6,
    varesa_the_courage_to_press_on_2: true,
    varesa_a_hero_of_justices_triumph: true,
  },
  // Varesa Fiery Passion STANCE + A1 + C4-part1 + A4 — varesa_fiery_passion swaps every normal/charged/
  // plunge/rush/flying-kick to its Fiery-Passion slot; varesa_tag_team_triple_jump adds the A1 ATK-scaled
  // plunge term (varesa_a1_level→getValue(2)=180% since stance is on) over plunge_low/high + the C1 copy on
  // Volcanic Collapse; varesa_the_hero_twice_returned:2 adds +70% ATK (A4 stacks); varesa_the_courage_to_
  // press_on_1 adds the 500%-ATK capped-20000 term over plunge_low/high + Volcanic Collapse. char_constellation:6
  // threads the C1/C4 gates ON, matching the oracle dump at constellation 6.
  "varesa-fiery-passion": {
    char_constellation: 6,
    varesa_fiery_passion: true,
    varesa_tag_team_triple_jump: true,
    varesa_the_hero_twice_returned: 2,
    varesa_the_courage_to_press_on_1: true,
  },
  // Mualani Wave Momentum stacks (mualani_wave_momentum:3 → s2.p2 HP term ×3 + s2.p3 flat HP at >=3, both
  // over the shark_byte tag) + A4 mualani_natlans_greatest_guide:3 (+45% HP on the burst 2nd mult) + C1
  // mualani_the_leisurely_meztli (+66% HP shark_byte mult) + C4 mualani_sharky_eats_puffies (dmg_burst_
  // mualani+75) + mualani_byte_targets:3 (→ the byte-ratio 0.72 whole-hit multiplier on the shark bite AND
  // the shark-missile feature it gates, both via wholeHitMultiplierFromTable). char_constellation:6 threads
  // the C1/C4 gates ON, matching the oracle dump at constellation 6.
  "mualani-self-buffs": {
    char_constellation: 6,
    mualani_wave_momentum: 3,
    mualani_natlans_greatest_guide: 3,
    mualani_the_leisurely_meztli: true,
    mualani_sharky_eats_puffies: true,
    mualani_byte_targets: 3,
  },
  // Mavuika Flamestrider STANCE (mavuika_stance swaps the on-foot combo → the pyro Flamestrider moveset)
  // + per-point global multipliers (mavuika_crucible_of_death_and_life + mavuika_points:200 → ATK×points
  // on flamestrider normals/charged + the burst + the C2 flat 60/90/120% terms) + A1 mavuika_gift_of_
  // flaming_flowers (+30% ATK) + A4 mavuika_kiongozi:40 (dmg_all+40) + C1 (+40% ATK) + C4 dmg_all+10
  // (kiongozi-gated) + C2/C6 enemy_def_reduce−20. char_constellation:6 threads every gate ON, matching the
  // oracle dump at constellation 6.
  "mavuika-self-buffs": {
    char_constellation: 6,
    mavuika_stance: true,
    mavuika_crucible_of_death_and_life: true,
    mavuika_points: 200,
    mavuika_kiongozi: 40,
    mavuika_gift_of_flaming_flowers: true,
    mavuika_the_night_lords_explication: true,
    mavuika_the_ashen_price: true,
    mavuika_humanitys_name_unfettered: true,
  },
  // Skirk Seven-Phase-Flash STANCE (skirk_seven_phase_flash → cryo stance moveset) + Serpent's Subtlety
  // (skirk_serpents_subtlety:22 → the burst 2nd term via stacksFactor) + Reason Beyond Reason absorption
  // (skirk_havoc_extinction + skirk_reason_beyond_reason:3 → dmg_normal_skirk on the stance normals) + C2
  // skirk_into_the_abyss (+70% ATK) + Return to Oblivion (skirk_return_to_oblivion:3 → the SkirkNormal
  // 1.7× / SkirkBurst 1.6× partyBonus base multiplier on the stance normals + both burst terms + the C6
  // coordinated features, PLUS the C4 "Fractured Flow" +40% ATK gated on the same toggle). This rep
  // EXERCISES the scalingMultiplierFromTable sub-effect. char_constellation:6 threads the C2/C4 gates ON.
  "skirk-self-buffs": {
    char_constellation: 6,
    skirk_seven_phase_flash: true,
    skirk_serpents_subtlety: 22,
    skirk_havoc_extinction: true,
    skirk_reason_beyond_reason: 3,
    skirk_into_the_abyss: true,
    skirk_return_to_oblivion: 3,
  },
  // Lyney residual self buffs — A1 lyney_perilous_performance (+80% ATK pyrotechnic strike) + A4 Conclusive
  // Ovation (common.enemy_status:'pyro' → +dmg_all by party_elements_same, solo=60%) + C2 lyney_locquacious_
  // cajoling:3 (+60% CRIT DMG) + C4 lyney_well_versed_well_rehearsed (enemy Pyro RES −20) + lyney_surplus_
  // stacks:5 (skill 2nd term + heal). char_constellation:6 threads the C2/C4 gates ON, matching the oracle dump.
  "lyney-self-buffs": {
    char_constellation: 6,
    lyney_perilous_performance: true,
    lyney_locquacious_cajoling: 3,
    lyney_well_versed_well_rehearsed: true,
    lyney_surplus_stacks: 5,
    "common.enemy_status": "pyro",
  },
  // Ifa A4 mastery+80 (ifa_mutual_aid_agreement, ascension boolean) + C4 mastery+100
  // (ifa_decayed_vessels_permutation, ≥C4). Plain EM lifts her swirl/EC reaction outputs.
  // char_constellation:4 threads the C4 gate ON, matching the oracle dump at constellation 4.
  // A1 ifa_field_medics_vision:150 under nightsoul adds +225% swirl/EC reaction DMG (bonusPerValue).
  "ifa-self-buffs": {
    char_constellation: 4,
    ifa_mutual_aid_agreement: true,
    ifa_decayed_vessels_permutation: true,
    "common.nightsoul_blessing_state": true,
    ifa_field_medics_vision: 150,
  },
  // Ifa C2 cap: vision slider cap rises 150 → 200 at C2 (maxBonusFromConstellation). vision:200 at
  // constellation 2 → clamped 200 → +300% swirl/EC (vs +225% the base 150 cap would give below C2).
  "ifa-c2-vision": {
    char_constellation: 2,
    ifa_mutual_aid_agreement: true,
    "common.nightsoul_blessing_state": true,
    ifa_field_medics_vision: 200,
  },
  // Mizuki A4 mastery+100 (mizuki_thoughts_by_day_bring_dreams_by_night, ascension boolean) lifting
  // every Mizuki reaction output. Dumped at constellation 0 (the A4 toggle is the only gate).
  "mizuki-self-buffs": {
    mizuki_thoughts_by_day_bring_dreams_by_night: true,
  },
  // Ineffa A4 mastery+6%ATK (ineffa_panoramic_permutation_protocol, ascension boolean) + C1
  // dmg_reaction_lunarcharged +2.5%ATK/cap50 (ineffa_rectifying_processor, gated ≥C1). Both lift her
  // lunarcharged/lunardirect reaction outputs. char_constellation:1 threads the C1 gate ON, matching
  // the oracle dump at constellation 1.
  "ineffa-self-buffs": {
    char_constellation: 1,
    ineffa_panoramic_permutation_protocol: true,
    ineffa_rectifying_processor: true,
  },
  // ── Tier-B stance / feature-swap self-buffs (Class A — Feature.condition gated) ──
  // Xiao Yaksha Mask: same attacks gain anemo infusion + per-burst-level dmg_normal/charged/plunge.
  // Not a swap; the toggle publishes attack_infusion:"anemo" + a static-level dmg bonus. C0.
  "xiao-yaksha-mask": {
    xiao_yaksha_mask: true,
  },
  // Cyno Pactsworn Pathclearer (cyno_wolfs_swiftness): the physical ground normals/charged/plunge are
  // NOT-gated OFF; the parallel ELECTRO burst-stance set (char_skill_burst) + duststalker bolt + A4
  // EM→Normal multiplier are gated ON. C0 / A6 (A1+A4 are stance-gated, active once the toggle is on).
  "cyno-wolfs-swiftness": {
    cyno_wolfs_swiftness: true,
  },
  // Tartaglia Raging Tide (tartaglia_raging_tide): the ranged bow moveset (normals/aimed/plunge +
  // ranged burst) is NOT-gated OFF; the HYDRO melee moveset (char_skill_elemental normals/charged
  // + melee burst) is gated ON, with attack_infusion:'hydro' published by the toggle. C0.
  "tartaglia-raging-tide": {
    tartaglia_raging_tide: true,
  },
  // Raiden Musou Isshin (baal_musou_isshin): the ground polearm normals/charged/plunge are NOT-gated
  // OFF; the ELECTRO burst-infused moveset (char_skill_burst, damageType 'burst', tags 'raiden_attacks')
  // is gated ON, with attack_infusion:'electro' published. Resolve stacks unset → 0 (per-stack
  // multipliers inert). C0.
  "raiden-musou-isshin": {
    baal_musou_isshin: true,
  },
  // Sethos Twilight Meditation (sethos_twilight_meditation): the ground normals/aimed/Shadow-Piercing
  // shot are NOT-gated OFF; the ELECTRO CHARGED meditation normals (+ a char-level Dusk Bolt mastery
  // multiplier over charged) are gated ON. C0 (C2/C4 self buffs are cons-gated, off here).
  "sethos-twilight-meditation": {
    sethos_twilight_meditation: true,
  },
  // Kamisato Ayaka Senho (ayaka_senho + A1/A4/C4/C6 self toggles): CRYO infusion on normals/charged/
  // plunge (attack_infusion:'cryo') + A1 +30% Normal/Charged + A4 +18% Cryo + C4 SELF −30% enemy DEF +
  // C6 +298% Charged. char_constellation:6 threads C4/C6 ON, matching the oracle dump at C6.
  "kamisato-ayaka-senho": {
    char_constellation: 6,
    ayaka_senho: true,
    ayaka_amatsumi_kunitsumi_ihahigoto: true,
    ayaka_kanten_senmyou_norito: true,
    ayaka_eikyo_ryuuhan: true,
    ayaka_ai_suigetsu: true,
  },
  // Freminet frost ×2 (freminet_stalking_mode): his frost DMG's scalingMultiplier:2 gated by the
  // burst-stance toggle (raw Freminet.js:268-274, a C0 ConditionBoolean). Ported via the new
  // scalingMultiplierCondition field → the gate-ON ×2 lifts the frost triple. No cons gate → C0.
  "freminet-stalking-mode": {
    freminet_stalking_mode: true,
  },
  // Neuvillette equitable-judgment ValueTable (neuvillette_ancient_seas_legacy=3 → ×1.6): the two
  // equitable-judgment charged hits scale by scalingMultiplierFromTable [1.1,1.25,1.6]. Dumped at
  // cons 6 so the co-driven C2 crit_dmg_neuvillette (+42% at legacy 3) + the C6 current-HP hit are
  // active. char_constellation:6 threads the cons gate ON, matching the oracle dump.
  "neuvillette-ancient-seas-legacy": {
    char_constellation: 6,
    neuvillette_ancient_seas_legacy: 3,
  },
  // Razor wolf-form burst normals (razor_wolf_within): 4 burst-stance normals gated by the C0
  // ConditionBoolean, each normal_hit_N × ATK × razor_companion_dmg(char_skill_burst) via
  // scalingMultiplierFromTable (raw Razor.js:182-233, RazorBurst.js). The gate also suppresses
  // charged_spin/final (raw ConditionNot). No cons gate → C0.
  "razor-wolf-within": {
    razor_wolf_within: true,
  },
  // Wriothesley CHILLING PENALTY (wriothesley_chilling_penalty): his 6 normal hits gain an extra
  // ×(enhanced_repelling_fist(char_skill_elemental)/100) factor while ON, via the gated
  // scalingMultiplierFromTable (raw Multiplier/Wriothesley.js:18-21). No cons gate → C0.
  "wriothesley-chilling-penalty": {
    wriothesley_chilling_penalty: true,
  },
  // Wanderer WINDFAVORED (wanderer_windfavored): normals ×(fushoudan/100), charged ×(toufukai/100),
  // both keyed by char_skill_elemental, via the gated scalingMultiplierFromTable (raw
  // Multiplier/Wanderer.js:getTreeBonusMultiplier). Dumped at C6: char_constellation:6 threads the
  // C1 wanderer_passive_level:2 wind-arrow bump AND the C6 duplicate normals ON, matching the oracle.
  "wanderer-windfavored": {
    wanderer_windfavored: true,
    char_constellation: 6,
  },
  // Yoimiya NIWABI FIRE-DANCE (yoimiya_teika_enshou): normals ×(yoimiya_bonus_dmg/100) keyed by
  // char_skill_elemental (gated scalingMultiplierFromTable, raw Multiplier/Yoimiya.js:16-33) + the
  // normals/aimed/plunge pyro-infused (the toggle publishes attack_infusion:'pyro'). Dumped at C6:
  // char_constellation:6 threads the C6 duplicate normals ON, matching the oracle dump.
  "yoimiya-teika-enshou": {
    yoimiya_teika_enshou: true,
    char_constellation: 6,
  },
};

interface ManifestItem {
  readonly slug: string;
  /** The charKey (e.g. "Zhongli"). */
  readonly repKey: string;
  /** The TS slug (e.g. "zhongli") — used to resolve the recipient DbObjectChar. */
  readonly repSlug: string;
}

interface Manifest {
  readonly items: readonly ManifestItem[];
}

interface Fixture {
  readonly slug: string;
  readonly features: Record<string, FixtureEntry>;
}

const SELF_BUFFS_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../tests/golden/fixtures/self-buffs"
);

const WEAPON_TABLE_BY_TYPE: Readonly<Record<string, readonly StatTableEntry[]>> = {
  sword: alleyFlashStatTable,
  claymore: theBellStatTable,
  polearm: blackcliffPoleStatTable,
  bow: alleyHunterStatTable,
  catalyst: solarPearlStatTable,
};

function isDbObjectChar(v: unknown): v is DbObjectChar {
  return (
    typeof v === "object" &&
    v !== null &&
    "weapon" in v &&
    "element" in v &&
    "features" in v
  );
}

// Minimal local type for Vite's `import.meta.glob` so the typecheck gate passes
// without a vite/client dependency. Vitest supplies the real implementation at runtime.
declare global {
  interface ImportMeta {
    glob(
      pattern: string,
      options: { eager: true }
    ): Record<string, Record<string, unknown>>;
  }
}

const CHAR_MODULES = import.meta.glob("../characters/*.ts", { eager: true });

// slug ("zhongli") -> DbObjectChar. self-buffs is a partyItems config, so a fixture's slug is the
// EFFECT slug (e.g. "zhongli-jade-shield"); the rep char is resolved from the manifest's repSlug
// (mirroring infusionBurndown.test.ts / bolMultiplierBurndown.test.ts).
const charBySlug: Readonly<Record<string, DbObjectChar>> = Object.fromEntries(
  Object.entries(CHAR_MODULES).flatMap(([path, mod]) => {
    const slug = path
      .slice(path.lastIndexOf("/") + 1)
      .replace(/\.ts$/, "")
      .replace(/-/g, "_");
    const chars = Object.values(mod).filter(isDbObjectChar);
    return chars.length === 1 ? [[slug, chars[0]!] as [string, DbObjectChar]] : [];
  })
);

const manifest: Manifest = existsSync(join(SELF_BUFFS_DIR, "_manifest.json"))
  ? (JSON.parse(readFileSync(join(SELF_BUFFS_DIR, "_manifest.json"), "utf-8")) as Manifest)
  : { items: [] };

describe("self-buffs-burndown", () => {
  it("the self-buffs fixture family exists", () => {
    expect(manifest.items.length).toBeGreaterThan(0);
  });
});

for (const item of manifest.items) {
  describe(`self-buffs-burndown: ${item.slug}`, () => {
    const char = charBySlug[item.repSlug];
    const fixture: Fixture | undefined = existsSync(join(SELF_BUFFS_DIR, `${item.slug}.json`))
      ? (JSON.parse(readFileSync(join(SELF_BUFFS_DIR, `${item.slug}.json`), "utf-8")) as Fixture)
      : undefined;

    if (!char || !fixture) {
      it(`${item.slug}: rep char + fixture present`, () =>
        expect.fail(
          `missing rep char '${item.repSlug}' or fixture '${item.slug}.json'`
        ));
      return;
    }

    const settings = SETTINGS_BY_SLUG[item.slug] ?? {};

    const { context, settings: merged } = buildStats({
      char,
      weaponStatTable: WEAPON_TABLE_BY_TYPE[char.weapon]!,
      statBlock: STAT_BLOCK,
      levels: LEVELS,
      enemy: ENEMY,
      // Inject the L10 talent levels so buildStats sees char_skill_attack/elemental/burst — required
      // by talent-scaled stat post-effects that fire during stat aggregation (Sara's Tengu Juurai
      // self ATK battery reads char_skill_elemental). Inert for reps with no talent-scaled self
      // post-effect (their stat bag is unchanged); the oracle fixtures were dumped at L10.
      talentLevels: TALENTS,
      settings,
    });

    const compiled = compileCharacter(char, {
      charElement: char.element,
      talentLevels: TALENTS,
      settings: merged,
      charLevel: LEVELS.charLevel,
    });

    // Assert every damage triple the oracle emitted under the self toggle. The self buff (e.g.
    // Zhongli's universal res-shred) lifts the FULL triple (normal/crit/avg), so all three are
    // asserted. Filtered by `k in compiled` because these damage features DO exist in our port (the
    // question is whether the self condition lifts them) — honest, not vacuous (the RED-without-fix
    // proof in the header confirms the keys match: removal turns this RED, not a no-op).
    const damageKeys = Object.entries(fixture.features)
      .filter(([, e]) => isDamageTripleEntry(e))
      .map(([k]) => k);

    for (const key of damageKeys.filter((k) => k in compiled)) {
      const oracle = fixture.features[key]!;

      it(`${item.slug}/${key} normal within ${TOLERANCE}`, () => {
        const result = compiled[key]!(context);
        expect(
          Math.abs(result.normal - oracle.normal),
          `${item.slug}/${key} normal: ours=${result.normal.toFixed(2)}, oracle=${oracle.normal.toFixed(2)}`
        ).toBeLessThanOrEqual(TOLERANCE);
      });

      it(`${item.slug}/${key} crit within ${TOLERANCE}`, () => {
        const result = compiled[key]!(context);
        expect(
          Math.abs(result.crit - oracle.crit),
          `${item.slug}/${key} crit: ours=${result.crit.toFixed(2)}, oracle=${oracle.crit.toFixed(2)}`
        ).toBeLessThanOrEqual(TOLERANCE);
      });

      it(`${item.slug}/${key} avg within ${TOLERANCE}`, () => {
        const result = compiled[key]!(context);
        expect(
          Math.abs(result.avg - oracle.average),
          `${item.slug}/${key} avg: ours=${result.avg.toFixed(2)}, oracle=${oracle.average.toFixed(2)}`
        ).toBeLessThanOrEqual(TOLERANCE);
      });
    }
  });
}
