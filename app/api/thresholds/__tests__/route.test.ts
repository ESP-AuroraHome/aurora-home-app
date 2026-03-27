import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/settings/repository/thresholdRepository", () => ({
  thresholdRepository: {
    findAll: vi.fn(),
    upsert: vi.fn(),
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

import { thresholdRepository } from "@/features/settings/repository/thresholdRepository";
import { GET, POST } from "../route";

const mockRepo = thresholdRepository as unknown as {
  findAll: ReturnType<typeof vi.fn>;
  upsert: ReturnType<typeof vi.fn>;
};

function makeRequest(body: unknown) {
  return { json: async () => body } as Request;
}

describe("GET /api/thresholds", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns all thresholds", async () => {
    mockRepo.findAll.mockResolvedValue([{ sensorType: "CO2" }]);
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual([{ sensorType: "CO2" }]);
  });
});

describe("POST /api/thresholds", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 400 when sensorType is missing", async () => {
    const res = await POST(makeRequest({ highValue: 30 }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Missing sensorType");
  });

  it("upserts threshold with all fields", async () => {
    mockRepo.upsert.mockResolvedValue({ sensorType: "TEMPERATURE" });
    const res = await POST(
      makeRequest({
        sensorType: "TEMPERATURE",
        highValue: 35,
        highSeverity: "HIGH",
        lowValue: null,
        lowSeverity: null,
      }),
    );
    expect(res.status).toBe(200);
    expect(mockRepo.upsert).toHaveBeenCalledWith({
      sensorType: "TEMPERATURE",
      highValue: 35,
      highSeverity: "HIGH",
      lowValue: null,
      lowSeverity: null,
    });
  });
});
