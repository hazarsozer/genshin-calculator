"use client";

import { useState, useRef } from "react";
import { ALL_CHARACTERS, ALL_WEAPONS } from "@genshin/data";
import { useBuildStore } from "@/lib/store";
import { collectGroupedConditions } from "@/lib/conditions";
import { clamp } from "@/lib/utils";
import { Range } from "@/components/controls/Range";
import { ConditionControlWidget } from "./ConditionControl";
import { elementAccent } from "@/lib/theme";
import type { EquippedSet } from "@genshin/data";

/** Engine element order — must match buildStats.ts ELEMENTS exactly so Record keys resolve. */
const RESISTANCE_ELEMENTS = [
  "physical",
  "pyro",
  "hydro",
  "electro",
  "cryo",
  "anemo",
  "geo",
  "dendro",
] as const;
type ResEl = (typeof RESISTANCE_ELEMENTS)[number];

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

  // Infer initial mode from resistance shape
  const isPerElementInit =
    typeof form.enemy.resistance === "object" && form.enemy.resistance !== null;
  const [mode, setMode] = useState<"uniform" | "per-element">(
    isPerElementInit ? "per-element" : "uniform"
  );

  // Preserve the last uniform value for round-tripping back from per-element
  const uniformRef = useRef<number>(
    typeof form.enemy.resistance === "number" ? form.enemy.resistance : 10
  );

  const uniformResistance =
    typeof form.enemy.resistance === "number" ? form.enemy.resistance : 10;
  const perElResistance =
    typeof form.enemy.resistance === "object" && form.enemy.resistance !== null
      ? (form.enemy.resistance as Record<string, number>)
      : {};

  function handleLevel(raw: string) {
    const parsed = parseInt(raw, 10);
    if (!Number.isNaN(parsed)) {
      setForm({ enemy: { ...form.enemy, level: clamp(parsed, 1, 110) } });
    }
  }

  function handleUniformInput(raw: string) {
    const parsed = parseInt(raw, 10);
    if (!Number.isNaN(parsed)) {
      const v = clamp(parsed, -100, 100);
      uniformRef.current = v;
      setForm({ enemy: { ...form.enemy, resistance: v } });
    }
  }

  function handleUniformSlider(v: number) {
    uniformRef.current = v;
    setForm({ enemy: { ...form.enemy, resistance: v } });
  }

  function handlePerElementInput(el: ResEl, raw: string) {
    const parsed = parseInt(raw, 10);
    if (!Number.isNaN(parsed)) {
      const current =
        typeof form.enemy.resistance === "object" &&
        form.enemy.resistance !== null
          ? form.enemy.resistance
          : {};
      setForm({
        enemy: {
          ...form.enemy,
          resistance: { ...current, [el]: clamp(parsed, -100, 100) },
        },
      });
    }
  }

  function switchToPerElement() {
    // Seed all elements from the current uniform value so nothing jumps
    const seed =
      typeof form.enemy.resistance === "number"
        ? form.enemy.resistance
        : uniformRef.current;
    const seeded: Record<string, number> = {};
    for (const el of RESISTANCE_ELEMENTS) {
      seeded[el] = seed;
    }
    setMode("per-element");
    setForm({ enemy: { ...form.enemy, resistance: seeded } });
  }

  function switchToUniform() {
    setMode("uniform");
    setForm({ enemy: { ...form.enemy, resistance: uniformRef.current } });
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

      {/* Uniform / Per-element toggle */}
      <div className="flex gap-1 rounded-md border border-[var(--ck-border)] p-0.5 text-[11px]">
        <button
          onClick={mode === "per-element" ? switchToUniform : undefined}
          className={`flex-1 rounded py-0.5 text-center font-medium transition-colors ${
            mode === "uniform"
              ? "bg-[var(--ck-accent)] text-[var(--ck-bg)]"
              : "text-[var(--ck-muted)] hover:text-[var(--ck-text)]"
          }`}
        >
          Uniform
        </button>
        <button
          onClick={mode === "uniform" ? switchToPerElement : undefined}
          className={`flex-1 rounded py-0.5 text-center font-medium transition-colors ${
            mode === "per-element"
              ? "bg-[var(--ck-accent)] text-[var(--ck-bg)]"
              : "text-[var(--ck-muted)] hover:text-[var(--ck-text)]"
          }`}
        >
          Per-element
        </button>
      </div>

      {mode === "uniform" ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <input
              type="text"
              inputMode="numeric"
              value={uniformResistance}
              onChange={(e) => handleUniformInput(e.target.value)}
              className="w-14 rounded-md border border-[var(--ck-border)] bg-[var(--ck-surface2)] py-1 text-center text-sm font-bold text-[var(--ck-text)] focus:outline-none focus:ring-1 focus:ring-[var(--ck-accent)]"
            />
            <span className="text-[11px] text-[var(--ck-muted)]">% (−100 … 100)</span>
          </div>
          <Range
            min={-100}
            max={100}
            value={uniformResistance}
            onChange={handleUniformSlider}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {RESISTANCE_ELEMENTS.map((el) => {
            const accent = elementAccent(el);
            const val = perElResistance[el] ?? 10;
            return (
              <div key={el} className="flex items-center gap-2">
                <span
                  className="w-16 text-right text-[11px] font-medium capitalize"
                  style={{ color: accent.accent }}
                >
                  {el}
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={val}
                  onChange={(e) => handlePerElementInput(el, e.target.value)}
                  style={{ borderColor: accent.accent + "66" }}
                  className="w-14 rounded-md border bg-[var(--ck-surface2)] py-1 text-center text-sm font-bold text-[var(--ck-text)] focus:outline-none focus:ring-1 focus:ring-[var(--ck-accent)]"
                />
                <span className="text-[10px] text-[var(--ck-muted)]">%</span>
              </div>
            );
          })}
        </div>
      )}

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
