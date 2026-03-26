import { sensorEmitter } from "@/lib/sensor-emitter";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const encoder = new TextEncoder();
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();

  let keepAlive: ReturnType<typeof setInterval> | null = null;

  const onUpdate = (data: unknown) => {
    writer
      .write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      .catch(() => cleanup());
  };

  function cleanup() {
    sensorEmitter.removeListener("sensor_update", onUpdate);
    sensorEmitter.removeListener("alert_created", onUpdate);
    sensorEmitter.removeListener("alerts_auto_resolved", onUpdate);
    sensorEmitter.removeListener("warmup_complete", onUpdate);
    if (keepAlive) {
      clearInterval(keepAlive);
      keepAlive = null;
    }
    writer.close().catch(() => {});
  }

  request.signal.addEventListener("abort", () => {
    cleanup();
  });

  sensorEmitter.on("sensor_update", onUpdate);
  sensorEmitter.on("alert_created", onUpdate);
  sensorEmitter.on("alerts_auto_resolved", onUpdate);
  sensorEmitter.on("warmup_complete", onUpdate);

  keepAlive = setInterval(() => {
    writer.write(encoder.encode(": keepalive\n\n")).catch(() => cleanup());
  }, 15000);

  writer.write(encoder.encode(": connected\n\n")).catch(() => cleanup());

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
