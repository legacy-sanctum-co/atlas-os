/**
 * Structured logger with redaction. Prompts, memories, message contents, and
 * secrets must never reach info-level logs (docs/SECURITY.md). Redaction is
 * key-based so callers cannot forget it for known-sensitive fields.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogFields = Record<string, unknown>;

const LEVEL_ORDER: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

const SENSITIVE_KEY_PATTERN =
  /(password|secret|token|api[_-]?key|authorization|cookie|prompt|instructions|content|parts|memory|embedding|email)/i;

const REDACTED = "[redacted]";

export function redact(value: unknown, depth = 0): unknown {
  if (depth > 6) return "[depth]";
  if (Array.isArray(value)) return value.map((item) => redact(item, depth + 1));
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, inner] of Object.entries(value as Record<string, unknown>)) {
      out[key] = SENSITIVE_KEY_PATTERN.test(key) ? REDACTED : redact(inner, depth + 1);
    }
    return out;
  }
  return value;
}

export interface Logger {
  debug(message: string, fields?: LogFields): void;
  info(message: string, fields?: LogFields): void;
  warn(message: string, fields?: LogFields): void;
  error(message: string, fields?: LogFields): void;
  child(bindings: LogFields): Logger;
}

interface LoggerOptions {
  level?: LogLevel;
  sink?: (line: string) => void;
  bindings?: LogFields;
}

function resolveLevel(): LogLevel {
  const fromEnv = process.env.LOG_LEVEL;
  if (fromEnv && fromEnv in LEVEL_ORDER) return fromEnv as LogLevel;
  return process.env.NODE_ENV === "production" ? "info" : "debug";
}

export function createLogger(options: LoggerOptions = {}): Logger {
  const level = options.level ?? resolveLevel();
  const sink =
    options.sink ??
    ((line: string) => {
      // eslint-disable-next-line no-console -- the sink is the one place console is allowed
      console.log(line);
    });
  const bindings = options.bindings ?? {};

  const emit = (entryLevel: LogLevel, message: string, fields?: LogFields) => {
    if (LEVEL_ORDER[entryLevel] < LEVEL_ORDER[level]) return;
    const entry = {
      time: new Date().toISOString(),
      level: entryLevel,
      msg: message,
      ...(redact(bindings) as LogFields),
      ...(fields ? (redact(fields) as LogFields) : {}),
    };
    sink(JSON.stringify(entry));
  };

  return {
    debug: (message, fields) => emit("debug", message, fields),
    info: (message, fields) => emit("info", message, fields),
    warn: (message, fields) => emit("warn", message, fields),
    error: (message, fields) => emit("error", message, fields),
    child: (childBindings) =>
      createLogger({ level, sink, bindings: { ...bindings, ...childBindings } }),
  };
}

export const logger = createLogger();
