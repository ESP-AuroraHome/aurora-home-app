import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/sensor-emitter", () => ({
  sensorEmitter: {
    on: vi.fn(),
    removeListener: vi.fn(),
    emit: vi.fn(),
  },
}));

import { sensorEmitter } from "@/lib/sensor-emitter";
import { GET } from "../route";

const mockOn = vi.mocked(sensorEmitter.on);
const mockRemoveListener = vi.mocked(sensorEmitter.removeListener);

describe("GET /api/sensor-stream", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns a streaming response with correct headers", async () => {
    vi.useFakeTimers();
    const controller = new AbortController();
    const request = new Request("http://localhost/api/sensor-stream", {
      signal: controller.signal,
    });

    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("text/event-stream");
    expect(response.headers.get("Cache-Control")).toBe(
      "no-cache, no-transform",
    );
    expect(response.headers.get("Connection")).toBe("keep-alive");

    controller.abort();
  });

  it("registers listeners on sensorEmitter", async () => {
    vi.useFakeTimers();
    const controller = new AbortController();
    const request = new Request("http://localhost/api/sensor-stream", {
      signal: controller.signal,
    });

    await GET(request);

    expect(mockOn).toHaveBeenCalledWith("sensor_update", expect.any(Function));
    expect(mockOn).toHaveBeenCalledWith("alert_created", expect.any(Function));
    expect(mockOn).toHaveBeenCalledWith(
      "alerts_auto_resolved",
      expect.any(Function),
    );
    expect(mockOn).toHaveBeenCalledWith(
      "warmup_complete",
      expect.any(Function),
    );

    controller.abort();
  });

  it("removes listeners on abort", async () => {
    vi.useFakeTimers();
    const controller = new AbortController();
    const request = new Request("http://localhost/api/sensor-stream", {
      signal: controller.signal,
    });

    await GET(request);
    controller.abort();

    await vi.runAllTimersAsync();

    expect(mockRemoveListener).toHaveBeenCalledWith(
      "sensor_update",
      expect.any(Function),
    );
    expect(mockRemoveListener).toHaveBeenCalledWith(
      "alert_created",
      expect.any(Function),
    );
  });
});
