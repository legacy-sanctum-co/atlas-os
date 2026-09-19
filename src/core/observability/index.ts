import { SpanStatusCode, trace, type Span } from "@opentelemetry/api";

export { createLogger, logger, redact, type LogFields, type Logger, type LogLevel } from "./logger";

const tracer = trace.getTracer("atlas-os");

/**
 * Wrap an operation in a span. Attribute values must already be redacted;
 * never pass prompts or message content.
 */
export async function withSpan<T>(
  name: string,
  attributes: Record<string, string | number | boolean>,
  operation: (span: Span) => Promise<T>,
): Promise<T> {
  return tracer.startActiveSpan(name, { attributes }, async (span) => {
    try {
      return await operation(span);
    } catch (error) {
      span.setStatus({ code: SpanStatusCode.ERROR });
      if (error instanceof Error)
        span.recordException({ name: error.name, message: error.message });
      throw error;
    } finally {
      span.end();
    }
  });
}
