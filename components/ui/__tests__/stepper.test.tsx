// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Stepper } from "../stepper";

const STEPS = [
  { label: "Étape 1" },
  { label: "Étape 2" },
  { label: "Étape 3" },
];

describe("Stepper", () => {
  it("renders all step labels", () => {
    render(<Stepper steps={STEPS} currentStep={0} />);
    expect(screen.getByText("Étape 1")).toBeInTheDocument();
    expect(screen.getByText("Étape 2")).toBeInTheDocument();
    expect(screen.getByText("Étape 3")).toBeInTheDocument();
  });

  it("shows step numbers for steps not yet reached", () => {
    render(<Stepper steps={STEPS} currentStep={0} />);
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("shows a check icon for completed steps", () => {
    const { container } = render(<Stepper steps={STEPS} currentStep={2} />);
    const checkIcons = container.querySelectorAll("svg");
    expect(checkIcons.length).toBeGreaterThanOrEqual(2);
  });

  it("shows step number 1 for current first step", () => {
    render(<Stepper steps={STEPS} currentStep={0} />);
    expect(screen.getByText("1")).toBeInTheDocument();
  });
});
