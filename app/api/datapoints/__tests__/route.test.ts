import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/datapoint/repository/dataPointRepository", () => ({
  dataPointRepository: {
    findByTypeSince: vi.fn(),
  },
}));

vi.mock("next/server", () => ({
  NextResponse: {
    json: vi.fn((body: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      async json() {
        return body;
      },
    })),
  },
}));

import { dataPointRepository } from "@/features/datapoint/repository/dataPointRepository";
import { GET } from "../route";

const mockRepo = dataPointRepository as unknown as {
  findByTypeSince: ReturnType<typeof vi.fn>;
};

function makeRequest(params: Record<string, string>) {
  const url = new URL("http://localhost/api/datapoints");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return new Request(url.toString());
}

describe("GET /api/datapoints", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 400 when type is missing", async () => {
    const res = await GET(makeRequest({ period: "1h" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid type");
  });

  it("returns 400 for invalid type", async () => {
    const res = await GET(makeRequest({ type: "INVALID" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid type");
  });

  it("returns 400 for invalid period", async () => {
    const res = await GET(makeRequest({ type: "TEMPERATURE", period: "99h" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid period");
  });

  it("returns data for valid type and period", async () => {
    const date = new Date("2024-01-01T10:00:00Z");
    mockRepo.findByTypeSince.mockResolvedValue([
      { id: "dp-1", type: "TEMPERATURE", value: "25", createdAt: date },
    ]);
    const res = await GET(makeRequest({ type: "TEMPERATURE", period: "1h" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body[0].id).toBe("dp-1");
    expect(body[0].createdAt).toBe(date.toISOString());
  });

  it("uses default period '1h' when period is not specified", async () => {
    mockRepo.findByTypeSince.mockResolvedValue([]);
    await GET(makeRequest({ type: "CO2" }));
    const [_, since] = mockRepo.findByTypeSince.mock.calls[0];
    const expectedSince = Date.now() - 60 * 60 * 1000;
    expect(since.getTime()).toBeGreaterThan(expectedSince - 5000);
  });

  it("accepts all valid sensor types", async () => {
    mockRepo.findByTypeSince.mockResolvedValue([]);
    for (const type of [
      "TEMPERATURE",
      "HUMIDITY",
      "PRESSURE",
      "CO2",
      "LIGHT",
    ]) {
      const res = await GET(makeRequest({ type, period: "6h" }));
      expect(res.status).toBe(200);
    }
  });

  it("accepts all valid periods", async () => {
    mockRepo.findByTypeSince.mockResolvedValue([]);
    for (const period of ["1h", "6h", "24h", "7j"]) {
      const res = await GET(makeRequest({ type: "TEMPERATURE", period }));
      expect(res.status).toBe(200);
    }
  });
});
