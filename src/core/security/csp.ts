/**
 * Content Security Policy builder (docs/SECURITY.md).
 * Nonce-based scripts, `strict-dynamic`, no inline event handlers, no
 * external origins by default. Development needs `unsafe-eval` for React
 * Fast Refresh; production does not.
 */
export interface CspOptions {
  nonce: string;
  isDevelopment: boolean;
  /** Extra `connect-src` origins (e.g. a self-hosted telemetry collector). */
  connectSources?: readonly string[];
}

export function buildContentSecurityPolicy(options: CspOptions): string {
  const { nonce, isDevelopment, connectSources = [] } = options;

  const scriptSrc = [`'self'`, `'nonce-${nonce}'`, `'strict-dynamic'`];
  if (isDevelopment) scriptSrc.push(`'unsafe-eval'`);

  const connectSrc = [`'self'`, ...connectSources];
  if (isDevelopment) connectSrc.push("ws:", "wss:");

  const directives: Record<string, string[]> = {
    "default-src": [`'self'`],
    "script-src": scriptSrc,
    // Tailwind emits no inline styles, but Next injects style tags for
    // fonts/critical CSS; nonce-less inline styles are the accepted trade-off.
    "style-src": [`'self'`, `'unsafe-inline'`],
    "img-src": [`'self'`, "blob:", "data:"],
    "font-src": [`'self'`],
    "connect-src": connectSrc,
    "media-src": [`'self'`, "blob:"],
    "worker-src": [`'self'`, "blob:"],
    "object-src": [`'none'`],
    "base-uri": [`'self'`],
    "form-action": [`'self'`],
    "frame-ancestors": [`'none'`],
    "manifest-src": [`'self'`],
  };
  if (!isDevelopment) directives["upgrade-insecure-requests"] = [];

  return Object.entries(directives)
    .map(([name, values]) => (values.length ? `${name} ${values.join(" ")}` : name))
    .join("; ");
}
