// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // biome-ignore lint/performance/noImgElement: test stub
    <img src={src} alt={alt} />
  ),
}));
vi.mock("@/components/ui/stepper", () => ({
  Stepper: ({ currentStep }: { currentStep: number }) => (
    <div data-testid="stepper" data-step={currentStep} />
  ),
}));
vi.mock("@/features/onboarding/usecase/completeOnboarding", () => ({
  default: vi.fn(),
}));

import type { User } from "@prisma/client";
import completeOnboarding from "@/features/onboarding/usecase/completeOnboarding";
import OnboardingFlow from "../OnboardingFlow";

const mockComplete = vi.mocked(completeOnboarding);

const user: Partial<User> = {
  id: "u1",
  name: "Marie",
  email: "marie@example.com",
  image: null,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("OnboardingFlow", () => {
  it("starts on step 0 (welcome)", () => {
    render(<OnboardingFlow user={user as User} />);
    expect(screen.getByTestId("stepper")).toHaveAttribute("data-step", "0");
    expect(screen.getByPlaceholderText(/marie/i)).toBeInTheDocument();
  });

  it("continues to step 1 (avatar) after entering a name", async () => {
    render(<OnboardingFlow user={user as User} />);
    const input = screen.getByRole("textbox");
    await userEvent.clear(input);
    await userEvent.type(input, "Pierre");
    await userEvent.click(screen.getByRole("button", { name: /continuer/i }));
    await waitFor(() => {
      expect(screen.getByTestId("stepper")).toHaveAttribute("data-step", "1");
    });
  });

  it("continue button is disabled when name is empty", async () => {
    render(<OnboardingFlow user={{ ...user, name: null } as User} />);
    expect(screen.getByRole("button", { name: /continuer/i })).toBeDisabled();
  });

  it("can go back from step 1 to step 0", async () => {
    render(<OnboardingFlow user={user as User} />);
    const input = screen.getByRole("textbox");
    await userEvent.clear(input);
    await userEvent.type(input, "Pierre");
    await userEvent.click(screen.getByRole("button", { name: /continuer/i }));
    await waitFor(() => {
      expect(screen.getByTestId("stepper")).toHaveAttribute("data-step", "1");
    });
    await userEvent.click(screen.getByRole("button", { name: /retour/i }));
    await waitFor(() => {
      expect(screen.getByTestId("stepper")).toHaveAttribute("data-step", "0");
    });
  });

  it("reaches step 2 (locale) after avatar step", async () => {
    render(<OnboardingFlow user={user as User} />);
    const input = screen.getByRole("textbox");
    await userEvent.clear(input);
    await userEvent.type(input, "Pierre");

    const continueButtons = screen.getAllByRole("button", {
      name: /continuer/i,
    });
    await userEvent.click(continueButtons[0]);
    await waitFor(() =>
      expect(screen.getByTestId("stepper")).toHaveAttribute("data-step", "1"),
    );

    await userEvent.click(screen.getByRole("button", { name: /continuer/i }));
    await waitFor(() => {
      expect(screen.getByTestId("stepper")).toHaveAttribute("data-step", "2");
    });
  });

  it("calls completeOnboarding when finishing", async () => {
    mockComplete.mockResolvedValue(undefined);
    render(<OnboardingFlow user={user as User} />);

    const input = screen.getByRole("textbox");
    await userEvent.clear(input);
    await userEvent.type(input, "Pierre");

    await userEvent.click(screen.getByRole("button", { name: /continuer/i }));
    await waitFor(() =>
      expect(screen.getByTestId("stepper")).toHaveAttribute("data-step", "1"),
    );

    await userEvent.click(screen.getByRole("button", { name: /continuer/i }));
    await waitFor(() =>
      expect(screen.getByTestId("stepper")).toHaveAttribute("data-step", "2"),
    );

    await userEvent.click(screen.getByRole("button", { name: /dashboard/i }));
    await waitFor(() => {
      expect(mockComplete).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Pierre", locale: "fr" }),
      );
    });
  });
});
