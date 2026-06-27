"use client";

import { Stage } from "./Stage";
import { Breakdown } from "@/components/results/Breakdown";
import { CharacterPicker } from "@/components/CharacterPicker";
import { WeaponPicker } from "@/components/WeaponPicker";
import { LevelInputs } from "@/components/LevelInputs";
import { TalentInputs } from "@/components/TalentInputs";
import { ConditionsPanel } from "@/components/ConditionsPanel";
import { ArtifactPanel } from "@/components/ArtifactPanel";
import { EnemyPanel } from "@/components/EnemyPanel";

const RAIL = ["Build", "Team", "Enemy", "Buffs", "Food", "Cond"];

function Panel({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--ck-border)] bg-[var(--ck-surface)] p-4">
      {title && (
        <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--ck-faint)]">
          {title}
        </div>
      )}
      {children}
    </div>
  );
}

/** The cockpit grid: icon rail · persistent stage · work column. */
export function Cockpit() {
  return (
    <div className="grid flex-1 lg:grid-cols-[64px_1fr_440px]">
      {/* icon rail (placeholder — drawers wire up in a later task) */}
      <nav className="hidden flex-col items-center gap-1 border-r border-[var(--ck-border)] bg-[#0e0a0a] py-3 lg:flex">
        {RAIL.map((t, i) => (
          <div
            key={t}
            className="flex h-11 w-11 flex-col items-center justify-center gap-1 rounded-xl text-[8px] font-bold uppercase tracking-wide text-[var(--ck-faint)]"
            style={i === 0 ? { color: "var(--ck-accent2)", background: "color-mix(in srgb, var(--ck-accent) 12%, transparent)" } : undefined}
          >
            <div className="h-[18px] w-[18px] rounded border border-current opacity-70" />
            {t}
          </div>
        ))}
      </nav>

      {/* persistent stage */}
      <div className="overflow-y-auto p-5">
        <Stage />
      </div>

      {/* work column — temporary controls until Tasks 8–11 restyle them */}
      <aside className="flex flex-col gap-4 overflow-y-auto border-t border-[var(--ck-border)] p-5 lg:border-l lg:border-t-0">
        <Panel title="Build · temporary controls">
          <div className="flex flex-col gap-3 text-sm">
            <CharacterPicker />
            <WeaponPicker />
            <LevelInputs />
            <TalentInputs />
          </div>
        </Panel>
        <Panel><ConditionsPanel /></Panel>
        <Panel><ArtifactPanel /></Panel>
        <Panel><EnemyPanel /></Panel>
        <Panel title="Damage Breakdown">
          <Breakdown />
        </Panel>
      </aside>
    </div>
  );
}
