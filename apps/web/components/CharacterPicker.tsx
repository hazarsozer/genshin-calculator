'use client';

import { ALL_CHARACTERS } from '@genshin/data';
import { useBuildStore } from '@/lib/store';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export function CharacterPicker() {
  const characterKey = useBuildStore((s) => s.form.characterKey);
  const setForm = useBuildStore((s) => s.setForm);

  function handleChange(key: string | null) {
    if (!key) return;
    setForm({
      characterKey: key,
      conditions: { toggles: {}, stacks: {} },
    });
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="character-picker">Character</Label>
      <Select value={characterKey} onValueChange={handleChange}>
        <SelectTrigger id="character-picker" className="w-full">
          <SelectValue placeholder="Select character" />
        </SelectTrigger>
        <SelectContent>
          {ALL_CHARACTERS.map((c) => (
            <SelectItem key={c.name} value={c.name}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
