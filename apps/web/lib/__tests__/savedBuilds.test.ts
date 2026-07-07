import { describe, it, expect, beforeEach } from "vitest";
import {
  listBuilds,
  saveBuild,
  renameBuild,
  overwriteBuild,
  deleteBuild,
  loadBuild,
  StorageQuotaError,
} from "../savedBuilds.js";
import { DEFAULT_FORM } from "../defaults.js";

/** Map-backed fake storage implementing the Pick<Storage, "getItem" | "setItem"> shape. */
function fakeStorage(): Pick<Storage, "getItem" | "setItem"> {
  const map = new Map<string, string>();
  return {
    getItem: (key: string) => (map.has(key) ? map.get(key)! : null),
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
  };
}

describe("savedBuilds", () => {
  let storage: Pick<Storage, "getItem" | "setItem">;

  beforeEach(() => {
    storage = fakeStorage();
  });

  it("listBuilds on empty storage returns []", () => {
    expect(listBuilds(storage)).toEqual([]);
  });

  it("listBuilds returns [] when getItem returns corrupt JSON", () => {
    storage.setItem("ck-saved-builds", "not json");
    expect(listBuilds(storage)).toEqual([]);
  });

  it("saveBuild adds a build with distinct id, then listBuilds returns newest first", () => {
    const formA = { ...DEFAULT_FORM, characterKey: "hu_tao" };
    const formB = { ...DEFAULT_FORM, characterKey: "ganyu" };

    const savedA = saveBuild("Alpha", formA, storage);
    const savedB = saveBuild("Beta", formB, storage);

    expect(savedA.id).not.toBe(savedB.id);
    expect(() => new Date(savedA.savedAt).toISOString()).not.toThrow();

    const list = listBuilds(storage);
    expect(list).toHaveLength(2);
    expect(list[0].id).toBe(savedB.id);
    expect(list[1].id).toBe(savedA.id);
  });

  it("loadBuild deep-equals the saved form (round-trip through encodeBuild)", () => {
    const form = { ...DEFAULT_FORM, characterKey: "hu_tao", constellation: 3 };
    const saved = saveBuild("Alpha", form, storage);
    expect(loadBuild(saved.id, storage)).toEqual(form);
  });

  it("loadBuild of unknown id returns null", () => {
    expect(loadBuild("nonexistent-id", storage)).toBeNull();
  });

  it("renameBuild changes title only", () => {
    const saved = saveBuild("Alpha", DEFAULT_FORM, storage);
    renameBuild(saved.id, "Alpha Renamed", storage);

    const list = listBuilds(storage);
    expect(list).toHaveLength(1);
    expect(list[0].title).toBe("Alpha Renamed");
    expect(list[0].id).toBe(saved.id);
    expect(list[0].hash).toBe(saved.hash);
    expect(list[0].savedAt).toBe(saved.savedAt);
  });

  it("overwriteBuild changes hash+savedAt, keeps id/title, and reorders to front", () => {
    const formA = { ...DEFAULT_FORM, characterKey: "hu_tao" };
    const formB = { ...DEFAULT_FORM, characterKey: "ganyu" };

    const savedA = saveBuild("Alpha", formA, storage);
    saveBuild("Beta", formB, storage);

    const newForm = { ...DEFAULT_FORM, characterKey: "hu_tao", constellation: 6 };
    overwriteBuild(savedA.id, newForm, storage);

    const list = listBuilds(storage);
    expect(list).toHaveLength(2);
    expect(list[0].id).toBe(savedA.id);
    expect(list[0].title).toBe("Alpha");
    expect(list[0].hash).not.toBe(savedA.hash);
    expect(loadBuild(savedA.id, storage)).toEqual(newForm);
  });

  it("deleteBuild removes the build", () => {
    const saved = saveBuild("Alpha", DEFAULT_FORM, storage);
    deleteBuild(saved.id, storage);
    expect(listBuilds(storage)).toEqual([]);
  });

  it("readList filters out malformed entries instead of blind-casting", () => {
    const bad = JSON.stringify([
      { id: "a", title: "ok", hash: "h", savedAt: "2026-01-01" },
      { id: 1, title: "bad-id" },
      "not-an-object",
      { id: "b", title: "no-hash", savedAt: "x" },
    ]);
    storage.setItem("ck-saved-builds", bad);
    const list = listBuilds(storage);
    expect(list.map((b) => b.id)).toEqual(["a"]);
  });

  it("saveBuild throws StorageQuotaError when setItem fails", () => {
    const failingStorage: Pick<Storage, "getItem" | "setItem"> = {
      getItem: () => null,
      setItem: () => {
        throw new DOMException("quota", "QuotaExceededError");
      },
    };
    expect(() => saveBuild("t", DEFAULT_FORM, failingStorage)).toThrow(StorageQuotaError);
  });
});
