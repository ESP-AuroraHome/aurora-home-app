import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock(
  "@/features/settings/repository/notificationPreferenceRepository",
  () => ({
    notificationPreferenceRepository: {
      findAllSensorPrefs: vi.fn(),
      findSettings: vi.fn(),
      upsertSensorPref: vi.fn(),
      upsertSettings: vi.fn(),
    },
  }),
);

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

import { notificationPreferenceRepository } from "@/features/settings/repository/notificationPreferenceRepository";
import { GET, POST } from "../route";

const mockRepo = notificationPreferenceRepository as unknown as {
  findAllSensorPrefs: ReturnType<typeof vi.fn>;
  findSettings: ReturnType<typeof vi.fn>;
  upsertSensorPref: ReturnType<typeof vi.fn>;
  upsertSettings: ReturnType<typeof vi.fn>;
};

function makeRequest(body: unknown) {
  return { json: async () => body } as Request;
}

describe("GET /api/preferences", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns sensorPrefs and settings", async () => {
    mockRepo.findAllSensorPrefs.mockResolvedValue([{ sensorType: "CO2" }]);
    mockRepo.findSettings.mockResolvedValue({ id: "default" });

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.sensorPrefs).toEqual([{ sensorType: "CO2" }]);
    expect(body.settings).toEqual({ id: "default" });
  });
});

describe("POST /api/preferences", () => {
  beforeEach(() => vi.clearAllMocks());

  it("upserts sensor preference when type is 'sensor'", async () => {
    mockRepo.upsertSensorPref.mockResolvedValue({});
    const res = await POST(
      makeRequest({
        type: "sensor",
        sensorType: "TEMPERATURE",
        enabled: true,
        minSeverity: "WARNING",
      }),
    );
    expect(res.status).toBe(200);
    expect(mockRepo.upsertSensorPref).toHaveBeenCalledWith({
      sensorType: "TEMPERATURE",
      enabled: true,
      minSeverity: "WARNING",
    });
  });

  it("upserts settings when type is 'settings'", async () => {
    mockRepo.upsertSettings.mockResolvedValue({});
    const res = await POST(
      makeRequest({ type: "settings", quietStart: 22, quietEnd: 8 }),
    );
    expect(res.status).toBe(200);
    expect(mockRepo.upsertSettings).toHaveBeenCalledWith({
      quietStart: 22,
      quietEnd: 8,
    });
  });

  it("returns 400 for unknown type", async () => {
    const res = await POST(makeRequest({ type: "unknown" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid type");
  });

  it("defaults quietStart and quietEnd to null when not provided", async () => {
    mockRepo.upsertSettings.mockResolvedValue({});
    await POST(makeRequest({ type: "settings" }));
    expect(mockRepo.upsertSettings).toHaveBeenCalledWith({
      quietStart: null,
      quietEnd: null,
    });
  });
});
