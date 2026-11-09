import { describe, expect, it } from "vitest";
import {
  addDays,
  formatDate,
  formatRange,
  nextWeekday,
  timeOptions,
  weekdayShort,
} from "../lib/time";

describe("Jakarta time helpers", () => {
  it("adds days without crossing local timezone boundaries", () => {
    expect(addDays("2026-11-09", 1)).toBe("2026-11-10");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("formats both date-only and ISO timestamp strings", () => {
    expect(formatDate("2026-11-09")).toContain("2026");
    expect(formatDate("2026-11-09T03:05:00.000Z")).toContain("2026");
  });

  it("formats a time range in WIB", () => {
    expect(
      formatRange("2026-11-09T02:00:00.000Z", "2026-11-09T04:00:00.000Z"),
    ).toBe("09:00–11:00 WIB");
  });

  it("builds inclusive 30-minute time options", () => {
    expect(timeOptions("08:00", "10:00")).toEqual([
      "08:00",
      "08:30",
      "09:00",
      "09:30",
      "10:00",
    ]);
  });

  it("finds the next requested weekday", () => {
    expect(nextWeekday(6, "2026-11-09")).toBe("2026-11-14");
    expect(weekdayShort("2026-11-09")).toMatch(/Sen/);
  });
});
