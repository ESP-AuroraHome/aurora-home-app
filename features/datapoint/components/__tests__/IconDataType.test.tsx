// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import IconDataType from "../IconDataType";

describe("IconDataType", () => {
  it.each([
    ["TEMPERATURE", "bg-yellow-400"],
    ["HUMIDITY", "bg-blue-400"],
    ["PRESSURE", "bg-green-400"],
    ["CO2", "bg-gray-400"],
    ["LIGHT", "bg-orange-400"],
  ] as const)("renders correct color class for %s", (type, expectedClass) => {
    const { container } = render(<IconDataType type={type} />);
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg?.className.baseVal ?? svg?.getAttribute("class")).toContain(
      expectedClass,
    );
  });

  it("applies custom size", () => {
    const { container } = render(<IconDataType type="TEMPERATURE" size={24} />);
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute("width")).toBe("32");
  });

  it("throws for unknown type", () => {
    expect(() => render(<IconDataType type={"UNKNOWN" as never} />)).toThrow(
      "Unknown DataType",
    );
  });
});
