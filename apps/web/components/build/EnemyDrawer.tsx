"use client";

import { ALL_CHARACTERS, ALL_WEAPONS } from "@genshin/data";
import { useBuildStore } from "@/lib/store";
import { collectGroupedConditions } from "@/lib/conditions";
import { clamp } from "@/lib/utils";
import { Range } from "@/components/controls/Range";
import { ConditionControlWidget } from "./ConditionControl";
import type { EquippedSet } from "@genshin/data";

function SectionHead({ label }: { label: string }) {
  return (
    <div className="mb-1 mt-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ck-faint)]">
      {label}
    </div>
  );
}

export function EnemyDrawer() {
  const form = useBuildStore((s) => s.form);
  const setForm = useBuildStore((s) => s.setForm);

  const char = ALL_CHARACTERS.find((c) => c.name === form.characterKey);
  const weapon = ALL_WEAPONS.find((w) => w.name === form.weaponKey);
  const equipped: readonly EquippedSet[] = form.manualSets;
  const grouped =
    char && weapon ? collectGroupedConditions(char, weapon, equipped) : null;

  const level =
    typeof form.enemy.level === "number" ? form.enemy.level : 90;
  const resistance =
    typeof form.enemy.resistance === "number" ? form.enemy.resistance : 10;

  function handleLevel(raw: string) {
    const parsed = parseInt(raw, 10);
    if (!Number.isNaN(parsed)) {
      setForm({ enemy: { ...form.enemy, level: clamp(parsed, 1, 110) } });
    }
  }

  function handleResistance(raw: string) {
    const parsed = parseInt(raw, 10);
    if (!Number.isNaN(parsed)) {
      setForm({
        enemy: { ...form.enemy, resistance: clamp(parsed, -100, 100) },
      });
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {/* ── Enemy Level ── */}
      <SectionHead label="Enemy Level" />
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <input
            type="text"
            inputMode="numeric"
            value={level}
            onChange={(e) => handleLevel(e.target.value)}
            className="w-14 rounded-md border border-[var(--ck-border)] bg-[var(--ck-surface2)] py-1 text-center text-sm font-bold text-[var(--ck-text)] focus:outline-none focus:ring-1 focus:ring-[var(--ck-accent)]"
          />
          <span className="text-[11px] text-[var(--ck-muted)]">Lv (1–110)</span>
        </div>
        <Range
          min={1}
          max={110}
          value={level}
          onChange={(v) => setForm({ enemy: { ...form.enemy, level: v } })}
        />
      </div>

      {/* ── Resistance ── */}
      <SectionHead label="Resistance %" />
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <input
            type="text"
            inputMode="numeric"
            value={resistance}
            onChange={(e) => handleResistance(e.target.value)}
            className="w-14 rounded-md border border-[var(--ck-border)] bg-[var(--ck-surface2)] py-1 text-center text-sm font-bold text-[var(--ck-text)] focus:outline-none focus:ring-1 focus:ring-[var(--ck-accent)]"
          />
          <span className="text-[11px] text-[var(--ck-muted)]">% (−100 … 100)</span>
        </div>
        <Range
          min={-100}
          max={100}
          value={resistance}
          onChange={(v) =>
            setForm({ enemy: { ...form.enemy, resistance: v } })
          }
        />
      </div>

      {/* ── Enemy conditions (superconduct, etc.) ── */}
      {grouped && grouped.enemy.length > 0 && (
        <>
          <SectionHead label="Debuffs" />
          <div className="flex flex-col gap-2">
            {grouped.enemy.map((ctrl) => (
              <ConditionControlWidget key={ctrl.name} ctrl={ctrl} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
