'use client';

import { useRef } from 'react';
import { useBuildStore } from '@/lib/store';
import { assembleFromGood } from '@/lib/artifacts';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export function GoodImport() {
  const goodJson = useBuildStore((s) => s.form.goodJson);
  const setForm = useBuildStore((s) => s.setForm);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseResult = goodJson.trim()
    ? assembleFromGood(goodJson)
    : null;

  function handleTextChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setForm({ goodJson: e.target.value });
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result;
      if (typeof text === 'string') {
        setForm({ goodJson: text });
      }
    };
    reader.readAsText(file);
    // Reset so the same file can be re-imported
    e.target.value = '';
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="good-import-textarea">GOOD JSON</Label>
        <Textarea
          id="good-import-textarea"
          placeholder='Paste your GOOD-format JSON here, e.g. {"format":"GOOD","artifacts":[...]}'
          value={goodJson}
          onChange={handleTextChange}
          className="min-h-32 font-mono text-xs"
        />
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
        >
          Import file
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={handleFileChange}
        />
        {goodJson.trim() && !parseResult?.error && (
          <span className="text-xs text-muted-foreground">
            Loaded
          </span>
        )}
      </div>

      {parseResult?.error && (
        <p className="text-xs text-destructive">{parseResult.error}</p>
      )}
    </div>
  );
}
