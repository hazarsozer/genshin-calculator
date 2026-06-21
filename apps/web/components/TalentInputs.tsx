'use client';

import { useBuildStore } from '@/lib/store';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function NumberField({
  id,
  label,
  value,
  min,
  max,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => {
          const parsed = parseInt(e.target.value, 10);
          if (!Number.isNaN(parsed)) {
            onChange(clamp(parsed, min, max));
          }
        }}
        className="w-20"
      />
    </div>
  );
}

export function TalentInputs() {
  const form = useBuildStore((s) => s.form);
  const setForm = useBuildStore((s) => s.setForm);

  return (
    <div className="flex flex-wrap gap-4">
      <NumberField
        id="talent-attack"
        label="Normal Attack"
        value={form.talents.attack}
        min={1}
        max={10}
        onChange={(v) => setForm({ talents: { ...form.talents, attack: v } })}
      />
      <NumberField
        id="talent-elemental"
        label="Skill"
        value={form.talents.elemental}
        min={1}
        max={10}
        onChange={(v) =>
          setForm({ talents: { ...form.talents, elemental: v } })
        }
      />
      <NumberField
        id="talent-burst"
        label="Burst"
        value={form.talents.burst}
        min={1}
        max={10}
        onChange={(v) => setForm({ talents: { ...form.talents, burst: v } })}
      />
      <NumberField
        id="constellation"
        label="Constellation"
        value={form.constellation}
        min={0}
        max={6}
        onChange={(v) => setForm({ constellation: v })}
      />
      <NumberField
        id="weapon-refine"
        label="Refinement"
        value={form.weaponRefine}
        min={1}
        max={5}
        onChange={(v) => setForm({ weaponRefine: v })}
      />
    </div>
  );
}
