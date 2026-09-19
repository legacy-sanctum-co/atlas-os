import "server-only";

import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "./server";

/** Route-handler pair for `app/api/auth/[...all]/route.ts`. */
export const authHandlers = toNextJsHandler(auth.handler);
