// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ButtonForm from "../buttonForm";

describe("ButtonForm", () => {
  it("renders text when not loading", () => {
    render(<ButtonForm loading={false} text="Envoyer" />);
    expect(screen.getByText("Envoyer")).toBeInTheDocument();
  });

  it("renders loadingText when loading", () => {
    render(
      <ButtonForm loading={true} text="Envoyer" loadingText="Envoi en cours" />,
    );
    expect(screen.getByText("Envoi en cours")).toBeInTheDocument();
    expect(screen.queryByText("Envoyer")).not.toBeInTheDocument();
  });

  it("shows spinner when loading", () => {
    render(<ButtonForm loading={true} text="Envoyer" />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("is disabled when loading", () => {
    render(<ButtonForm loading={true} text="Envoyer" />);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("is disabled when disabled prop is true", () => {
    render(<ButtonForm loading={false} text="Envoyer" disabled={true} />);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("calls onClick when clicked", async () => {
    const onClick = vi.fn();
    render(
      <ButtonForm
        loading={false}
        text="Envoyer"
        type="button"
        onClick={onClick}
      />,
    );
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("defaults to type submit", () => {
    render(<ButtonForm loading={false} text="Envoyer" />);
    expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
  });
});
