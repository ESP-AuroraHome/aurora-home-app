import { describe, expect, it } from "vitest";
import { createProfileSchema, profileSchema } from "../profileSchema";

describe("profileSchema", () => {
  it("accepts valid data", () => {
    const result = profileSchema.safeParse({
      name: "Alice",
      email: "alice@test.com",
      locale: "fr",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = profileSchema.safeParse({
      name: "",
      email: "alice@test.com",
      locale: "fr",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = profileSchema.safeParse({
      name: "Alice",
      email: "not-an-email",
      locale: "fr",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid locale", () => {
    const result = profileSchema.safeParse({
      name: "Alice",
      email: "alice@test.com",
      locale: "de",
    });
    expect(result.success).toBe(false);
  });

  it("accepts locale 'en'", () => {
    const result = profileSchema.safeParse({
      name: "Alice",
      email: "alice@test.com",
      locale: "en",
    });
    expect(result.success).toBe(true);
  });
});

describe("createProfileSchema", () => {
  const t = (key: string) => `[${key}]`;

  it("uses the t function for error messages", () => {
    const schema = createProfileSchema(t);
    const result = schema.safeParse({ name: "", email: "x", locale: "fr" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map(
        (e: { message: string }) => e.message,
      );
      expect(messages.some((m) => m.includes("[nameRequired]"))).toBe(true);
    }
  });

  it("accepts valid data with t function", () => {
    const schema = createProfileSchema(t);
    const result = schema.safeParse({
      name: "Alice",
      email: "alice@test.com",
      locale: "en",
    });
    expect(result.success).toBe(true);
  });
});
