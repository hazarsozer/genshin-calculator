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
        className="w-24"
      />
    </div>
  );
}

export function LevelInputs() {
  const form = useBuildStore((s) => s.form);
  const setForm = useBuildStore((s) => s.setForm);

  return (
    <div className="flex flex-wrap gap-4">
      <NumberField
        id="char-level"
        label="Char Level"
        value={form.charLevel}
        min={1}
        max={90}
        onChange={(v) => setForm({ charLevel: v })}
      />
      <NumberField
        id="char-ascension"
        label="Ascension"
        value={form.ascension}
        min={0}
        max={6}
        onChange={(v) => setForm({ ascension: v })}
      />
      <NumberField
        id="weapon-level"
        label="Weapon Level"
        value={form.weaponLevel}
        min={1}
        max={90}
        onChange={(v) => setForm({ weaponLevel: v })}
      />
      <NumberField
        id="weapon-ascension"
        label="Weapon Asc"
        value={form.weaponAscension}
        min={0}
        max={6}
        onChange={(v) => setForm({ weaponAscension: v })}
      />
    </div>
  );
}
