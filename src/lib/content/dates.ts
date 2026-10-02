import type { SchoolEvent } from "./model";

const timeZone = "Asia/Manila";
// A date-only notice has no event time. Parse in UTC to preserve its calendar date.
const parseDate = (value: string) => new Date(`${value}T00:00:00Z`);
const formatter = new Intl.DateTimeFormat("en-PH", {
  month: "long", day: "numeric", year: "numeric", timeZone: "UTC",
});
export const formatSchoolDate = (value: string) => formatter.format(parseDate(value));

export function formatEventDates(event: Pick<SchoolEvent, "startDate" | "endDate">): string {
  const start = parseDate(event.startDate);
  const end = parseDate(event.endDate);
  return event.startDate === event.endDate ? formatter.format(start) : formatter.formatRange(start, end);
}

export function schoolToday(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    year: "numeric", month: "2-digit", day: "2-digit", timeZone,
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)!.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function partitionEvents(events: readonly SchoolEvent[], today = schoolToday()) {
  return {
    upcoming: events.filter((event) => event.endDate >= today)
      .sort((a, b) => a.startDate.localeCompare(b.startDate)),
    past: events.filter((event) => event.endDate < today)
      .sort((a, b) => b.endDate.localeCompare(a.endDate) || b.startDate.localeCompare(a.startDate)),
  };
}

export function formatPublicationDate(value: string | null): string | null {
  return value ? new Intl.DateTimeFormat("en-PH", {
    month: "long", day: "numeric", year: "numeric", timeZone,
  }).format(new Date(value)) : null;
}
