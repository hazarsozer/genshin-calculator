import { describe, it, expect } from "vitest";
import { selectHeadline } from "../headline";

const F = (key: string, avg: number) => ({
  key,
  label: key,
  triple: [avg - 2, avg + 2, avg] as [number, number, number],
});

describe("selectHeadline", () => {
  it("defaults to highest average", () => {
    expect(selectHeadline([F("a", 10), F("b", 30)])?.key).toBe("b");
  });
  it("honors a pin that exists", () => {
    expect(selectHeadline([F("a", 10), F("b", 30)], "a")?.key).toBe("a");
  });
  it("falls back silently when the pin is stale", () => {
    expect(selectHeadline([F("a", 10), F("b", 30)], "gone")?.key).toBe("b");
  });
  it("returns null on empty features", () => {
    expect(selectHeadline([], "a")).toBeNull();
  });
});
