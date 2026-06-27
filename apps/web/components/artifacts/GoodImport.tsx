"use client";

/**
 * GoodImport — restyled GOOD-format artifact JSON importer.
 * Same logic as the old components/GoodImport.tsx; styled with var(--ck-*) tokens
 * to match the drawer's dark theme.
 */

import { useRef } from "react";
import { useBuildStore } from "@/lib/store";
import { assembleFromGood } from "@/lib/artifacts";

export function GoodImport() {
  const goodJson = useBuildStore((s) => s.form.goodJson);
  const setForm = useBuildStore((s) => s.setForm);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseResult = goodJson.trim() ? assembleFromGood(goodJson) : null;

  function handleTextChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setForm({ goodJson: e.target.value });
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result;
      if (typeof text === "string") {
        setForm({ goodJson: text });
      }
    };
    reader.readAsText(file);
    e.target.value = ""; // reset so the same file can be re-imported
  }

  const inputBase =
    "rounded-lg border border-[var(--ck-border)] bg-[var(--ck-surface2)] " +
    "text-[var(--ck-text)] placeholder-[var(--ck-faint)] " +
    "focus:outline-none focus:ring-1 focus:ring-[var(--ck-accent)]";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="good-import-textarea"
          className="text-[11px] font-semibold text-[var(--ck-muted)]"
        >
          GOOD JSON
        </label>
        <textarea
          id="good-import-textarea"
          placeholder='Paste your GOOD-format JSON here, e.g. {"format":"GOOD","artifacts":[...]}'
          value={goodJson}
          onChange={handleTextChange}
          rows={6}
          className={`${inputBase} w-full px-3 py-2 font-mono text-[11px] resize-none`}
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={`${inputBase} px-3 py-1.5 text-[12px] text-[var(--ck-muted)] transition-colors hover:text-[var(--ck-text)] hover:border-[var(--ck-accent)]`}
        >
          Import file
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={handleFileChange}
        />
        {goodJson.trim() && !parseResult?.error && (
          <span className="text-[11px] text-[var(--ck-accent2)]">
            ✓ Loaded
          </span>
        )}
      </div>

      {parseResult?.error && (
        <p className="text-[11px]" style={{ color: "oklch(0.704 0.191 22.216)" }}>
          {parseResult.error}
        </p>
      )}
    </div>
  );
}
