// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  EditableEmailField,
  EditableLocaleField,
  EditableNameField,
} from "../EditableFields";

function makeForm(values: { name?: string; email?: string; locale?: string }) {
  return {
    watch: vi.fn((field: string) => values[field as keyof typeof values] ?? ""),
    control: {},
  } as never;
}

const noop = vi.fn();
const t = (key: string) => key;

describe("EditableNameField", () => {
  it("shows name and edit icon in display mode", () => {
    render(
      <EditableNameField
        form={makeForm({ name: "Alice" })}
        editingField={null}
        onFieldClick={noop}
        onBlur={noop}
        t={t}
      />,
    );
    expect(screen.getByText("Alice")).toBeTruthy();
  });

  it("calls onFieldClick when edit icon is clicked", async () => {
    const onFieldClick = vi.fn();
    const { container } = render(
      <EditableNameField
        form={makeForm({ name: "Alice" })}
        editingField={null}
        onFieldClick={onFieldClick}
        onBlur={noop}
        t={t}
      />,
    );
    // biome-ignore lint/style/noNonNullAssertion: svg always present in display mode
    await userEvent.click(container.querySelector("svg")!);
    expect(onFieldClick).toHaveBeenCalledWith("name");
  });
});

describe("EditableEmailField", () => {
  it("shows email in display mode", () => {
    render(
      <EditableEmailField
        form={makeForm({ email: "alice@test.com" })}
        editingField={null}
        onFieldClick={noop}
        onBlur={noop}
        t={t}
      />,
    );
    expect(screen.getByText("alice@test.com")).toBeTruthy();
  });

  it("calls onFieldClick when edit icon is clicked", async () => {
    const onFieldClick = vi.fn();
    const { container } = render(
      <EditableEmailField
        form={makeForm({ email: "alice@test.com" })}
        editingField={null}
        onFieldClick={onFieldClick}
        onBlur={noop}
        t={t}
      />,
    );
    // biome-ignore lint/style/noNonNullAssertion: svg always present in display mode
    await userEvent.click(container.querySelector("svg")!);
    expect(onFieldClick).toHaveBeenCalledWith("email");
  });
});

describe("EditableLocaleField", () => {
  it("shows 'french' label when locale is fr", () => {
    render(
      <EditableLocaleField
        form={makeForm({ locale: "fr" })}
        editingField={null}
        onFieldClick={noop}
        setEditingField={noop}
        t={t}
      />,
    );
    expect(screen.getByText("french")).toBeTruthy();
  });

  it("shows 'english' label when locale is en", () => {
    render(
      <EditableLocaleField
        form={makeForm({ locale: "en" })}
        editingField={null}
        onFieldClick={noop}
        setEditingField={noop}
        t={t}
      />,
    );
    expect(screen.getByText("english")).toBeTruthy();
  });

  it("calls onFieldClick when edit icon is clicked", async () => {
    const onFieldClick = vi.fn();
    const { container } = render(
      <EditableLocaleField
        form={makeForm({ locale: "fr" })}
        editingField={null}
        onFieldClick={onFieldClick}
        setEditingField={noop}
        t={t}
      />,
    );
    // biome-ignore lint/style/noNonNullAssertion: svg always present in display mode
    await userEvent.click(container.querySelector("svg")!);
    expect(onFieldClick).toHaveBeenCalledWith("locale");
  });
});
