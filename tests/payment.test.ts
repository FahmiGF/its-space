import crypto from "node:crypto";
import { describe, expect, it } from "vitest";
import { calculateAmount, verifyMidtransSignature } from "../lib/payments";

describe("payment amount", () => {
  it("charges by the started hour", () => {
    expect(calculateAmount(75_000, "2026-11-20T09:00:00+07:00", "2026-11-20T11:00:00+07:00")).toBe(150_000);
    expect(calculateAmount(75_000, "2026-11-20T09:00:00+07:00", "2026-11-20T09:30:00+07:00")).toBe(75_000);
  });

  it("does not charge free facilities", () => {
    expect(calculateAmount(0, "2026-11-20T09:00:00+07:00", "2026-11-20T11:00:00+07:00")).toBe(0);
  });
});

describe("Midtrans notification signature", () => {
  const serverKey = "test-server-key";
  const orderId = "ITS-TEST-PAY";
  const statusCode = "200";
  const grossAmount = "150000.00";
  const signature = crypto
    .createHash("sha512")
    .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
    .digest("hex");

  it("accepts the official SHA512 formula", () => {
    expect(verifyMidtransSignature(orderId, statusCode, grossAmount, signature, serverKey)).toBe(true);
  });

  it("rejects a tampered status", () => {
    expect(verifyMidtransSignature(orderId, "201", grossAmount, signature, serverKey)).toBe(false);
  });
});
