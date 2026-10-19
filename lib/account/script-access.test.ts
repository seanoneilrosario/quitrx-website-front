import { describe, expect, it } from "vitest";
import { canRenewScript, hasExpiredScript } from "./script-access";

const now = new Date("2026-10-19T08:00:00.000Z");

describe("hasExpiredScript", () => {
  it("returns true when the script expiry has passed", () => {
    expect(hasExpiredScript({ scriptExpiry: "2026-10-19" }, now)).toBe(true);
  });

  it("returns false before the script expires", () => {
    expect(hasExpiredScript({ scriptExpiry: "2026-10-20" }, now)).toBe(false);
  });

  it.each([undefined, null, "", "not-a-date"])(
    "returns false for an unavailable or invalid expiry: %s",
    (scriptExpiry) => {
      expect(hasExpiredScript({ scriptExpiry }, now)).toBe(false);
    },
  );
});

describe("canRenewScript", () => {
  it("shows renewal from exactly two months before expiry", () => {
    expect(
      canRenewScript(
        { scriptActive: true, scriptExpiry: "2026-12-19T08:00:00.000Z" },
        now,
      ),
    ).toBe(true);
  });

  it("keeps renewal hidden before the two-month window", () => {
    expect(
      canRenewScript(
        { scriptActive: true, scriptExpiry: "2026-12-19T08:00:01.000Z" },
        now,
      ),
    ).toBe(false);
  });

  it("keeps renewal available after expiry", () => {
    expect(canRenewScript({ scriptActive: false, scriptExpiry: "2026-10-18" }, now)).toBe(true);
  });

  it("clamps month-end dates when subtracting two calendar months", () => {
    expect(
      canRenewScript(
        { scriptExpiry: "2027-01-31T00:00:00.000Z" },
        new Date("2026-11-30T00:00:00.000Z"),
      ),
    ).toBe(true);
  });
});
