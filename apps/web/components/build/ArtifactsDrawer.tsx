"use client";

import { ALL_CHARACTERS, ALL_WEAPONS } from "@genshin/data";
import { useBuildStore } from "@/lib/store";
import { collectGroupedConditions } from "@/lib/conditions";
import { GoodImport } from "@/components/GoodImport";
import { ManualStatsForm } from "@/components/ManualStatsForm";
import { SetPicker } from "@/components/SetPicker";
import { ConditionControlWidget } from "./ConditionControl";
import type { EquippedSet } from "@genshin/data";

/**
 * ArtifactsDrawer — wraps the existing GOOD-import + manual-stats + set-picker
 * logic (restyled with tokens) plus the equipped set conditions.
 *
 * A slot-based redesign is a later pass — this milestone wraps the existing forms.
 */

function SectionHead({ label }: { label: string }) {
  return (
    <div className="mb-1 mt-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ck-faint)]">
      {label}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md px-3 py-1.5 text-[12px] font-semibold transition-colors"
      style={
        active
          ? {
              background:
                "color-mix(in srgb, var(--ck-accent) 16%, transparent)",
              color: "var(--ck-accent2)",
            }
          : { color: "var(--ck-muted)" }
      }
    >
      {children}
    </button>
  );
}

export function ArtifactsDrawer() {
  const form = useBuildStore((s) => s.form);
  const setForm = useBuildStore((s) => s.setForm);

  const char = ALL_CHARACTERS.find((c) => c.name === form.characterKey);
  const weapon = ALL_WEAPONS.find((w) => w.name === form.weaponKey);
  const equipped: readonly EquippedSet[] = form.manualSets;
  const grouped =
    char && weapon ? collectGroupedConditions(char, weapon, equipped) : null;

  const isGood = form.artifactMode === "good";

  return (
    <div className="flex flex-col gap-2">
      {/* Mode tabs */}
      <div className="inline-flex rounded-lg border border-[var(--ck-border)] bg-[var(--ck-bg)] p-[3px]">
        <TabButton active={isGood} onClick={() => setForm({ artifactMode: "good" })}>
          GOOD Import
        </TabButton>
        <TabButton active={!isGood} onClick={() => setForm({ artifactMode: "manual" })}>
          Manual
        </TabButton>
      </div>

      {isGood ? (
        <GoodImport />
      ) : (
        <>
          <SectionHead label="Base Stats" />
          <ManualStatsForm />
          <SectionHead label="Artifact Sets" />
          <SetPicker />
        </>
      )}

      {/* Set conditions from equipped sets */}
      {grouped && grouped.set.length > 0 && (
        <>
          <SectionHead label="Set Conditions" />
          <div className="flex flex-col gap-2">
            {grouped.set.map((ctrl) => (
              <ConditionControlWidget key={ctrl.name} ctrl={ctrl} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
