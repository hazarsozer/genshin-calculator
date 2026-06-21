'use client';

/**
 * ConditionsPanel — renders the generic condition controls for the current build.
 *
 * Consumes `collectConditions` to derive the full list of UI-renderable controls
 * from the selected character, weapon, and equipped artifact sets, then renders:
 *   - A checkbox per boolean condition (writes conditions.toggles[name])
 *   - A slider + numeric readout per stacks/number condition (writes conditions.stacks[name])
 *   - An infusion element select (writes conditions.infusion)
 *
 * CRITICAL: `setForm` is a shallow top-level merge. Nested `conditions.*` must be
 * spread manually to avoid wiping sibling keys:
 *   setForm({ conditions: { ...form.conditions, toggles: { ...form.conditions.toggles, [name]: v } } })
 */

import { ALL_CHARACTERS, ALL_WEAPONS } from '@genshin/data';
import { useBuildStore } from '@/lib/store';
import { collectConditions } from '@/lib/conditions';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { EquippedSet } from '@genshin/data';

/** The set of Genshin elements usable as normal-attack infusions. */
const INFUSION_ELEMENTS = [
  { value: 'pyro', label: 'Pyro' },
  { value: 'hydro', label: 'Hydro' },
  { value: 'electro', label: 'Electro' },
  { value: 'cryo', label: 'Cryo' },
  { value: 'anemo', label: 'Anemo' },
  { value: 'geo', label: 'Geo' },
  { value: 'dendro', label: 'Dendro' },
] as const;

export function ConditionsPanel() {
  const form = useBuildStore((s) => s.form);
  const setForm = useBuildStore((s) => s.setForm);

  const char = ALL_CHARACTERS.find((c) => c.name === form.characterKey);
  const weapon = ALL_WEAPONS.find((w) => w.name === form.weaponKey);

  if (!char || !weapon) return null;

  // Build the equipped-sets list from the form's manualSets (mode-agnostic: use
  // manualSets always; GOOD mode populates setBonuses at compute time, not here).
  const equippedSets: readonly EquippedSet[] = form.manualSets;

  const controls = collectConditions(char, weapon, equippedSets);

  function handleToggle(name: string, checked: boolean): void {
    setForm({
      conditions: {
        ...form.conditions,
        toggles: { ...form.conditions.toggles, [name]: checked },
      },
    });
  }

  function handleStack(name: string, value: number): void {
    setForm({
      conditions: {
        ...form.conditions,
        stacks: { ...form.conditions.stacks, [name]: value },
      },
    });
  }

  function handleInfusion(value: string | null): void {
    setForm({
      conditions: {
        ...form.conditions,
        infusion: value ?? undefined,
      },
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Infusion select — always visible */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="infusion-select">Attack Infusion</Label>
        <Select
          value={form.conditions.infusion ?? ''}
          onValueChange={handleInfusion}
        >
          <SelectTrigger id="infusion-select" className="w-full">
            <SelectValue placeholder="None" />
          </SelectTrigger>
          <SelectContent>
            {INFUSION_ELEMENTS.map((el) => (
              <SelectItem key={el.value} value={el.value}>
                {el.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Condition controls */}
      {controls.map((ctrl) => {
        if (ctrl.kind === 'boolean') {
          const checked = form.conditions.toggles[ctrl.name] ?? false;
          return (
            <div key={ctrl.name} className="flex items-center gap-2">
              <input
                id={`toggle-${ctrl.name}`}
                type="checkbox"
                checked={checked}
                onChange={(e) => handleToggle(ctrl.name, e.target.checked)}
                className="h-4 w-4 rounded border-input accent-primary"
              />
              <Label htmlFor={`toggle-${ctrl.name}`} className="cursor-pointer">
                {ctrl.label}
              </Label>
            </div>
          );
        }

        // kind === 'number'
        const currentValue = form.conditions.stacks[ctrl.name] ?? 0;
        const max = ctrl.max ?? 10;
        return (
          <div key={ctrl.name} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor={`stack-${ctrl.name}`}>{ctrl.label}</Label>
              <span className="text-sm text-muted-foreground tabular-nums">
                {currentValue}/{max}
              </span>
            </div>
            <Slider
              id={`stack-${ctrl.name}`}
              min={0}
              max={max}
              value={currentValue}
              onValueChange={(v) => handleStack(ctrl.name, typeof v === 'number' ? v : (v as number[])[0])}
              step={1}
            />
          </div>
        );
      })}
    </div>
  );
}
