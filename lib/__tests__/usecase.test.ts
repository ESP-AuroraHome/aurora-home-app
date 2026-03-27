import { describe, expect, it } from "vitest";
import usecase from "../usecase";

describe("usecase", () => {
  it("returns success true with data when function resolves", async () => {
    const fn = usecase(async (_: undefined) => "hello");
    const result = await fn(undefined as undefined);
    expect(result).toEqual({ success: true, data: "hello" });
  });

  it("returns success false with error message when function throws", async () => {
    const fn = usecase(async (_: undefined) => {
      throw new Error("something went wrong");
    });
    const result = await fn(undefined as undefined);
    expect(result).toEqual({ success: false, error: "something went wrong" });
  });

  it("works with synchronous functions", async () => {
    const fn = usecase((_: undefined) => 42);
    const result = await fn(undefined as undefined);
    expect(result).toEqual({ success: true, data: 42 });
  });

  it("passes arguments to the wrapped function", async () => {
    const fn = usecase(async ({ a, b }: { a: number; b: number }) => a + b);
    const result = await fn({ a: 2, b: 3 });
    expect(result).toEqual({ success: true, data: 5 });
  });
});
