import { describe, expect, it } from "vitest";
import { parseAssistantQuery } from "../lib/assistant";

describe("assistant query parser", () => {
  it("parses capacity, category, building, and date", () => {
    const result = parseAssistantQuery(
      "Ruang rapat di Tower 2 untuk 20 orang besok",
      "2026-11-09",
    );
    expect(result.minCapacity).toBe(20);
    expect(result.category).toBe("meeting");
    expect(result.building).toBe("TW2");
    expect(result.date).toBe("2026-11-10");
    expect(result.start).toBe("09:00");
    expect(result.end).toBe("11:00");
  });

  it("parses amenities and an explicit time range", () => {
    const result = parseAssistantQuery(
      "Auditorium dengan proyektor besok 13.00-15.00",
      "2026-11-09",
    );
    expect(result.category).toBe("auditorium");
    expect(result.amenity).toBe("Proyektor");
    expect(result.start).toBe("13:00");
    expect(result.end).toBe("15:00");
  });

  it("finds the next named weekday", () => {
    const result = parseAssistantQuery("Lapangan futsal hari Sabtu", "2026-11-09");
    expect(result.category).toBe("sports");
    expect(result.q).toBe("futsal");
    expect(result.date).toBe("2026-11-14");
  });

  it("does not invent a date or availability", () => {
    const result = parseAssistantQuery("Carikan lab untuk 40 orang", "2026-11-09");
    expect(result.category).toBe("lab");
    expect(result.date).toBeUndefined();
    expect(result.start).toBeUndefined();
  });
});
