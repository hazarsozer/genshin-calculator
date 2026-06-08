/**
 * R3 rotation — rotation.total guard (RED by design until compileRotation lands).
 *
 * The `rotation` oracle config (build-configs.mjs §rotation: rotationItems) drives Aspirine's
 * Rotation subsystem: each rep calls build.setRotation(new DB.__Rotation({items})) → her
 * getFeaturesList runs compileRotation() (CalcSet.js:453-459) → FeatureRotation.getResult dumps
 * `rotation.total` as a {normal,crit,average} triple (category "rotation"). `rotation.total` is
 * THREE independent componentwise accumulators (Tree.js:36-44,110-136): total_normal =
 * Σ count·perFeatureNormal, total_crit = Σ count·perFeatureCrit, total_average =
 * Σ count·perFeatureAverage (each hit blended AT ITS OWN crit rate, THEN summed).
 *
 * Each rep's fixture (tests/golden/fixtures/rotation/) therefore carries her engine's
 * rotation.total triple; this suite reconstructs the SAME rotation spec from
 * partyRecord.rotation, compiles the rep's per-feature closures via compileCharacter (with the
 * spec threaded as ctx.rotation → loader.ts composes rotation.total), and asserts ALL THREE
 * components (normal/crit/avg) within 0.1. Asserting all three locks the floor/ceiling/blend —
 * an avg-only assertion would miss the mixed-crit-rate trap (a wrong avg = blend(total_normal,
 * total_crit) at one rate passes avg by construction only when the hits share a crit rate).
 *
 * Reps (partyRecord.rotation carries the node tree; partyRecord.settings the dump settings):
 *   - rotation-fischl-mixed-crit (Fischl, enemy_weak_shot): [charged_aimed×1, normal_hit_1×5].
 *     The aimed shot crits at 100% (FeatureDamageChargedAimed under weak-shot); the physical
 *     normals at ~10%. The crit rates DIFFER → a wrong avg=blend(Σnormal,Σcrit) fails. THE guard.
 *   - rotation-keqing-simple (Keqing): [normal_hit_1×3] — a simple count>1 single-element seq.
 *   - rotation-fischl-repeat (Fischl): [repeat ×3 of [normal_hit_1×1]] — repeat == 3× single.
 *   - rotation-fischl-mixed-block (Fischl, enemy_weak_shot): [charged_aimed, repeat×2, aimed] —
 *     a loose-feature/repeat/loose-feature mix; reorderItems defers the repeat after the loose
 *     features but the SUM is order-independent here (no conditions), so the total is unchanged.
 *
 * Anti-gaming (verified, not encoded — the burndown is the live guard):
 *   - Phase 1 (mixed crit): computing avg = blend(Σnormal, Σcrit) at a single crit rate makes
 *     ONLY the two mixed-crit reps fail on `average` (off by ~3039 / ~4239); the equal-crit reps
 *     stay green → the Σ-per-hit-avg accumulation is load-bearing.
 *   - Phase 2 (repeat count): neutralizing the repeat `count` factor (folding 1× instead of
 *     count×) makes ONLY the two repeat reps fail on ALL THREE components (fischl-repeat at exactly
 *     1× = ⅓ of the oracle); the non-repeat reps stay green → the count factor is load-bearing.
 *
 * Until compileRotation + the loader.ts branch land, compileCharacter emits no rotation.total →
 * the key is absent → RED (the family-exists guard + each rep's missing-key assertion). Wiring it
 * GREEN is the new compileRotation.ts composing the per-feature triples. The spec reconstructed
 * per rep is EXACTLY the spec the oracle dumped, so this suite goes GREEN with NO edits here.
 *
 * FILTERED SUB-TOTALS (T3): each fixture ALSO carries one rotation.total_<element> / _<type> per
 * element+type PRESENT in the rotation (her getDisplaySettings, Rotation.js:139-195 — the filtered
 * re-walk that elides feature nodes whose RESOLVED element AND STATIC type both differ from the
 * filter; Tree.js:47,66-73). For EVERY ^rotation\.total_ key in a fixture we assert the matching
 * compiled[key] closure within tolerance (compileRotation now returns one closure per present
 * bucket; loader.ts assigns them all). Two anti-gaming partitions on rotation-fischl-mixed-block
 * (electro charged + phys normals + phys aimed): total_electro + total_phys == total AND
 * total_charged + total_normal == total (two INDEPENDENT partitions both reconstruct the bare
 * total — a no-op filter fails ≠-total, an element-only filter fails the type keys, a type-only
 * filter fails the element keys), plus total_electro ≠ total and total_charged ≠ total (the filter
 * excludes something). And the Mona-vaporize reaction-bucket: total_hydro == total (both hits
 * hydro, incl. the amplified explosion — getElement ignores settings.reaction) and total_skill ==
 * the amplified explosion contribution only. The Hu Tao condition/uptime fixtures carry BOTH
 * total_phys (hit1, base) AND total_pyro (hit2, Paramita-infused) — the per-key assertion locks
 * that the port buckets each hit under its ACTIVE (overlaid) settings, not the base.
 *
 * GUARD — HONESTY RULES (verbatim from foodBurndown.test.ts): NO it.skip, NO it.todo, NO it.fails,
 * NO loosened tolerance, NO hard-coded overrides. The RED is by design pending compileRotation.
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
import type { DbObjectChar, Rotation, StatTableEntry, EvalContext } from "@genshin/types";
import { type FixtureEntry } from "./_fixtureEntry.js";

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

interface ManifestItem {
  readonly slug: string;
  /** The charKey (e.g. "Fischl"). */
  readonly repKey: string;
  /** The TS slug (e.g. "fischl") — used to resolve the recipient DbObjectChar. */
  readonly repSlug: string;
  /** The reconstructable rotation spec + the dump settings the oracle dumped under. */
  readonly party: { readonly rotation: Rotation; readonly settings?: EvalContext };
}

interface Manifest {
  readonly items: readonly ManifestItem[];
}

interface Fixture {
  readonly slug: string;
  readonly features: Record<string, FixtureEntry>;
}

const ROTATION_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../tests/golden/fixtures/rotation"
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

// slug ("fischl") -> DbObjectChar. The rotation config is a partyItems config, so a fixture's slug
// is the EFFECT slug (e.g. "rotation-fischl-mixed-crit"); the rep char is resolved from the
// manifest's repSlug (mirroring foodBurndown.test.ts).
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

const manifest: Manifest = existsSync(join(ROTATION_DIR, "_manifest.json"))
  ? (JSON.parse(readFileSync(join(ROTATION_DIR, "_manifest.json"), "utf-8")) as Manifest)
  : { items: [] };

describe("rotation-burndown", () => {
  it("the rotation fixture family exists", () => {
    expect(manifest.items.length).toBeGreaterThan(0);
  });
});

for (const item of manifest.items) {
  describe(`rotation-burndown: ${item.slug}`, () => {
    const char = charBySlug[item.repSlug];
    const fixture: Fixture | undefined = existsSync(join(ROTATION_DIR, `${item.slug}.json`))
      ? (JSON.parse(readFileSync(join(ROTATION_DIR, `${item.slug}.json`), "utf-8")) as Fixture)
      : undefined;

    if (!char || !fixture) {
      it(`${item.slug}: rep char + fixture present`, () =>
        expect.fail(
          `missing rep char '${item.repSlug}' or fixture '${item.slug}.json'`
        ));
      return;
    }

    // The rotation was dumped under these settings (enemy_weak_shot for the mixed-crit reps); the
    // no-toggle reps default to empty. The condition rep has none — its overlay is INTERNAL.
    const settings: EvalContext = item.party.settings ?? {};

    // Canonical derive (mirrors goldenConfig.test.ts): buildStats with talentLevels (so
    // talent-scaled post-effects — Hu Tao's Paramita HP→ATK reads char_skill_attack — resolve)
    // → return the bag context AND the PROPAGATED settings (buildStats merges each active
    // condition's `.settings`, e.g. Paramita's `attack_infusion:'pyro'`). compileCharacter is
    // then called under the PROPAGATED settings so infusions/talent offsets land. Returns the
    // pieces the closures need. This is the seam's body too: the SAME re-derive a real caller
    // (loader.ts) wires for a mid-rotation change.
    const derive = (s: EvalContext) => {
      const { context: ctx, settings: propagated } = buildStats({
        char,
        weaponStatTable: WEAPON_TABLE_BY_TYPE[char.weapon]!,
        statBlock: STAT_BLOCK,
        levels: LEVELS,
        enemy: ENEMY,
        settings: s,
        talentLevels: TALENTS,
      });
      return { context: ctx, propagated };
    };

    const { context, propagated } = derive(settings);

    // The recompile seam (Phase 5a reaction tags + Phase 3 condition overlays): re-derive
    // {compiled, context} under fully-merged settings (her engine resolves reaction + stats at
    // COMPILE time, so a per-node settings change recompiles the affected hits). The re-call
    // must NOT pass `rotation` (no recursion — it only needs the feature map). A pure
    // feature/repeat rep never invokes this; the reaction/condition reps do.
    const rotationRecompile = (merged: Readonly<Record<string, unknown>>) => {
      const { context: ctx, propagated: prop } = derive(merged as EvalContext);
      const comp = compileCharacter(char, {
        charElement: char.element,
        talentLevels: TALENTS,
        settings: prop,
        charLevel: LEVELS.charLevel,
      });
      // Return the PROPAGATED settings (post-buildStats condition-settings merge) so the rotation's
      // filtered sub-totals (T3) can resolve an overlay's infused element (e.g. Paramita → pyro),
      // which lives only in the propagation, not the raw overlay.
      return { compiled: comp, context: ctx, settings: prop };
    };

    // Thread the reconstructed rotation spec as ctx.rotation → loader.ts composes the char's
    // per-feature triples into rotation.total, with the seam for any settings-changing node.
    // Pass the PROPAGATED settings so the base feature map (loader's `out`, used as the base
    // slice) AND `context` agree on the same bag. loader.ts forwards these as baseSettings the
    // overlay merges onto (idempotent — re-deriving under them yields the same propagation).
    const compiled = compileCharacter(char, {
      charElement: char.element,
      talentLevels: TALENTS,
      settings: propagated,
      charLevel: LEVELS.charLevel,
      rotation: item.party.rotation,
      rotationRecompile,
    });

    const oracle = fixture.features["rotation.total"]!;
    it(`${item.slug}/rotation.total present`, () => {
      expect(
        oracle,
        `oracle fixture '${item.slug}' is missing rotation.total`
      ).toBeDefined();
      expect("rotation.total" in compiled, `compiled output is missing rotation.total`).toBe(true);
    });

    // Assert ALL THREE components — normal (floor: no hit crits), crit (ceiling: every hit crits),
    // and avg (Σ per-hit avg). The mixed-crit reps make avg the load-bearing component (a single-
    // rate blend would mismatch); the floor/ceiling lock the other two.
    for (const component of ["normal", "crit", "average"] as const) {
      it(`${item.slug}/rotation.total ${component} within ${TOLERANCE}`, () => {
        const fn = compiled["rotation.total"];
        expect(fn, `compiled rotation.total missing for ${item.slug}`).toBeDefined();
        const result = fn!(context);
        // map oracle's `average` to our triple's `avg`.
        const ours = component === "average" ? result.avg : result[component];
        expect(
          Math.abs(ours - oracle[component]),
          `${item.slug}/rotation.total ${component}: ours=${ours.toFixed(2)}, oracle=${oracle[component].toFixed(2)}`
        ).toBeLessThanOrEqual(TOLERANCE);
      });
    }

    // FILTERED SUB-TOTALS (T3) — every rotation.total_<element>/<type> the oracle dumped must have
    // a matching compiled closure within tolerance. The oracle key set = her getDisplaySettings
    // present-bucket enumeration; the port emits one closure per present bucket (loader assigns
    // them all into `compiled`). A missing key (port emits none) or a wrong value → RED.
    const subTotalKeys = Object.keys(fixture.features)
      .filter((k) => k.startsWith("rotation.total_"))
      .sort();
    for (const key of subTotalKeys) {
      const sub = fixture.features[key]!;
      for (const component of ["normal", "crit", "average"] as const) {
        it(`${item.slug}/${key} ${component} within ${TOLERANCE}`, () => {
          const fn = compiled[key];
          expect(fn, `compiled output is missing ${key} for ${item.slug}`).toBeDefined();
          const result = fn!(context);
          const ours = component === "average" ? result.avg : result[component];
          expect(
            Math.abs(ours - sub[component]),
            `${item.slug}/${key} ${component}: ours=${ours.toFixed(2)}, oracle=${sub[component].toFixed(2)}`
          ).toBeLessThanOrEqual(TOLERANCE);
        });
      }
    }

    // ── anti-gaming: the Fischl mixed-block partition (the decisive guard) ──────────────────
    // rotation-fischl-mixed-block = [charged_aimed (electro, charged), repeat×2[normal_hit_1 (phys,
    // normal)], aimed (phys, charged)]. TWO independent partitions must BOTH reconstruct the bare
    // total, and each filter must EXCLUDE something:
    //   element: total_electro + total_phys == total   (a type-only filter would fail this)
    //   type:    total_charged + total_normal == total (an element-only filter would fail this)
    //   total_electro ≠ total AND total_charged ≠ total (a no-op filter would fail these)
    // These are oracle-grounded (verified against the dumped fixture), not mere sanity — a wrong
    // bucketing (no-op / element-only / type-only / double-count) fails at least one.
    if (item.slug === "rotation-fischl-mixed-block") {
      for (const component of ["normal", "crit", "average"] as const) {
        const comp = (k: string): number => {
          const fn = compiled[k];
          if (!fn) throw new Error(`missing compiled ${k}`);
          const r = fn(context);
          return component === "average" ? r.avg : r[component];
        };
        it(`fischl-mixed-block: element partition (electro + phys == total) [${component}]`, () => {
          const total = comp("rotation.total");
          const sum = comp("rotation.total_electro") + comp("rotation.total_phys");
          expect(Math.abs(sum - total), `electro+phys=${sum.toFixed(2)} vs total=${total.toFixed(2)}`).toBeLessThanOrEqual(TOLERANCE);
        });
        it(`fischl-mixed-block: type partition (charged + normal == total) [${component}]`, () => {
          const total = comp("rotation.total");
          const sum = comp("rotation.total_charged") + comp("rotation.total_normal");
          expect(Math.abs(sum - total), `charged+normal=${sum.toFixed(2)} vs total=${total.toFixed(2)}`).toBeLessThanOrEqual(TOLERANCE);
        });
      }
      it("fischl-mixed-block: total_electro ≠ total (the filter excludes the phys hits)", () => {
        const total = compiled["rotation.total"]!(context).normal;
        const electro = compiled["rotation.total_electro"]!(context).normal;
        expect(Math.abs(electro - total), `electro=${electro.toFixed(2)} must differ from total=${total.toFixed(2)}`).toBeGreaterThan(1);
      });
      it("fischl-mixed-block: total_charged ≠ total (the filter excludes the normal hits)", () => {
        const total = compiled["rotation.total"]!(context).normal;
        const charged = compiled["rotation.total_charged"]!(context).normal;
        expect(Math.abs(charged - total), `charged=${charged.toFixed(2)} must differ from total=${total.toFixed(2)}`).toBeGreaterThan(1);
      });
    }

    // ── anti-gaming: Mona-vaporize reaction bucketing ──────────────────────────────────────
    // [skill.explosion_dmg (reaction:2 → vaporize ×2.0, hydro, skill), normal_hit_1 (hydro, normal)].
    // total_hydro == total (BOTH hits are hydro, including the AMPLIFIED explosion — her getElement
    // ignores settings.reaction, so the amplified magnitude buckets under the unchanged element),
    // and total_skill == the amplified explosion contribution ONLY (< total; the normal is the rest).
    if (item.slug === "rotation-mona-vaporize") {
      it("mona-vaporize: total_hydro == total (amplified explosion buckets under hydro)", () => {
        for (const component of ["normal", "crit", "average"] as const) {
          const total = component === "average" ? compiled["rotation.total"]!(context).avg : compiled["rotation.total"]!(context)[component];
          const hydro = component === "average" ? compiled["rotation.total_hydro"]!(context).avg : compiled["rotation.total_hydro"]!(context)[component];
          expect(Math.abs(hydro - total), `${component}: hydro=${hydro.toFixed(2)} vs total=${total.toFixed(2)}`).toBeLessThanOrEqual(TOLERANCE);
        }
      });
      it("mona-vaporize: total_skill == the amplified explosion only (< total)", () => {
        const total = compiled["rotation.total"]!(context).normal;
        const skill = compiled["rotation.total_skill"]!(context).normal;
        // The oracle dumped skill ≈ 8346 < total ≈ 9271; assert it equals the oracle skill value
        // (already covered by the per-key loop) AND is strictly less than the bare total.
        expect(skill, `skill=${skill.toFixed(2)} must be strictly < total=${total.toFixed(2)}`).toBeLessThan(total - 1);
      });
    }
  });
}
