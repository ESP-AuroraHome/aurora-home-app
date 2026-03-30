// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("next/image", () => ({
  default: (props: { alt: string; src: string; [key: string]: unknown }) => (
    // biome-ignore lint/performance/noImgElement: test stub
    <img alt={props.alt} src={props.src} />
  ),
}));

import AvatarSelector from "../AvatarSelector";

const onSelect = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
});

describe("AvatarSelector", () => {
  it("renders current avatar when provided", () => {
    render(
      <AvatarSelector
        currentAvatar="data:image/svg+xml,current"
        userName="Alice"
        onSelect={onSelect}
      />,
    );
    expect(screen.getByAltText("Alice")).toBeTruthy();
  });

  it("renders fallback avatar when no currentAvatar", () => {
    render(
      <AvatarSelector
        currentAvatar={null}
        userName="Alice"
        onSelect={onSelect}
      />,
    );
    expect(screen.getByAltText("Alice")).toBeTruthy();
  });

  it("opens avatar picker when edit button is clicked", async () => {
    render(
      <AvatarSelector
        currentAvatar={null}
        userName="Alice"
        onSelect={onSelect}
      />,
    );
    expect(screen.queryByText("chooseAvatar")).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "changeAvatar" }));
    expect(screen.getByText("chooseAvatar")).toBeTruthy();
  });

  it("closes avatar picker when close button is clicked", async () => {
    render(
      <AvatarSelector
        currentAvatar={null}
        userName="Alice"
        onSelect={onSelect}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "changeAvatar" }));
    expect(screen.getByText("chooseAvatar")).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "close" }));
    expect(screen.queryByText("chooseAvatar")).toBeNull();
  });

  it("calls onSelect and closes picker when an avatar is clicked", async () => {
    render(
      <AvatarSelector
        currentAvatar={null}
        userName="Alice"
        onSelect={onSelect}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "changeAvatar" }));
    const avatarImg = screen.getByAltText("Avatar Avatar 1");
    const avatarBtn = avatarImg.closest("button");
    if (avatarBtn) await userEvent.click(avatarBtn);
    expect(onSelect).toHaveBeenCalledWith("1");
    expect(screen.queryByText("chooseAvatar")).toBeNull();
  });
});
