import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import jsxA11y from "eslint-plugin-jsx-a11y";

/**
 * Module boundary rules (see .cursor/rules/architecture.mdc and ADR 0002).
 * - core never imports modules/app
 * - modules import other modules only via their public index
 * - provider SDKs are confined to src/core
 */
const boundaryRules = [
  {
    files: ["src/core/**/*.{ts,tsx}"],
    // Composition roots: the aggregated schema and the auth lifecycle are the
    // only core files permitted to reach into modules.
    ignores: ["src/core/db/schema.ts", "src/core/auth/server.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/modules/*", "@/app/*"],
              message: "core must not depend on modules or app.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/modules/**/*.{ts,tsx}", "src/app/**/*.{ts,tsx}", "src/design/**/*.{ts,tsx}"],
    ignores: ["src/modules/*/server/schema.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/modules/*/server/*", "@/modules/*/domain/*", "@/modules/*/ui/*"],
              message:
                "Import other modules only through @/modules/<name> or @/modules/<name>/domain.",
            },
            {
              group: [
                "postgres",
                "better-auth",
                "better-auth/*",
                "@better-auth/*",
                "@ai-sdk/*",
                "drizzle-orm/*-js",
                "drizzle-orm/postgres-js",
              ],
              message: "Infrastructure SDKs may only be imported inside src/core.",
            },
          ],
        },
      ],
    },
  },
];
// Convention: inside a module use relative imports for its own internals.
// Across modules use "@/modules/<name>" (server-safe public index) or
// "@/modules/<name>/domain" (client-safe types and schemas). Module schema
// files may import other modules' schema files for foreign keys.

// eslint-config-next already registers the jsx-a11y plugin; apply the full
// recommended rule set on top of it (as errors) without re-registering.
const a11yRecommended = Object.fromEntries(
  Object.entries(jsxA11y.flatConfigs.recommended.rules).map(([rule, level]) => [
    rule,
    level === "warn" ? "error" : level,
  ]),
);

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["**/*.{jsx,tsx}"],
    rules: a11yRecommended,
  },
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/consistent-type-imports": ["error", { prefer: "type-imports" }],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "no-console": ["error", { allow: ["warn", "error"] }],
    },
  },
  ...boundaryRules,
  {
    files: ["scripts/**/*.ts", "e2e/**/*.ts", "*.config.*"],
    rules: { "no-console": "off" },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "node_modules/**",
    "next-env.d.ts",
    "playwright-report/**",
    "test-results/**",
    "coverage/**",
    "drizzle/**",
  ]),
]);
