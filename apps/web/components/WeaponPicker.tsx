'use client';

import { useEffect } from 'react';
import { ALL_CHARACTERS, ALL_WEAPONS } from '@genshin/data';
import { useBuildStore } from '@/lib/store';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { humanizeSlug } from '@/lib/utils';

export function WeaponPicker() {
  const characterKey = useBuildStore((s) => s.form.characterKey);
  const weaponKey = useBuildStore((s) => s.form.weaponKey);
  const setForm = useBuildStore((s) => s.setForm);

  const char = ALL_CHARACTERS.find((c) => c.name === characterKey);
  const weaponType = char?.weapon ?? 'sword';
  const compatibleWeapons = ALL_WEAPONS.filter((w) => w.weapon === weaponType);

  // When the character's weapon type changes, reset to the first valid weapon.
  useEffect(() => {
    const currentWeaponValid = compatibleWeapons.some((w) => w.name === weaponKey);
    if (!currentWeaponValid && compatibleWeapons.length > 0) {
      setForm({ weaponKey: compatibleWeapons[0].name });
    }
  }, [weaponType]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleChange(key: string | null) {
    if (!key) return;
    setForm({ weaponKey: key });
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="weapon-picker">Weapon</Label>
      <Select value={weaponKey} onValueChange={handleChange}>
        <SelectTrigger id="weapon-picker" className="w-full">
          <SelectValue placeholder="Select weapon" />
        </SelectTrigger>
        <SelectContent>
          {compatibleWeapons.map((w) => (
            <SelectItem key={w.name} value={w.name}>
              {humanizeSlug(w.name)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
