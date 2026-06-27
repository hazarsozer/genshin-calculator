"use client";

import { useState } from "react";
import { ALL_CHARACTERS, ALL_WEAPONS } from "@genshin/data";
import { useBuildStore } from "@/lib/store";
import { collectGroupedConditions } from "@/lib/conditions";
import { ConditionControlWidget } from "./ConditionControl";
import type { ConditionControl } from "@/lib/conditions";
import type { EquippedSet } from "@genshin/data";

/**
 * BuffsTeamDrawer — displays all global CONDITIONS (CHARACTER_CONDITIONS):
 *   - Elemental Resonance (names starting with "buffs.resonance" or containing "resonance")
 *   - Set Buffs (names starting with "set_other")
 *   - Weapon Buffs (names starting with "weapon_other" or "weapon.")
 *   - Other (imaginarium theatre, bond of life, neuvillette, etc.)
 *
 * Rendered as a single-open accordion.
 */

type SectionId = "resonance" | "set" | "weapon" | "other";

interface Section {
  id: SectionId;
  label: string;
  filter: (ctrl: ConditionControl) => boolean;
}

const SECTIONS: Section[] = [
  {
    id: "resonance",
    label: "Elemental Resonance",
    filter: (c) =>
      c.name.includes("resonance") || c.name.startsWith("buffs.resonance"),
  },
  {
    id: "set",
    label: "Set Buffs",
    filter: (c) => c.name.startsWith("set_other"),
  },
  {
    id: "weapon",
    label: "Weapon Buffs",
    filter: (c) =>
      c.name.startsWith("weapon_other") || c.name.startsWith("weapon."),
  },
  {
    id: "other",
    label: "Other",
    filter: () => true, // catch-all
  },
];

function countActive(ctrls: ConditionControl[], form: ReturnType<typeof useBuildStore.getState>["form"]): number {
  return ctrls.filter((c) => {
    if (c.kind === "boolean") return form.conditions.toggles[c.name] ?? false;
    return (form.conditions.stacks[c.name] ?? 0) > 0;
  }).length;
}

function AccordionSection({
  label,
  controls,
  isOpen,
  onToggle,
}: {
  label: string;
  controls: ConditionControl[];
  isOpen: boolean;
  onToggle: () => void;
}) {
  const form = useBuildStore((s) => s.form);
  const active = countActive(controls, form);

  if (controls.length === 0) return null;

  return (
    <div className="rounded-xl border border-[var(--ck-border)] overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-[var(--ck-surface2)]"
        style={{ background: isOpen ? "var(--ck-surface2)" : "var(--ck-surface)" }}
      >
        <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--ck-muted)]">
          {label}
        </span>
        {active > 0 && (
          <span
            className="ml-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold"
            style={{
              background: "color-mix(in srgb, var(--ck-accent) 20%, transparent)",
              color: "var(--ck-accent2)",
            }}
          >
            {active}
          </span>
        )}
        <span
          className="ml-auto text-[var(--ck-faint)] transition-transform"
          style={{ transform: isOpen ? "rotate(180deg)" : "none" }}
        >
          ▾
        </span>
      </button>
      {isOpen && (
        <div className="flex flex-col gap-2 border-t border-[var(--ck-border)] p-3">
          {controls.map((ctrl) => (
            <ConditionControlWidget key={ctrl.name} ctrl={ctrl} />
          ))}
        </div>
      )}
    </div>
  );
}

export function BuffsTeamDrawer() {
  const form = useBuildStore((s) => s.form);
  const [openSection, setOpenSection] = useState<SectionId | null>("resonance");

  const char = ALL_CHARACTERS.find((c) => c.name === form.characterKey);
  const weapon = ALL_WEAPONS.find((w) => w.name === form.weaponKey);
  const equipped: readonly EquippedSet[] = form.manualSets;

  if (!char || !weapon) {
    return (
      <p className="text-[13px] text-[var(--ck-muted)]">
        Select a character and weapon first.
      </p>
    );
  }

  const grouped = collectGroupedConditions(char, weapon, equipped);
  const global = grouped.global;

  // Partition global conditions into sections (stop at first match)
  const seen = new Set<string>();
  const sections: Record<SectionId, ConditionControl[]> = {
    resonance: [],
    set: [],
    weapon: [],
    other: [],
  };

  for (const ctrl of global) {
    if (seen.has(ctrl.name)) continue;
    seen.add(ctrl.name);
    for (const sec of SECTIONS) {
      if (sec.filter(ctrl)) {
        sections[sec.id].push(ctrl);
        break;
      }
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {SECTIONS.map((sec) => (
        <AccordionSection
          key={sec.id}
          label={sec.label}
          controls={sections[sec.id]}
          isOpen={openSection === sec.id}
          onToggle={() =>
            setOpenSection((prev) => (prev === sec.id ? null : sec.id))
          }
        />
      ))}
    </div>
  );
}
