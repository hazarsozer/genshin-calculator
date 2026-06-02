/**
 * Artifact-set registry — `setKey → DbObjectArtifactSet`.
 *
 * Each set's `goodId` is Aspirine's oracle `art.set` key — the same string the
 * `buildStats` `setBonuses` input and `build-configs.mjs equipSet` use. It equals
 * the GOOD-format key for most sets, but follows her key where they diverge:
 *   "CrimsonWitch"        (GOOD: "CrimsonWitchOfFlames")
 *   "HeartofDepth"        (GOOD: "HeartOfDepth")
 *   "EmblemofSeveredFate" (GOOD: "EmblemOfSeveredFate")
 *   "HuskofOpulentDreams" (GOOD: "HuskOfOpulentDreams")
 * The `set-*pc` golden manifests use the same oracle keys, so `goodId` is the
 * correct lookup key for the harness.
 *
 * 22 sets ported (P2.A0: Noblesse/CrimsonWitch/Deepwood; P2.A1: GoldenTroupe/
 * HeartofDepth/Marechaussee/Emblem + ShimenawasReminiscence/HuskofOpulentDreams/
 * ThunderingFury + GladiatorFinale; P2.C-sets: ViridescentVenerer/BlizzardStrayer/
 * GildedDreams — each 2pc + always-on-static 4pc only; their primitive-gated 4pc
 * effects (swirl res-shred / enemy-status crit / party-element scaling) are INERT
 * in every v5.8 oracle fixture and deferred in-file; Phase-3/E3:
 * ObsidianCodex/OceanHuedClam/AquilaFavonia/RedhornStonethresher + 7 leaf-condition sets:
 * ArchaicPetra/DefendersWill/FinaleOfTheDeepGalleries/NymphsDream/PaleFlame/
 * ScrollOfTheEmberedCitysHero/SongOfDaysPast).
 *
 * NOTE: this barrel is HAND-MAINTAINED (controller-regenerated after each port wave).
 * The golden harness auto-discovers set files via `import.meta.glob` independently, so a
 * dropped-in set file is validated WITHOUT a barrel edit; this barrel is the RUNTIME
 * registry (`getArtifactSet`) for production. Keep the two in sync at each wave close.
 *
 * Source: raw/genshin_calc_pub/src/js/db/Artifacts/Sets.js (the set registry)
 */

import type { DbObjectArtifactSet } from "@genshin/types";
import { archaicPetra } from "./archaic-petra.js";
import { blizzardStrayer } from "./blizzard-strayer.js";
import { crimsonWitch } from "./crimson-witch.js";
import { defendersWill } from "./defenders-will.js";
import { deepwoodMemories } from "./deepwood-memories.js";
import { emblemOfSeveredFate } from "./emblem-of-severed-fate.js";
import { finaleOfTheDeepGalleries } from "./finale-of-the-deep-galleries.js";
import { gildedDreams } from "./gilded-dreams.js";
import { gladiatorFinale } from "./gladiator-finale.js";
import { goldenTroupe } from "./golden-troupe.js";
import { heartOfDepth } from "./heart-of-depth.js";
import { huskOfOpulentDreams } from "./husk-of-opulent-dreams.js";
import { marechausseeHunter } from "./marechaussee-hunter.js";
import { noblesseOblige } from "./noblesse-oblige.js";
import { nymphsDream } from "./nymphs-dream.js";
import { oceanHuedClam } from "./ocean-hued-clam.js";
import { paleFlame } from "./pale-flame.js";
import { scrollOfTheHeroOfCinderCity } from "./scroll-of-the-hero-of-cinder-city.js";
import { shimenawasReminiscence } from "./shimenawas-reminiscence.js";
import { songOfDaysPast } from "./song-of-days-past.js";
import { thunderingFury } from "./thundering-fury.js";
import { viridescentVenerer } from "./viridescent-venerer.js";

export { archaicPetra } from "./archaic-petra.js";
export { blizzardStrayer } from "./blizzard-strayer.js";
export { crimsonWitch } from "./crimson-witch.js";
export { deepwoodMemories } from "./deepwood-memories.js";
export { defendersWill } from "./defenders-will.js";
export { emblemOfSeveredFate } from "./emblem-of-severed-fate.js";
export { finaleOfTheDeepGalleries } from "./finale-of-the-deep-galleries.js";
export { gildedDreams } from "./gilded-dreams.js";
export { gladiatorFinale } from "./gladiator-finale.js";
export { goldenTroupe } from "./golden-troupe.js";
export { heartOfDepth } from "./heart-of-depth.js";
export { huskOfOpulentDreams } from "./husk-of-opulent-dreams.js";
export { marechausseeHunter } from "./marechaussee-hunter.js";
export { noblesseOblige } from "./noblesse-oblige.js";
export { nymphsDream } from "./nymphs-dream.js";
export { oceanHuedClam } from "./ocean-hued-clam.js";
export { paleFlame } from "./pale-flame.js";
export { scrollOfTheHeroOfCinderCity } from "./scroll-of-the-hero-of-cinder-city.js";
export { shimenawasReminiscence } from "./shimenawas-reminiscence.js";
export { songOfDaysPast } from "./song-of-days-past.js";
export { thunderingFury } from "./thundering-fury.js";
export { viridescentVenerer } from "./viridescent-venerer.js";

/** All ported sets, keyed by `goodId` (the registry / build-config key). */
export const ARTIFACT_SETS: Readonly<Record<string, DbObjectArtifactSet>> = {
  [noblesseOblige.goodId]: noblesseOblige,
  [crimsonWitch.goodId]: crimsonWitch,
  [deepwoodMemories.goodId]: deepwoodMemories,
  [gladiatorFinale.goodId]: gladiatorFinale,
  [goldenTroupe.goodId]: goldenTroupe,
  [heartOfDepth.goodId]: heartOfDepth,
  [marechausseeHunter.goodId]: marechausseeHunter,
  [emblemOfSeveredFate.goodId]: emblemOfSeveredFate,
  [huskOfOpulentDreams.goodId]: huskOfOpulentDreams,
  [shimenawasReminiscence.goodId]: shimenawasReminiscence,
  [thunderingFury.goodId]: thunderingFury,
  [viridescentVenerer.goodId]: viridescentVenerer,
  [blizzardStrayer.goodId]: blizzardStrayer,
  [gildedDreams.goodId]: gildedDreams,
  [oceanHuedClam.goodId]: oceanHuedClam,
  [archaicPetra.goodId]: archaicPetra,
  [defendersWill.goodId]: defendersWill,
  [finaleOfTheDeepGalleries.goodId]: finaleOfTheDeepGalleries,
  [nymphsDream.goodId]: nymphsDream,
  [paleFlame.goodId]: paleFlame,
  [scrollOfTheHeroOfCinderCity.goodId]: scrollOfTheHeroOfCinderCity,
  [songOfDaysPast.goodId]: songOfDaysPast,
};

/** Resolve a set by its registry key; `undefined` if not ported. */
export function getArtifactSet(setKey: string): DbObjectArtifactSet | undefined {
  return ARTIFACT_SETS[setKey];
}
