import { beforeEach, describe, expect, it, vi } from "vitest";

const mockCookieStore = { set: vi.fn() };

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => mockCookieStore),
}));

vi.mock("next/server", () => ({
  NextResponse: {
    json: vi.fn((body: unknown, init?: { status?: number }) => ({
      _body: body,
      status: init?.status ?? 200,
      async json() {
        return body;
      },
    })),
  },
}));

import { POST } from "../route";

function makeRequest(body: unknown) {
  return {
    json: async () => body,
  } as Request;
}

describe("POST /api/locale", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 400 for invalid locale", async () => {
    const res = await POST(makeRequest({ locale: "de" }) as Request);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid locale");
  });

  it("sets the locale cookie and returns success for 'fr'", async () => {
    const res = await POST(makeRequest({ locale: "fr" }) as Request);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(mockCookieStore.set).toHaveBeenCalledWith(
      "locale",
      "fr",
      expect.objectContaining({ path: "/" }),
    );
  });

  it("sets the locale cookie and returns success for 'en'", async () => {
    const res = await POST(makeRequest({ locale: "en" }) as Request);
    expect(res.status).toBe(200);
    expect(mockCookieStore.set).toHaveBeenCalledWith(
      "locale",
      "en",
      expect.any(Object),
    );
  });
});
