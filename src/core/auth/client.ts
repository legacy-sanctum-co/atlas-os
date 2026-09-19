import { passkeyClient } from "@better-auth/passkey/client";
import { createAuthClient } from "better-auth/react";

/**
 * Browser auth client. Only public, non-secret configuration lives here.
 * Base URL is derived from the current origin so no env is needed client-side.
 */
export const authClient = createAuthClient({
  plugins: [passkeyClient()],
});

export const { useSession } = authClient;
