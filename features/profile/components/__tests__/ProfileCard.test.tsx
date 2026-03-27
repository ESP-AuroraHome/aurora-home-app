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

vi.mock("@dicebear/core", () => ({
  createAvatar: vi.fn(() => ({ toDataUri: () => "data:image/svg+xml,mock" })),
}));

vi.mock("@dicebear/collection", () => ({
  adventurer: {},
  avataaars: {},
  bottts: {},
  funEmoji: {},
  identicon: {},
  lorelei: {},
  micah: {},
  miniavs: {},
  openPeeps: {},
  personas: {},
  pixelArt: {},
  shapes: {},
  thumbs: {},
}));

vi.mock("@/features/profile/hooks/useProfileSubmit", () => ({
  useProfileSubmit: vi.fn(() => ({ loading: false, onSubmit: vi.fn() })),
}));

vi.mock("@/features/profile/components/SignOutButton", () => ({
  default: () => <button type="button">signOut</button>,
}));

vi.mock("@/components/specific/buttonForm", () => ({
  default: ({ text }: { text: string }) => (
    <button type="submit">{text}</button>
  ),
}));

import ProfileCard from "../ProfileCard";

const fakeUser = {
  id: "u1",
  name: "Alice",
  email: "alice@test.com",
  image: null,
  emailVerified: true,
  createdAt: new Date(),
  updatedAt: new Date(),
} as never;

const initialData = { name: "Alice", email: "alice@test.com", locale: "fr" };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ProfileCard", () => {
  it("renders user name and email", () => {
    render(
      <ProfileCard user={fakeUser} locale="fr" initialData={initialData} />,
    );
    expect(screen.getByText("Alice")).toBeTruthy();
    expect(screen.getByText("alice@test.com")).toBeTruthy();
  });

  it("shows verified badge when emailVerified is true", () => {
    render(
      <ProfileCard user={fakeUser} locale="fr" initialData={initialData} />,
    );
    expect(screen.getByText("verified")).toBeTruthy();
  });

  it("shows not-verified badge when emailVerified is false", () => {
    const unverified = { ...fakeUser, emailVerified: false };
    render(
      <ProfileCard user={unverified} locale="fr" initialData={initialData} />,
    );
    expect(screen.getByText("notVerified")).toBeTruthy();
  });

  it("shows name input when name button is clicked", async () => {
    render(
      <ProfileCard user={fakeUser} locale="fr" initialData={initialData} />,
    );
    await userEvent.click(screen.getByRole("button", { name: /Alice/i }));
    expect(screen.getByRole("textbox")).toBeTruthy();
  });

  it("hides save button initially (no changes)", () => {
    render(
      <ProfileCard user={fakeUser} locale="fr" initialData={initialData} />,
    );
    expect(screen.queryByText("save")).toBeNull();
  });

  it("shows avatar picker when avatar button is clicked", async () => {
    render(
      <ProfileCard user={fakeUser} locale="fr" initialData={initialData} />,
    );
    await userEvent.click(screen.getByRole("button", { name: "changeAvatar" }));
    expect(screen.getByText("chooseAvatar")).toBeTruthy();
  });

  it("closes avatar picker when close button is clicked", async () => {
    render(
      <ProfileCard user={fakeUser} locale="fr" initialData={initialData} />,
    );
    await userEvent.click(screen.getByRole("button", { name: "changeAvatar" }));
    await userEvent.click(screen.getByRole("button", { name: "close" }));
    expect(screen.queryByText("chooseAvatar")).toBeNull();
  });

  it("shows save button after selecting a new avatar", async () => {
    render(
      <ProfileCard user={fakeUser} locale="fr" initialData={initialData} />,
    );
    await userEvent.click(screen.getByRole("button", { name: "changeAvatar" }));
    const avatarBtns = screen.getAllByRole("button");
    const avatarOptionBtn = avatarBtns.find((btn) =>
      btn.querySelector("img[alt='adventurer']"),
    );
    if (avatarOptionBtn) await userEvent.click(avatarOptionBtn);
    expect(screen.getByText("save")).toBeTruthy();
  });
});
