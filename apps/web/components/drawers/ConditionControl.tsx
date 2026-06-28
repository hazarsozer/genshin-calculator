"use client";

import { useBuildStore } from "@/lib/store";
import type { ConditionControl } from "@/lib/conditions";
import { Range } from "@/components/controls/Range";

/**
 * ConditionControl — renders one ConditionControl descriptor as a themed widget.
 *
 * boolean → pill toggle (lit with --ck-accent when active)
 * number  → labeled slider
 *
 * CRITICAL: spreads nested conditions.* to avoid wiping sibling keys on setForm.
 */

interface ConditionControlProps {
  ctrl: ConditionControl;
}

export function ConditionControlWidget({ ctrl }: ConditionControlProps) {
  const form = useBuildStore((s) => s.form);
  const setForm = useBuildStore((s) => s.setForm);

  function handleToggle(v: boolean) {
    setForm({
      conditions: {
        ...form.conditions,
        toggles: { ...form.conditions.toggles, [ctrl.name]: v },
      },
    });
  }

  if (ctrl.kind === "boolean") {
    const checked = form.conditions.toggles[ctrl.name] ?? false;
    return (
      <button
        type="button"
        onClick={() => handleToggle(!checked)}
        className="flex w-full cursor-pointer items-center gap-3 rounded-full border px-3 py-2 text-left transition-colors"
        style={{
          background: checked
            ? "color-mix(in srgb, var(--ck-accent) 10%, transparent)"
            : "var(--ck-surface)",
          borderColor: checked
            ? "color-mix(in srgb, var(--ck-accent) 45%, transparent)"
            : "var(--ck-border)",
        }}
      >
        {/* LED dot */}
        <span
          className="h-1.5 w-1.5 flex-none rounded-full"
          style={{
            background: checked ? "var(--ck-accent)" : "#3a2c28",
            boxShadow: checked ? "0 0 7px var(--ck-accent)" : "none",
          }}
        />
        <span
          className="text-[11.5px] font-semibold"
          style={{ color: checked ? "var(--ck-text)" : "var(--ck-muted)" }}
        >
          {ctrl.label}
        </span>
      </button>
    );
  }

  // kind === "number"
  const rawValue = form.conditions.stacks[ctrl.name] ?? 0;
  const baseMax = ctrl.max ?? 10;

  // For mutually-constrained conditions (e.g. ATFD same+different ≤ 3),
  // the effective max shrinks by the sum of sibling values.
  const effectiveMax = ctrl.sharedPool
    ? Math.max(
        0,
        ctrl.sharedPool.cap -
          ctrl.sharedPool.siblings.reduce(
            (s, k) => s + (form.conditions.stacks[k] ?? 0),
            0,
          ),
      )
    : baseMax;

  const currentValue = Math.min(rawValue, effectiveMax);
  const active = currentValue > 0;

  function handleStack(v: number) {
    const clamped = Math.min(v, effectiveMax);
    setForm({
      conditions: {
        ...form.conditions,
        stacks: { ...form.conditions.stacks, [ctrl.name]: clamped },
      },
    });
  }

  return (
    <div
      className="flex flex-col gap-2 rounded-xl border p-3"
      style={{
        background: active
          ? "color-mix(in srgb, var(--ck-accent) 7%, var(--ck-surface))"
          : "var(--ck-surface)",
        borderColor: active
          ? "color-mix(in srgb, var(--ck-accent) 35%, transparent)"
          : "var(--ck-border)",
      }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-[var(--ck-muted)]">{ctrl.label}</span>
        <span
          className="text-[12px] font-bold tabular-nums"
          style={{ color: active ? "var(--ck-accent2)" : "var(--ck-faint)" }}
        >
          {currentValue}/{effectiveMax}
        </span>
      </div>
      <Range min={0} max={effectiveMax} value={currentValue} onChange={handleStack} />
    </div>
  );
}
