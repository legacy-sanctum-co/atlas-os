import type { Metadata } from "next";

import { requireSession } from "@/core/auth/session";
import { listPasskeys } from "@/core/auth/passkeys";
import { Pane } from "@/design/primitives/shell";

import { PasskeyManager } from "./passkey-manager";

export const metadata: Metadata = { title: "Security" };

export default async function SecurityPage() {
  const session = await requireSession();
  const passkeys = await listPasskeys(session.user.id);

  return (
    <Pane reading>
      <header className="mb-8">
        <p className="text-label">Security</p>
        <h1 className="text-display mt-2 text-2xl text-ink-1">Owner access</h1>
        <p className="mt-2 max-w-prose text-base text-ink-2">
          Registration is sealed to this account. Add a passkey so sign-in uses this device&apos;s
          authenticator instead of a password.
        </p>
      </header>

      <section aria-labelledby="passkeys" className="material-panel rounded-lg p-5">
        <h2 id="passkeys" className="text-label mb-4">
          Passkeys
        </h2>
        <PasskeyManager
          passkeys={passkeys.map((key) => ({
            id: key.id,
            name: key.name,
            deviceType: key.deviceType,
            createdAt: key.createdAt?.toISOString() ?? null,
          }))}
        />
      </section>
    </Pane>
  );
}
