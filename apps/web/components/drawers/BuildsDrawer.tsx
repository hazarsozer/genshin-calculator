"use client";

import { useEffect, useRef, useState } from "react";
import { useBuildStore } from "@/lib/store";
import {
  listBuilds,
  saveBuild,
  renameBuild,
  overwriteBuild,
  deleteBuild,
  loadBuild,
  type SavedBuild,
} from "@/lib/savedBuilds";
import { decodeBuild } from "@/lib/url";
import { findCharacter } from "@/lib/catalog";
import { humanizeSlug } from "@/lib/utils";
import { relativeTime } from "@/lib/relativeTime";

const ARM_TIMEOUT_MS = 3000;

/** `<CharName> · Lv <charLevel>` subtitle, decoded lazily from the saved hash. */
function rowSubtitle(build: SavedBuild): string {
  const decoded = decodeBuild(build.hash);
  const char = findCharacter(decoded.characterKey);
  const name = char ? humanizeSlug(char.name) : decoded.characterKey;
  return `${name} · Lv ${decoded.charLevel}`;
}

interface BuildsDrawerProps {
  /** Closes the drawer — called after a successful Load. */
  onClose?: () => void;
}

export function BuildsDrawer({ onClose }: BuildsDrawerProps) {
  const form = useBuildStore((s) => s.form);
  const replaceForm = useBuildStore((s) => s.replaceForm);

  // Hydrated post-mount (localStorage isn't SSR-safe) — skin-store pattern.
  const [list, setList] = useState<SavedBuild[]>([]);
  useEffect(() => {
    setList(listBuilds());
  }, []);
  function refresh() {
    setList(listBuilds());
  }

  const [saveName, setSaveName] = useState("");
  const [query, setQuery] = useState("");

  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState("");
  // Esc unmounts the rename input, which fires onBlur → commitRename right
  // after cancelRename already ran. This ref guards against that double-fire
  // re-persisting the edit Esc was meant to cancel.
  const renameCancelledRef = useRef(false);

  // Two-step inline confirm: `armed` is the `${kind}:${id}` key of the button
  // currently showing "Confirm?"; auto-disarms after 3s or on blur.
  const [armed, setArmed] = useState<string | null>(null);
  const armTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (armTimer.current) clearTimeout(armTimer.current);
    };
  }, []);

  function disarm() {
    if (armTimer.current) clearTimeout(armTimer.current);
    armTimer.current = null;
    setArmed(null);
  }

  function arm(key: string) {
    if (armTimer.current) clearTimeout(armTimer.current);
    setArmed(key);
    armTimer.current = setTimeout(() => setArmed(null), ARM_TIMEOUT_MS);
  }

  function handleConfirmable(key: string, action: () => void) {
    if (armed === key) {
      disarm();
      action();
    } else {
      arm(key);
    }
  }

  const char = findCharacter(form.characterKey);
  const savePlaceholder = char ? humanizeSlug(char.name) : "Untitled";

  function handleSave() {
    const title = saveName.trim() || savePlaceholder;
    saveBuild(title, form);
    setSaveName("");
    refresh();
  }

  function handleLoad(id: string) {
    const loaded = loadBuild(id);
    // Wholesale replace, not setForm's merge — a merge would let optional
    // fields absent from `loaded` (pinnedFeature, food, customBuffs,
    // artifactSlots) survive from whatever build was previously loaded.
    if (loaded) replaceForm(loaded);
    onClose?.();
  }

  function handleOverwrite(id: string) {
    overwriteBuild(id, form);
    setMenuOpenId(null);
    refresh();
  }

  function handleDelete(id: string) {
    deleteBuild(id);
    setMenuOpenId(null);
    refresh();
  }

  function startRename(build: SavedBuild) {
    renameCancelledRef.current = false;
    setRenamingId(build.id);
    setRenameText(build.title);
    setMenuOpenId(null);
  }

  function commitRename() {
    if (renameCancelledRef.current) return;
    const trimmed = renameText.trim();
    if (renamingId && trimmed) renameBuild(renamingId, trimmed);
    setRenamingId(null);
    refresh();
  }

  function cancelRename() {
    renameCancelledRef.current = true;
    setRenamingId(null);
  }

  const filtered = list.filter((b) =>
    b.title.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <div className="flex flex-col gap-3">
      {/* ── Save row ── */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          data-testid="builds-save-name"
          value={saveName}
          onChange={(e) => setSaveName(e.target.value)}
          placeholder={savePlaceholder}
          className="flex-1 rounded-lg border border-[var(--ck-border)] bg-[var(--ck-bg)] px-2.5 py-1.5 text-[12px] text-[var(--ck-text)] outline-none focus:border-[var(--ck-accent)]"
        />
        <button
          type="button"
          data-testid="builds-save"
          onClick={handleSave}
          className="flex-none rounded-lg border border-[var(--ck-border)] px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-[var(--ck-accent2)] transition-colors hover:bg-[color-mix(in_srgb,var(--ck-accent)_10%,transparent)]"
        >
          Save
        </button>
      </div>

      {/* ── Search ── */}
      <input
        type="text"
        data-testid="builds-search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search builds…"
        className="rounded-lg border border-[var(--ck-border)] bg-[var(--ck-bg)] px-2.5 py-1.5 text-[12px] text-[var(--ck-text)] outline-none focus:border-[var(--ck-accent)]"
      />

      {/* ── List ── */}
      <div className="flex flex-col gap-1.5">
        {filtered.length === 0 && (
          <div className="py-4 text-center text-[11px] text-[var(--ck-faint)]">
            {list.length === 0 ? "No saved builds yet." : "No matches."}
          </div>
        )}

        {filtered.map((b) => {
          const loadKey = `load:${b.id}`;
          const overwriteKey = `overwrite:${b.id}`;
          const deleteKey = `delete:${b.id}`;
          const menuOpen = menuOpenId === b.id;
          const isRenaming = renamingId === b.id;

          return (
            <div
              key={b.id}
              data-testid={`build-row-${b.id}`}
              className="flex flex-col gap-1.5 rounded-lg border border-[var(--ck-border)] px-2.5 py-2"
            >
              <div className="flex items-center justify-between gap-2">
                {isRenaming ? (
                  <input
                    type="text"
                    autoFocus
                    value={renameText}
                    onChange={(e) => setRenameText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitRename();
                      if (e.key === "Escape") cancelRename();
                    }}
                    onBlur={commitRename}
                    className="flex-1 rounded border border-[var(--ck-border)] bg-[var(--ck-bg)] px-1.5 py-0.5 text-[12px] text-[var(--ck-text)] outline-none focus:border-[var(--ck-accent)]"
                  />
                ) : (
                  <span className="truncate text-[12px] font-semibold text-[var(--ck-text)]">
                    {b.title}
                  </span>
                )}
                <span className="flex-none text-[10px] text-[var(--ck-faint)]">
                  {relativeTime(b.savedAt)}
                </span>
              </div>

              <div className="text-[10px] text-[var(--ck-muted)]">{rowSubtitle(b)}</div>

              <div className="relative flex items-center gap-1.5">
                <button
                  type="button"
                  data-testid={`build-load-${b.id}`}
                  onClick={() => handleConfirmable(loadKey, () => handleLoad(b.id))}
                  onBlur={() => armed === loadKey && disarm()}
                  className="rounded-md border border-[var(--ck-border)] px-2 py-1 text-[10.5px] font-bold uppercase tracking-wide text-[var(--ck-accent2)] transition-colors hover:bg-[color-mix(in_srgb,var(--ck-accent)_10%,transparent)]"
                >
                  {armed === loadKey ? "Confirm?" : "Load"}
                </button>

                <button
                  type="button"
                  data-testid={`build-menu-${b.id}`}
                  onClick={() => setMenuOpenId(menuOpen ? null : b.id)}
                  aria-label="Build actions"
                  className="ml-auto rounded-md border border-[var(--ck-border)] px-2 py-1 text-[10.5px] font-bold text-[var(--ck-faint)] transition-colors hover:text-[var(--ck-muted)]"
                >
                  ⋯
                </button>

                {menuOpen && (
                  <div className="absolute right-0 top-full z-10 mt-1 flex flex-col gap-0.5 rounded-lg border border-[var(--ck-border)] bg-[var(--ck-surface)] p-1 shadow-lg">
                    <button
                      type="button"
                      data-testid={`build-rename-${b.id}`}
                      onClick={() => startRename(b)}
                      className="whitespace-nowrap rounded px-2 py-1 text-left text-[11px] text-[var(--ck-text)] transition-colors hover:bg-[color-mix(in_srgb,var(--ck-accent)_10%,transparent)]"
                    >
                      Rename
                    </button>
                    <button
                      type="button"
                      data-testid={`build-overwrite-${b.id}`}
                      onClick={() => handleConfirmable(overwriteKey, () => handleOverwrite(b.id))}
                      onBlur={() => armed === overwriteKey && disarm()}
                      className="whitespace-nowrap rounded px-2 py-1 text-left text-[11px] text-[var(--ck-text)] transition-colors hover:bg-[color-mix(in_srgb,var(--ck-accent)_10%,transparent)]"
                    >
                      {armed === overwriteKey ? "Confirm?" : "Overwrite"}
                    </button>
                    <button
                      type="button"
                      data-testid={`build-delete-${b.id}`}
                      onClick={() => handleConfirmable(deleteKey, () => handleDelete(b.id))}
                      onBlur={() => armed === deleteKey && disarm()}
                      className="whitespace-nowrap rounded px-2 py-1 text-left text-[11px] text-[var(--ck-accent)] transition-colors hover:bg-[color-mix(in_srgb,var(--ck-accent)_10%,transparent)]"
                    >
                      {armed === deleteKey ? "Confirm?" : "Delete"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
