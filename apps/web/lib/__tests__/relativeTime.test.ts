import { describe, it, expect } from "vitest";
import { relativeTime } from "../relativeTime.js";

describe("relativeTime", () => {
  const now = new Date("2026-07-07T12:00:00.000Z");

  it("returns 'just now' under 60 seconds", () => {
    const then = new Date(now.getTime() - 30 * 1000).toISOString();
    expect(relativeTime(then, now)).toBe("just now");
  });

  it("returns 'just now' at the 59s boundary", () => {
    const then = new Date(now.getTime() - 59 * 1000).toISOString();
    expect(relativeTime(then, now)).toBe("just now");
  });

  it("returns minutes ago at the 60s boundary", () => {
    const then = new Date(now.getTime() - 60 * 1000).toISOString();
    expect(relativeTime(then, now)).toBe("1m ago");
  });

  it("returns minutes ago under an hour", () => {
    const then = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
    expect(relativeTime(then, now)).toBe("5m ago");
  });

  it("returns hours ago at the 60m boundary", () => {
    const then = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
    expect(relativeTime(then, now)).toBe("1h ago");
  });

  it("returns hours ago under a day", () => {
    const then = new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString();
    expect(relativeTime(then, now)).toBe("3h ago");
  });

  it("returns days ago at the 24h boundary", () => {
    const then = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    expect(relativeTime(then, now)).toBe("1d ago");
  });

  it("returns days ago for multi-day spans", () => {
    const then = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString();
    expect(relativeTime(then, now)).toBe("5d ago");
  });

  it("treats a future timestamp as 'just now'", () => {
    const then = new Date(now.getTime() + 5 * 1000).toISOString();
    expect(relativeTime(then, now)).toBe("just now");
  });
});
