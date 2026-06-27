"use client";

import { useResults } from "@/lib/useResults";
import { useBuildStore } from "@/lib/store";
import { ALL_CHARACTERS } from "@genshin/data";
import { humanizeSlug } from "@/lib/utils";
import { SplashArt } from "./SplashArt";
import { StatChip } from "@/components/results/StatChip";

const ELEMENT_LABEL: Record<string, string> = {
  pyro: "Pyro", hydro: "Hydro", electro: "Electro", cryo: "Cryo",
  anemo: "Anemo", geo: "Geo", dendro: "Dendro", physical: "Physical",
};

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");
// Engine stores ratio-type stats as fractions (0.05 = 5%); ×100 for display.
const pct = (n: number | undefined) => `${((n ?? 0) * 100).toFixed(1)}%`;

/** The persistent showcase: splash art, identity, the live headline result, stat strip. */
export function Stage() {
  const result = useResults();
  const form = useBuildStore((s) => s.form);
  const char = ALL_CHARACTERS.find((c) => c.name === form.characterKey);
  const element = char?.element ?? "physical";
  const stats = result.stats ?? {};

  // Headline = highest-average feature (a selector lands in a later task).
  const headline = result.features.length
    ? [...result.features].sort((a, b) => b.triple[2] - a.triple[2])[0]
    : null;

  return (
    <section className="flex flex-col rounded-2xl border border-[var(--ck-border)] bg-gradient-to-b from-[#140d0c] to-[#0e0a0a] p-5">
      <SplashArt name={form.characterKey} className="mb-4 h-[300px] w-full rounded-xl" />

      <div className="mb-1 flex items-center gap-2">
        <span
          className="inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-bold tracking-wider"
          style={{
            borderColor: "color-mix(in srgb, var(--ck-accent) 34%, transparent)",
            background: "color-mix(in srgb, var(--ck-accent) 13%, transparent)",
            color: "var(--ck-accent2)",
          }}
        >
          {ELEMENT_LABEL[element].toUpperCase()}
        </span>
        <span className="text-xs tracking-widest text-[var(--ck-accent2)]">
          {"★".repeat(char?.rarity ?? 5)}
        </span>
        <span className="text-xs font-semibold text-[var(--ck-muted)]">Lv {form.charLevel}</span>
      </div>

      <h2 className="text-4xl font-extrabold tracking-tight">{humanizeSlug(form.characterKey)}</h2>
      <p className="mb-4 text-sm text-[var(--ck-muted)]">
        {humanizeSlug(form.weaponKey)} · R{form.weaponRefine} · C{form.constellation}
      </p>

      {headline ? (
        <>
          <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--ck-accent2)]">
            {headline.label}
          </div>
          <div
            className="font-[family-name:var(--font-display)] text-7xl leading-none tabular-nums text-white"
            style={{ textShadow: "0 0 34px var(--ck-glow)" }}
          >
            {fmt(headline.triple[2])}
          </div>
          <div className="mb-4 mt-2 flex gap-6">
            <div>
              <div className="text-[9.5px] font-bold uppercase tracking-wider text-[var(--ck-faint)]">Non-crit</div>
              <div className="font-[family-name:var(--font-display)] text-2xl tabular-nums">{fmt(headline.triple[0])}</div>
            </div>
            <div>
              <div className="text-[9.5px] font-bold uppercase tracking-wider text-[var(--ck-faint)]">Crit</div>
              <div className="font-[family-name:var(--font-display)] text-2xl tabular-nums text-[var(--ck-accent2)]">{fmt(headline.triple[1])}</div>
            </div>
          </div>
        </>
      ) : (
        <div className="mb-4 mt-2 text-sm text-[var(--ck-muted)]">
          {result.error ?? "Configure a build to see damage."}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        <StatChip label="Crit Rate" value={pct(stats.crit_rate_total)} hot />
        <StatChip label="Crit DMG" value={pct(stats.crit_dmg_total)} hot />
        <StatChip label="ATK" value={fmt(stats.atk_total ?? 0)} />
        <StatChip label="HP" value={fmt(stats.hp_total ?? 0)} />
        <StatChip label="EM" value={fmt(stats.elemental_mastery_total ?? stats.elemental_mastery ?? 0)} />
        <StatChip label={`${ELEMENT_LABEL[element]} DMG`} value={pct(stats[`dmg_${element}`])} hot />
      </div>
    </section>
  );
}
