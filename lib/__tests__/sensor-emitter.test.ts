import { describe, expect, it } from "vitest";
import { sensorEmitter } from "../sensor-emitter";

describe("sensorEmitter", () => {
  it("is an EventEmitter", () => {
    expect(typeof sensorEmitter.on).toBe("function");
    expect(typeof sensorEmitter.emit).toBe("function");
  });

  it("returns the same instance across multiple imports", async () => {
    const { sensorEmitter: second } = await import("../sensor-emitter");
    expect(sensorEmitter).toBe(second);
  });

  it("has max listeners set to 100", () => {
    expect(sensorEmitter.getMaxListeners()).toBe(100);
  });

  it("emits and receives events", () => {
    const received: unknown[] = [];
    const handler = (data: unknown) => received.push(data);

    sensorEmitter.on("test_event", handler);
    sensorEmitter.emit("test_event", { value: 42 });
    sensorEmitter.removeListener("test_event", handler);

    expect(received).toHaveLength(1);
    expect(received[0]).toEqual({ value: 42 });
  });
});
