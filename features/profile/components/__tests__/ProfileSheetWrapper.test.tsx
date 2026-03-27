// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("next/image", () => ({
  // biome-ignore lint/performance/noImgElement: test stub
  default: ({ alt, src }: { alt: string; src: string }) => (
    <img alt={alt} src={src} />
  ),
}));

vi.mock("../ProfileSheet", () => ({
  default: ({ open }: { open: boolean }) => (
    <div data-testid="profile-sheet" data-open={String(open)} />
  ),
}));

import ProfileSheetWrapper from "../ProfileSheetWrapper";

const fakeUser = {
  id: "u1",
  name: "Alice",
  email: "alice@test.com",
  image: null,
  emailVerified: true,
  createdAt: new Date(),
  updatedAt: new Date(),
} as never;

describe("ProfileSheetWrapper", () => {
  it("renders avatar button with user name as alt", () => {
    render(<ProfileSheetWrapper user={fakeUser} locale="fr" />);
    expect(screen.getByAltText("Alice")).toBeTruthy();
  });

  it("sheet is closed initially", () => {
    render(<ProfileSheetWrapper user={fakeUser} locale="fr" />);
    expect(screen.getByTestId("profile-sheet").getAttribute("data-open")).toBe(
      "false",
    );
  });

  it("opens sheet when avatar button is clicked", async () => {
    render(<ProfileSheetWrapper user={fakeUser} locale="fr" />);
    await userEvent.click(screen.getByRole("button"));
    expect(screen.getByTestId("profile-sheet").getAttribute("data-open")).toBe(
      "true",
    );
  });
});
