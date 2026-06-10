import { describe, it, expect } from "vitest";
import { validateGstin, extractPan, stateFromGstin, computeCheckChar, STATE_CODES } from "../src/upstream";

describe("computeCheckChar", () => {
  it("computes the documented check char for known valid GSTINs", () => {
    // GSTINs publicly verified via gst.gov.in.
    expect(computeCheckChar("27AAPFU0939F1Z")).toBe("V");
    expect(computeCheckChar("09AAACH7409R1Z")).toBe("Z");
    expect(computeCheckChar("27AAACR5055K1Z")).toBe("7");
  });

  it("rejects inputs of the wrong length", () => {
    expect(() => computeCheckChar("27AAPFU0939F1")).toThrow();
    expect(() => computeCheckChar("27AAPFU0939F1ZV")).toThrow();
  });
});

describe("validateGstin", () => {
  it("accepts known valid GSTINs", () => {
    const r = validateGstin("27AAPFU0939F1ZV");
    expect(r.valid).toBe(true);
    expect(r.state).toBe("Maharashtra");
    expect(r.state_code).toBe("27");
    expect(r.pan).toBe("AAPFU0939F");
    expect(r.entity_code).toBe("1");
    expect(r.check_char).toBe("V");
    expect(r.error).toBeUndefined();
  });

  it("trims and uppercases input", () => {
    const r = validateGstin("  27aapfu0939f1zv  ");
    expect(r.valid).toBe(true);
  });

  it("rejects wrong length", () => {
    const r = validateGstin("27AAPFU0939F1Z");
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/15 characters/);
  });

  it("rejects bad character set", () => {
    const r = validateGstin("27aapfu0939f@zv".toUpperCase()); // '@' stays after uppercase
    expect(r.valid).toBe(false);
  });

  it("rejects unknown state code", () => {
    const r = validateGstin("88AAPFU0939F1ZV");
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/state code/);
  });

  it("rejects malformed embedded PAN", () => {
    // Replace PAN positions with invalid pattern (digits where letters required).
    const r = validateGstin("27123450939F1ZV");
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/PAN/);
  });

  it("rejects bad check character", () => {
    const r = validateGstin("27AAPFU0939F1ZA");
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/Checksum mismatch/);
    expect(r.state).toBe("Maharashtra");
  });

  it("rejects non-string input", () => {
    // @ts-expect-error testing runtime behavior
    const r = validateGstin(123456);
    expect(r.valid).toBe(false);
  });
});

describe("extractPan", () => {
  it("returns the 10-char embedded PAN", () => {
    expect(extractPan("27AAPFU0939F1ZV")).toEqual({ pan: "AAPFU0939F" });
  });
  it("uppercases", () => {
    expect(extractPan("27aapfu0939f1zv")).toEqual({ pan: "AAPFU0939F" });
  });
  it("throws on wrong length", () => {
    expect(() => extractPan("ABC")).toThrow();
  });
});

describe("stateFromGstin", () => {
  it("resolves a full GSTIN to its state", () => {
    expect(stateFromGstin("27AAPFU0939F1ZV")).toEqual({ state_code: "27", state_name: "Maharashtra" });
  });
  it("resolves just the 2-char state prefix", () => {
    expect(stateFromGstin("29")).toEqual({ state_code: "29", state_name: "Karnataka" });
  });
  it("throws on unknown code", () => {
    expect(() => stateFromGstin("88XYZ")).toThrow();
  });
});

describe("STATE_CODES", () => {
  it("covers the 28 states + 8 UTs + special codes", () => {
    // 36 standard state/UT codes + Other Territory + Centre Jurisdiction.
    expect(Object.keys(STATE_CODES).length).toBeGreaterThanOrEqual(38);
    expect(STATE_CODES["27"]).toBe("Maharashtra");
    expect(STATE_CODES["29"]).toBe("Karnataka");
    expect(STATE_CODES["07"]).toBe("Delhi");
  });
});
