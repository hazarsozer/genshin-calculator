import type { BuildForm } from "./types";
import { encodeBuild, decodeBuild } from "./url";

const STORAGE_KEY = "ck-saved-builds";

export type SavedBuild = {
  id: string;
  title: string;
  hash: string;
  savedAt: string;
};

type BuildStorage = Pick<Storage, "getItem" | "setItem">;

function defaultStorage(): BuildStorage {
  return window.localStorage;
}

function readList(storage: BuildStorage): SavedBuild[] {
  const raw = storage.getItem(STORAGE_KEY);
  if (raw === null) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SavedBuild[]) : [];
  } catch {
    return [];
  }
}

function writeList(list: SavedBuild[], storage: BuildStorage): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(list));
}

/**
 * Returns all saved builds, most recently saved first.
 * Ordering is tracked by storage position (last written = most recent), not by
 * comparing `savedAt` timestamps, since two writes can land in the same millisecond.
 */
export function listBuilds(storage: BuildStorage = defaultStorage()): SavedBuild[] {
  return [...readList(storage)].reverse();
}

/** Saves a new build under `title` and returns the created record. */
export function saveBuild(
  title: string,
  form: BuildForm,
  storage: BuildStorage = defaultStorage(),
): SavedBuild {
  const record: SavedBuild = {
    id: crypto.randomUUID(),
    title,
    hash: encodeBuild(form),
    savedAt: new Date().toISOString(),
  };
  writeList([...readList(storage), record], storage);
  return record;
}

/** Renames a saved build in place, leaving hash and savedAt untouched. */
export function renameBuild(
  id: string,
  title: string,
  storage: BuildStorage = defaultStorage(),
): void {
  const list = readList(storage).map((b) => (b.id === id ? { ...b, title } : b));
  writeList(list, storage);
}

/**
 * Overwrites a saved build's hash with `form`, bumping savedAt; id and title are kept.
 * The record is moved to the end of storage (most recent) so it sorts to the front of `listBuilds`.
 */
export function overwriteBuild(
  id: string,
  form: BuildForm,
  storage: BuildStorage = defaultStorage(),
): void {
  const existing = readList(storage);
  const target = existing.find((b) => b.id === id);
  if (!target) return;
  const updated: SavedBuild = {
    ...target,
    hash: encodeBuild(form),
    savedAt: new Date().toISOString(),
  };
  writeList(
    [...existing.filter((b) => b.id !== id), updated],
    storage,
  );
}

/** Deletes a saved build by id. */
export function deleteBuild(id: string, storage: BuildStorage = defaultStorage()): void {
  writeList(
    readList(storage).filter((b) => b.id !== id),
    storage,
  );
}

/** Loads a saved build's form by id, or null if no build with that id exists. */
export function loadBuild(
  id: string,
  storage: BuildStorage = defaultStorage(),
): BuildForm | null {
  const record = readList(storage).find((b) => b.id === id);
  if (!record) return null;
  return decodeBuild(record.hash);
}
