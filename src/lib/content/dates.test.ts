import { describe, expect, it } from "vitest";
import { formatEventDates, formatSchoolDate, partitionEvents, schoolToday } from "./dates";
import type { SchoolEvent } from "./model";

const event = (id: string, startDate: string, endDate = startDate): SchoolEvent => ({
  id, slug: id, title: id, summary: "", startDate, endDate, location: null,
  status: "published", visibility: "public", publishedAt: null,
});

describe("school calendar dates", () => {
  it("uses the Philippine calendar date at the UTC day boundary", () => {
    expect(schoolToday(new Date("2026-10-01T16:00:00Z"))).toBe("2026-10-02");
    expect(schoolToday(new Date("2026-10-01T15:59:59Z"))).toBe("2026-10-01");
  });
  it("keeps an activity current until its final day and sorts each section", () => {
    const ongoing = event("ongoing", "2026-09-28", "2026-10-02");
    const future = event("future", "2026-10-10");
    const older = event("older", "2026-09-20");
    const recent = event("recent", "2026-09-30");
    const records = [future, older, recent, ongoing];
    const result = partitionEvents(records, "2026-10-02");
    expect(result.upcoming.map((e) => e.id)).toEqual(["ongoing", "future"]);
    expect(result.past.map((e) => e.id)).toEqual(["recent", "older"]);
    expect(records[0]).toBe(future);
  });
  it("shows a range without changing date-only values or inventing a time", () => {
    expect(formatSchoolDate("2026-09-28")).toBe("September 28, 2026");
    const range = formatEventDates(event("range", "2026-09-28", "2026-09-30"));
    expect(range).toContain("28");
    expect(range).toContain("30");
    expect(range).not.toContain("AM");
    expect(formatEventDates(event("single", "2026-09-28"))).toBe("September 28, 2026");
  });
});
