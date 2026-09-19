import { registerOTel } from "@vercel/otel";

/**
 * Next.js instrumentation hook. Registers the OpenTelemetry SDK so route
 * handlers, server actions, and (from M3) AI SDK calls emit spans. Export is
 * a no-op unless an OTLP endpoint is configured via standard
 * OTEL_EXPORTER_OTLP_* environment variables; nothing leaves the deployment
 * by default.
 */
export function register() {
  registerOTel({ serviceName: "atlas-os" });
}
