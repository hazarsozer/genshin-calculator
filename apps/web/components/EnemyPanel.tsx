'use client';

import { useBuildStore } from '@/lib/store';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { clamp } from '@/lib/utils';

export function EnemyPanel() {
  const enemy = useBuildStore((s) => s.form.enemy);
  const setForm = useBuildStore((s) => s.setForm);

  const level =
    typeof enemy.level === 'number' ? enemy.level : 90;
  const resistance =
    typeof enemy.resistance === 'number' ? enemy.resistance : 10;

  return (
    <div className="flex flex-wrap gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="enemy-level">Enemy Level</Label>
        <Input
          id="enemy-level"
          type="number"
          min={1}
          max={100}
          value={level}
          onChange={(e) => {
            const parsed = parseInt(e.target.value, 10);
            if (!Number.isNaN(parsed)) {
              setForm({ enemy: { ...enemy, level: clamp(parsed, 1, 100) } });
            }
          }}
          className="w-24"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="enemy-resistance">Resistance (%)</Label>
        <Input
          id="enemy-resistance"
          type="number"
          min={-100}
          max={100}
          value={resistance}
          onChange={(e) => {
            const parsed = parseInt(e.target.value, 10);
            if (!Number.isNaN(parsed)) {
              setForm({
                enemy: { ...enemy, resistance: clamp(parsed, -100, 100) },
              });
            }
          }}
          className="w-24"
        />
      </div>
    </div>
  );
}
