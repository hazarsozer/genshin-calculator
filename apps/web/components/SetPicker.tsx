'use client';

import { useState } from 'react';
import { ARTIFACT_SETS } from '@genshin/data';
import { useBuildStore } from '@/lib/store';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import type { EquippedSet } from '@genshin/data';

/** Split PascalCase/camelCase goodId into a readable display name.
 *  e.g. "GladiatorFinale" → "Gladiator Finale", "EmblemofSeveredFate" → "Emblemof Severed Fate"
 *  Note: Aspirine's goodIds are PascalCase-ish; insert space before each uppercase run. */
function humanizeGoodId(goodId: string): string {
  return goodId.replace(/([A-Z])/g, ' $1').trim();
}

const SET_KEYS = Object.keys(ARTIFACT_SETS).sort((a, b) =>
  humanizeGoodId(a).localeCompare(humanizeGoodId(b))
);

const PIECE_OPTIONS = [2, 4] as const;

export function SetPicker() {
  const manualSets = useBuildStore((s) => s.form.manualSets);
  const setForm = useBuildStore((s) => s.setForm);

  const [pendingKey, setPendingKey] = useState<string>('');
  const [pendingPieces, setPendingPieces] = useState<2 | 4>(4);

  function addSet() {
    if (!pendingKey) return;
    // Replace existing entry for the same setKey
    const filtered = manualSets.filter((s) => s.setKey !== pendingKey);
    setForm({ manualSets: [...filtered, { setKey: pendingKey, pieces: pendingPieces }] });
    setPendingKey('');
    setPendingPieces(4);
  }

  function removeSet(setKey: string) {
    setForm({ manualSets: manualSets.filter((s) => s.setKey !== setKey) });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="set-picker-select">Artifact Set</Label>
          <Select value={pendingKey} onValueChange={(v) => setPendingKey(v ?? '')}>
            <SelectTrigger id="set-picker-select" className="w-56">
              <SelectValue placeholder="Choose set…" />
            </SelectTrigger>
            <SelectContent>
              {SET_KEYS.map((key) => (
                <SelectItem key={key} value={key}>
                  {humanizeGoodId(key)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="set-picker-pieces">Pieces</Label>
          <Select
            value={String(pendingPieces)}
            onValueChange={(v) => {
                if (v === '2') setPendingPieces(2);
                else if (v === '4') setPendingPieces(4);
              }}
          >
            <SelectTrigger id="set-picker-pieces" className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PIECE_OPTIONS.map((p) => (
                <SelectItem key={p} value={String(p)}>
                  {p}pc
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={addSet}
          disabled={!pendingKey}
        >
          Add
        </Button>
      </div>

      {manualSets.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {manualSets.map((s) => (
            <li
              key={s.setKey}
              className="flex items-center justify-between rounded-md border border-input px-2.5 py-1.5 text-sm"
            >
              <span>
                {humanizeGoodId(s.setKey)}{' '}
                <span className="text-muted-foreground">({s.pieces}pc)</span>
              </span>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => removeSet(s.setKey)}
                aria-label={`Remove ${humanizeGoodId(s.setKey)}`}
              >
                ✕
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
