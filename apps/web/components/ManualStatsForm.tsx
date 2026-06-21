'use client';

import { useBuildStore } from '@/lib/store';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/** Stats that are already raw fractions in Aspirine's key space — show "%" label. */
const PERCENT_KEYS = new Set([
  'atk_percent',
  'hp_percent',
  'def_percent',
  'crit_rate',
  'crit_dmg',
  'recharge',
  'dmg_pyro',
  'dmg_hydro',
  'dmg_electro',
  'dmg_cryo',
  'dmg_anemo',
  'dmg_geo',
  'dmg_dendro',
  'dmg_phys',
  'healing',
]);

const STAT_FIELDS: { key: string; label: string }[] = [
  { key: 'atk_percent', label: 'ATK %' },
  { key: 'atk', label: 'ATK' },
  { key: 'hp_percent', label: 'HP %' },
  { key: 'hp', label: 'HP' },
  { key: 'def_percent', label: 'DEF %' },
  { key: 'def', label: 'DEF' },
  { key: 'mastery', label: 'Elemental Mastery' },
  { key: 'crit_rate', label: 'Crit Rate %' },
  { key: 'crit_dmg', label: 'Crit DMG %' },
  { key: 'recharge', label: 'Energy Recharge %' },
  { key: 'dmg_pyro', label: 'Pyro DMG %' },
  { key: 'dmg_hydro', label: 'Hydro DMG %' },
  { key: 'dmg_electro', label: 'Electro DMG %' },
  { key: 'dmg_cryo', label: 'Cryo DMG %' },
  { key: 'dmg_anemo', label: 'Anemo DMG %' },
  { key: 'dmg_geo', label: 'Geo DMG %' },
  { key: 'dmg_dendro', label: 'Dendro DMG %' },
  { key: 'dmg_phys', label: 'Physical DMG %' },
  { key: 'healing', label: 'Healing Bonus %' },
];

export function ManualStatsForm() {
  const manualStats = useBuildStore((s) => s.form.manualStats);
  const setForm = useBuildStore((s) => s.setForm);

  function handleChange(key: string, raw: string) {
    const parsed = parseFloat(raw);
    const next = { ...manualStats };
    if (raw === '' || Number.isNaN(parsed)) {
      delete next[key];
    } else {
      next[key] = parsed;
    }
    setForm({ manualStats: next });
  }

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
      {STAT_FIELDS.map(({ key, label }) => {
        const isPercent = PERCENT_KEYS.has(key);
        const value = manualStats[key];
        return (
          <div key={key} className="flex flex-col gap-1.5">
            <Label htmlFor={`stat-${key}`}>{label}</Label>
            <div className="relative flex items-center">
              <Input
                id={`stat-${key}`}
                type="number"
                min={0}
                step={isPercent ? 0.1 : 1}
                value={value ?? ''}
                placeholder="0"
                onChange={(e) => handleChange(key, e.target.value)}
                className={isPercent ? 'pr-5' : ''}
              />
              {isPercent && (
                <span className="pointer-events-none absolute right-2 text-xs text-muted-foreground">
                  %
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
