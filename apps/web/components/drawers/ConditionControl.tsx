"use client";

import { useId, useState } from "react";
import { useBuildStore } from "@/lib/store";
import type { ConditionControl } from "@/lib/conditions";
import { Range } from "@/components/controls/Range";

/**
 * ConditionControl — renders one ConditionControl descriptor as a themed widget.
 *
 * boolean → pill toggle (lit with --ck-accent when active)
 * number  → labeled slider
 *
 * Both variants show an (ⓘ) info button when a plain-text description is
 * available from the raw CSV strings (condition.description). The tooltip is
 * keyboard-accessible (focus-within shows it) and respects prefers-reduced-motion.
 *
 * CRITICAL: spreads nested conditions.* to avoid wiping sibling keys on setForm.
 * Exclusive groups: when ctrl.exclusiveGroup is set, toggling this boolean on
 * clears all sibling keys in the group (only one active at a time).
 */

/** When `binding` is set, the widget is CONTROLLED (drives external state, e.g. a
 *  teammate's settings) instead of the global build store. */
interface ConditionBinding {
  value: number | boolean;
  setValue: (v: number | boolean) => void;
}

interface ConditionControlProps {
  ctrl: ConditionControl;
  binding?: ConditionBinding;
}

/**
 * A small inline tooltip triggered by clicking the (ⓘ) button (click-toggle).
 * Keyboard users press Enter or Space to open/close. The tooltip element is
 * linked to the button via aria-describedby so screen readers announce the
 * description when the button receives focus.
 */
function InfoTooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const tooltipId = useId();

  return (
    <span className="relative flex-none" style={{ lineHeight: 0 }}>
      <span
        role="button"
        tabIndex={0}
        aria-label="Condition description"
        aria-expanded={open}
        aria-describedby={tooltipId}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.stopPropagation();
            setOpen((v) => !v);
          }
        }}
        onBlur={() => setOpen(false)}
        className="rounded-full text-[10px] leading-none transition-opacity"
        style={{
          color: "var(--ck-faint)",
          width: 14,
          height: 14,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1px solid var(--ck-border)",
          background: "var(--ck-surface)",
          cursor: "help",
          flexShrink: 0,
        }}
      >
        ⓘ
      </span>
      {open && (
        <span
          id={tooltipId}
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 w-56 -translate-x-1/2 rounded-lg px-3 py-2 text-[11px] leading-relaxed shadow-lg"
          style={{
            background: "var(--ck-surface)",
            border: "1px solid var(--ck-border)",
            color: "var(--ck-text)",
          }}
        >
          {text}
        </span>
      )}
    </span>
  );
}

export function ConditionControlWidget({ ctrl, binding }: ConditionControlProps) {
  const form = useBuildStore((s) => s.form);
  const setForm = useBuildStore((s) => s.setForm);

  function handleToggle(v: boolean) {
    if (binding) {
      binding.setValue(v);
      return;
    }
    // If exclusive group is set and we're turning ON, clear all siblings first.
    const newToggles = { ...form.conditions.toggles };
    if (v && ctrl.exclusiveGroup) {
      for (const sibling of ctrl.exclusiveGroup) {
        newToggles[sibling] = false;
      }
    }
    newToggles[ctrl.name] = v;
    setForm({
      conditions: { ...form.conditions, toggles: newToggles },
    });
  }

  if (ctrl.kind === "boolean") {
    const checked = binding ? Boolean(binding.value) : (form.conditions.toggles[ctrl.name] ?? false);
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
            background: checked ? "var(--ck-accent)" : "color-mix(in srgb, var(--ck-accent) 20%, var(--ck-surface))",
            boxShadow: checked ? "0 0 7px var(--ck-accent)" : "none",
          }}
        />
        <span
          className="flex-1 text-[11.5px] font-semibold"
          style={{ color: checked ? "var(--ck-text)" : "var(--ck-muted)" }}
        >
          {ctrl.label}
        </span>
        {ctrl.description && <InfoTooltip text={ctrl.description} />}
      </button>
    );
  }

  // kind === "number"
  const rawValue = binding ? Number(binding.value) : (form.conditions.stacks[ctrl.name] ?? 0);
  const baseMax = ctrl.max ?? 10;

  // For mutually-constrained conditions (e.g. ATFD same+different ≤ 3),
  // the effective max shrinks by the sum of sibling values.
  // Bound widgets skip sharedPool shrink — teammate conditions have no shared pools.
  const effectiveMax = !binding && ctrl.sharedPool
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
    if (binding) {
      binding.setValue(clamped);
      return;
    }
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
      <div className="flex items-center justify-between gap-2">
        <span className="flex-1 text-[11px] font-semibold text-[var(--ck-muted)]">
          {ctrl.label}
        </span>
        {ctrl.description && <InfoTooltip text={ctrl.description} />}
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
