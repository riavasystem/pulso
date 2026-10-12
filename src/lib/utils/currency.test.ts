import { describe, expect, it } from "vitest";
import { formatAmountInput, formatCurrency } from "./currency";

describe("formatAmountInput", () => {
  it("groups thousands and millions with periods", () => {
    expect(formatAmountInput("1234567")).toBe("1.234.567");
  });

  it("removes non-digit characters before grouping", () => {
    expect(formatAmountInput("12.345abc")).toBe("12.345");
  });

  it("keeps an empty input empty", () => {
    expect(formatAmountInput("")).toBe("");
  });
});

describe("formatCurrency", () => {
  it("formats Chilean pesos without decimal places", () => {
    expect(formatCurrency(35000)).toContain("35.000");
  });

  it("rejects non-finite amounts", () => {
    expect(() => formatCurrency(Number.NaN)).toThrow(RangeError);
  });
});
