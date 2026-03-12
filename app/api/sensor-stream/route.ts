import { sensorEmitter } from "@/lib/sensor-emitter";

export const dynamic = "force-dynamic";

export async function GET() {
  const encoder = new TextEncoder();
  let onUpdate: ((data: unknown) => void) | null = null;
  let keepAlive: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    start(controller) {
      onUpdate = (data: unknown) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
          );
        } catch {
          cleanup();
        }
      };

      sensorEmitter.on("sensor_update", onUpdate);

      keepAlive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": keepalive\n\n"));
        } catch {
          cleanup();
        }
      }, 30000);

      controller.enqueue(encoder.encode(": connected\n\n"));
    },
    cancel() {
      cleanup();
    },
  });

  function cleanup() {
    if (onUpdate) {
      sensorEmitter.removeListener("sensor_update", onUpdate);
      onUpdate = null;
    }
    if (keepAlive) {
      clearInterval(keepAlive);
      keepAlive = null;
    }
  }

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
