/**
 * blackmarrow_lantern — 4★ catalyst (v6.0, live port; Nod-Krai craftable)
 *
 * Sub-stat: Elemental Mastery. Passive "Token of Covenant": Bloom DMG +48/60/72/84/96% and
 * Lunar-Bloom DMG +12/15/18/21/24% (R1→R5). Moonsign Ascendant Gleam (≥MS2): Lunar-Bloom DMG
 * +an additional 12→24%. Only the base (non-Moonsign) bonuses are modeled here; the Moonsign
 * extra Lunar-Bloom is deferred (the Prospector's Shovel / Serenity Moonsign-deferral precedent).
 *
 * Passive shape: ConditionBooleanRefine granting two reaction-DMG channels at once
 * (dmg_reaction_bloom + dmg_reaction_lunarbloom) — the Prospector's Shovel multi-channel pattern,
 * one toggle. Toggle: weapon_token_of_covenant.
 *
 * Validation (B2 4★ doctrine — value cross-checked + armory-locked, NO live gate): both reaction-DMG
 * values are two-witness confirmed (Amber + GCSim source). The armory port-snapshot on Nahida
 * exercises the Bloom% via reaction.rupture/burning (both inherit dmg_reaction_bloom — base `bloom`
 * is not emitted per-char; r1 10664 → r5 11914, load-bearing). The Lunar-Bloom% rests on the
 * 2-witness cross-check only (the Nahida rep triggers no Lunar-Bloom). Bloom (the Dendro-Core
 * explosion) is not cleanly single-rep live-gateable; both channels are existing golden-tested keys
 * (cf. Lauma / Aubade set).
 *
 * Sources:
 *   Project Amber (pinned): tools/port/_fixtures/ambr/weapon/14433.json
 *     affix["114433"]: name "Token of Covenant", Bloom 48%→96%, Lunar-Bloom 12%→24% (R1→R5)
 *   GCSim (cross-check): /tmp/gcsim/internal/weapons/catalyst/blackmarrowlantern/blackmarrowlantern.go
 *     buff = 0.09 + 0.03*r; AttackTagBloom → buff*4 (0.48→0.96); AttackTagDirectLunarBloom → buff
 *     (0.12→0.24), *2 at MS2 (deferred)
 *   live-weapons.json gameId 14433, slug "blackmarrow-lantern", type "catalyst"
 */

import type { DbObjectWeapon } from "@genshin/types";
import { BlackmarrowLanternStatTable } from "../generated/blackmarrow-lantern.gen-weapon.js";

export const blackmarrowLantern: DbObjectWeapon = {
  name: "blackmarrow_lantern",
  gameId: 14433,
  rarity: 4,
  weapon: "catalyst",
  statTable: BlackmarrowLanternStatTable,
  conditions: [
    {
      type: "boolean-refine",
      name: "weapon_token_of_covenant",
      serializeId: 1,
      title: "talent_name.token_of_covenant",
      description: "talent_descr.token_of_covenant",
      refinementStats: [
        { dmg_reaction_bloom: 48, dmg_reaction_lunarbloom: 12 }, // R1
        { dmg_reaction_bloom: 60, dmg_reaction_lunarbloom: 15 }, // R2
        { dmg_reaction_bloom: 72, dmg_reaction_lunarbloom: 18 }, // R3
        { dmg_reaction_bloom: 84, dmg_reaction_lunarbloom: 21 }, // R4
        { dmg_reaction_bloom: 96, dmg_reaction_lunarbloom: 24 }, // R5
      ],
    },
  ],
};
