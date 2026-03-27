// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAnimatedValue } from "../useAnimatedValue";

beforeEach(() => {
  vi.useFakeTimers();

  const fakeStart = Date.now();
  vi.stubGlobal("performance", { now: () => Date.now() - fakeStart });

  const rafMap = new Map<number, ReturnType<typeof setTimeout>>();
  let rafId = 0;

  vi.stubGlobal(
    "requestAnimationFrame",
    vi.fn((cb: FrameRequestCallback) => {
      rafId++;
      const id = rafId;
      rafMap.set(
        id,
        setTimeout(() => cb(performance.now()), 16),
      );
      return id;
    }),
  );
  vi.stubGlobal(
    "cancelAnimationFrame",
    vi.fn((id: number) => {
      const timeoutId = rafMap.get(id);
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
        rafMap.delete(id);
      }
    }),
  );
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("useAnimatedValue", () => {
  it("initializes with the target value", () => {
    const { result } = renderHook(() => useAnimatedValue(42));
    expect(result.current).toBe(42);
  });

  it("starts animating when value changes", async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useAnimatedValue(value),
      { initialProps: { value: 0 } },
    );

    rerender({ value: 100 });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    expect(result.current).toBeGreaterThan(0);
    expect(result.current).toBeLessThan(100);
  });

  it("reaches target value after full duration", async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useAnimatedValue(value),
      { initialProps: { value: 0 } },
    );

    rerender({ value: 50 });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(900);
    });

    expect(result.current).toBe(50);
  });

  it("does not animate when value does not change", async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useAnimatedValue(value),
      { initialProps: { value: 25 } },
    );

    rerender({ value: 25 });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(900);
    });

    expect(result.current).toBe(25);
  });
});
